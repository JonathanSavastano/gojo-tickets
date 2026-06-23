from fastapi import APIRouter, Depends, HTTPException
import uuid
from app.db import get_pool
from app import security
from app.schemas import ProjectCreate, ProjectUpdate, ProjectMemberCreate
from asyncpg import UniqueViolationError, ForeignKeyViolationError
from app.security import get_current_user, is_project_member, require_admin

router = APIRouter()


# POST /projects - Create a new project
@router.post("/projects")
async def create_project(project: ProjectCreate, pool = Depends(get_pool), current_user=Depends(get_current_user)):
    async with pool.acquire() as conn:
        try:
            row = await conn.fetchrow(
                """
                INSERT INTO projects (name, owner_id, key)
                VALUES ($1, $2, $3)
                RETURNING *
                """,
                project.name,
                current_user["id"],
                project.key
            )
            return dict(row)
        except UniqueViolationError:
            raise HTTPException(status_code=409, detail="Project key must be unique")


# GET /projects/{project_id} - Get a specific project by ID
@router.get("/projects/{project_id}")
async def get_project(project_id: uuid.UUID, pool = Depends(get_pool)):
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            """
            SELECT * FROM projects WHERE id = $1
            """,
            project_id
        )
        if not row:
            raise HTTPException(status_code=404, detail="Project not found")
        return dict(row)


# GET /projects - Get a list of all projects
@router.get("/projects")
async def get_projects(pool = Depends(get_pool)):
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            """
            SELECT * FROM projects
            """
        )
        return [dict(row) for row in rows]


# PATCH /projects/{project_id} - Update a specific project by ID
@router.patch("/projects/{project_id}")
async def update_project(project_id: uuid.UUID, project: ProjectUpdate, pool = Depends(get_pool), current_user=Depends(get_current_user)):
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            """
            UPDATE projects
            SET name = COALESCE($1, name),
                owner_id = COALESCE($2, owner_id)
            WHERE id = $3
            RETURNING *
            """,
            project.name,
            project.owner_id,
            project_id
        )
        if not row:
            raise HTTPException(status_code=404, detail="Project not found")
        return dict(row)


# DELETE /projects/{project_id} - Delete a specific project by ID
@router.delete("/projects/{project_id}", status_code=204)
async def delete_project(project_id: uuid.UUID, pool = Depends(get_pool), current_user=Depends(get_current_user)):
        async with pool.acquire() as conn:
            # check if user is admin 
            if current_user.get("role") != "admin":
                # check if user is a member of the project
                is_member = await is_project_member(conn, project_id, current_user["id"])
                if not is_member:
                    raise HTTPException(status_code=403, detail="You do not have permission to delete this project") 
            try:
                row = await conn.fetchrow(
                    """
                    DELETE FROM projects WHERE id = $1 RETURNING *
                    """,
                    project_id
                )
            except ForeignKeyViolationError:
                raise HTTPException(status_code=409, detail="Cannot delete project with existing tickets")

            if not row:
                raise HTTPException(status_code=404, detail="Project not found")


# add a user to a project 
@router.post("/projects/{project_id}/members")
async def add_project_member(project_id: uuid.UUID, member: ProjectMemberCreate, pool = Depends(get_pool), current_user=Depends(get_current_user)):
    async with pool.acquire() as conn:
        # check if user is admin 
        if current_user.get("role") != "admin":
            raise HTTPException(status_code=403, detail="You do not have permission to add members to this project") 
        try:
            row = await conn.fetchrow(
                """
                INSERT INTO project_members (project_id, user_id)
                VALUES ($1, $2)
                RETURNING *
                """,
                project_id,
                member.user_id
            )
            return dict(row)
        except UniqueViolationError:
            raise HTTPException(status_code=409, detail="User is already a member of this project")
        except ForeignKeyViolationError:
            raise HTTPException(status_code=404, detail="Project or user not found")