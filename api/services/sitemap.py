from typing import Optional
from urllib.parse import quote

from sqlmodel import Session

from crud.person import CRUDPerson
from crud.report import CRUDReport
from exceptions.sitemap import SitemapNotFoundException
from middleware.takedown import get_taken_down_report_id_candidates
from settings import settings
from utils.person_slug import get_person_slug
from utils.report_slug import get_report_slug
from utils.sitemap_xml import get_sitemap_index_xml, get_urlset_xml

SITEMAP_INDEX_FILE_NAME = "sitemap.xml"
_MAX_URLS_PER_FILE = 20_000
_URL_SEPARATOR = "/"

# NOTE: replaced whole and never mutated, so a request thread never reads a half-written answer
_cached_file_name_to_xml: Optional[dict[str, str]] = None


def _get_file_name(kind: str, file_number: int) -> str:
    return f"sitemap-{kind}-{file_number}.xml"


def _get_kind_to_paths(session: Session) -> dict[str, list[str]]:
    sitting_dates = CRUDReport(session).get_all_sitting_dates()
    persons = CRUDPerson(session).get_all()
    report_ids = CRUDReport(session).get_all_report_ids_not_in_report_ids(
        get_taken_down_report_id_candidates()
    )
    return {
        "sittings": [
            f"/sittings/{sitting_date.date().isoformat()}"
            for sitting_date in sitting_dates
        ],
        "people": [
            f"/people/{person.id}-{get_person_slug(person.canonical_name)}"
            for person in persons
        ],
        "reports": [
            f"/reports/{quote(get_report_slug(report_id), safe='')}"
            for report_id in report_ids
        ],
    }


def _get_uncached_file_name_to_xml(site_url: str, session: Session) -> dict[str, str]:
    site_origin = site_url.rstrip(_URL_SEPARATOR)
    file_name_to_xml: dict[str, str] = {}
    for kind, paths in _get_kind_to_paths(session).items():
        for file_index, first_path_index in enumerate(
            range(0, len(paths), _MAX_URLS_PER_FILE)
        ):
            file_paths = paths[first_path_index : first_path_index + _MAX_URLS_PER_FILE]
            file_name_to_xml[_get_file_name(kind, file_index + 1)] = get_urlset_xml(
                [f"{site_origin}{path}" for path in file_paths]
            )
    file_name_to_xml[SITEMAP_INDEX_FILE_NAME] = get_sitemap_index_xml(
        [f"{site_origin}/{file_name}" for file_name in file_name_to_xml]
    )
    return file_name_to_xml


def fill_sitemap_cache(session: Session) -> None:
    global _cached_file_name_to_xml
    if settings.site_url is None:
        return
    _cached_file_name_to_xml = _get_uncached_file_name_to_xml(
        settings.site_url, session
    )


def get_sitemap_xml(file_name: str, session: Session) -> str:
    global _cached_file_name_to_xml
    if settings.site_url is None:
        raise SitemapNotFoundException
    cached_file_name_to_xml = _cached_file_name_to_xml
    if cached_file_name_to_xml is None:
        cached_file_name_to_xml = _get_uncached_file_name_to_xml(
            settings.site_url, session
        )
        _cached_file_name_to_xml = cached_file_name_to_xml
    xml = cached_file_name_to_xml.get(file_name)
    if xml is None:
        raise SitemapNotFoundException
    return xml
