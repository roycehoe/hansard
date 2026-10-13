import re

_NON_ALPHANUMERIC_RUN = re.compile(r"[^a-z0-9]+")
_SLUG_SEPARATOR = "-"


def get_person_slug(canonical_name: str) -> str:
    return _NON_ALPHANUMERIC_RUN.sub(_SLUG_SEPARATOR, canonical_name.lower()).strip(
        _SLUG_SEPARATOR
    )
