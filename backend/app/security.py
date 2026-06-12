from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"])

# hash the password
def hash_password(plain_password: str) -> str:
    return pwd_context.hash(plain_password)


# verify the password against a hash (for login later)
def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)
