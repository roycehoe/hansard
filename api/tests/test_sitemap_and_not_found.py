from pathlib import Path

import pytest
from fastapi import FastAPI, status
from fastapi.testclient import TestClient
from starlette.routing import Mount

from middleware import frontend
from routers import sitemap
from services import sitemap as sitemap_service
from settings import settings

pytestmark = pytest.mark.database

_SITE_URL = "https://hansard.example.sg"


@pytest.fixture
def site_client(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> TestClient:
    (tmp_path / "index.html").write_text("<html><head></head></html>")
    monkeypatch.setattr(settings, "site_url", _SITE_URL)
    monkeypatch.setattr(sitemap_service, "_cached_file_name_to_xml", None)
    app = FastAPI()
    app.include_router(sitemap.router)
    app.router.routes.append(
        Mount("/", frontend.FrontendFiles(tmp_path, _SITE_URL), name="frontend")
    )
    return TestClient(app)


def test_the_sitemap_index_answers_xml(site_client: TestClient) -> None:
    response = site_client.get("/sitemap.xml")

    assert response.status_code == status.HTTP_200_OK
    assert response.headers["content-type"].startswith("application/xml")
    assert "<sitemapindex" in response.text
    assert f"<loc>{_SITE_URL}/sitemap-reports-1.xml</loc>" in response.text


@pytest.mark.parametrize(
    "path",
    [
        "/reports/no-such-report-xyz",
        "/people/999999999",
        "/people/99999999999999999999",
        "/sittings/1900-01-01",
        "/sittings/2020-13-45",
        "/no-such-page-xyz",
    ],
)
def test_an_unknown_slug_or_path_answers_404(
    site_client: TestClient, path: str
) -> None:
    response = site_client.get(path)

    assert response.status_code == status.HTTP_404_NOT_FOUND


@pytest.mark.parametrize("path", ["/sitemap.xml", "/sitemap-reports-1.xml"])
def test_a_head_request_for_a_sitemap_answers_xml_with_no_body(
    site_client: TestClient, path: str
) -> None:
    response = site_client.head(path)

    assert response.status_code == status.HTTP_200_OK
    assert response.headers["content-type"].startswith("application/xml")
    assert response.content == b""
