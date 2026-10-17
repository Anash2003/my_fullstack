#!/usr/bin/env python
"""
Root manage.py proxy to hotel_backend/manage.py
"""
import os
import sys
from pathlib import Path

def main():
    sys.path.insert(0, str(Path(__file__).resolve().parent / 'hotel_backend'))
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'hotel_backend.settings')
    from django.core.management import execute_from_command_line
    execute_from_command_line(sys.argv)

if __name__ == '__main__':
    main()
