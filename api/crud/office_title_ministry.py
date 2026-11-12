from sqlalchemy import func
from sqlmodel import Session, col, select

from database.office_title_ministry import OfficeTitleMinistry


class CRUDOfficeTitleMinistry:
    def __init__(self, session: Session):
        self.session = session

    def get_all_by_ministry_id(self, ministry_id: int) -> list[OfficeTitleMinistry]:
        statement = (
            select(OfficeTitleMinistry)
            .where(OfficeTitleMinistry.ministry_id == ministry_id)
            .order_by(col(OfficeTitleMinistry.office_printed))
        )
        return list(self.session.exec(statement).all())

    def get_all_by_office_printeds(
        self, office_printeds: list[str]
    ) -> list[OfficeTitleMinistry]:
        statement = (
            select(OfficeTitleMinistry)
            .where(col(OfficeTitleMinistry.office_printed).in_(office_printeds))
            .order_by(
                col(OfficeTitleMinistry.office_printed),
                col(OfficeTitleMinistry.ordinal),
            )
        )
        return list(self.session.exec(statement).all())

    def get_ministry_id_to_office_title_count(self) -> dict[int, int]:
        statement = select(col(OfficeTitleMinistry.ministry_id), func.count()).group_by(
            col(OfficeTitleMinistry.ministry_id)
        )
        rows = self.session.exec(statement).all()
        return {
            ministry_id: office_title_count for ministry_id, office_title_count in rows
        }
