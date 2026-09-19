# CoLearner

CoLearner is a learning and collaboration platform where people learn from curated books, build projects with peers, and share their progress.

## Repository layout

- `backend/`: Django 4.2 and Django REST Framework API
- `CoLearner/`: React and Vite frontend

## Local development

### Backend

```powershell
cd backend
py -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
python manage.py migrate
python manage.py runserver 127.0.0.1:8000
```

The API is available at `http://127.0.0.1:8000/`.

### Frontend

In a second terminal:

```powershell
cd CoLearner
npm install
npm run dev -- --host 127.0.0.1 --port 5176
```

The frontend is available at `http://127.0.0.1:5176/`.

Set `VITE_API_URL` in `CoLearner/.env` to override the API URL. The default local API URL follows the browser hostname and uses port `8000`.

## Validation

Frontend:

```powershell
cd CoLearner
npm run lint
npm run build
```

Backend:

```powershell
cd backend
python -m pytest
```

## API documentation

- Swagger UI: `http://127.0.0.1:8000/api/docs/`
- OpenAPI schema: `http://127.0.0.1:8000/api/schema/`
