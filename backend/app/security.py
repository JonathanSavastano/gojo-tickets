from passlib.context import CryptContext
from datetime import datetime, timedelta
from jose import jwt
import os
import uuid
from fastapi.security import OAuth2PasswordBearer
from fastapi import Depends, HTTPException
from jose import jwt, JWTError
from app.db import get_pool

pwd_context = CryptContext(schemes=["bcrypt"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

# hash the password
def hash_password(plain_password: str) -> str:
    return pwd_context.hash(plain_password)


# verify the password against a hash (for login later)
def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

# create a JWT token
def create_access_token(user_id: uuid.UUID) -> str:
    expire = datetime.utcnow() + timedelta(minutes=30)
    payload = {
        "sub": str(user_id),
        "exp": expire
    }
    secret_key = os.getenv("JWT_SECRET_KEY")
    return jwt.encode(payload, secret_key, algorithm="HS256")

async def get_current_user(token: str = Depends(oauth2_scheme), pool = Depends(get_pool)):
    credentials_exception = HTTPException(
        status_code=401,
        detail="Could not validate credentials",
    )
    try:
        secret_key = os.getenv("JWT_SECRET_KEY")
        payload = jwt.decode(token, secret_key, algorithms=["HS256"])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            """
            SELECT * FROM users WHERE id = $1
            """,
            uuid.UUID(user_id)
        )
        if not row:
            raise credentials_exception
        return dict(row)

async def require_admin(current_user: dict = Depends(get_current_user)):
    # check role column in users table
    if current_user.get("role") != "admin":
        raise HTTPException(
            status_code=403,
            detail="You do not have permission to perform this action",
        )
    return current_user

async def is_project_member(conn, project_id, user_id) -> bool:
    row = await conn.fetchrow(
        "SELECT 1 FROM project_members WHERE project_id = $1 AND user_id = $2",
        project_id,
        user_id
    )
    return row is not None