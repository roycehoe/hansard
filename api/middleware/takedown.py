from pathlib import Path

from utils.report_slug import get_normalised_report_slug
from utils.takedown_list import get_taken_down_report_slugs

_TAKEDOWN_LIST_PATH = Path(__file__).resolve().parent.parent / "takedown-list.txt"

# NOTE: read at import so a missing or malformed list stops startup instead of showing a listed report.
_TAKEN_DOWN_REPORT_SLUGS = get_taken_down_report_slugs(
    _TAKEDOWN_LIST_PATH.read_text(encoding="utf-8-sig")
)


def is_report_slug_taken_down(report_slug: str) -> bool:
    return get_normalised_report_slug(report_slug) in _TAKEN_DOWN_REPORT_SLUGS


def is_report_id_taken_down(report_id: str) -> bool:
    return is_report_slug_taken_down(report_id)
