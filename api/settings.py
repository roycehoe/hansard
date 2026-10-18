from pathlib import Path
from typing import Optional, Self

from pydantic import Field, field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

_PUBLIC_MODE_ON = "true"


def _get_is_public_mode(public_mode: object) -> bool:
    return str(public_mode).strip().lower() == _PUBLIC_MODE_ON


class AppSettings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env")

    database_url: str
    takedown_report_slugs: str = ""
    is_public_mode: bool = Field(default=False, validation_alias="PUBLIC_MODE")

    @field_validator("is_public_mode", mode="before")
    @classmethod
    def parse_is_public_mode(cls, public_mode: object) -> bool:
        return _get_is_public_mode(public_mode)


class WebsiteSettings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    basic_auth_username: str = ""
    basic_auth_password: str = ""
    frontend_dist_path: Path
    site_url: Optional[str] = None
    is_public_mode: bool = Field(default=False, validation_alias="PUBLIC_MODE")

    @field_validator("is_public_mode", mode="before")
    @classmethod
    def parse_is_public_mode(cls, public_mode: object) -> bool:
        return _get_is_public_mode(public_mode)

    @model_validator(mode="after")
    def validate_basic_auth_credentials(self) -> Self:
        if self.is_public_mode:
            return self
        if self.basic_auth_username == "":
            raise ValueError(
                "BASIC_AUTH_USERNAME is required unless PUBLIC_MODE is true."
            )
        if self.basic_auth_password == "":
            raise ValueError(
                "BASIC_AUTH_PASSWORD is required unless PUBLIC_MODE is true."
            )
        return self


settings = AppSettings()
