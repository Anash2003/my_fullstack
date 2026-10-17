"""
Package entrypoint for your_application
"""
import os
import sys
from pathlib import Path

base_dir = Path(__file__).resolve().parent.parent
hotel_backend_dir = base_dir / 'hotel_backend'

if str(hotel_backend_dir) not in sys.path:
    sys.path.insert(0, str(hotel_backend_dir))
if str(base_dir) not in sys.path:
    sys.path.insert(0, str(base_dir))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'hotel_backend.settings')

import django
django.setup()

from django.core.wsgi import get_wsgi_application
application = get_wsgi_application()
wsgi = application
app = application
