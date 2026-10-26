from typing import Optional

from sqlalchemy import func, literal
from sqlmodel import Session, col, select

from crud.location_name import get_folded_location_name
from database.attendance import Attendance
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

    def get_all_by_location_name(self, location_name: str) -> list[Speaker]:
        membership_ids_at_location = select(Attendance.speaker_id).where(
            get_folded_location_name(Attendance.location_name)
            == get_folded_location_name(literal(location_name))
        )
        statement = select(Speaker).where(Speaker.id.in_(membership_ids_at_location))
        return list(self.session.exec(statement).all())

    def get_all_filtered(
        self,
        parliament_number: Optional[int],
        is_legislative_assembly: Optional[bool],
        party: Optional[str],
        location_name: Optional[str],
    ) -> list[Speaker]:
        filters = []
        if parliament_number is not None:
            filters.append(Speaker.parliament_number == parliament_number)
        if is_legislative_assembly is not None:
            filters.append(Speaker.is_legislative_assembly == is_legislative_assembly)
        if party is not None:
            filters.append(Speaker.party == party)
        if location_name is not None:
            membership_ids_at_location = select(Attendance.speaker_id).where(
                Attendance.location_name.ilike(
                    f"%{escape_like_pattern(location_name)}%", escape="\\"
                )
            )
            filters.append(Speaker.id.in_(membership_ids_at_location))
        statement = select(Speaker).where(*filters)
        return list(self.session.exec(statement).all())

    def get_all_parties(self) -> list[str]:
        statement = select(Speaker.party).distinct().order_by(Speaker.party)
        return list(self.session.exec(statement).all())

    def get_count(self) -> int:
        statement = select(func.count()).select_from(Speaker)
        return self.session.exec(statement).one()

    def get_non_member_count(self) -> int:
        statement = (
            select(func.count())
            .select_from(Speaker)
            .where(col(Speaker.is_member).is_(False))
        )
        return self.session.exec(statement).one()

    def get_never_member_person_count(self) -> int:
        member_person_ids = select(Speaker.person_id).where(
            col(Speaker.is_member).is_(True), col(Speaker.person_id).is_not(None)
        )
        statement = select(func.count(func.distinct(Speaker.person_id))).where(
            col(Speaker.is_member).is_(False),
            col(Speaker.person_id).not_in(member_person_ids),
        )
        return self.session.exec(statement).one()
