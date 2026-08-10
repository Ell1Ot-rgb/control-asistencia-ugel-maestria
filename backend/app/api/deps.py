"""Auth dependency — TEC-D03 / TEC-D04."""

from fastapi import Header, HTTPException

from app.services.auth_service import auth_service
from app.services.session_store import SessionStoreUnavailable


def require_token(authorization: str | None = Header(default=None)) -> dict:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Bearer token required")
    token = authorization.split(" ", 1)[1].strip()
    try:
        session = auth_service.current(token)
    except SessionStoreUnavailable as exc:
        raise HTTPException(
            status_code=503, detail="Session service unavailable"
        ) from exc
    if not session:
        raise HTTPException(status_code=401, detail="Invalid or expired session")
    session["token"] = token
    return session
