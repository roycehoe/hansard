from sqlalchemy import ColumnElement, func

_LOCATION_NAME_SEPARATOR_PATTERN = r"[[:space:]-]+"
_LOCATION_NAME_SUFFIX_PATTERN = r"[[:space:]](GRC|SMC)$"
_REPLACE_ALL = "g"
_CASE_INSENSITIVE = "i"


def get_folded_location_name(location_name: ColumnElement) -> ColumnElement:
    return func.lower(
        func.regexp_replace(
            func.btrim(
                func.regexp_replace(
                    location_name, _LOCATION_NAME_SEPARATOR_PATTERN, " ", _REPLACE_ALL
                )
            ),
            _LOCATION_NAME_SUFFIX_PATTERN,
            "",
            _CASE_INSENSITIVE,
        )
    )
