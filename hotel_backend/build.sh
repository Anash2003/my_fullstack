#!/usr/bin/env bash
# exit on error
set -o errexit

pip install -r requirements.txt
python manage.py collectstatic --no-input
python manage.py migrate
if [ -f "data.json" ]; then
    python manage.py loaddata data.json || true
fi
