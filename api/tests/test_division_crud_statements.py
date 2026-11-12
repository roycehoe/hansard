from datetime import date
from typing import Any, Callable, Optional, cast

import pytest
from sqlalchemy.dialects import postgresql
from sqlmodel import Session

from crud.division import CRUDDivision
from crud.division_party_count import CRUDDivisionPartyCount
from crud.division_vote import CRUDDivisionVote
from crud.minutes import CRUDMinutes
from crud.minutes_division import CRUDMinutesDivision
from enums import MinutesStatus

_EXCLUDED_REPORT_IDS = [7, 8]
_DATE_FROM = date(2020, 1, 1)
_DATE_TO = date(2021, 12, 31)


class _Result:
    def all(self) -> list[Any]:
        return []

    def first(self) -> None:
        return None

    def one(self) -> int:
        return 0


class _RecordingSession:
    def __init__(self):
        self.statements: list[Any] = []

    def exec(self, statement: Any) -> _Result:
        self.statements.append(statement)
        return _Result()


def _get_compiled_statement(call: Callable[[Session], object]) -> str:
    recording_session = _RecordingSession()
    call(cast(Session, recording_session))
    return str(
        recording_session.statements[0].compile(
            dialect=postgresql.dialect(),
            compile_kwargs={"literal_binds": True},
        )
    )


def _get_division_page_statement(
    parliament_number: Optional[int] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    sprs_report_ids: Optional[list[str]] = None,
    excluded_report_ids: Optional[list[int]] = None,
) -> str:
    return _get_compiled_statement(
        lambda session: CRUDDivision(session).get_all_filtered(
            parliament_number,
            date_from,
            date_to,
            sprs_report_ids,
            excluded_report_ids or [],
            limit=21,
            offset=40,
        )
    )


def _get_division_count_statement(
    excluded_report_ids: Optional[list[int]] = None,
) -> str:
    return _get_compiled_statement(
        lambda session: CRUDDivision(session).get_count_filtered(
            1, _DATE_FROM, _DATE_TO, ["a#"], excluded_report_ids or []
        )
    )


def test_a_division_read_keeps_a_division_with_no_report_when_reports_are_taken_down() -> (
    None
):
    compiled_statement = _get_division_page_statement(
        excluded_report_ids=_EXCLUDED_REPORT_IDS
    )

    assert "report.id IS NULL OR (report.id NOT IN (7, 8))" in compiled_statement
    assert (
        "LEFT OUTER JOIN report ON report.report_id = division.sprs_report_id"
        in compiled_statement
    )


def test_a_division_count_leaves_out_taken_down_reports_in_sql() -> None:
    assert (
        "report.id IS NULL OR (report.id NOT IN (7, 8))"
        in _get_division_count_statement(_EXCLUDED_REPORT_IDS)
    )


def test_a_division_read_adds_no_takedown_clause_when_nothing_is_taken_down() -> None:
    assert "NOT IN" not in _get_division_page_statement()


def test_the_division_list_runs_newest_sitting_first_with_the_id_as_tie_break() -> None:
    assert (
        "ORDER BY division.sitting_date DESC, division.id"
        in _get_division_page_statement()
    )


def test_the_division_list_pages_in_sql() -> None:
    compiled_statement = _get_division_page_statement()

    assert "LIMIT 21 OFFSET 40" in compiled_statement


def test_the_division_list_filters_by_parliament_in_sql() -> None:
    assert "division.parliament_number = 12" in _get_division_page_statement(
        parliament_number=12
    )


def test_the_division_list_date_range_includes_both_ends() -> None:
    compiled_statement = _get_division_page_statement(
        date_from=_DATE_FROM, date_to=_DATE_TO
    )

    assert "division.sitting_date >= '2020-01-01'" in compiled_statement
    assert "division.sitting_date <= '2021-12-31'" in compiled_statement


def test_the_division_list_filters_by_report_in_sql() -> None:
    assert "division.sprs_report_id IN ('a#', 'a##')" in _get_division_page_statement(
        sprs_report_ids=["a#", "a##"]
    )


def test_the_division_list_adds_no_filter_when_none_is_given() -> None:
    assert "WHERE" not in _get_division_page_statement()


def test_the_division_count_carries_every_filter_of_the_list() -> None:
    compiled_statement = _get_division_count_statement(_EXCLUDED_REPORT_IDS)

    assert "division.parliament_number = 1" in compiled_statement
    assert "division.sitting_date >= '2020-01-01'" in compiled_statement
    assert "division.sitting_date <= '2021-12-31'" in compiled_statement
    assert "division.sprs_report_id IN ('a#')" in compiled_statement


def test_a_division_vote_read_runs_by_list_then_printed_order() -> None:
    compiled_statement = _get_compiled_statement(
        lambda session: CRUDDivisionVote(session).get_all_by_division_id(5)
    )

    assert "division_vote.division_id = 5" in compiled_statement
    assert (
        "ORDER BY division_vote.list_source, division_vote.ordinal"
        in compiled_statement
    )


def test_a_party_count_read_runs_by_list_choice_party_then_id() -> None:
    compiled_statement = _get_compiled_statement(
        lambda session: CRUDDivisionPartyCount(session).get_all_by_division_id(5)
    )

    assert "division_party_count.division_id = 5" in compiled_statement
    assert (
        "ORDER BY division_party_count.list_source, "
        "division_party_count.vote_choice, division_party_count.party, "
        "division_party_count.id"
    ) in compiled_statement


def test_a_minutes_division_read_runs_by_minutes_then_ordinal() -> None:
    compiled_statement = _get_compiled_statement(
        lambda session: CRUDMinutesDivision(session).get_all_by_division_id(5)
    )

    assert "minutes_division.division_id = 5" in compiled_statement
    assert (
        "ORDER BY minutes_division.minutes_id, minutes_division.ordinal"
        in compiled_statement
    )


def test_the_minutes_list_runs_newest_sitting_first_with_the_id_as_tie_break() -> None:
    compiled_statement = _get_compiled_statement(
        lambda session: CRUDMinutes(session).get_all_filtered(
            None, None, None, limit=21, offset=0
        )
    )

    assert "ORDER BY minutes.sitting_date DESC, minutes.id" in compiled_statement
    assert "LIMIT 21 OFFSET 0" in compiled_statement


@pytest.mark.parametrize(
    "call",
    [
        pytest.param(
            lambda session: CRUDMinutes(session).get_all_filtered(
                MinutesStatus.TEXT_STORED, _DATE_FROM, _DATE_TO, limit=21, offset=0
            ),
            id="page",
        ),
        pytest.param(
            lambda session: CRUDMinutes(session).get_count_filtered(
                MinutesStatus.TEXT_STORED, _DATE_FROM, _DATE_TO
            ),
            id="count",
        ),
    ],
)
def test_the_minutes_list_and_count_filter_by_status_and_dates_in_sql(
    call: Callable[[Session], object],
) -> None:
    compiled_statement = _get_compiled_statement(call)

    assert "minutes.status = 'TEXT_STORED'" in compiled_statement
    assert "minutes.sitting_date >= '2020-01-01'" in compiled_statement
    assert "minutes.sitting_date <= '2021-12-31'" in compiled_statement


def test_the_minutes_read_selects_only_the_columns_the_api_grant_covers() -> None:
    compiled_statement = _get_compiled_statement(
        lambda session: CRUDMinutes(session).get_all_filtered(
            None, None, None, limit=21, offset=0
        )
    )

    for hidden_column in ("extracted_text", "sha256", "status_note", "size_bytes"):
        assert hidden_column not in compiled_statement
