#!/bin/bash

echo "Waiting for PostgreSQL..."
while ! pg_isready -h $DB_HOST -p 5432 -q; do
    sleep 1
done
echo "PostgreSQL is ready!"

echo "Running migrations..."
python manage.py migrate

echo "Starting server..."
exec "$@"