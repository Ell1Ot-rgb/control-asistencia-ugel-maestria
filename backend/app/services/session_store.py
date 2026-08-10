"""TEC-D03 — Redis session store with in-memory fallback for local demo."""
from __future__ import annotations

import json
import time
from typing import Any, Optional

from app.core.config import settings

try:
    import redis
except ImportError:  # pragma: no cover
    redis = None  # type: ignore


class SessionStore:
    def __init__(self) -> None:
        self._client = None
        self._memory: dict[str, tuple[float, str]] = {}

    def _redis(self):
        if redis is None:
            return None
        if self._client is None:
            try:
                self._client = redis.from_url(settings.redis_url, decode_responses=True)
                self._client.ping()
            except Exception:
                self._client = None
        return self._client

    def save(self, token: str, payload: dict[str, Any], ttl_seconds: int) -> None:
        raw = json.dumps(payload)
        client = self._redis()
        if client is not None:
            try:
                client.setex(f"session:{token}", ttl_seconds, raw)
                return
            except Exception:
                pass
        self._memory[token] = (time.time() + ttl_seconds, raw)

    def get(self, token: str) -> Optional[dict[str, Any]]:
        client = self._redis()
        if client is not None:
            try:
                raw = client.get(f"session:{token}")
                if raw:
                    return json.loads(raw)
            except Exception:
                pass
        item = self._memory.get(token)
        if not item:
            return None
        exp, raw = item
        if time.time() > exp:
            self._memory.pop(token, None)
            return None
        return json.loads(raw)

    def delete(self, token: str) -> None:
        client = self._redis()
        if client is not None:
            try:
                client.delete(f"session:{token}")
            except Exception:
                pass
        self._memory.pop(token, None)


session_store = SessionStore()
