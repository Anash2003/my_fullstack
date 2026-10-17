"""
WSGI config proxy for Render default start command: 'gunicorn your_application.wsgi'
"""
import os
import sys
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR / 'hotel_backend'))
sys.path.insert(0, str(BASE_DIR))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'hotel_backend.settings')

import django
django.setup()

from django.core.wsgi import get_wsgi_application
application = get_wsgi_application()
wsgi = application
app = application
