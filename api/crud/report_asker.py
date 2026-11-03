from sqlmodel import Session, col, select

from database.report_asker import ReportAsker


class CRUDReportAsker:
    def __init__(self, session: Session):
        self.session = session

    def get_all_by_report_id(self, report_id: int) -> list[ReportAsker]:
        statement = (
            select(ReportAsker)
            .where(ReportAsker.report_id == report_id)
            .order_by(col(ReportAsker.ordinal))
        )
        return list(self.session.exec(statement).all())
