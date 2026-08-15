# Meeting Room & Desk Booking — Backend

FastAPI + SQLAlchemy + MySQL backend for the booking system.

## Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

1. Create a MySQL database:
   ```sql
   CREATE DATABASE booking_system;
   ```
2. Copy `.env.example` to `.env` and fill in your MySQL credentials and a secret key:
   ```bash
   cp .env.example .env
   ```
3. Run the app (tables are auto-created via `Base.metadata.create_all()` — no Alembic migrations, per project scope):
   ```bash
   uvicorn app.main:app --reload
   ```
4. (Optional) Seed sample data — one admin, one employee, six resources, two bookings:
   ```bash
   python -m app.seed
   ```

## API docs

Once running, open **http://localhost:8000/docs** for the interactive Swagger UI listing all 10 endpoints.

## Endpoints

| Method & path                     | Description                                             |
|-----------------------------------|-----------------------------------------------------------|
| POST /auth/register               | Register a user                                          |
| POST /auth/login                  | Log in and receive a JWT                                 |
| GET /resources/                   | List active resources, filter by `type`                  |
| POST /resources/                  | Create a resource (admin only)                            |
| PUT /resources/{id}                | Update or deactivate a resource (admin only)              |
| GET /resources/{id}/slots          | Get all bookings for a resource on a given date           |
| GET /bookings/                    | My upcoming bookings (employee) or all bookings (admin)   |
| POST /bookings/                   | Create booking — rejects if the time slot overlaps        |
| DELETE /bookings/{id}              | Cancel own booking (employee) or any booking (admin)       |
| GET /bookings/resource/{id}        | All bookings for a resource, filter by date (admin only)  |

## Key implementation notes

- **Overlap detection** is done with a SQLAlchemy filter using time-range logic
  (`start_time < new_end AND end_time > new_start`) — no data is loaded into
  Python for comparison.
- The overlap check and the booking insert happen against the same session and
  are committed together as one transaction.
- Passwords are hashed with **bcrypt**; all protected routes are secured with
  **JWT** via FastAPI's `Depends()`.
- Deactivated resources are excluded at the query level with
  `.filter(Resource.is_active == True)`.
- The cancel endpoint checks `booking.user_id == current_user.id` before
  allowing an employee to delete a booking (admins can cancel any booking).
