import time
from typing import Any, Dict, Tuple, Optional

class TTLCache:
    """
    Lightweight, thread-safe asynchronous in-memory cache with TTL (Time-To-Live).
    Used to cache external API responses to improve speed and prevent API rate-limiting.
    """
    def __init__(self, default_ttl_seconds: int = 600):
        self.default_ttl = default_ttl_seconds
        self.cache: Dict[str, Tuple[Any, float]] = {}

    def set(self, key: str, value: Any, ttl_seconds: Optional[int] = None) -> None:
        """Store value with key and associated expiration timestamp."""
        duration = ttl_seconds if ttl_seconds is not None else self.default_ttl
        expiry = time.time() + duration
        self.cache[key] = (value, expiry)

    def get(self, key: str) -> Optional[Any]:
        """Retrieve cached value if it exists and is not expired."""
        if key not in self.cache:
            return None
            
        value, expiry = self.cache[key]
        if time.time() > expiry:
            # Clean up expired item lazily
            del self.cache[key]
            return None
            
        return value

    def clear(self) -> None:
        """Clear all cached entries."""
        self.cache.clear()

# Global cache instance for repository metadata
repo_cache = TTLCache(default_ttl_seconds=600)  # 10 minutes cache
