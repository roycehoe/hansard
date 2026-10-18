from sqlmodel import Session, select

from database.party_affiliation import PartyAffiliation


class CRUDPartyAffiliation:
    def __init__(self, session: Session):
        self.session = session

    def get_all_by_membership_ids(
        self, membership_ids: list[int]
    ) -> list[PartyAffiliation]:
        statement = (
            select(PartyAffiliation)
            .where(PartyAffiliation.speaker_id.in_(membership_ids))
            .order_by(PartyAffiliation.speaker_id, PartyAffiliation.started_on)
        )
        return list(self.session.exec(statement).all())
