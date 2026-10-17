"""
WSGI config proxy for Render default start command: 'gunicorn your_application.wsgi'
"""
import os
import sys
from pathlib import Path

# Add hotel_backend directory to sys.path
BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR / 'hotel_backend'))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'hotel_backend.settings')

from django.core.wsgi import get_wsgi_application
application = get_wsgi_application()
app = application
