from typing import Optional

from sqlmodel import Session, col, select

from database.bill_report import BillReport
from database.report import Report


class CRUDBillReport:
    def __init__(self, session: Session):
        self.session = session

    def get_by_report_id(self, report_id: int) -> Optional[BillReport]:
        statement = (
            select(BillReport)
            .where(BillReport.report_id == report_id)
            .order_by(col(BillReport.id))
        )
        return self.session.exec(statement).first()

    def get_all_by_bill_ids_excluding_report_ids(
        self, bill_ids: list[int], excluded_report_ids: list[int]
    ) -> list[BillReport]:
        statement = (
            select(BillReport)
            .where(col(BillReport.bill_id).in_(bill_ids))
            .where(col(BillReport.report_id).not_in(excluded_report_ids))
            .order_by(col(BillReport.bill_id), col(BillReport.id))
        )
        return list(self.session.exec(statement).all())

    def get_all_by_sprs_report_ids_excluding_report_ids(
        self, sprs_report_ids: list[str], excluded_report_ids: list[int]
    ) -> list[BillReport]:
        statement = (
            select(BillReport)
            .join(Report, col(Report.id) == col(BillReport.report_id))
            .where(col(Report.report_id).in_(sprs_report_ids))
            .where(col(Report.id).not_in(excluded_report_ids))
            .order_by(col(BillReport.bill_id), col(BillReport.id))
        )
        return list(self.session.exec(statement).all())
