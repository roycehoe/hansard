from unittest.mock import MagicMock

from services.preview import get_preview
from utils.preview_tags import get_preview_tags_html

_HOME_TITLE = "Open Hansard: search Singapore Parliament debates since 1955"


def _get_title_tag(title: str) -> str:
    return get_preview_tags_html(title, "", "website", None, "", "").split("\n")[0]


def test_the_home_page_gets_its_search_title() -> None:
    assert get_preview("/", None, None, MagicMock()).title == _HOME_TITLE


def test_a_page_not_found_keeps_the_site_name_alone() -> None:
    assert get_preview("/no-such-page", None, None, MagicMock()).title == "Open Hansard"


def test_the_home_title_gets_no_site_name_suffix() -> None:
    assert _get_title_tag(_HOME_TITLE) == f"<title>{_HOME_TITLE}</title>"


def test_a_page_title_gets_the_site_name_suffix() -> None:
    assert _get_title_tag("People") == "<title>People · Open Hansard</title>"
