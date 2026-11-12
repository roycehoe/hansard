from sqlmodel import Session, col, select

from database.bill_stage_line import BillStageLine
from database.report import Report


class CRUDBillStageLine:
    def __init__(self, session: Session):
        self.session = session

    def get_all_by_sprs_report_ids_excluding_report_ids(
        self, sprs_report_ids: list[str], excluded_report_ids: list[int]
    ) -> list[BillStageLine]:
        statement = (
            select(BillStageLine)
            .join(Report, col(Report.report_id) == col(BillStageLine.sprs_report_id))
            .where(col(BillStageLine.sprs_report_id).in_(sprs_report_ids))
            .where(col(Report.id).not_in(excluded_report_ids))
            .order_by(
                col(BillStageLine.sprs_report_id),
                col(BillStageLine.ordinal),
                col(BillStageLine.stage),
            )
        )
        return list(self.session.exec(statement).all())
