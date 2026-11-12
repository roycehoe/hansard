from datetime import date, datetime, timezone
from typing import Any

import pytest
from sqlmodel import Session

from database.attendance_office import AttendanceOffice
from database.speaker import Speaker
from enums import AttendanceOfficeSource, OfficeClass
from schemas.office import PrintedRangeData, PrintEvidenceData
from services import office as office_service

_PRIME_MINISTER = "Prime Minister"
_MINISTER_FOR_LAW = "Minister for Law"
_MINISTER_FOR_LAW_AND_NATIONAL_DEVELOPMENT = "Minister for Law and National Development"


def _build_evidence(sitting_date: date) -> PrintEvidenceData:
    return PrintEvidenceData(
        sitting_date=sitting_date,
        entry_line_printed=f"printed on {sitting_date.isoformat()}",
        source=AttendanceOfficeSource.AFTER_CONSTITUENCY_BRACKET,
        extracted_at=datetime(2026, 11, 1, tzinfo=timezone.utc),
    )


def _build_range(
    office_printed: str, first_sitting_date: date, last_sitting_date: date, count: int
) -> PrintedRangeData:
    return PrintedRangeData(
        office_printed=office_printed,
        office_class=OfficeClass.MINISTER,
        sitting_count=count,
        first_print=_build_evidence(first_sitting_date),
        last_print=_build_evidence(last_sitting_date),
    )


def _build_membership(membership_id: int, parliament_number: int) -> Speaker:
    return Speaker(
        id=membership_id,
        name="A",
        party="",
        parliament_number=parliament_number,
        is_legislative_assembly=parliament_number == 0,
        is_member=True,
        person_id=1,
    )


def _build_attendance_office(sitting_date: date) -> AttendanceOffice:
    evidence = _build_evidence(sitting_date)
    return AttendanceOffice(
        id=sitting_date.toordinal(),
        office_printed="",
        entry_line_printed=evidence.entry_line_printed,
        source=evidence.source,
        extracted_at=evidence.extracted_at,
        attendance_id=sitting_date.toordinal(),
    )


def _patch_sittings(
    monkeypatch: pytest.MonkeyPatch, sitting_dates: list[date]
) -> list[tuple[Any, ...]]:
    calls: list[tuple[Any, ...]] = []

    class FakeCRUDAttendanceOffice:
        def __init__(self, session: Session):
            self.session = session

        def get_sitting_date_to_attendance_office_by_membership_id_and_office_printed_and_sitting_date_from_and_sitting_date_to(
            self,
            membership_id: int,
            office_printed: str,
            sitting_date_from: date,
            sitting_date_to: date,
        ) -> dict[date, AttendanceOffice]:
            calls.append((membership_id, office_printed))
            return {
                sitting_date: _build_attendance_office(sitting_date)
                for sitting_date in sitting_dates
                if sitting_date_from <= sitting_date <= sitting_date_to
            }

    monkeypatch.setattr(
        office_service, "CRUDAttendanceOffice", FakeCRUDAttendanceOffice
    )
    return calls


def test_a_range_across_8_december_1965_is_split_into_the_two_headings(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    sitting_dates = [
        date(1965, 6, 15),
        date(1965, 6, 16),
        date(1965, 12, 8),
        date(1965, 12, 9),
        date(1966, 1, 5),
    ]
    _patch_sittings(monkeypatch, sitting_dates)
    prime_minister = _build_range(
        _PRIME_MINISTER, date(1965, 6, 15), date(1966, 1, 5), 5
    )

    membership_datas = office_service._get_person_printed_ranges_membership_datas(
        _build_membership(30, 1),
        [prime_minister],
        None,  # type: ignore[arg-type]
    )

    first_parliament, assembly = membership_datas
    assert (first_parliament.parliament_number, first_parliament.membership_id) == (
        1,
        30,
    )
    assert first_parliament.is_continued_into_parliament_1 is False
    assert [
        (r.first_print.sitting_date, r.last_print.sitting_date, r.sitting_count)
        for r in first_parliament.ranges
    ] == [(date(1965, 12, 8), date(1966, 1, 5), 3)]
    assert (assembly.parliament_number, assembly.membership_id) == (0, 30)
    assert assembly.is_continued_into_parliament_1 is True
    assert [
        (r.first_print.sitting_date, r.last_print.sitting_date, r.sitting_count)
        for r in assembly.ranges
    ] == [(date(1965, 6, 15), date(1965, 6, 16), 2)]
    assert assembly.ranges[0].first_print == prime_minister.first_print
    assert first_parliament.ranges[0].last_print == prime_minister.last_print


def test_a_range_that_ends_before_8_december_1965_sits_wholly_under_the_assembly(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    _patch_sittings(monkeypatch, [date(1964, 11, 2), date(1965, 6, 16)])
    minister_for_law = _build_range(
        _MINISTER_FOR_LAW, date(1964, 11, 2), date(1965, 6, 16), 2
    )

    first_parliament, assembly = (
        office_service._get_person_printed_ranges_membership_datas(
            _build_membership(5, 1),
            [minister_for_law],
            None,  # type: ignore[arg-type]
        )
    )

    assert first_parliament.ranges == []
    assert assembly.ranges == [minister_for_law]
    assert assembly.is_continued_into_parliament_1 is True


def test_a_range_from_8_december_1965_stays_under_parliament_1_without_a_query(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    calls = _patch_sittings(monkeypatch, [])
    barker_office = _build_range(
        _MINISTER_FOR_LAW_AND_NATIONAL_DEVELOPMENT,
        date(1965, 12, 8),
        date(1968, 1, 24),
        52,
    )

    membership_datas = office_service._get_person_printed_ranges_membership_datas(
        _build_membership(5, 1),
        [barker_office],
        None,  # type: ignore[arg-type]
    )

    assert len(membership_datas) == 1
    assert membership_datas[0].ranges == [barker_office]
    assert membership_datas[0].is_continued_into_parliament_1 is False
    assert calls == []


def test_a_membership_of_another_parliament_is_returned_as_stored(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    calls = _patch_sittings(monkeypatch, [])
    office = _build_range(_PRIME_MINISTER, date(1968, 2, 1), date(1968, 3, 1), 4)

    membership_datas = office_service._get_person_printed_ranges_membership_datas(
        _build_membership(68, 2),
        [office],
        None,  # type: ignore[arg-type]
    )

    assert [(m.parliament_number, m.ranges) for m in membership_datas] == [
        (2, [office])
    ]
    assert calls == []
