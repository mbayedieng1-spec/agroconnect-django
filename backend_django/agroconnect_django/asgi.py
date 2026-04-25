import os
import django
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
from django.urls import re_path

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'agroconnect_django.settings')
django.setup()

from api.consumers import AgroConnectConsumer

application = ProtocolTypeRouter({
    'http': get_asgi_application(),
    'websocket': AuthMiddlewareStack(
        URLRouter([
            re_path(r'^socket\.io/', AgroConnectConsumer.as_asgi()),
            re_path(r'^ws/$', AgroConnectConsumer.as_asgi()),
        ])
    ),
})
