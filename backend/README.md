# Colearn Backend

Django 4.2 + DRF backend for the Colearn platform.

## Requirements

- Python 3.12+
- PostgreSQL (recommended for production; local development falls back to SQLite when `DB_ENGINE` is unset)

## Setup

```bash
cd backend
py -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
python -m pip install "Django==4.2.*" djangorestframework djangorestframework-simplejwt django-cors-headers django-filter psycopg2-binary python-decouple Pillow drf-spectacular django-extensions
copy .env.example .env
```

Update `.env` as needed. For PostgreSQL, set:

```env
DB_ENGINE=postgresql
DB_NAME=colearn
DB_USER=colearn
DB_PASSWORD=colearn
DB_HOST=localhost
DB_PORT=5432
```

## Run locally

```bash
cd backend
.\.venv\Scripts\Activate.ps1
python manage.py migrate
python manage.py runserver 0.0.0.0:8000
```

## API docs

- Swagger UI: http://localhost:8000/api/docs/
- OpenAPI schema: http://localhost:8000/api/schema/
- Health check: http://localhost:8000/api/v1/health/

## Notes

- The app uses a custom user model in `users.CustomUser`.
- The admin branding uses the same official logo asset stored in `backend/static/logo.png`.
