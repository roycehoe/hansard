from sqlalchemy import func
from sqlmodel import Session, col, select

from database.office_title_ministry import OfficeTitleMinistry
from database.report_participant import ReportParticipant
from enums import ParticipantRole


class CRUDReportParticipant:
    def __init__(self, session: Session):
        self.session = session

    def get_all_by_report_id_and_role(
        self, report_id: int, role: ParticipantRole
    ) -> list[ReportParticipant]:
        statement = (
            select(ReportParticipant)
            .where(ReportParticipant.report_id == report_id)
            .where(ReportParticipant.role == role)
            .order_by(col(ReportParticipant.ordinal))
        )
        return list(self.session.exec(statement).all())

    def get_all_by_report_ids_and_role(
        self, report_ids: list[int], role: ParticipantRole
    ) -> list[ReportParticipant]:
        statement = (
            select(ReportParticipant)
            .where(col(ReportParticipant.report_id).in_(report_ids))
            .where(ReportParticipant.role == role)
            .order_by(col(ReportParticipant.report_id), col(ReportParticipant.ordinal))
        )
        return list(self.session.exec(statement).all())

    def get_ministry_id_to_report_count_by_role_excluding_report_ids(
        self, role: ParticipantRole, excluded_report_ids: list[int]
    ) -> dict[int, int]:
        statement = (
            select(
                col(OfficeTitleMinistry.ministry_id),
                func.count(func.distinct(ReportParticipant.report_id)),
            )
            .select_from(ReportParticipant)
            .join(
                OfficeTitleMinistry,
                col(OfficeTitleMinistry.office_printed)
                == col(ReportParticipant.office_printed),
            )
            .where(ReportParticipant.role == role)
            .where(col(ReportParticipant.report_id).not_in(excluded_report_ids))
            .group_by(col(OfficeTitleMinistry.ministry_id))
        )
        rows = self.session.exec(statement).all()
        return {ministry_id: report_count for ministry_id, report_count in rows}
