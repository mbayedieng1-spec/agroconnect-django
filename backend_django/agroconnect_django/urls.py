import os
from pathlib import Path
from django.urls import path, include, re_path
from django.conf import settings
from django.conf.urls.static import static
from django.views.generic import TemplateView
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.http import FileResponse, Http404
from django.utils import timezone


@api_view(['GET'])
def health(request):
    return Response({
        'ok': True,
        'env': 'production' if not settings.DEBUG else 'development',
        'time': timezone.now().isoformat(),
        'version': 'Django AgroConnect 1.0'
    })


def react_index(request, *args, **kwargs):
    """Serve React's index.html for all non-API routes (SPA fallback)."""
    index = settings.REACT_BUILD_DIR / 'index.html'
    if index.exists():
        return FileResponse(open(index, 'rb'))
    raise Http404("Frontend build not found. Run: cd frontend && npm run build")


urlpatterns = [
    path('api/', include('api.urls')),
    path('api/health', health),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

# SPA fallback: serve React for everything else (if build exists)
if (settings.REACT_BUILD_DIR / 'index.html').exists():
    urlpatterns += [re_path(r'^(?!api/).*$', react_index)]
