from dataclasses import dataclass
from urllib.parse import quote, urlsplit
from xml.etree import ElementTree

import pytest
from fastapi import status
from fastapi.testclient import TestClient

from exceptions.base import ERRORS, ErrorCode
from middleware import response_cache, takedown
from services import sitemap as sitemap_service
from settings import settings
from utils.report_slug import get_normalised_report_slug

pytestmark = pytest.mark.database

_PAGE_SIZE = 100
_QUOTED_WORD_COUNT = 6
_SITE_URL = "https://hansard.example.sg"
_SITEMAP_NAMESPACE = "http://www.sitemaps.org/schemas/sitemap/0.9"
_LOCATION_TAG = f"{{{_SITEMAP_NAMESPACE}}}loc"
_REPORT_SITEMAP_FILE_PREFIX = "/sitemap-reports-"
_REPORT_SEARCH_SURFACE = "report search"
_SPEECH_SEARCH_SURFACE = "speech search"
_SITTING_SURFACE = "sitting reports"
_SITEMAP_SURFACE = "sitemap"


@dataclass(frozen=True)
class _ReportToHide:
    report_slug: str
    title: str
    sitting_date: str
    person_ids: tuple[int, ...]
    quoted_phrase: str


def _get_quoted_phrase(transcript: str) -> str:
    words = transcript.split()
    first_word_index = len(words) // 2 - _QUOTED_WORD_COUNT // 2
    return '"' + " ".join(words[first_word_index:][:_QUOTED_WORD_COUNT]) + '"'


def _get_report_to_hide(website_client: TestClient) -> _ReportToHide:
    parliaments = website_client.get("/api/parliaments").json()["parliaments"]
    parliament_number = max(
        parliament["parliament_number"] for parliament in parliaments
    )
    sittings = website_client.get(
        "/api/sittings", params={"parliament_number": parliament_number}
    ).json()["sittings"]
    sitting_date = max(sitting["sitting_date"] for sitting in sittings)
    sitting = website_client.get(f"/api/sittings/{sitting_date}").json()
    for sitting_report in sitting["reports"]:
        if not sitting_report["is_text_available"]:
            continue
        report_slug = sitting_report["report_slug"]
        report = website_client.get(
            f"/api/reports/{quote(report_slug, safe='')}"
        ).json()
        person_ids = {
            speech["person_id"]
            for speech in report["speeches"]
            if speech["person_id"] is not None
        }
        transcripts = [
            speech["transcript"]
            for speech in report["speeches"]
            if len(speech["transcript"].split()) >= _QUOTED_WORD_COUNT * 2
        ]
        if person_ids and transcripts:
            return _ReportToHide(
                report_slug=report_slug,
                title=report["title"],
                sitting_date=sitting_date,
                person_ids=tuple(sorted(person_ids)),
                quoted_phrase=_get_quoted_phrase(transcripts[0]),
            )
    raise LookupError(f"no report to hide in the sitting of {sitting_date}")


def _get_person_surface(person_id: int) -> str:
    return f"person {person_id} reports"


def _get_sitemap_report_urls(client: TestClient) -> set[str]:
    index = ElementTree.fromstring(client.get("/sitemap.xml").text)
    report_urls: set[str] = set()
    for sitemap_location in index.iter(_LOCATION_TAG):
        sitemap_path = urlsplit(sitemap_location.text or "").path
        if not sitemap_path.startswith(_REPORT_SITEMAP_FILE_PREFIX):
            continue
        urlset = ElementTree.fromstring(client.get(sitemap_path).text)
        report_urls.update(
            location.text or "" for location in urlset.iter(_LOCATION_TAG)
        )
    return report_urls


def _get_surfaces_showing_report(
    client: TestClient, report_to_hide: _ReportToHide
) -> list[str]:
    report_slug = report_to_hide.report_slug
    date_range = {
        "date_from": report_to_hide.sitting_date,
        "date_to": report_to_hide.sitting_date,
        "page_size": _PAGE_SIZE,
    }
    surfaces: list[str] = []

    report_search = client.get(
        "/api/search/reports", params={"q": report_to_hide.title, **date_range}
    ).json()
    if report_slug in [result["report_slug"] for result in report_search["results"]]:
        surfaces.append(_REPORT_SEARCH_SURFACE)

    speech_search = client.get(
        "/api/search/speeches",
        params={"q": report_to_hide.quoted_phrase, **date_range},
    ).json()
    if report_slug in [result["report_slug"] for result in speech_search["results"]]:
        surfaces.append(_SPEECH_SEARCH_SURFACE)

    sitting = client.get(f"/api/sittings/{report_to_hide.sitting_date}").json()
    if report_slug in [report["report_slug"] for report in sitting["reports"]]:
        surfaces.append(_SITTING_SURFACE)

    for person_id in report_to_hide.person_ids:
        person_reports = client.get(
            f"/api/people/{person_id}/reports", params={"page_size": _PAGE_SIZE}
        ).json()
        if report_slug in [
            report["report_slug"] for report in person_reports["reports"]
        ]:
            surfaces.append(_get_person_surface(person_id))

    if f"{_SITE_URL}/reports/{quote(report_slug, safe='')}" in _get_sitemap_report_urls(
        client
    ):
        surfaces.append(_SITEMAP_SURFACE)

    return surfaces


@pytest.fixture
def report_to_hide(
    website_client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> _ReportToHide:
    monkeypatch.setattr(settings, "site_url", _SITE_URL)
    monkeypatch.setattr(sitemap_service, "_cached_file_name_to_xml", None)
    return _get_report_to_hide(website_client)


def _take_down(monkeypatch: pytest.MonkeyPatch, report_slug: str) -> None:
    monkeypatch.setattr(
        takedown,
        "_TAKEN_DOWN_REPORT_SLUGS",
        frozenset({get_normalised_report_slug(report_slug)}),
    )
    monkeypatch.setattr(response_cache, "_cache_key_to_cached_response", {})
    monkeypatch.setattr(sitemap_service, "_cached_file_name_to_xml", None)


def test_a_taken_down_report_leaves_search_the_sitting_person_reports_and_the_sitemap(
    website_client: TestClient,
    monkeypatch: pytest.MonkeyPatch,
    report_to_hide: _ReportToHide,
) -> None:
    surfaces_before = _get_surfaces_showing_report(website_client, report_to_hide)
    assert surfaces_before == [
        _REPORT_SEARCH_SURFACE,
        _SPEECH_SEARCH_SURFACE,
        _SITTING_SURFACE,
        *[_get_person_surface(person_id) for person_id in report_to_hide.person_ids],
        _SITEMAP_SURFACE,
    ]

    _take_down(monkeypatch, report_to_hide.report_slug)

    assert _get_surfaces_showing_report(website_client, report_to_hide) == []


def test_a_taken_down_report_answers_410_from_the_api_and_the_page(
    website_client: TestClient,
    monkeypatch: pytest.MonkeyPatch,
    report_to_hide: _ReportToHide,
) -> None:
    api_path = f"/api/reports/{quote(report_to_hide.report_slug, safe='')}"
    page_path = f"/reports/{quote(report_to_hide.report_slug, safe='')}"
    assert website_client.get(api_path).status_code == status.HTTP_200_OK
    assert website_client.get(page_path).status_code == status.HTTP_200_OK

    _take_down(monkeypatch, report_to_hide.report_slug)

    api_response = website_client.get(api_path)
    assert api_response.status_code == ERRORS[ErrorCode.REPORT_TAKEN_DOWN].status_code
    assert api_response.json() == {
        "detail": {
            "error_code": ErrorCode.REPORT_TAKEN_DOWN.value,
            "message": ERRORS[ErrorCode.REPORT_TAKEN_DOWN].message,
        }
    }
    assert "cache-control" not in api_response.headers
    assert website_client.get(page_path).status_code == status.HTTP_410_GONE
