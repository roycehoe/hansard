from typing import Optional

from sqlmodel import Session

from crud.attendance import CRUDAttendance
from crud.membership import CRUDMembership
from crud.person import CRUDPerson
from crud.report import CRUDReport
from crud.sitting import CRUDSitting
from crud.speech import CRUDSpeech
from schemas.coverage import GetCoverageResponse, YearCoverageData
from utils.sitting_date import get_date_from_datetime

# NOTE: replaced whole and never mutated, so a request thread never reads a half-written answer
_cached_coverage: Optional[GetCoverageResponse] = None


def _get_uncached_coverage(session: Session) -> GetCoverageResponse:
    year_to_report_count = CRUDReport(session).get_year_to_report_count()
    year_to_text_report_count = CRUDReport(session).get_year_to_text_report_count()
    years = [
        YearCoverageData(
            year=year,
            report_count=year_to_report_count[year],
            text_report_count=year_to_text_report_count.get(year, 0),
        )
        for year in sorted(year_to_report_count)
    ]
    return GetCoverageResponse(
        report_count=sum(year_to_report_count.values()),
        text_report_count=sum(year_to_text_report_count.values()),
        speech_count=CRUDSpeech(session).get_count(),
        linked_speech_count=CRUDSpeech(session).get_count_with_membership_id(),
        person_count=CRUDPerson(session).get_count(),
        membership_count=CRUDMembership(session).get_count(),
        sitting_count=CRUDSitting(session).get_count(),
        attendance_count=CRUDAttendance(session).get_count(),
        linked_attendance_count=CRUDAttendance(session).get_count_with_membership_id(),
        first_sitting_date=get_date_from_datetime(
            CRUDReport(session).get_min_sitting_date()
        ),
        last_sitting_date=get_date_from_datetime(
            CRUDReport(session).get_max_sitting_date()
        ),
        text_first_sitting_date=get_date_from_datetime(
            CRUDReport(session).get_min_sitting_date_with_text()
        ),
        text_last_sitting_date=get_date_from_datetime(
            CRUDReport(session).get_max_sitting_date_with_text()
        ),
        attendance_last_sitting_date=CRUDSitting(
            session
        ).get_max_sitting_date_with_attendance(),
        years=years,
    )


def fill_coverage_cache(session: Session) -> None:
    global _cached_coverage
    _cached_coverage = _get_uncached_coverage(session)


def get_coverage(session: Session) -> GetCoverageResponse:
    global _cached_coverage
    cached_coverage = _cached_coverage
    if cached_coverage is not None:
        return cached_coverage
    coverage = _get_uncached_coverage(session)
    _cached_coverage = coverage
    return coverage
