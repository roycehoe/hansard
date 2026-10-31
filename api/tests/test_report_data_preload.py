import re
from datetime import date
from pathlib import Path

import pytest
from fastapi import status
from fastapi.testclient import TestClient
from starlette.applications import Starlette
from starlette.routing import Mount

from enums import PreviewType
from middleware import frontend
from schemas.preview import PreviewData
from services import preview as preview_service

_REPO_ROOT = Path(__file__).resolve().parents[2]
_PRELOAD_LINK = re.compile(r'<link rel="preload"[^>]*>')


def _get_report_preview() -> PreviewData:
    return PreviewData(
        title="Bill, 1 January 2020",
        description="A report.",
        preview_type=PreviewType.ARTICLE,
        path="/reports/bill-818",
        is_found=True,
        report_title="Bill",
        sitting_date=date(2020, 1, 1),
    )


def _get_client(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch, preview: PreviewData
) -> TestClient:
    (tmp_path / "index.html").write_text(
        "<html><head><!--preview-tags--><title>Open Hansard</title>"
        "<!--/preview-tags--></head></html>"
    )
    monkeypatch.setattr(
        frontend, "_get_page_preview", lambda path, ordinal, anchor: preview
    )
    return TestClient(
        Starlette(
            routes=[Mount("/", frontend.FrontendFiles(tmp_path, None), name="frontend")]
        )
    )


def _get_api_url() -> str:
    dockerfile = (_REPO_ROOT / "Dockerfile").read_text()
    match = re.search(r"^ENV VITE_API_URL=(\S+)$", dockerfile, re.MULTILINE)
    assert match is not None
    return match.group(1)


def test_the_deployed_build_puts_the_api_under_the_prefix_the_preload_uses() -> None:
    assert _get_api_url() == "/api"


def test_a_report_page_preloads_the_url_the_app_requests(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    client = _get_client(tmp_path, monkeypatch, _get_report_preview())

    response = client.get("/reports/bill-818")

    # NOTE: getReport.ts requests `${API_URL}/reports/${encodeURIComponent(slug)}` and buildQueryString adds nothing while s and q are unset
    assert response.status_code == status.HTTP_200_OK
    assert _PRELOAD_LINK.findall(response.text) == [
        f'<link rel="preload" href="{_get_api_url()}/reports/bill-818" '
        'as="fetch" crossorigin="anonymous" />'
    ]


def test_a_slug_is_encoded_as_encode_uri_component_does(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    client = _get_client(tmp_path, monkeypatch, _get_report_preview())

    response = client.get("/reports/%23032_a.html-(b)'!")

    assert (
        f'href="{_get_api_url()}/reports/%23032_a.html-(b)\'!"'.replace("'", "&#x27;")
        in response.text
    )


@pytest.mark.parametrize("query", ["?s=3&q=thank+you", "?s=3", "?q=thank"])
def test_a_report_address_with_a_speech_link_gets_no_preload(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch, query: str
) -> None:
    client = _get_client(tmp_path, monkeypatch, _get_report_preview())

    response = client.get(f"/reports/bill-818{query}")

    assert _PRELOAD_LINK.findall(response.text) == []


def test_a_report_address_with_only_a_highlight_gets_the_plain_preload(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    client = _get_client(tmp_path, monkeypatch, _get_report_preview())

    response = client.get("/reports/bill-818?hl=housing")

    assert len(_PRELOAD_LINK.findall(response.text)) == 1


@pytest.mark.parametrize(
    "path", ["/", "/coverage", "/people/1-tan", "/sittings/2020-01-01", "/search"]
)
def test_a_page_that_is_not_a_report_gets_no_preload(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch, path: str
) -> None:
    client = _get_client(tmp_path, monkeypatch, preview_service.get_default_preview())

    response = client.get(path)

    assert _PRELOAD_LINK.findall(response.text) == []


def test_a_report_that_does_not_exist_gets_no_preload(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    client = _get_client(tmp_path, monkeypatch, preview_service.get_not_found_preview())

    response = client.get("/reports/no-such-report")

    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert _PRELOAD_LINK.findall(response.text) == []
