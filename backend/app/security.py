from passlib.context import CryptContext
from datetime import datetime, timedelta
from jose import jwt
import os
import uuid

pwd_context = CryptContext(schemes=["bcrypt"])

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
