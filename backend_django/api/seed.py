"""Seed script — equivalent to the Node.js seed.js"""
import random
from datetime import timedelta
from django.utils import timezone
from .models import User, Publication, Commentaire

USERS = [
    dict(pseudo='admin_agroconnect', nom='Diallo', prenom='Mamadou',
         email='admin@agroconnect.sn', mot_de_passe='admin123',
         region='Dakar', type_culture='Administration',
         avatar='👑', bio='Administrateur de la plateforme AgroConnect Sénégal.',
         cover_color='#7c2d12', role='admin', statut='actif'),
    dict(pseudo='khoury_casamance', nom='Badji', prenom='Khoury',
         email='khoury.badji@agro.sn', mot_de_passe='user123',
         region='Ziguinchor', type_culture='Riziculture',
         avatar='🌾', bio='Riziculteur en Casamance depuis 15 ans.',
         cover_color='#14532d', statut='actif'),
    dict(pseudo='fatou_thiès', nom='Ndiaye', prenom='Fatou',
         email='fatou.ndiaye@agro.sn', mot_de_passe='user123',
         region='Thiès', type_culture='Maraîchage',
         avatar='🥕', bio='Maraîchère bio à Thiès.', cover_color='#1a3a2a', statut='actif'),
    dict(pseudo='ibrahima_st_louis', nom='Sy', prenom='Ibrahima',
         email='ibrahima.sy@agro.sn', mot_de_passe='user123',
         region='Saint-Louis', type_culture='Maraîchage irrigué',
         avatar='💧', bio='Agriculture irriguée dans la vallée du fleuve Sénégal.',
         cover_color='#1e3a5f', statut='actif'),
    dict(pseudo='aminata_kaolack', nom='Cissé', prenom='Aminata',
         email='aminata.cisse@agro.sn', mot_de_passe='user123',
         region='Kaolack', type_culture='Arachide',
         avatar='🥜', bio="Productrice d'arachide dans le bassin arachidier.",
         cover_color='#422006', statut='actif'),
    dict(pseudo='oumar_louga', nom='Thiaw', prenom='Oumar',
         email='oumar.thiaw@agro.sn', mot_de_passe='user123',
         region='Louga', type_culture='Élevage Bovin',
         avatar='🐄', bio='Éleveur de zébus dans la zone sylvopastorale.',
         cover_color='#2a2a1a', statut='actif'),
    dict(pseudo='rokhaya_diourbel', nom='Fall', prenom='Rokhaya',
         email='rokhaya.fall@agro.sn', mot_de_passe='user123',
         region='Diourbel', type_culture='Mil & Sorgho',
         avatar='🌽', bio="Cultivatrice de mil et sorgho.",
         cover_color='#3b2714', statut='actif'),
    dict(pseudo='moussa_tambacounda', nom='Kouyaté', prenom='Moussa',
         email='moussa.kouyate@agro.sn', mot_de_passe='user123',
         region='Tambacounda', type_culture='Coton & Maïs',
         avatar='🌱', bio='Agriculteur à Tambacounda.', cover_color='#064e3b', statut='actif'),
    dict(pseudo='adja_kolda', nom='Diatta', prenom='Adja',
         email='adja.diatta@agro.sn', mot_de_passe='user123',
         region='Kolda', type_culture='Arboriculture',
         avatar='🥭', bio='Arboricultrice spécialisée dans la mangue.',
         cover_color='#7c2d12', statut='actif'),
    dict(pseudo='serigne_matam', nom='Mbaye', prenom='Serigne',
         email='serigne.mbaye@agro.sn', mot_de_passe='user123',
         region='Matam', type_culture='Gomme arabique & Mil',
         avatar='🌿', bio='Cultivateur et collecteur de gomme arabique.',
         cover_color='#78350f', statut='actif'),
    dict(pseudo='ndèye_kédougou', nom='Camara', prenom='Ndèye',
         email='ndeye.camara@agro.sn', mot_de_passe='user123',
         region='Kédougou', type_culture='Permaculture',
         avatar='♻️', bio='Pionnière de la permaculture à Kédougou.',
         cover_color='#14532d', statut='actif'),
]

POSTS = [
    dict(i=1, contenu="Belle récolte de riz cette saison malgré la variabilité des pluies en Casamance ! 🌾", tags=['riziculture','casamance','récolte'], feeling='😊 Satisfait', localisation='Ziguinchor', statut='approuve'),
    dict(i=2, contenu="Installation d'un nouveau système d'irrigation goutte-à-goutte dans mon champ de tomates à Thiès 💧", tags=['irrigation','tomates','thiès'], feeling='🚀 Enthousiaste', statut='approuve'),
    dict(i=3, contenu="La vallée du fleuve Sénégal offre des conditions idéales pour le maraîchage irrigué 🌊", tags=['maraîchage','saint-louis','fleuve'], feeling='❤️ Passionné', localisation='Saint-Louis', statut='approuve'),
    dict(i=4, contenu="La campagne arachide 2024 se présente bien dans le bassin arachidier ! 🥜", tags=['arachide','kaolack','bassin-arachidier'], feeling='🎉 Optimiste', statut='approuve'),
    dict(i=5, contenu="Problème de transhumance et de conflits avec les agriculteurs cette saison 😟", tags=['élevage','transhumance','louga'], feeling='🤔 Préoccupé', statut='approuve'),
    dict(i=6, contenu="La culture associée mil-niébé est vraiment efficace à Diourbel ! 🌾", tags=['mil','niébé','diourbel'], feeling='📚 Inspiré', statut='approuve'),
    dict(i=7, contenu="Notre coopérative de Tambacounda a signé un contrat avec un acheteur européen pour la noix de cajou biologique 🌿", tags=['cajou','tambacounda','bio'], feeling='🎉 Fier', statut='approuve'),
    dict(i=8, contenu="La mangue Amélie de Kolda est en train de conquérir les marchés ! 🥭", tags=['mangue','kolda','export'], feeling='🚀 Ambitieux', statut='approuve'),
    dict(i=9, contenu="Collecte de gomme arabique record cette année à Matam ! 🌿", tags=['gomme-arabique','matam','agroforesterie'], feeling='😌 Satisfait', statut='approuve'),
    dict(i=10, contenu="Ouverture de mon centre de formation en permaculture à Kédougou ce mois-ci ! ♻️", tags=['permaculture','kédougou','formation'], feeling='📚 Inspiré', localisation='Kédougou', statut='approuve'),
    dict(i=2, contenu="Question : quelles variétés d'oignons recommandez-vous pour la saison froide à Thiès ? 🌱", tags=['oignon','thiès','conseil'], feeling='🤔 Questionneur', statut='en_attente'),
    dict(i=4, contenu="Transformation de l'arachide : nouveaux équipements de presse à huile reçus ! 🥜", tags=['arachide','transformation','huile'], feeling='🎉 Fier', statut='en_attente'),
]

COMMENTS = [
    "Très intéressant, merci pour le partage !",
    "Même problème chez nous, tu peux me contacter ?",
    "Félicitations pour ces résultats !",
    "Quelle variété tu utilises exactement ?",
    "Baraka, very good ! 👍",
    "Ndax waaw, c'est bien ça !",
    "On devrait organiser un échange entre producteurs.",
]


def run():
    if User.objects.count() >= 10:
        print('🌱 Base déjà initialisée')
        return

    User.objects.all().delete()
    Publication.objects.all().delete()

    users = []
    for data in USERS:
        u = User.objects.create(**data)
        users.append(u)
    print(f'✅ {len(users)} utilisateurs insérés (dont 1 admin)')

    non_admins = [u for u in users if u.role != 'admin']

    # Follow relations
    for user in non_admins:
        others = [u for u in non_admins if u.pk != user.pk]
        to_follow = random.sample(others, min(random.randint(2, 4), len(others)))
        for f in to_follow:
            user.followers.add(f)

    # Publications
    for p in POSTS:
        author = users[p['i']]
        days_ago = random.randint(0, 10)
        pub = Publication.objects.create(
            auteur=author,
            contenu=p['contenu'],
            tags=p['tags'],
            feeling=p.get('feeling', ''),
            localisation=p.get('localisation', ''),
            statut=p['statut'],
            date=timezone.now() - timedelta(days=days_ago, seconds=random.randint(0, 86400)),
        )
        likers = random.sample(non_admins, min(random.randint(0, 5), len(non_admins)))
        for liker in likers:
            pub.likes.add(liker)

        for _ in range(random.randint(0, 2)):
            commenter = random.choice(non_admins)
            Commentaire.objects.create(
                publication=pub, auteur=commenter,
                texte=random.choice(COMMENTS)
            )

    print(f'✅ {len(POSTS)} publications insérées')
    print('👑 Admin : admin@agroconnect.sn / admin123')
