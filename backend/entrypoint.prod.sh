#!/bin/sh
# Start-up script for the production backend container.
set -e

# Apply database migrations. The database may still be starting, so retry
# for up to a minute before giving up.
attempt=1
until python manage.py migrate --noinput; do
  if [ "$attempt" -ge 30 ]; then
    echo "Database not reachable after $attempt attempts, giving up." >&2
    exit 1
  fi
  echo "Migrate failed (attempt $attempt), retrying in 2s..." >&2
  attempt=$((attempt + 1))
  sleep 2
done

# Copy the Django admin's CSS/JS into STATIC_ROOT, a volume that nginx serves.
python manage.py collectstatic --noinput

# exec replaces this shell with gunicorn so it receives stop signals directly.
# 3 workers is the usual (2 x CPU cores) + 1 for a single small instance.
exec gunicorn core.wsgi:application \
  --bind 0.0.0.0:8000 \
  --workers "${GUNICORN_WORKERS:-3}" \
  --access-logfile - \
  --error-logfile -
