import datetime
from typing import Optional, List

from pydantic import BaseModel, EmailStr, field_validator

from app.models import RoleEnum, ResourceTypeEnum


# ---------- Auth / User ----------

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: RoleEnum = RoleEnum.employee


class UserOut(BaseModel):
    id: int
    name: str
    email: EmailStr
    role: RoleEnum

    class Config:
        from_attributes = True


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


# ---------- Resource ----------

class ResourceCreate(BaseModel):
    name: str
    type: ResourceTypeEnum
    floor_location: Optional[str] = None
    capacity: Optional[int] = None
    amenities: Optional[str] = None


class ResourceUpdate(BaseModel):
    name: Optional[str] = None
    type: Optional[ResourceTypeEnum] = None
    floor_location: Optional[str] = None
    capacity: Optional[int] = None
    amenities: Optional[str] = None
    is_active: Optional[bool] = None


class ResourceOut(BaseModel):
    id: int
    name: str
    type: ResourceTypeEnum
    floor_location: Optional[str] = None
    capacity: Optional[int] = None
    amenities: Optional[str] = None
    is_active: bool

    class Config:
        from_attributes = True


# ---------- Booking ----------

class BookingCreate(BaseModel):
    resource_id: int
    date: datetime.date
    start_time: datetime.time
    end_time: datetime.time
    title: str

    @field_validator("end_time")
    @classmethod
    def end_after_start(cls, v, info):
        start = info.data.get("start_time")
        if start is not None and v <= start:
            raise ValueError("end_time must be strictly after start_time")
        return v


class BookingOut(BaseModel):
    id: int
    resource_id: int
    user_id: int
    date: datetime.date
    start_time: datetime.datetime
    end_time: datetime.datetime
    title: str
    resource_name: Optional[str] = None
    user_name: Optional[str] = None

    class Config:
        from_attributes = True
