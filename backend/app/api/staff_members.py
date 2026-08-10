"""TEC-D04 related — staff CRUD contract."""
from fastapi import APIRouter, Depends
from pydantic import BaseModel

from app.api.deps import require_token

router = APIRouter(prefix="/api/v1/staff-members", tags=["staff"])

_DB: list[dict] = []


class StaffIn(BaseModel):
    dni: str
    last_names: str
    first_names: str
    job_title: str
    employment_status: str | None = None


@router.get("")
def list_staff(q: str | None = None, session: dict = Depends(require_token)):
    rows = _DB
    if q:
        ql = q.lower()
        rows = [r for r in rows if ql in r["dni"] or ql in r["last_names"].lower()]
    return rows


@router.post("", status_code=201)
def create_staff(body: StaffIn, session: dict = Depends(require_token)):
    row = body.model_dump()
    row["id"] = len(_DB) + 1
    row["is_active"] = "Y"
    _DB.append(row)
    return row


@router.get("/{id}")
def get_staff(id: int, session: dict = Depends(require_token)):
    for r in _DB:
        if r["id"] == id:
            return r
    from fastapi import HTTPException
    raise HTTPException(404, "No encontrado")


@router.put("/{id}")
def update_staff(id: int, body: StaffIn, session: dict = Depends(require_token)):
    for r in _DB:
        if r["id"] == id:
            r.update(body.model_dump())
            return r
    from fastapi import HTTPException
    raise HTTPException(404, "No encontrado")


@router.post("/{id}/deactivation")
def deactivate(id: int, session: dict = Depends(require_token)):
    for r in _DB:
        if r["id"] == id:
            r["is_active"] = "N"
            return r
    from fastapi import HTTPException
    raise HTTPException(404, "No encontrado")
