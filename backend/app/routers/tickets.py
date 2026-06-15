from fastapi import APIRouter, Depends
from app.db import get_pool
from app.schemas import TicketCreate, TicketUpdate
from fastapi import HTTPException
import uuid
from app.security import get_current_user

router = APIRouter()

@router.post("/tickets")
async def create_ticket(ticket: TicketCreate, pool=Depends(get_pool), current_user=Depends(get_current_user)):
    async with pool.acquire() as conn:
        p_key = await conn.fetchrow(
            """
            SELECT key FROM projects WHERE id = $1

            """,
            ticket.project_id
        )

        p_id = await conn.fetchrow(
            """
            SELECT COALESCE(MAX(sequence_number), 0) FROM tickets WHERE project_id = $1
            """,
            ticket.project_id
        )
        sequence_number = p_id[0] + 1

        ticket_string = f"{p_key[0]}-{sequence_number}"

        row = await conn.fetchrow(
            """
            INSERT INTO tickets (title, description, priority, type, project_id, reporter_id, assignee_id, sequence_number, key)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING *
            """,
            ticket.title,
            ticket.description,
            ticket.priority,
            ticket.type,
            ticket.project_id,
            current_user["id"],
            ticket.assignee_id,
            sequence_number,
            ticket_string
        )
        return dict(row)

@router.get("/tickets")
async def get_tickets(pool=Depends(get_pool)):
    async with pool.acquire() as conn:
        rows = await conn.fetch("SELECT * FROM tickets")
        return [dict(row) for row in rows]

@router.get("/tickets/{ticket_id}")
async def get_ticket(ticket_id: uuid.UUID, pool=Depends(get_pool)):
    async with pool.acquire() as conn:
        row = await conn.fetchrow("SELECT * FROM tickets WHERE id = $1", ticket_id)
        if row:
            return dict(row)
        else:
            raise HTTPException(status_code=404, detail="Ticket not found")

@router.patch("/tickets/{ticket_id}")
async def update_ticket(ticket_id: uuid.UUID, ticket: TicketUpdate, pool=Depends(get_pool)):
    async with pool.acquire() as conn:
        existing_ticket = await conn.fetchrow("SELECT * FROM tickets WHERE id = $1", ticket_id)
        if not existing_ticket:
            raise HTTPException(status_code=404, detail="Ticket not found")

        updated_fields = {k: v for k, v in ticket.dict(exclude_unset=True).items()} # pull out only the fields that were provided in the update request
        if not updated_fields:
            raise HTTPException(status_code=400, detail="No fields provided for update")

        set_clause = ", ".join([f"{key} = ${i+2}" for i, key in enumerate(updated_fields.keys())]) # build the SET clause of the SQL query dynamically based on which fields were provided
        values = list(updated_fields.values())

        query = f"UPDATE tickets SET {set_clause}, updated_at = NOW() WHERE id = $1 RETURNING *"
        row = await conn.fetchrow(query, ticket_id, *values)
        return dict(row)

@router.delete("/tickets/{ticket_id}", status_code=204)
async def delete_ticket(ticket_id: uuid.UUID, pool=Depends(get_pool)):
    async with pool.acquire() as conn:
        row = await conn.fetchrow("DELETE FROM tickets WHERE id = $1 RETURNING *", ticket_id)
        if row:
            return None
        else:
            raise HTTPException(status_code=404, detail="Ticket not found")