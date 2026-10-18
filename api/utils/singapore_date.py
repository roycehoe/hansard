from datetime import date, datetime, timedelta, timezone

_SINGAPORE_TIME_ZONE = timezone(timedelta(hours=8))


def get_singapore_date(moment: datetime) -> date:
    return moment.astimezone(_SINGAPORE_TIME_ZONE).date()
