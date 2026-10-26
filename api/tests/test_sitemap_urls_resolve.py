import random
from urllib.parse import urlsplit
from xml.etree import ElementTree

import pytest
from fastapi import status
from fastapi.testclient import TestClient

from services import sitemap as sitemap_service
from settings import settings

pytestmark = pytest.mark.database

_SAMPLE_SEED = 20261026
_SITEMAP_URL_SAMPLE_SIZE = 500
_SITE_URL = "https://hansard.example.sg"
_SITEMAP_NAMESPACE = "http://www.sitemaps.org/schemas/sitemap/0.9"
_LOCATION_TAG = f"{{{_SITEMAP_NAMESPACE}}}loc"
_PERSON_ID_SEPARATOR = "-"


@pytest.fixture
def sitemap_client(
    website_client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> TestClient:
    monkeypatch.setattr(settings, "site_url", _SITE_URL)
    monkeypatch.setattr(sitemap_service, "_cached_file_name_to_xml", None)
    return website_client


def _get_locations(sitemap_xml: str) -> list[str]:
    return [
        location.text or ""
        for location in ElementTree.fromstring(sitemap_xml).iter(_LOCATION_TAG)
    ]


def _get_api_path(page_path: str) -> str:
    kind, _, page_slug = page_path.removeprefix("/").partition("/")
    if kind == "people":
        return f"/api/people/{page_slug.split(_PERSON_ID_SEPARATOR)[0]}"
    return f"/api/{kind}/{page_slug}"


def test_a_sample_of_sitemap_urls_resolve_as_pages_and_through_the_api(
    sitemap_client: TestClient,
) -> None:
    index_response = sitemap_client.get("/sitemap.xml")
    assert index_response.status_code == status.HTTP_200_OK
    page_urls: list[str] = []
    for sitemap_url in _get_locations(index_response.text):
        file_response = sitemap_client.get(urlsplit(sitemap_url).path)
        assert file_response.status_code == status.HTTP_200_OK
        page_urls.extend(_get_locations(file_response.text))
    assert len(page_urls) >= _SITEMAP_URL_SAMPLE_SIZE

    sampled_page_urls = random.Random(_SAMPLE_SEED).sample(
        sorted(page_urls), _SITEMAP_URL_SAMPLE_SIZE
    )

    failures: list[str] = []
    for page_url in sampled_page_urls:
        page_path = urlsplit(page_url).path
        page_response = sitemap_client.get(page_path, follow_redirects=False)
        if page_response.status_code != status.HTTP_200_OK:
            failures.append(f"page {page_path} answered {page_response.status_code}")
        api_path = _get_api_path(page_path)
        api_response = sitemap_client.get(api_path, follow_redirects=False)
        if api_response.status_code != status.HTTP_200_OK:
            failures.append(f"api {api_path} answered {api_response.status_code}")
    assert failures == []
