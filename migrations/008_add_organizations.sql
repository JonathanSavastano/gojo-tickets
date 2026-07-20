CREATE TABLE organizations (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(100) NOT NULL,
    key         VARCHAR(10) NOT NULL UNIQUE,
    invite_code VARCHAR(20) NOT NULL UNIQUE,
    owner_id    UUID NOT NULL REFERENCES users(id),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE users ADD COLUMN org_id UUID REFERENCES organizations(id);

ALTER TABLE projects ADD COLUMN org_id UUID REFERENCES organizations(id);

CREATE INDEX idx_projects_org ON projects(org_id);
CREATE INDEX idx_users_org ON users(org_id);
