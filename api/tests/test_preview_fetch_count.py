from collections import Counter
from datetime import datetime, timedelta, timezone
from pathlib import Path

import pytest
from fastapi import status
from fastapi.testclient import TestClient
from starlette.applications import Starlette
from starlette.routing import Mount

from middleware.frontend import FrontendFiles
from services import preview_fetch as preview_fetch_service

_INDEX_HTML = (
    "<html><head><!--preview-tags--><title>placeholder</title>"
    "<!--/preview-tags--></head><body></body></html>"
)
_SLACK_USER_AGENT = "Slackbot-LinkExpanding 1.0 (+https://api.slack.com/robots)"
_TELEGRAM_USER_AGENT = "TelegramBot (like TwitterBot)"
_BROWSER_USER_AGENT = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/130.0 Safari/537.36"
)
_SINGAPORE_TIME_ZONE = timezone(timedelta(hours=8))


@pytest.fixture(autouse=True)
def reset_fetch_counter(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(preview_fetch_service, "_fetch_key_to_count", Counter())


def test_a_bot_fetch_is_counted_by_date_bot_and_path(tmp_path: Path) -> None:
    (tmp_path / "index.html").write_text(_INDEX_HTML)
    client = TestClient(
        Starlette(
            routes=[Mount("/", app=FrontendFiles(directory=tmp_path, site_url=None))]
        )
    )
    before = datetime.now(_SINGAPORE_TIME_ZONE).date()

    slack_response = client.get("/coverage", headers={"User-Agent": _SLACK_USER_AGENT})
    client.get("/coverage", headers={"User-Agent": _SLACK_USER_AGENT})
    client.get("/coverage", headers={"User-Agent": _TELEGRAM_USER_AGENT})
    browser_response = client.get(
        "/coverage", headers={"User-Agent": _BROWSER_USER_AGENT}
    )

    after = datetime.now(_SINGAPORE_TIME_ZONE).date()
    fetches = preview_fetch_service.get_preview_fetches().fetches
    assert slack_response.status_code == status.HTTP_200_OK
    assert "<title>What the archive covers" in slack_response.text
    assert browser_response.status_code == status.HTTP_200_OK
    assert [(fetch.bot_name, fetch.path, fetch.fetch_count) for fetch in fetches] == [
        ("Slack", "/coverage", 2),
        ("Telegram", "/coverage", 1),
    ]
    assert all(before <= fetch.fetched_on <= after for fetch in fetches)
