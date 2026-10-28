from datetime import datetime
from typing import Optional

from database.report import Report
from enums import ReportType
from services import report as report_service

_SITTING_DATE = datetime(1986, 3, 7)
_TITLE = "ECONOMIC DOWNTURN"


def _build_report(
    report_id: str, report_type: ReportType, title: str, sitting_date: datetime
) -> Report:
    return Report(
        id=1,
        volume_number=1,
        parliament_number=1,
        sitting_date=sitting_date,
        speech_number=1,
        title=title,
        report_id=report_id,
        report_type=report_type,
        report_version="1",
    )


def _get_paired_written_answer(
    oral_answer: Report, sitting_reports: list[Report]
) -> Optional[str]:
    paired = report_service._get_paired_report_data(
        oral_answer,
        ReportType.ORAL_ANSWER,
        ReportType.WRITTEN_ANSWER_NA,
        sitting_reports,
    )
    return None if paired is None else paired.report_slug


def test_an_oral_answer_pairs_with_the_written_answer_of_the_same_title() -> None:
    oral_answer = _build_report("oral-1", ReportType.ORAL_ANSWER, _TITLE, _SITTING_DATE)
    written_answer = _build_report(
        "written-1", ReportType.WRITTEN_ANSWER_NA, _TITLE, _SITTING_DATE
    )

    assert _get_paired_written_answer(oral_answer, [oral_answer, written_answer]) == (
        "written-1"
    )


def test_whitespace_in_a_title_does_not_stop_the_pairing() -> None:
    oral_answer = _build_report("oral-1", ReportType.ORAL_ANSWER, _TITLE, _SITTING_DATE)
    written_answer = _build_report(
        "written-1",
        ReportType.WRITTEN_ANSWER_NA,
        "ECONOMIC  DOWNTURN\n",
        _SITTING_DATE,
    )

    assert _get_paired_written_answer(oral_answer, [oral_answer, written_answer]) == (
        "written-1"
    )


def test_a_different_title_or_type_gives_no_pairing() -> None:
    oral_answer = _build_report("oral-1", ReportType.ORAL_ANSWER, _TITLE, _SITTING_DATE)
    other_title = _build_report(
        "written-1", ReportType.WRITTEN_ANSWER_NA, "HOUSING", _SITTING_DATE
    )
    other_type = _build_report(
        "written-2", ReportType.WRITTEN_ANSWER, _TITLE, _SITTING_DATE
    )

    assert (
        _get_paired_written_answer(oral_answer, [oral_answer, other_title, other_type])
        is None
    )


def test_two_matching_written_answers_give_no_pairing() -> None:
    oral_answer = _build_report("oral-1", ReportType.ORAL_ANSWER, _TITLE, _SITTING_DATE)
    first = _build_report(
        "written-1", ReportType.WRITTEN_ANSWER_NA, _TITLE, _SITTING_DATE
    )
    second = _build_report(
        "written-2", ReportType.WRITTEN_ANSWER_NA, _TITLE, _SITTING_DATE
    )

    assert _get_paired_written_answer(oral_answer, [oral_answer, first, second]) is None


def test_a_written_answer_pairs_back_to_its_oral_answer() -> None:
    oral_answer = _build_report("oral-1", ReportType.ORAL_ANSWER, _TITLE, _SITTING_DATE)
    written_answer = _build_report(
        "written-1", ReportType.WRITTEN_ANSWER_NA, _TITLE, _SITTING_DATE
    )

    paired = report_service._get_paired_report_data(
        written_answer,
        ReportType.WRITTEN_ANSWER_NA,
        ReportType.ORAL_ANSWER,
        [oral_answer, written_answer],
    )

    assert paired is not None
    assert paired.report_slug == "oral-1"
    assert paired.sitting_date == _SITTING_DATE.date()


def test_another_report_type_gets_no_pairing() -> None:
    motion = _build_report("motion-1", ReportType.MOTION, _TITLE, _SITTING_DATE)
    written_answer = _build_report(
        "written-1", ReportType.WRITTEN_ANSWER_NA, _TITLE, _SITTING_DATE
    )

    assert _get_paired_written_answer(motion, [motion, written_answer]) is None
