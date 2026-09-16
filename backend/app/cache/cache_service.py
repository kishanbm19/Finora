"""
Minimal in-memory TTL cache.

This keeps the interface identical to what a Redis-backed cache would
look like, so swapping in Redis later (see docs/architecture.md,
section 13 "Future Scalability") only requires changing this module.
"""
import time
from typing import Any


class InMemoryCache:
    def __init__(self) -> None:
        self._store: dict[str, tuple[float, Any]] = {}

    def get(self, key: str) -> Any | None:
        entry = self._store.get(key)
        if not entry:
            return None
        expires_at, value = entry
        if expires_at < time.time():
            del self._store[key]
            return None
        return value

    def set(self, key: str, value: Any, ttl_seconds: int = 60) -> None:
        self._store[key] = (time.time() + ttl_seconds, value)

    def delete(self, key: str) -> None:
        self._store.pop(key, None)

    def clear(self) -> None:
        self._store.clear()


cache = InMemoryCache()
