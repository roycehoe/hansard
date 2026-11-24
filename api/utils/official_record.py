from typing import Optional
from urllib.parse import quote

from utils.report_slug import get_report_slug
from utils.site_address import NO_SAFE_CHARACTERS

_SPRS_SEARCH_URL = "https://sprs.parl.gov.sg/search"
_SPRS3_TOPIC_URL = f"{_SPRS_SEARCH_URL}/#/sprs3topic"
_SPRS2_TOPIC_URL = f"{_SPRS_SEARCH_URL}/#/topic"
_SPRS3_REPORT_VERSION = "sprs3"
_REPORT_ID_QUERY_PREFIX = "?reportid="


def get_official_record_url(
    report_id: str, report_version: str, html_file_name: Optional[str]
) -> str:
    if report_version == _SPRS3_REPORT_VERSION:
        return f"{_SPRS3_TOPIC_URL}{_REPORT_ID_QUERY_PREFIX}{quote(get_report_slug(report_id), safe=NO_SAFE_CHARACTERS)}"
    if html_file_name is None:
        return _SPRS_SEARCH_URL
    return f"{_SPRS2_TOPIC_URL}{_REPORT_ID_QUERY_PREFIX}{quote(html_file_name, safe=NO_SAFE_CHARACTERS)}"
