from sqlmodel import Session, col, select

from database.bill_report_speaker import BillReportSpeaker
from database.report import Report


class CRUDBillReportSpeaker:
    def __init__(self, session: Session):
        self.session = session

    def get_all_by_membership_ids_excluding_report_ids(
        self, membership_ids: list[int], excluded_report_ids: list[int]
    ) -> list[BillReportSpeaker]:
        statement = (
            select(BillReportSpeaker)
            .join(
                Report, col(Report.report_id) == col(BillReportSpeaker.sprs_report_id)
            )
            .where(col(BillReportSpeaker.speaker_id).in_(membership_ids))
            .where(col(Report.id).not_in(excluded_report_ids))
            .order_by(col(BillReportSpeaker.id))
        )
        return list(self.session.exec(statement).all())

    def get_all_by_sprs_report_ids_excluding_report_ids(
        self, sprs_report_ids: list[str], excluded_report_ids: list[int]
    ) -> list[BillReportSpeaker]:
        statement = (
            select(BillReportSpeaker)
            .join(
                Report, col(Report.report_id) == col(BillReportSpeaker.sprs_report_id)
            )
            .where(col(BillReportSpeaker.sprs_report_id).in_(sprs_report_ids))
            .where(col(Report.id).not_in(excluded_report_ids))
            .order_by(col(BillReportSpeaker.id))
        )
        return list(self.session.exec(statement).all())
