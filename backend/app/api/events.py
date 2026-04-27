from typing import List, Optional
from datetime import date, datetime
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
import os
import uuid

from app.db.database import get_db
from app.models.models import Event, Participation, UserRole, ParticipationStatus
from app.schemas.schemas import EventCreate, EventResponse, EventUpdate
from app.core.security import get_current_user_id, get_user_by_id, check_admin
from app.core.config import settings

router = APIRouter()


@router.get("/", response_model=List[EventResponse])
async def list_events(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_id: int = Depends(get_current_user_id)
):
    query = select(Event).options(
        selectinload(Event.author),
        selectinload(Event.participations).selectinload(Participation.user)
    ).order_by(Event.start_date)
    
    result = await db.execute(query)
    return result.scalars().all()


@router.get("/{event_id}", response_model=EventResponse)
async def get_event(event_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Event)
        .options(
            selectinload(Event.author),
            selectinload(Event.participations).selectinload(Participation.user)
        )
        .where(Event.id == event_id)
    )
    event = result.scalar_one_or_none()
    if not event:
        raise HTTPException(404, "Event not found")
    return event


@router.post("/", response_model=EventResponse)
async def create_event(
    data: EventCreate,
    db: AsyncSession = Depends(get_db),
    author_id: int = Depends(get_current_user_id)
):
    event = Event(
        author_id=author_id,
        title=data.title,
        description=data.description,
        location=data.location,
        start_date=data.start_date,
        end_date=data.end_date
    )
    db.add(event)
    await db.commit()
    await db.refresh(event)
    result = await db.execute(
        select(Event)
        .options(
            selectinload(Event.author),
            selectinload(Event.participations).selectinload(Participation.user)
        )
        .where(Event.id == event.id)
    )
    event = result.scalar_one()
    return event


@router.patch("/{event_id}", response_model=EventResponse)
async def update_event(
    event_id: int,
    data: EventUpdate,
    db: AsyncSession = Depends(get_db),
    current_id: int = Depends(get_current_user_id)
):
    result = await db.execute(select(Event).options(selectinload(Event.author)).where(Event.id == event_id))
    event = result.scalar_one_or_none()
    if not event:
        raise HTTPException(404, "Event not found")
    
    if event.author_id != current_id:
        await check_admin(db, current_id)
    
    if data.title is not None:
        event.title = data.title
    if data.description is not None:
        event.description = data.description
    if data.location is not None:
        event.location = data.location
    if data.start_date is not None:
        event.start_date = data.start_date
    if data.end_date is not None:
        event.end_date = data.end_date
    if data.route is not None:
        event.route = data.route
    
    await db.commit()
    await db.refresh(event)
    result = await db.execute(
        select(Event)
        .options(
            selectinload(Event.author),
            selectinload(Event.participations).selectinload(Participation.user)
        )
        .where(Event.id == event_id)
    )
    event = result.scalar_one()
    return event


@router.delete("/{event_id}")
async def delete_event(
    event_id: int,
    db: AsyncSession = Depends(get_db),
    current_id: int = Depends(get_current_user_id)
):
    result = await db.execute(select(Event).options(selectinload(Event.author)).where(Event.id == event_id))
    event = result.scalar_one_or_none()
    if not event:
        raise HTTPException(404, "Event not found")
    
    if event.author_id != current_id:
        await check_admin(db, current_id)
    
    await db.delete(event)
    await db.commit()
    return {"message": "Event deleted"}


@router.post("/{event_id}/join")
async def join_event(
    event_id: int,
    db: AsyncSession = Depends(get_db),
    user_id: int = Depends(get_current_user_id)
):
    result = await db.execute(
        select(Participation).where(
            Participation.event_id == event_id,
            Participation.user_id == user_id
        )
    )
    participation = result.scalar_one_or_none()
    
    if participation:
        participation.status = ParticipationStatus.going
    else:
        participation = Participation(
            event_id=event_id,
            user_id=user_id,
            status=ParticipationStatus.going
        )
        db.add(participation)
    
    await db.commit()
    return {"message": "Joined"}


@router.post("/{event_id}/leave")
async def leave_event(
    event_id: int,
    db: AsyncSession = Depends(get_db),
    user_id: int = Depends(get_current_user_id)
):
    result = await db.execute(
        select(Participation).where(
            Participation.event_id == event_id,
            Participation.user_id == user_id
        )
    )
    participation = result.scalar_one_or_none()
    
    if participation:
        participation.status = ParticipationStatus.not_going
    else:
        participation = Participation(
            event_id=event_id,
            user_id=user_id,
            status=ParticipationStatus.not_going
        )
        db.add(participation)
    
    await db.commit()
    return {"message": "Left"}


@router.post("/{event_id}/image")
async def upload_image(
    event_id: int,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_id: int = Depends(get_current_user_id)
):
    result = await db.execute(select(Event).options(selectinload(Event.author)).where(Event.id == event_id))
    event = result.scalar_one_or_none()
    if not event:
        raise HTTPException(404, "Event not found")
    
    if event.author_id != current_id:
        await check_admin(db, current_id)
    
    if file.content_type not in ["image/jpeg", "image/png"]:
        raise HTTPException(400, "Only JPEG and PNG images are allowed")
    
    ext = ".jpg" if file.content_type == "image/jpeg" else ".png"
    filename = f"{uuid.uuid4()}{ext}"
    filepath = os.path.join(settings.UPLOAD_DIR, filename)
    
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    content = await file.read()
    if len(content) > settings.MAX_FILE_SIZE:
        raise HTTPException(400, "File too large (max 5MB)")
    
    with open(filepath, "wb") as f:
        f.write(content)
    
    event.image = filename
    await db.commit()
    await db.refresh(event)
    return {"image": filename}