import re
from urllib.parse import unquote

from utils.report_slug import get_normalised_report_slug

_ENTRY_SEPARATOR = ","
_PATH_SEPARATOR = "/"
_QUERY_SEPARATOR = "?"
_REPORT_SLUG_PATTERN = re.compile(r"[A-Za-z0-9#._-]+")


def _get_listed_report_slug(takedown_list_entry: str, entry_number: int) -> str:
    report_slug = unquote(takedown_list_entry.strip())
    if _PATH_SEPARATOR in report_slug:
        raise ValueError(
            f"TAKEDOWN_REPORT_SLUGS entry {entry_number} holds a path, not a report slug."
        )
    if _QUERY_SEPARATOR in report_slug:
        raise ValueError(
            f"TAKEDOWN_REPORT_SLUGS entry {entry_number} holds a query, not a report slug."
        )
    if any(character.isspace() for character in report_slug):
        raise ValueError(
            f"TAKEDOWN_REPORT_SLUGS entry {entry_number} holds a space, not a report slug."
        )
    if _REPORT_SLUG_PATTERN.fullmatch(report_slug) is None:
        raise ValueError(
            f"TAKEDOWN_REPORT_SLUGS entry {entry_number} holds a character no report slug has."
        )
    return get_normalised_report_slug(report_slug)


def get_taken_down_report_slugs(takedown_report_slugs: str) -> frozenset[str]:
    return frozenset(
        _get_listed_report_slug(takedown_list_entry, entry_number)
        for entry_number, takedown_list_entry in enumerate(
            takedown_report_slugs.split(_ENTRY_SEPARATOR), start=1
        )
        if takedown_list_entry.strip() != ""
    )
