from dataclasses import dataclass
from datetime import datetime
from typing import Optional

from sqlmodel import Session

from crud.bill import CRUDBill
from crud.bill_key import CRUDBillKey
from crud.bill_report import CRUDBillReport
from crud.report import CRUDReport
from crud.speech import CRUDSpeech
from database.bill import Bill
from database.bill_report_speaker import BillReportSpeaker
from database.person import Person
from database.report import Report
from enums import BillReportRole, SpeechKind
from utils.report_slug import get_report_slug
from utils.speaker_label import is_chair_speaker_label, is_every_speaker_label_chair


@dataclass(frozen=True)
class VisibleBill:
    bill: Bill
    bill_key: str
    act_count: int
    reports: list[Report]
    sprs_report_id_to_role: dict[str, BillReportRole]


def _get_report_sort_key(report: Report) -> tuple[datetime, str]:
    return (report.sitting_date, report.report_id)


def _get_bill_key(
    key_report_id: str,
    reports: list[Report],
    sprs_report_id_to_role: dict[str, BillReportRole],
) -> str:
    for report in reports:
        if report.report_id == key_report_id:
            return get_report_slug(key_report_id)
    for report in reports:
        if sprs_report_id_to_role[report.report_id] == BillReportRole.READING:
            return get_report_slug(report.report_id)
    return get_report_slug(reports[0].report_id)


def get_bill_id_to_visible_bill(
    bill_ids: list[int], excluded_report_ids: list[int], session: Session
) -> dict[int, VisibleBill]:
    bill_id_to_bill_key = {
        bill_key.bill_id: bill_key
        for bill_key in CRUDBillKey(session).get_all_by_bill_ids(bill_ids)
    }
    bill_reports = CRUDBillReport(session).get_all_by_bill_ids_excluding_report_ids(
        bill_ids, excluded_report_ids
    )
    report_id_to_report = {
        report.id: report
        for report in CRUDReport(session).get_by_ids(
            [bill_report.report_id for bill_report in bill_reports]
        )
    }
    bill_id_to_reports: dict[int, list[Report]] = {}
    bill_id_to_sprs_report_id_to_role: dict[int, dict[str, BillReportRole]] = {}
    for bill_report in bill_reports:
        report = report_id_to_report[bill_report.report_id]
        bill_id_to_reports.setdefault(bill_report.bill_id, []).append(report)
        bill_id_to_sprs_report_id_to_role.setdefault(bill_report.bill_id, {})[
            report.report_id
        ] = bill_report.role
    bill_id_to_visible_bill: dict[int, VisibleBill] = {}
    for bill in CRUDBill(session).get_by_ids(bill_ids):
        bill_key = bill_id_to_bill_key.get(bill.id)
        if bill_key is None:
            continue
        reports = bill_id_to_reports.get(bill.id)
        if reports is None:
            continue
        sorted_reports = sorted(reports, key=_get_report_sort_key)
        sprs_report_id_to_role = bill_id_to_sprs_report_id_to_role[bill.id]
        bill_id_to_visible_bill[bill.id] = VisibleBill(
            bill=bill,
            bill_key=_get_bill_key(
                bill_key.bill_key, sorted_reports, sprs_report_id_to_role
            ),
            act_count=bill_key.act_count,
            reports=sorted_reports,
            sprs_report_id_to_role=sprs_report_id_to_role,
        )
    return bill_id_to_visible_bill


def get_sprs_report_id_to_bill_id(
    bill_id_to_visible_bill: dict[int, VisibleBill],
) -> dict[str, int]:
    return {
        report.report_id: bill_id
        for bill_id, visible_bill in bill_id_to_visible_bill.items()
        for report in visible_bill.reports
    }


def get_sprs_report_id_to_role(
    bill_id_to_visible_bill: dict[int, VisibleBill],
) -> dict[str, BillReportRole]:
    return {
        sprs_report_id: role
        for visible_bill in bill_id_to_visible_bill.values()
        for sprs_report_id, role in visible_bill.sprs_report_id_to_role.items()
    }


def get_speaker_rows_without_chair_only_rows(
    speaker_rows: list[BillReportSpeaker],
    bill_id_to_visible_bill: dict[int, VisibleBill],
    session: Session,
) -> list[BillReportSpeaker]:
    sprs_report_id_to_report_id = {
        report.report_id: report.id
        for visible_bill in bill_id_to_visible_bill.values()
        for report in visible_bill.reports
    }
    chair_rows = [
        speaker_row
        for speaker_row in speaker_rows
        if speaker_row.sprs_report_id in sprs_report_id_to_report_id
        and is_chair_speaker_label(speaker_row.printed_speaker)
    ]
    speeches = CRUDSpeech(session).get_all_by_report_ids_and_membership_ids_and_kind(
        sorted(
            {
                sprs_report_id_to_report_id[chair_row.sprs_report_id]
                for chair_row in chair_rows
            }
        ),
        sorted({chair_row.speaker_id for chair_row in chair_rows}),
        SpeechKind.SPEECH,
    )
    report_id_and_speaker_id_to_speaker_labels: dict[
        tuple[Optional[int], Optional[int]], list[Optional[str]]
    ] = {}
    for speech in speeches:
        report_id_and_speaker_id_to_speaker_labels.setdefault(
            (speech.report_id, speech.speaker_id), []
        ).append(speech.speaker)
    chair_only_row_ids = {
        chair_row.id
        for chair_row in chair_rows
        if is_every_speaker_label_chair(
            report_id_and_speaker_id_to_speaker_labels.get(
                (
                    sprs_report_id_to_report_id[chair_row.sprs_report_id],
                    chair_row.speaker_id,
                ),
                [],
            )
        )
    }
    return [
        speaker_row
        for speaker_row in speaker_rows
        if speaker_row.id not in chair_only_row_ids
    ]


def get_person_id_to_bill_id_to_speaker_rows(
    speaker_rows: list[BillReportSpeaker],
    membership_id_to_person: dict[int, Person],
    sprs_report_id_to_bill_id: dict[str, int],
    sprs_report_id_to_role: dict[str, BillReportRole],
    role: BillReportRole,
) -> dict[int, dict[int, list[BillReportSpeaker]]]:
    person_id_to_bill_id_to_speaker_rows: dict[
        int, dict[int, list[BillReportSpeaker]]
    ] = {}
    for speaker_row in speaker_rows:
        person = membership_id_to_person.get(speaker_row.speaker_id)
        if person is None:
            continue
        bill_id = sprs_report_id_to_bill_id.get(speaker_row.sprs_report_id)
        if bill_id is None:
            continue
        if sprs_report_id_to_role[speaker_row.sprs_report_id] != role:
            continue
        person_id_to_bill_id_to_speaker_rows.setdefault(person.id, {}).setdefault(
            bill_id, []
        ).append(speaker_row)
    return person_id_to_bill_id_to_speaker_rows
