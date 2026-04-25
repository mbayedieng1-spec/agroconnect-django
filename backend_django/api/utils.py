"""Utility: send events via Django Channels layer (sync-safe wrapper)."""
import json
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer


def emit(group: str, event_type: str, data: dict):
    """Send a message to a channel group (callable from sync views)."""
    try:
        layer = get_channel_layer()
        if layer is None:
            return
        async_to_sync(layer.group_send)(group, {'type': event_type, 'data': data})
    except Exception:
        pass  # Don't crash the request if WS fails


def emit_to_user(user_id, event_type: str, data: dict):
    emit(f"u_{user_id}", event_type, data)


def broadcast(event_type: str, data: dict):
    emit("broadcast", event_type, data)
