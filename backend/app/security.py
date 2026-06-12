from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"])

# hash the password
hashed = pwd_context.hash("plaintext_password")

# verify the password against a hash (for login later)
pwd_context.verify("plaintext_password", hashed)