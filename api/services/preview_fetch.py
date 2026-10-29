import asyncio
import logging
import re
import secrets

import httpx

from settings import settings

_COUNT_PATH = "/api/v0/count"
_COUNT_TIMEOUT_SECONDS = 5
_EVENT_PATH_PREFIX = "preview-fetch/"
_MAX_PATH_BYTES = 300
_OTHER_PATH = "other"
_PATH_ENCODING = "utf-8"
_SESSION_BYTES = 16
_SITE_PATH = re.compile(
    r"/"
    r"|/coverage|/coverage/methods|/search|/researchers|/design|/palette"
    r"|/people|/people/\d+(?:-[^/]*)?"
    r"|/sittings|/sittings/\d{4}-\d{2}-\d{2}"
    r"|/reports/[^/]+"
)

_logger = logging.getLogger(__name__)
_pending_count_tasks: set[asyncio.Task[None]] = set()


def _get_counted_path(path: str) -> str:
    if len(path.encode(_PATH_ENCODING)) > _MAX_PATH_BYTES:
        return _OTHER_PATH
    if _SITE_PATH.fullmatch(path) is None:
        return _OTHER_PATH
    return path


async def _send_count(site_url: str, api_token: str, bot_name: str, path: str) -> None:
    hit = {
        "path": _EVENT_PATH_PREFIX + _get_counted_path(path).removeprefix("/"),
        "event": True,
        "ref": bot_name,
        "session": secrets.token_hex(_SESSION_BYTES),
    }
    try:
        async with httpx.AsyncClient(timeout=_COUNT_TIMEOUT_SECONDS) as client:
            response = await client.post(
                site_url.rstrip("/") + _COUNT_PATH,
                headers={"Authorization": f"Bearer {api_token}"},
                json={"no_sessions": True, "filter": [], "hits": [hit]},
            )
            response.raise_for_status()
    except httpx.HTTPError as error:
        _logger.warning(
            "GoatCounter did not count a preview fetch: %s", type(error).__name__
        )


def count_preview_fetch(bot_name: str, path: str) -> None:
    site_url = settings.goatcounter_site_url
    api_token = settings.goatcounter_api_token
    if site_url is None or api_token is None:
        return
    count_task = asyncio.get_running_loop().create_task(
        _send_count(site_url, api_token, bot_name, path)
    )
    _pending_count_tasks.add(count_task)
    count_task.add_done_callback(_pending_count_tasks.discard)
