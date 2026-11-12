from typing import Any, Callable, cast

import pytest
from sqlalchemy.dialects import postgresql
from sqlmodel import Session

from crud.bill_report import CRUDBillReport
from crud.bill_report_speaker import CRUDBillReportSpeaker
from crud.bill_stage_line import CRUDBillStageLine

_EXCLUDED_REPORT_IDS = [7, 8]
_SPRS_REPORT_IDS = ["x"]
_MEMBERSHIP_IDS = [1]
_BILL_IDS = [1]
_REPORT_ID_NOT_IN = "report.id NOT IN (7, 8)"
_BILL_REPORT_REPORT_ID_NOT_IN = "billreport.report_id NOT IN (7, 8)"


class _EmptyResult:
    def all(self) -> list[Any]:
        return []

    def first(self) -> None:
        return None


class _RecordingSession:
    def __init__(self):
        self.statements: list[Any] = []

    def exec(self, statement: Any) -> _EmptyResult:
        self.statements.append(statement)
        return _EmptyResult()


def _get_compiled_statement(call: Callable[[Session], object]) -> str:
    recording_session = _RecordingSession()
    call(cast(Session, recording_session))
    return str(
        recording_session.statements[0].compile(
            dialect=postgresql.dialect(),
            compile_kwargs={"literal_binds": True},
        )
    )


_REPORT_DERIVED_CALLS = [
    pytest.param(
        lambda session: CRUDBillReport(
            session
        ).get_all_by_bill_ids_excluding_report_ids(_BILL_IDS, _EXCLUDED_REPORT_IDS),
        _BILL_REPORT_REPORT_ID_NOT_IN,
        id="bill report by bill ids",
    ),
    pytest.param(
        lambda session: CRUDBillReport(
            session
        ).get_all_by_sprs_report_ids_excluding_report_ids(
            _SPRS_REPORT_IDS, _EXCLUDED_REPORT_IDS
        ),
        _REPORT_ID_NOT_IN,
        id="bill report by sprs report ids",
    ),
    pytest.param(
        lambda session: CRUDBillReportSpeaker(
            session
        ).get_all_by_membership_ids_excluding_report_ids(
            _MEMBERSHIP_IDS, _EXCLUDED_REPORT_IDS
        ),
        _REPORT_ID_NOT_IN,
        id="member row by membership ids",
    ),
    pytest.param(
        lambda session: CRUDBillReportSpeaker(
            session
        ).get_all_by_sprs_report_ids_excluding_report_ids(
            _SPRS_REPORT_IDS, _EXCLUDED_REPORT_IDS
        ),
        _REPORT_ID_NOT_IN,
        id="member row by sprs report ids",
    ),
    pytest.param(
        lambda session: CRUDBillStageLine(
            session
        ).get_all_by_sprs_report_ids_excluding_report_ids(
            _SPRS_REPORT_IDS, _EXCLUDED_REPORT_IDS
        ),
        _REPORT_ID_NOT_IN,
        id="stage line by sprs report ids",
    ),
]


@pytest.mark.parametrize("call, expected_clause", _REPORT_DERIVED_CALLS)
def test_a_report_derived_read_leaves_out_the_excluded_report_ids_in_sql(
    call: Callable[[Session], object], expected_clause: str
) -> None:
    assert expected_clause in _get_compiled_statement(call)


def test_a_stage_line_read_orders_by_report_then_ordinal_then_stage() -> None:
    compiled_statement = _get_compiled_statement(
        lambda session: CRUDBillStageLine(
            session
        ).get_all_by_sprs_report_ids_excluding_report_ids(
            _SPRS_REPORT_IDS, _EXCLUDED_REPORT_IDS
        )
    )

    assert (
        "ORDER BY billstageline.sprs_report_id, billstageline.ordinal, "
        "billstageline.stage"
    ) in compiled_statement


def test_the_bill_report_read_by_report_id_takes_the_lowest_id_first() -> None:
    compiled_statement = _get_compiled_statement(
        lambda session: CRUDBillReport(session).get_by_report_id(1)
    )

    assert "ORDER BY billreport.id" in compiled_statement
