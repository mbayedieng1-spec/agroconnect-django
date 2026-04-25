from django.core.management.base import BaseCommand
from api.seed import run

class Command(BaseCommand):
    help = 'Seed the database with initial data'
    def handle(self, *args, **kwargs):
        run()
