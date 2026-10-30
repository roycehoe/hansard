from urllib.parse import quote

import pytest
from fastapi import status
from fastapi.testclient import TestClient
from sqlalchemy import text
from sqlmodel import Session, select

from crud.speech import CRUDSpeech
from database.engine import engine
from database.report import Report
from enums import SearchSort
from middleware import response_cache, takedown
from middleware.takedown import is_report_id_taken_down
from utils.report_slug import get_normalised_report_slug, get_report_slug

pytestmark = pytest.mark.database

_REPORT_CANDIDATE_COUNT = 20
_SEARCH_PAGE_SIZE = 20


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


def test_health_answers_200_with_no_cache_control(api_client: TestClient) -> None:
    response = api_client.get("/health")

    assert response.status_code == status.HTTP_200_OK
    assert response.json() == {"status": "ok"}
    assert "cache-control" not in response.headers


def test_a_report_answers_200_with_public_cache_control(
    api_client: TestClient, report_slug: str
) -> None:
    url = f"/reports/{quote(report_slug, safe='')}"

    first = api_client.get(url)
    second = api_client.get(url)

    assert first.status_code == status.HTTP_200_OK
    assert first.headers["cache-control"] == "public, max-age=3600"
    assert second.headers["cache-control"] == "public, max-age=3600"
    assert second.content == first.content


def test_an_unknown_report_answers_404_with_no_cache_control(
    api_client: TestClient,
) -> None:
    first = api_client.get("/reports/no-such-report-slug")
    second = api_client.get("/reports/no-such-report-slug")

    assert first.status_code == status.HTTP_404_NOT_FOUND
    assert second.status_code == status.HTTP_404_NOT_FOUND
    assert "cache-control" not in first.headers
    assert "cache-control" not in second.headers
    assert len(response_cache._cache_key_to_cached_response) == 0


def test_speech_search_answers_200(api_client: TestClient) -> None:
    response = api_client.get("/search/speeches", params={"q": "housing"})

    assert response.status_code == status.HTTP_200_OK
    body = response.json()
    assert body["page"] == 1
    assert isinstance(body["results"], list)
    assert response.headers["cache-control"] == "public, max-age=3600"


def test_a_sitting_answers_200_with_public_cache_control(
    api_client: TestClient,
) -> None:
    with Session(engine) as session:
        sitting_date = session.exec(
            select(Report.sitting_date).order_by(Report.sitting_date.desc()).limit(1)
        ).one()

    response = api_client.get(f"/sittings/{sitting_date.date().isoformat()}")

    assert response.status_code == status.HTTP_200_OK
    assert response.headers["cache-control"] == "public, max-age=3600"


@pytest.mark.parametrize(
    ("search_path", "query"),
    [
        ("/search/speeches", "disability prevalence census 2020"),
        ("/search/reports", "Prevalence Physical Mental Intellectual Disabilities"),
    ],
)
def test_search_counts_leave_out_a_hidden_report(
    api_client: TestClient,
    monkeypatch: pytest.MonkeyPatch,
    search_path: str,
    query: str,
) -> None:
    params = {"q": query, "page_size": _SEARCH_PAGE_SIZE}
    before = api_client.get(search_path, params=params).json()
    assert 0 < before["total_count"] <= _SEARCH_PAGE_SIZE
    hidden_report_slug = before["results"][0]["report_slug"]
    hidden_match_count = sum(
        result["report_slug"] == hidden_report_slug for result in before["results"]
    )
    monkeypatch.setattr(
        takedown,
        "_TAKEN_DOWN_REPORT_SLUGS",
        frozenset({get_normalised_report_slug(hidden_report_slug)}),
    )
    monkeypatch.setattr(response_cache, "_cache_key_to_cached_response", {})

    after = api_client.get(search_path, params=params).json()

    assert hidden_report_slug not in [
        result["report_slug"] for result in after["results"]
    ]
    assert after["total_count"] == before["total_count"] - hidden_match_count
    assert after["total_count"] == len(after["results"])
    assert after["has_next_page"] is False


def test_a_quoted_search_returns_the_newest_matches() -> None:
    with Session(engine) as session:
        page = CRUDSpeech(session).get_all_by_query_filtered(
            query='"mr speaker"',
            parliament_number=14,
            date_from=None,
            date_to=None,
            report_type=None,
            membership_ids=None,
            location_name=None,
            excluded_speaker_patterns=(),
            excluded_report_ids=[],
            report_ids=None,
            sort=SearchSort.DATE,
            limit=_SEARCH_PAGE_SIZE,
            offset=0,
        )
        # NOTE: index scans are off so the true rows come from a GIN bitmap scan, not from the rum index the search is checked against
        session.execute(text("SET LOCAL enable_indexscan = off"))
        true_speech_ids = session.execute(
            text(
                """
                SELECT speech.id FROM speech
                JOIN report ON report.id = speech.report_id
                WHERE speech.transcript_tsv @@ websearch_to_tsquery('english', :phrase)
                AND speech.transcript ~* :exact_form
                AND report.parliament_number = 14
                ORDER BY speech.sitting_date DESC, speech.id
                LIMIT :page_size
                """
            ).bindparams(
                phrase='"mr speaker"',
                exact_form=r"(?<![[:alnum:]])mr[^[:alnum:]]+speaker(?![[:alnum:]])",
                page_size=_SEARCH_PAGE_SIZE,
            )
        ).all()

    assert [speech.id for speech in page] == [row[0] for row in true_speech_ids]


def test_a_spaced_dash_in_a_report_title_is_not_an_exclusion(
    api_client: TestClient,
) -> None:
    response = api_client.get(
        "/search/reports", params={"q": "HEAD S - MINISTRY OF MANPOWER"}
    )

    assert response.status_code == status.HTTP_200_OK
    assert "HEAD S - MINISTRY OF MANPOWER" in [
        result["title"] for result in response.json()["results"]
    ]


def test_a_straight_and_a_curly_apostrophe_find_the_same_speeches(
    api_client: TestClient,
) -> None:
    straight = api_client.get("/search/speeches", params={"q": '"Women\'s"'})
    curly = api_client.get("/search/speeches", params={"q": '"Women’s"'})

    assert straight.json()["total_count"] > 0
    assert straight.json()["total_count"] == curly.json()["total_count"]


def test_a_hyphen_the_record_does_not_print_still_finds_the_name(
    api_client: TestClient,
) -> None:
    response = api_client.get("/search/speeches", params={"q": "Ong Kian-Min"})

    assert response.json()["total_count"] > 0
