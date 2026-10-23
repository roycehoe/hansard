from typing import Optional

import pytest

from utils.person_name import get_name_match_rank, get_normalised_name_words


def _get_rank(query: str, name: str) -> Optional[int]:
    return get_name_match_rank(
        get_normalised_name_words(query), get_normalised_name_words(name)
    )


@pytest.mark.parametrize(
    ("name", "expected_words"),
    [
        ("Dr Tan Cheng Bock", ["tan", "cheng", "bock"]),
        ("Lee Siew Choh, Dr", ["lee", "siew", "choh"]),
        ("Ong Soh Khim, Assoc Prof", ["ong", "soh", "khim"]),
        ("Mrs Devan Nair", ["devan", "nair"]),
        ("dr", []),
        ("J.B. Jeyaretnam", ["jb", "jeyaretnam"]),
        ("Mohd Ariff Bin Suradi, Haji", ["mohd", "ariff", "bin", "suradi", "haji"]),
    ],
)
def test_get_normalised_name_words(name: str, expected_words: list[str]) -> None:
    assert get_normalised_name_words(name) == expected_words


def test_title_does_not_stop_a_full_name_matching() -> None:
    assert _get_rank("Dr Tan Cheng Bock", "Tan Cheng Bock") == 0


def test_title_in_query_matches_name_with_or_without_title() -> None:
    assert _get_rank("Dr Lee", "Lee Siew Choh") == 2
    assert _get_rank("Dr Lee", "Lee Siew Choh, Dr") == 2


def test_title_alone_matches_nobody() -> None:
    assert _get_rank("dr", "Lee Siew Choh, Dr") is None


def test_haji_and_bin_stay_matching_words() -> None:
    assert _get_rank("Haji", "Mohd Ariff Bin Suradi, Haji") == 2
    assert _get_rank("Bin", "Mohd Ariff Bin Suradi") == 2
    assert _get_rank("Haji", "Mohd Ariff Bin Suradi") is None


def test_empty_query_matches_nobody() -> None:
    assert _get_rank("", "Lee Siew Choh") is None
