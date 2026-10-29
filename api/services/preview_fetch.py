import asyncio
import logging
import re

import httpx

from gateway.analytics import send_analytics_event
from settings import settings

_EVENT_PATH_PREFIX = "preview-fetch/"
_MAX_PATH_BYTES = 300
_OTHER_PATH = "other"
_PATH_ENCODING = "utf-8"
_SITE_PATH = re.compile(
    r"/"
    r"|/coverage|/coverage/methods|/search|/researchers|/design|/palette"
    r"|/people|/people/\d+(?:-[^/]*)?"
    r"|/sittings|/sittings/\d{4}-\d{2}-\d{2}"
    r"|/reports/[^/]+"
)

logger = logging.getLogger(__name__)
_pending_count_tasks: set[asyncio.Task[None]] = set()


def _get_counted_path(path: str) -> str:
    if len(path.encode(_PATH_ENCODING)) > _MAX_PATH_BYTES:
        return _OTHER_PATH
    if _SITE_PATH.fullmatch(path) is None:
        return _OTHER_PATH
    return path


async def _send_count(site_url: str, api_token: str, bot_name: str, path: str) -> None:
    event_path = _EVENT_PATH_PREFIX + _get_counted_path(path).removeprefix("/")
    try:
        await send_analytics_event(site_url, api_token, event_path, bot_name)
    except httpx.HTTPError as error:
        logger.warning("goatcounter count failed error=%s", type(error).__name__)


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
