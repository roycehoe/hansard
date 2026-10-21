import re

# NOTE: the scraper stores no record of how a speech was linked, so this repeats the label rules of its stage 8 (populate/speaker_links.py and services/role_context.py in hansard-scraper) for the two roles several people hold at once: a Deputy Speaker or Chairman label is linked to whoever the rules place in the chair, never by a printed name, and a swap the record does not mention can make that wrong. Single-holder roles such as Speaker or Prime Minister are left out on purpose, because their holder on a date is a matter of record. A change to those rules has to be made here too
_DEPUTY_SPEAKER_LABELS = (
    "Mr Deputy Speaker",
    "Mr DeputySpeaker",
    "Mdm Deputy Speaker",
    "Mdm DeputySpeaker",
    "The Deputy Speaker",
)
_LABEL_COLON = ":"
_BYTE_ORDER_MARK = "\ufeff"
_LABEL_TRAILING_CHARACTERS = ";, "
_OPENING_PARENTHESIS = "("
_CLOSING_PARENTHESIS = ")"
_ASSOC_PROF_SPACED = "Assoc. Prof."

_CHAIRMAN_LABEL = re.compile(r"^(?:the ?|mr ?)?chairman:?$", re.IGNORECASE)
_BARE_DEPUTY_SPEAKER_LABEL = re.compile(r"^mr deputy speaker:?$", re.IGNORECASE)
_PARENTHESIS = re.compile(r"\(([^)]+)\)")
_LEADING_LIST_NUMBER = re.compile(r"^\d+\\?\.\s*")
_LEADING_DOT = re.compile(r"^\.\s+")
_ASSOC_PROF = re.compile(r"\bAssoc\.Prof\.")
_RANK_QUALIFIER = re.compile(r"\s*[\[(](?:NS|Res)[\])]\s*")
_TRAILING_MR_SPEAKER = re.compile(r"\s+Mr Speaker,?$")
_LEADING_QUOTE = re.compile(r"^[\"“”'‘’]+")
_PRESIDING_BRACKET = re.compile(r"\s*\((?:Mr|Mdm) Speaker\)$")
_TRAILING_DASH = re.compile(r"\s*[–—-]+$")
_TRAILING_NAME_DOT = re.compile(r"(?<=[A-Za-z]{3})\.$")
_UPPERCASE_TITLE = re.compile(r"^(?:MR|MRS|MS|DR|MDM|PROF)\b")
_WHITESPACE = re.compile(r"\s+")
_TITLED = re.compile(r"^(?:Mr|Mrs|Ms|Mdm|Dr|Miss|Inche|Encik|Assoc|Prof|Er)\b")
_INVERTED_NAME = re.compile(r"^([A-Z][a-z]+), ([A-Z][a-z]+)$")
_DOUBLED_LABEL = re.compile(r"^(.{6,}?)\s+\1$")


def _get_cleaned_speaker_label(speaker_label: str) -> str:
    cleaned = speaker_label.replace(_BYTE_ORDER_MARK, "").strip()
    cleaned = _LEADING_LIST_NUMBER.sub("", cleaned)
    cleaned = _LEADING_DOT.sub("", cleaned)
    cleaned = _ASSOC_PROF.sub(_ASSOC_PROF_SPACED, cleaned)
    cleaned = _RANK_QUALIFIER.sub(" ", cleaned)
    cleaned = _TRAILING_MR_SPEAKER.sub("", cleaned)
    cleaned = _LEADING_QUOTE.sub("", cleaned)
    cleaned = _PRESIDING_BRACKET.sub("", cleaned)
    cleaned = _TRAILING_DASH.sub("", cleaned)
    cleaned = _TRAILING_NAME_DOT.sub("", cleaned)
    if _UPPERCASE_TITLE.match(cleaned) is not None and cleaned.isupper():
        cleaned = cleaned.title()
    cleaned = _WHITESPACE.sub(" ", cleaned).rstrip(_LABEL_TRAILING_CHARACTERS).strip()
    if cleaned.count(_OPENING_PARENTHESIS) > cleaned.count(_CLOSING_PARENTHESIS):
        cut = cleaned.rfind(_OPENING_PARENTHESIS)
        inner = cleaned[cut + 1 :].strip()
        cleaned = (
            f"{cleaned[:cut]}({inner})"
            if _TITLED.match(inner) is not None
            else cleaned[:cut].strip()
        )
    inverted = _INVERTED_NAME.match(cleaned)
    if inverted is not None:
        cleaned = f"{inverted.group(2)} {inverted.group(1)}"
    doubled = _DOUBLED_LABEL.match(cleaned)
    return doubled.group(1) if doubled is not None else cleaned


def is_shared_role_speaker_label(speaker_label: str) -> bool:
    if _CHAIRMAN_LABEL.match(speaker_label) is not None:
        return True
    if _BARE_DEPUTY_SPEAKER_LABEL.match(speaker_label.strip()) is not None:
        return True
    cleaned = _get_cleaned_speaker_label(speaker_label.rstrip(_LABEL_COLON).strip())
    return (
        cleaned.startswith(_DEPUTY_SPEAKER_LABELS)
        and _PARENTHESIS.search(cleaned) is None
    )
