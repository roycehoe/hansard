import re
from typing import Optional

_NON_WORD_RUN = re.compile(r"[\W_]+")
_INITIAL_RUN = re.compile(r"\b[^\W\d_](?: [^\W\d_])+\b")
_WORD_SEPARATOR = " "
_EXACT_RANK = 0
_SAME_WORDS_RANK = 1
_WORD_PREFIXES_RANK = 2


def _get_collapsed_initials(match: re.Match[str]) -> str:
    return match.group().replace(_WORD_SEPARATOR, "")


def get_normalised_name_words(name: str) -> list[str]:
    spaced = _NON_WORD_RUN.sub(_WORD_SEPARATOR, name.lower()).strip()
    return _INITIAL_RUN.sub(_get_collapsed_initials, spaced).split()


def get_name_match_rank(query_words: list[str], name_words: list[str]) -> Optional[int]:
    if not query_words:
        return None
    if query_words == name_words:
        return _EXACT_RANK
    if sorted(query_words) == sorted(name_words):
        return _SAME_WORDS_RANK
    if all(
        any(name_word.startswith(query_word) for name_word in name_words)
        for query_word in query_words
    ):
        return _WORD_PREFIXES_RANK
    return None
