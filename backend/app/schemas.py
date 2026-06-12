from pydantic import BaseModel
from typing import Optional
import uuid
from enum import Enum

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

class TicketCreate(BaseModel):
    title: str
    description: Optional[str] = None
    priority: TicketPriority
    type: TicketType
    project_id: uuid.UUID
    reporter_id: uuid.UUID
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

class UserUpdate(BaseModel):
    email: Optional[str] = None
    password: Optional[str] = None
    display_name: Optional[str] = None

class UserResponse(BaseModel):
    id: uuid.UUID
    email: str
    display_name: str 
    created_at: str
    updated_at: str