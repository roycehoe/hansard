from sqlmodel import Session

from crud.act import CRUDAct
from crud.act_history_entry import CRUDActHistoryEntry
from crud.bill_report import CRUDBillReport
from crud.bill_report_speaker import CRUDBillReportSpeaker
from crud.bill_stage_line import CRUDBillStageLine
from crud.membership import CRUDMembership
from crud.person import CRUDPerson
from crud.report import CRUDReport
from database.bill_report_speaker import BillReportSpeaker
from database.bill_stage_line import BillStageLine
from database.person import Person
from database.report import Report
from enums import BillReportRole
from exceptions.bill import BillNotFoundException
from exceptions.person import PersonNotFoundException
from exceptions.report import ReportTakenDownException
from middleware.bill import (
    VisibleBill,
    get_bill_id_to_visible_bill,
    get_person_id_to_bill_id_to_speaker_rows,
    get_speaker_rows_without_chair_only_rows,
    get_sprs_report_id_to_bill_id,
    get_sprs_report_id_to_role,
)
from middleware.membership import get_membership_id_to_person
from middleware.takedown import get_taken_down_report_ids, is_report_id_taken_down
from schemas.bill import (
    BillActData,
    BillPersonData,
    BillReportData,
    BillStageLineData,
    GetBillResponse,
    GetPersonBillsResponse,
    PersonBillData,
    PersonBillReportData,
)
from utils.person_slug import get_person_slug
from utils.report_slug import get_report_id_candidates, get_report_slug


def _get_validated_person(person_id: int, session: Session) -> Person:
    person = CRUDPerson(session).get(person_id)
    if person is None:
        raise PersonNotFoundException
    return person


def _get_validated_report(report_slug: str, session: Session) -> Report:
    for report_id in get_report_id_candidates(report_slug):
        report = CRUDReport(session).get_by_report_id(report_id)
        if report is None:
            continue
        if is_report_id_taken_down(report.report_id):
            raise ReportTakenDownException
        return report
    raise BillNotFoundException


def _get_bill_person_sort_key(
    bill_person: BillPersonData,
) -> tuple[int, int, str, int]:
    return (
        -bill_person.reading_speech_count,
        -bill_person.budget_debate_speech_count,
        bill_person.canonical_name.casefold(),
        bill_person.person_id,
    )


def _get_bill_report_sort_key(bill_report: BillReportData) -> tuple[str, str, str]:
    return (
        bill_report.sitting_date.isoformat(),
        bill_report.report_type,
        bill_report.report_slug,
    )


def _get_bill_report_data(
    report: Report,
    visible_bill: VisibleBill,
    sprs_report_id_to_stage_lines: dict[str, list[BillStageLine]],
) -> BillReportData:
    return BillReportData(
        report_slug=get_report_slug(report.report_id),
        title=report.title,
        report_type=report.report_type,
        sitting_date=report.sitting_date.date(),
        role=visible_bill.sprs_report_id_to_role[report.report_id],
        stage_lines=[
            BillStageLineData(
                stage=stage_line.stage,
                printed_text=stage_line.printed_text,
                ordinal=stage_line.ordinal,
            )
            for stage_line in sprs_report_id_to_stage_lines.get(report.report_id, [])
        ],
    )


def get_bill(report_slug: str, session: Session) -> GetBillResponse:
    report = _get_validated_report(report_slug, session)
    bill_report = CRUDBillReport(session).get_by_report_id(report.id)
    if bill_report is None:
        raise BillNotFoundException
    taken_down_report_ids = get_taken_down_report_ids(session)
    bill_id_to_visible_bill = get_bill_id_to_visible_bill(
        [bill_report.bill_id], taken_down_report_ids, session
    )
    visible_bill = bill_id_to_visible_bill.get(bill_report.bill_id)
    if visible_bill is None:
        raise BillNotFoundException
    sprs_report_ids = [
        visible_report.report_id for visible_report in visible_bill.reports
    ]
    sprs_report_id_to_stage_lines: dict[str, list[BillStageLine]] = {}
    for stage_line in CRUDBillStageLine(
        session
    ).get_all_by_sprs_report_ids_excluding_report_ids(
        sprs_report_ids, taken_down_report_ids
    ):
        sprs_report_id_to_stage_lines.setdefault(stage_line.sprs_report_id, []).append(
            stage_line
        )
    entries = CRUDActHistoryEntry(session).get_all_by_bill_id(visible_bill.bill.id)
    act_id_to_act = {
        act.id: act
        for act in CRUDAct(session).get_by_ids(
            sorted({entry.act_id for entry in entries})
        )
    }
    speaker_rows = get_speaker_rows_without_chair_only_rows(
        CRUDBillReportSpeaker(session).get_all_by_sprs_report_ids_excluding_report_ids(
            sprs_report_ids, taken_down_report_ids
        ),
        bill_id_to_visible_bill,
        session,
    )
    membership_id_to_person = get_membership_id_to_person(
        sorted({speaker_row.speaker_id for speaker_row in speaker_rows}), session
    )
    sprs_report_id_to_bill_id = get_sprs_report_id_to_bill_id(bill_id_to_visible_bill)
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
    bill_id = visible_bill.bill.id
    people = []
    for person_id in (
        person_id_to_bill_id_to_reading_rows.keys()
        | person_id_to_bill_id_to_budget_debate_rows.keys()
    ):
        reading_rows = person_id_to_bill_id_to_reading_rows.get(person_id, {}).get(
            bill_id, []
        )
        budget_debate_rows = person_id_to_bill_id_to_budget_debate_rows.get(
            person_id, {}
        ).get(bill_id, [])
        people.append(
            BillPersonData(
                person_id=person_id,
                person_slug=get_person_slug(
                    person_id_to_person[person_id].canonical_name
                ),
                canonical_name=person_id_to_person[person_id].canonical_name,
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
    return GetBillResponse(
        bill_key=visible_bill.bill_key,
        title=visible_bill.bill.title,
        first_sitting_date=visible_bill.bill.first_sitting_date.date(),
        last_sitting_date=visible_bill.bill.last_sitting_date.date(),
        is_passed=visible_bill.bill.is_passed,
        act_count=visible_bill.act_count,
        reports=sorted(
            [
                _get_bill_report_data(
                    visible_report, visible_bill, sprs_report_id_to_stage_lines
                )
                for visible_report in visible_bill.reports
            ],
            key=_get_bill_report_sort_key,
        ),
        acts=[
            BillActData(
                sso_code=act_id_to_act[entry.act_id].sso_code,
                title=act_id_to_act[entry.act_id].title,
                printed_title=entry.printed_title,
                printed_law_number=entry.printed_law_number,
                bill_link_source=entry.bill_link_source,
            )
            for entry in entries
        ],
        people=sorted(people, key=_get_bill_person_sort_key),
    )


def _get_person_bill_report_sort_key(
    person_bill_report: PersonBillReportData,
) -> tuple[str, str]:
    return (
        person_bill_report.sitting_date.isoformat(),
        person_bill_report.report_slug,
    )


def _get_person_bill_reports(
    speaker_rows: list[BillReportSpeaker], visible_bill: VisibleBill
) -> list[PersonBillReportData]:
    sprs_report_ids = {speaker_row.sprs_report_id for speaker_row in speaker_rows}
    return sorted(
        [
            PersonBillReportData(
                report_slug=get_report_slug(report.report_id),
                sitting_date=report.sitting_date.date(),
                parliament_number=report.parliament_number,
                role=visible_bill.sprs_report_id_to_role[report.report_id],
            )
            for report in visible_bill.reports
            if report.report_id in sprs_report_ids
        ],
        key=_get_person_bill_report_sort_key,
    )


def _get_person_bill_sort_key(person_bill: PersonBillData) -> tuple[int, str]:
    return (-person_bill.last_sitting_date.toordinal(), person_bill.bill_key)


def get_person_bills(
    person_id: int, page: int, page_size: int, session: Session
) -> GetPersonBillsResponse:
    person = _get_validated_person(person_id, session)
    membership_ids = [
        membership.id
        for membership in CRUDMembership(session).get_all_by_person_id(person.id)
    ]
    taken_down_report_ids = get_taken_down_report_ids(session)
    all_speaker_rows = CRUDBillReportSpeaker(
        session
    ).get_all_by_membership_ids_excluding_report_ids(
        membership_ids, taken_down_report_ids
    )
    bill_ids = sorted(
        {
            bill_report.bill_id
            for bill_report in CRUDBillReport(
                session
            ).get_all_by_sprs_report_ids_excluding_report_ids(
                sorted(
                    {speaker_row.sprs_report_id for speaker_row in all_speaker_rows}
                ),
                taken_down_report_ids,
            )
        }
    )
    bill_id_to_visible_bill = get_bill_id_to_visible_bill(
        bill_ids, taken_down_report_ids, session
    )
    speaker_rows = get_speaker_rows_without_chair_only_rows(
        all_speaker_rows, bill_id_to_visible_bill, session
    )
    membership_id_to_person = {
        membership_id: person for membership_id in membership_ids
    }
    sprs_report_id_to_bill_id = get_sprs_report_id_to_bill_id(bill_id_to_visible_bill)
    sprs_report_id_to_role = get_sprs_report_id_to_role(bill_id_to_visible_bill)
    bill_id_to_reading_rows = get_person_id_to_bill_id_to_speaker_rows(
        speaker_rows,
        membership_id_to_person,
        sprs_report_id_to_bill_id,
        sprs_report_id_to_role,
        BillReportRole.READING,
    ).get(person.id, {})
    bill_id_to_budget_debate_rows = get_person_id_to_bill_id_to_speaker_rows(
        speaker_rows,
        membership_id_to_person,
        sprs_report_id_to_bill_id,
        sprs_report_id_to_role,
        BillReportRole.BUDGET_DEBATE,
    ).get(person.id, {})
    person_bills = []
    for bill_id in (
        bill_id_to_reading_rows.keys() | bill_id_to_budget_debate_rows.keys()
    ):
        visible_bill = bill_id_to_visible_bill[bill_id]
        reading_rows = bill_id_to_reading_rows.get(bill_id, [])
        budget_debate_rows = bill_id_to_budget_debate_rows.get(bill_id, [])
        person_bills.append(
            PersonBillData(
                bill_key=visible_bill.bill_key,
                title=visible_bill.bill.title,
                first_sitting_date=visible_bill.bill.first_sitting_date.date(),
                last_sitting_date=visible_bill.bill.last_sitting_date.date(),
                is_passed=visible_bill.bill.is_passed,
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
                reading_report_count=len(
                    {speaker_row.sprs_report_id for speaker_row in reading_rows}
                ),
                budget_debate_report_count=len(
                    {speaker_row.sprs_report_id for speaker_row in budget_debate_rows}
                ),
                reports=_get_person_bill_reports(
                    reading_rows + budget_debate_rows, visible_bill
                ),
            )
        )
    sorted_person_bills = sorted(person_bills, key=_get_person_bill_sort_key)
    return GetPersonBillsResponse(
        bills=sorted_person_bills[(page - 1) * page_size : page * page_size],
        page=page,
        page_size=page_size,
        has_next_page=len(sorted_person_bills) > page * page_size,
        total_count=len(sorted_person_bills),
    )
