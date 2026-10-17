from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class AppSettings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env")

    database_url: str


class WebsiteSettings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    basic_auth_username: str
    basic_auth_password: str
    frontend_dist_path: Path


settings = AppSettings()
