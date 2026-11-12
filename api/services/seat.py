from sqlmodel import Session

from crud.membership import CRUDMembership
from crud.seat_holding import CRUDSeatHolding
from exceptions.seat import SeatConstituencyNotFoundException
from middleware.membership import get_membership_id_to_person
from schemas.seat import GetSeatHistoryResponse, SeatHolderData


def get_seat_history(constituency: str, session: Session) -> GetSeatHistoryResponse:
    seat_holdings = CRUDSeatHolding(session).get_all_by_division_key(constituency)
    if not seat_holdings:
        raise SeatConstituencyNotFoundException
    membership_ids = [seat_holding.speaker_id for seat_holding in seat_holdings]
    membership_id_to_membership = {
        membership.id: membership
        for membership in CRUDMembership(session).get_by_ids(membership_ids)
    }
    membership_id_to_person = get_membership_id_to_person(membership_ids, session)
    holders = []
    for seat_holding in seat_holdings:
        membership = membership_id_to_membership[seat_holding.speaker_id]
        person = membership_id_to_person.get(seat_holding.speaker_id)
        holders.append(
            SeatHolderData(
                person_id=None if person is None else person.id,
                person_name=None if person is None else person.canonical_name,
                parliament_number=membership.parliament_number,
                party=membership.party,
                location_name=seat_holding.location_name,
                first_sitting_date=seat_holding.first_sitting_date,
                last_sitting_date=seat_holding.last_sitting_date,
                sitting_count=seat_holding.sitting_count,
            )
        )
    return GetSeatHistoryResponse(
        constituency=seat_holdings[-1].location_name, holders=holders
    )
