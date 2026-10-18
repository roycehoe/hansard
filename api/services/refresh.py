from datetime import date, datetime, timezone
from typing import Optional

from psycopg.errors import InsufficientPrivilege, UndefinedTable
from pydantic import ValidationError
from sqlalchemy.exc import ProgrammingError
from sqlmodel import Session

from crud.refresh_run import CRUDRefreshRun
from database.refresh_run import RefreshRun
from enums import RefreshRunStatus
from schemas.refresh import (
    GetRefreshResponse,
    ParliamentGroupFiguresData,
    RefreshFiguresData,
    RefreshRunFiguresData,
    RefreshRunGroupData,
)
from utils.parliament_group import (
    get_first_parliament_number,
    get_last_parliament_number,
)
from utils.singapore_date import get_singapore_date

_FIGURES_JSON_TYPE = "object"


def _get_empty_refresh_response() -> GetRefreshResponse:
    return GetRefreshResponse(
        latest_sitting_date=None, last_checked_date=None, figures=None
    )


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


def _get_figures_data(
    figures: Optional[dict[str, object]],
) -> Optional[RefreshFiguresData]:
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
    return RefreshFiguresData(
        measured_on=_get_measured_on(stored_figures.measured_at), groups=groups
    )


def _get_refresh_response(
    succeeded_run: Optional[RefreshRun], run_with_figures: Optional[RefreshRun]
) -> GetRefreshResponse:
    if succeeded_run is None:
        return _get_empty_refresh_response()
    return GetRefreshResponse(
        latest_sitting_date=succeeded_run.latest_sitting_date_with_text,
        last_checked_date=None
        if succeeded_run.finished_at is None
        else get_singapore_date(succeeded_run.finished_at),
        figures=None
        if run_with_figures is None
        else _get_figures_data(run_with_figures.figures),
    )


def get_refresh(session: Session) -> GetRefreshResponse:
    try:
        succeeded_run = CRUDRefreshRun(session).get_latest_by_status(
            RefreshRunStatus.SUCCEEDED
        )
        run_with_figures = CRUDRefreshRun(
            session
        ).get_latest_by_status_and_figures_type(
            RefreshRunStatus.SUCCEEDED, _FIGURES_JSON_TYPE
        )
    except ProgrammingError as error:
        if isinstance(error.orig, UndefinedTable):
            return _get_empty_refresh_response()
        if isinstance(error.orig, InsufficientPrivilege):
            return _get_empty_refresh_response()
        raise
    return _get_refresh_response(succeeded_run, run_with_figures)
