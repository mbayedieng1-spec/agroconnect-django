from django.urls import path
from . import views_users, views_publications, views_notifications, views_upload

urlpatterns = [
    # ── Users ──────────────────────────────────────────
    path('users/register',              views_users.register),
    path('users/login',                 views_users.login),
    path('users/search/query',          views_users.search_users),
    path('users/all',                   views_users.list_users_all),
    path('users/',                      views_users.list_users),
    path('users/<int:pk>',              views_users.user_detail),
    path('users/<int:pk>/feed',         views_users.user_feed),
    path('users/<int:pk>/publications', views_users.user_publications),
    path('users/<int:pk>/follow',       views_users.follow),
    path('users/<int:pk>/save/<int:pub_id>', views_users.save_post),
    path('users/<int:pk>/statut',       views_users.update_statut),

    # ── Publications (avec et sans slash) ──────────────
    path('publications/',               views_publications.publications),
    path('publications',                views_publications.publications),
    path('publications/en-attente',     views_publications.en_attente),
    path('publications/top3',           views_publications.top3),
    path('publications/stats',          views_publications.stats),
    path('publications/tag/<str:tag>',  views_publications.by_tag),
    path('publications/<int:pk>',       views_publications.publication_detail),
    path('publications/<int:pk>/moderer',        views_publications.moderer),
    path('publications/<int:pk>/like',           views_publications.like),
    path('publications/<int:pk>/commentaires',   views_publications.add_commentaire),
    path('publications/<int:pk>/commentaires/<int:cid>/like',     views_publications.like_commentaire),
    path('publications/<int:pk>/commentaires/<int:cid>/reponses', views_publications.add_reponse),
    path('publications/<int:pk>/partage',        views_publications.partage),

    # ── Notifications ──────────────────────────────────
    path('notifications/<int:user_id>',           views_notifications.list_notifications),
    path('notifications/<int:user_id>/read-all',  views_notifications.read_all),

    # ── Upload (avec et sans slash) ────────────────────
    path('upload/',                     views_upload.upload_images),
    path('upload',                      views_upload.upload_images),
]
