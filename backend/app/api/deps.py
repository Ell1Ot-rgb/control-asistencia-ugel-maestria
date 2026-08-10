"""Auth dependency — TEC-D03 / TEC-D04."""
from fastapi import Header, HTTPException

from app.services.auth_service import auth_service


def require_token(authorization: str | None = Header(default=None)) -> dict:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Token requerido")
    token = authorization.split(" ", 1)[1].strip()
    session = auth_service.current(token)
    if not session:
        # demo fallback: accept token shape when redis empty after login warning
        raise HTTPException(status_code=401, detail="Sesión inválida o expirada")
    session["token"] = token
    return session
