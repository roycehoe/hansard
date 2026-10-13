from typing import Optional

from sqlalchemy import func
from sqlmodel import Session, select

from database.speaker import Speaker
from utils.like_pattern import escape_like_pattern


class CRUDMembership:
    def __init__(self, session: Session):
        self.session = session

    def get_by_ids(self, membership_ids: list[int]) -> list[Speaker]:
        statement = select(Speaker).where(Speaker.id.in_(membership_ids))
        return list(self.session.exec(statement).all())

    def get_all_by_person_id(self, person_id: int) -> list[Speaker]:
        statement = (
            select(Speaker)
            .where(Speaker.person_id == person_id)
            .order_by(Speaker.parliament_number)
        )
        return list(self.session.exec(statement).all())

    def get_all_by_person_ids(self, person_ids: list[int]) -> list[Speaker]:
        statement = (
            select(Speaker)
            .where(Speaker.person_id.in_(person_ids))
            .order_by(Speaker.person_id, Speaker.parliament_number)
        )
        return list(self.session.exec(statement).all())

    def get_all_filtered(
        self,
        parliament_number: Optional[int],
        is_legislative_assembly: Optional[bool],
        party: Optional[str],
        name: Optional[str],
    ) -> list[Speaker]:
        filters = []
        if parliament_number is not None:
            filters.append(Speaker.parliament_number == parliament_number)
        if is_legislative_assembly is not None:
            filters.append(Speaker.is_legislative_assembly == is_legislative_assembly)
        if party is not None:
            filters.append(Speaker.party == party)
        if name is not None:
            filters.append(
                Speaker.name.ilike(f"%{escape_like_pattern(name)}%", escape="\\")
            )
        statement = select(Speaker).where(*filters)
        return list(self.session.exec(statement).all())

    def get_all_parties(self) -> list[str]:
        statement = select(Speaker.party).distinct().order_by(Speaker.party)
        return list(self.session.exec(statement).all())

    def get_count(self) -> int:
        statement = select(func.count()).select_from(Speaker)
        return self.session.exec(statement).one()
