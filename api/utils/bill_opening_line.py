import re
from datetime import date
from typing import Optional

_RESUMED_WORD = re.compile(r"resum", re.IGNORECASE)
_OTHER_PROCEEDING = re.compile(r"committee|supply|sitting resumed|third", re.IGNORECASE)
_PRINTED_DATE = re.compile(
    r"[\[(]\s*(\d{1,2})(?:st|nd|rd|th)?\s+([A-Za-z]+)[.,]?\s*(\d{4})?\s*[\])]"
)


def _get_day_month_label(
    day: str, month: str, year: Optional[str], sitting_year: int
) -> str:
    if year is None or int(year) == sitting_year:
        return f"{day} {month}"
    return f"{day} {month} {year}"


def is_resumed_second_reading_line(line: str) -> bool:
    return (
        _RESUMED_WORD.search(line) is not None
        and _OTHER_PROCEEDING.search(line) is None
    )


def get_resumed_from_label(
    line: str, earlier_sitting_date: Optional[date], sitting_year: int
) -> Optional[str]:
    printed_date = _PRINTED_DATE.search(line)
    if printed_date is not None:
        return _get_day_month_label(
            printed_date.group(1),
            printed_date.group(2),
            printed_date.group(3),
            sitting_year,
        )
    if earlier_sitting_date is None:
        return None
    return _get_day_month_label(
        str(earlier_sitting_date.day),
        f"{earlier_sitting_date:%B}",
        str(earlier_sitting_date.year),
        sitting_year,
    )
