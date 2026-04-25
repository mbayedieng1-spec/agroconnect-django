from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import Notification
from .serializers import NotificationSerializer


@api_view(['GET'])
def list_notifications(request, user_id):
    notifs = (Notification.objects
              .filter(destinataire_id=user_id)
              .select_related('expediteur', 'publication')
              .order_by('-date')[:30])
    return Response(NotificationSerializer(notifs, many=True).data)


@api_view(['PATCH'])
def read_all(request, user_id):
    Notification.objects.filter(destinataire_id=user_id).update(lu=True)
    return Response({'ok': True})
