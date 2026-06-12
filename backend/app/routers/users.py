from fastapi import APIRouter, Depends, HTTPException
import uuid
from app.db import get_pool
from app import security
from app.schemas import UserCreate, UserUpdate, UserResponse
from asyncpg import UniqueViolationError

router = APIRouter()

@router.post("/users")
async def create_user(user: UserCreate, pool=Depends(get_pool)):

    hashed_password = security.hash_password(user.password)

    async with pool.acquire() as conn:
        try:
            row = await conn.fetchrow(
                """
                INSERT INTO users (display_name, email, password_hash)
                VALUES ($1, $2, $3)
                RETURNING *
                """,
                user.display_name,
                user.email,
                hashed_password
            )
        except UniqueViolationError:
            raise HTTPException(status_code=409, detail="User with this email already exists")
    return UserResponse(**dict(row))  