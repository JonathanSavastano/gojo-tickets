from fastapi import APIRouter, Depends
from app.db import get_pool
from app.schemas import TicketCreate, TicketUpdate
from fastapi import HTTPException
import uuid
from app.security import get_current_user, is_project_member

router = APIRouter()


# POST /tickets - Create a new ticket
@router.post("/tickets")
async def create_ticket(ticket: TicketCreate, pool=Depends(get_pool), current_user=Depends(get_current_user)):
    if not current_user.get("org_id"):
        raise HTTPException(status_code=400, detail="You must be in an organization to create tickets")
    async with pool.acquire() as conn:
        # verify project belongs to user's org
        project = await conn.fetchrow(
            "SELECT key FROM projects WHERE id = $1 AND org_id = $2",
            ticket.project_id,
            current_user["org_id"],
        )
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")

        p_id = await conn.fetchrow(
            """
            SELECT COALESCE(MAX(sequence_number), 0) FROM tickets WHERE project_id = $1
            """,
            ticket.project_id
        )
        sequence_number = p_id[0] + 1
        ticket_string = f"{project[0]}-{sequence_number}"

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


# GET /tickets - Get a list of all tickets for current user's org
@router.get("/tickets")
async def get_tickets(pool=Depends(get_pool), current_user=Depends(get_current_user)):
    if not current_user.get("org_id"):
        return []
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            """
            SELECT t.*, reporter.display_name AS reporter_name,
                   assignee.display_name AS assignee_name
            FROM tickets t
            JOIN projects p ON t.project_id = p.id
            LEFT JOIN users reporter ON t.reporter_id = reporter.id
            LEFT JOIN users assignee ON t.assignee_id = assignee.id
            WHERE p.org_id = $1
            """,
            current_user["org_id"],
        )
        return [dict(row) for row in rows]


# GET /tickets/{ticket_id} - Get a specific ticket by ID
@router.get("/tickets/{ticket_id}")
async def get_ticket(ticket_id: uuid.UUID, pool=Depends(get_pool), current_user=Depends(get_current_user)):
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            """
            SELECT t.*, reporter.display_name AS reporter_name,
                   assignee.display_name AS assignee_name
            FROM tickets t
            JOIN projects p ON t.project_id = p.id
            LEFT JOIN users reporter ON t.reporter_id = reporter.id
            LEFT JOIN users assignee ON t.assignee_id = assignee.id
            WHERE t.id = $1 AND p.org_id = $2
            """,
            ticket_id,
            current_user["org_id"],
        )
        if row:
            return dict(row)
        else:
            raise HTTPException(status_code=404, detail="Ticket not found")


# PATCH /tickets/{ticket_id} - Update a specific ticket by ID
@router.patch("/tickets/{ticket_id}")
async def update_ticket(ticket_id: uuid.UUID, ticket: TicketUpdate, pool=Depends(get_pool), current_user=Depends(get_current_user)):
    async with pool.acquire() as conn:
        existing_ticket = await conn.fetchrow(
            """
            SELECT t.* FROM tickets t
            JOIN projects p ON t.project_id = p.id
            WHERE t.id = $1 AND p.org_id = $2
            """,
            ticket_id,
            current_user["org_id"],
        )
        if not existing_ticket:
            raise HTTPException(status_code=404, detail="Ticket not found")

        # check if user is admin or reporter of the ticket
        if current_user.get("role") != "admin" and existing_ticket["reporter_id"] != current_user["id"]:
            # check if user is a member of the project
            is_member = await is_project_member(conn, existing_ticket["project_id"], current_user["id"])
            if not is_member:
                raise HTTPException(status_code=403, detail="Not authorized to update this ticket")

        # build dynamic update
        updated_fields = {k: v for k, v in ticket.dict(exclude_unset=True).items()}
        if not updated_fields:
            raise HTTPException(status_code=400, detail="No fields provided for update")

        set_clause = ", ".join([f"{key} = ${i+2}" for i, key in enumerate(updated_fields.keys())])
        values = list(updated_fields.values())

        query = f"UPDATE tickets SET {set_clause}, updated_at = NOW() WHERE id = $1 RETURNING *"
        row = await conn.fetchrow(query, ticket_id, *values)
        return dict(row)



# DELETE /tickets/done - Delete all done tickets in a project
@router.delete("/tickets/done")
async def delete_done_tickets(project_id: uuid.UUID, pool=Depends(get_pool), current_user=Depends(get_current_user)):
    if not current_user.get("org_id"):
        return {"deleted": 0}
    async with pool.acquire() as conn:
        project = await conn.fetchrow(
            "SELECT id FROM projects WHERE id = $1 AND org_id = $2",
            project_id,
            current_user["org_id"],
        )
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")

        if current_user.get("role") != "admin":
            is_member = await is_project_member(conn, project_id, current_user["id"])
            if not is_member:
                raise HTTPException(status_code=403, detail="Not authorized to delete this ticket")

        deleted = await conn.fetchval(
            """
            WITH deleted AS (
                DELETE FROM tickets WHERE project_id = $1 AND status = 'done' RETURNING id
            )
            SELECT count(*) FROM deleted
            """,
            project_id,
        )
        return {"deleted": deleted}


# DELETE /tickets/{ticket_id} - Delete a specific ticket by ID
@router.delete("/tickets/{ticket_id}", status_code=204)
async def delete_ticket(ticket_id: uuid.UUID, pool=Depends(get_pool), current_user=Depends(get_current_user)):
    async with pool.acquire() as conn:
        ticket = await conn.fetchrow(
            """
            SELECT t.project_id FROM tickets t
            JOIN projects p ON t.project_id = p.id
            WHERE t.id = $1 AND p.org_id = $2
            """,
            ticket_id,
            current_user["org_id"],
        )
        if not ticket:
            raise HTTPException(status_code=404, detail="Ticket not found")
        # check if user is admin 
        if current_user.get("role") != "admin":
            # check if user is a member of the project
            is_member = await is_project_member(conn, ticket["project_id"], current_user["id"])
            if not is_member:
                raise HTTPException(status_code=403, detail="Not authorized to delete this ticket")

        await conn.execute("DELETE FROM tickets WHERE id = $1", ticket_id)
