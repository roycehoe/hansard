import re
from typing import Optional

_GROUP_NAME = re.compile(
    r"Parliaments (?P<range_first>\d+) to (?P<range_last>\d+)|Parliament (?P<single>\d+)"
)


def get_first_parliament_number(group_name: str) -> Optional[int]:
    group_match = _GROUP_NAME.fullmatch(group_name)
    if group_match is None:
        return None
    return int(group_match.group("range_first") or group_match.group("single"))


def get_last_parliament_number(group_name: str) -> Optional[int]:
    group_match = _GROUP_NAME.fullmatch(group_name)
    if group_match is None:
        return None
    return int(group_match.group("range_last") or group_match.group("single"))
