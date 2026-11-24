import re
from dataclasses import dataclass
from typing import Optional

from sqlmodel import Session

from crud.bill_report import CRUDBillReport
from crud.bill_report_speaker import CRUDBillReportSpeaker
from crud.bill_stage_line import CRUDBillStageLine
from crud.speech import CRUDSpeech
from database.bill_stage_line import BillStageLine
from database.report import Report
from enums import BillReportPart, BillReportRole, BillStage
from middleware.bill import VisibleBill, get_bill_id_to_visible_bill
from middleware.membership import get_membership_id_to_person
from middleware.takedown import get_taken_down_report_ids
from utils.bill_opening_line import is_resumed_second_reading_line
from utils.speaker_label import CHAIR_SPEAKER_LABEL_PATTERN, is_chair_speaker_label

_BILL_WORD = re.compile(r"\bbill\b", re.IGNORECASE)
_EMPTY_LABEL = ""
_MIN_RESUMED_READING_REPORT_COUNT = 2


@dataclass(frozen=True)
class ReportBill:
    visible_bill: VisibleBill
    reading_reports: list[Report]
    sprs_report_id_to_stage_lines: dict[str, list[BillStageLine]]


def get_report_bill(report: Report, session: Session) -> Optional[ReportBill]:
    bill_report = CRUDBillReport(session).get_by_report_id(report.id)
    if bill_report is None:
        return None
    taken_down_report_ids = get_taken_down_report_ids(session)
    visible_bill = get_bill_id_to_visible_bill(
        [bill_report.bill_id], taken_down_report_ids, session
    ).get(bill_report.bill_id)
    if (
        visible_bill is None
        or visible_bill.sprs_report_id_to_role[report.report_id]
        != BillReportRole.READING
    ):
        return None
    reading_reports = [
        visible_report
        for visible_report in visible_bill.reports
        if visible_bill.sprs_report_id_to_role[visible_report.report_id]
        == BillReportRole.READING
    ]
    sprs_report_id_to_stage_lines: dict[str, list[BillStageLine]] = {}
    for stage_line in CRUDBillStageLine(
        session
    ).get_all_by_sprs_report_ids_excluding_report_ids(
        [reading_report.report_id for reading_report in reading_reports],
        taken_down_report_ids,
    ):
        sprs_report_id_to_stage_lines.setdefault(stage_line.sprs_report_id, []).append(
            stage_line
        )
    return ReportBill(
        visible_bill=visible_bill,
        reading_reports=reading_reports,
        sprs_report_id_to_stage_lines=sprs_report_id_to_stage_lines,
    )


# NOTE: the Bill's mover is the first Member outside the chair in the part that carries the second reading order, else in its earliest part
def _get_mover_report(report_bill: ReportBill) -> Report:
    for reading_report in report_bill.reading_reports:
        if any(
            stage_line.stage == BillStage.SECOND_READING_ORDER
            for stage_line in report_bill.sprs_report_id_to_stage_lines.get(
                reading_report.report_id, []
            )
        ):
            return reading_report
    return report_bill.reading_reports[0]


# NOTE: order within one sitting is not reliable, so only a part with a strictly earlier sitting date counts as earlier
def _is_ministers_reply(
    report: Report, report_bill: ReportBill, session: Session
) -> bool:
    earlier_reports = [
        reading_report
        for reading_report in report_bill.reading_reports
        if reading_report.sitting_date.date() < report.sitting_date.date()
    ]
    if not earlier_reports:
        return False
    mover_report = _get_mover_report(report_bill)
    report_id_to_first_speaker_id = {
        speech.report_id: speech.speaker_id
        for speech in CRUDSpeech(
            session
        ).get_all_first_by_report_ids_excluding_speaker_pattern(
            [report.id, mover_report.id], CHAIR_SPEAKER_LABEL_PATTERN
        )
    }
    first_speaker_id = report_id_to_first_speaker_id.get(report.id)
    mover_speaker_id = report_id_to_first_speaker_id.get(mover_report.id)
    if first_speaker_id is None or mover_speaker_id is None:
        return False
    earlier_speaker_rows = [
        speaker_row
        for speaker_row in CRUDBillReportSpeaker(
            session
        ).get_all_by_sprs_report_ids_excluding_report_ids(
            [earlier_report.report_id for earlier_report in earlier_reports], []
        )
        if not is_chair_speaker_label(speaker_row.printed_speaker)
    ]
    membership_id_to_person = get_membership_id_to_person(
        [
            first_speaker_id,
            mover_speaker_id,
            *[speaker_row.speaker_id for speaker_row in earlier_speaker_rows],
        ],
        session,
    )
    first_person = membership_id_to_person.get(first_speaker_id)
    mover_person = membership_id_to_person.get(mover_speaker_id)
    if first_person is None or mover_person is None:
        return False
    if first_person.id != mover_person.id:
        return False
    return any(
        speaker_person is not None and speaker_person.id != mover_person.id
        for speaker_person in [
            membership_id_to_person.get(speaker_row.speaker_id)
            for speaker_row in earlier_speaker_rows
        ]
    )


def get_report_bill_part(
    report: Report, report_bill: ReportBill, session: Session
) -> Optional[BillReportPart]:
    if _BILL_WORD.search(report.title) is None:
        return None
    stages = {
        stage_line.stage
        for stage_line in report_bill.sprs_report_id_to_stage_lines.get(
            report.report_id, []
        )
    }
    if BillStage.SECOND_READING_AGREED in stages and BillStage.THIRD_READING in stages:
        return BillReportPart.SECOND_AND_THIRD_READING
    if BillStage.THIRD_READING in stages:
        return None
    if BillStage.SECOND_READING_ORDER in stages:
        return None
    if len(report_bill.reading_reports) < _MIN_RESUMED_READING_REPORT_COUNT:
        return None
    first_speech = CRUDSpeech(session).get_first_by_report_id(report.id)
    if (
        first_speech is None
        or (first_speech.speaker is not None and first_speech.speaker != _EMPTY_LABEL)
        or not is_resumed_second_reading_line(first_speech.transcript)
    ):
        return None
    if not stages and _is_ministers_reply(report, report_bill, session):
        return BillReportPart.MINISTERS_REPLY
    return BillReportPart.SECOND_READING_DEBATE_RESUMED
