from typing import Optional

from sqlmodel import Session

from crud.attendance import CRUDAttendance
from crud.membership import CRUDMembership
from crud.party_affiliation import CRUDPartyAffiliation
from crud.person import CRUDPerson
from crud.person_name_spelling import CRUDPersonNameSpelling
from crud.report import CRUDReport
from crud.report_asker import CRUDReportAsker
from crud.speech import CRUDSpeech
from database.person import Person
from database.report import Report
from database.speaker import Speaker
from enums import PersonReportFilter
from exceptions.person import PersonNotFoundException
from middleware.takedown import get_taken_down_report_ids, is_report_id_taken_down
from schemas.person import (
    GetAllPartiesResponse,
    GetAllPersonsResponse,
    GetPersonReportsResponse,
    GetPersonResponse,
    MembershipData,
    ParliamentCountData,
    PartyAffiliationData,
    PartyAffiliationSourceReportData,
    PersonData,
    PersonMembershipData,
    PersonNameSpellingData,
    PersonReportData,
)
from utils.person_slug import get_person_slug
from utils.report_slug import get_report_slug

_LEGISLATIVE_ASSEMBLY_PARLIAMENT_NUMBER = 0
_NAME_SUFFIX_SEPARATOR = ","


def _get_validated_person(person_id: int, session: Session) -> Person:
    person = CRUDPerson(session).get(person_id)
    if person is None:
        raise PersonNotFoundException
    return person


def _get_person_sort_key(person: Person) -> tuple[str, int]:
    return (person.canonical_name.casefold(), person.id)


def _get_source_report_data(
    source_report_id: Optional[int], report_id_to_report: dict[int, Report]
) -> Optional[PartyAffiliationSourceReportData]:
    if source_report_id is None:
        return None
    if source_report_id not in report_id_to_report:
        return None
    source_report = report_id_to_report[source_report_id]
    return PartyAffiliationSourceReportData(
        report_slug=get_report_slug(source_report.report_id),
        sitting_date=source_report.sitting_date.date(),
    )


def _get_membership_id_to_party_affiliations(
    membership_ids: list[int], session: Session
) -> dict[int, list[PartyAffiliationData]]:
    party_affiliations = CRUDPartyAffiliation(session).get_all_by_membership_ids(
        membership_ids
    )
    source_report_ids = [
        party_affiliation.source_report_id
        for party_affiliation in party_affiliations
        if party_affiliation.source_report_id is not None
    ]
    report_id_to_report = {
        report.id: report
        for report in CRUDReport(session).get_by_ids(source_report_ids)
        if not is_report_id_taken_down(report.report_id)
    }
    membership_id_to_party_affiliations: dict[int, list[PartyAffiliationData]] = {}
    for party_affiliation in party_affiliations:
        membership_id_to_party_affiliations.setdefault(
            party_affiliation.speaker_id, []
        ).append(
            PartyAffiliationData(
                party=party_affiliation.party,
                started_on=party_affiliation.started_on,
                started_on_precision=party_affiliation.started_on_precision,
                is_started_on_upper_bound=party_affiliation.is_started_on_upper_bound,
                event=party_affiliation.event,
                source_url=party_affiliation.source_url,
                source_report=_get_source_report_data(
                    party_affiliation.source_report_id, report_id_to_report
                ),
            )
        )
    return membership_id_to_party_affiliations


def _get_person_id_to_name_spellings(
    person_ids: list[int], session: Session
) -> dict[int, list[PersonNameSpellingData]]:
    person_id_to_name_spellings: dict[int, list[PersonNameSpellingData]] = {}
    for person_name_spelling in CRUDPersonNameSpelling(session).get_all_by_person_ids(
        person_ids
    ):
        person_id_to_name_spellings.setdefault(
            person_name_spelling.person_id, []
        ).append(
            PersonNameSpellingData(
                spelling=person_name_spelling.spelling,
                kind=person_name_spelling.kind,
                note=person_name_spelling.note,
            )
        )
    return person_id_to_name_spellings


def _get_name_variants(
    memberships: list[Speaker],
    canonical_name: str,
    name_spellings: list[PersonNameSpellingData],
) -> list[str]:
    spellings = {name_spelling.spelling for name_spelling in name_spellings}
    return sorted(
        {
            membership.name
            for membership in memberships
            if membership.name != canonical_name
            and membership.name.split(_NAME_SUFFIX_SEPARATOR)[0] not in spellings
        }
    )


def _get_matching_memberships(
    parliament_number: Optional[int],
    party: Optional[str],
    constituency: Optional[str],
    session: Session,
) -> list[Speaker]:
    if parliament_number == _LEGISLATIVE_ASSEMBLY_PARLIAMENT_NUMBER:
        return CRUDMembership(session).get_all_filtered(None, True, party, constituency)
    return CRUDMembership(session).get_all_filtered(
        parliament_number, None, party, constituency
    )


def _get_parliament_number_to_speech_count(
    membership_ids: list[int], session: Session
) -> dict[int, int]:
    report_id_to_speech_count = CRUDSpeech(
        session
    ).get_report_id_to_speech_count_by_membership_ids(membership_ids)
    report_id_to_parliament_number = CRUDReport(
        session
    ).get_id_to_parliament_number_by_ids(list(report_id_to_speech_count))
    parliament_number_to_speech_count: dict[int, int] = {}
    for report_id, parliament_number in report_id_to_parliament_number.items():
        parliament_number_to_speech_count[parliament_number] = (
            parliament_number_to_speech_count.get(parliament_number, 0)
            + report_id_to_speech_count[report_id]
        )
    return parliament_number_to_speech_count


def _get_parliament_number_to_questions_asked_count(
    membership_ids: list[int], session: Session
) -> dict[int, int]:
    report_ids = CRUDReportAsker(session).get_all_report_ids_by_membership_ids(
        membership_ids
    )
    report_id_to_parliament_number = CRUDReport(
        session
    ).get_id_to_parliament_number_by_ids(report_ids)
    parliament_number_to_questions_asked_count: dict[int, int] = {}
    for parliament_number in report_id_to_parliament_number.values():
        parliament_number_to_questions_asked_count[parliament_number] = (
            parliament_number_to_questions_asked_count.get(parliament_number, 0) + 1
        )
    return parliament_number_to_questions_asked_count


def get_all_persons(
    parliament_number: Optional[int],
    party: Optional[str],
    constituency: Optional[str],
    session: Session,
) -> GetAllPersonsResponse:
    matching_memberships = _get_matching_memberships(
        parliament_number, party, constituency, session
    )
    person_ids = sorted(
        {
            membership.person_id
            for membership in matching_memberships
            if membership.person_id is not None
        }
    )
    # NOTE: sorted here, not by the database, because its collation skips spaces and punctuation, which put "Abdullah Bin Tarmugi" before "Abdul Muhaimin Abdul Malik" and "A.J. Braga" among the names that start "Ah"
    persons = sorted(
        CRUDPerson(session).get_by_ids(person_ids), key=_get_person_sort_key
    )
    memberships = CRUDMembership(session).get_all_by_person_ids(person_ids)
    membership_ids = [membership.id for membership in memberships]
    membership_id_to_party_affiliations = _get_membership_id_to_party_affiliations(
        membership_ids, session
    )
    membership_id_to_location_names = CRUDAttendance(
        session
    ).get_membership_id_to_location_names_by_membership_ids(membership_ids)
    person_id_to_name_spellings = _get_person_id_to_name_spellings(person_ids, session)
    person_id_to_memberships: dict[int, list[Speaker]] = {}
    for membership in memberships:
        person_id_to_memberships.setdefault(membership.person_id, []).append(membership)
    return GetAllPersonsResponse(
        persons=[
            PersonData(
                person_id=person.id,
                person_slug=get_person_slug(person.canonical_name),
                canonical_name=person.canonical_name,
                name_variants=_get_name_variants(
                    person_id_to_memberships.get(person.id, []),
                    person.canonical_name,
                    person_id_to_name_spellings.get(person.id, []),
                ),
                name_spellings=person_id_to_name_spellings.get(person.id, []),
                memberships=[
                    MembershipData(
                        parliament_number=membership.parliament_number,
                        party=membership.party,
                        party_affiliations=membership_id_to_party_affiliations.get(
                            membership.id, []
                        ),
                        is_legislative_assembly=membership.is_legislative_assembly,
                        is_member=membership.is_member,
                        constituencies=membership_id_to_location_names.get(
                            membership.id, []
                        ),
                    )
                    for membership in person_id_to_memberships.get(person.id, [])
                ],
            )
            for person in persons
        ]
    )


def get_person(person_id: int, session: Session) -> GetPersonResponse:
    person = _get_validated_person(person_id, session)
    memberships = CRUDMembership(session).get_all_by_person_id(person_id)
    membership_ids = [membership.id for membership in memberships]
    membership_id_to_party_affiliations = _get_membership_id_to_party_affiliations(
        membership_ids, session
    )
    membership_id_to_location_names = CRUDAttendance(
        session
    ).get_membership_id_to_location_names_by_membership_ids(membership_ids)
    parliament_number_to_speech_count = _get_parliament_number_to_speech_count(
        membership_ids, session
    )
    parliament_number_to_questions_asked_count = (
        _get_parliament_number_to_questions_asked_count(membership_ids, session)
    )
    parliament_number_to_present_count = CRUDAttendance(
        session
    ).get_parliament_number_to_count_by_membership_ids_and_is_present(
        membership_ids, True
    )
    parliament_number_to_absent_count = CRUDAttendance(
        session
    ).get_parliament_number_to_count_by_membership_ids_and_is_present(
        membership_ids, False
    )
    parliament_numbers = sorted(
        set(parliament_number_to_speech_count)
        | set(parliament_number_to_questions_asked_count)
        | set(parliament_number_to_present_count)
        | set(parliament_number_to_absent_count)
    )
    name_spellings = _get_person_id_to_name_spellings([person_id], session).get(
        person_id, []
    )
    return GetPersonResponse(
        person_id=person.id,
        person_slug=get_person_slug(person.canonical_name),
        canonical_name=person.canonical_name,
        name_variants=_get_name_variants(
            memberships, person.canonical_name, name_spellings
        ),
        name_spellings=name_spellings,
        memberships=[
            PersonMembershipData(
                parliament_number=membership.parliament_number,
                party=membership.party,
                party_affiliations=membership_id_to_party_affiliations.get(
                    membership.id, []
                ),
                is_legislative_assembly=membership.is_legislative_assembly,
                is_member=membership.is_member,
                constituencies=membership_id_to_location_names.get(membership.id, []),
            )
            for membership in memberships
        ],
        parliament_counts=[
            ParliamentCountData(
                parliament_number=parliament_number,
                speech_count=parliament_number_to_speech_count.get(
                    parliament_number, 0
                ),
                questions_asked_count=parliament_number_to_questions_asked_count.get(
                    parliament_number, 0
                ),
                present_count=parliament_number_to_present_count.get(
                    parliament_number, 0
                ),
                absent_count=parliament_number_to_absent_count.get(
                    parliament_number, 0
                ),
            )
            for parliament_number in parliament_numbers
        ],
    )


def get_person_reports(
    person_id: int,
    page: int,
    page_size: int,
    report_filter: Optional[PersonReportFilter],
    session: Session,
) -> GetPersonReportsResponse:
    person = _get_validated_person(person_id, session)
    membership_ids = [
        membership.id
        for membership in CRUDMembership(session).get_all_by_person_id(person.id)
    ]
    report_id_to_speech_count = CRUDSpeech(
        session
    ).get_report_id_to_speech_count_by_membership_ids(membership_ids)
    taken_down_report_ids = get_taken_down_report_ids(session)
    visible_report_ids = set(report_id_to_speech_count).difference(
        taken_down_report_ids
    )
    asked_report_ids = set(
        CRUDReportAsker(session).get_all_report_ids_by_membership_ids(membership_ids)
    ).difference(taken_down_report_ids)
    listed_report_ids = (
        asked_report_ids
        if report_filter == PersonReportFilter.ASKED
        else visible_report_ids
    )
    report_ids = CRUDReport(session).get_all_ids_by_ids(
        list(listed_report_ids),
        limit=page_size + 1,
        offset=(page - 1) * page_size,
    )
    page_report_ids = report_ids[:page_size]
    report_id_to_report = {
        report.id: report for report in CRUDReport(session).get_by_ids(page_report_ids)
    }
    return GetPersonReportsResponse(
        reports=[
            PersonReportData(
                report_slug=get_report_slug(report_id_to_report[report_id].report_id),
                title=report_id_to_report[report_id].title,
                subtitle=report_id_to_report[report_id].subtitle or "",
                report_type=report_id_to_report[report_id].report_type,
                sitting_date=report_id_to_report[report_id].sitting_date.date(),
                parliament_number=report_id_to_report[report_id].parliament_number,
                speech_count=report_id_to_speech_count.get(report_id, 0),
            )
            for report_id in page_report_ids
        ],
        page=page,
        page_size=page_size,
        has_next_page=len(report_ids) > page_size,
        total_count=len(visible_report_ids),
        questions_asked_count=len(asked_report_ids),
    )


def get_all_parties(session: Session) -> GetAllPartiesResponse:
    return GetAllPartiesResponse(parties=CRUDMembership(session).get_all_parties())
