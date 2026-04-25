from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Q

from .models import User, Publication, Notification
from .serializers import UserSerializer, UserMiniSerializer, PublicationSerializer
from .utils import emit_to_user


# ── INSCRIPTION ───────────────────────────────────────
@api_view(['POST'])
def register(request):
    d = request.data
    pseudo, email = d.get('pseudo'), d.get('email')
    if User.objects.filter(email=email).exists():
        return Response({'error': 'Cet email est déjà utilisé'}, status=400)
    if User.objects.filter(pseudo=pseudo).exists():
        return Response({'error': 'Ce pseudo est déjà utilisé'}, status=400)
    user = User.objects.create(
        pseudo=pseudo, nom=d.get('nom'), prenom=d.get('prenom'),
        email=email, mot_de_passe=d.get('motDePasse'),
        region=d.get('region'), type_culture=d.get('type_culture'),
    )
    return Response(UserSerializer(user).data, status=201)


# ── CONNEXION ─────────────────────────────────────────
@api_view(['POST'])
def login(request):
    d = request.data
    try:
        user = User.objects.get(email=d.get('email'), mot_de_passe=d.get('motDePasse'))
    except User.DoesNotExist:
        return Response({'error': 'Email ou mot de passe incorrect'}, status=401)
    if user.statut == 'suspendu':
        return Response({'error': "Votre compte est suspendu. Contactez l'administrateur."}, status=403)
    return Response(UserSerializer(user).data)


# ── TOUS LES UTILISATEURS ─────────────────────────────
@api_view(['GET'])
def list_users(request):
    users = User.objects.exclude(role='admin')
    return Response(UserMiniSerializer(users, many=True).data)


@api_view(['GET'])
def list_users_all(request):
    users = User.objects.prefetch_related('followers', 'following_set').all()
    return Response(UserSerializer(users, many=True).data)


@api_view(['GET'])
def search_users(request):
    q = request.query_params.get('q', '')
    users = User.objects.exclude(role='admin').filter(
        Q(pseudo__icontains=q) | Q(nom__icontains=q) |
        Q(region__icontains=q) | Q(type_culture__icontains=q)
    ).prefetch_related('followers')
    return Response(UserMiniSerializer(users, many=True).data)


# ── UN UTILISATEUR ────────────────────────────────────
@api_view(['GET', 'PATCH'])
def user_detail(request, pk):
    try:
        user = User.objects.prefetch_related('followers', 'following_set').get(pk=pk)
    except User.DoesNotExist:
        return Response({'error': 'Introuvable'}, status=404)

    if request.method == 'GET':
        return Response(UserSerializer(user).data)

    # PATCH — update profile (no role/password change)
    d = request.data
    for field in ['pseudo', 'nom', 'prenom', 'region', 'type_culture', 'avatar', 'bio', 'cover_color']:
        val = d.get(field) or d.get('coverColor' if field == 'cover_color' else field)
        if val is not None:
            setattr(user, field, val)
    # handle coverColor alias
    if 'coverColor' in d:
        user.cover_color = d['coverColor']
    user.save()
    return Response(UserSerializer(user).data)


# ── FEED D'UN UTILISATEUR ─────────────────────────────
@api_view(['GET'])
def user_feed(request, pk):
    pubs = (Publication.objects
            .filter(statut='approuve')
            .select_related('auteur')
            .prefetch_related('likes', 'commentaires__auteur', 'commentaires__likes',
                              'commentaires__reponses__auteur')
            .order_by('-date')[:60])
    return Response(PublicationSerializer(pubs, many=True).data)


# ── PUBLICATIONS D'UN UTILISATEUR ─────────────────────
@api_view(['GET'])
def user_publications(request, pk):
    requester_id = request.query_params.get('requesterId', pk)
    try:
        requester = User.objects.get(pk=requester_id)
        is_admin = requester.role == 'admin'
    except User.DoesNotExist:
        is_admin = False

    qs = Publication.objects.filter(auteur_id=pk)
    if not is_admin:
        qs = qs.filter(statut='approuve')
    qs = qs.select_related('auteur').prefetch_related(
        'likes', 'commentaires__auteur', 'commentaires__likes', 'commentaires__reponses__auteur'
    ).order_by('-date')
    return Response(PublicationSerializer(qs, many=True).data)


# ── FOLLOW / UNFOLLOW ─────────────────────────────────
@api_view(['PATCH'])
def follow(request, pk):
    current_user_id = request.data.get('currentUserId')
    try:
        target  = User.objects.get(pk=pk)
        current = User.objects.get(pk=current_user_id)
    except User.DoesNotExist:
        return Response({'error': 'Introuvable'}, status=404)

    if target.role == 'admin':
        return Response({'error': 'Action non autorisée'}, status=403)

    is_following = target.followers.filter(pk=current.pk).exists()
    if is_following:
        target.followers.remove(current)
    else:
        target.followers.add(current)
        Notification.objects.create(
            destinataire=target, expediteur=current, type='follow',
            message=f"{current.pseudo} vous suit désormais"
        )
        emit_to_user(target.pk, 'notification', {'type': 'follow', 'from': current.pseudo})

    return Response({'following': not is_following, 'followersCount': target.followers.count()})


# ── SAUVEGARDER / RETIRER UN POST ─────────────────────
@api_view(['PATCH'])
def save_post(request, pk, pub_id):
    try:
        user = User.objects.get(pk=pk)
        pub  = Publication.objects.get(pk=pub_id)
    except (User.DoesNotExist, Publication.DoesNotExist):
        return Response({'error': 'Introuvable'}, status=404)

    saved = user.saved_posts.filter(pk=pub.pk).exists()
    if saved:
        user.saved_posts.remove(pub)
    else:
        user.saved_posts.add(pub)
    return Response({'saved': not saved})


# ── MODIFIER STATUT (admin) ───────────────────────────
@api_view(['PATCH'])
def update_statut(request, pk):
    admin_id = request.data.get('adminId')
    try:
        admin = User.objects.get(pk=admin_id)
    except User.DoesNotExist:
        return Response({'error': 'Non autorisé'}, status=403)
    if admin.role != 'admin':
        return Response({'error': 'Non autorisé'}, status=403)

    new_statut = request.data.get('statut')
    try:
        user = User.objects.get(pk=pk)
    except User.DoesNotExist:
        return Response({'error': 'Introuvable'}, status=404)

    user.statut = new_statut
    user.save()

    msg = 'Votre compte a été suspendu.' if new_statut == 'suspendu' else 'Votre compte a été réactivé.'
    notif_type = 'suspension' if new_statut == 'suspendu' else 'approbation'
    Notification.objects.create(destinataire=user, expediteur=admin, type=notif_type, message=msg)
    emit_to_user(user.pk, 'notification', {'type': notif_type})

    return Response(UserSerializer(user).data)
