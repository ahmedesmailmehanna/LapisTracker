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
│   ├── tracker/         # Django app: Workout, Exercise, Set models + REST API
│   ├── manage.py
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── api/         # fetch client for the Django API
│   │   ├── features/workouts/   # Redux slice + components
│   │   ├── App.jsx
│   │   └── store.js
│   ├── package.json
│   └── Dockerfile
└── docker-compose.yml
```

## Data model (v1)

- **Workout** — date, workout_type (strength/cardio/hiit/mobility/other), notes, belongs to a user
- **Exercise** — name, category (e.g. push/pull/legs/cardio)
- **SetEntry** — belongs to a Workout + Exercise, reps, weight_kg, order
- **DailyMacro** — date (unique per user), calories, protein_g, carbs_g, fat_g, notes

## Getting started

```bash
docker compose up --build
```

- Backend API: http://localhost:8000/api/
- Frontend: http://localhost:3000

Run migrations the first time:

```bash
docker compose exec backend python manage.py migrate
docker compose exec backend python manage.py createsuperuser
```

## Roadmap / milestones

This is intentionally scoped as a series of small, shippable milestones rather than
one big build:

1. **v1 — CRUD core** (this scaffold): Workout/Exercise/SetEntry/DailyMacro models, DRF
   viewsets, React views wired through Redux — log a workout with a type, add sets
   (exercise/reps/weight) to it, and log daily macros (calories/protein/carbs/fat).
2. **v2 — Auth**: per-user accounts (Django auth + DRF token or session auth), so
   workouts are scoped to the logged-in user.
3. **v3 — Progress views**: a simple chart (e.g. weight lifted over time per exercise)
   using the logged data — good place to practice Redux selectors and derived state.
4. **v4 — Deploy**: containers pushed to a small cloud target (Render/Fly.io/AWS) with
   a minimal Terraform config for the DB + app — the piece that turns "Docker" into
   "Docker + basic infra-as-code" on a resume.

## Why this project exists

Built to close a specific, honest skills gap: hands-on Django and React/Redux
experience to go alongside existing REST API / PostgreSQL / Docker background.
