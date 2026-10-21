import re

_MARKED_WORD = re.compile(r"<mark>(.+?)</mark>")


def get_marked_words(marked_texts: list[str]) -> list[str]:
    return sorted(
        {
            word.lower()
            for marked_text in marked_texts
            for word in _MARKED_WORD.findall(marked_text)
        }
    )
