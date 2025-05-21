from rest_framework.response import Response
from rest_framework.decorators import api_view
from spotify.models import SpotifyToken
from .serializer import ItemSerializer
from spotify.views import *
import spotify.util as spotify
import json

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
    params = {'limit': 5, 'time_range': 'short_term'}
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
    params = {'limit': 5, 'time_range': 'short_term'}
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


