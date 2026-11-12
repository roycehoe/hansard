from datetime import date
from typing import Any, Optional

import pytest
from sqlmodel import Session

from database.minutes import Minutes
from enums import MinutesFileFormat, MinutesStatus
from services import minutes as minutes_service

_DATE_FROM = date(2020, 1, 1)
_DATE_TO = date(2020, 12, 31)


def _build_minutes(minutes_id: int) -> Minutes:
    return Minutes(
        id=minutes_id,
        sitting_date=date(2020, 1, minutes_id),
        printed_label=f"label {minutes_id}",
        printed_parliament="13th Parliament",
        file_url=f"https://example.test/{minutes_id}.pdf",
        archive_timestamp="20200101000000",
        file_format=MinutesFileFormat.PDF,
        status=MinutesStatus.TEXT_STORED,
    )


class _World:
    def __init__(self, monkeypatch: pytest.MonkeyPatch):
        self.minutes_rows = [_build_minutes(3), _build_minutes(2), _build_minutes(1)]
        self.filtered_calls: list[dict[str, Any]] = []
        self.count_calls: list[tuple[Any, ...]] = []
        world = self

        class _FakeMinutes:
            def __init__(self, session: Session):
                pass

            def get_all_filtered(
                self,
                status: Optional[MinutesStatus],
                date_from: Optional[date],
                date_to: Optional[date],
                limit: int,
                offset: int,
            ) -> list[Minutes]:
                world.filtered_calls.append(
                    {
                        "status": status,
                        "date_from": date_from,
                        "date_to": date_to,
                        "limit": limit,
                        "offset": offset,
                    }
                )
                return world.minutes_rows[offset : offset + limit]

            def get_count_filtered(self, *filters: Any) -> int:
                world.count_calls.append(filters)
                return len(world.minutes_rows)

        monkeypatch.setattr(minutes_service, "CRUDMinutes", _FakeMinutes)


@pytest.fixture
def world(monkeypatch: pytest.MonkeyPatch) -> _World:
    return _World(monkeypatch)


def _get_all(page: int, page_size: int, status: Optional[MinutesStatus] = None):
    return minutes_service.get_all_minutes(
        page,
        page_size,
        status,
        _DATE_FROM,
        _DATE_TO,
        None,  # type: ignore[arg-type]
    )


def test_the_minutes_list_reads_one_row_past_the_page(world: _World) -> None:
    response = _get_all(1, 2)

    assert world.filtered_calls[0]["limit"] == 3
    assert world.filtered_calls[0]["offset"] == 0
    assert len(response.minutes) == 2
    assert response.has_next_page is True


def test_the_minutes_last_page_has_no_next_page(world: _World) -> None:
    response = _get_all(2, 2)

    assert world.filtered_calls[0]["offset"] == 2
    assert len(response.minutes) == 1
    assert response.has_next_page is False


def test_the_minutes_filters_reach_both_reads(world: _World) -> None:
    _get_all(1, 20, MinutesStatus.NEEDS_REVIEW)

    assert world.filtered_calls[0]["status"] == MinutesStatus.NEEDS_REVIEW
    assert world.filtered_calls[0]["date_from"] == _DATE_FROM
    assert world.filtered_calls[0]["date_to"] == _DATE_TO
    assert world.count_calls[0] == (MinutesStatus.NEEDS_REVIEW, _DATE_FROM, _DATE_TO)


def test_the_minutes_total_count_comes_from_the_count_read(world: _World) -> None:
    assert _get_all(1, 1).total_count == 3


def test_a_minutes_row_goes_out_as_stored(world: _World) -> None:
    minutes = _get_all(1, 20).minutes[0]

    assert minutes.printed_label == "label 3"
    assert minutes.printed_parliament == "13th Parliament"
    assert minutes.file_url == "https://example.test/3.pdf"
    assert minutes.archive_timestamp == "20200101000000"
    assert minutes.file_format == MinutesFileFormat.PDF
    assert minutes.status == MinutesStatus.TEXT_STORED
