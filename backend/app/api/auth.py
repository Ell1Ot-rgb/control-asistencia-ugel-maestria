"""TEC-D03 — auth routes."""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.api.deps import require_token
from app.services.auth_service import auth_service

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])


class LoginBody(BaseModel):
    username: str
    password: str


@router.post("/sessions")
def start_session(body: LoginBody):
    result = auth_service.login(body.username, body.password)
    if not result:
        raise HTTPException(status_code=401, detail="Credenciales inválidas")
    return result


@router.get("/sessions/current")
def current_session(session: dict = Depends(require_token)):
    return {
        "username": session.get("username"),
        "role": session.get("role"),
        "access": session.get("access"),
    }


@router.delete("/sessions/current")
def end_session(session: dict = Depends(require_token)):
    auth_service.logout(session["token"])
    return {"mensaje": "Sesión cerrada"}
