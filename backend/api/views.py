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
    use_wikipedia = request.GET.get('use_wikipedia', 'true').lower() == 'true'
    
    # Create cache key
    cache_key = f"top_artists:{request.session.session_key}:{time_range}:{limit}:{use_wikipedia}"
    
    # Check cache first
    cached_data = cache.get(cache_key)
    if cached_data:
        return Response(cached_data)
    
    time_range = request.GET.get('time_range', 'medium_term')
    headers = {'Authorization': f'Bearer {user_token.access_token}'}
    params = {'limit': limit, 'time_range': time_range}
    endpoint = 'https://api.spotify.com/v1/me/top/artists'
    
    response = requests.get(endpoint, headers=headers, params=params)
    
    if response.status_code == 200:
        data = response.json()
        
        # If Wikipedia integration is enabled, enhance artist data with Wikipedia genres
        if use_wikipedia:
            service = WikipediaGenreService()
            
            for artist in data.get('items', []):
                artist_name = artist.get('name')
                spotify_genres = artist.get('genres', [])
                
                try:
                    # Check if we have this artist in our database with genres
                    db_artist = Artist.objects.filter(name__iexact=artist_name).first()
                    
                    if db_artist and db_artist.genres.exists():
                        wiki_genres = [g.name for g in db_artist.genres.all()]
                    else:
                        # Try to fetch from Wikipedia
                        wiki_genres = service.get_artist_genres(artist_name)
                        
                        # Store in database if we found genres
                        if wiki_genres:
                            if not db_artist:
                                db_artist = Artist.objects.create(
                                    name=artist_name,
                                    spotify_id=artist.get('id')
                                )
                            service._store_genres(db_artist, wiki_genres)
                    
                    # Replace or supplement Spotify genres with Wikipedia genres
                    if wiki_genres:
                        artist['genres'] = wiki_genres  # Replace with Wikipedia genres
                        artist['spotify_genres'] = spotify_genres  # Keep original Spotify genres for reference
                        artist['genre_source'] = 'wikipedia'
                    else:
                        artist['genre_source'] = 'spotify'  # Fallback to Spotify genres
                
                except Exception as e:
                    print(f"Failed to get Wikipedia genres for {artist_name}: {e}")
                    artist['genre_source'] = 'spotify'  # Keep Spotify genres on error
                    continue
        else:
            # Add source indicator for Spotify-only data
            for artist in data.get('items', []):
                artist['genre_source'] = 'spotify'
        
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
    time_range = request.GET.get('time_range', 'medium_term')
    limit = int(request.GET.get('limit', 50))
    use_wikipedia = request.GET.get('use_wikipedia', 'true').lower() == 'true'
    
    # Create cache key based on user session and parameters
    cache_key = f"top_genres_enhanced:{request.session.session_key}:{time_range}:{limit}:{use_wikipedia}"
    
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
        spotify_genres = {}
        wikipedia_genres = {}
        combined_genres = {}
        artist_genre_map = {}
        
        # Initialize Wikipedia service for normalization
        if use_wikipedia:
            service = WikipediaGenreService()
        
        # Process Spotify genres
        for artist in data.get('items', []):
            artist_name = artist.get('name')
            artist_spotify_genres = artist.get('genres', [])
            
            # Store artist -> genres mapping (keep original case for display)
            artist_genre_map[artist_name] = {
                'spotify_genres': artist_spotify_genres,
                'wikipedia_genres': [],
                'spotify_id': artist.get('id'),
                'popularity': artist.get('popularity', 0)
            }
            
            # Count Spotify genres
            for genre in artist_spotify_genres:
                spotify_genres[genre] = spotify_genres.get(genre, 0) + 1
                # Combine by lowercase key
                genre_lower = genre.lower()
                combined_genres[genre_lower] = combined_genres.get(genre_lower, 0) + 1
        
        # If Wikipedia integration is enabled, get Wikipedia genres
        if use_wikipedia:
            for artist in data.get('items', []):
                artist_name = artist.get('name')
                
                try:
                    # Check if we have this artist in our database with genres
                    db_artist = Artist.objects.filter(name__iexact=artist_name).first()
                    
                    if db_artist and db_artist.genres.exists():
                        wiki_genres = [g.name for g in db_artist.genres.all()]
                    else:
                        # Try to fetch from Wikipedia
                        wiki_genres = service.get_artist_genres(artist_name)
                        
                        # Store in database if we found genres
                        if wiki_genres:
                            if not db_artist:
                                db_artist = Artist.objects.create(
                                    name=artist_name,
                                    spotify_id=artist.get('id')
                                )
                            service._store_genres(db_artist, wiki_genres)
                    
                    # Update our tracking
                    if wiki_genres:
                        artist_genre_map[artist_name]['wikipedia_genres'] = wiki_genres
                        
                        # Count Wikipedia genres
                        for genre in wiki_genres:
                            wikipedia_genres[genre] = wikipedia_genres.get(genre, 0) + 1
                            # Combine by lowercase key
                            genre_lower = genre.lower()
                            combined_genres[genre_lower] = combined_genres.get(genre_lower, 0) + 1
                
                except Exception as e:
                    print(f"Failed to get Wikipedia genres for {artist_name}: {e}")
                    continue
        
        # Sort genres by frequency - use combined genres for frontend compatibility
        sorted_combined_genres = sorted(combined_genres.items(), key=lambda x: x[1], reverse=True)
        
        # Format response to match frontend expectations
        response_data = {
            "genres": sorted_combined_genres,  # Frontend expects this key
            "time_range": time_range,
            "total_unique_genres": len(sorted_combined_genres),
            "total_artists_analyzed": len(data.get('items', [])),
            # Keep additional data for debugging/future use
            "spotify_genres": sorted(spotify_genres.items(), key=lambda x: x[1], reverse=True),
            "wikipedia_genres": sorted(wikipedia_genres.items(), key=lambda x: x[1], reverse=True),
        }
        
        # Cache for 30 minutes
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
    """Debug Wikipedia genre fetching for an artist"""
    try:
        from music.services import WikipediaGenreService
        
        service = WikipediaGenreService()
        
        # Get search results
        search_results = service._search_artist(artist_name)
        
        debug_info = {
            'artist_searched': artist_name,
            'search_results': search_results,
            'search_results_count': len(search_results)
        }
        
        if search_results:
            # Use the first result
            selected_page = search_results[0]['title']
            debug_info['selected_page'] = selected_page
            
            # Extract genres using the actual service method (this will follow redirects and use your filtering)
            extracted_genres = service._extract_genres_from_page(selected_page)
            
            debug_info.update({
                'extracted_genres': extracted_genres,
                'genres_count': len(extracted_genres)
            })
            
            # Also test the full get_artist_genres method
            full_result = service.get_artist_genres(artist_name)
            debug_info['full_service_result'] = full_result
            
        else:
            debug_info['error'] = 'No search results found'
        
        return Response(debug_info)
        
    except Exception as e:
        return Response({'error': str(e)})

@api_view(['GET'])
def debug_genre_extraction(request, artist_name):
    """Debug just the genre extraction part"""
    try:
        from music.services import WikipediaGenreService
        
        service = WikipediaGenreService()
        
        # Use the actual service methods instead of manual extraction
        search_results = service._search_artist(artist_name)
        
        if not search_results:
            return Response({'error': 'No search results'})
        
        page_title = search_results[0]['title']
        
        # Test each step of the process
        debug_info = {
            'page_title': page_title,
            'search_results': search_results
        }
        
        # Test the extraction using your updated service
        extracted_genres = service._extract_genres_from_page(page_title)
        debug_info['extracted_genres'] = extracted_genres
        
        # Test the full pipeline
        full_result = service.get_artist_genres(artist_name)
        debug_info['full_service_result'] = full_result
        
        return Response(debug_info)
        
    except Exception as e:
        return Response({'error': str(e)})
    
@api_view(['POST'])
def clear_cache(request):
    """Clear all cache"""
    try:
        cache.clear()
        return Response({'message': 'Cache cleared successfully'})
    except Exception as e:
        return Response({'error': str(e)}, status=500)