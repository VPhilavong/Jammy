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
from music.models import Artist, Genre, ArtistGenre
from music.services import WikipediaGenreService

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
    
    # Get time_range from query params, default to medium_term
    time_range = request.GET.get('time_range', 'medium_term')  # short_term, medium_term, long_term
    limit = int(request.GET.get('limit', 50))
    
    # Create cache key
    cache_key = f"top_tracks:{request.session.session_key}:{time_range}:{limit}"
    
    # Check cache first
    cached_data = cache.get(cache_key)
    if cached_data:
        return Response(cached_data)
    
    headers = {'Authorization': f'Bearer {user_token.access_token}'}
    params = {'limit': limit, 'time_range': time_range}
    endpoint = 'https://api.spotify.com/v1/me/top/tracks'
    
    response = requests.get(endpoint, headers=headers, params=params)
    
    if response.status_code == 200:
        data = response.json()
        
        # Cache for 30 minutes
        cache.set(cache_key, data, getattr(settings, 'TRACKS_CACHE_TIMEOUT', 1800))
        
        return Response(data)
    else:
        return Response({"error": "Failed to fetch top tracks"}, status=response.status_code)

@api_view(['GET'])
def top_artists(request):
    user_token = spotify.get_valid_token(request.session.session_key)
    if not user_token:
        return Response({"error": "No valid token found"}, status=401)
    
    # Get time_range from query params, default to medium_term
    time_range = request.GET.get('time_range', 'medium_term')  # short_term, medium_term, long_term
    limit = int(request.GET.get('limit', 50))
    
    # Create cache key
    cache_key = f"top_artists:{request.session.session_key}:{time_range}:{limit}"
    
    # Check cache first
    cached_data = cache.get(cache_key)
    if cached_data:
        return Response(cached_data)
    
    headers = {'Authorization': f'Bearer {user_token.access_token}'}
    params = {'limit': limit, 'time_range': time_range}
    endpoint = 'https://api.spotify.com/v1/me/top/artists'
    
    response = requests.get(endpoint, headers=headers, params=params)
    
    if response.status_code == 200:
        data = response.json()
        
        # Cache for 30 minutes
        cache.set(cache_key, data, getattr(settings, 'ARTISTS_CACHE_TIMEOUT', 1800))
        
        return Response(data)
    else:
        return Response({"error": "Failed to fetch top artists"}, status=response.status_code)

@api_view(['GET'])
def top_genres(request):
    user_token = spotify.get_valid_token(request.session.session_key)
    if not user_token:
        return Response({"error": "No valid token found"}, status=401)
    
    # Get time_range from query params, default to medium_term
    time_range = request.GET.get('time_range', 'medium_term')  # short_term, medium_term, long_term
    limit = int(request.GET.get('limit', 50))
    
    # Create cache key based on user session and parameters
    cache_key = f"top_genres:{request.session.session_key}:{time_range}:{limit}"
    
    # Check cache first
    cached_data = cache.get(cache_key)
    if cached_data:
        return Response(cached_data)
    
    headers = {'Authorization': f'Bearer {user_token.access_token}'}
    params = {'limit': limit, 'time_range': time_range}
    endpoint = 'https://api.spotify.com/v1/me/top/artists'
    
    response = requests.get(endpoint, headers=headers, params=params)
    
    if response.status_code == 200:
        data = response.json()
        genres = {}
        for artist in data.get('items', []):
            for genre in artist.get('genres', []):
                genres[genre] = genres.get(genre, 0) + 1
        
        sorted_genres = sorted(genres.items(), key=lambda x: x[1], reverse=True)
        
        response_data = {
            "genres": sorted_genres,  # Return all genres, not just [:20]
            "time_range": time_range,
            "total_unique_genres": len(sorted_genres),
            "total_artists_analyzed": len(data.get('items', []))
        }
        
        # Cache for 30 minutes (genres don't change that frequently)
        cache.set(cache_key, response_data, getattr(settings, 'GENRES_CACHE_TIMEOUT', 1800))
        
        return Response(response_data)
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

@api_view(['POST'])
def create_test_artists(request):
    """Create test artists for testing"""
    test_artists = [
        "Taylor Swift",
        "Drake", 
        "The Beatles",
        "Kanye West",
        "Beyoncé",
        "Ed Sheeran",
        "Ariana Grande"
    ]
    
    created_artists = []
    for artist_name in test_artists:
        artist, created = Artist.objects.get_or_create(name=artist_name)
        if created:
            created_artists.append(artist.name)
    
    return Response({
        'message': f'Created {len(created_artists)} new artists',
        'created_artists': created_artists,
        'total_artists': Artist.objects.count()
    })

@api_view(['POST'])
def fetch_genres_for_artist(request, artist_id):
    """Fetch genres for a specific artist"""
    try:
        artist = Artist.objects.get(id=artist_id)
        service = WikipediaGenreService()
        genres = service.fetch_and_store_artist_genres(artist_id)
        
        # Get the stored genres
        artist_genres = artist.genres.all()
        
        return Response({
            'artist': artist.name,
            'fetched_genres': genres,
            'stored_genres': [g.name for g in artist_genres],
            'success': True
        })
    except Artist.DoesNotExist:
        return Response({
            'error': 'Artist not found',
            'success': False
        }, status=404)
    except Exception as e:
        return Response({
            'error': str(e),
            'success': False
        }, status=500)

@api_view(['POST'])
def fetch_all_genres(request):
    """Fetch genres for all artists without genres"""
    try:
        batch_size = request.data.get('batch_size', 5)
        artists_without_genres = Artist.objects.filter(
            artistgenre__isnull=True
        ).distinct()[:batch_size]
        
        service = WikipediaGenreService()
        results = []
        
        for artist in artists_without_genres:
            genres = service.fetch_and_store_artist_genres(artist.id)
            results.append({
                'artist': artist.name,
                'genres_found': len(genres),
                'genres': genres
            })
        
        return Response({
            'processed_artists': len(results),
            'results': results,
            'success': True
        })
    except Exception as e:
        return Response({
            'error': str(e),
            'success': False
        }, status=500)

@api_view(['GET'])
def list_artists_with_genres(request):
    """List all artists with their genres"""
    artists = Artist.objects.prefetch_related('genres').all()
    
    data = []
    for artist in artists:
        data.append({
            'id': artist.id,
            'name': artist.name,
            'genres': [g.name for g in artist.genres.all()],
            'genre_count': artist.genres.count()
        })
    
    return Response({
        'total_artists': len(data),
        'artists': data
    })

@api_view(['GET'])
def music_stats(request):
    """Get statistics about artists and genres"""
    total_artists = Artist.objects.count()
    artists_with_genres = Artist.objects.filter(genres__isnull=False).distinct().count()
    artists_without_genres = total_artists - artists_with_genres
    total_genres = Genre.objects.count()
    
    return Response({
        'total_artists': total_artists,
        'artists_with_genres': artists_with_genres,
        'artists_without_genres': artists_without_genres,
        'total_genres': total_genres,
        'genre_coverage': f"{(artists_with_genres/total_artists*100):.1f}%" if total_artists > 0 else "0%"
    })

# Replace or add this more detailed debug view

@api_view(['GET'])
def debug_wikipedia(request, artist_name):
    """Debug Wikipedia API for a specific artist"""
    import re
    
    try:
        from music.services import WikipediaGenreService
        service = WikipediaGenreService()
        
        # Test the search
        search_results = service._search_artist(artist_name)
        
        debug_info = {
            'artist_searched': artist_name,
            'search_results': search_results,
            'search_results_count': len(search_results)
        }
        
        # If we have results, get the raw page content to debug
        if search_results:
            first_result = search_results[0]
            page_title = first_result['title']
            
            # Get raw page content
            params = {
                'action': 'query',
                'format': 'json',
                'prop': 'revisions',
                'rvprop': 'content',
                'rvslots': 'main',
                'titles': page_title
            }
            
            response = requests.get('https://en.wikipedia.org/w/api.php', params=params, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                pages = data['query']['pages']
                page = list(pages.values())[0]
                
                if 'revisions' in page:
                    content = page['revisions'][0]['slots']['main']['*']
                    
                    # Look for genre patterns in the content
                    genre_patterns = [
                        r'\|\s*genre\s*=\s*([^\n\|]+)',
                        r'\|\s*genres\s*=\s*([^\n\|]+)',
                        r'\|\s*style\s*=\s*([^\n\|]+)',
                        r'\|\s*musical_style\s*=\s*([^\n\|]+)'
                    ]
                    
                    found_matches = []
                    for pattern in genre_patterns:
                        matches = re.finditer(pattern, content, re.IGNORECASE)
                        for match in matches:
                            found_matches.append({
                                'pattern': pattern,
                                'match': match.group(0),
                                'genre_text': match.group(1)
                            })
                    
                    debug_info.update({
                        'selected_page': page_title,
                        'content_length': len(content),
                        'content_preview': content[:1000] + '...' if len(content) > 1000 else content,
                        'genre_matches': found_matches,
                        'infobox_found': '{{Infobox' in content,
                        'has_genre_field': any(word in content.lower() for word in ['|genre', '|genres', '|style'])
                    })
                    
                    # Try the actual extraction
                    try:
                        genres = service._extract_genres_from_page(page_title)
                        debug_info.update({
                            'extracted_genres': genres,
                            'genres_count': len(genres)
                        })
                    except Exception as e:
                        debug_info['extraction_error'] = str(e)
        
        return Response(debug_info)
        
    except Exception as e:
        return Response({
            'error': str(e),
            'artist': artist_name
        }, status=500)

@api_view(['GET'])
def debug_genre_extraction(request, artist_name):
    """Debug just the genre extraction part"""
    try:
        from music.services import WikipediaGenreService
        import requests
        import re
        
        service = WikipediaGenreService()
        search_results = service._search_artist(artist_name)
        
        if not search_results:
            return Response({'error': 'No search results'})
        
        page_title = search_results[0]['title']
        
        # Get page content
        params = {
            'action': 'query',
            'format': 'json',
            'prop': 'revisions',
            'rvprop': 'content',
            'rvslots': 'main',
            'titles': page_title
        }
        
        response = requests.get('https://en.wikipedia.org/w/api.php', params=params, timeout=10)
        data = response.json()
        pages = data['query']['pages']
        page = list(pages.values())[0]
        content = page['revisions'][0]['slots']['main']['*']
        
        # Extract genre field specifically
        genre_field_pattern = r'\|\s*genre\s*=\s*(.*?)(?=\n\s*\||\n\}\}|\Z)'
        match = re.search(genre_field_pattern, content, re.IGNORECASE | re.DOTALL)
        
        debug_info = {
            'page_title': page_title,
            'genre_field_found': bool(match),
        }
        
        if match:
            raw_genre_content = match.group(1)
            debug_info.update({
                'raw_genre_content': raw_genre_content[:500],  # First 500 chars
                'raw_genre_length': len(raw_genre_content)
            })
            
            # Test the cleaning process
            cleaned_genres = service._clean_genre_text(raw_genre_content)
            debug_info.update({
                'cleaned_genres': cleaned_genres,
                'final_result': service.get_artist_genres(artist_name)
            })
        
        return Response(debug_info)
        
    except Exception as e:
        return Response({'error': str(e)})