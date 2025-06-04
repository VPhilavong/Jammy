import requests
import re
import logging
from typing import List, Optional
from django.db import transaction
from .models import Artist, Genre, ArtistGenre
import spacy
from transformers import pipeline

logger = logging.getLogger(__name__)

class WikipediaGenreService:
    def __init__(self):
        self.base_url = 'https://en.wikipedia.org/w/api.php'
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Jammy/1.0 (https://your-domain.com; your-email@example.com)'
        })
        
        # Initialize NLP models (lazy loading)
        self._nlp = None
        self._classifier = None
    
    def fetch_and_store_artist_genres(self, artist_id: int) -> List[str]:
        """Fetch genres from Wikipedia and store them for an artist."""
        try:
            artist = Artist.objects.get(id=artist_id)
            genres = self.get_artist_genres(artist.name)
            
            if genres:
                self._store_genres(artist, genres)
                logger.info(f"Stored {len(genres)} genres for {artist.name}")
            
            return genres
        except Artist.DoesNotExist:
            logger.error(f"Artist with id {artist_id} not found")
            return []
        except Exception as e:
            logger.error(f"Error processing artist {artist_id}: {str(e)}")
            return []
    
    # Replace the get_artist_genres method with this enhanced version

    def get_artist_genres(self, artist_name: str) -> List[str]:
        """Get genres for an artist from Wikipedia with comprehensive fallback strategies."""
        try:
            # Clean the artist name first
            clean_name = artist_name.strip()
            
            # Strategy 1: Direct search
            search_results = self._search_artist(clean_name)
            if search_results:
                for result in search_results:
                    genres = self._extract_genres_from_page(result['title'])
                    if genres:
                        logger.info(f"Found genres for {artist_name} via direct search: {genres}")
                        return genres
            
            # Strategy 2: Search variations with different terms
            search_variations = [
                f"{clean_name} musician",
                f"{clean_name} singer", 
                f"{clean_name} band",
                f"{clean_name} rapper",
                f"{clean_name} artist"
            ]
            
            for variation in search_variations:
                search_results = self._search_artist(variation)
                if search_results:
                    for result in search_results:
                        genres = self._extract_genres_from_page(result['title'])
                        if genres:
                            logger.info(f"Found genres for {artist_name} via variation '{variation}': {genres}")
                            return genres
            
            # Strategy 3: Try removing common prefixes/suffixes
            name_variations = [clean_name]
            
            # Remove "The " prefix
            if clean_name.lower().startswith('the '):
                name_variations.append(clean_name[4:])
            
            # Handle stage names with symbols
            if any(char in clean_name for char in ['$', '&', '.', ',']):
                # Remove special characters
                clean_variation = re.sub(r'[^\w\s]', '', clean_name)
                name_variations.append(clean_variation)
            
            for name_var in name_variations:
                if name_var != clean_name:  # Don't repeat the original search
                    search_results = self._search_artist(name_var)
                    if search_results:
                        for result in search_results:
                            genres = self._extract_genres_from_page(result['title'])
                            if genres:
                                logger.info(f"Found genres for {artist_name} via name variation '{name_var}': {genres}")
                                return genres
            
            logger.warning(f"No genres found for {artist_name} after all search strategies")
            return []
            
        except Exception as e:
            logger.error(f"Error fetching genres for {artist_name}: {str(e)}")
            return []

    def _search_artist(self, artist_name: str) -> List[dict]:
        """Search for artist on Wikipedia with improved filtering."""
        params = {
            'action': 'opensearch',
            'format': 'json',
            'search': artist_name,
            'limit': 10  # Increased from 5 to get more results
        }
        
        try:
            response = self.session.get(self.base_url, params=params, timeout=10)
            response.raise_for_status()
            
            data = response.json()
            titles, descriptions, urls = data[1], data[2], data[3]
            
            results = []
            prioritized_results = []
            
            for i, title in enumerate(titles):
                desc = descriptions[i].lower() if i < len(descriptions) and descriptions[i] else ""
                title_lower = title.lower()
                original_name = artist_name.lower().replace(' musician', '').replace(' singer', '').replace(' band', '').replace(' rapper', '').replace(' artist', '')
                
                result = {
                    'title': title,
                    'description': descriptions[i] if i < len(descriptions) else "",
                    'url': urls[i] if i < len(urls) else ""
                }
                
                # Higher priority for exact matches with disambiguation
                if (f'{original_name} (' in title_lower and 
                    any(term in title_lower for term in ['musician', 'singer', 'rapper', 'band', 'artist'])):
                    prioritized_results.insert(0, result)  # Insert at beginning for highest priority
                
                # High priority for other music disambiguations
                elif any(term in title_lower for term in ['(musician)', '(singer)', '(rapper)', '(band)']):
                    prioritized_results.append(result)
                
                # Medium priority for music-related descriptions or titles
                elif (any(keyword in desc for keyword in ['singer', 'musician', 'band', 'artist', 'rapper']) or
                      any(keyword in title_lower for keyword in ['musician', 'singer', 'band', 'rapper'])):
                    results.append(result)
                
                # Low priority for exact title matches (might be the main page)
                elif title_lower == original_name:
                    results.append(result)
            
            # Return prioritized results first
            final_results = prioritized_results + results
            
            logger.info(f"Search for '{artist_name}' found {len(final_results)} filtered results")
            return final_results[:5]  # Limit to top 5 results
            
        except Exception as e:
            logger.error(f"Search error for {artist_name}: {str(e)}")
            return []
    
    # Replace the _extract_genres_from_page method with this corrected version

    def _extract_genres_from_page(self, page_title: str) -> List[str]:
        """Extract genres from a Wikipedia page, following redirects if necessary."""
        params = {
            'action': 'query',
            'format': 'json',
            'prop': 'revisions',
            'rvprop': 'content',
            'rvslots': 'main',
            'rvlimit': 1,
            'redirects': True,  # This will follow redirects automatically
            'titles': page_title
        }
        
        try:
            response = self.session.get(self.base_url, params=params, timeout=10)
            response.raise_for_status()
            
            data = response.json()
            
            # Check if there were redirects
            if 'redirects' in data['query']:
                redirects = data['query']['redirects']
                final_title = redirects[-1]['to']  # Get the final redirect target
                logger.info(f"Following redirect: {page_title} -> {final_title}")
        
            pages = data['query']['pages']
            page = list(pages.values())[0]
            
            if 'revisions' not in page:
                return []
            
            content = page['revisions'][0]['slots']['main']['*']
            
            # Check if this is still a redirect (backup check)
            if content.strip().startswith('#REDIRECT'):
                redirect_match = re.search(r'#REDIRECT\s*\[\[([^\]]+)\]\]', content, re.IGNORECASE)
                if redirect_match:
                    redirect_target = redirect_match.group(1)
                    logger.info(f"Manual redirect detected: {page_title} -> {redirect_target}")
                    # Recursively follow the redirect
                    return self._extract_genres_from_page(redirect_target)
        
            # If we suspect the content is truncated (no closing }}), try getting more
            if '{{hlist' in content or '{{flatlist' in content:
                # Look for infobox
                infobox_match = re.search(r'\{\{Infobox[^}]*?\|\s*genre\s*=.*?\}\}', content, re.DOTALL | re.IGNORECASE)
                if not infobox_match:
                    # Content might be truncated, try getting full page content
                    params['rvsection'] = None  # Get full content
                    response = self.session.get(self.base_url, params=params, timeout=15)
                    response.raise_for_status()
                    data = response.json()
                    pages = data['query']['pages']
                    page = list(pages.values())[0]
                    if 'revisions' in page:
                        content = page['revisions'][0]['slots']['main']['*']

            # Find the genre field in the infobox
            genre_pattern = r'\|\s*genre\s*=\s*(.*?)(?=\n\s*\|[a-zA-Z_]|\n\}\}|\Z)'
            match = re.search(genre_pattern, content, re.IGNORECASE | re.DOTALL)
            
            if match:
                genre_content = match.group(1).strip()
                return self._clean_genre_text(genre_content)
            
            logger.info(f"No genre field found for {page_title}")
        
        except Exception as e:
            logger.error(f"Error extracting genres from page {page_title}: {str(e)}")
            return []

    def _clean_genre_text(self, text: str) -> List[str]:
        """
        Clean and extract genres from Wikipedia content.
        1. Strip all HTML tags and entities.
        2. Extract [[...]] links first, then fallback to splitting.
        3. Filter out non-genre entries (discographies, labels, etc.).
        4. Deduplicate while preserving order.
        """
        # 1) Remove HTML tags & entities
        text = re.sub(r'<[^>]+>', '', text)    # strip <ref>…</ref> or any HTML tag
        text = re.sub(r'&[a-z]+;', '', text)   # strip &nbsp;, &amp;, etc.

        genre_parts: List[str] = []

        # 2) Find all [[…]] links first (ignore anything after '|' or '#')
        raw_links = re.findall(r'\[\[([^|\]\#]+)', text)

        if raw_links:
            for link in raw_links:
                part = link.strip()
                if self._is_valid_genre(part):
                    genre_parts.append(part)
        else:
            # 3) Fallback: split on comma, semicolon, pipe, slash
            simple_parts = re.split(r'[;,|/]', text)
            for part in simple_parts:
                part = part.strip()
                if part and self._is_valid_genre(part):
                    genre_parts.append(part)

        # 4) Filter out obvious non-genres and deduplicate
        filtered_genres = []
        seen = set()

        for genre in genre_parts:
            # Extra check for discography entries
            if 'discography' in genre.lower():
                continue
                
            normalized = self._normalize_genre(genre)
            if normalized and normalized.lower() not in seen and 'discography' not in normalized.lower():
                seen.add(normalized.lower())
                filtered_genres.append(normalized)

        return filtered_genres

    def _is_valid_genre(self, text: str) -> bool:
        """Enhanced genre validation with NLP support"""
        if not text or len(text) < 2 or len(text) > 40:
            return False
        
        text_lower = text.lower()
        
        # First pass: Rule-based filtering for obvious non-genres
        invalid_terms = [
            'discography', 'records', 'entertainment', 'music group',
            'band', 'artist', 'label', 'inc.', 'ltd.', 'corporation',
            'cite', 'ref', 'url', 'website', 'magazine', 'wikipedia',
            'category:', 'file:', 'image:', 'template:', 'user:',
            'list of', 'timeline of', 'history of',
            'sub pop', 'truth and soul', 'def jam', 'columbia',
            'atlantic', 'warner', 'universal', 'sony', 'emi',
            'interscope', 'capitol', 'republic', 'rca', 'parlophone',
            'flying tart', 'prometheus global media',
            'group)', '(group)', 'collective', 'crew', 'posse',
            'underground', 'thug life', 'outlawz', 'digital underground',
            'death row', 'bad boy', 'roc-a-fella',
            # Media outlets and websites
            'allmusic', 'pitchfork', 'rolling stone', 'nme', 'spin',
            'ones to watch', 'i-d', 'uproxx', 'billboard', 'complex',
            'hypebeast', 'fader', 'stereogum', 'consequence of sound',
            # TV/Radio personalities
            'tablo', 'jeong hyeong-don', 'jimmy fallon', 'conan',
            # Artist collaborations/side projects
            'stephen malkmus and the jicks', 'hope sandoval & the warm inventions',
            'hope sandoval and the warm inventions',
        ]
        
        # Add known artist names that commonly appear
        known_artists = [
            'morrissey', 'johnny marr', 'andy rourke', 'mike joyce',
            'thom yorke', 'radiohead', 'kurt cobain', 'dave grohl'
        ]
        
        if any(term in text_lower for term in invalid_terms + known_artists):
            print(f"RULE-BASED: '{text}' rejected - contains invalid term or known artist")
            return False
        
        # Additional pattern checks for artist collaborations
        if (text_lower.endswith('discography') or 
            '(' in text and ')' in text or
            '=' in text or
            text.isupper() and len(text) > 3 or
            # Check for artist collaboration patterns (any capitalization)
            ' & ' in text or 
            ' and the ' in text_lower or
            ' and ' in text_lower and len(text.split()) > 3 or  # Long artist names with "and"
            # Check for single word entries that might be names/brands
            (len(text.split()) == 1 and text.istitle() and len(text) > 8)):
            print(f"RULE-BASED: '{text}' rejected - failed pattern checks")
            return False
        
        # Quick check for obvious genres (skip NLP for performance)
        obvious_genres = [
            'rock', 'pop', 'jazz', 'hip hop', 'rap', 'metal', 'folk', 'country',
            'electronic', 'dance', 'reggae', 'blues', 'punk', 'alternative',
            'indie', 'soul', 'funk', 'r&b', 'classical', 'gospel', 'house',
            'techno', 'trance', 'dubstep', 'ambient', 'experimental'
        ]
        
        if any(genre_word in text_lower for genre_word in obvious_genres):
            print(f"OBVIOUS GENRE: '{text}' - accepted without NLP")
            return True
        
        # Second pass: NLP validation for suspicious cases
        suspicious_patterns = [
            # Single capitalized words (could be names)
            text.istitle() and ' ' not in text and len(text) > 3,
            # Multiple capitalized words (could be band names)
            all(word.istitle() for word in text.split()) and len(text.split()) >= 2,
            # Short lowercase words (might be abbreviations/codes)
            len(text) <= 4 and text.islower()
        ]
        
        if any(suspicious_patterns):
            print(f"SUSPICIOUS: '{text}' - triggering NLP validation")
            
            # Use NLP to make final decision
            if self._is_person_name_nlp(text):
                print(f"NLP: '{text}' identified as person name - REJECTED")
                return False
            
            if not self._is_likely_genre_nlp(text):
                print(f"NLP: '{text}' not identified as music genre - REJECTED")
                return False
            else:
                print(f"NLP: '{text}' identified as music genre - ACCEPTED")
        else:
            print(f"NOT SUSPICIOUS: '{text}' - passed without NLP check")
    
        return True

    def _normalize_genre(self, genre: str) -> str:
        """Normalize genre string to a standard format."""
        if not genre:
            return ""
        
        genre = genre.strip()
        genre = re.sub(r'[<>{}]', '', genre)
        
        # Comprehensive genre mappings
        genre_mappings = {
            # Capitalization fixes
            'west coast hip-hop': 'West Coast hip hop',
            'gangsta rap': 'gangster rap',
            'political hip-hop': 'conscious hip hop',
            
            # R&B variations
            'alternative r&b': 'alternative R&B',
            'r&b': 'R&B',
            'contemporary r&b': 'contemporary R&B',
            'rhythm and blues': 'R&B',
            
            # Hip hop variations
            'hip hop music': 'hip hop',
            'hip-hop': 'hip hop',
            'hiphop': 'hip hop',
            
            # Pop variations
            'pop music': 'pop',
            'popular music': 'pop',
            
            # Rock variations
            'rock music': 'rock',
            'rock and roll': 'rock',
            'rock & roll': 'rock',
            
            # Electronic variations
            'electronic music': 'electronic',
            'electronica': 'electronic',
            
            # Jazz variations
            'jazz music': 'jazz',
            
            # Folk variations
            'folk music': 'folk',
            'folk rock': 'folk rock',
            'folk-rock': 'folk rock',
            
            # Soul variations
            'soul music': 'soul',
            'neo soul': 'neo-soul',
            'neo-soul': 'neo-soul',
            
            # Other normalizations
            'alternative hip-hop': 'alternative hip hop',
            'southern hip-hop': 'Southern hip hop',
        }
        
        # Get normalized version or use original
        normalized = genre_mappings.get(genre.lower(), genre)
        
        # Special case for R&B - keep capitalized
        if 'r&b' in normalized.lower():
            return normalized.replace('r&b', 'R&B').replace('R&b', 'R&B')
        
        # Special case for K-pop/K-rock - capitalize K
        if normalized.lower().startswith('k-'):
            return 'K-' + normalized[2:]
        
        # Title case for multi-word genres, lowercase for single words
        if ' ' in normalized:
            return normalized.title()
        else:
            return normalized.lower()
        
    def _store_genres(self, artist: Artist, genres: List[str]) -> None:
        """Store genres for an artist in the database."""
        try:
            with transaction.atomic():
                # Remove existing genre relationships for this artist
                ArtistGenre.objects.filter(artist=artist).delete()
                
                # Create or get genres and link them to the artist
                for genre_name in genres:
                    # Normalize the genre name
                    normalized_name = self._normalize_genre(genre_name)
                    
                    # Create or get the genre
                    genre, created = Genre.objects.get_or_create(
                        name=normalized_name,
                        defaults={'name': normalized_name}
                    )
                    
                    # Create the artist-genre relationship
                    ArtistGenre.objects.get_or_create(
                        artist=artist,
                        genre=genre
                    )
                
                logger.info(f"Successfully stored {len(genres)} genres for {artist.name}")
                
        except Exception as e:
            logger.error(f"Error storing genres for {artist.name}: {str(e)}")
            raise

    def _get_nlp(self):
        """Lazy load spaCy model"""
        if self._nlp is None:
            try:
                self._nlp = spacy.load("en_core_web_sm")
            except OSError:
                # Fallback if model not installed
                self._nlp = False
        return self._nlp

    def _get_classifier(self):
        """Lazy load classification model"""
        if self._classifier is None:
            try:
                # Use a lightweight model for better performance
                self._classifier = pipeline(
                    "zero-shot-classification",
                    model="typeform/distilbert-base-uncased-mnli"
                )
            except Exception:
                self._classifier = False
        return self._classifier

    def _is_likely_genre_nlp(self, text: str) -> bool:
        """Use NLP to determine if text is likely a music genre"""
        classifier = self._get_classifier()
        if not classifier:
            return True  # Fallback to allowing it
        
        try:
            candidate_labels = [
                "music genre",
                "person name", 
                "company name",
                "website name",
                "band name"
            ]
            
            result = classifier(text, candidate_labels)
            
            # Debug output
            print(f"NLP Classification for '{text}':")
            for label, score in zip(result['labels'], result['scores']):
                print(f"  {label}: {score:.3f}")
            
            # If "music genre" is the top prediction with decent confidence
            if (result['labels'][0] == "music genre" and 
                result['scores'][0] > 0.5):  # Increased threshold
                return True
            
            # Also accept if music genre is second but close to first
            if (len(result['labels']) > 1 and 
                result['labels'][1] == "music genre" and
                result['scores'][1] > 0.4 and
                result['scores'][0] - result['scores'][1] < 0.2):
                return True
            
            return False
            
        except Exception as e:
            logger.warning(f"NLP classification failed for '{text}': {e}")
            return True  # Fallback to allowing it

    def _is_person_name_nlp(self, text: str) -> bool:
        """Use NLP to detect if text is a person's name"""
        nlp = self._get_nlp()
        if not nlp:
            return False
        
        try:
            # Add context to help spaCy recognize names
            context_text = f"The musician {text} is known for their work."
            doc = nlp(context_text)
            
            # Check for PERSON entities
            for ent in doc.ents:
                if ent.label_ == "PERSON" and text in ent.text:
                    return True
            
            # Fallback: check without context
            doc = nlp(text)
            for ent in doc.ents:
                if ent.label_ == "PERSON":
                    return True
            
            return False
            
        except Exception as e:
            logger.warning(f"NLP person detection failed for '{text}': {e}")
            return False