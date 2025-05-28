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
    path('analyze-mood/<str:track_id>/', views.analyze_track_mood, name='analyze_track_mood'),
    path('test-genius/', views.test_genius_token, name='test_genius_token'),
]