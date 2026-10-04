# LapisTracker

A personal workout tracker: log workouts, exercises, and sets, and see progress over time.
Built as a portfolio project using a Django REST Framework backend and a React + Redux
Toolkit frontend, containerized with Docker Compose — the stack most commonly asked for
in full-stack intern postings (e.g. Formlabs FormNow: Django, React/Redux, Docker).

## Stack

- **Backend:** Django + Django REST Framework, PostgreSQL
- **Frontend:** React + Redux Toolkit, fetches the API with a small typed client
- **Infra:** Docker Compose (db + backend + frontend), ready to extend with Terraform later

## Project layout

```
LapisTracker/
├── backend/
│   ├── core/            # Django project settings/urls
│   ├── accounts/        # register / login / logout / me (DRF token auth)
│   ├── tracker/         # Workout, Exercise, SetEntry, DailyMacro models + REST API
│   ├── manage.py
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── api/         # fetch client for the Django API (adds the auth token)
│   │   ├── features/    # one folder per Redux slice: auth, workouts, sets, exercises, macros
│   │   ├── App.jsx
│   │   └── store.js
│   ├── package.json
│   └── Dockerfile
└── docker-compose.yml
```

## Data model

- **Workout** — date, workout_type (strength/cardio/hiit/mobility/other), notes, belongs to a user
- **Exercise** — name (unique per user), category (push/pull/legs/core/cardio/other), belongs to a user
- **SetEntry** — belongs to a Workout + Exercise, reps, weight_kg, order
- **DailyMacro** — date (unique per user), calories, protein_g, carbs_g, fat_g, notes

## Getting started

```bash
docker compose up --build
```

- Backend API: http://localhost:8000/api/
- Frontend: http://localhost:3000

Run migrations the first time (and after pulling changes that add migrations):

```bash
docker compose exec backend python manage.py migrate
docker compose exec backend python manage.py createsuperuser   # optional, for /admin
```

Then open the frontend and register an account.

## Authentication

The API uses DRF token authentication. Every endpoint except register and login
requires an `Authorization: Token <key>` header, and every workout, set, macro log
and exercise is scoped to the logged-in user: other users' rows return 404.

| Endpoint | Method | Purpose |
|---|---|---|
| `/api/auth/register/` | POST | Create an account, returns `{token, user}` |
| `/api/auth/login/` | POST | Returns `{token, user}` |
| `/api/auth/logout/` | POST | Deletes the token on the server |
| `/api/auth/me/` | GET | The current user |

```bash
curl -X POST localhost:8000/api/auth/login/ -H "Content-Type: application/json" \
  -d '{"username": "ahmed", "password": "..."}'
curl localhost:8000/api/workouts/ -H "Authorization: Token <key>"
```

Set `DJANGO_ALLOW_REGISTRATION=0` on the backend to stop new sign-ups.

Data created before accounts existed has no owner and is hidden by the API. To
assign it to your account:

```bash
docker compose exec backend python manage.py claim_unowned_data <username>
```

## Tests

```bash
docker compose exec backend python manage.py test
```

## Roadmap

- [x] **CRUD core** — Workout/Exercise/SetEntry/DailyMacro models, DRF viewsets, React
  views wired through Redux: log a workout, add sets, log daily macros.
- [x] **Authentication** — token auth with register/login/logout, all data scoped to
  the logged-in user, login/register screens and a Redux auth slice.
- [x] **Exercise management UI** — create, rename, recategorise and delete exercises
  from the app instead of the Django admin. An exercise that logged sets still use
  cannot be deleted (the API answers 409 and the UI shows why).
- [ ] **Progress charts** — weight per exercise over time and daily macro/calorie trends.
- [ ] **Tests + CI** — backend test suite and a GitHub Actions workflow that runs the
  tests and the frontend build.
- [ ] **Deployment** — production Docker setup and a Terraform config for AWS.

## Why this project exists

Built to close a specific, honest skills gap: hands-on Django and React/Redux
experience to go alongside existing REST API / PostgreSQL / Docker background.
