# where database connection lives — asyncpg setup goes here. One place, used everywhere.
import asyncpg
import os
from dotenv import load_dotenv
from fastapi import Request

load_dotenv()

async def create_pool():
    dsn = os.getenv("DATABASE_URL")
    if not dsn:
        raise RuntimeError("DATABASE_URL environment variable is not set")
    if "?" not in dsn:
        dsn += "?sslmode=require"
    print(f"DB host: {dsn.split('@')[1].split('?')[0] if '@' in dsn else 'unknown'}")
    return await asyncpg.create_pool(dsn)

# receive incoming request, reach into app.state, and return the db pool for use in routes.
def get_pool(request: Request):
    return request.app.state.db_pool