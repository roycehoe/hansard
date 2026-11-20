from datetime import datetime
from typing import Any, Optional
from urllib.parse import quote

import pytest
from fastapi import status
from fastapi.testclient import TestClient

from database.speech import Speech
from enums import SpeechKind
from services import report as report_service

_MANUAL_VOTE_REPORT_SLUG = "00000444-XA.00068590-ZZ_1#id015_20020827_S0002_T00021-bill"
_CHAIR_ONLY_REPORT_SLUG = "00069636-ZZ.00062259-ZZ_1#id008_19910103_S0002_T00021-bill"
_LIST_TO_THE_END_REPORT_SLUG = (
    "00069499-ZZ.00059747-ZZ_2#id026_19860110_S0005_T00181-motion"
)


def _build_speech(
    ordinal: int, kind: SpeechKind, speaker: Optional[str], transcript: str
) -> Speech:
    return Speech(
        id=ordinal,
        ordinal=ordinal,
        speaker=speaker,
        transcript=transcript,
        kind=kind,
        sitting_date=datetime(2002, 8, 27),
        report_type="bill",
    )


def test_a_member_speaking_after_the_list_is_quoted() -> None:
    speeches = [
        _build_speech(
            44,
            SpeechKind.PROCEDURAL,
            None,
            "Division taken: Ayes, 78; No, Nil; Abstention, Nil.",
        ),
        _build_speech(45, SpeechKind.UNCLASSIFIED, None, "Ayes"),
        _build_speech(46, SpeechKind.UNCLASSIFIED, None, "Abdullah Tarmugi"),
        _build_speech(126, SpeechKind.UNCLASSIFIED, None, "Nil"),
        _build_speech(
            127,
            SpeechKind.SPEECH,
            "Dr Michael Lim Chun Leng",
            "Mr Speaker, Sir, my name did not appear on the display board even though I pressed the button.",
        ),
        _build_speech(128, SpeechKind.SPEECH, "Mr Speaker", 'Did you press "Present"?'),
        _build_speech(
            133,
            SpeechKind.PROCEDURAL,
            None,
            "Bill accordingly read a Second time and committed to a Committee of the whole House.",
        ),
    ]

    assert (
        report_service._get_non_chair_speech_ordinal_after_division_list(44, speeches)
        == 127
    )


def test_only_the_chair_speaking_after_the_list_gives_no_quote() -> None:
    speeches = [
        _build_speech(
            161,
            SpeechKind.PROCEDURAL,
            None,
            "Division taken: Ayes, 75; No, 1; Abstention, Nil.",
        ),
        _build_speech(
            162, SpeechKind.UNCLASSIFIED, None, "Ayes                            Ayes"
        ),
        _build_speech(205, SpeechKind.UNCLASSIFIED, None, "Yeo Ning Hong"),
        _build_speech(
            206,
            SpeechKind.SPEECH,
            "Mr Speaker",
            "The Third Reading of the Bill has been carried by the votes of not less than two-thirds of the total number of Members of Parliament.",
        ),
        _build_speech(
            207,
            SpeechKind.PROCEDURAL,
            None,
            "Bill accordingly read a Third time and passed.",
        ),
    ]

    assert (
        report_service._get_non_chair_speech_ordinal_after_division_list(161, speeches)
        is None
    )


def test_a_list_running_to_the_end_of_the_report_gives_no_quote() -> None:
    speeches = [
        _build_speech(
            100,
            SpeechKind.PROCEDURAL,
            None,
            "The House divided: Ayes, 2; Noes, 42; Abstention, 1.",
        ),
        _build_speech(
            101, SpeechKind.UNCLASSIFIED, None, "Ayes                     Noes (cont.)"
        ),
        _build_speech(
            130,
            SpeechKind.UNCLASSIFIED,
            None,
            "Lee Hsien Loong               Tan Soo Khoon",
        ),
        _build_speech(
            131, SpeechKind.UNCLASSIFIED, None, "Motion accordingly negatived."
        ),
    ]

    assert (
        report_service._get_non_chair_speech_ordinal_after_division_list(100, speeches)
        is None
    )


@pytest.mark.database
@pytest.mark.parametrize(
    ("report_slug", "division_notes"),
    [
        (
            _MANUAL_VOTE_REPORT_SLUG,
            [{"count_line_ordinal": 44, "non_chair_speech_ordinal": 127}],
        ),
        (
            _CHAIR_ONLY_REPORT_SLUG,
            [{"count_line_ordinal": 161, "non_chair_speech_ordinal": None}],
        ),
        (
            _LIST_TO_THE_END_REPORT_SLUG,
            [{"count_line_ordinal": 100, "non_chair_speech_ordinal": None}],
        ),
    ],
)
def test_every_list_whose_names_miss_its_counts_gets_a_note(
    api_client: TestClient, report_slug: str, division_notes: list[dict[str, Any]]
) -> None:
    response = api_client.get(f"/reports/{quote(report_slug, safe='')}")

    assert response.status_code == status.HTTP_200_OK
    assert response.json()["division_notes"] == division_notes
