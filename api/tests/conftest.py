import os

_SCRATCH_DATABASE_URL = (
    "postgresql+psycopg://user:password@localhost:5435/hansard_launch"
)
_SCRATCH_HOST = "localhost"
_SCRATCH_PORT = 5435
_SCRATCH_DATABASE = "hansard_launch"
_WRONG_DATABASE_EXIT_CODE = 1

os.environ["DATABASE_URL"] = _SCRATCH_DATABASE_URL

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.engine import URL, make_url

from main import app
from middleware import response_cache
from settings import settings


def _is_scratch_database_url(database_url: URL) -> bool:
    return (
        database_url.host == _SCRATCH_HOST
        and database_url.port == _SCRATCH_PORT
        and database_url.database == _SCRATCH_DATABASE
    )


def pytest_sessionstart(session: pytest.Session) -> None:
    if not _is_scratch_database_url(make_url(settings.database_url)):
        pytest.exit(
            "DATABASE_URL does not point at the scratch database.",
            returncode=_WRONG_DATABASE_EXIT_CODE,
        )


@pytest.fixture(autouse=True)
def reset_response_cache(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(response_cache, "_cache_key_to_cached_response", {})


@pytest.fixture
def api_client() -> TestClient:
    return TestClient(app)


@pytest.fixture(scope="session")
def website_client(tmp_path_factory: pytest.TempPathFactory) -> TestClient:
    frontend_dist_path = tmp_path_factory.mktemp("frontend_dist")
    (frontend_dist_path / "index.html").write_text("<html><head></head></html>")
    os.environ["FRONTEND_DIST_PATH"] = str(frontend_dist_path)
    os.environ["PUBLIC_MODE"] = "true"
    import website

    return TestClient(website.app)
