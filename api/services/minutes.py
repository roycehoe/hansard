from datetime import date
from typing import Optional

from sqlmodel import Session

from crud.minutes import CRUDMinutes
from enums import MinutesStatus
from schemas.minutes import GetAllMinutesResponse, MinutesData


def get_all_minutes(
    page: int,
    page_size: int,
    status: Optional[MinutesStatus],
    date_from: Optional[date],
    date_to: Optional[date],
    session: Session,
) -> GetAllMinutesResponse:
    minutes_rows = CRUDMinutes(session).get_all_filtered(
        status,
        date_from,
        date_to,
        limit=page_size + 1,
        offset=(page - 1) * page_size,
    )
    return GetAllMinutesResponse(
        minutes=[
            MinutesData(
                sitting_date=minutes.sitting_date,
                status=minutes.status,
                printed_label=minutes.printed_label,
                printed_parliament=minutes.printed_parliament,
                file_url=minutes.file_url,
                archive_timestamp=minutes.archive_timestamp,
                file_format=minutes.file_format,
            )
            for minutes in minutes_rows[:page_size]
        ],
        page=page,
        page_size=page_size,
        has_next_page=len(minutes_rows) > page_size,
        total_count=CRUDMinutes(session).get_count_filtered(status, date_from, date_to),
    )
