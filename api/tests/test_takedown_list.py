import pytest

from utils.takedown_list import get_taken_down_report_slugs


def test_takedown_list_reads_comma_separated_slugs() -> None:
    taken_down_report_slugs = get_taken_down_report_slugs(
        " written-answer-11589, oral-answer-2041%23,,"
    )

    assert taken_down_report_slugs == get_taken_down_report_slugs(
        "written-answer-11589,oral-answer-2041#"
    )
    assert len(taken_down_report_slugs) == 2


def test_an_empty_takedown_list_hides_nothing() -> None:
    assert get_taken_down_report_slugs("") == frozenset()


@pytest.mark.parametrize(
    "takedown_report_slugs",
    [
        "written-answer-11589,/reports/oral-answer-2041",
        "written-answer-11589?s=2",
        "written answer 11589",
        '"written-answer-11589"',
        "written-answer-11589;oral-answer-2041",
        "written-answer-11589\u200b",
    ],
)
def test_a_malformed_takedown_entry_raises(takedown_report_slugs: str) -> None:
    with pytest.raises(ValueError):
        get_taken_down_report_slugs(takedown_report_slugs)
