import secrets

import httpx

_COUNT_PATH = "/api/v0/count"
_COUNT_TIMEOUT_SECONDS = 5
_SESSION_BYTES = 16


async def send_analytics_event(
    site_url: str, api_token: str, path: str, referrer: str
) -> None:
    hit = {
        "path": path,
        "event": True,
        "ref": referrer,
        "session": secrets.token_hex(_SESSION_BYTES),
    }
    async with httpx.AsyncClient(timeout=_COUNT_TIMEOUT_SECONDS) as client:
        response = await client.post(
            site_url.rstrip("/") + _COUNT_PATH,
            headers={"Authorization": f"Bearer {api_token}"},
            json={"no_sessions": True, "filter": [], "hits": [hit]},
        )
        response.raise_for_status()
