import threading
from typing import Any

import psycopg.errors
import pytest
import sqlalchemy.exc
from fastapi.testclient import TestClient
from httpx import Response
from sqlmodel import Session, select

from database.engine import engine
from database.report import Report
from exceptions.base import ERRORS, ErrorCode
from middleware import search_slot, takedown
from middleware.takedown import is_report_id_taken_down
from services import report as report_service
from services import sitemap as sitemap_service
from settings import settings
from utils.report_slug import get_normalised_report_slug, get_report_slug

_SITE_URL = "https://hansard.example.sg"
_SEARCH_WORD = "housing"
_EXCLUDED_SEARCH_WORD = f"-{_SEARCH_WORD}"
_UNKNOWN_PERSON_ID = 999_999_999
_UNKNOWN_SITTING_DATE = "1900-01-01"
_UNKNOWN_REPORT_SLUG = "no-such-report-slug"
_ANY_REPORT_SLUG = "any-report-slug"
_UNKNOWN_CONSTITUENCY = "No Such Seat"
_UNKNOWN_SITEMAP_FILE_PATH = "/sitemap-no-such-kind-1.xml"
_REPORT_CANDIDATE_COUNT = 20
_STATEMENT_TIMEOUT_MESSAGE = "canceling statement due to statement timeout"
_HELD_SLOT_COUNT = 1


@pytest.fixture
def report_slug() -> str:
    with Session(engine) as session:
        report_ids = session.exec(
            select(Report.report_id).order_by(Report.id).limit(_REPORT_CANDIDATE_COUNT)
        ).all()
    return get_report_slug(
        next(
            report_id
            for report_id in report_ids
            if not is_report_id_taken_down(report_id)
        )
    )


def _assert_error_response(response: Response, error_code: ErrorCode) -> None:
    assert response.status_code == ERRORS[error_code].status_code
    assert response.json() == {
        "detail": {
            "error_code": error_code.value,
            "message": ERRORS[error_code].message,
        }
    }
    assert "cache-control" not in response.headers


@pytest.mark.database
@pytest.mark.parametrize(
    "path",
    [
        f"/reports/{_UNKNOWN_REPORT_SLUG}",
        f"/reports/{_UNKNOWN_REPORT_SLUG}/matched-words?q={_SEARCH_WORD}",
        f"/search/speeches?q={_SEARCH_WORD}&report={_UNKNOWN_REPORT_SLUG}",
    ],
)
def test_an_unknown_report_answers_the_report_not_found_error(
    api_client: TestClient, path: str
) -> None:
    response = api_client.get(path)

    _assert_error_response(response, ErrorCode.REPORT_NOT_FOUND)


@pytest.mark.database
@pytest.mark.parametrize("path_suffix", ["", f"/matched-words?q={_SEARCH_WORD}"])
def test_a_taken_down_report_answers_the_report_taken_down_error(
    api_client: TestClient,
    monkeypatch: pytest.MonkeyPatch,
    report_slug: str,
    path_suffix: str,
) -> None:
    monkeypatch.setattr(
        takedown,
        "_TAKEN_DOWN_REPORT_SLUGS",
        frozenset({get_normalised_report_slug(report_slug)}),
    )

    response = api_client.get(f"/reports/{report_slug}{path_suffix}")

    _assert_error_response(response, ErrorCode.REPORT_TAKEN_DOWN)


@pytest.mark.database
def test_an_unknown_sitting_answers_the_sitting_not_found_error(
    api_client: TestClient,
) -> None:
    response = api_client.get(f"/sittings/{_UNKNOWN_SITTING_DATE}")

    _assert_error_response(response, ErrorCode.SITTING_NOT_FOUND)


@pytest.mark.database
@pytest.mark.parametrize("path_suffix", ["", "/reports"])
def test_an_unknown_person_answers_the_person_not_found_error(
    api_client: TestClient, path_suffix: str
) -> None:
    response = api_client.get(f"/people/{_UNKNOWN_PERSON_ID}{path_suffix}")

    _assert_error_response(response, ErrorCode.PERSON_NOT_FOUND)


def test_a_sitemap_with_no_site_url_answers_the_sitemap_not_found_error(
    website_client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setattr(settings, "site_url", None)

    response = website_client.get("/sitemap.xml")

    _assert_error_response(response, ErrorCode.SITEMAP_NOT_FOUND)


def test_an_unknown_sitemap_file_answers_the_sitemap_not_found_error(
    website_client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setattr(settings, "site_url", _SITE_URL)
    monkeypatch.setattr(
        sitemap_service,
        "_cached_file_name_to_xml",
        {"sitemap.xml": "<sitemapindex/>"},
    )

    response = website_client.get(_UNKNOWN_SITEMAP_FILE_PATH)

    _assert_error_response(response, ErrorCode.SITEMAP_NOT_FOUND)


def test_a_cancelled_statement_answers_the_search_timed_out_error(
    api_client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    def raise_statement_timeout(*_: Any) -> None:
        raise sqlalchemy.exc.OperationalError(
            "SELECT 1", {}, psycopg.errors.QueryCanceled(_STATEMENT_TIMEOUT_MESSAGE)
        )

    monkeypatch.setattr(
        report_service, "_get_validated_report", raise_statement_timeout
    )

    response = api_client.get(
        f"/reports/{_ANY_REPORT_SLUG}/matched-words?q={_SEARCH_WORD}"
    )

    _assert_error_response(response, ErrorCode.SEARCH_TIMED_OUT)


@pytest.mark.parametrize("path", ["/search/speeches", "/search/reports"])
def test_a_search_with_no_words_and_no_filter_answers_the_filter_required_error(
    api_client: TestClient, path: str
) -> None:
    response = api_client.get(path)

    _assert_error_response(response, ErrorCode.SEARCH_FILTER_REQUIRED)


def test_a_search_while_the_slot_is_held_answers_the_busy_error(
    api_client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    held_slots = threading.BoundedSemaphore(_HELD_SLOT_COUNT)
    assert held_slots.acquire(blocking=False)
    monkeypatch.setattr(search_slot, "_search_slots", held_slots)

    response = api_client.get(
        f"/reports/{_ANY_REPORT_SLUG}/matched-words?q={_SEARCH_WORD}"
    )

    _assert_error_response(response, ErrorCode.SEARCH_BUSY)


@pytest.mark.parametrize("path", ["/search/speeches", "/search/reports"])
def test_a_search_of_only_excluded_words_answers_the_excluded_words_only_error(
    api_client: TestClient, path: str
) -> None:
    response = api_client.get(path, params={"q": _EXCLUDED_SEARCH_WORD})

    _assert_error_response(response, ErrorCode.SEARCH_EXCLUDED_WORDS_ONLY)


@pytest.mark.database
def test_an_unknown_constituency_answers_the_constituency_not_found_error(
    api_client: TestClient,
) -> None:
    response = api_client.get(
        "/search/speeches", params={"constituency": _UNKNOWN_CONSTITUENCY}
    )

    _assert_error_response(response, ErrorCode.SEARCH_CONSTITUENCY_NOT_FOUND)
