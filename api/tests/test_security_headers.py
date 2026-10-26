import pytest
from fastapi import status
from fastapi.testclient import TestClient

from services import sitemap as sitemap_service
from settings import settings

_EXPECTED_HEADERS = {
    "strict-transport-security": "max-age=31536000",
    "x-content-type-options": "nosniff",
    "referrer-policy": "strict-origin-when-cross-origin",
    "content-security-policy": "frame-ancestors 'none'",
}


@pytest.mark.parametrize(
    "path", ["/", "/api/no-such-route-xyz", "/sitemap.xml", "/robots.txt"]
)
def test_every_response_carries_the_four_security_headers(
    website_client: TestClient, monkeypatch: pytest.MonkeyPatch, path: str
) -> None:
    monkeypatch.setattr(settings, "site_url", "https://hansard.example.sg")
    monkeypatch.setattr(
        sitemap_service, "_cached_file_name_to_xml", {"sitemap.xml": "<sitemapindex/>"}
    )

    response = website_client.get(path)

    for name, value in _EXPECTED_HEADERS.items():
        assert response.headers[name] == value


def test_a_404_carries_the_four_security_headers(website_client: TestClient) -> None:
    response = website_client.get("/api/no-such-route-xyz")

    assert response.status_code == status.HTTP_404_NOT_FOUND
    for name, value in _EXPECTED_HEADERS.items():
        assert response.headers[name] == value
