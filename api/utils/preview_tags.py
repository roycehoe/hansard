import json
from datetime import date
from html import escape
from typing import Optional

from utils.sitting_date import get_sitting_date_label

_SITE_NAME = "Open Hansard"
_TITLE_SEPARATOR = " · "
_TWITTER_CARD = "summary"
_TAG_SEPARATOR = "\n    "
_PREVIEW_TAGS_START = "<!--preview-tags-->"
_PREVIEW_TAGS_END = "<!--/preview-tags-->"
_NO_MARKER = ""
_QUERY_SEPARATOR = "?"
_URL_SEPARATOR = "/"
_HOME_PATH = "/"
_NO_STRUCTURED_DATA = ""
_SCHEMA_CONTEXT = "https://schema.org"
_ARTICLE_TYPE = "Article"
_BREADCRUMB_LIST_TYPE = "BreadcrumbList"
_LIST_ITEM_TYPE = "ListItem"
_ORGANIZATION_TYPE = "Organization"
_WEBSITE_TYPE = "WebSite"
_HOME_BREADCRUMB_NAME = "Home"
_REPORT_BREADCRUMB_NAME = "Report"
_STRUCTURED_DATA_SCRIPT_START = '<script type="application/ld+json">'
_STRUCTURED_DATA_SCRIPT_END = "</script>"
_SCRIPT_TAG_OPENER = "<"
_ESCAPED_SCRIPT_TAG_OPENER = "\\u003c"


def _get_page_title(title: str) -> str:
    if title == _SITE_NAME:
        return title
    return f"{title}{_TITLE_SEPARATOR}{_SITE_NAME}"


def _get_structured_data_script_html(structured_data: dict) -> str:
    structured_data_json = json.dumps(structured_data).replace(
        _SCRIPT_TAG_OPENER, _ESCAPED_SCRIPT_TAG_OPENER
    )
    return f"{_STRUCTURED_DATA_SCRIPT_START}{structured_data_json}{_STRUCTURED_DATA_SCRIPT_END}"


def _get_report_structured_data(
    origin: str, path: str, report_title: str, sitting_date: date
) -> dict:
    return {
        "@context": _SCHEMA_CONTEXT,
        "@graph": [
            {
                "@type": _ARTICLE_TYPE,
                "headline": report_title,
                "datePublished": sitting_date.isoformat(),
                "url": f"{origin}{path.partition(_QUERY_SEPARATOR)[0]}",
                "publisher": {
                    "@type": _ORGANIZATION_TYPE,
                    "name": _SITE_NAME,
                    "url": f"{origin}{_HOME_PATH}",
                },
            },
            {
                "@type": _BREADCRUMB_LIST_TYPE,
                "itemListElement": [
                    {
                        "@type": _LIST_ITEM_TYPE,
                        "position": 1,
                        "name": _HOME_BREADCRUMB_NAME,
                        "item": f"{origin}{_HOME_PATH}",
                    },
                    {
                        "@type": _LIST_ITEM_TYPE,
                        "position": 2,
                        "name": get_sitting_date_label(sitting_date),
                        "item": f"{origin}/sittings/{sitting_date.isoformat()}",
                    },
                    {
                        "@type": _LIST_ITEM_TYPE,
                        "position": 3,
                        "name": _REPORT_BREADCRUMB_NAME,
                    },
                ],
            },
        ],
    }


def get_structured_data_html(
    site_url: str, path: str, report_title: str, sitting_date: Optional[date]
) -> str:
    origin = site_url.rstrip(_URL_SEPARATOR)
    if sitting_date is not None:
        return _get_structured_data_script_html(
            _get_report_structured_data(origin, path, report_title, sitting_date)
        )
    if path == _HOME_PATH:
        return _get_structured_data_script_html(
            {
                "@context": _SCHEMA_CONTEXT,
                "@type": _WEBSITE_TYPE,
                "name": _SITE_NAME,
                "url": f"{origin}{_HOME_PATH}",
            }
        )
    return _NO_STRUCTURED_DATA


def get_preview_tags_html(
    title: str,
    description: str,
    preview_type: str,
    url: Optional[str],
    structured_data_html: str,
) -> str:
    tags = [
        f"<title>{escape(_get_page_title(title))}</title>",
        f'<meta name="description" content="{escape(description)}" />',
        f'<meta property="og:title" content="{escape(title)}" />',
        f'<meta property="og:description" content="{escape(description)}" />',
        f'<meta property="og:type" content="{escape(preview_type)}" />',
        f'<meta property="og:site_name" content="{_SITE_NAME}" />',
        f'<meta name="twitter:card" content="{_TWITTER_CARD}" />',
    ]
    url_tags = (
        []
        if url is None
        else [
            f'<meta property="og:url" content="{escape(url)}" />',
            f'<link rel="canonical" href="{escape(url.partition(_QUERY_SEPARATOR)[0])}" />',
        ]
    )
    structured_data_tags = (
        [] if structured_data_html == _NO_STRUCTURED_DATA else [structured_data_html]
    )
    return _TAG_SEPARATOR.join([*tags, *url_tags, *structured_data_tags])


def get_index_html_with_preview_tags(index_html: str, preview_tags_html: str) -> str:
    head, start_marker, rest = index_html.partition(_PREVIEW_TAGS_START)
    if start_marker == _NO_MARKER:
        return index_html
    _, end_marker, tail = rest.partition(_PREVIEW_TAGS_END)
    if end_marker == _NO_MARKER:
        return index_html
    return f"{head}{preview_tags_html}{tail}"
