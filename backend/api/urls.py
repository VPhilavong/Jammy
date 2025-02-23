from django.urls import path
from . import views

urlpatterns = [
    path('login/', views.login),
    path('callback/', views.callback),
    path('getdata/', views.getData),
    path('top_tracks/', views.top_tracks),
    path('top_artists/', views.top_artists),
]