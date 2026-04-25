# 🌱 AgroConnect Sénégal — Version Django

Backend entièrement reconstruit avec **Django + Django REST Framework + Django Channels**.
Toutes les fonctionnalités sont identiques à la version Node.js.

## 📁 Structure du projet

```
agroconnect/
├── backend_django/          ← Backend Python/Django
│   ├── api/
│   │   ├── models.py        ← User, Publication, Commentaire, Notification
│   │   ├── serializers.py   ← Sérialisation JSON
│   │   ├── views_users.py   ← Routes utilisateurs
│   │   ├── views_publications.py ← Routes publications
│   │   ├── views_notifications.py
│   │   ├── views_upload.py  ← Upload images (local/Cloudinary)
│   │   ├── consumers.py     ← WebSocket (Django Channels)
│   │   ├── scheduler.py     ← Auto-poster (remplace node-cron)
│   │   ├── seed.py          ← Données initiales sénégalaises
│   │   └── urls.py          ← Toutes les routes /api/
│   ├── agroconnect_django/
│   │   ├── settings.py      ← Config (SQLite/PostgreSQL, Redis, Cloudinary)
│   │   ├── urls.py          ← Routes principales + SPA fallback
│   │   └── asgi.py          ← HTTP + WebSocket (Daphne)
│   ├── requirements.txt
│   ├── build.sh             ← Script de build pour Render
│   ├── Procfile             ← Pour Railway/Heroku
│   └── manage.py
├── frontend/                ← React + Vite (inchangé)
├── render.yaml              ← Déploiement Render en un clic
└── README.md
```

---

## 💻 Développement local

### Backend

```bash
cd backend_django

# Environnement virtuel
python -m venv venv
source venv/bin/activate   # Linux/Mac
# venv\Scripts\activate    # Windows

# Dépendances
pip install -r requirements.txt

# Base de données
python manage.py migrate
python manage.py seed

# Lancer le serveur (ASGI = HTTP + WebSocket)
daphne -p 8000 agroconnect_django.asgi:application
# → API disponible sur http://localhost:8000/api/
# → WebSocket sur  ws://localhost:8000/ws/
```

### Frontend

```bash
cd frontend
npm install
npm run dev
# → http://localhost:3000  (proxy vers Django sur :8000)
```

---

## 🚀 Déploiement production (sans Docker)

### Option A — Render (recommandé, gratuit)

**Backend + base de données PostgreSQL incluse :**

1. Pousser le projet sur GitHub
2. [render.com](https://render.com) → **New → Blueprint** → sélectionner `render.yaml`
3. Render crée automatiquement :
   - Le service web Django
   - La base de données PostgreSQL
4. Ajouter les variables Cloudinary dans les paramètres Render
5. URL générée : `https://agroconnect-backend.onrender.com`

**Frontend :**

1. [vercel.com](https://vercel.com) → **New Project** → dossier `frontend/`
2. Variables d'environnement :
   ```
   VITE_API_URL     = https://agroconnect-backend.onrender.com/api
   VITE_BACKEND_URL = https://agroconnect-backend.onrender.com
   ```
3. Build : `npm run build` / Output : `dist`

---

### Option B — VPS (serveur propre)

```bash
# Sur votre serveur Ubuntu
git clone https://github.com/votre-repo/agroconnect.git
cd agroconnect/backend_django

python -m venv venv && source venv/bin/activate
pip install -r requirements.txt

# Variables d'environnement
cp .env.example .env
nano .env  # Remplir les valeurs

python manage.py migrate
python manage.py seed
python manage.py collectstatic --noinput

# Lancer avec Daphne (ASGI)
daphne -b 0.0.0.0 -p 8000 agroconnect_django.asgi:application

# Ou en production avec Supervisor/systemd
# Voir la section "Serveur systemd" ci-dessous
```

**Service systemd :**

```ini
# /etc/systemd/system/agroconnect.service
[Unit]
Description=AgroConnect Django
After=network.target

[Service]
User=ubuntu
WorkingDirectory=/home/ubuntu/agroconnect/backend_django
EnvironmentFile=/home/ubuntu/agroconnect/backend_django/.env
ExecStart=/home/ubuntu/agroconnect/backend_django/venv/bin/daphne \
    -b 0.0.0.0 -p 8000 agroconnect_django.asgi:application
Restart=always

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable agroconnect
sudo systemctl start agroconnect
```

---

## 🔑 Comptes par défaut

| Rôle     | Email                    | Mot de passe |
|----------|--------------------------|--------------|
| 👑 Admin  | admin@agroconnect.sn     | admin123     |
| 🌾 User   | khoury.badji@agro.sn     | user123      |
| 🥕 User   | fatou.ndiaye@agro.sn     | user123      |
| 💧 User   | ibrahima.sy@agro.sn      | user123      |
| 🥜 User   | aminata.cisse@agro.sn    | user123      |
| 🐄 User   | oumar.thiaw@agro.sn      | user123      |

---

## 📡 API — Tous les endpoints

```
# Auth
POST   /api/users/register
POST   /api/users/login

# Utilisateurs
GET    /api/users/                         → liste (sans admins)
GET    /api/users/all                      → liste complète
GET    /api/users/search/query?q=...       → recherche
GET    /api/users/:id
PATCH  /api/users/:id
GET    /api/users/:id/feed
GET    /api/users/:id/publications
PATCH  /api/users/:id/follow
PATCH  /api/users/:id/save/:pubId
PATCH  /api/users/:id/statut              → admin seulement

# Publications
GET    /api/publications/?tag=&sort=&limit=&skip=
POST   /api/publications/
GET    /api/publications/en-attente        → admin
GET    /api/publications/top3
GET    /api/publications/stats             → admin
GET    /api/publications/tag/:tag
GET    /api/publications/:id
DELETE /api/publications/:id
PATCH  /api/publications/:id/moderer       → admin
PATCH  /api/publications/:id/like
POST   /api/publications/:id/commentaires
PATCH  /api/publications/:id/commentaires/:cid/like
POST   /api/publications/:id/commentaires/:cid/reponses
PATCH  /api/publications/:id/partage

# Notifications
GET    /api/notifications/:userId
PATCH  /api/notifications/:userId/read-all

# Upload
POST   /api/upload/                        → multipart, champ "images"

# Santé
GET    /api/health
```

## 🔌 WebSocket

```
ws://localhost:8000/ws/          ← développement
wss://votre-app.onrender.com/ws/ ← production
```

Après connexion, envoyer :
```json
{ "type": "join_user", "userId": 42 }
```

Événements reçus (même interface qu'avant) :
```
notification        → like, follow, commentaire, approbation, rejet, suspension
publication_created → nouvelle publication approuvée
publication_deleted → publication supprimée
pending_post        → post en attente (admin)
like_update         → mise à jour des likes
comment_added       → nouveau commentaire
new_post            → un suivi vient de publier
```
