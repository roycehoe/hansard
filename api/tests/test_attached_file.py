from typing import Optional

import pytest
from fastapi.testclient import TestClient

from exceptions.base import ERRORS, ErrorCode
from settings import settings
from utils.attached_file_url import get_attached_file_url

_GATE_SETTING_NAME = "is_unreleased_endpoints_enabled"
_ATTACHED_FILE_PATHS = (
    "/reports/a/attached-files",
    "/sittings/2020-01-01/attached-files",
)
_DOWNLOAD_URL_PREFIX = "https://sprs.parl.gov.sg/search/search/download?value="


@pytest.mark.parametrize("path", _ATTACHED_FILE_PATHS)
def test_an_attached_file_endpoint_answers_404_while_the_setting_is_off(
    api_client: TestClient, monkeypatch: pytest.MonkeyPatch, path: str
) -> None:
    monkeypatch.setattr(settings, _GATE_SETTING_NAME, False)

    response = api_client.get(path)

    assert response.status_code == ERRORS[ErrorCode.ENDPOINT_NOT_FOUND].status_code
    assert response.json()["detail"]["error_code"] == ErrorCode.ENDPOINT_NOT_FOUND


@pytest.mark.parametrize(
    ("download_value", "expected_url"),
    [
        (None, None),
        (
            "20210301/annex-1.pdf",
            f"{_DOWNLOAD_URL_PREFIX}20210301/annex-1.pdf",
        ),
        (
            "PDFs/trailing space.pdf ",
            f"{_DOWNLOAD_URL_PREFIX}PDFs/trailing%20space.pdf%20",
        ),
        ("PDFs/café.pdf", f"{_DOWNLOAD_URL_PREFIX}PDFs/caf%C3%A9.pdf"),
        ("a&b=c#d?e", f"{_DOWNLOAD_URL_PREFIX}a%26b%3Dc%23d%3Fe"),
    ],
)
def test_the_download_address_is_built_from_the_stored_value(
    download_value: Optional[str], expected_url: Optional[str]
) -> None:
    assert get_attached_file_url(download_value) == expected_url
