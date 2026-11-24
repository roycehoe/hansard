from datetime import date, datetime, timedelta
from typing import Optional

# NOTE: a Postgres to_date format, not a strftime one, because sitting.sitting_date is a text column
SITTING_DATE_FORMAT = "DD-MM-YYYY"
ONE_DAY = timedelta(days=1)


def get_sitting_date_text(sitting_date: date) -> str:
    return f"{sitting_date.day}-{sitting_date.month}-{sitting_date.year}"


def get_date_from_datetime(value: Optional[datetime]) -> Optional[date]:
    if value is None:
        return None
    return value.date()


def get_sitting_date_label(sitting_date: date) -> str:
    return f"{sitting_date.day} {sitting_date:%B} {sitting_date.year}"
