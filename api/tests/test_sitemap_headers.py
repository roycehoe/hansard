import pytest
from fastapi import status
from fastapi.testclient import TestClient

from services import sitemap as sitemap_service
from settings import settings


@pytest.fixture
def sitemap_client(
    website_client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> TestClient:
    monkeypatch.setattr(settings, "site_url", "https://hansard.example.sg")
    monkeypatch.setattr(
        sitemap_service,
        "_cached_file_name_to_xml",
        {"sitemap.xml": "<sitemapindex>" + "<sitemap/>" * 200 + "</sitemapindex>"},
    )
    return website_client


def test_the_sitemap_is_compressed_and_cacheable(sitemap_client: TestClient) -> None:
    response = sitemap_client.get("/sitemap.xml", headers={"Accept-Encoding": "gzip"})

    assert response.status_code == status.HTTP_200_OK
    assert response.headers["content-encoding"] == "gzip"
    assert response.headers["cache-control"] == "public, max-age=3600"
