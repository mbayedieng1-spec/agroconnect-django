from django.db import models
from django.utils import timezone


class User(models.Model):
    ROLE_CHOICES = [('admin', 'Admin'), ('user', 'User')]
    STATUT_CHOICES = [('actif', 'Actif'), ('suspendu', 'Suspendu'), ('en_attente', 'En attente')]

    pseudo        = models.CharField(max_length=100, unique=True)
    nom           = models.CharField(max_length=100)
    prenom        = models.CharField(max_length=100)
    email         = models.EmailField(unique=True)
    mot_de_passe  = models.CharField(max_length=255)
    region        = models.CharField(max_length=100)
    type_culture  = models.CharField(max_length=100)
    avatar        = models.CharField(max_length=10, default='🌱')
    bio           = models.TextField(blank=True, default='')
    cover_color   = models.CharField(max_length=20, default='#1a4731')
    role          = models.CharField(max_length=10, choices=ROLE_CHOICES, default='user')
    statut        = models.CharField(max_length=20, choices=STATUT_CHOICES, default='actif')
    followers     = models.ManyToManyField('self', symmetrical=False, related_name='following_set', blank=True)
    saved_posts   = models.ManyToManyField('Publication', related_name='saved_by', blank=True)
    created_at    = models.DateTimeField(auto_now_add=True)
    updated_at    = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'users'

    def __str__(self):
        return self.pseudo


class Publication(models.Model):
    STATUT_CHOICES = [('approuve', 'Approuvé'), ('en_attente', 'En attente'), ('rejete', 'Rejeté')]

    auteur        = models.ForeignKey(User, on_delete=models.CASCADE, related_name='publications')
    contenu       = models.TextField()
    images        = models.JSONField(default=list)
    tags          = models.JSONField(default=list)
    likes         = models.ManyToManyField(User, related_name='liked_publications', blank=True)
    partages      = models.ManyToManyField(User, related_name='shared_publications', blank=True)
    vues          = models.IntegerField(default=0)
    feeling       = models.CharField(max_length=100, blank=True, default='')
    localisation  = models.CharField(max_length=200, blank=True, default='')
    statut        = models.CharField(max_length=20, choices=STATUT_CHOICES, default='en_attente')
    date          = models.DateTimeField(default=timezone.now)
    created_at    = models.DateTimeField(auto_now_add=True)
    updated_at    = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'publications'
        ordering = ['-date']


class Commentaire(models.Model):
    publication   = models.ForeignKey(Publication, on_delete=models.CASCADE, related_name='commentaires')
    auteur        = models.ForeignKey(User, on_delete=models.CASCADE, related_name='commentaires')
    texte         = models.TextField()
    likes         = models.ManyToManyField(User, related_name='liked_commentaires', blank=True)
    date          = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = 'commentaires'
        ordering = ['date']


class Reponse(models.Model):
    commentaire   = models.ForeignKey(Commentaire, on_delete=models.CASCADE, related_name='reponses')
    auteur        = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reponses')
    texte         = models.TextField()
    date          = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = 'reponses'
        ordering = ['date']


class Notification(models.Model):
    TYPE_CHOICES = [
        ('like', 'Like'), ('commentaire', 'Commentaire'), ('follow', 'Follow'),
        ('partage', 'Partage'), ('nouveau_post', 'Nouveau post'), ('approbation', 'Approbation'),
        ('rejet', 'Rejet'), ('suspension', 'Suspension'),
    ]
    destinataire  = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications_recues')
    expediteur    = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications_envoyees')
    type          = models.CharField(max_length=20, choices=TYPE_CHOICES)
    publication   = models.ForeignKey(Publication, on_delete=models.SET_NULL, null=True, blank=True)
    message       = models.TextField(blank=True, default='')
    lu            = models.BooleanField(default=False)
    date          = models.DateTimeField(default=timezone.now)
    created_at    = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'notifications'
        ordering = ['-date']
