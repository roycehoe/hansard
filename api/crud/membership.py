from typing import Optional

from sqlalchemy import ColumnElement, func, literal
from sqlmodel import Session, select

from database.attendance import Attendance
from database.speaker import Speaker
from utils.like_pattern import escape_like_pattern

_LOCATION_NAME_SEPARATOR_PATTERN = r"[[:space:]-]+"
_LOCATION_NAME_SUFFIX_PATTERN = r"[[:space:]](GRC|SMC)$"
_REPLACE_ALL = "g"
_CASE_INSENSITIVE = "i"


def _get_folded_location_name(location_name: ColumnElement) -> ColumnElement:
    return func.lower(
        func.regexp_replace(
            func.btrim(
                func.regexp_replace(
                    location_name, _LOCATION_NAME_SEPARATOR_PATTERN, " ", _REPLACE_ALL
                )
            ),
            _LOCATION_NAME_SUFFIX_PATTERN,
            "",
            _CASE_INSENSITIVE,
        )
    )


class CRUDMembership:
    def __init__(self, session: Session):
        self.session = session

    def get_by_ids(self, membership_ids: list[int]) -> list[Speaker]:
        statement = select(Speaker).where(Speaker.id.in_(membership_ids))
        return list(self.session.exec(statement).all())

    def get_all(self) -> list[Speaker]:
        return list(self.session.exec(select(Speaker)).all())

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
            _get_folded_location_name(Attendance.location_name)
            == _get_folded_location_name(literal(location_name))
        )
        statement = select(Speaker).where(Speaker.id.in_(membership_ids_at_location))
        return list(self.session.exec(statement).all())

    def get_all_filtered(
        self,
        parliament_number: Optional[int],
        is_legislative_assembly: Optional[bool],
        party: Optional[str],
        person_ids: Optional[list[int]],
        location_name: Optional[str],
    ) -> list[Speaker]:
        filters = []
        if parliament_number is not None:
            filters.append(Speaker.parliament_number == parliament_number)
        if is_legislative_assembly is not None:
            filters.append(Speaker.is_legislative_assembly == is_legislative_assembly)
        if party is not None:
            filters.append(Speaker.party == party)
        if person_ids is not None:
            filters.append(Speaker.person_id.in_(person_ids))
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
