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
import re
from textblob import TextBlob
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
import os
from bs4 import BeautifulSoup

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

##### GENIUS API FUNCTIONS #####

GENIUS_ACCESS_TOKEN = os.getenv('GENIUS_ACCESS_TOKEN')

@api_view(['GET'])
def analyze_track_mood(request, track_id):
    """Combine Spotify audio features with lyrics sentiment analysis"""
    try:
        user_token = spotify.get_valid_token(request.session.session_key)
        if not user_token:
            return Response({"error": "No valid token found"}, status=401)
        
        # Check cache first
        cache_key = f"track_mood:{track_id}"
        cached_data = cache.get(cache_key)
        if cached_data:
            return Response(cached_data)
        
        headers = {'Authorization': f'Bearer {user_token.access_token}'}
        
        # Get Spotify track info
        track_response = requests.get(f'https://api.spotify.com/v1/tracks/{track_id}', headers=headers)
        if track_response.status_code != 200:
            return Response({"error": "Failed to fetch track"}, status=track_response.status_code)
        
        track_data = track_response.json()
        
        # Get audio features - with better error handling
        audio_features_response = requests.get(f'https://api.spotify.com/v1/audio-features/{track_id}', headers=headers)
        
        if audio_features_response.status_code == 200:
            audio_features = audio_features_response.json()
            # Check if audio features are null (some tracks don't have them)
            if audio_features is None:
                audio_features = {}
                print(f"Audio features returned null for track {track_id}")
        else:
            audio_features = {}
            print(f"Audio features failed: {audio_features_response.status_code}, {audio_features_response.text}")
        
        # Get lyrics from Genius
        lyrics_data = get_genius_lyrics(track_data['name'], track_data['artists'][0]['name'])
        
        # Analyze sentiment
        sentiment_analysis = analyze_lyrics_sentiment(lyrics_data.get('lyrics', ''))
        
        # Calculate composite mood
        composite_mood = calculate_composite_mood(audio_features, sentiment_analysis)
        
        result = {
            "track_info": {
                "name": track_data['name'],
                "artist": track_data['artists'][0]['name'],
                "album": track_data['album']['name'],
                "duration_ms": track_data['duration_ms']
            },
            "audio_features": audio_features,  # Return the actual response
            "lyrics_analysis": sentiment_analysis,
            "composite_mood": composite_mood,
            "genius_data": lyrics_data
        }
        
        # Cache for 24 hours
        cache.set(cache_key, result, 86400)
        
        return Response(result)
        
    except Exception as e:
        return Response({"error": str(e)}, status=500)

def get_genius_lyrics(track_name, artist_name):
    """Fetch lyrics using direct Genius API calls instead of lyricsgenius library"""
    try:
        if not GENIUS_ACCESS_TOKEN:
            return {"error": "No Genius API token configured", "lyrics": ""}
        
        headers = {'Authorization': f'Bearer {GENIUS_ACCESS_TOKEN}'}
        
        # Search for the song using direct API
        search_params = {'q': f'{track_name} {artist_name}'}
        search_response = requests.get('https://api.genius.com/search', 
                                     headers=headers, 
                                     params=search_params,
                                     timeout=15)
        
        if search_response.status_code != 200:
            return {"error": f"Search failed: {search_response.status_code}", "lyrics": ""}
        
        search_data = search_response.json()
        hits = search_data.get('response', {}).get('hits', [])
        
        if not hits:
            return {"error": "No songs found", "lyrics": ""}
        
        # Get the first (most relevant) hit
        song_info = hits[0]['result']
        
        # Get song details
        song_id = song_info['id']
        song_url = f'https://api.genius.com/songs/{song_id}'
        song_response = requests.get(song_url, headers=headers, timeout=15)
        
        if song_response.status_code != 200:
            return {"error": f"Song details failed: {song_response.status_code}", "lyrics": ""}
        
        song_data = song_response.json()
        song_details = song_data.get('response', {}).get('song', {})
        
        # Try to get lyrics from the page URL (requires web scraping)
        lyrics_url = song_details.get('url', '')
        lyrics_text = ""
        
        if lyrics_url:
            try:
                # Basic web scraping to get lyrics
                
                page_response = requests.get(lyrics_url, timeout=10)
                if page_response.status_code == 200:
                    soup = BeautifulSoup(page_response.content, 'html.parser')
                    
                    # Try different selectors for lyrics
                    lyrics_containers = [
                        'div[data-lyrics-container="true"]',
                        '.lyrics',
                        '[class*="Lyrics__Container"]',
                        '[class*="lyrics"]'
                    ]
                    
                    for selector in lyrics_containers:
                        lyrics_divs = soup.select(selector)
                        if lyrics_divs:
                            lyrics_text = '\n'.join([div.get_text() for div in lyrics_divs])
                            break
                    
                    if not lyrics_text:
                        # Fallback: look for any div containing lyrics-like content
                        for div in soup.find_all('div'):
                            text = div.get_text().strip()
                            if len(text) > 100 and '\n' in text:  # Likely lyrics
                                lyrics_text = text
                                break
                        
            except Exception as scrape_error:
                print(f"Scraping error: {scrape_error}")
        
        return {
            "genius_id": song_details.get('id'),
            "title": song_details.get('title'),
            "artist": song_details.get('primary_artist', {}).get('name'),
            "url": lyrics_url,
            "lyrics": lyrics_text,
            "annotation_count": song_details.get('annotation_count', 0),
            "method": "direct_api_with_scraping"
        }
        
    except Exception as e:
        error_msg = str(e)
        print(f"Genius API error: {error_msg}")
        return {"error": f"Lyrics fetch failed: {error_msg}", "lyrics": ""}

def analyze_lyrics_sentiment(lyrics):
    """Analyze lyrics sentiment using multiple methods"""
    if not lyrics or lyrics == "Sample lyrics for analysis" or lyrics == "":
        return {
            "textblob_sentiment": {"polarity": 0, "subjectivity": 0},
            "vader_sentiment": {"compound": 0, "positive": 0, "negative": 0, "neutral": 1},
            "emotion_classification": "neutral",
            "lyrical_themes": []
        }
    
    # Clean lyrics
    cleaned_lyrics = clean_lyrics(lyrics)
    
    # TextBlob analysis
    blob = TextBlob(cleaned_lyrics)
    textblob_sentiment = {
        "polarity": blob.sentiment.polarity,  # -1 to 1
        "subjectivity": blob.sentiment.subjectivity  # 0 to 1
    }
    
    # VADER analysis
    analyzer = SentimentIntensityAnalyzer()
    vader_scores = analyzer.polarity_scores(cleaned_lyrics)
    
    # Simple emotion classification
    emotion = classify_emotion(textblob_sentiment['polarity'], vader_scores['compound'])
    
    # Extract themes
    themes = extract_lyrical_themes(cleaned_lyrics)
    
    return {
        "textblob_sentiment": textblob_sentiment,
        "vader_sentiment": vader_scores,
        "emotion_classification": emotion,
        "lyrical_themes": themes,
        "word_count": len(cleaned_lyrics.split()),
        "unique_words": len(set(cleaned_lyrics.lower().split()))
    }

def clean_lyrics(lyrics):
    """Clean lyrics text for analysis"""
    lyrics = re.sub(r'\[.*?\]', '', lyrics)
    lyrics = ' '.join(lyrics.split())
    return lyrics

def classify_emotion(polarity, compound):
    """Classify emotion based on sentiment scores"""
    if compound >= 0.5:
        return "joy"
    elif compound <= -0.5:
        return "sadness"
    elif polarity > 0.1:
        return "positive"
    elif polarity < -0.1:
        return "negative"
    else:
        return "neutral"

def extract_lyrical_themes(lyrics):
    """Extract themes from lyrics using keyword matching"""
    themes = []
    lyrics_lower = lyrics.lower()
    
    theme_keywords = {
        "love": ["love", "heart", "romance", "kiss", "forever", "together"],
        "sadness": ["sad", "cry", "tears", "pain", "hurt", "alone", "lonely"],
        "party": ["party", "dance", "club", "night", "fun", "celebrate"],
        "rebellion": ["fight", "rebel", "against", "break", "freedom", "revolution"],
        "nostalgia": ["remember", "past", "yesterday", "memories", "young", "time"]
    }
    
    for theme, keywords in theme_keywords.items():
        if any(keyword in lyrics_lower for keyword in keywords):
            themes.append(theme)
    
    return themes

def calculate_composite_mood(audio_features, sentiment_analysis):
    """Calculate composite mood score combining audio and lyrics"""
    # Check if audio features exist and have the required properties
    if not audio_features or not isinstance(audio_features, dict) or len(audio_features) == 0:
        # Return lyrics-only analysis when no audio features available
        lyrical_polarity = sentiment_analysis['textblob_sentiment']['polarity']
        vader_compound = sentiment_analysis['vader_sentiment']['compound']
        
        normalized_polarity = (lyrical_polarity + 1) / 2
        normalized_vader = (vader_compound + 1) / 2
        
        # Base mood only on lyrics when audio features unavailable
        happiness_score = (normalized_polarity * 0.5 + normalized_vader * 0.5)
        
        if happiness_score > 0.7:
            mood_category = "positive"
        elif happiness_score < 0.3:
            mood_category = "negative"
        else:
            mood_category = "neutral"
        
        return {
            "happiness_score": round(happiness_score, 3),
            "energy_score": None,
            "mood_category": mood_category,
            "audio_contribution": None,
            "lyrics_contribution": {
                "polarity": lyrical_polarity,
                "vader_compound": vader_compound
            },
            "note": "Audio features not available - analysis based on lyrics only"
        }
    
    # Extract key audio features with defaults
    valence = audio_features.get('valence', 0.5)
    energy = audio_features.get('energy', 0.5)
    danceability = audio_features.get('danceability', 0.5)
    
    # Check if values are None (some tracks return null values)
    if valence is None:
        valence = 0.5
    if energy is None:
        energy = 0.5
    if danceability is None:
        danceability = 0.5
    
    # Extract sentiment scores
    lyrical_polarity = sentiment_analysis['textblob_sentiment']['polarity']
    vader_compound = sentiment_analysis['vader_sentiment']['compound']
    
    # Normalize lyrical sentiment to 0-1 scale
    normalized_polarity = (lyrical_polarity + 1) / 2
    normalized_vader = (vader_compound + 1) / 2
    
    # Calculate composite scores
    happiness_score = (valence * 0.4 + normalized_polarity * 0.3 + normalized_vader * 0.3)
    energy_score = (energy * 0.6 + danceability * 0.4)
    
    # Determine overall mood category
    if happiness_score > 0.7 and energy_score > 0.7:
        mood_category = "energetic_happy"
    elif happiness_score > 0.7 and energy_score < 0.3:
        mood_category = "peaceful_happy"
    elif happiness_score < 0.3 and energy_score > 0.7:
        mood_category = "energetic_sad"
    elif happiness_score < 0.3 and energy_score < 0.3:
        mood_category = "melancholic"
    else:
        mood_category = "neutral"
    
    return {
        "happiness_score": round(happiness_score, 3),
        "energy_score": round(energy_score, 3),
        "mood_category": mood_category,
        "audio_contribution": {
            "valence": valence,
            "energy": energy,
            "danceability": danceability
        },
        "lyrics_contribution": {
            "polarity": lyrical_polarity,
            "vader_compound": vader_compound
        }
    }

@api_view(['GET'])
def test_genius_token(request):
    """Test if Genius API token is working"""
    try:
        genius_headers = {'Authorization': f'Bearer {GENIUS_ACCESS_TOKEN}'}
        
        # Simple search to test token
        response = requests.get('https://api.genius.com/search', 
                               headers=genius_headers, 
                               params={'q': 'taylor swift'})
        
        return Response({
            "status_code": response.status_code,
            "token_present": bool(GENIUS_ACCESS_TOKEN),
            "token_value": GENIUS_ACCESS_TOKEN[:10] + "..." if GENIUS_ACCESS_TOKEN else "None",
            "response_data": response.json() if response.status_code == 200 else response.text
        })
        
    except Exception as e:
        return Response({"error": str(e)})
