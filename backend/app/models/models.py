import enum

from sqlalchemy import Column, Integer, String, Date, ForeignKey, Enum, DateTime, Text, func
from sqlalchemy.orm import relationship

from app.db.database import Base


class UserRole(enum.Enum):
    admin = "admin"
    user = "user"


class ParticipationStatus(enum.Enum):
    going = "going"
    not_going = "not_going"
    not_answered = "not_answered"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(100), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    name = Column(String(100), nullable=False)
    avatar = Column(String(255), nullable=True)
    phone = Column(String(50), nullable=True)
    telegram = Column(String(100), nullable=True)
    color = Column(String(7), default="#3b82f6")
    role = Column(Enum(UserRole), default=UserRole.user)
    created_at = Column(DateTime, server_default=func.now())

    vacations = relationship("Vacation", back_populates="user", cascade="all, delete-orphan")
    events = relationship("Event", back_populates="author", cascade="all, delete-orphan")
    participations = relationship("Participation", back_populates="user", cascade="all, delete-orphan")


class Vacation(Base):
    __tablename__ = "vacations"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    description = Column(Text, nullable=True)

    user = relationship("User", back_populates="vacations")


class Event(Base):
    __tablename__ = "events"

    id = Column(Integer, primary_key=True, index=True)
    author_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    image = Column(String(255), nullable=True)
    location = Column(String(500), nullable=True)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    created_at = Column(DateTime, server_default=func.now())

    author = relationship("User", back_populates="events")
    participations = relationship("Participation", back_populates="event", cascade="all, delete-orphan")


class Participation(Base):
    __tablename__ = "event_participations"

    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(Integer, ForeignKey("events.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    status = Column(Enum(ParticipationStatus), default=ParticipationStatus.not_answered)

    event = relationship("Event", back_populates="participations")
    user = relationship("User", back_populates="participations")