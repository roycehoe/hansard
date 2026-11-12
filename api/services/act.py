from datetime import datetime
from typing import Optional

from sqlmodel import Session

from crud.act import CRUDAct
from crud.act_history_entry import CRUDActHistoryEntry
from crud.bill_report_speaker import CRUDBillReportSpeaker
from database.act import Act
from database.bill_report_speaker import BillReportSpeaker
from database.person import Person
from enums import BillReportRole
from exceptions.act import ActNotFoundException
from middleware.bill import (
    VisibleBill,
    get_bill_id_to_visible_bill,
    get_person_id_to_bill_id_to_speaker_rows,
    get_speaker_rows_without_chair_only_rows,
    get_sprs_report_id_to_bill_id,
    get_sprs_report_id_to_role,
)
from middleware.membership import get_membership_id_to_person
from middleware.takedown import get_taken_down_report_ids
from schemas.act import (
    ActEntryBillData,
    ActEntryData,
    ActPersonBillData,
    ActPersonData,
    ActSummaryData,
    GetActPeopleResponse,
    GetActResponse,
    GetAllActsResponse,
)
from utils.person_slug import get_person_slug


def _get_validated_act(sso_code: str, session: Session) -> Act:
    act = CRUDAct(session).get_by_sso_code(sso_code)
    if act is None:
        raise ActNotFoundException
    return act


def get_all_acts(session: Session) -> GetAllActsResponse:
    return GetAllActsResponse(
        acts=[
            ActSummaryData(sso_code=act.sso_code, title=act.title)
            for act in CRUDAct(session).get_all()
        ]
    )


def _get_entry_bill_data(
    bill_id: Optional[int], bill_id_to_visible_bill: dict[int, VisibleBill]
) -> Optional[ActEntryBillData]:
    if bill_id is None:
        return None
    visible_bill = bill_id_to_visible_bill.get(bill_id)
    if visible_bill is None:
        return None
    return ActEntryBillData(
        bill_key=visible_bill.bill_key,
        title=visible_bill.bill.title,
        first_sitting_date=visible_bill.bill.first_sitting_date.date(),
        last_sitting_date=visible_bill.bill.last_sitting_date.date(),
        is_passed=visible_bill.bill.is_passed,
        act_count=visible_bill.act_count,
    )


def get_act(sso_code: str, session: Session) -> GetActResponse:
    act = _get_validated_act(sso_code, session)
    entries = CRUDActHistoryEntry(session).get_all_by_act_id(act.id)
    bill_id_to_visible_bill = get_bill_id_to_visible_bill(
        sorted({entry.bill_id for entry in entries if entry.bill_id is not None}),
        get_taken_down_report_ids(session),
        session,
    )
    entry_datas = []
    for entry in entries:
        bill_data = _get_entry_bill_data(entry.bill_id, bill_id_to_visible_bill)
        entry_datas.append(
            ActEntryData(
                ordinal=entry.ordinal,
                kind=entry.kind,
                printed_title=entry.printed_title,
                printed_law_number=entry.printed_law_number,
                printed_bill_number=entry.printed_bill_number,
                first_reading_date=entry.first_reading_date,
                second_reading_date=entry.second_reading_date,
                third_reading_date=entry.third_reading_date,
                commencement_date=entry.commencement_date,
                bill_link_source=(
                    entry.bill_link_source if bill_data is not None else None
                ),
                bill=bill_data,
            )
        )
    return GetActResponse(sso_code=act.sso_code, title=act.title, entries=entry_datas)


def _get_visible_bill_sort_key(visible_bill: VisibleBill) -> tuple[datetime, str]:
    return (visible_bill.bill.first_sitting_date, visible_bill.bill_key)


def _get_act_person_sort_key(act_person: ActPersonData) -> tuple[int, str, int]:
    return (
        -act_person.bill_count,
        act_person.canonical_name.casefold(),
        act_person.person_id,
    )


def _get_act_person_data(
    person: Person,
    bill_id_to_reading_rows: dict[int, list[BillReportSpeaker]],
    bill_id_to_budget_debate_rows: dict[int, list[BillReportSpeaker]],
    bill_id_to_visible_bill: dict[int, VisibleBill],
) -> ActPersonData:
    visible_bills = sorted(
        [
            bill_id_to_visible_bill[bill_id]
            for bill_id in bill_id_to_reading_rows.keys()
            | bill_id_to_budget_debate_rows.keys()
        ],
        key=_get_visible_bill_sort_key,
    )
    act_person_bills = []
    for visible_bill in visible_bills:
        reading_rows = bill_id_to_reading_rows.get(visible_bill.bill.id, [])
        budget_debate_rows = bill_id_to_budget_debate_rows.get(visible_bill.bill.id, [])
        act_person_bills.append(
            ActPersonBillData(
                bill_key=visible_bill.bill_key,
                title=visible_bill.bill.title,
                act_count=visible_bill.act_count,
                printed_speakers=sorted(
                    {
                        speaker_row.printed_speaker
                        for speaker_row in reading_rows + budget_debate_rows
                    }
                ),
                reading_speech_count=sum(
                    speaker_row.speech_count for speaker_row in reading_rows
                ),
                budget_debate_speech_count=sum(
                    speaker_row.speech_count for speaker_row in budget_debate_rows
                ),
            )
        )
    return ActPersonData(
        person_id=person.id,
        person_slug=get_person_slug(person.canonical_name),
        canonical_name=person.canonical_name,
        bill_count=len(visible_bills),
        bills=act_person_bills,
    )


def get_act_people(
    sso_code: str, page: int, page_size: int, session: Session
) -> GetActPeopleResponse:
    act = _get_validated_act(sso_code, session)
    entries = CRUDActHistoryEntry(session).get_all_by_act_id(act.id)
    taken_down_report_ids = get_taken_down_report_ids(session)
    bill_id_to_visible_bill = get_bill_id_to_visible_bill(
        sorted({entry.bill_id for entry in entries if entry.bill_id is not None}),
        taken_down_report_ids,
        session,
    )
    sprs_report_id_to_bill_id = get_sprs_report_id_to_bill_id(bill_id_to_visible_bill)
    speaker_rows = get_speaker_rows_without_chair_only_rows(
        CRUDBillReportSpeaker(session).get_all_by_sprs_report_ids_excluding_report_ids(
            sorted(sprs_report_id_to_bill_id), taken_down_report_ids
        ),
        bill_id_to_visible_bill,
        session,
    )
    membership_id_to_person = get_membership_id_to_person(
        sorted({speaker_row.speaker_id for speaker_row in speaker_rows}), session
    )
    sprs_report_id_to_role = get_sprs_report_id_to_role(bill_id_to_visible_bill)
    person_id_to_bill_id_to_reading_rows = get_person_id_to_bill_id_to_speaker_rows(
        speaker_rows,
        membership_id_to_person,
        sprs_report_id_to_bill_id,
        sprs_report_id_to_role,
        BillReportRole.READING,
    )
    person_id_to_bill_id_to_budget_debate_rows = (
        get_person_id_to_bill_id_to_speaker_rows(
            speaker_rows,
            membership_id_to_person,
            sprs_report_id_to_bill_id,
            sprs_report_id_to_role,
            BillReportRole.BUDGET_DEBATE,
        )
    )
    person_id_to_person = {
        person.id: person for person in membership_id_to_person.values()
    }
    act_people = sorted(
        [
            _get_act_person_data(
                person_id_to_person[person_id],
                person_id_to_bill_id_to_reading_rows.get(person_id, {}),
                person_id_to_bill_id_to_budget_debate_rows.get(person_id, {}),
                bill_id_to_visible_bill,
            )
            for person_id in person_id_to_bill_id_to_reading_rows.keys()
            | person_id_to_bill_id_to_budget_debate_rows.keys()
        ],
        key=_get_act_person_sort_key,
    )
    return GetActPeopleResponse(
        people=act_people[(page - 1) * page_size : page * page_size],
        page=page,
        page_size=page_size,
        has_next_page=len(act_people) > page * page_size,
        total_count=len(act_people),
    )
