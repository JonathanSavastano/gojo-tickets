from fastapi import APIRouter, Depends, HTTPException
import uuid
from app.db import get_pool
from app import security
from app.schemas import ProjectCreate, ProjectUpdate
from asyncpg import UniqueViolationError, ForeignKeyViolationError

router = APIRouter()

@router.post("/projects")
async def create_project(project: ProjectCreate, pool = Depends(get_pool)):
    async with pool.acquire() as conn:
        try:
            row = await conn.fetchrow(
                """
                INSERT INTO projects (name, owner_id, key)
                VALUES ($1, $2, $3)
                RETURNING *
                """,
                project.name,
                project.owner_id,
                project.key
            )
            return dict(row)
        except UniqueViolationError:
            raise HTTPException(status_code=409, detail="Project key must be unique")

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

@router.get("/projects")
async def get_projects(pool = Depends(get_pool)):
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            """
            SELECT * FROM projects
            """
        )
        return [dict(row) for row in rows]

@router.patch("/projects/{project_id}")
async def update_project(project_id: uuid.UUID, project: ProjectUpdate, pool = Depends(get_pool)):
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

@router.delete("/projects/{project_id}", status_code=204)
async def delete_project(project_id: uuid.UUID, pool = Depends(get_pool)):
    async with pool.acquire() as conn:
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