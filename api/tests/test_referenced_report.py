from datetime import datetime
from typing import Optional

from database.report import Report
from enums import ReportType
from services import report as report_service

_SITTING_DATE = datetime(1986, 3, 7)
_TITLE = "ECONOMIC DOWNTURN"


def _build_report(report_id: str, report_type: ReportType, title: str) -> Report:
    return Report(
        id=1,
        volume_number=1,
        parliament_number=1,
        sitting_date=_SITTING_DATE,
        speech_number=1,
        title=title,
        report_id=report_id,
        report_type=report_type,
        report_version="1",
    )


def _get_referenced_written_answer_slug(
    sitting_reports: list[Report],
) -> Optional[str]:
    referenced_report = report_service._get_referenced_report_data(
        _TITLE, ReportType.WRITTEN_ANSWER_NA, sitting_reports
    )
    return None if referenced_report is None else referenced_report.report_slug


def test_an_oral_answer_links_to_the_written_answer_of_the_same_title() -> None:
    oral_answer = _build_report("oral-1", ReportType.ORAL_ANSWER, _TITLE)
    written_answer = _build_report("written-1", ReportType.WRITTEN_ANSWER_NA, _TITLE)

    assert _get_referenced_written_answer_slug([oral_answer, written_answer]) == (
        "written-1"
    )


def test_whitespace_in_a_title_does_not_stop_the_link() -> None:
    oral_answer = _build_report("oral-1", ReportType.ORAL_ANSWER, _TITLE)
    written_answer = _build_report(
        "written-1", ReportType.WRITTEN_ANSWER_NA, "ECONOMIC  DOWNTURN\n"
    )

    assert _get_referenced_written_answer_slug([oral_answer, written_answer]) == (
        "written-1"
    )


def test_a_different_title_or_type_gives_no_link() -> None:
    oral_answer = _build_report("oral-1", ReportType.ORAL_ANSWER, _TITLE)
    other_title = _build_report("written-1", ReportType.WRITTEN_ANSWER_NA, "HOUSING")
    other_type = _build_report("written-2", ReportType.WRITTEN_ANSWER, _TITLE)

    assert (
        _get_referenced_written_answer_slug([oral_answer, other_title, other_type])
        is None
    )


def test_two_matching_written_answers_give_no_link() -> None:
    oral_answer = _build_report("oral-1", ReportType.ORAL_ANSWER, _TITLE)
    first = _build_report("written-1", ReportType.WRITTEN_ANSWER_NA, _TITLE)
    second = _build_report("written-2", ReportType.WRITTEN_ANSWER_NA, _TITLE)

    assert _get_referenced_written_answer_slug([oral_answer, first, second]) is None


def test_a_written_answer_links_back_to_its_oral_answer() -> None:
    oral_answer = _build_report("oral-1", ReportType.ORAL_ANSWER, _TITLE)
    written_answer = _build_report("written-1", ReportType.WRITTEN_ANSWER_NA, _TITLE)

    referencing_oral_answer = report_service._get_referenced_report_data(
        _TITLE, ReportType.ORAL_ANSWER, [oral_answer, written_answer]
    )

    assert referencing_oral_answer is not None
    assert referencing_oral_answer.report_slug == "oral-1"
