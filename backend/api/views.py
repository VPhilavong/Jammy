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

@api_view(['GET'])
def getData(request):
    items = SpotifyToken.objects.all()
    serializer = ItemSerializer(items, many = True)
    return Response(serializer.data)


# Get top tracks
@api_view(['GET'])
def top_tracks(request):
    # Input params
    access_token = spotify.get_user_tokens(request.session.session_key).access_token
    headers = {'Authorization': f'Bearer {access_token}'}
    params = {'limit': 50, 'time_range': 'short_term'}
    endpoint = 'https://api.spotify.com/v1/me/top/tracks'
    # Get top tracks
    response = requests.get(endpoint, headers=headers, params=params)
    return Response(response.json())

# Get top artist
@api_view(['GET'])
def top_artists(request):
    # Input params
    access_token = spotify.get_user_tokens(request.session.session_key).access_token
    headers = {'Authorization': f'Bearer {access_token}'}
    params = {'limit': 50, 'time_range': 'short_term'}
    endpoint = 'https://api.spotify.com/v1/me/top/artists'
    # Get top artists
    response = requests.get(endpoint, headers=headers, params=params)
    return Response(response.json())
    
@api_view(['GET'])
def top_genres(request):
    # Input parameters
    access_token = spotify.get_user_tokens(request.session.session_key).access_token
    timerange = request.GET.get('time_range', 'short_term')
    headers = {'Authorization': f'Bearer {access_token}'}
    params = {'limit': 50, 'time_range': timerange}
    # Get top artists
    response = requests.get('https://api.spotify.com/v1/me/top/artists', headers=headers, params=params)
   
    genre_count = {}
    data = response.json()

    for artist in data['items']:
            for genre in artist['genres']:
                if genre in genre_count:
                    genre_count[genre] += 1
                else:
                    genre_count[genre] = 1
    
    sorted_genres = sorted(genre_count.items(), key=lambda item: item[1], reverse=True)[:10]
    genres = {genre: index + 1 for index, (genre, count) in enumerate(sorted_genres)}
    return Response(genres)

@api_view(['GET'])
def recommendations(request):
    access_token = spotify.get_user_tokens(request.session.session_key).access_token
    headers = {'Authorization' : f'Bearer {access_token}'}
    params = {'limit': 5, 'time_range': 'short_term'}
    endpoint = 'https://api.spotify.com/v1/recommendations'
    
    # Get recommendations of the tracks
    response = requests.get(endpoint, headers=headers, params=params)
    return Response(response.json())

# Example backend endpoint (Python/Flask)
@api_view(['GET'])
def get_artist(request, artist_name):
    # Input params
    access_token = spotify.get_user_tokens(request.session.session_key).access_token
    headers = {'Authorization': f'Bearer {access_token}'}
    params = {'q': f'artist:{artist_name}', 'type': 'artist', 'limit': 1}
    endpoint = 'https://api.spotify.com/v1/search'
    
    # Search for the artist
    response = requests.get(endpoint, headers=headers, params=params)
    
    if response.status_code == 200:
        data = response.json()
        if data['artists']['items']:
            return Response(data['artists']['items'][0])
    
    return Response({"error": "Artist not found"}, status=404)

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
        
        user_token = spotify.get_user_tokens(session_key)
        if not user_token:
            return Response({"error": "No user token found"}, status=401)
        
        access_token = user_token.access_token
        headers = {'Authorization': f'Bearer {access_token}'}
        
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


