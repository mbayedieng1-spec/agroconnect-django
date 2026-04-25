import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.layers import get_channel_layer

channel_layer = None


def get_layer():
    global channel_layer
    if channel_layer is None:
        channel_layer = get_channel_layer()
    return channel_layer


class AgroConnectConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        await self.accept()
        # Join global group for broadcasts
        await self.channel_layer.group_add("broadcast", self.channel_name)

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard("broadcast", self.channel_name)
        # Leave user-specific group if joined
        if hasattr(self, 'user_group'):
            await self.channel_layer.group_discard(self.user_group, self.channel_name)

    async def receive(self, text_data):
        data = json.loads(text_data)
        if data.get('type') == 'join_user':
            user_id = data.get('userId')
            self.user_group = f"u_{user_id}"
            await self.channel_layer.group_add(self.user_group, self.channel_name)

    # Handlers for group_send messages
    async def notification(self, event):
        await self.send(text_data=json.dumps({'type': 'notification', **event['data']}))

    async def pending_post(self, event):
        await self.send(text_data=json.dumps({'type': 'pending_post', **event['data']}))

    async def publication_created(self, event):
        await self.send(text_data=json.dumps({'type': 'publication_created', **event['data']}))

    async def publication_deleted(self, event):
        await self.send(text_data=json.dumps({'type': 'publication_deleted', **event['data']}))

    async def like_update(self, event):
        await self.send(text_data=json.dumps({'type': 'like_update', **event['data']}))

    async def comment_added(self, event):
        await self.send(text_data=json.dumps({'type': 'comment_added', **event['data']}))

    async def new_post(self, event):
        await self.send(text_data=json.dumps({'type': 'new_post', **event['data']}))
