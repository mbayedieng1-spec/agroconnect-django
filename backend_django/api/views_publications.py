from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.db.models import Count

from .models import User, Publication, Commentaire, Reponse, Notification
from .serializers import PublicationSerializer, CommentaireSerializer
from .utils import emit_to_user, broadcast


def qs_full(qs):
    return qs.select_related('auteur').prefetch_related(
        'likes', 'partages',
        'commentaires__auteur', 'commentaires__likes',
        'commentaires__reponses__auteur',
    )


# ── TOUTES LES PUBLICATIONS ───────────────────────────
@api_view(['GET', 'POST'])
def publications(request):
    if request.method == 'GET':
        tag      = request.query_params.get('tag')
        sort     = request.query_params.get('sort', 'recent')
        limit    = int(request.query_params.get('limit', 20))
        skip     = int(request.query_params.get('skip', 0))
        admin_id = request.query_params.get('adminId')

        is_admin = False
        if admin_id:
            try:
                is_admin = User.objects.get(pk=admin_id).role == 'admin'
            except User.DoesNotExist:
                pass

        qs = Publication.objects.all()
        if not is_admin:
            qs = qs.filter(statut='approuve')
        if tag:
            qs = qs.filter(tags__contains=[tag])

        if sort == 'likes':
            qs = qs.annotate(nb_likes=Count('likes')).order_by('-nb_likes')
        else:
            qs = qs.order_by('-date')

        total = qs.count()
        pubs  = qs_full(qs)[skip:skip + limit]
        return Response({'pubs': PublicationSerializer(pubs, many=True).data, 'total': total})

    # POST — créer une publication
    d = request.data
    try:
        author = User.objects.get(pk=d.get('auteur'))
    except User.DoesNotExist:
        return Response({'error': 'Utilisateur introuvable'}, status=404)
    if author.statut == 'suspendu':
        return Response({'error': 'Compte suspendu'}, status=403)

    statut = 'approuve' if author.role == 'admin' else 'en_attente'
    pub = Publication.objects.create(
        auteur=author,
        contenu=d.get('contenu', ''),
        images=d.get('images', []),
        tags=d.get('tags', []),
        feeling=d.get('feeling', ''),
        localisation=d.get('localisation', ''),
        statut=statut,
    )
    populated = PublicationSerializer(qs_full(Publication.objects.filter(pk=pub.pk)).first()).data

    if statut == 'en_attente':
        try:
            admin = User.objects.get(role='admin')
            Notification.objects.create(
                destinataire=admin, expediteur=author, type='nouveau_post', publication=pub,
                message=f"{author.pseudo} a soumis une publication en attente d'approbation"
            )
            emit_to_user(admin.pk, 'notification', {'type': 'nouveau_post', 'from': author.pseudo})
            emit_to_user(admin.pk, 'pending_post', populated)
        except User.DoesNotExist:
            pass
    else:
        for follower in author.followers.all():
            emit_to_user(follower.pk, 'new_post', {'from': author.pseudo})
        broadcast('publication_created', populated)

    return Response(populated, status=201)


# ── EN ATTENTE (admin) ────────────────────────────────
@api_view(['GET'])
def en_attente(request):
    admin_id = request.query_params.get('adminId')
    try:
        admin = User.objects.get(pk=admin_id)
    except User.DoesNotExist:
        return Response({'error': 'Non autorisé'}, status=403)
    if admin.role != 'admin':
        return Response({'error': 'Non autorisé'}, status=403)
    pubs = qs_full(Publication.objects.filter(statut='en_attente').order_by('-date'))
    return Response(PublicationSerializer(pubs, many=True).data)


# ── TOP 3 ─────────────────────────────────────────────
@api_view(['GET'])
def top3(request):
    pubs = qs_full(
        Publication.objects.filter(statut='approuve')
        .annotate(nb_likes=Count('likes'))
        .order_by('-nb_likes')[:3]
    )
    return Response(PublicationSerializer(pubs, many=True).data)


# ── STATS (admin) ─────────────────────────────────────
@api_view(['GET'])
def stats(request):
    admin_id = request.query_params.get('adminId')
    try:
        admin = User.objects.get(pk=admin_id)
    except User.DoesNotExist:
        return Response({'error': 'Non autorisé'}, status=403)
    if admin.role != 'admin':
        return Response({'error': 'Non autorisé'}, status=403)

    from django.db.models import Sum
    approved = Publication.objects.filter(statut='approuve')
    total    = approved.count()
    pending  = Publication.objects.filter(statut='en_attente').count()

    total_likes    = sum(p.likes.count() for p in approved)
    total_comments = sum(p.commentaires.count() for p in approved)

    # Tag stats
    from collections import Counter
    tag_counter = Counter()
    for pub in approved.values_list('tags', flat=True):
        tag_counter.update(pub)
    tag_stats = [{'_id': tag, 'count': count} for tag, count in tag_counter.most_common(12)]

    return Response({
        'total': total, 'pending': pending,
        'totalLikes': total_likes, 'totalComments': total_comments,
        'tagStats': tag_stats,
    })


# ── PAR TAG ───────────────────────────────────────────
@api_view(['GET'])
def by_tag(request, tag):
    pubs = qs_full(Publication.objects.filter(tags__contains=[tag], statut='approuve').order_by('-date'))
    return Response(PublicationSerializer(pubs, many=True).data)


# ── UNE PUBLICATION ───────────────────────────────────
@api_view(['GET', 'DELETE'])
def publication_detail(request, pk):
    try:
        pub = qs_full(Publication.objects.filter(pk=pk)).first()
        if pub is None:
            raise Publication.DoesNotExist
    except Publication.DoesNotExist:
        return Response({'error': 'Introuvable'}, status=404)

    if request.method == 'GET':
        Publication.objects.filter(pk=pk).update(vues=pub.vues + 1)
        pub.refresh_from_db()
        return Response(PublicationSerializer(qs_full(Publication.objects.filter(pk=pk)).first()).data)

    # DELETE
    user_id = request.data.get('userId')
    try:
        user = User.objects.get(pk=user_id)
    except User.DoesNotExist:
        return Response({'error': 'Non autorisé'}, status=403)
    if pub.auteur_id != int(user_id) and user.role != 'admin':
        return Response({'error': 'Non autorisé'}, status=403)
    pub.delete()
    broadcast('publication_deleted', {'id': pk})
    return Response({'ok': True})


# ── MODÉRER (admin) ───────────────────────────────────
@api_view(['PATCH'])
def moderer(request, pk):
    admin_id     = request.data.get('adminId')
    new_statut   = request.data.get('statut')
    raison_rejet = request.data.get('raisonRejet', '')
    try:
        admin = User.objects.get(pk=admin_id)
    except User.DoesNotExist:
        return Response({'error': 'Non autorisé'}, status=403)
    if admin.role != 'admin':
        return Response({'error': 'Non autorisé'}, status=403)
    try:
        pub = Publication.objects.select_related('auteur').get(pk=pk)
    except Publication.DoesNotExist:
        return Response({'error': 'Introuvable'}, status=404)

    pub.statut = new_statut
    pub.save()

    if new_statut == 'approuve':
        msg = 'Votre publication a été approuvée et est maintenant visible.'
        notif_type = 'approbation'
        full = qs_full(Publication.objects.filter(pk=pub.pk)).first()
        broadcast('publication_created', PublicationSerializer(full).data)
    else:
        msg = f"Votre publication a été refusée{(' : ' + raison_rejet) if raison_rejet else '.'}"
        notif_type = 'rejet'

    Notification.objects.create(
        destinataire=pub.auteur, expediteur=admin,
        type=notif_type, publication=pub, message=msg
    )
    emit_to_user(pub.auteur_id, 'notification', {'type': notif_type, 'message': msg})
    return Response(PublicationSerializer(pub).data)


# ── LIKE / UNLIKE ─────────────────────────────────────
@api_view(['PATCH'])
def like(request, pk):
    user_id = request.data.get('userId')
    try:
        pub  = Publication.objects.get(pk=pk)
        user = User.objects.get(pk=user_id)
    except (Publication.DoesNotExist, User.DoesNotExist):
        return Response({'error': 'Introuvable'}, status=404)
    if pub.statut != 'approuve':
        return Response({'error': 'Non approuvée'}, status=403)

    liked = pub.likes.filter(pk=user_id).exists()
    if liked:
        pub.likes.remove(user)
    else:
        pub.likes.add(user)
        if pub.auteur_id != int(user_id):
            Notification.objects.create(
                destinataire=pub.auteur, expediteur=user, type='like', publication=pub,
                message=f"{user.pseudo} a aimé votre publication"
            )
            emit_to_user(pub.auteur_id, 'notification', {'type': 'like'})

    count = pub.likes.count()
    broadcast('like_update', {'postId': pk, 'likes': list(pub.likes.values_list('id', flat=True))})
    return Response({'liked': not liked, 'count': count})


# ── COMMENTAIRES ──────────────────────────────────────
@api_view(['POST'])
def add_commentaire(request, pk):
    try:
        pub  = Publication.objects.get(pk=pk)
        user = User.objects.get(pk=request.data.get('auteur'))
    except (Publication.DoesNotExist, User.DoesNotExist):
        return Response({'error': 'Introuvable'}, status=404)
    if pub.statut != 'approuve':
        return Response({'error': 'Non approuvée'}, status=403)
    if user.statut == 'suspendu':
        return Response({'error': 'Compte suspendu'}, status=403)

    com = Commentaire.objects.create(publication=pub, auteur=user, texte=request.data.get('texte', ''))

    if pub.auteur_id != user.pk:
        Notification.objects.create(
            destinataire=pub.auteur, expediteur=user, type='commentaire', publication=pub,
            message=f"{user.pseudo} a commenté votre publication"
        )
        emit_to_user(pub.auteur_id, 'notification', {'type': 'commentaire'})

    data = CommentaireSerializer(com).data
    broadcast('comment_added', {'postId': pk, 'comment': data})
    return Response(data, status=201)


# ── LIKE COMMENTAIRE ──────────────────────────────────
@api_view(['PATCH'])
def like_commentaire(request, pk, cid):
    user_id = request.data.get('userId')
    try:
        com  = Commentaire.objects.get(pk=cid, publication_id=pk)
        user = User.objects.get(pk=user_id)
    except (Commentaire.DoesNotExist, User.DoesNotExist):
        return Response({'error': 'Introuvable'}, status=404)

    liked = com.likes.filter(pk=user_id).exists()
    if liked:
        com.likes.remove(user)
    else:
        com.likes.add(user)
    return Response({'liked': not liked, 'count': com.likes.count()})


# ── RÉPONSES ──────────────────────────────────────────
@api_view(['POST'])
def add_reponse(request, pk, cid):
    try:
        com  = Commentaire.objects.get(pk=cid, publication_id=pk)
        user = User.objects.get(pk=request.data.get('auteur'))
    except (Commentaire.DoesNotExist, User.DoesNotExist):
        return Response({'error': 'Introuvable'}, status=404)

    Reponse.objects.create(commentaire=com, auteur=user, texte=request.data.get('texte', ''))
    data = CommentaireSerializer(com).data
    return Response(data, status=201)


# ── PARTAGE ───────────────────────────────────────────
@api_view(['PATCH'])
def partage(request, pk):
    user_id = request.data.get('userId')
    try:
        pub  = Publication.objects.get(pk=pk)
        user = User.objects.get(pk=user_id)
    except (Publication.DoesNotExist, User.DoesNotExist):
        return Response({'error': 'Introuvable'}, status=404)
    pub.partages.add(user)
    return Response({'count': pub.partages.count()})
