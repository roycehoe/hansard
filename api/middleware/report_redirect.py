import re
from typing import Optional
from urllib.parse import quote

from sqlalchemy.exc import SQLAlchemyError
from sqlmodel import Session

from database.engine import engine
from services import report as report_service
from utils.site_address import QUERY_SEPARATOR, URL_SEPARATOR

_REPORT_PATH = re.compile(r"^/reports/([^/]+)$")
_NO_QUERY = ""


def _get_report_slug_of_old_address(requested_slug: str) -> Optional[str]:
    try:
        with Session(engine) as session:
            return report_service.get_report_slug_of_old_address(
                requested_slug, session
            )
    except SQLAlchemyError:
        return None
    except ValueError:
        return None


def get_old_report_address_url(path: str, query: str) -> Optional[str]:
    report_match = _REPORT_PATH.match(path.rstrip(URL_SEPARATOR))
    if report_match is None:
        return None
    report_slug = _get_report_slug_of_old_address(report_match.group(1))
    if report_slug is None:
        return None
    report_path = f"/reports/{quote(report_slug, safe='')}"
    if query == _NO_QUERY:
        return report_path
    return report_path + QUERY_SEPARATOR + query
