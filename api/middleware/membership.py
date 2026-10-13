from sqlmodel import Session

from crud.membership import CRUDMembership
from crud.person import CRUDPerson
from database.person import Person


def get_membership_id_to_person(
    membership_ids: list[int], session: Session
) -> dict[int, Person]:
    memberships = CRUDMembership(session).get_by_ids(membership_ids)
    person_ids = [
        membership.person_id
        for membership in memberships
        if membership.person_id is not None
    ]
    person_id_to_person = {
        person.id: person for person in CRUDPerson(session).get_by_ids(person_ids)
    }
    return {
        membership.id: person_id_to_person[membership.person_id]
        for membership in memberships
        if membership.person_id in person_id_to_person
    }
