from datetime import date
from typing import Optional

from sqlmodel import Session

from crud.division import CRUDDivision
from crud.division_party_count import CRUDDivisionPartyCount
from crud.division_vote import CRUDDivisionVote
from crud.minutes import CRUDMinutes
from crud.minutes_division import CRUDMinutesDivision
from crud.report import CRUDReport
from database.division import Division
from database.report import Report
from exceptions.division import DivisionNotFoundException
from exceptions.report import ReportTakenDownException
from middleware.takedown import get_taken_down_report_ids, is_report_id_taken_down
from schemas.division import (
    DivisionData,
    DivisionMinutesData,
    DivisionPartyCountData,
    DivisionVoteData,
    GetAllDivisionsResponse,
    GetDivisionResponse,
)
from utils.report_slug import get_report_id_candidates, get_report_slug


def _get_validated_division(division_id: int, session: Session) -> Division:
    division = CRUDDivision(session).get(division_id)
    if division is None:
        raise DivisionNotFoundException
    if division.sprs_report_id is not None and is_report_id_taken_down(
        division.sprs_report_id
    ):
        raise ReportTakenDownException
    return division


def _get_report_id_to_report(
    divisions: list[Division], session: Session
) -> dict[str, Report]:
    report_ids = [
        division.sprs_report_id
        for division in divisions
        if division.sprs_report_id is not None
    ]
    return {
        report.report_id: report
        for report in CRUDReport(session).get_all_by_report_ids(report_ids)
    }


def _get_division_data(
    division: Division, report_id_to_report: dict[str, Report]
) -> DivisionData:
    report: Optional[Report] = (
        None
        if division.sprs_report_id is None
        else report_id_to_report[division.sprs_report_id]
    )
    return DivisionData(
        id=division.id,
        sitting_date=division.sitting_date,
        parliament_number=division.parliament_number,
        report_slug=None if report is None else get_report_slug(report.report_id),
        report_title=None if report is None else report.title,
        speech_ordinal=division.speech_ordinal,
        count_source=division.count_source,
        printed_counts=division.printed_counts,
        ayes=division.ayes,
        noes=division.noes,
        abstentions=division.abstentions,
        absent=division.absent,
        paired=division.paired,
        list_status=division.list_status,
    )


def _get_division_minutes_data(
    division_id: int, session: Session
) -> Optional[DivisionMinutesData]:
    minutes_divisions = CRUDMinutesDivision(session).get_all_by_division_id(division_id)
    if not minutes_divisions:
        return None
    minutes_division = minutes_divisions[0]
    minutes_id_to_minutes = {
        minutes.id: minutes
        for minutes in CRUDMinutes(session).get_by_ids([minutes_division.minutes_id])
    }
    minutes = minutes_id_to_minutes[minutes_division.minutes_id]
    return DivisionMinutesData(
        sitting_date=minutes.sitting_date,
        printed_counts=minutes_division.printed_counts,
        printed_label=minutes.printed_label,
        file_url=minutes.file_url,
        pairing=minutes_division.pairing,
        list_status=minutes_division.list_status,
        printed_list=minutes_division.printed_list,
    )


def get_all_divisions(
    page: int,
    page_size: int,
    parliament_number: Optional[int],
    date_from: Optional[date],
    date_to: Optional[date],
    report_slug: Optional[str],
    session: Session,
) -> GetAllDivisionsResponse:
    sprs_report_ids = (
        None if report_slug is None else get_report_id_candidates(report_slug)
    )
    excluded_report_ids = get_taken_down_report_ids(session)
    divisions = CRUDDivision(session).get_all_filtered(
        parliament_number,
        date_from,
        date_to,
        sprs_report_ids,
        excluded_report_ids,
        limit=page_size + 1,
        offset=(page - 1) * page_size,
    )
    page_divisions = divisions[:page_size]
    report_id_to_report = _get_report_id_to_report(page_divisions, session)
    return GetAllDivisionsResponse(
        divisions=[
            _get_division_data(division, report_id_to_report)
            for division in page_divisions
        ],
        page=page,
        page_size=page_size,
        has_next_page=len(divisions) > page_size,
        total_count=CRUDDivision(session).get_count_filtered(
            parliament_number,
            date_from,
            date_to,
            sprs_report_ids,
            excluded_report_ids,
        ),
    )


def get_division(division_id: int, session: Session) -> GetDivisionResponse:
    division = _get_validated_division(division_id, session)
    division_data = _get_division_data(
        division, _get_report_id_to_report([division], session)
    )
    return GetDivisionResponse(
        **division_data.model_dump(),
        printed_list=division.printed_list,
        votes=[
            DivisionVoteData(
                printed_name=vote.printed_name,
                vote_choice=vote.vote_choice,
                list_source=vote.list_source,
                membership_id=vote.speaker_id,
                party=vote.party,
                is_party_uncertain=vote.is_party_uncertain,
            )
            for vote in CRUDDivisionVote(session).get_all_by_division_id(division.id)
        ],
        party_counts=[
            DivisionPartyCountData(
                list_source=party_count.list_source,
                vote_choice=party_count.vote_choice,
                party=party_count.party,
                member_count=party_count.member_count,
                uncertain_member_count=party_count.uncertain_member_count,
            )
            for party_count in CRUDDivisionPartyCount(session).get_all_by_division_id(
                division.id
            )
        ],
        minutes=_get_division_minutes_data(division.id, session),
    )
