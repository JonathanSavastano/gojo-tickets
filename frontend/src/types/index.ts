export type TicketStatus = 'open' | 'in_progress' | 'in_review' | 'done' | 'cancelled';
export type TicketPriority = 'low' | 'medium' | 'high' | 'critical';
export type TicketType = 'bug' | 'task' | 'story' | 'improvement';
export type UserRole = 'admin' | 'member' | 'viewer';

export interface Organization {
  id: string;
  name: string;
  key: string;
  invite_code: string;
  owner_id: string;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  email: string;
  display_name: string;
  role: UserRole;
  org_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  name: string;
  key: string;
  owner_id: string;
  created_at: string;
  updated_at: string;
}

export interface Ticket {
  id: string;
  sequence_number: number;
  key: string;
  title: string;
  description: string | null;
  status: TicketStatus;
  priority: TicketPriority;
  type: TicketType;
  project_id: string;
  reporter_id: string;
  reporter_name: string;
  assignee_id: string | null;
  assignee_name: string | null;
  due_date: string | null;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
}

export interface Comment {
  id: string;
  body: string;
  ticket_id: string;
  author_id: string;
  created_at: string;
  updated_at: string;
}

export interface ProjectMember {
  id: string;
  email: string;
  display_name: string;
  role: UserRole;
}

export interface TicketCreate {
  title: string;
  description?: string;
  priority: TicketPriority;
  type: TicketType;
  project_id: string;
  assignee_id?: string;
}

export interface TicketUpdate {
  title?: string;
  description?: string;
  status?: TicketStatus;
  priority?: TicketPriority;
  type?: TicketType;
  assignee_id?: string | null;
}

export interface ProjectCreate {
  name: string;
  key: string;
}

export interface UserCreate {
  email: string;
  password: string;
  display_name: string;
}

export const STATUS_LABELS: Record<TicketStatus, string> = {
  open: 'Open',
  in_progress: 'In Progress',
  in_review: 'In Review',
  done: 'Done',
  cancelled: 'Cancelled',
};

export const PRIORITY_LABELS: Record<TicketPriority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  critical: 'Critical',
};

export const TYPE_LABELS: Record<TicketType, string> = {
  bug: 'Bug',
  task: 'Task',
  story: 'Story',
  improvement: 'Improvement',
};
