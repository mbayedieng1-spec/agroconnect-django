from rest_framework import serializers
from .models import User, Publication, Commentaire, Reponse, Notification


class UserMiniSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'pseudo', 'avatar', 'nom', 'prenom', 'region', 'type_culture', 'role']


class UserSerializer(serializers.ModelSerializer):
    followers     = UserMiniSerializer(many=True, read_only=True)
    following_set = UserMiniSerializer(many=True, read_only=True)
    followers_count = serializers.SerializerMethodField()
    following_count = serializers.SerializerMethodField()
    saved_posts   = serializers.PrimaryKeyRelatedField(many=True, read_only=True)

    class Meta:
        model = User
        fields = [
            'id', 'pseudo', 'nom', 'prenom', 'email', 'region', 'type_culture',
            'avatar', 'bio', 'cover_color', 'role', 'statut',
            'followers', 'following_set', 'followers_count', 'following_count',
            'saved_posts', 'created_at', 'updated_at'
        ]

    def get_followers_count(self, obj):
        return obj.followers.count()

    def get_following_count(self, obj):
        return obj.following_set.count()

    def to_representation(self, instance):
        data = super().to_representation(instance)
        # Rename following_set → following for API compat
        data['following'] = data.pop('following_set')
        # Map cover_color → coverColor for frontend compat
        data['coverColor'] = data.pop('cover_color')
        # Map mot_de_passe omitted (never returned)
        return data


class ReponseSerializer(serializers.ModelSerializer):
    auteur = UserMiniSerializer(read_only=True)

    class Meta:
        model = Reponse
        fields = ['id', 'auteur', 'texte', 'date']


class CommentaireSerializer(serializers.ModelSerializer):
    auteur  = UserMiniSerializer(read_only=True)
    reponses = ReponseSerializer(many=True, read_only=True)
    likes_count = serializers.SerializerMethodField()
    likes   = serializers.SerializerMethodField()

    class Meta:
        model = Commentaire
        fields = ['id', 'auteur', 'texte', 'likes', 'likes_count', 'reponses', 'date']

    def get_likes_count(self, obj):
        return obj.likes.count()

    def get_likes(self, obj):
        return list(obj.likes.values_list('id', flat=True))


class PublicationSerializer(serializers.ModelSerializer):
    auteur       = UserMiniSerializer(read_only=True)
    commentaires = CommentaireSerializer(many=True, read_only=True)
    likes        = serializers.SerializerMethodField()
    likes_count  = serializers.SerializerMethodField()
    partages_count = serializers.SerializerMethodField()

    class Meta:
        model = Publication
        fields = [
            'id', 'auteur', 'contenu', 'images', 'tags',
            'likes', 'likes_count', 'commentaires', 'partages_count',
            'vues', 'feeling', 'localisation', 'statut', 'date',
            'created_at', 'updated_at'
        ]

    def get_likes(self, obj):
        return list(obj.likes.values_list('id', flat=True))

    def get_likes_count(self, obj):
        return obj.likes.count()

    def get_partages_count(self, obj):
        return obj.partages.count()


class NotificationSerializer(serializers.ModelSerializer):
    expediteur  = UserMiniSerializer(read_only=True)
    publication = serializers.SerializerMethodField()

    class Meta:
        model = Notification
        fields = ['id', 'expediteur', 'type', 'publication', 'message', 'lu', 'date']

    def get_publication(self, obj):
        if obj.publication:
            return {'id': obj.publication.id, 'contenu': obj.publication.contenu[:100]}
        return None
