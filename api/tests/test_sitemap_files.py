import pytest
from fastapi import status
from fastapi.testclient import TestClient

from services import sitemap as sitemap_service
from settings import settings

pytestmark = pytest.mark.database

_SITE_URL = "https://hansard.example.sg"
_PUBLIC_CACHE_CONTROL = "public, max-age=3600"


@pytest.fixture
def sitemap_client(
    website_client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> TestClient:
    monkeypatch.setattr(settings, "site_url", _SITE_URL)
    monkeypatch.setattr(sitemap_service, "_cached_file_name_to_xml", None)
    return website_client


@pytest.mark.parametrize("kind", ["sittings", "people", "reports"])
def test_the_sitemap_index_lists_the_first_file_of_each_kind(
    sitemap_client: TestClient, kind: str
) -> None:
    response = sitemap_client.get("/sitemap.xml")

    assert response.status_code == status.HTTP_200_OK
    assert f"<loc>{_SITE_URL}/sitemap-{kind}-1.xml</loc>" in response.text


@pytest.mark.parametrize("kind", ["sittings", "people", "reports"])
def test_the_first_sitemap_file_of_each_kind_answers_xml_with_public_cache_control(
    sitemap_client: TestClient, kind: str
) -> None:
    response = sitemap_client.get(f"/sitemap-{kind}-1.xml")

    assert response.status_code == status.HTTP_200_OK
    assert response.headers["content-type"].startswith("application/xml")
    assert response.headers["cache-control"] == _PUBLIC_CACHE_CONTROL
    assert "<urlset" in response.text
    assert f"<loc>{_SITE_URL}/{kind}/" in response.text
