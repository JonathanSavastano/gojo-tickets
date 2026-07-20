# entry point — where to create the FastAPI app instance and register routers.
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.db import create_pool
from app.routers import tickets, users, projects, auth, organizations

@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.db_pool = await create_pool() # runsat startup, creates a connection pool and stores it in app state for access in routes
    yield
    await app.state.db_pool.close() # runs at shutdown, closes the connection pool to clean up resources
    
app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(tickets.router) # register the tickets router to handle /tickets endpoints
app.include_router(users.router) # register the users router to handle /users endpoints
app.include_router(projects.router) # register the projects router to handle /projects endpoints
app.include_router(auth.router) # register the auth router to handle /auth endpoints
app.include_router(organizations.router) # register the organizations router to handle /organizations endpoints

@app.get("/")
def root():
    return {"message": "Gojo API is running"}