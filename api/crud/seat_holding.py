from sqlalchemy import literal
from sqlmodel import Session, col, select

from crud.location_name import get_folded_location_name
from database.seat_holding import SeatHolding


class CRUDSeatHolding:
    def __init__(self, session: Session):
        self.session = session

    def get_all_by_division_key(self, location_name: str) -> list[SeatHolding]:
        statement = (
            select(SeatHolding)
            .where(
                SeatHolding.division_key
                == get_folded_location_name(literal(location_name))
            )
            .order_by(col(SeatHolding.first_sitting_date), col(SeatHolding.speaker_id))
        )
        return list(self.session.exec(statement).all())
