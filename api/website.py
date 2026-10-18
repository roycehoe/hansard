from fastapi import FastAPI

from main import app as api_app
from middleware.basic_auth import BasicAuthMiddleware
from middleware.frontend import FrontendFiles
from settings import WebsiteSettings

website_settings = WebsiteSettings()

app = FastAPI(docs_url=None, redoc_url=None, openapi_url=None)

if not website_settings.is_public_mode:
    app.add_middleware(
        BasicAuthMiddleware,
        username=website_settings.basic_auth_username,
        password=website_settings.basic_auth_password,
    )

app.mount("/api", api_app)
app.mount(
    "/",
    FrontendFiles(
        directory=website_settings.frontend_dist_path,
        site_url=website_settings.site_url,
    ),
    name="frontend",
)
