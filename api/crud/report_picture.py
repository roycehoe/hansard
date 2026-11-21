from typing import Optional

from sqlalchemy.orm import defer
from sqlmodel import Session, col, select

from database.report_picture import ReportPicture


class CRUDReportPicture:
    def __init__(self, session: Session):
        self.session = session

    def get_all_by_report_id(self, report_id: int) -> list[ReportPicture]:
        statement = (
            select(ReportPicture)
            .options(defer(ReportPicture.picture_bytes))  # pyright: ignore[reportArgumentType]
            .where(ReportPicture.report_id == report_id)
            .order_by(col(ReportPicture.picture_index))
        )
        return list(self.session.exec(statement).all())

    def get_by_report_id_and_sha256(
        self, report_id: int, sha256: str
    ) -> Optional[ReportPicture]:
        statement = (
            select(ReportPicture)
            .where(ReportPicture.report_id == report_id)
            .where(ReportPicture.sha256 == sha256)
        )
        return self.session.exec(statement).first()
