from pathlib import Path

import pytest
from fastapi import status
from fastapi.testclient import TestClient
from starlette.applications import Starlette
from starlette.routing import Mount

from middleware import frontend
from services import preview as preview_service


@pytest.fixture
def frontend_client(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> TestClient:
    (tmp_path / "index.html").write_text("<html><head></head></html>")
    (tmp_path / "robots.txt").write_text("User-agent: *")
    (tmp_path / "assets").mkdir()
    (tmp_path / "assets" / "index-Da9v3Mju.js").write_text("console.log(1)")
    monkeypatch.setattr(
        frontend,
        "_get_page_preview",
        lambda path, ordinal, anchor: preview_service.get_default_preview(),
    )
    return TestClient(
        Starlette(
            routes=[Mount("/", frontend.FrontendFiles(tmp_path, None), name="frontend")]
        )
    )


def test_a_built_asset_is_stored_for_a_year(frontend_client: TestClient) -> None:
    response = frontend_client.get("/assets/index-Da9v3Mju.js")

    assert response.status_code == status.HTTP_200_OK
    assert response.headers["cache-control"] == "public, max-age=31536000, immutable"


@pytest.mark.parametrize("path", ["/", "/reports/bill-818"])
def test_the_page_is_checked_again_on_each_visit(
    frontend_client: TestClient, path: str
) -> None:
    response = frontend_client.get(path)

    assert response.status_code == status.HTTP_200_OK
    assert response.headers["cache-control"] == "no-cache"


def test_a_file_outside_assets_gets_no_cache_control(
    frontend_client: TestClient,
) -> None:
    response = frontend_client.get("/robots.txt")

    assert response.status_code == status.HTTP_200_OK
    assert "cache-control" not in response.headers
