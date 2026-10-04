# LapisTracker

A personal workout tracker: log workouts, exercises, and sets, and see progress over time.
Built as a portfolio project using a Django REST Framework backend and a React + Redux
Toolkit frontend, containerized with Docker Compose — the stack most commonly asked for
in full-stack intern postings (e.g. Formlabs FormNow: Django, React/Redux, Docker).

## Stack

- **Backend:** Django + Django REST Framework, PostgreSQL
- **Frontend:** React + Redux Toolkit, fetches the API with a small typed client
- **Infra:** Docker Compose for development and production, GitHub Actions CI,
  Terraform configuration for AWS (EC2 + RDS)

## Project layout

```
LapisTracker/
├── backend/
│   ├── core/            # Django project settings/urls
│   ├── accounts/        # register / login / logout / me (DRF token auth)
│   ├── tracker/         # Workout, Exercise, SetEntry, DailyMacro models + REST API,
│   │                    #   plus progress.py (aggregate endpoints for the charts)
│   ├── manage.py
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── api/         # fetch client for the Django API (adds the auth token)
│   │   ├── features/    # one folder per Redux slice: auth, workouts, sets, exercises,
│   │   │                #   macros, progress
│   │   ├── App.jsx
│   │   └── store.js
│   ├── package.json
│   └── Dockerfile
├── infra/terraform/     # AWS infrastructure as code (EC2 + RDS)
├── .github/workflows/   # CI: backend tests + frontend build
├── docker-compose.yml       # development
└── docker-compose.prod.yml  # production (nginx + gunicorn)
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

## Progress endpoints

The charts read from two aggregate endpoints rather than paging through the CRUD lists:

| Endpoint | Returns |
|---|---|
| `/api/progress/exercises/<id>/?days=90` | Heaviest set per training day for one exercise |
| `/api/progress/macros/?days=90` | Daily calories, protein, carbs and fat |

`days` is optional; leave it out for all time.

## Tests and CI

```bash
docker compose exec backend python manage.py test
```

With a coverage report (as CI runs it):

```bash
docker compose exec backend pip install -r requirements-dev.txt
docker compose exec backend coverage run manage.py test
docker compose exec backend coverage report
```

The tests run against PostgreSQL and cover the auth flow, per-user data isolation,
validation errors, the progress endpoints, database constraints and the
`claim_unowned_data` command.

Every push and pull request runs `.github/workflows/ci.yml` on GitHub Actions:

- **Backend tests** — `manage.py check`, a check that no migration is missing, and the
  test suite with coverage (fails under 90%) against a PostgreSQL 16 service container.
- **Frontend build** — `npm ci` and `npm run build`; with `CI=true` ESLint warnings
  fail the build.
- **Production images build** — builds the images in `docker-compose.prod.yml`.
- **Terraform validate** — `terraform fmt -check` and `terraform validate` on
  `infra/terraform` (no AWS credentials, nothing is planned or applied).

## Production and deployment

`docker-compose.prod.yml` runs the app the way a server would: the React app is built
once and served by nginx, which also proxies `/api` and `/admin` to Django running under
gunicorn as a non-root user. Everything is on one origin, so no CORS is involved.

Try it locally (uses its own PostgreSQL via the `localdb` profile):

```bash
cp .env.prod.example .env.prod      # then set DJANGO_SECRET_KEY and POSTGRES_PASSWORD
docker compose -f docker-compose.prod.yml --profile localdb up --build
# open http://localhost   (set WEB_PORT=8080 in the shell to use another port)
```

Settings come from environment variables (see `.env.prod.example`). In production
`DJANGO_DEBUG` is off and the backend refuses to start without `DJANGO_SECRET_KEY`.

`infra/terraform/` contains a Terraform configuration for AWS (EC2 running this Compose
stack, PostgreSQL on RDS, secrets in SSM Parameter Store). See
[infra/terraform/README.md](infra/terraform/README.md) for the architecture, usage, cost
and known limitations. It has not been applied to a real account yet.

## Roadmap

- [x] **CRUD core** — Workout/Exercise/SetEntry/DailyMacro models, DRF viewsets, React
  views wired through Redux: log a workout, add sets, log daily macros.
- [x] **Authentication** — token auth with register/login/logout, all data scoped to
  the logged-in user, login/register screens and a Redux auth slice.
- [x] **Exercise management UI** — create, rename, recategorise and delete exercises
  from the app instead of the Django admin. An exercise that logged sets still use
  cannot be deleted (the API answers 409 and the UI shows why).
- [x] **Progress charts** — heaviest set per day for an exercise, and daily calorie and
  macro trends, over a selectable period (Recharts, loaded only when the tab opens).
- [x] **Tests + CI** — backend test suite and a GitHub Actions workflow that runs the
  tests and the frontend build.
- [x] **Deployment** — production Docker setup (nginx + gunicorn) and a Terraform
  configuration for AWS (EC2 + RDS). Written and statically checked; not yet applied.

## Why this project exists

Built to close a specific, honest skills gap: hands-on Django and React/Redux
experience to go alongside existing REST API / PostgreSQL / Docker background.
