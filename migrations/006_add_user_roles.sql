CREATE TYPE user_role AS ENUM (
    'admin', 
    'member',
    'viewer'
);

ALTER TABLE users ADD COLUMN role user_role NOT NULL DEFAULT 'viewer';