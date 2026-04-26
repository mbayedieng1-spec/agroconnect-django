import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = os.environ.get('SECRET_KEY', 'django-insecure-agroconnect-change-in-production-2024')
DEBUG      = os.environ.get('DEBUG', 'True') == 'True'

ALLOWED_HOSTS = os.environ.get('ALLOWED_HOSTS', '*').split(',') + ['.onrender.com', '.vercel.app', 'localhost']

INSTALLED_APPS = [
    'django.contrib.contenttypes',
    'django.contrib.auth',
    'django.contrib.staticfiles',
    'rest_framework',
    'corsheaders',
    'channels',
    'api.apps.ApiConfig',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.middleware.common.CommonMiddleware',
]

ROOT_URLCONF      = 'agroconnect_django.urls'
WSGI_APPLICATION  = 'agroconnect_django.wsgi.application'
ASGI_APPLICATION  = 'agroconnect_django.asgi.application'

# ── Database ────────────────────────────────────────────
DATABASE_URL = os.environ.get('DATABASE_URL', '')
if DATABASE_URL and DATABASE_URL.startswith('postgresql'):
    import urllib.parse as up
    r = up.urlparse(DATABASE_URL)
    DATABASES = {
        'default': {
            'ENGINE':   'django.db.backends.postgresql',
            'NAME':     r.path.lstrip('/'),
            'USER':     r.username,
            'PASSWORD': r.password,
            'HOST':     r.hostname,
            'PORT':     r.port or 5432,
        }
    }
else:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME':   BASE_DIR / 'db.sqlite3',
        }
    }

# ── Channels (WebSocket) ────────────────────────────────
REDIS_URL = os.environ.get('REDIS_URL', '')
if REDIS_URL:
    CHANNEL_LAYERS = {
        'default': {
            'BACKEND': 'channels_redis.core.RedisChannelLayer',
            'CONFIG': {'hosts': [REDIS_URL]},
        }
    }
else:
    CHANNEL_LAYERS = {
        'default': {'BACKEND': 'channels.layers.InMemoryChannelLayer'}
    }

# ── CORS ────────────────────────────────────────────────
CORS_ALLOW_ALL_ORIGINS = DEBUG
CORS_ALLOWED_ORIGINS = [
    o for o in [
        os.environ.get('FRONTEND_URL', ''),
        'http://localhost:3000',
        'http://localhost:5173',
        'http://localhost:4173',
    ] if o
]
CORS_ALLOW_CREDENTIALS = True

# ── Static & Media ──────────────────────────────────────
STATIC_URL      = '/static/'
STATIC_ROOT     = BASE_DIR / 'staticfiles'
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

# React build served at /  (optional — only if you run `npm run build` before deploying)
REACT_BUILD_DIR = BASE_DIR / 'frontend_build'

MEDIA_URL   = '/media/'
MEDIA_ROOT  = BASE_DIR / 'media'

# ── Cloudinary ──────────────────────────────────────────
if os.environ.get('CLOUDINARY_CLOUD_NAME'):
    import cloudinary
    cloudinary.config(
        cloud_name  = os.environ.get('CLOUDINARY_CLOUD_NAME'),
        api_key     = os.environ.get('CLOUDINARY_API_KEY'),
        api_secret  = os.environ.get('CLOUDINARY_API_SECRET'),
    )

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

REST_FRAMEWORK = {
    'DEFAULT_RENDERER_CLASSES': ['rest_framework.renderers.JSONRenderer'],
}

TEMPLATES = [{
    'BACKEND': 'django.template.backends.django.DjangoTemplates',
    'DIRS': [BASE_DIR / 'frontend_build'],
    'APP_DIRS': True,
    'OPTIONS': {'context_processors': ['django.template.context_processors.request']},
}]

LANGUAGE_CODE = 'fr-fr'
TIME_ZONE     = 'Africa/Dakar'
USE_I18N      = True
USE_TZ        = True

REST_FRAMEWORK.update({
    'DEFAULT_AUTHENTICATION_CLASSES': [],
    'DEFAULT_PERMISSION_CLASSES': [],
})
