from django.urls import path
from . import views

urlpatterns = [
    path('login/', views.login),
    path('callback/', views.callback),
    path('getdata/', views.getData),
    path('top_tracks/', views.top_tracks),
    path('top_artists/', views.top_artists),
    path('top_genres/', views.top_genres),
    path('artist/<str:artist_name>/', views.get_artist, name='get_artist'),
    path('artists/bulk-cached/', views.get_artists_bulk_cached, name='get_artists_bulk_cached'),
    path('top_genres', views.top_genres, name='top_genres'),
    
    # New test endpoints for music app
    path('test/create-artists/', views.create_test_artists, name='create_test_artists'),
    path('test/fetch-genres/<int:artist_id>/', views.fetch_genres_for_artist, name='fetch_genres_artist'),
    path('test/fetch-all-genres/', views.fetch_all_genres, name='fetch_all_genres'),
    path('test/artists/', views.list_artists_with_genres, name='list_artists_genres'),
    path('test/music-stats/', views.music_stats, name='music_stats'),
    path('debug/wikipedia/<str:artist_name>/', views.debug_wikipedia, name='debug_wikipedia'),
    path('debug/genre-extraction/<str:artist_name>/', views.debug_genre_extraction, name='debug_genre_extraction'),
]