#!/usr/bin/env bash
set -e

echo "📦 Installation des dépendances Python..."
pip install -r requirements.txt

echo "🗄️  Application des migrations..."
python manage.py migrate

echo "🌱 Initialisation de la base de données..."
python manage.py seed

echo "📁 Collecte des fichiers statiques..."
python manage.py collectstatic --noinput

echo "✅ Build terminé !"
