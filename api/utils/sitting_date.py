from datetime import date


def get_sitting_date_text(sitting_date: date) -> str:
    return f"{sitting_date.day}-{sitting_date.month}-{sitting_date.year}"
