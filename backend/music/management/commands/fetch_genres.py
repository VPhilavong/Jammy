from django.core.management.base import BaseCommand
from music.models import Artist
from music.services import WikipediaGenreService
import time

class Command(BaseCommand):
    help = 'Fetch genres from Wikipedia for artists'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--artist-id',
            type=int,
            help='Fetch genres for specific artist ID'
        )
        parser.add_argument(
            '--batch-size',
            type=int,
            default=10,
            help='Number of artists to process in each batch'
        )
    
    def handle(self, *args, **options):
        service = WikipediaGenreService()
        
        if options['artist_id']:
            genres = service.fetch_and_store_artist_genres(options['artist_id'])
            self.stdout.write(
                self.style.SUCCESS(f'Found {len(genres)} genres')
            )
        else:
            artists_without_genres = Artist.objects.filter(
                artistgenre__isnull=True
            ).distinct()[:options['batch_size']]
            
            for artist in artists_without_genres:
                genres = service.fetch_and_store_artist_genres(artist.id)
                self.stdout.write(f'{artist.name}: {len(genres)} genres')
                time.sleep(1)  # Be nice to Wikipedia