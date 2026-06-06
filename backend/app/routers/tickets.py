from fastapi import APIRouter, Depends
from app.db import get_pool

router = APIRouter()

@router.get("/tickets")
async def get_tickets(pool=Depends(get_pool)):
    async with pool.acquire() as conn:
        rows = await conn.fetch("SELECT * FROM tickets")
        return [dict(row) for row in rows]