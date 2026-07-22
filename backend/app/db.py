# where database connection lives — asyncpg setup goes here. One place, used everywhere.
import asyncpg
import os
import socket
from dotenv import load_dotenv
from fastapi import Request

load_dotenv()

_orig_getaddrinfo = socket.getaddrinfo
def _ipv4_getaddrinfo(host, port, family=0, type=0, proto=0, flags=0):
    return _orig_getaddrinfo(host, port, socket.AF_INET, type, proto, flags)
socket.getaddrinfo = _ipv4_getaddrinfo

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