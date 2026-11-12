from sqlmodel import Session, col, select

from database.ministry_see_also import MinistrySeeAlso


class CRUDMinistrySeeAlso:
    def __init__(self, session: Session):
        self.session = session

    def get_all_by_ministry_id(self, ministry_id: int) -> list[MinistrySeeAlso]:
        statement = (
            select(MinistrySeeAlso)
            .where(MinistrySeeAlso.ministry_id == ministry_id)
            .order_by(col(MinistrySeeAlso.see_also_ministry_id))
        )
        return list(self.session.exec(statement).all())
