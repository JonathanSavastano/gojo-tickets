CREATE TYPE ticket_status AS ENUM (
    'open',
    'in_progress',
    'in_review',
    'done',
    'cancelled'
);

CREATE TYPE ticket_priority AS ENUM (
    'low',
    'medium',
    'high',
    'critical'
);

CREATE TYPE ticket_type AS ENUM (
    'bug',
    'task',
    'story',
    'improvement'
);