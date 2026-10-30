from dataclasses import dataclass
from datetime import date
from typing import Optional
from xml.sax.saxutils import escape

_XML_DECLARATION = '<?xml version="1.0" encoding="UTF-8"?>'
_SITEMAP_NAMESPACE = "http://www.sitemaps.org/schemas/sitemap/0.9"
_NO_LAST_MODIFIED = ""


@dataclass(frozen=True)
class SitemapUrl:
    url: str
    last_modified_date: Optional[date]


def _get_last_modified_xml(last_modified_date: Optional[date]) -> str:
    if last_modified_date is None:
        return _NO_LAST_MODIFIED
    return f"<lastmod>{last_modified_date.isoformat()}</lastmod>"


def _get_url_xml(sitemap_url: SitemapUrl) -> str:
    last_modified_xml = _get_last_modified_xml(sitemap_url.last_modified_date)
    return f"<url><loc>{escape(sitemap_url.url)}</loc>{last_modified_xml}</url>"


def get_urlset_xml(sitemap_urls: list[SitemapUrl]) -> str:
    entries = "".join(_get_url_xml(sitemap_url) for sitemap_url in sitemap_urls)
    return f'{_XML_DECLARATION}<urlset xmlns="{_SITEMAP_NAMESPACE}">{entries}</urlset>'


def get_sitemap_index_xml(sitemap_urls: list[str]) -> str:
    entries = "".join(
        f"<sitemap><loc>{escape(sitemap_url)}</loc></sitemap>"
        for sitemap_url in sitemap_urls
    )
    return f'{_XML_DECLARATION}<sitemapindex xmlns="{_SITEMAP_NAMESPACE}">{entries}</sitemapindex>'
