from datetime import date, datetime
from typing import Optional


def get_sitting_date_text(sitting_date: date) -> str:
    return f"{sitting_date.day}-{sitting_date.month}-{sitting_date.year}"


def get_date_from_datetime(value: Optional[datetime]) -> Optional[date]:
    if value is None:
        return None
    return value.date()
