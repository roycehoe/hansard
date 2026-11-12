from datetime import datetime
from typing import Any

import pytest
from sqlmodel import Session

from database.bill import Bill
from database.bill_report import BillReport
from database.bill_report_speaker import BillReportSpeaker
from database.person import Person
from database.report import Report
from database.speaker import Speaker
from database.speech import Speech
from enums import BillReportRole
from middleware import bill as bill_middleware
from middleware.bill import VisibleBill
from services import bill as bill_service

_PERSON_ID = 7
_MEMBERSHIP_ID = 70
_BILL_ID = 1
_REPORT_ID = 100
_SPRS_REPORT_ID = "REPORT-1#"
_PARLIAMENT_NUMBER = 14
_CHAIR_LABEL = "Mr Speaker"
_OWN_LABEL = "Mr Seah Kian Peng"
_PAGE = 1
_PAGE_SIZE = 20


class _FakePerson:
    def __init__(self, session: Session):
        pass

    def get(self, person_id: int) -> Person:
        return Person(id=_PERSON_ID, canonical_name="Seah Kian Peng")


class _FakeMembership:
    def __init__(self, session: Session):
        pass

    def get_all_by_person_id(self, person_id: int) -> list[Speaker]:
        return [Speaker(id=_MEMBERSHIP_ID)]  # type: ignore[call-arg]


class _FakeBillReportSpeaker:
    def __init__(self, session: Session):
        pass

    def get_all_by_membership_ids_excluding_report_ids(
        self, membership_ids: list[int], excluded_report_ids: list[int]
    ) -> list[BillReportSpeaker]:
        return [
            BillReportSpeaker(
                id=1,
                speech_count=2,
                printed_speaker=_CHAIR_LABEL,
                sprs_report_id=_SPRS_REPORT_ID,
                speaker_id=_MEMBERSHIP_ID,
            )
        ]


class _FakeBillReport:
    def __init__(self, session: Session):
        pass

    def get_all_by_sprs_report_ids_excluding_report_ids(
        self, sprs_report_ids: list[str], excluded_report_ids: list[int]
    ) -> list[BillReport]:
        return [
            BillReport(
                id=1,
                role=BillReportRole.READING,
                bill_id=_BILL_ID,
                report_id=_REPORT_ID,
            )
        ]


def _get_fake_speech_class(speaker_labels: list[str]) -> type:
    class _FakeSpeech:
        def __init__(self, session: Session):
            pass

        def get_all_by_report_ids_and_membership_ids_and_kind(
            self, report_ids: list[int], membership_ids: list[int], kind: Any
        ) -> list[Speech]:
            return [
                Speech(  # type: ignore[call-arg]
                    id=ordinal,
                    ordinal=ordinal,
                    speaker=speaker_label,
                    report_id=_REPORT_ID,
                    speaker_id=_MEMBERSHIP_ID,
                )
                for ordinal, speaker_label in enumerate(speaker_labels)
            ]

    return _FakeSpeech


def _get_visible_bills(
    bill_ids: list[int], excluded_report_ids: list[int], session: Session
) -> dict[int, VisibleBill]:
    return {
        _BILL_ID: VisibleBill(
            bill=Bill(
                id=_BILL_ID,
                title="Income Tax (Amendment) Bill",
                first_sitting_date=datetime(2020, 1, 1),
                last_sitting_date=datetime(2020, 1, 1),
                is_passed=True,
            ),
            bill_key="REPORT-1",
            act_count=0,
            reports=[
                Report(  # type: ignore[call-arg]
                    id=_REPORT_ID,
                    report_id=_SPRS_REPORT_ID,
                    sitting_date=datetime(2020, 1, 1),
                    parliament_number=_PARLIAMENT_NUMBER,
                )
            ],
            sprs_report_id_to_role={_SPRS_REPORT_ID: BillReportRole.READING},
        )
    }


def _stub_person_bills_reads(
    monkeypatch: pytest.MonkeyPatch, speaker_labels: list[str]
) -> None:
    monkeypatch.setattr(bill_service, "CRUDPerson", _FakePerson)
    monkeypatch.setattr(bill_service, "CRUDMembership", _FakeMembership)
    monkeypatch.setattr(bill_service, "CRUDBillReportSpeaker", _FakeBillReportSpeaker)
    monkeypatch.setattr(bill_service, "CRUDBillReport", _FakeBillReport)
    monkeypatch.setattr(bill_service, "get_taken_down_report_ids", lambda session: [])
    monkeypatch.setattr(bill_service, "get_bill_id_to_visible_bill", _get_visible_bills)
    monkeypatch.setattr(
        bill_middleware, "CRUDSpeech", _get_fake_speech_class(speaker_labels)
    )


def test_a_member_row_of_only_chair_labels_gives_no_bill(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    _stub_person_bills_reads(monkeypatch, [_CHAIR_LABEL, _CHAIR_LABEL])

    response = bill_service.get_person_bills(_PERSON_ID, _PAGE, _PAGE_SIZE, Session())

    assert response.bills == []
    assert response.total_count == 0


def test_a_member_row_that_also_speaks_under_its_own_label_gives_the_bill(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    _stub_person_bills_reads(monkeypatch, [_CHAIR_LABEL, _OWN_LABEL])

    response = bill_service.get_person_bills(_PERSON_ID, _PAGE, _PAGE_SIZE, Session())

    assert response.total_count == 1
    assert response.bills[0].printed_speakers == [_CHAIR_LABEL]
    assert response.bills[0].reading_speech_count == 2
