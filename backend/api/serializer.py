from rest_framework import serializers
from spotify.models import SpotifyToken
from music.models import Artist, Genre

class ItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = SpotifyToken
        fields = '__all__'

class GenreSerializer(serializers.ModelSerializer):
    class Meta:
        model = Genre
        fields = ['id', 'name']

class ArtistSerializer(serializers.ModelSerializer):
    genres = GenreSerializer(many=True, read_only=True)
    
    class Meta:
        model = Artist
        fields = ['id', 'name', 'spotify_id', 'genres']