from typing import Optional
from urllib.parse import quote

from utils.report_slug import get_report_slug

_SPRS_SEARCH_URL = "https://sprs.parl.gov.sg/search"
_SPRS3_TOPIC_URL = f"{_SPRS_SEARCH_URL}/#/sprs3topic"
_SPRS2_TOPIC_URL = f"{_SPRS_SEARCH_URL}/#/topic"
_SPRS3_REPORT_VERSION = "sprs3"


def get_official_record_url(
    report_id: str, report_version: str, html_file_name: Optional[str]
) -> str:
    if report_version == _SPRS3_REPORT_VERSION:
        return (
            f"{_SPRS3_TOPIC_URL}?reportid={quote(get_report_slug(report_id), safe='')}"
        )
    if html_file_name is None:
        return _SPRS_SEARCH_URL
    return f"{_SPRS2_TOPIC_URL}?reportid={quote(html_file_name, safe='')}"
