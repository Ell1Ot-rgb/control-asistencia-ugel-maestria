"""TEC-D05 — wizard import routes."""
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from pydantic import BaseModel

from app.api.deps import require_token
from app.services.audit_service import audit_service
from app.services.biometric_import_service import biometric_import_service

router = APIRouter(prefix="/api/v1/biometric-imports", tags=["biometric-imports"])


@router.get("")
def list_imports(session: dict = Depends(require_token)):
    return []


@router.post("", status_code=201)
async def create_import(file: UploadFile = File(...), session: dict = Depends(require_token)):
    # Parse CSV/XLSX in full implementation; stub keeps order and match flags
    content = await file.read()
    rows = [
        {"row_id": 1, "order": 1, "dni": "45678912", "last_names": "Demo", "first_names": "Uno", "match": "matched", "resolved": True},
        {"row_id": 2, "order": 2, "dni": "99999999", "last_names": "Nuevo", "first_names": "Dos", "match": "new", "resolved": False},
    ]
    imp = biometric_import_service.create_draft_from_upload(file.filename or "upload.bin", rows)
    audit_service.record(user_id=session["user_id"], entity_name="biometric_import", entity_id=imp["id"], action_name="create", new_value={"file": file.filename, "bytes": len(content)})
    return imp


@router.get("/{id}")
def get_import(id: int, session: dict = Depends(require_token)):
    imp = biometric_import_service.get(id)
    if not imp:
        raise HTTPException(404, "No encontrado")
    return imp


class RowPatch(BaseModel):
    dni: str | None = None
    last_names: str | None = None
    first_names: str | None = None
    action: str  # research | register_new | skip


@router.patch("/{id}/rows/{row_id}")
def patch_row(id: int, row_id: int, body: RowPatch, session: dict = Depends(require_token)):
    imp = biometric_import_service.get(id)
    if not imp:
        raise HTTPException(404)
    if imp["status"] != "draft":
        raise HTTPException(409, "Solo borrador")
    for r in imp["rows"]:
        if r["row_id"] == row_id:
            if body.dni:
                r["dni"] = body.dni
            if body.action in ("register_new", "skip", "research"):
                r["resolved"] = True
                if body.action == "register_new":
                    r["match"] = "matched"
            return r
    raise HTTPException(404, "Fila no encontrada")


@router.post("/{id}/confirmation")
def confirm(id: int, session: dict = Depends(require_token)):
    try:
        imp = biometric_import_service.confirm(id)
    except ValueError as e:
        code = str(e)
        if code == "conflict_not_draft":
            raise HTTPException(409, "No está en borrador")
        if code == "unresolved_new_rows":
            raise HTTPException(400, "Hay personal nuevo sin resolver")
        raise
    audit_service.record(user_id=session["user_id"], entity_name="biometric_import", entity_id=id, action_name="confirm")
    return imp


class CancelBody(BaseModel):
    reason: str


@router.post("/{id}/cancellation")
def cancel(id: int, body: CancelBody, session: dict = Depends(require_token)):
    try:
        imp = biometric_import_service.cancel(id, body.reason)
    except ValueError:
        raise HTTPException(409, "Solo cargas confirmadas")
    audit_service.record(user_id=session["user_id"], entity_name="biometric_import", entity_id=id, action_name="cancel", new_value={"reason": body.reason})
    return imp
