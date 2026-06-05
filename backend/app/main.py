# entry point — where to create the FastAPI app instance and register routers.
from fastapi import FastAPI

app = FastAPI()

@app.get("/")
def root():
    return {"message": "Gojo API is running"}