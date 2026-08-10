"""TEC-D03 — password hashing helpers."""
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(plain: str) -> str:
    return pwd_context.hash(plain)


def verify_password(plain: str, password_hash: str) -> bool:
    try:
        return pwd_context.verify(plain, password_hash)
    except Exception:
        return False
