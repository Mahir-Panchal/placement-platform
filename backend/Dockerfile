FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV DJANGO_SETTINGS_MODULE=core.settings.prod

WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
    postgresql-client \
    gcc \
    python3-dev \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --upgrade pip
RUN pip install -r requirements.txt

COPY . .

# collectstatic needs SECRET_KEY — use a dummy one just for build
RUN SECRET_KEY=build-only-dummy-key python manage.py collectstatic --noinput

EXPOSE 8000

# Run migrations then start gunicorn
CMD python manage.py migrate && gunicorn core.wsgi:application --bind 0.0.0.0:$PORT --workers 2