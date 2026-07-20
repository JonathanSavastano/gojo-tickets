from pydantic import BaseModel
from typing import Optional
import uuid
from enum import Enum
from datetime import datetime

class TicketStatus(str, Enum):
    open = "open"
    in_progress = "in_progress"
    in_review = "in_review"
    done = "done"
    cancelled = "cancelled"

class TicketPriority(str, Enum):
    low = "low"
    medium = "medium"
    high = "high"
    critical = "critical"

class TicketType(str, Enum):
    bug = "bug"
    task = "task"
    story = "story"
    improvement = "improvement"

class UserRole(str, Enum):
    admin = "admin"
    member = "member"
    viewer = "viewer"

class TicketCreate(BaseModel):
    title: str
    description: Optional[str] = None
    priority: TicketPriority
    type: TicketType
    project_id: uuid.UUID
    assignee_id: Optional[uuid.UUID] = None

class TicketUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[TicketStatus] = None
    priority: Optional[TicketPriority] = None
    type: Optional[TicketType] = None
    assignee_id: Optional[uuid.UUID] = None

class UserCreate(BaseModel):
    email: str
    password: str
    display_name: str
    role: Optional[UserRole] = None

class UserUpdate(BaseModel):
    email: Optional[str] = None
    password: Optional[str] = None
    display_name: Optional[str] = None

class OrganizationCreate(BaseModel):
    name: str
    key: str

class OrganizationJoin(BaseModel):
    invite_code: str

class OrganizationResponse(BaseModel):
    id: uuid.UUID
    name: str
    key: str
    invite_code: str
    owner_id: uuid.UUID
    created_at: datetime
    updated_at: datetime

class UserResponse(BaseModel):
    id: uuid.UUID
    email: str
    display_name: str 
    role: UserRole
    org_id: Optional[uuid.UUID] = None
    created_at: datetime
    updated_at: datetime

class ProjectCreate(BaseModel):
    name: str
    key: str

class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    owner_id: Optional[uuid.UUID] = None 

class LoginRequest(BaseModel):
    email: str
    password: str

class ProjectMemberCreate(BaseModel):
    user_id: uuid.UUID

class UserRoleUpdate(BaseModel):
    role: UserRole