from urllib import request
from django.shortcuts import render
import os
from django.http import JsonResponse
from django.http import HttpResponse
from pytube import YouTube
import json
from django.middleware.csrf import get_token
import platform
from django.http import JsonResponse

def csrf_token_view(request):
    # Generate CSRF token
    csrf_token = get_token(request)
    # Return CSRF token in JSON response
    return JsonResponse({'csrfToken': csrf_token})

def download_video(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body.decode('utf-8')) 
            print("Data : {}".format(data))
            video_url = data.get('videoUrl')
            quality = data.get('quality')
            yt = YouTube(video_url)
            if quality == 'mp3':
                audio_streams = yt.streams.filter(only_audio=True)
                if not audio_streams:
                    return JsonResponse({'message': 'No audio streams found for this video'}, status=400)
                audio_stream = audio_streams.first()
                title = yt.title
                file_path = os.path.join(get_default_download_folder(), f'{title}.{audio_stream.subtype}')
                audio_stream.download(output_path=get_default_download_folder(), filename=title)
            else:
                print("Starting to download...")
                print("video_url : ",video_url)
                print("quality : ",quality)
                video_stream = yt.streams.filter(file_extension='mp4', resolution=quality).first()
                print("video_stream : ",video_stream)
                if not video_stream:
                    print('No video stream found for this quality')
                    return JsonResponse({'message': 'No video stream found for this quality'}, status=400)
                title = yt.title
                print("title : ",title)
                file_path = os.path.join(get_default_download_folder(), f'{title}.{video_stream.subtype}')
                print("file_path : ",file_path)
                video_stream.download(output_path=get_default_download_folder(), filename=title)
                print('Video downloaded successfully, filePath:', file_path)  
            return JsonResponse({'message': 'Video downloaded successfully', 'filePath': file_path}, status=200)
        except Exception as e:
            return JsonResponse({'message': str(e)}, status=400)
    elif request.method == 'GET':
        return JsonResponse({'message': 'This endpoint only supports POST requests'}, status=405)
    else:
        return JsonResponse({'message': 'Method not allowed'}, status=405)
    
def get_default_download_folder():
    system = platform.system().lower()
    if system == 'android':
        return '/storage/emulated/0/Download'
    elif system == 'linux':
        # Adjust the path for Linux machines
        return '/home/welf9i/Téléchargements'  # Adjust this path as needed
    else:
        # Handle other operating systems or return a default path
        return None
