Run these sql queries in the order they appear, BUT FIRST:

1) Install postgresql
2) psql -U posgres
3) CREATE DATABASE ticketing;
4) \c ticketing

notes:
1) to list all tables: ``` \dt ```
2) to describe a specific table's column's and contraints: ``` \d tickets ```


TEST TICKET QUERY:
```
INSERT INTO tickets (sequence_number, key, title, status, priority, type, project_id, reporter_id)
VALUES (
    1,
    'TEST-1',
    'My first ticket',
    'open',
    'medium',
    'task',
    gen_random_uuid(),
    gen_random_uuid()
);

```

TEST USER QUERY
-- 1. Create a test user
INSERT INTO users (email, display_name, password_hash)
VALUES ('test@test.com', 'Test User', 'fakehash')
RETURNING id;

TEST PROJECT QUERY
-- 2. Create a test project (paste your user UUID in for owner_id)
INSERT INTO projects (name, key, owner_id)
VALUES ('Test Project', 'TEST', '<your-user-uuid-here>')
RETURNING id;

copy project UUID that comes back
-- 3. Now insert the ticket with real foreign keys
INSERT INTO tickets (sequence_number, key, title, status, priority, type, project_id, reporter_id)
VALUES (1, 'TEST-1', 'My first ticket', 'open', 'medium', 'task', '<your-project-uuid>', '<your-user-uuid>');

Query database to see tickets:
SELECT id, key, title FROM tickets;