from typing import Optional

from sqlmodel import Session

from crud.report import CRUDReport
from middleware.takedown import get_taken_down_report_ids
from schemas.parliament import GetAllParliamentsResponse, ParliamentData

# NOTE: replaced whole and never mutated, so a request thread never reads a half-written answer
_cached_all_parliaments: Optional[GetAllParliamentsResponse] = None


def _get_uncached_all_parliaments(session: Session) -> GetAllParliamentsResponse:
    taken_down_report_ids = get_taken_down_report_ids(session)
    parliament_number_to_sitting_count = CRUDReport(
        session
    ).get_parliament_number_to_sitting_count()
    parliament_number_to_report_count = CRUDReport(
        session
    ).get_parliament_number_to_report_count_excluding_ids(taken_down_report_ids)
    parliament_number_to_text_report_count = CRUDReport(
        session
    ).get_parliament_number_to_text_report_count_excluding_ids(taken_down_report_ids)
    parliament_number_to_first_sitting_date = CRUDReport(
        session
    ).get_parliament_number_to_first_sitting_date()
    parliament_number_to_last_sitting_date = CRUDReport(
        session
    ).get_parliament_number_to_last_sitting_date()
    return GetAllParliamentsResponse(
        parliaments=[
            ParliamentData(
                parliament_number=parliament_number,
                sitting_count=parliament_number_to_sitting_count[parliament_number],
                report_count=parliament_number_to_report_count[parliament_number],
                text_report_count=parliament_number_to_text_report_count[
                    parliament_number
                ],
                first_sitting_date=parliament_number_to_first_sitting_date[
                    parliament_number
                ].date(),
                last_sitting_date=parliament_number_to_last_sitting_date[
                    parliament_number
                ].date(),
            )
            for parliament_number in sorted(parliament_number_to_report_count)
        ]
    )


def fill_all_parliaments_cache(session: Session) -> None:
    global _cached_all_parliaments
    _cached_all_parliaments = _get_uncached_all_parliaments(session)


def get_all_parliaments(session: Session) -> GetAllParliamentsResponse:
    global _cached_all_parliaments
    cached_all_parliaments = _cached_all_parliaments
    if cached_all_parliaments is not None:
        return cached_all_parliaments
    all_parliaments = _get_uncached_all_parliaments(session)
    _cached_all_parliaments = all_parliaments
    return all_parliaments
