from urllib.parse import unquote

from utils.report_slug import get_normalised_report_slug

_PATH_SEPARATOR = "/"
_QUERY_SEPARATOR = "?"


def _get_listed_report_slug(takedown_list_line: str, line_number: int) -> str:
    report_slug = unquote(takedown_list_line.strip())
    if _PATH_SEPARATOR in report_slug:
        raise ValueError(
            f"Takedown list line {line_number} holds a path, not a report slug."
        )
    if _QUERY_SEPARATOR in report_slug:
        raise ValueError(
            f"Takedown list line {line_number} holds a query, not a report slug."
        )
    if any(character.isspace() for character in report_slug):
        raise ValueError(
            f"Takedown list line {line_number} holds a space, not a report slug."
        )
    return get_normalised_report_slug(report_slug)


def get_taken_down_report_slugs(takedown_list_text: str) -> frozenset[str]:
    return frozenset(
        _get_listed_report_slug(takedown_list_line, line_number)
        for line_number, takedown_list_line in enumerate(
            takedown_list_text.splitlines(), start=1
        )
        if takedown_list_line.strip() != ""
    )
