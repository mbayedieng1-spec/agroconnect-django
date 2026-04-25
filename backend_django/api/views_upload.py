import os
import uuid
from rest_framework.decorators import api_view, parser_classes
from rest_framework.parsers import MultiPartParser
from rest_framework.response import Response
from django.conf import settings
from django.core.files.storage import default_storage

ALLOWED_TYPES = {'image/jpeg', 'image/png', 'image/gif', 'image/webp'}
MAX_SIZE = 5 * 1024 * 1024  # 5MB


@api_view(['POST'])
@parser_classes([MultiPartParser])
def upload_images(request):
    files = request.FILES.getlist('images')
    if not files:
        return Response({'error': 'Aucun fichier reçu'}, status=400)

    use_cloudinary = bool(
        os.environ.get('CLOUDINARY_CLOUD_NAME') and
        os.environ.get('CLOUDINARY_API_KEY') and
        os.environ.get('CLOUDINARY_API_SECRET')
    )

    urls = []
    for f in files[:5]:
        if f.content_type not in ALLOWED_TYPES:
            return Response({'error': 'Type de fichier non autorisé — JPG, PNG, GIF, WEBP seulement'}, status=400)
        if f.size > MAX_SIZE:
            return Response({'error': 'Fichier trop volumineux (max 5MB)'}, status=400)

        if use_cloudinary:
            import cloudinary.uploader
            result = cloudinary.uploader.upload(f, folder='agroconnect', resource_type='image')
            urls.append(result['secure_url'])
        else:
            ext  = os.path.splitext(f.name)[1]
            name = str(uuid.uuid4()) + ext
            path = default_storage.save(f'uploads/{name}', f)
            urls.append(f'/media/{path}')

    return Response({'urls': urls})
