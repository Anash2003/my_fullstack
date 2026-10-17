"""
your_application entrypoint for Render's default Start Command: 'gunicorn your_application.wsgi'
"""
import os
import sys
from pathlib import Path

# Locate hotel_backend directory
base_dir = Path(__file__).resolve().parent
hotel_backend_dir = base_dir / 'hotel_backend'

if str(hotel_backend_dir) not in sys.path:
    sys.path.insert(0, str(hotel_backend_dir))
if str(base_dir) not in sys.path:
    sys.path.insert(0, str(base_dir))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'hotel_backend.settings')

# Ensure Django is initialized
import django
django.setup()

# Auto-migrate database on start so all tables exist on Render
try:
    from django.core.management import call_command
    call_command('migrate', interactive=False)
except Exception as err:
    print(f"Auto-migration info: {err}")

# Auto-load initial fixture data if database is empty
try:
    from api.models import RoomCategory
    if RoomCategory.objects.count() == 0:
        fixture_file = hotel_backend_dir / 'data.json'
        if fixture_file.exists():
            call_command('loaddata', str(fixture_file))
            print("Successfully loaded initial data fixture.")
except Exception as err:
    print(f"Fixture load info: {err}")

from django.core.wsgi import get_wsgi_application
application = get_wsgi_application()

# Gunicorn aliases
wsgi = application
app = application
