import requests
import re
import logging
from typing import List, Optional
from django.db import transaction
from .models import Artist, Genre, ArtistGenre

logger = logging.getLogger(__name__)

class WikipediaGenreService:
    def __init__(self):
        self.base_url = 'https://en.wikipedia.org/w/api.php'
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Jammy/1.0 (https://your-domain.com; your-email@example.com)'
        })
    
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
    
    def get_artist_genres(self, artist_name: str) -> List[str]:
        """Get genres for an artist from Wikipedia."""
        try:
            search_results = self._search_artist(artist_name)
            
            if not search_results:
                return []
            
            # Try each search result until we find genres
            for result in search_results:
                genres = self._extract_genres_from_page(result['title'])
                if genres:
                    return genres
            
            return []
        except Exception as e:
            logger.error(f"Error fetching genres for {artist_name}: {str(e)}")
            return []
    
    def _search_artist(self, artist_name: str) -> List[dict]:
        """Search for artist on Wikipedia."""
        params = {
            'action': 'opensearch',
            'format': 'json',
            'search': artist_name,
            'limit': 5
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
                
                result = {
                    'title': title,
                    'description': descriptions[i] if i < len(descriptions) else "",
                    'url': urls[i] if i < len(urls) else ""
                }
                
                # Prioritize specific musician disambiguation pages
                if ('(musician)' in title_lower or 
                    '(singer)' in title_lower or 
                    '(rapper)' in title_lower or 
                    '(band)' in title_lower):
                    prioritized_results.append(result)
                elif (any(keyword in desc for keyword in ['singer', 'musician', 'band', 'artist', 'rapper']) or
                      any(keyword in title_lower for keyword in ['musician', 'singer', 'band', 'rapper'])):
                    results.append(result)
            
            # Return prioritized results first, then regular results
            final_results = prioritized_results + results
            
            # If no music-related results, take first result as fallback
            if not final_results and titles:
                final_results.append({
                    'title': titles[0],
                    'description': descriptions[0] if descriptions else "",
                    'url': urls[0] if urls else ""
                })
            
            return final_results
        except Exception as e:
            logger.error(f"Search error for {artist_name}: {str(e)}")
            return []
    
    def _extract_genres_from_page(self, page_title: str) -> List[str]:
        """Extract genres from a Wikipedia page."""
        params = {
            'action': 'query',
            'format': 'json',
            'prop': 'revisions',
            'rvprop': 'content',
            'rvslots': 'main',
            'titles': page_title
        }
        
        try:
            response = self.session.get(self.base_url, params=params, timeout=10)
            response.raise_for_status()
            
            data = response.json()
            pages = data['query']['pages']
            page = list(pages.values())[0]
            
            if 'revisions' not in page:
                return []
            
            content = page['revisions'][0]['slots']['main']['*']
            return self._parse_genres_from_wikitext(content)
        except Exception as e:
            logger.error(f"Error extracting genres from {page_title}: {str(e)}")
            return []
    
    def _parse_genres_from_wikitext(self, wikitext: str) -> List[str]:
        """Parse genres from Wikipedia wikitext."""
        genres = set()
        
        # First, let's find the genre field and extract everything until the next field
        genre_field_pattern = r'\|\s*genre\s*=\s*(.*?)(?=\n\s*\||\n\}\}|\Z)'
        
        match = re.search(genre_field_pattern, wikitext, re.IGNORECASE | re.DOTALL)
        
        if match:
            genre_content = match.group(1)
            extracted_genres = self._clean_genre_text(genre_content)
            genres.update(extracted_genres)
        
        # Also try the old patterns as fallback
        patterns = [
            r'\|\s*genres\s*=\s*([^\n\|]+)',
            r'\|\s*style\s*=\s*([^\n\|]+)',
            r'\|\s*musical_style\s*=\s*([^\n\|]+)'
        ]
        
        for pattern in patterns:
            matches = re.finditer(pattern, wikitext, re.IGNORECASE)
            for match in matches:
                genre_text = match.group(1)
                extracted_genres = self._clean_genre_text(genre_text)
                genres.update(extracted_genres)
        
        return list(genres)[:8]  # Limit to 8 genres
    
    def _clean_genre_text(self, text: str) -> List[str]:
        """Clean and normalize genre text."""
        
        # Handle flatlist and hlist templates
        if '{{flatlist' in text or '{{hlist' in text:
            # Extract everything after the | in the template
            # Look for pattern: {{flatlist| content }}
            template_start = text.find('{{flatlist|') or text.find('{{hlist|')
            if template_start != -1:
                # Find where the template content starts
                content_start = text.find('|', template_start) + 1
                
                # Find the matching closing braces
                brace_count = 0
                template_end = len(text)
                
                for i, char in enumerate(text[template_start:], template_start):
                    if char == '{':
                        brace_count += 1
                    elif char == '}':
                        brace_count -= 1
                        if brace_count == 0:
                            template_end = i
                            break
                
                # Extract content between the pipes and closing braces
                text = text[content_start:template_end]
        
        # Remove any remaining template markup
        text = re.sub(r'\{\{[^}]*\}\}', '', text)
        
        # Remove wiki links but keep the display text or link target
        # [[Hip-hop]] -> Hip-hop
        # [[Pop music|Pop]] -> Pop
        text = re.sub(r'\[\[([^\|\]]+)\|([^\]]+)\]\]', r'\2', text)  # [[Link|Display]] -> Display
        text = re.sub(r'\[\[([^\]]+)\]\]', r'\1', text)  # [[Link]] -> Link
        
        # Remove HTML tags and references
        text = re.sub(r'<[^>]+>', '', text)
        text = re.sub(r'<ref[^>]*>.*?</ref>', '', text, flags=re.DOTALL)
        
        # Remove comments
        text = re.sub(r'<!--.*?-->', '', text, flags=re.DOTALL)
        
        # Remove bold/italic markup
        text = re.sub(r"'''?", '', text)
        
        # Handle list markers (* - #)
        text = re.sub(r'^\s*[\*\#\-]\s*', '', text, flags=re.MULTILINE)
        
        # Replace newlines with commas for splitting
        text = re.sub(r'\n+', ',', text)
        
        # Split on various delimiters
        genres = re.split(r'[,;·•]', text)
        
        cleaned_genres = []
        for genre in genres:
            genre = genre.strip()
            # Filter out empty, too short, too long, or unwanted strings
            if (1 < len(genre) < 50 and 
                not any(x in genre.lower() for x in ['{{', '[[', 'src=', 'http', 'file:', 'image:', 'see ', 'section']) and
                not re.match(r'^\s*[\|\}]+\s*$', genre) and
                genre.lower() not in ['genre', 'genres', 'music']):
                
                genre = self._normalize_genre(genre)
                if genre and len(genre.strip()) > 1:
                    cleaned_genres.append(genre.strip())
        
        return cleaned_genres
    
    def _normalize_genre(self, genre: str):
        """Normalize genre string to a standard format."""
        # Implement normalization logic here
        return genre.strip().lower()  # Example normalization

    def _store_genres(self, artist, genres):
        """Store fetched genres in the database."""
        with transaction.atomic():
            # Clear existing genres
            ArtistGenre.objects.filter(artist=artist).delete()
            
            # Prepare new genres for bulk creation
            genre_objects = []
            for genre_name in genres:
                genre, created = Genre.objects.get_or_create(name=genre_name)
                genre_objects.append(ArtistGenre(artist=artist, genre=genre))
            
            # Bulk create new genre relationships
            ArtistGenre.objects.bulk_create(genre_objects)