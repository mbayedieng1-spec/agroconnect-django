"""Auto-poster: publishes a random post every minute (equivalent to node-cron)."""
import random
import threading

AUTO_POSTS = [
    {'contenu': '🌤️ Beau temps cette semaine, idéal pour les travaux de la saison !', 'tags': ['météo','conseil']},
    {'contenu': "💧 Pensez à vérifier vos systèmes d'irrigation avant la saison chaude.", 'tags': ['irrigation','eau']},
    {'contenu': '🐛 Alerte ravageurs sur les cultures dans plusieurs régions du Sénégal !', 'tags': ['ravageurs','alerte']},
    {'contenu': "📈 Les cours de l'arachide en hausse cette semaine. Bonne nouvelle !", 'tags': ['arachide','marché']},
    {'contenu': "🌱 Astuce : associer des légumineuses à vos céréales fixe l'azote naturellement !", 'tags': ['légumineuses','astuce']},
    {'contenu': '🚜 Rappel : entretien préventif avant les grands travaux de la saison.', 'tags': ['matériel','entretien']},
    {'contenu': "🌾 La saison de l'hivernage approche. Avez-vous préparé vos semences ?", 'tags': ['hivernage','semences']},
    {'contenu': "🥜 Partage d'expérience sur la culture de l'arachide en rotation avec le mil.", 'tags': ['arachide','mil','rotation']},
    {'contenu': '🍅 Les tomates de saison arrivent ! Qui a de bonnes variétés à recommander ?', 'tags': ['tomates','maraîchage']},
    {'contenu': '🐄 La période de reproduction des bovins approche. Préparez votre troupeau !', 'tags': ['élevage','bovins']},
]

_timer = None
_started = False


def _auto_post():
    global _timer
    try:
        import django
        from django.apps import apps
        if not apps.ready:
            return

        from api.models import User, Publication
        from api.serializers import PublicationSerializer
        from api.utils import broadcast, emit_to_user

        users = list(User.objects.filter(statut='actif'))
        if not users:
            return

        author   = random.choice(users)
        post_data = random.choice(AUTO_POSTS)
        statut   = 'approuve' if author.role == 'admin' else 'en_attente'
        pub = Publication.objects.create(auteur=author, statut=statut, **post_data)

        from api.views_publications import qs_full
        full = qs_full(Publication.objects.filter(pk=pub.pk)).first()
        data = PublicationSerializer(full).data

        if statut == 'approuve':
            broadcast('publication_created', data)
        else:
            try:
                admin = User.objects.get(role='admin')
                emit_to_user(admin.pk, 'pending_post', data)
                emit_to_user(admin.pk, 'notification', {'type': 'nouveau_post', 'from': author.pseudo})
            except User.DoesNotExist:
                pass

        print(f'📝 Auto-post [{statut}] par {author.pseudo}')
    except Exception as e:
        print(f'Auto-post error: {e}')
    finally:
        _timer = threading.Timer(60, _auto_post)
        _timer.daemon = True
        _timer.start()


def start():
    global _started, _timer
    if _started:
        return
    _started = True
    _timer = threading.Timer(60, _auto_post)
    _timer.daemon = True
    _timer.start()
    print('⏱️  Auto-poster démarré (toutes les 60s)')
