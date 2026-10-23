from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from threading import Thread

from fastapi import FastAPI

from main import app as api_app
from middleware.basic_auth import BasicAuthMiddleware
from middleware.cache_fill import (
    fill_coverage_parliament_and_sitemap_caches_after_each_refresh,
)
from middleware.frontend import FrontendFiles
from middleware.takedown import TakedownMiddleware
from routers import sitemap
from settings import WebsiteSettings

website_settings = WebsiteSettings()


# NOTE: the fill runs on a thread so the platform's health check never waits for it; the lifespan is here, not in main.py, because Starlette does not run a mounted app's lifespan
@asynccontextmanager
async def _fill_caches_at_startup(_: FastAPI) -> AsyncIterator[None]:
    Thread(
        target=fill_coverage_parliament_and_sitemap_caches_after_each_refresh,
        daemon=True,
    ).start()
    yield


app = FastAPI(
    docs_url=None,
    redoc_url=None,
    openapi_url=None,
    lifespan=_fill_caches_at_startup,
)

app.add_middleware(
    TakedownMiddleware,
    frontend_dist_path=website_settings.frontend_dist_path,
)

if not website_settings.is_public_mode:
    app.add_middleware(
        BasicAuthMiddleware,
        username=website_settings.basic_auth_username,
        password=website_settings.basic_auth_password,
    )

app.include_router(sitemap.router)
app.mount("/api", api_app)
app.mount(
    "/",
    FrontendFiles(
        directory=website_settings.frontend_dist_path,
        site_url=website_settings.site_url,
    ),
    name="frontend",
)
