from django.urls import path
from . import views

urlpatterns = [
    path('', views.download_video, name='download_video'),
    path('csrf-token/', views.csrf_token_view, name='csrf_token_view'),
    path('get-video-file/', views.get_video_file, name='get_video_file'),
]
