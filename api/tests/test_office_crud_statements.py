from typing import Any, Callable, cast

import pytest
from sqlalchemy.dialects import postgresql
from sqlmodel import Session

from crud.report import CRUDReport
from crud.report_participant import CRUDReportParticipant
from crud.report_put_to import CRUDReportPutTo
from enums import ParticipantRole

_EXCLUDED_REPORT_IDS = [7, 8]
_EXCLUDED_SPRS_REPORT_IDS = ["x#", "y#"]
_MINISTRY_ID = 3
_REPORT_ID_NOT_IN = "report.id NOT IN (7, 8)"


class _Result:
    def all(self) -> list[Any]:
        return []

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


_OFFICE_CALLS = [
    pytest.param(
        lambda session: CRUDReport(
            session
        ).get_all_ids_by_report_put_to_ministry_id_excluding_report_ids(
            _MINISTRY_ID, _EXCLUDED_REPORT_IDS, 20, 0
        ),
        _REPORT_ID_NOT_IN,
        id="report ids put to a ministry",
    ),
    pytest.param(
        lambda session: CRUDReport(
            session
        ).get_count_by_report_put_to_ministry_id_excluding_report_ids(
            _MINISTRY_ID, _EXCLUDED_REPORT_IDS
        ),
        _REPORT_ID_NOT_IN,
        id="count of reports put to a ministry",
    ),
    pytest.param(
        lambda session: CRUDReport(
            session
        ).get_all_ids_by_report_participant_role_and_ministry_id_excluding_report_ids(
            ParticipantRole.ANSWERER, _MINISTRY_ID, _EXCLUDED_REPORT_IDS, 20, 0
        ),
        _REPORT_ID_NOT_IN,
        id="report ids answered by a ministry",
    ),
    pytest.param(
        lambda session: CRUDReport(
            session
        ).get_count_by_report_participant_role_and_ministry_id_excluding_report_ids(
            ParticipantRole.ANSWERER, _MINISTRY_ID, _EXCLUDED_REPORT_IDS
        ),
        _REPORT_ID_NOT_IN,
        id="count of reports answered by a ministry",
    ),
    pytest.param(
        lambda session: CRUDReportParticipant(
            session
        ).get_ministry_id_to_report_count_by_role_excluding_report_ids(
            ParticipantRole.ANSWERER, _EXCLUDED_REPORT_IDS
        ),
        "report_participant.report_id NOT IN (7, 8)",
        id="answered-by count per ministry",
    ),
    pytest.param(
        lambda session: CRUDReportPutTo(
            session
        ).get_ministry_id_to_report_count_excluding_sprs_report_ids(
            _EXCLUDED_SPRS_REPORT_IDS
        ),
        "report_put_to.sprs_report_id NOT IN ('x#', 'y#')",
        id="put-to count per ministry",
    ),
]


@pytest.mark.parametrize("call, expected_clause", _OFFICE_CALLS)
def test_an_office_read_leaves_out_the_excluded_report_ids_in_sql(
    call: Callable[[Session], object], expected_clause: str
) -> None:
    assert expected_clause in _get_compiled_statement(call)
