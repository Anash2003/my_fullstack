#!/usr/bin/env bash
# exit on error
set -o errexit

pip install -r requirements.txt

if [ -d "hotel_backend" ]; then
    python hotel_backend/manage.py collectstatic --no-input
    python hotel_backend/manage.py migrate
    if [ -f "hotel_backend/data.json" ]; then
        python hotel_backend/manage.py loaddata hotel_backend/data.json || true
    fi
else
    python manage.py collectstatic --no-input
    python manage.py migrate
    if [ -f "data.json" ]; then
        python manage.py loaddata data.json || true
    fi
fi
