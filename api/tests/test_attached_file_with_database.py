from collections.abc import Generator
from dataclasses import dataclass
from datetime import datetime
from urllib.parse import quote

import pytest
from fastapi import status
from fastapi.testclient import TestClient
from sqlalchemy import Connection, create_engine
from sqlmodel import text

from exceptions.base import ERRORS, ErrorCode
from middleware import response_cache, takedown
from settings import settings
from utils.report_slug import get_normalised_report_slug

pytestmark = pytest.mark.database

_GATE_SETTING_NAME = "is_unreleased_endpoints_enabled"
_DOWNLOAD_URL_PREFIX = "https://sprs.parl.gov.sg/search/search/download?value="
_SITTING_DATE = "1900-01-02"
_SITTING_DATE_TEXT = "2-1-1900"
_EMPTY_SITTING_DATE = "1900-01-03"
_EMPTY_SITTING_DATE_TEXT = "3-1-1900"
_MISSING_SITTING_DATE = "1900-01-04"
_FIRST_REPORT_SLUG = "TEST-ATTACHED-FILE-1"
_SECOND_REPORT_SLUG = "TEST-ATTACHED-FILE-2"
_TAKEN_DOWN_REPORT_SLUG = "TEST-ATTACHED-FILE-3"
_EMPTY_REPORT_SLUG = "TEST-ATTACHED-FILE-4"
_MISSING_REPORT_SLUG = "TEST-ATTACHED-FILE-MISSING"
_REPORT_SLUG_PATTERN = "TEST-ATTACHED-FILE-%"


@dataclass(frozen=True)
class _SeededRows:
    annex_id: int
    vernacular_id: int
    only_taken_down_id: int


def _insert_report(
    connection: Connection, slug: str, speech_number: int, sitting_date: str, title: str
) -> None:
    connection.execute(
        text(
            "INSERT INTO report (volume_number, parliament_number, sitting_date, "
            "speech_number, original_title, title, report_id, report_type, "
            "report_version) VALUES (1, 0, :sitting_date, :speech_number, :title, "
            ":title, :report_id, 'oral-answer', 'sprs3')"
        ),
        {
            "sitting_date": datetime.fromisoformat(sitting_date),
            "speech_number": speech_number,
            "title": title,
            "report_id": slug + "#",
        },
    )


def _insert_sitting(connection: Connection, sitting_date_text: str) -> int:
    return connection.execute(
        text("INSERT INTO sitting (sitting_date) VALUES (:d) RETURNING id"),
        {"d": sitting_date_text},
    ).scalar_one()


def _insert_attached_file(
    connection: Connection,
    sitting_id: int,
    kind: str,
    sprs_file_id: int,
    title: str,
    download_value: str | None,
) -> int:
    return connection.execute(
        text(
            "INSERT INTO attached_file (kind, sprs_file_id, printed_title, "
            "printed_file_path, file_name, section_type, download_value, sitting_id) "
            "VALUES (CAST(:kind AS attachedfilekind), :sprs_file_id, :title, '/p', "
            ":title, 'Annex', :download_value, :sitting_id) RETURNING id"
        ),
        {
            "kind": kind,
            "sprs_file_id": sprs_file_id,
            "title": title,
            "download_value": download_value,
            "sitting_id": sitting_id,
        },
    ).scalar_one()


def _insert_pointer(
    connection: Connection,
    slug: str,
    ordinal: int,
    printed_text: str,
    download_value: str | None,
    attached_file_id: int | None,
) -> None:
    connection.execute(
        text(
            "INSERT INTO attached_file_pointer (ordinal, printed_text, href, shape, "
            "download_value, speech_ordinal, sprs_report_id, attached_file_id) "
            "VALUES (:ordinal, :printed_text, '/h', CAST('DATED' AS "
            "attachedfilepointershape), :download_value, :ordinal, :report_id, "
            ":attached_file_id)"
        ),
        {
            "ordinal": ordinal,
            "printed_text": printed_text,
            "download_value": download_value,
            "report_id": slug + "#",
            "attached_file_id": attached_file_id,
        },
    )


def _delete_seeded_rows(connection: Connection) -> None:
    params = {
        "pattern": _REPORT_SLUG_PATTERN,
        "dates": [_SITTING_DATE_TEXT, _EMPTY_SITTING_DATE_TEXT],
    }
    for statement in (
        "DELETE FROM attached_file_pointer WHERE sprs_report_id LIKE :pattern",
        "DELETE FROM attached_file WHERE sitting_id IN "
        "(SELECT id FROM sitting WHERE sitting_date = ANY(:dates))",
        "DELETE FROM report WHERE report_id LIKE :pattern",
        "DELETE FROM sitting WHERE sitting_date = ANY(:dates)",
    ):
        connection.execute(text(statement), params)


@pytest.fixture
def seeded_rows() -> Generator[_SeededRows, None, None]:
    writable_engine = create_engine(settings.database_url)
    try:
        with writable_engine.begin() as connection:
            if (
                connection.execute(
                    text("SELECT to_regclass('public.attached_file_pointer')")
                ).scalar_one()
                is None
            ):
                pytest.skip("attached_file_pointer is not on the scratch database")
            _delete_seeded_rows(connection)
        try:
            with writable_engine.begin() as connection:
                sitting_id = _insert_sitting(connection, _SITTING_DATE_TEXT)
                _insert_sitting(connection, _EMPTY_SITTING_DATE_TEXT)
                _insert_report(
                    connection, _FIRST_REPORT_SLUG, 2, _SITTING_DATE, "First report"
                )
                _insert_report(
                    connection, _SECOND_REPORT_SLUG, 1, _SITTING_DATE, "Second report"
                )
                _insert_report(
                    connection,
                    _TAKEN_DOWN_REPORT_SLUG,
                    3,
                    _SITTING_DATE,
                    "Taken down report",
                )
                _insert_report(
                    connection,
                    _EMPTY_REPORT_SLUG,
                    1,
                    _EMPTY_SITTING_DATE,
                    "Empty report",
                )
                vernacular_id = _insert_attached_file(
                    connection, sitting_id, "VERNACULAR", 1, "Vernacular", "V/1.pdf"
                )
                annex_id = _insert_attached_file(
                    connection, sitting_id, "ANNEX", 5, "Annex five", "2000/a b.pdf"
                )
                _insert_attached_file(
                    connection, sitting_id, "ANNEX", 2, "Annex two", None
                )
                only_taken_down_id = _insert_attached_file(
                    connection, sitting_id, "ANNEX", 9, "Hidden annex", "H/9.pdf"
                )
                _insert_attached_file(
                    connection, sitting_id, "ANNEX", 7, "Annex no pointer", "N/7.pdf"
                )
                # NOTE: inserted out of order, so the answers must sort by ordinal
                _insert_pointer(
                    connection, _FIRST_REPORT_SLUG, 3, "unlisted", "U/3.pdf", None
                )
                _insert_pointer(
                    connection, _FIRST_REPORT_SLUG, 2, "annex", "2000/a b.pdf", annex_id
                )
                _insert_pointer(
                    connection,
                    _FIRST_REPORT_SLUG,
                    1,
                    "vernacular",
                    "V/1.pdf",
                    vernacular_id,
                )
                _insert_pointer(
                    connection,
                    _SECOND_REPORT_SLUG,
                    1,
                    "annex again",
                    "2000/a b.pdf",
                    annex_id,
                )
                _insert_pointer(
                    connection,
                    _TAKEN_DOWN_REPORT_SLUG,
                    1,
                    "hidden",
                    "H/9.pdf",
                    only_taken_down_id,
                )
                _insert_pointer(
                    connection,
                    _TAKEN_DOWN_REPORT_SLUG,
                    2,
                    "hidden annex",
                    "2000/a b.pdf",
                    annex_id,
                )
            yield _SeededRows(annex_id, vernacular_id, only_taken_down_id)
        finally:
            with writable_engine.begin() as connection:
                _delete_seeded_rows(connection)
    finally:
        writable_engine.dispose()


@pytest.fixture(autouse=True)
def unreleased_endpoints_enabled(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(settings, _GATE_SETTING_NAME, True)


def _take_down(monkeypatch: pytest.MonkeyPatch, report_slug: str) -> None:
    monkeypatch.setattr(
        takedown,
        "_TAKEN_DOWN_REPORT_SLUGS",
        frozenset({get_normalised_report_slug(report_slug)}),
    )
    monkeypatch.setattr(response_cache, "_cache_key_to_cached_response", {})


def _error_code(response_body: dict[str, object]) -> object:
    detail = response_body["detail"]
    assert isinstance(detail, dict)
    return detail["error_code"]


def test_a_report_lists_its_pointers_in_printed_order_with_their_files(
    api_client: TestClient, seeded_rows: _SeededRows
) -> None:
    response = api_client.get(f"/reports/{_FIRST_REPORT_SLUG}/attached-files")

    assert response.status_code == status.HTTP_200_OK
    assert response.json() == {
        "pointers": [
            {
                "ordinal": 1,
                "printed_text": "vernacular",
                "url": f"{_DOWNLOAD_URL_PREFIX}V/1.pdf",
                "speech_ordinal": 1,
                "file": {
                    "kind": "VERNACULAR",
                    "printed_title": "Vernacular",
                    "file_name": "Vernacular",
                    "section_type": "Annex",
                },
            },
            {
                "ordinal": 2,
                "printed_text": "annex",
                "url": f"{_DOWNLOAD_URL_PREFIX}2000/a%20b.pdf",
                "speech_ordinal": 2,
                "file": {
                    "kind": "ANNEX",
                    "printed_title": "Annex five",
                    "file_name": "Annex five",
                    "section_type": "Annex",
                },
            },
            {
                "ordinal": 3,
                "printed_text": "unlisted",
                "url": f"{_DOWNLOAD_URL_PREFIX}U/3.pdf",
                "speech_ordinal": 3,
                "file": None,
            },
        ]
    }


def test_a_report_with_no_pointers_answers_an_empty_list(
    api_client: TestClient, seeded_rows: _SeededRows
) -> None:
    response = api_client.get(f"/reports/{_EMPTY_REPORT_SLUG}/attached-files")

    assert response.status_code == status.HTTP_200_OK
    assert response.json() == {"pointers": []}


def test_an_unknown_report_answers_404(
    api_client: TestClient, seeded_rows: _SeededRows
) -> None:
    response = api_client.get(f"/reports/{_MISSING_REPORT_SLUG}/attached-files")

    assert response.status_code == ERRORS[ErrorCode.REPORT_NOT_FOUND].status_code
    assert _error_code(response.json()) == ErrorCode.REPORT_NOT_FOUND


def test_a_taken_down_report_answers_410_from_the_report_endpoint(
    api_client: TestClient, monkeypatch: pytest.MonkeyPatch, seeded_rows: _SeededRows
) -> None:
    path = f"/reports/{_TAKEN_DOWN_REPORT_SLUG}/attached-files"
    assert api_client.get(path).status_code == status.HTTP_200_OK

    _take_down(monkeypatch, _TAKEN_DOWN_REPORT_SLUG)

    response = api_client.get(path)
    assert response.status_code == ERRORS[ErrorCode.REPORT_TAKEN_DOWN].status_code
    assert _error_code(response.json()) == ErrorCode.REPORT_TAKEN_DOWN


def test_a_sitting_lists_every_file_with_the_pointers_of_its_reports(
    api_client: TestClient, seeded_rows: _SeededRows
) -> None:
    response = api_client.get(f"/sittings/{_SITTING_DATE}/attached-files")

    assert response.status_code == status.HTTP_200_OK
    body = response.json()
    assert [(file["kind"], file["printed_title"]) for file in body["files"]] == [
        ("ANNEX", "Annex two"),
        ("ANNEX", "Annex five"),
        ("ANNEX", "Annex no pointer"),
        ("ANNEX", "Hidden annex"),
        ("VERNACULAR", "Vernacular"),
    ]
    files = {file["printed_title"]: file for file in body["files"]}
    assert files["Annex two"]["url"] is None
    assert files["Annex five"]["url"] == f"{_DOWNLOAD_URL_PREFIX}2000/a%20b.pdf"
    assert files["Annex no pointer"]["pointers"] == []
    assert [
        (pointer["report_slug"], pointer["report_title"], pointer["ordinal"])
        for pointer in files["Annex five"]["pointers"]
    ] == [
        (_SECOND_REPORT_SLUG, "Second report", 1),
        (_FIRST_REPORT_SLUG, "First report", 2),
        (_TAKEN_DOWN_REPORT_SLUG, "Taken down report", 2),
    ]
    assert body["unlisted_pointers"] == [
        {
            "report_slug": _FIRST_REPORT_SLUG,
            "report_title": "First report",
            "ordinal": 3,
            "printed_text": "unlisted",
            "url": f"{_DOWNLOAD_URL_PREFIX}U/3.pdf",
            "speech_ordinal": 3,
        }
    ]


def test_a_sitting_leaves_out_the_pointers_of_a_taken_down_report(
    api_client: TestClient, monkeypatch: pytest.MonkeyPatch, seeded_rows: _SeededRows
) -> None:
    _take_down(monkeypatch, _TAKEN_DOWN_REPORT_SLUG)

    body = api_client.get(f"/sittings/{_SITTING_DATE}/attached-files").json()

    files = {file["printed_title"]: file for file in body["files"]}
    assert "Hidden annex" not in files
    assert "Annex no pointer" in files
    assert [pointer["report_slug"] for pointer in files["Annex five"]["pointers"]] == [
        _SECOND_REPORT_SLUG,
        _FIRST_REPORT_SLUG,
    ]
    assert _TAKEN_DOWN_REPORT_SLUG not in {
        pointer["report_slug"] for file in body["files"] for pointer in file["pointers"]
    }


def test_a_sitting_with_no_files_answers_empty_lists(
    api_client: TestClient, seeded_rows: _SeededRows
) -> None:
    response = api_client.get(f"/sittings/{_EMPTY_SITTING_DATE}/attached-files")

    assert response.status_code == status.HTTP_200_OK
    assert response.json() == {"files": [], "unlisted_pointers": []}


def test_an_unknown_sitting_answers_404(
    api_client: TestClient, seeded_rows: _SeededRows
) -> None:
    response = api_client.get(f"/sittings/{_MISSING_SITTING_DATE}/attached-files")

    assert response.status_code == ERRORS[ErrorCode.SITTING_NOT_FOUND].status_code
    assert _error_code(response.json()) == ErrorCode.SITTING_NOT_FOUND


@pytest.mark.parametrize(
    "path",
    [
        f"/reports/{_FIRST_REPORT_SLUG}/attached-files",
        f"/sittings/{_SITTING_DATE}/attached-files",
    ],
)
def test_seeded_rows_stay_hidden_while_the_setting_is_off(
    api_client: TestClient,
    monkeypatch: pytest.MonkeyPatch,
    seeded_rows: _SeededRows,
    path: str,
) -> None:
    monkeypatch.setattr(settings, _GATE_SETTING_NAME, False)

    response = api_client.get(quote(path, safe="/"))

    assert response.status_code == ERRORS[ErrorCode.ENDPOINT_NOT_FOUND].status_code
    assert _error_code(response.json()) == ErrorCode.ENDPOINT_NOT_FOUND
