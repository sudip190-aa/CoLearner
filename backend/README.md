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
python -m pip install -r requirements.txt
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

The frontend instructions in the root README use port 5176; keep `FRONTEND_URL`
and CORS origins aligned if you change it. Environment variables override `.env`:
in PowerShell use `$env:DEBUG = 'True'` if your shell already defines a non-boolean
`DEBUG` value (for example `release`). Create virtual environments on this machine;
copied virtual environments may point to a Python installation on another computer.

## Production settings

Set `DJANGO_SETTINGS_MODULE=colearn.settings.prod`, a random `SECRET_KEY` of at
least 50 characters, and the PostgreSQL variables above. Set `ALLOWED_HOSTS`,
`FRONTEND_URL`, `CORS_ALLOWED_ORIGINS`, and `CSRF_TRUSTED_ORIGINS` for your HTTPS
domains, and configure SMTP. Production always disables debug mode and rejects
the example secret. Run `python manage.py check --deploy --fail-level WARNING`
with that environment. Development settings intentionally report HTTPS/security
warnings under `--deploy` because local development uses HTTP.

The supplied Dockerfile/Compose command uses the development server. A production
deployment must use a WSGI/ASGI server and a reverse proxy. The proxy must overwrite
`X-Forwarded-Proto`, serve `STATIC_ROOT` after `collectstatic`, and serve uploaded
media from persistent storage. The frontend host must serve the Vite build and
fall back to `index.html` for client routes. These external services require
deployment verification; passing Django checks alone does not verify them.

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
