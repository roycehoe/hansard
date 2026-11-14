import re

_CHAPTER = re.compile(r"\(chapter [^)]*\)", re.IGNORECASE)
_PUNCTUATION = re.compile(r"[,.]")
_WHITESPACE = re.compile(r"\s+")
_TRAILING_YEAR = re.compile(r"\s+(of\s+)?\d{4}$", re.IGNORECASE)
_LEADING_THE = re.compile(r"^the\s+", re.IGNORECASE)
_ORDINANCE = re.compile(r"\bordinance\b", re.IGNORECASE)
_EMPTY = ""
_SPACE = " "
_ACT_WORD = "act"


# NOTE: the same rule as normaliseLawName in app/src/lib/actTimeline.ts, so the server and the Act page compare law names alike
def get_law_name(title: str) -> str:
    title_without_chapter = _CHAPTER.sub(_EMPTY, title)
    title_without_punctuation = _PUNCTUATION.sub(_EMPTY, title_without_chapter)
    spaced_title = _WHITESPACE.sub(_SPACE, title_without_punctuation).strip()
    title_without_year = _TRAILING_YEAR.sub(_EMPTY, spaced_title)
    title_without_the = _LEADING_THE.sub(_EMPTY, title_without_year)
    return _ORDINANCE.sub(_ACT_WORD, title_without_the).lower()
