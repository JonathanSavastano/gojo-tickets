from pydantic import BaseModel
from typing import Optional
import uuid

class TicketCreate(BaseModel):
    title: str
    description: Optional[str] = None
    priority: str
    type: str
    project_id: uuid.UUID
    reporter_id: uuid.UUID
    assignee_id: Optional[uuid.UUID] = None