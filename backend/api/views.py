from rest_framework.response import Response
from rest_framework.decorators import api_view
from spotify.models import SpotifyToken
from .serializer import ItemSerializer
from spotify.views import *
import spotify.util as spotify
import json
import requests
from django.core.cache import cache
from django.conf import settings
import hashlib
from datetime import timedelta
from django.utils import timezone

@api_view(['GET'])
def getData(request):
    items = SpotifyToken.objects.all()
    serializer = ItemSerializer(items, many=True)
    return Response(serializer.data)

@api_view(['GET'])
def top_tracks(request):
    user_token = spotify.get_valid_token(request.session.session_key)
    if not user_token:
        return Response({"error": "No valid token found"}, status=401)
    
    headers = {'Authorization': f'Bearer {user_token.access_token}'}
    params = {'limit': 50, 'time_range': 'short_term'}
    endpoint = 'https://api.spotify.com/v1/me/top/tracks'
    
    response = requests.get(endpoint, headers=headers, params=params)
    
    if response.status_code == 200:
        data = response.json()
        return Response(data)
    else:
        return Response({"error": "Failed to fetch top tracks"}, status=response.status_code)

@api_view(['GET'])
def top_artists(request):
    user_token = spotify.get_valid_token(request.session.session_key)
    if not user_token:
        return Response({"error": "No valid token found"}, status=401)
    
    headers = {'Authorization': f'Bearer {user_token.access_token}'}
    params = {'limit': 50, 'time_range': 'short_term'}
    endpoint = 'https://api.spotify.com/v1/me/top/artists'
    
    response = requests.get(endpoint, headers=headers, params=params)
    
    if response.status_code == 200:
        data = response.json()
        return Response(data)
    else:
        return Response({"error": "Failed to fetch top artists"}, status=response.status_code)

@api_view(['GET'])
def top_genres(request):
    user_token = spotify.get_valid_token(request.session.session_key)
    if not user_token:
        return Response({"error": "No valid token found"}, status=401)
    
    headers = {'Authorization': f'Bearer {user_token.access_token}'}
    params = {'limit': 50, 'time_range': 'short_term'}
    endpoint = 'https://api.spotify.com/v1/me/top/artists'
    
    response = requests.get(endpoint, headers=headers, params=params)
    
    if response.status_code == 200:
        data = response.json()
        # Extract genres from artists
        genres = {}
        for artist in data.get('items', []):
            for genre in artist.get('genres', []):
                genres[genre] = genres.get(genre, 0) + 1
        
        # Sort by popularity and return top genres
        sorted_genres = sorted(genres.items(), key=lambda x: x[1], reverse=True)
        return Response({"genres": sorted_genres[:20]})
    else:
        return Response({"error": "Failed to fetch top genres"}, status=response.status_code)

@api_view(['GET'])
def get_artist(request, artist_name):
    user_token = spotify.get_valid_token(request.session.session_key)
    if not user_token:
        return Response({"error": "No valid token found"}, status=401)
    
    headers = {'Authorization': f'Bearer {user_token.access_token}'}
    params = {'q': f'artist:{artist_name}', 'type': 'artist', 'limit': 1}
    endpoint = 'https://api.spotify.com/v1/search'
    
    response = requests.get(endpoint, headers=headers, params=params)
    
    if response.status_code == 200:
        data = response.json()
        if data['artists']['items']:
            return Response(data['artists']['items'][0])
        else:
            return Response({"error": "Artist not found"}, status=404)
    else:
        return Response({"error": "Failed to fetch artist"}, status=response.status_code)

@api_view(['POST'])
def get_artists_bulk_cached(request):
    """Get multiple artists with Redis caching"""
    
    artist_names = request.data.get('artist_names', [])
    
    if not artist_names:
        return Response({"error": "No artist names provided"}, status=400)
    
    try:
        # Get session and token
        session_key = request.session.session_key
        if not session_key:
            request.session.save()
            session_key = request.session.session_key
        
        if not session_key:
            return Response({"error": "No session found"}, status=401)
        
        user_token = spotify.get_valid_token(session_key)
        if not user_token:
            return Response({"error": "No valid token found"}, status=401)
        
        headers = {'Authorization': f'Bearer {user_token.access_token}'}
        
        unique_artists = list(dict.fromkeys(artist_names))
        artists_data = {}
        uncached_artists = []
        
        # Check Redis cache first
        for artist_name in unique_artists:
            cache_key = f"spotify_artist:{hashlib.md5(artist_name.lower().encode()).hexdigest()}"
            cached_data = cache.get(cache_key)
            
            if cached_data:
                artists_data[artist_name] = cached_data
            else:
                uncached_artists.append(artist_name)
        
        # Fetch uncached artists from Spotify API
        if uncached_artists:
            for artist_name in uncached_artists:
                try:
                    # Search for individual artist
                    params = {
                        'q': f'artist:"{artist_name}"',
                        'type': 'artist',
                        'limit': 1
                    }
                    
                    response = requests.get('https://api.spotify.com/v1/search', 
                                          headers=headers, params=params)
                    
                    if response.status_code == 200:
                        data = response.json()
                        if data['artists']['items']:
                            artist = data['artists']['items'][0]
                            artists_data[artist_name] = artist
                            
                            # Cache in Redis for 1 hour
                            cache_key = f"spotify_artist:{hashlib.md5(artist_name.lower().encode()).hexdigest()}"
                            cache.set(cache_key, artist, getattr(settings, 'ARTIST_CACHE_TIMEOUT', 3600))
                    
                except Exception as e:
                    # If individual artist fails, continue with others
                    continue
        
        return Response(artists_data)
        
    except Exception as e:
        return Response({"error": str(e)}, status=500)

@api_view(['GET'])
def test_redis(request):
    """Test Redis connection"""
    try:
        # Test setting and getting a value
        cache.set('test_key', 'test_value', 30)
        value = cache.get('test_key')
        return Response({"redis_working": value == 'test_value', "value": value})
    except Exception as e:
        return Response({"redis_working": False, "error": str(e)})


