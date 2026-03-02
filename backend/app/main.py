from fastapi import FastAPI
from .routers import users

app = FastAPI(title="hostelOps API")

app.include_router(users.router, prefix="/users")
