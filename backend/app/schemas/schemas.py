from datetime import date, datetime
from typing import Optional, List, Union
from pydantic import BaseModel, ConfigDict, model_validator, field_serializer
import enum


class UserRole(str, enum.Enum):
    admin = "admin"
    user = "user"


class ParticipationStatus(str, enum.Enum):
    going = "going"
    not_going = "not_going"
    not_answered = "not_answered"


class UserBase(BaseModel):
    username: str
    name: str


class UserCreate(UserBase):
    password: str


class UserUpdate(BaseModel):
    name: Optional[str] = None
    avatar: Optional[str] = None
    phone: Optional[str] = None
    telegram: Optional[str] = None
    color: Optional[str] = None
    role: Optional[UserRole] = None


class UserResponse(UserBase):
    id: int
    avatar: Optional[str] = None
    phone: Optional[str] = None
    telegram: Optional[str] = None
    color: str
    role: UserRole
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class VacationBase(BaseModel):
    start_date: date
    end_date: date
    description: Optional[str] = None


class VacationCreate(VacationBase):
    pass


class VacationUpdate(BaseModel):
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    description: Optional[str] = None


class VacationResponse(VacationBase):
    id: int
    user_id: int
    user: Optional[UserResponse] = None

    model_config = ConfigDict(from_attributes=True)


class EventBase(BaseModel):
    title: str
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    description: Optional[str] = None
    location: Optional[str] = None
    route: Optional[str] = None

    @model_validator(mode='before')
    @classmethod
    def preprocess_dates(cls, values):
        if not isinstance(values, dict):
            return values
        for field in ['start_date', 'end_date']:
            if field in values and isinstance(values[field], str) and values[field] == '':
                values[field] = None
        return values


class EventCreate(EventBase):
    pass


class EventUpdate(EventBase):
    pass


class ParticipationResponse(BaseModel):
    event_id: int
    user_id: int
    status: ParticipationStatus
    user: UserResponse

    model_config = ConfigDict(from_attributes=True)


class EventResponse(EventBase):
    id: int
    author_id: int
    image: Optional[str] = None
    created_at: datetime
    participations: List[ParticipationResponse] = []
    author: UserResponse

    @field_serializer('start_date')
    def serialize_start_date(self, value):
        return value.isoformat() if value else None

    @field_serializer('end_date')
    def serialize_end_date(self, value):
        return value.isoformat() if value else None

    model_config = ConfigDict(from_attributes=True)


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class LoginRequest(BaseModel):
    username: str
    password: str