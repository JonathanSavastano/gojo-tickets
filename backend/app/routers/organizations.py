from fastapi import APIRouter, Depends, HTTPException
import uuid
import secrets
from app.db import get_pool
from app.schemas import OrganizationCreate, OrganizationJoin, OrganizationResponse
from app.security import get_current_user
from asyncpg import UniqueViolationError

router = APIRouter()


def generate_invite_code() -> str:
    return secrets.token_urlsafe(8)


# POST /organizations - Create a new organization (user becomes owner)
@router.post("/organizations")
async def create_organization(
    org: OrganizationCreate,
    pool=Depends(get_pool),
    current_user=Depends(get_current_user),
):
    if current_user.get("org_id"):
        raise HTTPException(
            status_code=400,
            detail="You already belong to an organization. Leave it first.",
        )

    invite_code = generate_invite_code()

    async with pool.acquire() as conn:
        try:
            org_row = await conn.fetchrow(
                """
                INSERT INTO organizations (name, key, invite_code, owner_id)
                VALUES ($1, $2, $3, $4)
                RETURNING *
                """,
                org.name,
                org.key.upper(),
                invite_code,
                current_user["id"],
            )
            await conn.execute(
                "UPDATE users SET org_id = $1, role = 'admin', updated_at = NOW() WHERE id = $2",
                org_row["id"],
                current_user["id"],
            )
        except UniqueViolationError:
            raise HTTPException(
                status_code=409, detail="Organization key already exists"
            )

    return OrganizationResponse(**dict(org_row))


# GET /organizations/me - Get current user's organization
@router.get("/organizations/me")
async def get_my_organization(
    pool=Depends(get_pool),
    current_user=Depends(get_current_user),
):
    if not current_user.get("org_id"):
        raise HTTPException(status_code=404, detail="You are not in an organization")

    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "SELECT * FROM organizations WHERE id = $1",
            current_user["org_id"],
        )
        if not row:
            raise HTTPException(status_code=404, detail="Organization not found")
        return OrganizationResponse(**dict(row))


# POST /organizations/join - Join an organization via invite code
@router.post("/organizations/join")
async def join_organization(
    data: OrganizationJoin,
    pool=Depends(get_pool),
    current_user=Depends(get_current_user),
):
    if current_user.get("org_id"):
        raise HTTPException(
            status_code=400,
            detail="You already belong to an organization. Leave it first.",
        )

    async with pool.acquire() as conn:
        org_row = await conn.fetchrow(
            "SELECT * FROM organizations WHERE invite_code = $1",
            data.invite_code,
        )
        if not org_row:
            raise HTTPException(
                status_code=404, detail="Invalid invite code"
            )
        await conn.execute(
            "UPDATE users SET org_id = $1, updated_at = NOW() WHERE id = $2",
            org_row["id"],
            current_user["id"],
        )
    return OrganizationResponse(**dict(org_row))


# DELETE /organizations/leave - Leave current organization
@router.delete("/organizations/leave", status_code=204)
async def leave_organization(
    pool=Depends(get_pool),
    current_user=Depends(get_current_user),
):
    if not current_user.get("org_id"):
        raise HTTPException(status_code=400, detail="You are not in an organization")

    if current_user.get("org_id"):
        async with pool.acquire() as conn:
            org_row = await conn.fetchrow(
                "SELECT owner_id FROM organizations WHERE id = $1",
                current_user["org_id"],
            )
            if org_row and org_row["owner_id"] == current_user["id"]:
                raise HTTPException(
                    status_code=400,
                    detail="Organization owners cannot leave. Transfer ownership or delete the organization.",
                )
            await conn.execute(
                "UPDATE users SET org_id = NULL, updated_at = NOW() WHERE id = $1",
                current_user["id"],
            )
