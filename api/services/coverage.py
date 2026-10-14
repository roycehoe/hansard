from time import monotonic

from sqlmodel import Session

from crud.attendance import CRUDAttendance
from crud.membership import CRUDMembership
from crud.person import CRUDPerson
from crud.report import CRUDReport
from crud.sitting import CRUDSitting
from crud.speech import CRUDSpeech
from schemas.coverage import GetCoverageResponse, YearCoverageData
from utils.sitting_date import get_date_from_datetime

_CACHE_TTL_SECONDS = 60 * 60

# One (expires_at, response) tuple, replaced whole, so a reader never sees a
# half-written entry. Two simultaneous first requests may both compute; the
# last write wins and both results are equal.
_cache: tuple[float, GetCoverageResponse] | None = None


def _build_coverage(session: Session) -> GetCoverageResponse:
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
        report_count=CRUDReport(session).get_count(),
        text_report_count=CRUDReport(session).get_text_report_count(),
        speech_count=CRUDSpeech(session).get_count(),
        linked_speech_count=CRUDSpeech(session).get_count_with_membership_id(),
        person_count=CRUDPerson(session).get_count(),
        membership_count=CRUDMembership(session).get_count(),
        sitting_count=CRUDSitting(session).get_count(),
        attendance_count=CRUDAttendance(session).get_count(),
        linked_attendance_count=CRUDAttendance(session).get_count_with_membership_id(),
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


def get_coverage(session: Session) -> GetCoverageResponse:
    global _cache
    if _cache is not None and monotonic() < _cache[0]:
        return _cache[1]
    response = _build_coverage(session)
    _cache = (monotonic() + _CACHE_TTL_SECONDS, response)
    return response
