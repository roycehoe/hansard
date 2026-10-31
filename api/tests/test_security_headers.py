import base64
import hashlib
import re
from pathlib import Path
from urllib.parse import urlsplit

import pytest
from fastapi import status
from fastapi.testclient import TestClient

from services import sitemap as sitemap_service
from settings import settings

_REPO_ROOT = Path(__file__).resolve().parents[2]
_POLICY_HEADER = "content-security-policy"
_EXPECTED_HEADERS = {
    "strict-transport-security": "max-age=31536000",
    "x-content-type-options": "nosniff",
    "referrer-policy": "strict-origin-when-cross-origin",
    "content-security-policy": (
        "default-src 'self'; "
        "script-src 'self' 'sha256-v113e9zedJ1qRfpnuqczJ7xOkqPKWJmuhUiw9Rd9jNI=' "
        "https://gc.zgo.at; "
        "style-src 'self' 'unsafe-inline'; "
        "connect-src 'self' https://royceinbox.goatcounter.com; "
        "object-src 'none'; "
        "base-uri 'none'; "
        "form-action 'self'; "
        "frame-ancestors 'none'"
    ),
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


def _get_policy_directive_to_sources(policy: str) -> dict[str, list[str]]:
    directive_to_sources = {}
    for directive in policy.split(";"):
        name, *sources = directive.split()
        directive_to_sources[name] = sources
    return directive_to_sources


def _get_origin(url: str) -> str:
    url_parts = urlsplit(url)
    return f"{url_parts.scheme}://{url_parts.netloc}"


def test_the_policy_allows_each_inline_script_in_index_html_by_its_hash(
    website_client: TestClient,
) -> None:
    index_html = (_REPO_ROOT / "app" / "index.html").read_text()
    inline_scripts = re.findall(r"<script>(.*?)</script>", index_html, re.DOTALL)
    inline_script_hashes = {
        "'sha256-"
        + base64.b64encode(hashlib.sha256(script.encode()).digest()).decode()
        + "'"
        for script in inline_scripts
    }

    policy = website_client.get("/").headers[_POLICY_HEADER]
    script_sources = _get_policy_directive_to_sources(policy)["script-src"]

    assert inline_scripts
    assert {
        source for source in script_sources if source.startswith("'sha256-")
    } == inline_script_hashes


def test_the_policy_allows_the_goatcounter_script_and_count_hosts(
    website_client: TestClient,
) -> None:
    analytics_constants = (
        _REPO_ROOT / "app" / "src" / "constants" / "analytics" / "constants.ts"
    ).read_text()
    script_url_match = re.search(
        r"^export const ANALYTICS_SCRIPT_URL = '(\S+)'$",
        analytics_constants,
        re.MULTILINE,
    )
    app_spec = (_REPO_ROOT / ".do" / "app.yaml").read_text()
    count_url_match = re.search(
        r"key: VITE_ANALYTICS_URL\n\s+scope: BUILD_TIME\n\s+value: (\S+)$",
        app_spec,
        re.MULTILINE,
    )

    policy = website_client.get("/").headers[_POLICY_HEADER]
    directive_to_sources = _get_policy_directive_to_sources(policy)

    assert script_url_match is not None
    assert count_url_match is not None
    assert _get_origin(script_url_match.group(1)) in directive_to_sources["script-src"]
    assert _get_origin(count_url_match.group(1)) in directive_to_sources["connect-src"]
