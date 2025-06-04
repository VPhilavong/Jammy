from django.db import models

class Genre(models.Model):
    name = models.CharField(max_length=100, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return self.name
    
    class Meta:
        ordering = ['name']

class Artist(models.Model):
    name = models.CharField(max_length=200)
    spotify_id = models.CharField(max_length=50, blank=True, null=True, unique=True)
    genres = models.ManyToManyField(Genre, through='ArtistGenre', blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return self.name

class ArtistGenre(models.Model):
    artist = models.ForeignKey(Artist, on_delete=models.CASCADE)
    genre = models.ForeignKey(Genre, on_delete=models.CASCADE)
    source = models.CharField(max_length=50, default='wikipedia')
    confidence = models.DecimalField(max_digits=3, decimal_places=2, default=0.85)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['artist', 'genre']