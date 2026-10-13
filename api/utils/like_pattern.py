_LIKE_ESCAPE = "\\"
_LIKE_WILDCARDS = ("%", "_")


def escape_like_pattern(text: str) -> str:
    escaped = text.replace(_LIKE_ESCAPE, _LIKE_ESCAPE * 2)
    for wildcard in _LIKE_WILDCARDS:
        escaped = escaped.replace(wildcard, _LIKE_ESCAPE + wildcard)
    return escaped
