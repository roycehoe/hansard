import re
from typing import Optional

_NON_WORD_RUN = re.compile(r"[\W_]+")
_INITIAL_RUN = re.compile(r"\b[^\W\d_](?: [^\W\d_])+\b")
_WORD_SEPARATOR = " "
_PERSON_TITLE_WORDS = frozenset(
    {"mr", "mrs", "ms", "miss", "mdm", "madam", "dr", "prof", "assoc", "encik", "inche"}
)
_EXACT_RANK = 0
_SAME_WORDS_RANK = 1
_WORD_PREFIXES_RANK = 2


def _get_collapsed_initials(match: re.Match[str]) -> str:
    return match.group().replace(_WORD_SEPARATOR, "")


def _get_title_stripped_words(words: list[str]) -> list[str]:
    start = 0
    end = len(words)
    while start < end and words[start] in _PERSON_TITLE_WORDS:
        start += 1
    while end > start and words[end - 1] in _PERSON_TITLE_WORDS:
        end -= 1
    return words[start:end]


def get_normalised_name_words(name: str) -> list[str]:
    spaced = _NON_WORD_RUN.sub(_WORD_SEPARATOR, name.lower()).strip()
    return _get_title_stripped_words(
        _INITIAL_RUN.sub(_get_collapsed_initials, spaced).split()
    )


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
