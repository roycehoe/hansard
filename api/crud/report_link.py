from sqlmodel import Session, col, select

from database.report_link import ReportLink
from enums import ReportLinkType


class CRUDReportLink:
    def __init__(self, session: Session):
        self.session = session

    def get_all_by_source_report_id(self, report_id: str) -> list[ReportLink]:
        statement = (
            select(ReportLink)
            .where(ReportLink.source_report_id == report_id)
            .order_by(col(ReportLink.id))
        )
        return list(self.session.exec(statement).all())

    def get_all_by_target_report_id_and_link_type(
        self, report_id: str, link_type: ReportLinkType
    ) -> list[ReportLink]:
        statement = (
            select(ReportLink)
            .where(ReportLink.target_report_id == report_id)
            .where(ReportLink.link_type == link_type)
            .order_by(col(ReportLink.id))
        )
        return list(self.session.exec(statement).all())
