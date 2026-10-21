import re

# NOTE: the scraper stores no record of how a speech was linked, so this repeats the label rules of its stage 8 (populate/speaker_links.py and services/role_context.py in hansard-scraper): a label these rules read as a role is linked to whoever held the role at the time, never by a printed name. A change to those rules has to be made here too
_SPEAKER_LABELS = ("Mr Speaker", "Mdm Speaker")
_DEPUTY_SPEAKER_LABELS = (
    "Mr Deputy Speaker",
    "Mr DeputySpeaker",
    "Mdm Deputy Speaker",
    "Mdm DeputySpeaker",
    "The Deputy Speaker",
)
_DATED_ROLE_LABELS = ("The Chief Minister", "The Prime Minister")
_PARLIAMENT_ROLE_LABELS = (("The Minister for Health", 11),)
_CARRIED_ROLE_LABELS = ("The Chief Secretary",)
_HEAD_OF_STATE_LABELS = (
    "His Excellency the Governor",
    "His Excellency the Yang di-Pertuan Negara",
    "The President",
)
_NON_SPEAKER_LABELS = (
    "An hon. Member",
    "Some hon. Members",
    "Non-Residents",
    "Tributes by Leader of the House and Opposition Leaders",
)
_UNLINKED_LABEL_PREFIXES = ("(", "_")
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


def is_role_only_speaker_label(speaker_label: str, parliament_number: int) -> bool:
    if _CHAIRMAN_LABEL.match(speaker_label) is not None:
        return True
    if _BARE_DEPUTY_SPEAKER_LABEL.match(speaker_label.strip()) is not None:
        return True
    if speaker_label.rstrip(_LABEL_COLON).strip() in _CARRIED_ROLE_LABELS:
        return True
    if speaker_label in _HEAD_OF_STATE_LABELS:
        return True
    if speaker_label in _NON_SPEAKER_LABELS:
        return False
    if speaker_label.startswith(_UNLINKED_LABEL_PREFIXES):
        return False
    cleaned = _get_cleaned_speaker_label(speaker_label.rstrip(_LABEL_COLON).strip())
    if cleaned in _SPEAKER_LABELS:
        return True
    if cleaned.startswith(_DEPUTY_SPEAKER_LABELS):
        return _PARENTHESIS.search(cleaned) is None
    if cleaned in _DATED_ROLE_LABELS:
        return True
    return (cleaned, parliament_number) in _PARLIAMENT_ROLE_LABELS
