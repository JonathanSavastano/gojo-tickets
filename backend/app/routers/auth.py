from fastapi import APIRouter, HTTPException, Depends
from app.db import get_pool
from app import security
from app.schemas import UserCreate
from fastapi.security import OAuth2PasswordRequestForm
from asyncpg import UniqueViolationError

router = APIRouter()

@router.post("/auth/register")
async def register(user: UserCreate, pool=Depends(get_pool)):
    hashed_password = security.hash_password(user.password)
    async with pool.acquire() as conn:
        try:
            row = await conn.fetchrow(
                """
                INSERT INTO users (display_name, email, password_hash, role)
                VALUES ($1, $2, $3, 'member')
                RETURNING *
                """,
                user.display_name,
                user.email,
                hashed_password,
            )
        except UniqueViolationError:
            raise HTTPException(status_code=409, detail="User with this email already exists")
    token = security.create_access_token(row["id"])
    return {"access_token": token, "token_type": "bearer"}

@router.post("/auth/login")
async def login(form_data: OAuth2PasswordRequestForm = Depends(), pool = Depends(get_pool)):
    async with pool.acquire() as conn: 
        row = await conn.fetchrow(
            """
            SELECT * FROM users WHERE email = $1
            """,
            form_data.username
        )
        if not row:
            raise HTTPException(status_code=401, detail="Invalid email or password")
        user = dict(row)
        if not security.verify_password(form_data.password, user["password_hash"]):
            raise HTTPException(status_code=401, detail="Invalid email or password")
        token = security.create_access_token(user["id"])
        return {"access_token": token, "token_type": "bearer"}