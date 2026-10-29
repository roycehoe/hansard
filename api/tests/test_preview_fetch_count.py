import asyncio
import json
from pathlib import Path

import httpx
import pytest
from fastapi.testclient import TestClient
from starlette.applications import Starlette
from starlette.routing import Mount

from gateway import analytics as analytics_gateway
from middleware.frontend import FrontendFiles
from services import preview_fetch as preview_fetch_service
from settings import settings

_INDEX_HTML = (
    "<html><head><!--preview-tags--><title>placeholder</title>"
    "<!--/preview-tags--></head><body></body></html>"
)
_SLACK_USER_AGENT = "Slackbot-LinkExpanding 1.0 (+https://api.slack.com/robots)"
_BROWSER_USER_AGENT = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/130.0 Safari/537.36"
)
_SITE_URL = "https://example.goatcounter.com"
_API_TOKEN = "test-token"
_REAL_ASYNC_CLIENT = httpx.AsyncClient


def _use_goatcounter(
    monkeypatch: pytest.MonkeyPatch, status_code: int = 202
) -> list[httpx.Request]:
    requests: list[httpx.Request] = []

    def answer(request: httpx.Request) -> httpx.Response:
        requests.append(request)
        return httpx.Response(status_code)

    def build_client(**keyword_arguments: object) -> httpx.AsyncClient:
        return _REAL_ASYNC_CLIENT(
            transport=httpx.MockTransport(answer), **keyword_arguments
        )

    monkeypatch.setattr(settings, "goatcounter_site_url", _SITE_URL)
    monkeypatch.setattr(settings, "goatcounter_api_token", _API_TOKEN)
    monkeypatch.setattr(analytics_gateway.httpx, "AsyncClient", build_client)
    return requests


def _count_fetches(bot_name: str, paths: list[str]) -> None:
    async def count() -> None:
        for path in paths:
            preview_fetch_service.count_preview_fetch(bot_name, path)
        await asyncio.gather(*preview_fetch_service._pending_count_tasks)

    asyncio.run(count())


def _get_hits(requests: list[httpx.Request]) -> list[dict[str, object]]:
    return [json.loads(request.content)["hits"][0] for request in requests]


def test_a_bot_fetch_posts_one_event_hit_to_goatcounter(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    requests = _use_goatcounter(monkeypatch)

    _count_fetches("Slack", ["/reports/bill-367"])

    assert len(requests) == 1
    assert str(requests[0].url) == f"{_SITE_URL}/api/v0/count"
    assert requests[0].headers["authorization"] == f"Bearer {_API_TOKEN}"
    body = json.loads(requests[0].content)
    assert body["no_sessions"] is True
    assert body["filter"] == []
    [hit] = body["hits"]
    assert set(hit) == {"path", "event", "ref", "session"}
    assert hit["path"] == "preview-fetch/reports/bill-367"
    assert hit["event"] is True
    assert hit["ref"] == "Slack"


def test_each_hit_gets_its_own_session(monkeypatch: pytest.MonkeyPatch) -> None:
    requests = _use_goatcounter(monkeypatch)

    _count_fetches("Slack", ["/coverage", "/coverage"])

    assert len({hit["session"] for hit in _get_hits(requests)}) == 2


def test_a_path_that_is_no_site_route_or_too_long_is_counted_as_other(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    requests = _use_goatcounter(monkeypatch)

    _count_fetches("Slack", ["/" + "a" * 8000, "/reports/" + "a" * 300, "/nope", "/"])

    assert [hit["path"] for hit in _get_hits(requests)] == [
        "preview-fetch/other",
        "preview-fetch/other",
        "preview-fetch/other",
        "preview-fetch/",
    ]


def test_nothing_is_sent_while_a_setting_is_unset(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    requests = _use_goatcounter(monkeypatch)
    monkeypatch.setattr(settings, "goatcounter_api_token", None)

    _count_fetches("Slack", ["/coverage"])

    assert requests == []


def test_a_refused_count_is_logged_once_and_dropped(
    monkeypatch: pytest.MonkeyPatch, caplog: pytest.LogCaptureFixture
) -> None:
    requests = _use_goatcounter(monkeypatch, status_code=429)

    _count_fetches("Slack", ["/coverage"])

    assert len(requests) == 1
    assert [record.levelname for record in caplog.records] == ["WARNING"]
    assert _API_TOKEN not in caplog.text


def test_only_a_bot_page_fetch_reaches_the_counter(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    counted: list[tuple[str, str]] = []
    monkeypatch.setattr(
        preview_fetch_service,
        "count_preview_fetch",
        lambda bot_name, path: counted.append((bot_name, path)),
    )
    (tmp_path / "index.html").write_text(_INDEX_HTML)
    client = TestClient(
        Starlette(
            routes=[Mount("/", app=FrontendFiles(directory=tmp_path, site_url=None))]
        )
    )

    slack_response = client.get("/coverage", headers={"User-Agent": _SLACK_USER_AGENT})
    client.get("/coverage", headers={"User-Agent": _BROWSER_USER_AGENT})

    assert "<title>What the archive covers" in slack_response.text
    assert counted == [("Slack", "/coverage")]
