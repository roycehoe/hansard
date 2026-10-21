import re
from functools import partial
from typing import Optional

from utils.markdown_text import strip_markdown

_ANCHOR_WORD = re.compile(r"[^\W_]+")
_ANCHOR_WORD_COUNT = 8
_ANCHOR_SEPARATOR = " "
_ANCHOR_PREFIX_LENGTH = 96
_ANCHOR_PREFIX_MARKUP = re.compile(r"[\[*_]")


def _get_anchor_by_stripping_markdown(text: str) -> str:
    words = _ANCHOR_WORD.findall(strip_markdown(text).lower())
    return _ANCHOR_SEPARATOR.join(words[:_ANCHOR_WORD_COUNT])


def get_speech_anchor(text: str) -> str:
    prefix = text[:_ANCHOR_PREFIX_LENGTH]
    # NOTE: strip_markdown changes the words of an ASCII prefix only through "[", "*" and "_", so a plain prefix skips it; a new markup rule in utils/markdown_text.py has to be reflected here. Non-ASCII text takes the full path because lowercasing it can depend on its neighbours (final sigma)
    if not prefix.isascii() or _ANCHOR_PREFIX_MARKUP.search(prefix) is not None:
        return _get_anchor_by_stripping_markdown(text)
    prefix_words = _ANCHOR_WORD.findall(prefix.lower())
    is_prefix_whole_text = len(prefix) == len(text)
    # NOTE: the eighth word is final only once a ninth follows it in the prefix, because text past the prefix can join the last word
    if len(prefix_words) <= _ANCHOR_WORD_COUNT and not is_prefix_whole_text:
        return _get_anchor_by_stripping_markdown(text)
    return _ANCHOR_SEPARATOR.join(prefix_words[:_ANCHOR_WORD_COUNT])


def _get_ordinal_distance(speech_ordinal: int, ordinal: int) -> int:
    return abs(ordinal - speech_ordinal)


def _is_starting_with_anchor(anchor: Optional[str], speech_anchor: str) -> bool:
    if anchor is None:
        return False
    return anchor == speech_anchor or anchor.startswith(
        f"{speech_anchor}{_ANCHOR_SEPARATOR}"
    )


def get_linked_speech_ordinal(
    ordinal_to_anchor: dict[int, str], speech_ordinal: int, speech_anchor: str
) -> Optional[int]:
    if _is_starting_with_anchor(ordinal_to_anchor.get(speech_ordinal), speech_anchor):
        return speech_ordinal
    matching_ordinals = sorted(
        ordinal
        for ordinal, anchor in ordinal_to_anchor.items()
        if _is_starting_with_anchor(anchor, speech_anchor)
    )
    if not matching_ordinals:
        return None
    return min(matching_ordinals, key=partial(_get_ordinal_distance, speech_ordinal))
