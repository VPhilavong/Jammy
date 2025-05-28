import requests
from django.conf import settings
from .models import SpotifyToken
from datetime import datetime, timedelta
from django.utils import timezone

def get_user_tokens(session_id):
    user_tokens = SpotifyToken.objects.filter(user=session_id)
    if user_tokens.exists():
        return user_tokens[0]
    return None

def update_tokens(session_id, access_token, token_type, expires_in, refresh_token):
    tokens = get_user_tokens(session_id)
    expires_in = timezone.now() + timedelta(seconds=expires_in)

    if tokens:
        tokens.access_token = access_token
        tokens.refresh_token = refresh_token
        tokens.expires_in = expires_in
        tokens.token_type = token_type
        tokens.save(update_fields=['access_token', 'refresh_token', 'expires_in', 'token_type'])
    else:
        tokens = SpotifyToken(user=session_id, access_token=access_token, refresh_token=refresh_token, token_type=token_type, expires_in=expires_in)
        tokens.save()

def refresh_spotify_token(session_id):
    """Refresh the Spotify access token using the refresh token"""
    try:
        user_token = get_user_tokens(session_id)
        if not user_token:
            return None
        
        refresh_token = user_token.refresh_token
        
        # Spotify token refresh endpoint
        url = 'https://accounts.spotify.com/api/token'
        
        data = {
            'grant_type': 'refresh_token',
            'refresh_token': refresh_token,
        }
        
        headers = {
            'Content-Type': 'application/x-www-form-urlencoded',
        }
        
        # Use your Spotify client credentials
        auth = (settings.SPOTIFY_CLIENT_ID, settings.SPOTIFY_CLIENT_SECRET)
        
        response = requests.post(url, data=data, headers=headers, auth=auth)
        
        if response.status_code == 200:
            response_data = response.json()
            
            # Update the token in database
            user_token.access_token = response_data['access_token']
            user_token.expires_in = timezone.now() + timedelta(seconds=response_data['expires_in'])
            
            # Sometimes Spotify returns a new refresh token
            if 'refresh_token' in response_data:
                user_token.refresh_token = response_data['refresh_token']
            
            user_token.save()
            return user_token
        else:
            return None
            
    except Exception as e:
        print(f"Error refreshing token: {e}")
        return None

def get_valid_token(session_id):
    """Get a valid access token, refreshing if necessary"""
    user_token = get_user_tokens(session_id)
    if not user_token:
        return None
    
    # Check if token is expired (with 5 minute buffer)
    now = timezone.now()
    if user_token.expires_in <= now + timedelta(minutes=5):
        # Token is expired or about to expire, refresh it
        user_token = refresh_spotify_token(session_id)
    
    return user_token
