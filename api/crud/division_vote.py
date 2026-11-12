from sqlmodel import Session, col, select

from database.division_vote import DivisionVote


class CRUDDivisionVote:
    def __init__(self, session: Session):
        self.session = session

    def get_all_by_division_id(self, division_id: int) -> list[DivisionVote]:
        statement = (
            select(DivisionVote)
            .where(DivisionVote.division_id == division_id)
            .order_by(col(DivisionVote.list_source), col(DivisionVote.ordinal))
        )
        return list(self.session.exec(statement).all())
