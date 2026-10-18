from html import escape
from typing import Optional

_SITE_NAME = "Hansard"
_TITLE_SEPARATOR = " · "
_TWITTER_CARD = "summary"
_TAG_SEPARATOR = "\n    "
_PREVIEW_TAGS_START = "<!--preview-tags-->"
_PREVIEW_TAGS_END = "<!--/preview-tags-->"
_NO_MARKER = ""


def _get_page_title(title: str) -> str:
    if title == _SITE_NAME:
        return title
    return f"{title}{_TITLE_SEPARATOR}{_SITE_NAME}"


def get_preview_tags_html(
    title: str, description: str, preview_type: str, url: Optional[str]
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
        [] if url is None else [f'<meta property="og:url" content="{escape(url)}" />']
    )
    return _TAG_SEPARATOR.join([*tags, *url_tags])


def get_index_html_with_preview_tags(index_html: str, preview_tags_html: str) -> str:
    head, start_marker, rest = index_html.partition(_PREVIEW_TAGS_START)
    if start_marker == _NO_MARKER:
        return index_html
    _, end_marker, tail = rest.partition(_PREVIEW_TAGS_END)
    if end_marker == _NO_MARKER:
        return index_html
    return f"{head}{preview_tags_html}{tail}"
