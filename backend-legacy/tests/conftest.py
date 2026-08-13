import sys
import os
import pytest
import asyncio
from typing import Generator
from fastapi.testclient import TestClient

# Adjust path to enable backend imports during test runs
backend_path = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_path not in sys.path:
    sys.path.append(backend_path)

from app.main import app

@pytest.fixture(scope="session")
def event_loop() -> Generator[asyncio.AbstractEventLoop, None, None]:
    """Create an instance of the default event loop for session scope."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()

@pytest.fixture(scope="module")
def client() -> TestClient:
    """FastAPI TestClient fixture for endpoint integration tests."""
    with TestClient(app) as c:
        yield c
