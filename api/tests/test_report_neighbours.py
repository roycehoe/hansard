from datetime import datetime
from unittest.mock import MagicMock

import pytest

from crud.report import CRUDReport
from database.report import Report
from enums import ReportType
from schemas.report import ReferencedReportData
from services import report as report_service


def _build_report(report_id: str) -> Report:
    return Report(
        id=1,
        volume_number=1,
        parliament_number=1,
        sitting_date=datetime(1986, 3, 7),
        speech_number=1,
        title=f"Title of {report_id}",
        report_id=report_id,
        report_type=ReportType.ORAL_ANSWER,
        report_version="1",
    )


def test_a_neighbour_inside_the_sitting_gives_its_link() -> None:
    reports = [_build_report("oral-answer-1"), _build_report("oral-answer-2")]

    assert report_service._get_sitting_neighbour_data(
        reports, 1
    ) == ReferencedReportData(
        report_slug="oral-answer-2", title="Title of oral-answer-2"
    )


@pytest.mark.parametrize("neighbour_index", [-1, 2])
def test_a_neighbour_past_either_end_of_the_sitting_gives_no_link(
    neighbour_index: int,
) -> None:
    reports = [_build_report("oral-answer-1"), _build_report("oral-answer-2")]

    assert report_service._get_sitting_neighbour_data(reports, neighbour_index) is None


def test_a_taken_down_report_is_not_a_neighbour(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    reports = [
        _build_report("oral-answer-1"),
        _build_report("oral-answer-2"),
        _build_report("oral-answer-3"),
    ]
    monkeypatch.setattr(
        CRUDReport, "get_all_by_sitting_date", lambda self, sitting_date: reports
    )
    monkeypatch.setattr(
        report_service,
        "is_report_id_taken_down",
        lambda report_id: report_id == "oral-answer-2",
    )

    sitting_reports = report_service._get_sitting_reports(reports[0], MagicMock())

    assert [report.report_id for report in sitting_reports] == [
        "oral-answer-1",
        "oral-answer-3",
    ]
