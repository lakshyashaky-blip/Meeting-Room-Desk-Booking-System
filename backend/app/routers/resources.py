import datetime
from typing import Optional, List

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app import models, schemas
from app.deps import get_current_user, require_admin

router = APIRouter(prefix="/resources", tags=["resources"])


@router.get("/", response_model=List[schemas.ResourceOut])
def list_resources(
    type: Optional[models.ResourceTypeEnum] = Query(default=None),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    query = db.query(models.Resource).filter(models.Resource.is_active == True)  # noqa: E712
    if type is not None:
        query = query.filter(models.Resource.type == type)
    return query.order_by(models.Resource.name).all()


@router.post("/", response_model=schemas.ResourceOut, status_code=201)
def create_resource(
    payload: schemas.ResourceCreate,
    db: Session = Depends(get_db),
    admin: models.User = Depends(require_admin),
):
    resource = models.Resource(**payload.model_dump())
    db.add(resource)
    db.commit()
    db.refresh(resource)
    return resource


@router.put("/{resource_id}", response_model=schemas.ResourceOut)
def update_resource(
    resource_id: int,
    payload: schemas.ResourceUpdate,
    db: Session = Depends(get_db),
    admin: models.User = Depends(require_admin),
):
    resource = db.query(models.Resource).filter(models.Resource.id == resource_id).first()
    if not resource:
        raise HTTPException(status_code=404, detail="Resource not found")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(resource, field, value)

    db.commit()
    db.refresh(resource)
    return resource


@router.get("/{resource_id}/slots", response_model=List[schemas.BookingOut])
def get_resource_slots(
    resource_id: int,
    date: datetime.date = Query(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    resource = db.query(models.Resource).filter(models.Resource.id == resource_id).first()
    if not resource:
        raise HTTPException(status_code=404, detail="Resource not found")

    bookings = (
        db.query(models.Booking)
        .filter(models.Booking.resource_id == resource_id, models.Booking.date == date)
        .order_by(models.Booking.start_time)
        .all()
    )
    return [_to_booking_out(b) for b in bookings]


def _to_booking_out(b: models.Booking) -> schemas.BookingOut:
    return schemas.BookingOut(
        id=b.id,
        resource_id=b.resource_id,
        user_id=b.user_id,
        date=b.date,
        start_time=b.start_time,
        end_time=b.end_time,
        title=b.title,
        resource_name=b.resource.name if b.resource else None,
        user_name=b.user.name if b.user else None,
    )
