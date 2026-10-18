from datetime import date, datetime, timezone
from typing import Optional

from psycopg.errors import InsufficientPrivilege, UndefinedTable
from sqlalchemy.exc import ProgrammingError
from sqlmodel import Session

from crud.refresh_run import CRUDRefreshRun
from database.refresh_run import RefreshRun
from enums import RefreshRunStatus
from schemas.refresh import (
    GetRefreshResponse,
    ParliamentGroupFiguresData,
    RefreshFiguresData,
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


def _get_measured_on(measured_at_text: object) -> date:
    measured_at = datetime.fromisoformat(measured_at_text)
    if measured_at.tzinfo is None:
        return get_singapore_date(measured_at.replace(tzinfo=timezone.utc))
    return get_singapore_date(measured_at)


def _get_group_data(
    stored_group: dict[str, object],
) -> Optional[ParliamentGroupFiguresData]:
    group_name = stored_group["group"]
    first_parliament_number = get_first_parliament_number(group_name)
    if first_parliament_number is None:
        return None
    linked_row_count = int(stored_group["linked_row_count"])
    speaker_label_row_count = linked_row_count + int(
        stored_group["named_unlinked_row_count"]
    )
    row_count = int(stored_group["row_count"])
    linked_character_count = int(stored_group["linked_character_count"])
    body_character_count = int(stored_group["body_character_count"])
    if speaker_label_row_count == 0:
        return None
    if row_count == 0:
        return None
    if body_character_count == 0:
        return None
    return ParliamentGroupFiguresData(
        first_parliament_number=first_parliament_number,
        last_parliament_number=get_last_parliament_number(group_name),
        linked_row_count=linked_row_count,
        speaker_label_row_count=speaker_label_row_count,
        row_count=row_count,
        named_linked_share=linked_row_count / speaker_label_row_count,
        all_linked_share=linked_row_count / row_count,
        text_share=linked_character_count / body_character_count,
    )


# NOTE: bad figures from the scraper count as no figures, so the app falls back to its constants
def _get_figures_data(
    figures: Optional[dict[str, object]],
) -> Optional[RefreshFiguresData]:
    try:
        measured_on = _get_measured_on(figures["measured_at"])
        groups = []
        for stored_group in figures["groups"]:
            group_data = _get_group_data(stored_group)
            if group_data is not None:
                groups.append(group_data)
    except KeyError:
        return None
    except TypeError:
        return None
    except ValueError:
        return None
    if len(groups) == 0:
        return None
    return RefreshFiguresData(measured_on=measured_on, groups=groups)


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
