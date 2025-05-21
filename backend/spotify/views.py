import base64
import requests
from django.shortcuts import redirect
from rest_framework.response import Response
from rest_framework.decorators import api_view
from urllib.parse import urlencode
import random, string
import os
from django.utils import timezone
from datetime import timedelta
from .models import SpotifyToken

# Spotify API credentials
CLIENT_ID = os.getenv('SPOTIFY_CLIENT_ID')
CLIENT_SECRET = os.getenv('SPOTIFY_CLIENT_SECRET')
REDIRECT_URI = os.getenv('SPOTIFY_REDIRECT_URI')

# login endpoint

@api_view(['GET'])
def login(request):
    state = ''.join(random.choices(string.ascii_letters + string.digits, k=16))

    scope = ['user-top-read',
              'user-library-read',
              'user-read-recently-played',
              'user-read-currently-playing',
              'playlist-modify-public',
              ]

    auth_url = "https://accounts.spotify.com/authorize?" + urlencode({
        'response_type': 'code',
        'client_id': CLIENT_ID,
        'scope': ' '.join(scope),
        'redirect_uri': REDIRECT_URI,
        'state': state
    })
    return redirect(auth_url)


@api_view(['GET'])
def callback(request):
    """
    Handles the Spotify authentication callback, exchanges the authorization code for an access token.
    """
    code = request.GET.get('code')
    state = request.GET.get('state')

    if state is None:
        return redirect('/#' + urlencode({'error': 'state_mismatch'}))

    # Ensure session is created
    if not request.session.session_key:
        request.session.create()
    
    user_session_key = request.session.session_key

    auth_options = {
        'url': 'https://accounts.spotify.com/api/token',
        'data': {
            'code': code,
            'redirect_uri': REDIRECT_URI,
            'grant_type': 'authorization_code'
        },
        'headers': {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': 'Basic ' + base64.b64encode(f"{CLIENT_ID}:{CLIENT_SECRET}".encode()).decode()
        }
    }

    response = requests.post(auth_options['url'], data=auth_options['data'], headers=auth_options['headers'])
    # Setting Up
    if response.status_code == 200:
        response_data = response.json()
        
        # Calculate token expiry time
        expires_in = timezone.now() + timedelta(seconds=response_data.get('expires_in'))
        
        # Get or update token in database using the session key
        token, created = SpotifyToken.objects.update_or_create(
            user=user_session_key,  # Use the stored session key
            defaults={
                'access_token': response_data.get('access_token'),
                'token_type': response_data.get('token_type'),
                'refresh_token': response_data.get('refresh_token'),
                'expires_in': expires_in
            }
        )
        
        # Store access token in session for easy access
        request.session['spotify_token'] = response_data.get('access_token')
        
        # Redirect to frontend or success page
        return redirect('http://localhost:8000/top_tracks')
    
    # Handle error case
    return redirect('/#' + urlencode({'error': 'invalid_token'}))