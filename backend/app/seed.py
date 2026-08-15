"""
Seed the database with an admin user, an employee user, sample resources,
and a few sample bookings.

Run with:  python -m app.seed
"""
import datetime

from app.database import SessionLocal, Base, engine
from app import models
from app.auth import hash_password

Base.metadata.create_all(bind=engine)


def run():
    db = SessionLocal()
    try:
        if db.query(models.User).count() > 0:
            print("Database already has data — skipping seed. Delete tables to reseed.")
            return

        admin = models.User(
            name="Ava Admin",
            email="admin@company.com",
            password_hash=hash_password("Admin123!"),
            role=models.RoleEnum.admin,
        )
        employee = models.User(
            name="Ethan Employee",
            email="employee@company.com",
            password_hash=hash_password("Employee123!"),
            role=models.RoleEnum.employee,
        )
        db.add_all([admin, employee])
        db.commit()
        db.refresh(admin)
        db.refresh(employee)

        resources = [
            models.Resource(
                name="Everest Room", type=models.ResourceTypeEnum.room,
                floor_location="3rd Floor - North Wing", capacity=8,
                amenities="Projector, Whiteboard, Video conferencing", is_active=True,
            ),
            models.Resource(
                name="Kilimanjaro Room", type=models.ResourceTypeEnum.room,
                floor_location="3rd Floor - South Wing", capacity=4,
                amenities="Whiteboard, TV screen", is_active=True,
            ),
            models.Resource(
                name="Fuji Room", type=models.ResourceTypeEnum.room,
                floor_location="2nd Floor", capacity=12,
                amenities="Projector, Video conferencing, Speakerphone", is_active=True,
            ),
            models.Resource(
                name="Desk A1", type=models.ResourceTypeEnum.desk,
                floor_location="2nd Floor - Open Plan", capacity=1,
                amenities="Dual monitor, Docking station", is_active=True,
            ),
            models.Resource(
                name="Desk A2", type=models.ResourceTypeEnum.desk,
                floor_location="2nd Floor - Open Plan", capacity=1,
                amenities="Standing desk, Docking station", is_active=True,
            ),
            models.Resource(
                name="Desk B1", type=models.ResourceTypeEnum.desk,
                floor_location="3rd Floor - Quiet Zone", capacity=1,
                amenities="Dual monitor", is_active=True,
            ),
        ]
        db.add_all(resources)
        db.commit()
        for r in resources:
            db.refresh(r)

        today = datetime.date.today()
        tomorrow = today + datetime.timedelta(days=1)

        sample_bookings = [
            models.Booking(
                resource_id=resources[0].id,
                user_id=employee.id,
                date=tomorrow,
                start_time=datetime.datetime.combine(tomorrow, datetime.time(10, 0)),
                end_time=datetime.datetime.combine(tomorrow, datetime.time(11, 0)),
                title="Sprint Planning",
            ),
            models.Booking(
                resource_id=resources[3].id,
                user_id=employee.id,
                date=tomorrow,
                start_time=datetime.datetime.combine(tomorrow, datetime.time(9, 0)),
                end_time=datetime.datetime.combine(tomorrow, datetime.time(17, 0)),
                title="Full day desk booking",
            ),
        ]
        db.add_all(sample_bookings)
        db.commit()

        print("Seed complete.")
        print("Admin login:    admin@company.com / Admin123!")
        print("Employee login: employee@company.com / Employee123!")
    finally:
        db.close()


if __name__ == "__main__":
    run()
