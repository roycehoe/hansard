from datetime import date

import pytest

from services import coverage as coverage_service


def _get_stored_group(
    group: str,
    linked_row_count: int = 90,
    named_unlinked_row_count: int = 10,
    row_count: int = 200,
    linked_character_count: int = 300,
    body_character_count: int = 400,
) -> dict[str, object]:
    return {
        "group": group,
        "linked_row_count": linked_row_count,
        "named_unlinked_row_count": named_unlinked_row_count,
        "row_count": row_count,
        "linked_character_count": linked_character_count,
        "body_character_count": body_character_count,
    }


def _get_figures(*groups: dict[str, object]) -> dict[str, object]:
    return {"measured_at": "2026-10-18T17:30:00+00:00", "groups": list(groups)}


def test_group_names_become_parliament_number_ranges() -> None:
    figures = _get_figures(
        _get_stored_group("Parliaments 0 to 11"), _get_stored_group("Parliament 12")
    )

    data = coverage_service._get_attribution_data(figures)

    assert data is not None
    assert data.measured_on == date(2026, 10, 19)
    assert [
        (group.first_parliament_number, group.last_parliament_number)
        for group in data.groups
    ] == [(0, 11), (12, 12)]


def test_shares_and_counts_follow_the_formulas() -> None:
    data = coverage_service._get_attribution_data(
        _get_figures(_get_stored_group("Parliament 12"))
    )

    assert data is not None
    group = data.groups[0]
    assert group.linked_row_count == 90
    assert group.speaker_label_row_count == 100
    assert group.row_count == 200
    assert group.named_linked_share == pytest.approx(0.9)
    assert group.all_linked_share == pytest.approx(0.45)
    assert group.text_share == pytest.approx(0.75)


@pytest.mark.parametrize(
    "zero_denominator_group",
    [
        _get_stored_group(
            "Parliament 13", linked_row_count=0, named_unlinked_row_count=0
        ),
        _get_stored_group("Parliament 13", row_count=0),
        _get_stored_group("Parliament 13", body_character_count=0),
    ],
)
def test_a_group_with_a_zero_denominator_is_dropped(
    zero_denominator_group: dict[str, object],
) -> None:
    data = coverage_service._get_attribution_data(
        _get_figures(_get_stored_group("Parliament 12"), zero_denominator_group)
    )

    assert data is not None
    assert [group.first_parliament_number for group in data.groups] == [12]


def test_a_group_named_in_neither_form_is_skipped() -> None:
    data = coverage_service._get_attribution_data(
        _get_figures(_get_stored_group("Sitting 5"), _get_stored_group("Parliament 12"))
    )

    assert data is not None
    assert [group.first_parliament_number for group in data.groups] == [12]


@pytest.mark.parametrize(
    "bad_figures",
    [
        None,
        ["not", "an", "object"],
        {},
        {"measured_at": "2026-10-18T17:30:00+00:00"},
        {
            "measured_at": "not a timestamp",
            "groups": [_get_stored_group("Parliament 12")],
        },
        {"measured_at": "2026-10-18T17:30:00+00:00", "groups": "text"},
        {"measured_at": "2026-10-18T17:30:00+00:00", "groups": ["text"]},
        {
            "measured_at": "2026-10-18T17:30:00+00:00",
            "groups": [{"group": "Parliament 12"}],
        },
        {
            "measured_at": "2026-10-18T17:30:00+00:00",
            "groups": [_get_stored_group("Parliament 12", row_count="many")],
        },
        _get_figures(),
        _get_figures(_get_stored_group("Sitting 5")),
    ],
)
def test_bad_figures_count_as_no_figures(bad_figures: object) -> None:
    assert coverage_service._get_attribution_data(bad_figures) is None


def test_a_timestamp_with_no_offset_is_read_as_utc() -> None:
    figures = {
        "measured_at": "2026-10-18T10:00:00",
        "groups": [_get_stored_group("Parliament 12")],
    }

    data = coverage_service._get_attribution_data(figures)

    assert data is not None
    assert data.measured_on == date(2026, 10, 18)
