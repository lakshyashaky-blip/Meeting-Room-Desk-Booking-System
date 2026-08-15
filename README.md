# Meeting Room & Desk Booking System

A full-stack web app for reserving office meeting rooms and hot desks, with
real-time availability checks and automatic booking-conflict prevention.

**Stack:** FastAPI (Python) · React + Vite · MySQL · SQLAlchemy · JWT auth

---

## Table of contents

- [Project structure](#project-structure)
- [Features](#features)
- [Out of scope](#out-of-scope)
- [Local setup](#local-setup)
- [API reference](#api-reference)
- [Deploying to production](#deploying-to-production)
- [Pushing to GitHub](#pushing-to-github)

---

## Project structure

```
booking-system/
├── backend/      FastAPI + SQLAlchemy + MySQL API
│   ├── app/
│   ├── requirements.txt
│   ├── runtime.txt      # pins Python version for deployment
│   └── .env.example
└── frontend/     React + Vite + Axios single-page app
    ├── src/
    ├── package.json
    └── .env.example
```

## Features

- **JWT authentication** — register/login, with `admin` and `employee` roles
- **Resource management** — admins create, update, and deactivate rooms/desks
- **Availability checking** — employees browse active resources, filter by
  type, and check per-date availability before booking
- **Conflict-free booking** — overlap detection runs as a SQL query
  (`start_time < new_end AND end_time > new_start`), not in-memory, inside a
  single database transaction — so double-bookings can't slip through
- **Booking management** — employees see and cancel their own upcoming
  bookings; admins see and cancel any booking, filterable by resource and date
- **Security** — passwords hashed with bcrypt; all protected routes require a
  valid JWT

## Out of scope

Per the original project brief, these were deliberately left out: email/
calendar invitations, recurring bookings, a floor-plan/map view, waitlists,
Alembic migrations (tables are created via `Base.metadata.create_all()`), and
mobile-responsive design polish.

---

## Local setup

### 1. Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

Create a MySQL database, then configure your environment:

```sql
CREATE DATABASE booking_system;
```

```bash
cp .env.example .env            # fill in MySQL credentials + a secret key
uvicorn app.main:app --reload
python -m app.seed              # optional: seeds 1 admin, 1 employee, 6 resources, 2 bookings
```

The API runs at `http://localhost:8000` — interactive Swagger docs at
`http://localhost:8000/docs`.

### 2. Frontend

```bash
cd frontend
npm install
cp .env.example .env            # defaults to http://localhost:8000
npm run dev
```

The app runs at `http://localhost:5173`.

### Demo accounts (after seeding)

| Role     | Email                 | Password     |
|----------|------------------------|--------------|
| Admin    | admin@company.com      | Admin123!    |
| Employee | employee@company.com   | Employee123! |

---

## API reference

| Method & path              | Description                                              |
|-----------------------------|-----------------------------------------------------------|
| `POST /auth/register`       | Register a user                                            |
| `POST /auth/login`          | Log in and receive a JWT                                   |
| `GET /resources/`           | List active resources, filter by `type`                    |
| `POST /resources/`          | Create a resource *(admin only)*                            |
| `PUT /resources/{id}`       | Update or deactivate a resource *(admin only)*               |
| `GET /resources/{id}/slots` | Get all bookings for a resource on a given date             |
| `GET /bookings/`            | My upcoming bookings *(employee)* or all bookings *(admin)* |
| `POST /bookings/`           | Create a booking — rejects if the time slot overlaps         |
| `DELETE /bookings/{id}`     | Cancel own booking *(employee)* or any booking *(admin)*     |
| `GET /bookings/resource/{id}` | All bookings for a resource, filter by date *(admin only)* |

Full interactive docs are available at `/docs` once the backend is running.

---

## Deploying to production

GitHub Pages only serves static files, so it can host the **frontend**. The
**backend and MySQL database** need to run somewhere that executes Python —
this project is set up for [Render](https://render.com) (free web service
tier) plus a hosted MySQL instance (e.g. [Aiven](https://aiven.io), which has
a genuinely free, no-credit-card-required tier).

The repo is already configured for GitHub Pages:
- `frontend/src/main.jsx` uses `HashRouter` (not `BrowserRouter`), since
  GitHub Pages has no server-side rewrites for client-side routes.
- `frontend/vite.config.js` sets `base: '/Meeting-Room-Desk-Booking-System/'`
  to match this repo name, so built asset URLs resolve correctly.
- `frontend/package.json` includes a `deploy` script using `gh-pages`.
- `backend/runtime.txt` pins the Python version, since `pydantic-core` may
  fail to build on very new Python releases without a prebuilt wheel.

### 1. Deploy the backend to Render

- **Root Directory:** `backend`
- **Build command:** `pip install -r requirements.txt`
- **Start command:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- **Environment variables** (see `backend/.env.example`):

  | Key | Value |
  |---|---|
  | `DATABASE_URL` | Your MySQL connection string, e.g. `mysql+pymysql://user:pass@host:port/db` |
  | `SECRET_KEY` | A long random string (e.g. `python -c "import secrets; print(secrets.token_hex(32))"`) |
  | `ALGORITHM` | `HS256` |
  | `ACCESS_TOKEN_EXPIRE_MINUTES` | `1440` |
  | `CORS_ORIGINS` | Your GitHub Pages origin, e.g. `https://your-username.github.io` |

  > If your MySQL host's connection string includes `?ssl-mode=REQUIRED`,
  > replace it with `?ssl_verify_cert=false` — `pymysql` doesn't recognize
  > `ssl-mode` as a parameter name.

### 2. Point the frontend at the live backend

In `frontend/.env`:

```
VITE_API_BASE_URL=https://your-backend.onrender.com
```

### 3. Build and publish to GitHub Pages

```bash
cd frontend
npm install
npm run deploy
```

This builds the app and pushes `frontend/dist` to the `gh-pages` branch.

### 4. Enable GitHub Pages

Repo **Settings → Pages → Source** → *Deploy from a branch* → select
`gh-pages` / `/ (root)`.

Your site will be live at:

```
https://your-username.github.io/Meeting-Room-Desk-Booking-System/
```

> **Renamed the repo?** Update the `base` value in `frontend/vite.config.js`
> to match, or your built asset URLs will 404.

---

## Pushing to GitHub

```bash
cd booking-system
git init
git add .
git commit -m "Initial commit: meeting room & desk booking system"
git branch -M main
git remote add origin <your-repo-url>
git push -u origin main
```

`backend/.env` and `frontend/.env` are both git-ignored — only the
`.env.example` files are committed, so real credentials never end up in the
repo.
