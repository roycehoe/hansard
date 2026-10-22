import re

_MARKED_WORD = re.compile(r"<mark>(.+?)</mark>")
_MARK_START = "<mark>"
_MARK_END = "</mark>"
_NESTED_MARK_START = "<mark><mark>"
_NESTED_MARK_END = "</mark></mark>"


def get_marked_words(marked_texts: list[str]) -> list[str]:
    return sorted(
        {
            word.lower()
            for marked_text in marked_texts
            for word in _MARKED_WORD.findall(marked_text)
        }
    )


def get_headline_without_nested_marks(headline: str) -> str:
    return headline.replace(_NESTED_MARK_START, _MARK_START).replace(
        _NESTED_MARK_END, _MARK_END
    )
