from fastapi import APIRouter, HTTPException, Depends
from app.db import get_pool
from app import security
from app.schemas import LoginRequest
from fastapi.security import OAuth2PasswordRequestForm

router = APIRouter()

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