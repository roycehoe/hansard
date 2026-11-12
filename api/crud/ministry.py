from typing import Optional

from sqlmodel import Session, select

from database.ministry import Ministry


class CRUDMinistry:
    def __init__(self, session: Session):
        self.session = session

    def get(self, ministry_id: int) -> Optional[Ministry]:
        return self.session.get(Ministry, ministry_id)

    def get_by_ids(self, ministry_ids: list[int]) -> list[Ministry]:
        statement = select(Ministry).where(Ministry.id.in_(ministry_ids))
        return list(self.session.exec(statement).all())

    def get_all(self) -> list[Ministry]:
        statement = select(Ministry).order_by(Ministry.name, Ministry.id)
        return list(self.session.exec(statement).all())
