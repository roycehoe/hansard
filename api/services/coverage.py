from datetime import date, datetime, timezone
from typing import Optional

from psycopg.errors import InsufficientPrivilege, UndefinedTable
from pydantic import ValidationError
from sqlalchemy.exc import OperationalError, ProgrammingError
from sqlmodel import Session

from crud.attendance import CRUDAttendance
from crud.membership import CRUDMembership
from crud.person import CRUDPerson
from crud.refresh_run import CRUDRefreshRun
from crud.report import CRUDReport
from crud.sitting import CRUDSitting
from crud.speech import CRUDSpeech
from enums import RefreshRunStatus
from schemas.coverage import (
    AttributionFiguresData,
    GetCoverageResponse,
    ParliamentGroupFiguresData,
    YearCoverageData,
)
from schemas.refresh import RefreshRunFiguresData, RefreshRunGroupData
from utils.parliament_group import (
    get_first_parliament_number,
    get_last_parliament_number,
)
from utils.singapore_date import get_singapore_date
from utils.sitting_date import get_date_from_datetime

_FIGURES_JSON_TYPE = "object"

# NOTE: replaced whole and never mutated, so a request thread never reads a half-written answer
_cached_coverage: Optional[GetCoverageResponse] = None


def _get_measured_on(measured_at: datetime) -> date:
    if measured_at.tzinfo is None:
        return get_singapore_date(measured_at.replace(tzinfo=timezone.utc))
    return get_singapore_date(measured_at)


def _get_group_data(
    stored_group: RefreshRunGroupData,
) -> Optional[ParliamentGroupFiguresData]:
    first_parliament_number = get_first_parliament_number(stored_group.group)
    if first_parliament_number is None:
        return None
    speaker_label_row_count = (
        stored_group.linked_row_count + stored_group.named_unlinked_row_count
    )
    try:
        return ParliamentGroupFiguresData(
            first_parliament_number=first_parliament_number,
            last_parliament_number=get_last_parliament_number(stored_group.group),
            linked_row_count=stored_group.linked_row_count,
            speaker_label_row_count=speaker_label_row_count,
            row_count=stored_group.row_count,
            named_linked_share=stored_group.linked_row_count / speaker_label_row_count,
            all_linked_share=stored_group.linked_row_count / stored_group.row_count,
            text_share=stored_group.linked_character_count
            / stored_group.body_character_count,
        )
    except ZeroDivisionError:
        return None


# NOTE: bad figures from the scraper count as no figures, so the app falls back to its constants
def _get_validated_stored_figures(
    figures: Optional[dict[str, object]],
) -> Optional[RefreshRunFiguresData]:
    try:
        return RefreshRunFiguresData.model_validate(figures)
    except ValidationError:
        return None


def _get_attribution_data(
    figures: Optional[dict[str, object]],
) -> Optional[AttributionFiguresData]:
    stored_figures = _get_validated_stored_figures(figures)
    if stored_figures is None:
        return None
    groups = [
        group_data
        for group_data in map(_get_group_data, stored_figures.groups)
        if group_data is not None
    ]
    if len(groups) == 0:
        return None
    return AttributionFiguresData(
        measured_on=_get_measured_on(stored_figures.measured_at), groups=groups
    )


def _get_attribution(
    refresh_run_session: Session,
) -> Optional[AttributionFiguresData]:
    try:
        run_with_figures = CRUDRefreshRun(
            refresh_run_session
        ).get_latest_by_status_and_figures_type(
            RefreshRunStatus.SUCCEEDED, _FIGURES_JSON_TYPE
        )
    except ProgrammingError as error:
        if isinstance(error.orig, UndefinedTable):
            return None
        if isinstance(error.orig, InsufficientPrivilege):
            return None
        raise
    except OperationalError:
        # NOTE: a dropped connection or a timeout on this read leaves the counts standing, and the app shows its hand-kept figures
        return None
    if run_with_figures is None:
        return None
    return _get_attribution_data(run_with_figures.figures)


def _get_uncached_coverage(
    session: Session, refresh_run_session: Session
) -> GetCoverageResponse:
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
        no_text_by_design_report_count=CRUDReport(
            session
        ).get_no_text_by_design_count(),
        speech_count=CRUDSpeech(session).get_count(),
        linked_speech_count=CRUDSpeech(session).get_count_with_membership_id(),
        person_count=CRUDPerson(session).get_count(),
        membership_count=CRUDMembership(session).get_count(),
        non_member_membership_count=CRUDMembership(session).get_non_member_count(),
        non_member_person_count=CRUDMembership(session).get_never_member_person_count(),
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
        attribution=_get_attribution(refresh_run_session),
    )


def fill_coverage_cache(session: Session, refresh_run_session: Session) -> None:
    global _cached_coverage
    _cached_coverage = _get_uncached_coverage(session, refresh_run_session)


def get_coverage(session: Session, refresh_run_session: Session) -> GetCoverageResponse:
    global _cached_coverage
    cached_coverage = _cached_coverage
    if cached_coverage is not None:
        return cached_coverage
    coverage = _get_uncached_coverage(session, refresh_run_session)
    _cached_coverage = coverage
    return coverage
