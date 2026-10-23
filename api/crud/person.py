from typing import Optional

from sqlalchemy import func
from sqlmodel import Session, select

from database.person import Person


class CRUDPerson:
    def __init__(self, session: Session):
        self.session = session

    def get(self, person_id: int) -> Optional[Person]:
        return self.session.get(Person, person_id)

    def get_all(self) -> list[Person]:
        return list(self.session.exec(select(Person)).all())

    def get_by_ids(self, person_ids: list[int]) -> list[Person]:
        statement = (
            select(Person)
            .where(Person.id.in_(person_ids))
            .order_by(Person.canonical_name)
        )
        return list(self.session.exec(statement).all())

    def get_count(self) -> int:
        statement = select(func.count()).select_from(Person)
        return self.session.exec(statement).one()
