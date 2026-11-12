from datetime import datetime

from sqlmodel import Session

from crud.attendance_office import CRUDAttendanceOffice
from crud.membership import CRUDMembership
from crud.ministry import CRUDMinistry
from crud.ministry_see_also import CRUDMinistrySeeAlso
from crud.office_printed_range import CRUDOfficePrintedRange
from crud.office_title_ministry import CRUDOfficeTitleMinistry
from crud.report import CRUDReport
from crud.report_participant import CRUDReportParticipant
from crud.report_put_to import CRUDReportPutTo
from database.attendance_office import AttendanceOffice
from database.ministry import Ministry
from database.report import Report
from database.report_participant import ReportParticipant
from database.report_put_to import ReportPutTo
from database.speaker import Speaker
from enums import MinistryQuestionRelation, ParticipantRole
from exceptions.office import (
    OfficeMembershipNotFoundException,
    OfficeMinistryNotFoundException,
)
from exceptions.report import ReportNotFoundException, ReportTakenDownException
from middleware.takedown import (
    get_taken_down_report_id_candidates,
    get_taken_down_report_ids,
    is_report_id_taken_down,
)
from schemas.office import (
    AnsweredByData,
    GetAllMinistriesResponse,
    GetMembershipPrintedRangesResponse,
    GetMinistryQuestionsResponse,
    GetMinistryResponse,
    GetReportOfficesResponse,
    MinistryQuestionData,
    MinistryReferenceData,
    MinistrySeeAlsoData,
    MinistrySummaryData,
    MinistryTitleData,
    PrintedRangeData,
    PrintEvidenceData,
    PutToData,
)
from utils.report_slug import get_report_id_candidates, get_report_slug


def _get_validated_report(report_slug: str, session: Session) -> Report:
    for report_id in get_report_id_candidates(report_slug):
        report = CRUDReport(session).get_by_report_id(report_id)
        if report is None:
            continue
        if is_report_id_taken_down(report.report_id):
            raise ReportTakenDownException
        return report
    raise ReportNotFoundException


def _get_validated_ministry(ministry_id: int, session: Session) -> Ministry:
    ministry = CRUDMinistry(session).get(ministry_id)
    if ministry is None:
        raise OfficeMinistryNotFoundException
    return ministry


def _get_validated_membership(membership_id: int, session: Session) -> Speaker:
    memberships = CRUDMembership(session).get_by_ids([membership_id])
    if len(memberships) == 0:
        raise OfficeMembershipNotFoundException
    return memberships[0]


def _get_office_printed_to_ministries(
    put_tos: list[ReportPutTo],
    participants: list[ReportParticipant],
    session: Session,
) -> dict[str, list[MinistryReferenceData]]:
    office_printeds = {put_to.office_printed for put_to in put_tos} | {
        participant.office_printed
        for participant in participants
        if participant.office_printed is not None
    }
    office_title_ministries = CRUDOfficeTitleMinistry(
        session
    ).get_all_by_office_printeds(list(office_printeds))
    ministry_id_to_ministry = {
        ministry.id: ministry
        for ministry in CRUDMinistry(session).get_by_ids(
            [
                office_title_ministry.ministry_id
                for office_title_ministry in office_title_ministries
            ]
        )
    }
    office_printed_to_ministries: dict[str, list[MinistryReferenceData]] = {}
    for office_title_ministry in office_title_ministries:
        office_printed_to_ministries.setdefault(
            office_title_ministry.office_printed, []
        ).append(
            MinistryReferenceData(
                id=office_title_ministry.ministry_id,
                name=ministry_id_to_ministry[office_title_ministry.ministry_id].name,
            )
        )
    return office_printed_to_ministries


def _get_put_to_data(
    put_tos: list[ReportPutTo],
    office_printed_to_ministries: dict[str, list[MinistryReferenceData]],
) -> list[PutToData]:
    return [
        PutToData(
            ordinal=put_to.ordinal,
            office_printed=put_to.office_printed,
            printed_text=put_to.printed_text,
            ministries=office_printed_to_ministries.get(put_to.office_printed, []),
        )
        for put_to in put_tos
    ]


def _get_answered_by_data(
    participants: list[ReportParticipant],
    office_printed_to_ministries: dict[str, list[MinistryReferenceData]],
) -> list[AnsweredByData]:
    return [
        AnsweredByData(
            ordinal=participant.ordinal,
            printed_name=participant.printed_name,
            membership_id=participant.speaker_id,
            office_printed=participant.office_printed or "",
            office_class=participant.office_class,
            answering_for_printed=participant.answering_for_printed or "",
            ministries=office_printed_to_ministries.get(
                participant.office_printed or "", []
            ),
        )
        for participant in participants
    ]


def _get_ministry_reports(
    ministry_id: int,
    relation: MinistryQuestionRelation,
    excluded_report_ids: list[int],
    limit: int,
    offset: int,
    session: Session,
) -> list[Report]:
    if relation == MinistryQuestionRelation.PUT_TO:
        return CRUDReport(
            session
        ).get_all_by_report_put_to_ministry_id_excluding_report_ids(
            ministry_id, excluded_report_ids, limit, offset
        )
    return CRUDReport(
        session
    ).get_all_by_report_participant_role_and_ministry_id_excluding_report_ids(
        ParticipantRole.ANSWERER, ministry_id, excluded_report_ids, limit, offset
    )


def _get_ministry_report_count(
    ministry_id: int,
    relation: MinistryQuestionRelation,
    excluded_report_ids: list[int],
    session: Session,
) -> int:
    if relation == MinistryQuestionRelation.PUT_TO:
        return CRUDReport(
            session
        ).get_count_by_report_put_to_ministry_id_excluding_report_ids(
            ministry_id, excluded_report_ids
        )
    return CRUDReport(
        session
    ).get_count_by_report_participant_role_and_ministry_id_excluding_report_ids(
        ParticipantRole.ANSWERER, ministry_id, excluded_report_ids
    )


def _get_print_evidence_data(
    sitting_date: datetime, attendance_office: AttendanceOffice
) -> PrintEvidenceData:
    return PrintEvidenceData(
        sitting_date=sitting_date.date(),
        entry_line_printed=attendance_office.entry_line_printed,
        source=attendance_office.source,
        extracted_at=attendance_office.extracted_at,
    )


def get_all_ministries(session: Session) -> GetAllMinistriesResponse:
    ministry_id_to_office_title_count = CRUDOfficeTitleMinistry(
        session
    ).get_ministry_id_to_office_title_count()
    ministry_id_to_put_to_report_count = CRUDReportPutTo(
        session
    ).get_ministry_id_to_report_count_excluding_sprs_report_ids(
        get_taken_down_report_id_candidates()
    )
    ministry_id_to_answered_by_report_count = CRUDReportParticipant(
        session
    ).get_ministry_id_to_report_count_by_role_excluding_report_ids(
        ParticipantRole.ANSWERER, get_taken_down_report_ids(session)
    )
    return GetAllMinistriesResponse(
        ministries=[
            MinistrySummaryData(
                id=ministry.id,
                name=ministry.name,
                title_count=ministry_id_to_office_title_count.get(ministry.id, 0),
                put_to_report_count=ministry_id_to_put_to_report_count.get(
                    ministry.id, 0
                ),
                answered_by_report_count=ministry_id_to_answered_by_report_count.get(
                    ministry.id, 0
                ),
            )
            for ministry in CRUDMinistry(session).get_all()
        ]
    )


def get_ministry(ministry_id: int, session: Session) -> GetMinistryResponse:
    ministry = _get_validated_ministry(ministry_id, session)
    ministry_see_alsos = CRUDMinistrySeeAlso(session).get_all_by_ministry_id(
        ministry.id
    )
    see_also_ministry_id_to_ministry = {
        see_also_ministry.id: see_also_ministry
        for see_also_ministry in CRUDMinistry(session).get_by_ids(
            [
                ministry_see_also.see_also_ministry_id
                for ministry_see_also in ministry_see_alsos
            ]
        )
    }
    return GetMinistryResponse(
        id=ministry.id,
        name=ministry.name,
        titles=[
            MinistryTitleData(
                office_printed=office_title_ministry.office_printed,
                source=office_title_ministry.source,
            )
            for office_title_ministry in CRUDOfficeTitleMinistry(
                session
            ).get_all_by_ministry_id(ministry.id)
        ],
        see_also=[
            MinistrySeeAlsoData(
                ministry_id=ministry_see_also.see_also_ministry_id,
                name=see_also_ministry_id_to_ministry[
                    ministry_see_also.see_also_ministry_id
                ].name,
                note=ministry_see_also.note,
                source_url=ministry_see_also.source_url,
            )
            for ministry_see_also in ministry_see_alsos
        ],
    )


def get_ministry_questions(
    ministry_id: int,
    relation: MinistryQuestionRelation,
    page: int,
    page_size: int,
    session: Session,
) -> GetMinistryQuestionsResponse:
    ministry = _get_validated_ministry(ministry_id, session)
    excluded_report_ids = get_taken_down_report_ids(session)
    reports = _get_ministry_reports(
        ministry.id,
        relation,
        excluded_report_ids,
        page_size,
        (page - 1) * page_size,
        session,
    )
    put_tos = CRUDReportPutTo(session).get_all_by_sprs_report_ids(
        [report.report_id for report in reports]
    )
    participants = CRUDReportParticipant(session).get_all_by_report_ids_and_role(
        [report.id for report in reports], ParticipantRole.ANSWERER
    )
    office_printed_to_ministries = _get_office_printed_to_ministries(
        put_tos, participants, session
    )
    sprs_report_id_to_put_tos: dict[str, list[ReportPutTo]] = {}
    for put_to in put_tos:
        sprs_report_id_to_put_tos.setdefault(put_to.sprs_report_id, []).append(put_to)
    report_id_to_participants: dict[int, list[ReportParticipant]] = {}
    for participant in participants:
        report_id_to_participants.setdefault(participant.report_id, []).append(
            participant
        )
    return GetMinistryQuestionsResponse(
        total_count=_get_ministry_report_count(
            ministry.id, relation, excluded_report_ids, session
        ),
        questions=[
            MinistryQuestionData(
                report_slug=get_report_slug(report.report_id),
                title=report.title,
                sitting_date=report.sitting_date.date(),
                report_type=report.report_type,
                put_to=_get_put_to_data(
                    sprs_report_id_to_put_tos.get(report.report_id, []),
                    office_printed_to_ministries,
                ),
                answered_by=_get_answered_by_data(
                    report_id_to_participants.get(report.id, []),
                    office_printed_to_ministries,
                ),
            )
            for report in reports
        ],
    )


def get_membership_printed_ranges(
    membership_id: int, session: Session
) -> GetMembershipPrintedRangesResponse:
    membership = _get_validated_membership(membership_id, session)
    printed_ranges = CRUDOfficePrintedRange(session).get_all_by_membership_id(
        membership.id
    )
    attendance_office_id_to_attendance_office = {
        attendance_office.id: attendance_office
        for attendance_office in CRUDAttendanceOffice(session).get_by_ids(
            [
                attendance_office_id
                for printed_range in printed_ranges
                for attendance_office_id in (
                    printed_range.first_attendance_office_id,
                    printed_range.last_attendance_office_id,
                )
            ]
        )
    }
    return GetMembershipPrintedRangesResponse(
        membership_id=membership.id,
        ranges=[
            PrintedRangeData(
                office_printed=printed_range.office_printed,
                office_class=printed_range.office_class,
                sitting_count=printed_range.sitting_count,
                first_print=_get_print_evidence_data(
                    printed_range.first_sitting_date,
                    attendance_office_id_to_attendance_office[
                        printed_range.first_attendance_office_id
                    ],
                ),
                last_print=_get_print_evidence_data(
                    printed_range.last_sitting_date,
                    attendance_office_id_to_attendance_office[
                        printed_range.last_attendance_office_id
                    ],
                ),
            )
            for printed_range in printed_ranges
        ],
    )


def get_report_offices(report_slug: str, session: Session) -> GetReportOfficesResponse:
    report = _get_validated_report(report_slug, session)
    put_tos = CRUDReportPutTo(session).get_all_by_sprs_report_id(report.report_id)
    participants = CRUDReportParticipant(session).get_all_by_report_id_and_role(
        report.id, ParticipantRole.ANSWERER
    )
    office_printed_to_ministries = _get_office_printed_to_ministries(
        put_tos, participants, session
    )
    return GetReportOfficesResponse(
        put_to=_get_put_to_data(put_tos, office_printed_to_ministries),
        answered_by=_get_answered_by_data(participants, office_printed_to_ministries),
    )
