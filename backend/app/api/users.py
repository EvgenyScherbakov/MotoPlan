from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.database import get_db
from app.models.models import User, UserRole
from app.schemas.schemas import UserResponse, UserUpdate
from app.core.security import get_current_user_id, get_password_hash, check_admin

router = APIRouter()


async def get_user_by_id(db: AsyncSession, user_id: int) -> User:
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.get("/", response_model=list[UserResponse])
async def list_users(db: AsyncSession = Depends(get_db), current_id: int = Depends(get_current_user_id)):
    await check_admin(db, current_id)
    result = await db.execute(select(User))
    return result.scalars().all()


@router.get("/{user_id}", response_model=UserResponse)
async def get_user(user_id: int, db: AsyncSession = Depends(get_db), current_id: int = Depends(get_current_user_id)):
    user = await get_user_by_id(db, user_id)
    return user


@router.patch("/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: int,
    data: UserUpdate,
    db: AsyncSession = Depends(get_db),
    current_id: int = Depends(get_current_user_id)
):
    user = await get_user_by_id(db, user_id)
    
    if user_id != current_id:
        await check_admin(db, current_id)
    
    if data.name is not None:
        user.name = data.name
    if data.avatar is not None:
        user.avatar = data.avatar
    if data.phone is not None:
        user.phone = data.phone
    if data.telegram is not None:
        user.telegram = data.telegram
    if data.color is not None:
        user.color = data.color
    if data.role is not None:
        user.role = UserRole[data.role.value]
    
    await db.commit()
    await db.refresh(user)
    return user


@router.delete("/{user_id}")
async def delete_user(user_id: int, db: AsyncSession = Depends(get_db), current_id: int = Depends(get_current_user_id)):
    await check_admin(db, current_id)
    user = await get_user_by_id(db, user_id)
    await db.delete(user)
    await db.commit()
    return {"message": "User deleted"}