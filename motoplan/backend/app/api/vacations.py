from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_

from sqlalchemy.orm import selectinload

from app.db.database import get_db
from app.models.models import Vacation, User
from app.schemas.schemas import VacationCreate, VacationResponse, VacationUpdate
from app.core.security import get_current_user_id, get_user_by_id, check_admin

router = APIRouter()


@router.get("/", response_model=List[VacationResponse])
async def list_vacations(
    user_id: Optional[int] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_id: int = Depends(get_current_user_id)
):
    query = select(Vacation).options(selectinload(Vacation.user))
    
    if user_id:
        query = query.where(Vacation.user_id == user_id)
    if start_date:
        query = query.where(Vacation.end_date >= start_date)
    if end_date:
        query = query.where(Vacation.start_date <= end_date)
    
    result = await db.execute(query.order_by(Vacation.start_date))
    return result.scalars().all()


@router.post("/", response_model=VacationResponse)
async def create_vacation(
    data: VacationCreate,
    db: AsyncSession = Depends(get_db),
    user_id: int = Depends(get_current_user_id)
):
    if data.end_date < data.start_date:
        raise HTTPException(400, "End date must be after start date")
    
    vacation = Vacation(
        user_id=user_id,
        start_date=data.start_date,
        end_date=data.end_date,
        description=data.description
    )
    db.add(vacation)
    await db.commit()
    await db.refresh(vacation)
    result = await db.execute(
        select(Vacation)
        .options(selectinload(Vacation.user))
        .where(Vacation.id == vacation.id)
    )
    return result.scalar_one()


@router.patch("/{vacation_id}", response_model=VacationResponse)
async def update_vacation(
    vacation_id: int,
    data: VacationUpdate,
    db: AsyncSession = Depends(get_db),
    current_id: int = Depends(get_current_user_id)
):
    result = await db.execute(select(Vacation).options(selectinload(Vacation.user)).where(Vacation.id == vacation_id))
    vacation = result.scalar_one_or_none()
    if not vacation:
        raise HTTPException(404, "Vacation not found")
    
    if vacation.user_id != current_id:
        await check_admin(db, current_id)
    
    if data.start_date is not None:
        vacation.start_date = data.start_date
    if data.end_date is not None:
        vacation.end_date = data.end_date
    if data.description is not None:
        vacation.description = data.description
    
    if data.start_date and data.end_date and data.end_date < data.start_date:
        raise HTTPException(400, "End date must be after start date")
    
    await db.commit()
    await db.refresh(vacation)
    result = await db.execute(
        select(Vacation)
        .options(selectinload(Vacation.user))
        .where(Vacation.id == vacation_id)
    )
    return result.scalar_one()


@router.delete("/{vacation_id}")
async def delete_vacation(
    vacation_id: int,
    db: AsyncSession = Depends(get_db),
    current_id: int = Depends(get_current_user_id)
):
    result = await db.execute(select(Vacation).options(selectinload(Vacation.user)).where(Vacation.id == vacation_id))
    vacation = result.scalar_one_or_none()
    if not vacation:
        raise HTTPException(404, "Vacation not found")
    
    if vacation.user_id != current_id:
        await check_admin(db, current_id)
    
    await db.delete(vacation)
    await db.commit()
    return {"message": "Vacation deleted"}