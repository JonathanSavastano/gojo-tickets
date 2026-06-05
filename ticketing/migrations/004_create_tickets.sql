CREATE TABLE tickets (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sequence_number   INTEGER NOT NULL,
    key               VARCHAR(20) NOT NULL UNIQUE,
    title             VARCHAR(255) NOT NULL,
    description       TEXT,
    status            ticket_status NOT NULL DEFAULT 'open',
    priority          ticket_priority NOT NULL DEFAULT 'medium',
    type              ticket_type NOT NULL DEFAULT 'task',
    project_id        UUID NOT NULL REFERENCES projects(id),
    reporter_id       UUID NOT NULL REFERENCES users(id),
    assignee_id       UUID REFERENCES users(id),
    due_date          TIMESTAMPTZ,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved_at       TIMESTAMPTZ,
    UNIQUE(project_id, sequence_number)
);