from fastapi import APIRouter, Depends, HTTPException
import uuid
from app.db import get_pool
from app import security
from app.schemas import UserCreate, UserUpdate, UserResponse
from asyncpg import UniqueViolationError
from app.security import get_current_user

router = APIRouter()


# POST /users - Create a new user
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


# GET /users - Get a list of all users
@router.get("/users")
async def get_users(pool=Depends(get_pool)):
    async with pool.acquire() as conn:
        rows = await conn.fetch("SELECT * FROM users")
        return [UserResponse(**dict(row)) for row in rows]


# GET /users/me - Get the current authenticated user
@router.get("/users/me")
async def get_me(current_user=Depends(get_current_user)):
    return UserResponse(**current_user)


# GET /users/{user_id} - Get a specific user by ID
@router.get("/users/{user_id}")
async def get_user(user_id: uuid.UUID, pool=Depends(get_pool)):
    async with pool.acquire() as conn:
        row = await conn.fetchrow("SELECT * FROM users WHERE id = $1", user_id)
        if row:
            return UserResponse(**dict(row))
        else:
            raise HTTPException(status_code=404, detail="User not found")


# PATCH /users/{user_id} - Update a specific user by ID
@router.patch("/users/{user_id}")
async def update_user(user_id: uuid.UUID, user: UserUpdate, pool=Depends(get_pool), current_user=Depends(get_current_user)):
    async with pool.acquire() as conn:
        existing_user = await conn.fetchrow("SELECT * FROM users WHERE id = $1", user_id)
        if not existing_user:
            raise HTTPException(status_code=404, detail="User not found")

        update_data = user.dict(exclude_unset=True)
        if not update_data:
            raise HTTPException(status_code=400, detail="No fields provided for update")

        if "password" in update_data:
            update_data["password_hash"] = security.hash_password(update_data.pop("password"))

        set_clause = ", ".join(f"{key} = ${idx + 2}" for idx, key in enumerate(update_data.keys()))
        values = list(update_data.values())

        query = f"UPDATE users SET {set_clause}, updated_at = NOW() WHERE id = $1 RETURNING *"
        try:
            row = await conn.fetchrow(query, user_id, *values)
        except UniqueViolationError:
            raise HTTPException(status_code=409, detail="User with this email already exists")
        return UserResponse(**dict(row))


# DELETE /users/{user_id} - Delete a specific user by ID
@router.delete("/users/{user_id}", status_code=204)
async def delete_user(user_id: uuid.UUID, pool=Depends(get_pool), current_user=Depends(get_current_user)):
    async with pool.acquire() as conn:
        row = await conn.fetchrow("DELETE FROM users WHERE id = $1 RETURNING *", user_id)
        if row:
            return None
        else:
            raise HTTPException(status_code=404, detail="User not found")