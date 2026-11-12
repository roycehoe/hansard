from sqlmodel import Session, col, select

from database.division_party_count import DivisionPartyCount


class CRUDDivisionPartyCount:
    def __init__(self, session: Session):
        self.session = session

    def get_all_by_division_id(self, division_id: int) -> list[DivisionPartyCount]:
        statement = (
            select(DivisionPartyCount)
            .where(DivisionPartyCount.division_id == division_id)
            .order_by(
                col(DivisionPartyCount.list_source),
                col(DivisionPartyCount.vote_choice),
                col(DivisionPartyCount.party),
                col(DivisionPartyCount.id),
            )
        )
        return list(self.session.exec(statement).all())
