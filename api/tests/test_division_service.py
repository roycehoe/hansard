from datetime import date, datetime
from typing import Any, Optional

import pytest
from sqlmodel import Session

from database.division import Division
from database.division_party_count import DivisionPartyCount
from database.division_vote import DivisionVote
from database.minutes import Minutes
from database.minutes_division import MinutesDivision
from database.report import Report
from enums import (
    DivisionCountSource,
    DivisionListStatus,
    DivisionVoteChoice,
    DivisionVoteListSource,
    MinutesDivisionPairing,
    MinutesStatus,
    ReportType,
)
from exceptions.division import DivisionNotFoundException
from exceptions.report import ReportTakenDownException
from middleware import takedown
from schemas.division import GetAllDivisionsResponse, GetDivisionResponse
from schemas.minutes import GetAllMinutesResponse
from services import division as division_service

_PRINTED_COUNTS = "Division taken: Ayes, 77; No, 1; Abstention, Nil."
_PRINTED_LIST = "Ayes\nMr A\nNoes\nMr B"
_PRINTED_NAME = "Mr  Unlinked  Name"
_MINUTES_ONLY_DIVISION_ID = 3
_TAKEN_DOWN_DIVISION_ID = 2
_VISIBLE_DIVISION_ID = 1
_TAKEN_DOWN_REPORT_ROW_ID = 22
_UNKNOWN_DIVISION_ID = 99


def _build_report(row_id: int, report_key: str) -> Report:
    return Report(
        id=row_id,
        volume_number=1,
        parliament_number=1,
        sitting_date=datetime(2020, 1, 1),
        speech_number=1,
        title=f"title of {report_key}",
        report_id=report_key + "#",
        report_type=ReportType.MOTION,
        report_version="1",
    )


def _build_division(
    division_id: int, sprs_report_id: Optional[str], sitting_date: date
) -> Division:
    return Division(
        id=division_id,
        sitting_date=sitting_date,
        parliament_number=1,
        speech_ordinal=None if sprs_report_id is None else 4,
        count_source=(
            DivisionCountSource.MINUTES
            if sprs_report_id is None
            else DivisionCountSource.PRINTED_LINE
        ),
        printed_counts=_PRINTED_COUNTS,
        ayes=77,
        noes=1,
        abstentions=None,
        absent=None,
        paired=None,
        list_status=DivisionListStatus.STORED,
        printed_list=_PRINTED_LIST,
        sprs_report_id=sprs_report_id,
    )


class _World:
    def __init__(self, monkeypatch: pytest.MonkeyPatch):
        self.reports = {
            "visible": _build_report(11, "visible"),
            "hidden": _build_report(_TAKEN_DOWN_REPORT_ROW_ID, "hidden"),
        }
        self.divisions = [
            _build_division(_VISIBLE_DIVISION_ID, "visible#", date(2020, 3, 1)),
            _build_division(_TAKEN_DOWN_DIVISION_ID, "hidden#", date(2020, 2, 1)),
            _build_division(_MINUTES_ONLY_DIVISION_ID, None, date(2020, 1, 1)),
        ]
        self.votes = [
            DivisionVote(
                id=1,
                ordinal=1,
                printed_name="Mr Linked",
                vote_choice=DivisionVoteChoice.AYE,
                list_source=DivisionVoteListSource.HANSARD,
                party="PAP",
                is_party_uncertain=False,
                division_id=_VISIBLE_DIVISION_ID,
                speaker_id=40,
            ),
            DivisionVote(
                id=2,
                ordinal=2,
                printed_name=_PRINTED_NAME,
                vote_choice=DivisionVoteChoice.NO,
                list_source=DivisionVoteListSource.HANSARD,
                party=None,
                is_party_uncertain=False,
                division_id=_VISIBLE_DIVISION_ID,
                speaker_id=None,
            ),
        ]
        self.party_counts = [
            DivisionPartyCount(
                id=1,
                member_count=1,
                uncertain_member_count=0,
                party="PAP",
                list_source=DivisionVoteListSource.HANSARD,
                vote_choice=DivisionVoteChoice.AYE,
                division_id=_VISIBLE_DIVISION_ID,
            )
        ]
        self.minutes = Minutes(
            id=5,
            sitting_date=date(2020, 3, 1),
            printed_label="Votes and Proceedings No. 18 (PDF, 63.49 KB)",
            file_url="https://example.test/minutes.pdf",
            status=MinutesStatus.TEXT_STORED,
        )
        self.minutes_division = MinutesDivision(
            id=1,
            ordinal=1,
            printed_counts="Ayes 77 Noes 1",
            printed_list=None,
            list_status=DivisionListStatus.NOT_PRINTED,
            pairing=MinutesDivisionPairing.PAIRED,
            minutes_id=5,
            division_id=_VISIBLE_DIVISION_ID,
        )
        self.filtered_calls: list[dict[str, Any]] = []
        self.count_calls: list[tuple[Any, ...]] = []
        self.taken_down_report_slugs: list[str] = []
        self._monkeypatch = monkeypatch
        self._stub_reads()
        self.take_down()

    def take_down(self, *report_keys: str) -> None:
        self._monkeypatch.setattr(
            takedown, "_TAKEN_DOWN_REPORT_SLUGS", frozenset(report_keys)
        )
        taken_down_report_ids = [
            self.reports[report_key].id for report_key in report_keys
        ]
        self._monkeypatch.setattr(
            division_service,
            "get_taken_down_report_ids",
            lambda session: taken_down_report_ids,
        )

    def _stub_reads(self) -> None:
        world = self

        class _FakeDivision:
            def __init__(self, session: Session):
                pass

            def get(self, division_id: int) -> Optional[Division]:
                for division in world.divisions:
                    if division.id == division_id:
                        return division
                return None

            def get_all_filtered(
                self,
                parliament_number: Optional[int],
                date_from: Optional[date],
                date_to: Optional[date],
                sprs_report_ids: Optional[list[str]],
                excluded_report_ids: list[int],
                limit: int,
                offset: int,
            ) -> list[Division]:
                world.filtered_calls.append(
                    {
                        "parliament_number": parliament_number,
                        "date_from": date_from,
                        "date_to": date_to,
                        "sprs_report_ids": sprs_report_ids,
                        "excluded_report_ids": excluded_report_ids,
                        "limit": limit,
                        "offset": offset,
                    }
                )
                return world.divisions[offset : offset + limit]

            def get_count_filtered(self, *filters: Any) -> int:
                world.count_calls.append(filters)
                return len(world.divisions)

        class _FakeReport:
            def __init__(self, session: Session):
                pass

            def get_all_by_report_ids(self, report_ids: list[str]) -> list[Report]:
                return [
                    report
                    for report in world.reports.values()
                    if report.report_id in report_ids
                ]

        class _FakeVote:
            def __init__(self, session: Session):
                pass

            def get_all_by_division_id(self, division_id: int) -> list[DivisionVote]:
                return [v for v in world.votes if v.division_id == division_id]

        class _FakePartyCount:
            def __init__(self, session: Session):
                pass

            def get_all_by_division_id(
                self, division_id: int
            ) -> list[DivisionPartyCount]:
                return [p for p in world.party_counts if p.division_id == division_id]

        class _FakeMinutesDivision:
            def __init__(self, session: Session):
                pass

            def get_all_by_division_id(self, division_id: int) -> list[MinutesDivision]:
                return [
                    m for m in [world.minutes_division] if m.division_id == division_id
                ]

        class _FakeMinutes:
            def __init__(self, session: Session):
                pass

            def get_by_ids(self, minutes_ids: list[int]) -> list[Minutes]:
                return [world.minutes] if world.minutes.id in minutes_ids else []

        for name, fake in (
            ("CRUDDivision", _FakeDivision),
            ("CRUDReport", _FakeReport),
            ("CRUDDivisionVote", _FakeVote),
            ("CRUDDivisionPartyCount", _FakePartyCount),
            ("CRUDMinutesDivision", _FakeMinutesDivision),
            ("CRUDMinutes", _FakeMinutes),
        ):
            self._monkeypatch.setattr(division_service, name, fake)


@pytest.fixture
def world(monkeypatch: pytest.MonkeyPatch) -> _World:
    return _World(monkeypatch)


def _get_all(
    world: _World,
    page: int = 1,
    page_size: int = 20,
    report_slug: Optional[str] = None,
) -> GetAllDivisionsResponse:
    return division_service.get_all_divisions(
        page,
        page_size,
        1,
        date(2020, 1, 1),
        date(2020, 12, 31),
        report_slug,
        None,  # type: ignore[arg-type]
    )


def _get_one(division_id: int) -> GetDivisionResponse:
    return division_service.get_division(division_id, None)  # type: ignore[arg-type]


def test_an_unknown_division_raises_not_found(world: _World) -> None:
    with pytest.raises(DivisionNotFoundException):
        _get_one(_UNKNOWN_DIVISION_ID)


def test_a_division_of_a_taken_down_report_raises_taken_down(world: _World) -> None:
    world.take_down("hidden")

    with pytest.raises(ReportTakenDownException):
        _get_one(_TAKEN_DOWN_DIVISION_ID)


def test_a_division_of_a_report_not_taken_down_is_served(world: _World) -> None:
    world.take_down("hidden")

    assert _get_one(_VISIBLE_DIVISION_ID).id == _VISIBLE_DIVISION_ID


def test_a_division_with_no_report_is_served_while_reports_are_taken_down(
    world: _World,
) -> None:
    world.take_down("hidden", "visible")

    division = _get_one(_MINUTES_ONLY_DIVISION_ID)

    assert division.report_slug is None
    assert division.report_title is None
    assert division.speech_ordinal is None
    assert division.count_source == DivisionCountSource.MINUTES


def test_a_division_answers_the_report_slug_without_the_stored_suffix(
    world: _World,
) -> None:
    division = _get_one(_VISIBLE_DIVISION_ID)

    assert division.report_slug == "visible"
    assert division.report_title == "title of visible"


def test_a_division_goes_out_with_the_counts_and_list_as_printed(
    world: _World,
) -> None:
    division = _get_one(_VISIBLE_DIVISION_ID)

    assert division.printed_counts == _PRINTED_COUNTS
    assert division.printed_list == _PRINTED_LIST
    assert division.ayes == 77
    assert division.abstentions is None
    assert division.absent is None


def test_an_unlinked_vote_goes_out_with_its_printed_name_and_no_membership(
    world: _World,
) -> None:
    votes = _get_one(_VISIBLE_DIVISION_ID).votes

    assert [vote.membership_id for vote in votes] == [40, None]
    assert votes[1].printed_name == _PRINTED_NAME
    assert votes[1].party is None


def test_a_division_carries_its_party_counts(world: _World) -> None:
    party_counts = _get_one(_VISIBLE_DIVISION_ID).party_counts

    assert [(count.party, count.member_count) for count in party_counts] == [("PAP", 1)]


def test_a_division_carries_its_minutes_as_printed(world: _World) -> None:
    minutes = _get_one(_VISIBLE_DIVISION_ID).minutes

    assert minutes is not None
    assert minutes.sitting_date == date(2020, 3, 1)
    assert minutes.printed_counts == "Ayes 77 Noes 1"
    assert minutes.printed_label == world.minutes.printed_label
    assert minutes.pairing == MinutesDivisionPairing.PAIRED


def test_a_division_with_no_minutes_has_a_null_minutes_field(world: _World) -> None:
    assert _get_one(_MINUTES_ONLY_DIVISION_ID).minutes is None


def test_the_list_passes_the_taken_down_report_ids_to_both_reads(
    world: _World,
) -> None:
    world.take_down("hidden")

    _get_all(world)

    assert world.filtered_calls[0]["excluded_report_ids"] == [_TAKEN_DOWN_REPORT_ROW_ID]
    assert world.count_calls[0][-1] == [_TAKEN_DOWN_REPORT_ROW_ID]


def test_the_list_reads_one_row_past_the_page_to_know_there_is_a_next_page(
    world: _World,
) -> None:
    response = _get_all(world, page=1, page_size=2)

    assert world.filtered_calls[0]["limit"] == 3
    assert world.filtered_calls[0]["offset"] == 0
    assert [division.id for division in response.divisions] == [1, 2]
    assert response.has_next_page is True


def test_the_list_offsets_by_whole_pages_and_ends_on_the_last_page(
    world: _World,
) -> None:
    response = _get_all(world, page=2, page_size=2)

    assert world.filtered_calls[0]["offset"] == 2
    assert [division.id for division in response.divisions] == [3]
    assert response.has_next_page is False
    assert (response.page, response.page_size) == (2, 2)


def test_the_list_total_count_comes_from_the_count_read(world: _World) -> None:
    assert _get_all(world, page=1, page_size=1).total_count == 3


def test_the_list_hands_the_filters_to_the_read_unchanged(world: _World) -> None:
    _get_all(world)

    assert world.filtered_calls[0]["parliament_number"] == 1
    assert world.filtered_calls[0]["date_from"] == date(2020, 1, 1)
    assert world.filtered_calls[0]["date_to"] == date(2020, 12, 31)
    assert world.filtered_calls[0]["sprs_report_ids"] is None


def test_the_report_slug_filter_becomes_both_stored_report_ids(world: _World) -> None:
    _get_all(world, report_slug="visible")

    assert world.filtered_calls[0]["sprs_report_ids"] == ["visible#", "visible##"]
    assert world.count_calls[0][3] == ["visible#", "visible##"]


def test_a_list_row_without_a_report_has_no_slug_or_title(world: _World) -> None:
    divisions = _get_all(world).divisions

    assert divisions[2].report_slug is None
    assert divisions[2].report_title is None
    assert divisions[0].report_slug == "visible"


def test_no_response_model_carries_a_field_the_plan_keeps_back() -> None:
    from schemas import division, minutes

    field_names = {
        field_name
        for schema_module in (division, minutes)
        for schema in vars(schema_module).values()
        if isinstance(schema, type) and hasattr(schema, "model_fields")
        for field_name in schema.model_fields
    }

    for hidden_field in ("extracted_text", "sha256", "status_note", "content"):
        assert hidden_field not in field_names


def test_the_minutes_response_is_a_paged_shape() -> None:
    assert list(GetAllMinutesResponse.model_fields) == [
        "minutes",
        "page",
        "page_size",
        "has_next_page",
        "total_count",
    ]
