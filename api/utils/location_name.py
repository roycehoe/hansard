from sqlalchemy import ColumnElement, func

from utils.postgres_regexp import CASE_INSENSITIVE_FLAG, REPLACE_ALL_FLAG

_LOCATION_NAME_SEPARATOR_PATTERN = r"[[:space:]-]+"
_LOCATION_NAME_SUFFIX_PATTERN = r"[[:space:]](GRC|SMC)$"


def get_folded_location_name(location_name: ColumnElement) -> ColumnElement:
    return func.lower(
        func.regexp_replace(
            func.btrim(
                func.regexp_replace(
                    location_name,
                    _LOCATION_NAME_SEPARATOR_PATTERN,
                    " ",
                    REPLACE_ALL_FLAG,
                )
            ),
            _LOCATION_NAME_SUFFIX_PATTERN,
            "",
            CASE_INSENSITIVE_FLAG,
        )
    )
