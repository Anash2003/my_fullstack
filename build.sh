#!/usr/bin/env bash
# exit on error
set -o errexit

pip install -r requirements.txt

if [ -d "hotel_backend" ]; then
    python hotel_backend/manage.py collectstatic --no-input
    python hotel_backend/manage.py migrate
else
    python manage.py collectstatic --no-input
    python manage.py migrate
fi
