from datetime import datetime
from typing import Any

import pytest
from sqlmodel import Session

from database.act import Act
from database.act_history_entry import ActHistoryEntry
from database.bill import Bill
from database.bill_key import BillKey
from database.bill_report import BillReport
from database.bill_report_speaker import BillReportSpeaker
from database.bill_stage_line import BillStageLine
from database.person import Person
from database.report import Report
from database.speaker import Speaker
from enums import ActHistoryEntryKind, BillReportRole, BillStage, ReportType
from exceptions.report import ReportTakenDownException
from middleware import bill as bill_middleware
from middleware import takedown
from services import act as act_service
from services import bill as bill_service

_BILL_ID = 1
_OTHER_BILL_ID = 2
_ACT_ID = 1
_SSO_CODE = "ITA1947"
_MEMBER_A_ID = 10
_MEMBER_B_ID = 20
_PERSON_A_ID = 1
_PERSON_B_ID = 2
_PAGE = 1
_PAGE_SIZE = 20
_BILL_REPORT_KEYS = ("r1", "r2", "r3", "r4")
_FIRST_READING_TEXT = "first reading printed text"
_SECOND_READING_TEXT = "second reading printed text"


def _build_report(row_id: int, report_key: str, sitting_date: datetime) -> Report:
    return Report(
        id=row_id,
        volume_number=1,
        parliament_number=1,
        sitting_date=sitting_date,
        speech_number=1,
        title=f"title of {report_key}",
        report_id=report_key + "#",
        report_type=ReportType.BILL,
        report_version="1",
    )


def _build_speaker_row(
    row_id: int, speaker_id: int, report_key: str, speech_count: int
) -> BillReportSpeaker:
    return BillReportSpeaker(
        id=row_id,
        speech_count=speech_count,
        printed_speaker="Mr Member",
        sprs_report_id=report_key + "#",
        speaker_id=speaker_id,
    )


class _World:
    def __init__(self, monkeypatch: pytest.MonkeyPatch):
        self.report_key_to_report = {
            "r1": _build_report(1, "r1", datetime(2020, 1, 1)),
            "r2": _build_report(2, "r2", datetime(2020, 2, 1)),
            "r3": _build_report(3, "r3", datetime(2020, 3, 1)),
            "r4": _build_report(4, "r4", datetime(2019, 12, 1)),
            "r5": _build_report(5, "r5", datetime(2020, 5, 1)),
        }
        self.bill_reports = [
            BillReport(
                id=1, role=BillReportRole.READING, bill_id=_BILL_ID, report_id=1
            ),
            BillReport(
                id=2, role=BillReportRole.READING, bill_id=_BILL_ID, report_id=2
            ),
            BillReport(
                id=3, role=BillReportRole.READING, bill_id=_BILL_ID, report_id=3
            ),
            BillReport(
                id=4,
                role=BillReportRole.BUDGET_DEBATE,
                bill_id=_BILL_ID,
                report_id=4,
            ),
            BillReport(
                id=5, role=BillReportRole.READING, bill_id=_OTHER_BILL_ID, report_id=5
            ),
        ]
        self.speaker_rows = [
            _build_speaker_row(1, _MEMBER_A_ID, "r1", 2),
            _build_speaker_row(2, _MEMBER_A_ID, "r5", 7),
            _build_speaker_row(3, _MEMBER_B_ID, "r2", 3),
            _build_speaker_row(4, _MEMBER_B_ID, "r4", 5),
        ]
        self.stage_lines = [
            BillStageLine(
                id=1,
                stage=BillStage.FIRST_READING,
                printed_text=_FIRST_READING_TEXT,
                ordinal=1,
                sprs_report_id="r1#",
            ),
            BillStageLine(
                id=2,
                stage=BillStage.SECOND_READING_ORDER,
                printed_text=_SECOND_READING_TEXT,
                ordinal=1,
                sprs_report_id="r2#",
            ),
        ]
        self.excluded_report_ids_passed: dict[str, list[int]] = {}
        self._monkeypatch = monkeypatch
        self._stub_reads()
        self.take_down()

    def take_down(self, *report_keys: str) -> None:
        taken_down_report_ids = [
            self.report_key_to_report[report_key].id for report_key in report_keys
        ]
        self._monkeypatch.setattr(
            takedown, "_TAKEN_DOWN_REPORT_SLUGS", list(report_keys)
        )
        self._monkeypatch.setattr(
            bill_service,
            "get_taken_down_report_ids",
            lambda session: taken_down_report_ids,
        )
        self._monkeypatch.setattr(
            act_service,
            "get_taken_down_report_ids",
            lambda session: taken_down_report_ids,
        )

    def _stub_reads(self) -> None:
        world = self

        def _get_report_by_row_id(row_id: int) -> Report:
            for report in world.report_key_to_report.values():
                if report.id == row_id:
                    return report
            raise AssertionError

        def _get_report_by_sprs_report_id(sprs_report_id: str) -> Report:
            return world.report_key_to_report[sprs_report_id.rstrip("#")]

        class _FakeReport:
            def __init__(self, session: Session):
                pass

            def get_by_report_id(self, report_id: str) -> Any:
                for report in world.report_key_to_report.values():
                    if report.report_id == report_id:
                        return report
                return None

            def get_by_ids(self, report_ids: list[int]) -> list[Report]:
                return [
                    report
                    for report in world.report_key_to_report.values()
                    if report.id in report_ids
                ]

        class _FakeBillKey:
            def __init__(self, session: Session):
                pass

            def get_all_by_bill_ids(self, bill_ids: list[int]) -> list[BillKey]:
                return [
                    BillKey(
                        id=bill_id,
                        act_count=1,
                        bill_key=("r1#" if bill_id == _BILL_ID else "r5#"),
                        bill_id=bill_id,
                    )
                    for bill_id in bill_ids
                ]

        class _FakeBill:
            def __init__(self, session: Session):
                pass

            def get_by_ids(self, bill_ids: list[int]) -> list[Bill]:
                return [
                    Bill(
                        id=bill_id,
                        title=f"bill {bill_id}",
                        first_sitting_date=datetime(2019, 12, 1),
                        last_sitting_date=datetime(2020, 3, 1),
                        is_passed=True,
                    )
                    for bill_id in bill_ids
                ]

        class _FakeBillReport:
            def __init__(self, session: Session):
                pass

            def get_by_report_id(self, report_id: int) -> Any:
                for bill_report in world.bill_reports:
                    if bill_report.report_id == report_id:
                        return bill_report
                return None

            def get_all_by_bill_ids_excluding_report_ids(
                self, bill_ids: list[int], excluded_report_ids: list[int]
            ) -> list[BillReport]:
                world.excluded_report_ids_passed["bill_report_by_bill_ids"] = (
                    excluded_report_ids
                )
                return [
                    bill_report
                    for bill_report in world.bill_reports
                    if bill_report.bill_id in bill_ids
                    and bill_report.report_id not in excluded_report_ids
                ]

            def get_all_by_sprs_report_ids_excluding_report_ids(
                self, sprs_report_ids: list[str], excluded_report_ids: list[int]
            ) -> list[BillReport]:
                world.excluded_report_ids_passed["bill_report_by_sprs_ids"] = (
                    excluded_report_ids
                )
                return [
                    bill_report
                    for bill_report in world.bill_reports
                    if _get_report_by_row_id(bill_report.report_id).report_id
                    in sprs_report_ids
                    and bill_report.report_id not in excluded_report_ids
                ]

        class _FakeBillReportSpeaker:
            def __init__(self, session: Session):
                pass

            def get_all_by_membership_ids_excluding_report_ids(
                self, membership_ids: list[int], excluded_report_ids: list[int]
            ) -> list[BillReportSpeaker]:
                world.excluded_report_ids_passed["speaker_row_by_membership_ids"] = (
                    excluded_report_ids
                )
                return [
                    speaker_row
                    for speaker_row in world.speaker_rows
                    if speaker_row.speaker_id in membership_ids
                    and _get_report_by_sprs_report_id(speaker_row.sprs_report_id).id
                    not in excluded_report_ids
                ]

            def get_all_by_sprs_report_ids_excluding_report_ids(
                self, sprs_report_ids: list[str], excluded_report_ids: list[int]
            ) -> list[BillReportSpeaker]:
                world.excluded_report_ids_passed["speaker_row_by_sprs_ids"] = (
                    excluded_report_ids
                )
                return [
                    speaker_row
                    for speaker_row in world.speaker_rows
                    if speaker_row.sprs_report_id in sprs_report_ids
                    and _get_report_by_sprs_report_id(speaker_row.sprs_report_id).id
                    not in excluded_report_ids
                ]

        class _FakeBillStageLine:
            def __init__(self, session: Session):
                pass

            def get_all_by_sprs_report_ids_excluding_report_ids(
                self, sprs_report_ids: list[str], excluded_report_ids: list[int]
            ) -> list[BillStageLine]:
                world.excluded_report_ids_passed["stage_line_by_sprs_ids"] = (
                    excluded_report_ids
                )
                return [
                    stage_line
                    for stage_line in world.stage_lines
                    if stage_line.sprs_report_id in sprs_report_ids
                    and _get_report_by_sprs_report_id(stage_line.sprs_report_id).id
                    not in excluded_report_ids
                ]

        class _FakeActHistoryEntry:
            def __init__(self, session: Session):
                pass

            def get_all_by_bill_id(self, bill_id: int) -> list[ActHistoryEntry]:
                return []

            def get_all_by_act_id(self, act_id: int) -> list[ActHistoryEntry]:
                return [
                    ActHistoryEntry(
                        id=1,
                        ordinal=1,
                        printed_law_number="1",
                        printed_title="Income Tax Act",
                        kind=ActHistoryEntryKind.ACT,
                        act_id=_ACT_ID,
                        bill_id=_BILL_ID,
                    )
                ]

        class _FakeAct:
            def __init__(self, session: Session):
                pass

            def get_by_ids(self, act_ids: list[int]) -> list[Act]:
                return []

            def get_by_sso_code(self, sso_code: str) -> Act:
                return Act(id=_ACT_ID, sso_code=_SSO_CODE, title="Income Tax Act")

        class _FakeSpeech:
            def __init__(self, session: Session):
                pass

            def get_all_by_report_ids_and_membership_ids_and_kind(
                self, report_ids: list[int], membership_ids: list[int], kind: Any
            ) -> list:
                return []

        class _FakePerson:
            def __init__(self, session: Session):
                pass

            def get(self, person_id: int) -> Person:
                return Person(id=person_id, canonical_name=f"Person {person_id}")

        class _FakeMembership:
            def __init__(self, session: Session):
                pass

            def get_all_by_person_id(self, person_id: int) -> list[Speaker]:
                membership_id = {
                    _PERSON_A_ID: _MEMBER_A_ID,
                    _PERSON_B_ID: _MEMBER_B_ID,
                }[person_id]
                return [Speaker(id=membership_id)]  # type: ignore[call-arg]

        def _get_membership_id_to_person(
            membership_ids: list[int], session: Session
        ) -> dict[int, Person]:
            membership_id_to_person_id = {
                _MEMBER_A_ID: _PERSON_A_ID,
                _MEMBER_B_ID: _PERSON_B_ID,
            }
            return {
                membership_id: Person(
                    id=membership_id_to_person_id[membership_id],
                    canonical_name=f"Person {membership_id_to_person_id[membership_id]}",
                )
                for membership_id in membership_ids
            }

        monkeypatch = self._monkeypatch
        for module in (bill_service, bill_middleware):
            monkeypatch.setattr(module, "CRUDReport", _FakeReport)
        monkeypatch.setattr(bill_middleware, "CRUDBillKey", _FakeBillKey)
        monkeypatch.setattr(bill_middleware, "CRUDBill", _FakeBill)
        monkeypatch.setattr(bill_middleware, "CRUDSpeech", _FakeSpeech)
        for module in (bill_service, bill_middleware):
            monkeypatch.setattr(module, "CRUDBillReport", _FakeBillReport)
        monkeypatch.setattr(
            bill_service, "CRUDBillReportSpeaker", _FakeBillReportSpeaker
        )
        monkeypatch.setattr(
            act_service, "CRUDBillReportSpeaker", _FakeBillReportSpeaker
        )
        monkeypatch.setattr(bill_service, "CRUDBillStageLine", _FakeBillStageLine)
        monkeypatch.setattr(bill_service, "CRUDActHistoryEntry", _FakeActHistoryEntry)
        monkeypatch.setattr(act_service, "CRUDActHistoryEntry", _FakeActHistoryEntry)
        monkeypatch.setattr(bill_service, "CRUDAct", _FakeAct)
        monkeypatch.setattr(act_service, "CRUDAct", _FakeAct)
        monkeypatch.setattr(bill_service, "CRUDPerson", _FakePerson)
        monkeypatch.setattr(bill_service, "CRUDMembership", _FakeMembership)
        monkeypatch.setattr(
            bill_service, "get_membership_id_to_person", _get_membership_id_to_person
        )

    def get_bill(self, report_key: str) -> Any:
        return bill_service.get_bill(report_key, Session())

    def get_person_bills(self, person_id: int) -> Any:
        return bill_service.get_person_bills(person_id, _PAGE, _PAGE_SIZE, Session())


@pytest.fixture
def world(monkeypatch: pytest.MonkeyPatch) -> _World:
    return _World(monkeypatch)


def test_a_visible_key_report_is_served_as_the_bill_key(world: _World) -> None:
    assert world.get_bill("r3").bill_key == "r1"


def test_a_taken_down_report_leaves_a_bills_reports(world: _World) -> None:
    world.take_down("r2")

    response = world.get_bill("r3")

    assert [report.report_slug for report in response.reports] == ["r4", "r1", "r3"]


def test_the_reads_of_a_bill_receive_the_taken_down_report_ids(
    world: _World,
) -> None:
    world.take_down("r2", "r4")

    world.get_bill("r3")

    assert world.excluded_report_ids_passed == {
        "bill_report_by_bill_ids": [2, 4],
        "speaker_row_by_sprs_ids": [2, 4],
        "stage_line_by_sprs_ids": [2, 4],
    }


def test_a_taken_down_report_leaves_its_stage_lines_out(world: _World) -> None:
    world.take_down("r1")

    response = world.get_bill("r2")

    printed_texts = [
        stage_line.printed_text
        for report in response.reports
        for stage_line in report.stage_lines
    ]
    assert printed_texts == [_SECOND_READING_TEXT]


def test_the_reads_of_a_persons_bills_receive_the_taken_down_report_ids(
    world: _World,
) -> None:
    world.take_down("r2", "r4")

    world.get_person_bills(_PERSON_B_ID)

    assert world.excluded_report_ids_passed["speaker_row_by_membership_ids"] == [2, 4]
    assert world.excluded_report_ids_passed["bill_report_by_sprs_ids"] == [2, 4]
    assert world.excluded_report_ids_passed["bill_report_by_bill_ids"] == [2, 4]


def test_a_stage_line_stays_while_its_report_is_visible(world: _World) -> None:
    printed_texts = [
        stage_line.printed_text
        for report in world.get_bill("r2").reports
        for stage_line in report.stage_lines
    ]

    assert sorted(printed_texts) == sorted([_FIRST_READING_TEXT, _SECOND_READING_TEXT])


def test_a_member_with_rows_only_in_a_taken_down_report_leaves_the_people(
    world: _World,
) -> None:
    world.take_down("r1")

    people = world.get_bill("r2").people

    assert [person.person_id for person in people] == [_PERSON_B_ID]


def _get_member_b(world: _World) -> Any:
    return [
        person
        for person in world.get_bill("r3").people
        if person.person_id == _PERSON_B_ID
    ][0]


def test_member_counts_leave_out_a_taken_down_report_and_keep_each_role_apart(
    world: _World,
) -> None:
    both_visible = _get_member_b(world)
    assert both_visible.reading_speech_count == 3
    assert both_visible.budget_debate_speech_count == 5

    world.take_down("r4")
    reading_only = _get_member_b(world)
    assert reading_only.reading_speech_count == 3
    assert reading_only.budget_debate_speech_count == 0

    world.take_down("r2")
    budget_only = _get_member_b(world)
    assert budget_only.reading_speech_count == 0
    assert budget_only.budget_debate_speech_count == 5


@pytest.mark.parametrize(
    "taken_down_report_keys, expected_bill_key",
    [
        ((), "r1"),
        (("r1",), "r2"),
        (("r1", "r2"), "r3"),
        (("r1", "r2", "r3"), "r4"),
    ],
)
def test_the_bill_key_moves_to_the_next_visible_reading_report(
    world: _World, taken_down_report_keys: tuple[str, ...], expected_bill_key: str
) -> None:
    world.take_down(*taken_down_report_keys)
    visible_report_key = [
        report_key
        for report_key in _BILL_REPORT_KEYS
        if report_key not in taken_down_report_keys
    ][-1]

    assert world.get_bill(visible_report_key).bill_key == expected_bill_key


@pytest.mark.parametrize("taken_down_report_key", _BILL_REPORT_KEYS)
def test_no_served_bill_key_is_the_slug_of_a_taken_down_report(
    world: _World, taken_down_report_key: str
) -> None:
    world.take_down(taken_down_report_key)
    visible_report_key = [
        report_key
        for report_key in _BILL_REPORT_KEYS
        if report_key != taken_down_report_key
    ][0]

    bill_key_from_bill = world.get_bill(visible_report_key).bill_key
    bill_keys_from_person_bills = [
        person_bill.bill_key
        for person_bill in world.get_person_bills(_PERSON_B_ID).bills
    ]
    bill_keys_from_act = [
        entry.bill.bill_key
        for entry in act_service.get_act(_SSO_CODE, Session()).entries
        if entry.bill is not None
    ]

    assert bill_key_from_bill != taken_down_report_key
    assert bill_keys_from_person_bills == [bill_key_from_bill]
    assert bill_keys_from_act == [bill_key_from_bill]


def test_a_bill_with_every_report_taken_down_is_absent(world: _World) -> None:
    world.take_down(*_BILL_REPORT_KEYS)

    assert (
        bill_middleware.get_bill_id_to_visible_bill([_BILL_ID], [1, 2, 3, 4], Session())
        == {}
    )
    assert world.get_person_bills(_PERSON_B_ID).total_count == 0
    act_entries = act_service.get_act(_SSO_CODE, Session()).entries
    assert [entry.bill for entry in act_entries] == [None]
    assert [entry.bill_link_source for entry in act_entries] == [None]


def test_a_taken_down_slug_raises_the_report_taken_down_error(world: _World) -> None:
    world.take_down("r2")

    with pytest.raises(ReportTakenDownException):
        world.get_bill("r2")


def test_person_bills_count_only_bills_with_a_visible_member_row(
    world: _World,
) -> None:
    assert world.get_person_bills(_PERSON_A_ID).total_count == 2

    world.take_down("r5")
    assert world.get_person_bills(_PERSON_A_ID).total_count == 1

    world.take_down("r1", "r5")
    person_bills = world.get_person_bills(_PERSON_A_ID)
    assert person_bills.total_count == 0
    assert person_bills.bills == []
