from sqlmodel import Session

from crud.leave_period import CRUDLeavePeriod
from crud.leave_period_printing import CRUDLeavePeriodPrinting
from crud.membership import CRUDMembership
from crud.person import CRUDPerson
from database.leave_period_printing import LeavePeriodPrinting
from database.person import Person
from exceptions.person import PersonNotFoundException
from schemas.leave_period import (
    GetPersonLeavePeriodsResponse,
    LeavePrintingData,
    PersonLeavePeriodData,
)


def _get_validated_person(person_id: int, session: Session) -> Person:
    person = CRUDPerson(session).get(person_id)
    if person is None:
        raise PersonNotFoundException
    return person


def _get_leave_printing_data(printing: LeavePeriodPrinting) -> LeavePrintingData:
    return LeavePrintingData(
        sitting_date=printing.sitting_date,
        entry_format=printing.entry_format,
        name_source=printing.name_source,
        year_source=printing.year_source,
        printed_name=printing.printed_name,
        carried_name=printing.carried_name,
        printed_from=printing.printed_from,
        printed_to=printing.printed_to,
        printed_line=printing.printed_line,
        printed_heading_from=printing.printed_heading_from,
        printed_heading_to=printing.printed_heading_to,
        office_printed=printing.office_printed,
        office_source=printing.office_source,
        is_covering_sitting=printing.is_covering_sitting,
    )


def get_person_leave_periods(
    person_id: int, session: Session
) -> GetPersonLeavePeriodsResponse:
    person = _get_validated_person(person_id, session)
    membership_ids = [
        membership.id
        for membership in CRUDMembership(session).get_all_by_person_id(person.id)
    ]
    person_printings = CRUDLeavePeriodPrinting(session).get_all_by_membership_ids(
        membership_ids
    )
    leave_period_ids = sorted(
        {printing.leave_period_id for printing in person_printings}
    )
    leave_periods = CRUDLeavePeriod(session).get_by_ids(leave_period_ids)
    leave_period_id_to_printings: dict[int, list[LeavePrintingData]] = {
        leave_period_id: [] for leave_period_id in leave_period_ids
    }
    for printing in CRUDLeavePeriodPrinting(session).get_all_by_leave_period_ids(
        leave_period_ids
    ):
        leave_period_id_to_printings[printing.leave_period_id].append(
            _get_leave_printing_data(printing)
        )
    return GetPersonLeavePeriodsResponse(
        leave_periods=[
            PersonLeavePeriodData(
                name=leave_period.name,
                start_date=leave_period.start_date,
                end_date=leave_period.end_date,
                end_text=leave_period.end_text,
                printings=leave_period_id_to_printings[leave_period.id],
            )
            for leave_period in leave_periods
        ]
    )
