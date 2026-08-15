import datetime
from typing import Optional, List

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app import models, schemas
from app.deps import get_current_user

router = APIRouter(prefix="/bookings", tags=["bookings"])


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


@router.get("/", response_model=List[schemas.BookingOut])
def list_bookings(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Employees see only their own upcoming bookings. Admins see all bookings."""
    query = db.query(models.Booking)

    if current_user.role == models.RoleEnum.admin:
        bookings = query.order_by(models.Booking.date, models.Booking.start_time).all()
    else:
        today = datetime.date.today()
        bookings = (
            query.filter(
                models.Booking.user_id == current_user.id,
                models.Booking.date >= today,
            )
            .order_by(models.Booking.date, models.Booking.start_time)
            .all()
        )
    return [_to_booking_out(b) for b in bookings]


@router.post("/", response_model=schemas.BookingOut, status_code=201)
def create_booking(
    payload: schemas.BookingCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    # Resource must exist and be active (query-level filter)
    resource = (
        db.query(models.Resource)
        .filter(models.Resource.id == payload.resource_id, models.Resource.is_active == True)  # noqa: E712
        .first()
    )
    if not resource:
        raise HTTPException(status_code=404, detail="Resource not found or inactive")

    start_dt = datetime.datetime.combine(payload.date, payload.start_time)
    end_dt = datetime.datetime.combine(payload.date, payload.end_time)

    # Single transaction: overlap check + insert are performed against the same
    # session and committed together, so no other request's commit can land
    # in between the check and the insert being persisted.
    try:
        overlap_exists = (
            db.query(models.Booking)
            .filter(
                models.Booking.resource_id == payload.resource_id,
                models.Booking.date == payload.date,
                models.Booking.start_time < end_dt,
                models.Booking.end_time > start_dt,
            )
            .first()
        )
        if overlap_exists:
            raise HTTPException(
                status_code=409,
                detail="This time slot overlaps with an existing booking for this resource.",
            )

        booking = models.Booking(
            resource_id=payload.resource_id,
            user_id=current_user.id,
            date=payload.date,
            start_time=start_dt,
            end_time=end_dt,
            title=payload.title,
        )
        db.add(booking)
        db.commit()
        db.refresh(booking)
    except HTTPException:
        db.rollback()
        raise
    except Exception:
        db.rollback()
        raise

    return _to_booking_out(booking)


@router.delete("/{booking_id}", status_code=204)
def cancel_booking(
    booking_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    booking = db.query(models.Booking).filter(models.Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    if current_user.role != models.RoleEnum.admin and booking.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="You can only cancel your own bookings")

    db.delete(booking)
    db.commit()
    return None


@router.get("/resource/{resource_id}", response_model=List[schemas.BookingOut])
def bookings_for_resource(
    resource_id: int,
    date: Optional[datetime.date] = Query(default=None),
    db: Session = Depends(get_db),
    admin: models.User = Depends(get_current_user),
):
    if admin.role != models.RoleEnum.admin:
        raise HTTPException(status_code=403, detail="Admin privileges required")

    query = db.query(models.Booking).filter(models.Booking.resource_id == resource_id)
    if date is not None:
        query = query.filter(models.Booking.date == date)

    bookings = query.order_by(models.Booking.date, models.Booking.start_time).all()
    return [_to_booking_out(b) for b in bookings]
