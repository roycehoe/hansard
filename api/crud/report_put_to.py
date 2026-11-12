from sqlalchemy import func
from sqlmodel import Session, select

from database.office_title_ministry import OfficeTitleMinistry
from database.report_put_to import ReportPutTo


class CRUDReportPutTo:
    def __init__(self, session: Session):
        self.session = session

    def get_all_by_sprs_report_id(self, sprs_report_id: str) -> list[ReportPutTo]:
        statement = (
            select(ReportPutTo)
            .where(ReportPutTo.sprs_report_id == sprs_report_id)
            .order_by(ReportPutTo.ordinal)
        )
        return list(self.session.exec(statement).all())

    def get_all_by_sprs_report_ids(
        self, sprs_report_ids: list[str]
    ) -> list[ReportPutTo]:
        statement = (
            select(ReportPutTo)
            .where(ReportPutTo.sprs_report_id.in_(sprs_report_ids))
            .order_by(ReportPutTo.sprs_report_id, ReportPutTo.ordinal)
        )
        return list(self.session.exec(statement).all())

    def get_ministry_id_to_report_count_excluding_sprs_report_ids(
        self, excluded_sprs_report_ids: list[str]
    ) -> dict[int, int]:
        statement = (
            select(
                OfficeTitleMinistry.ministry_id,
                func.count(func.distinct(ReportPutTo.sprs_report_id)),
            )
            .select_from(ReportPutTo)
            .join(
                OfficeTitleMinistry,
                OfficeTitleMinistry.office_printed == ReportPutTo.office_printed,
            )
            .where(ReportPutTo.sprs_report_id.not_in(excluded_sprs_report_ids))
            .group_by(OfficeTitleMinistry.ministry_id)
        )
        rows = self.session.exec(statement).all()
        return {ministry_id: report_count for ministry_id, report_count in rows}
