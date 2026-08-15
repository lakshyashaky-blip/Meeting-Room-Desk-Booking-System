from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import Base, engine
from app import models  # noqa: F401  (ensure models are registered on Base)
from app.routers import auth, resources, bookings
from app.config import settings

# Create tables (no Alembic migrations per project scope)
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Meeting Room & Desk Booking API",
    description="Reserve office meeting rooms and hot desks with availability checking and conflict prevention.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(resources.router)
app.include_router(bookings.router)


@app.get("/")
def root():
    return {"status": "ok", "service": "Meeting Room & Desk Booking API"}


@app.get("/health")
def health():
    return {"status": "healthy"}
