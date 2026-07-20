# Gojo Tickets - Local Setup & Project Notes

## Local Development Setup

### PostgreSQL
- Running on localhost:5432
- Database: `ticketing`
- User: `postgres`
- Password: `jonny`
- pg_hba.conf: IPv4 (127.0.0.1/32) set to `md5`, IPv6 (::1/128) set to `md5`
- Path: `/var/lib/pgsql/data/pg_hba.conf`

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

`.env` file in `backend/`:
```
DATABASE_URL=postgresql://postgres:jonny@localhost:5432/ticketing
JWT_SECRET_KEY=my-super-secret-dev-key-123
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```
- Runs at http://localhost:5173
- Backend at http://localhost:8000

### Database Migrations
Run in order:
```bash
chmod 644 migrations/*.sql
sudo -u postgres psql -d ticketing -f migrations/001_create_enums.sql
sudo -u postgres psql -d ticketing -f migrations/002_create_users.sql
sudo -u postgres psql -d ticketing -f migrations/003_create_projects.sql
sudo -u postgres psql -d ticketing -f migrations/004_create_tickets.sql
sudo -u postgres psql -d ticketing -f migrations/005_create_comments.sql
sudo -u postgres psql -d ticketing -f migrations/006_add_user_roles.sql
sudo -u postgres psql -d ticketing -f migrations/007_create_project_members.sql
```

### Admin User
Created via Python to avoid bash escaping issues with bcrypt hashes:
```bash
/home/Jonjoe/Projects/gojo-tickets/backend/venv/bin/python <<'PYEOF'
import subprocess
from passlib.context import CryptContext
pwd = "password123"
h = CryptContext(schemes=["bcrypt"]).hash(pwd)
sql = f"INSERT INTO users (email, display_name, password_hash, role) VALUES ('admin@gmail.com', 'admin', '{h}', 'admin');"
subprocess.run(["sudo", "-u", "postgres", "psql", "-d", "ticketing", "-c", sql], check=True)
PYEOF
```
- Email: `admin@gmail.com`
- Password: `password123`
- Role: `admin`

## What Was Built

### Features
- **Projects**: Create, view, delete (admin only)
- **Tickets**: Full CRUD with board/list views, status workflow
- **Users**: Admin page to list, create, delete, change roles (`/admin/users`)
- **Project Members**: Admin can add/remove members from project detail page
- **Auth**: Login/register with JWT tokens, bcrypt password hashing
- **CORS**: Configured for `http://localhost:5173`

### Key Files Modified/Created
- `backend/app/main.py` — Added CORS middleware
- `frontend/src/pages/AdminUsersPage.tsx` — New admin users management page
- `frontend/src/api/client.ts` — Added `deleteUser`, `updateUserRole` functions
- `frontend/src/App.tsx` — Added `/admin/users` route
- `frontend/src/components/Navbar.tsx` — Added "Users" link for admins
- `frontend/src/pages/DashboardPage.tsx` — Added delete project button (admin)
- `frontend/src/pages/ProjectPage.tsx` — Added members management panel (admin)
- `frontend/src/index.css` — Added styles for users table, members panel, etc.

### Backend Endpoints
| Method | Endpoint | Auth |
|--------|----------|------|
| POST | `/auth/login` | None |
| POST | `/users` | None |
| GET | `/users` | None |
| GET | `/users/me` | Current user |
| GET | `/users/{id}` | None |
| PATCH | `/users/{id}` | Current user |
| DELETE | `/users/{id}` | Current user |
| PATCH | `/users/{id}/role` | Admin only |
| POST | `/projects` | Current user |
| GET | `/projects` | None |
| GET | `/projects/{id}` | None |
| PATCH | `/projects/{id}` | Admin or member |
| DELETE | `/projects/{id}` | Admin or member |
| POST | `/projects/{id}/members` | Admin only |
| GET | `/projects/{id}/members` | Admin or member |
| DELETE | `/projects/{id}/members/{user_id}` | Admin only |
| POST | `/tickets` | Current user |
| GET | `/tickets` | None |
| GET | `/tickets/{id}` | None |
| PATCH | `/tickets/{id}` | Current user |
| DELETE | `/tickets/{id}` | Current user |

## CI/CD Discussion (TODO)

### Goal
When merging a branch into `main` on GitHub, auto-build and deploy.

### Options Considered
1. **Railway** — Easiest non-Vercel option. Backend + PostgreSQL together. ~$5-10/month on Hobby plan.
2. **Render** — Free tier available (DB spins down after inactivity). Good free option.
3. **Supabase (free DB) + Railway Free + Cloudflare Pages** — ~$1/month total.

### Recommended Approach (pending decision)
- **Supabase** for free PostgreSQL (500MB)
- **Railway Free Plan** for FastAPI backend ($1/month credit)
- **Cloudflare Pages** for React frontend (free)
- Total: ~$1/month or possibly free

### Next Steps for CI/CD
- [ ] Choose hosting provider
- [ ] Create Dockerfile or start command config
- [ ] Add GitHub Actions workflow (`.github/workflows/deploy.yml`)
- [ ] Set up database migrations as part of deploy
- [ ] Configure environment variables on hosting platform
- [ ] Set up frontend build and deploy
