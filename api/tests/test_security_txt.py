import shutil
from pathlib import Path

import pytest
from fastapi import status
from fastapi.testclient import TestClient
from starlette.applications import Starlette
from starlette.routing import Mount

from middleware import frontend
from services import preview as preview_service

_SECURITY_TXT_PATH = "/.well-known/security.txt"
_PUBLIC_SECURITY_TXT = (
    Path(__file__).parents[2] / "app" / "public" / ".well-known" / "security.txt"
)


@pytest.fixture
def frontend_client(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> TestClient:
    (tmp_path / "index.html").write_text("<html><head></head></html>")
    (tmp_path / ".well-known").mkdir()
    shutil.copy(_PUBLIC_SECURITY_TXT, tmp_path / ".well-known" / "security.txt")
    monkeypatch.setattr(
        frontend,
        "_get_page_preview",
        lambda path, ordinal, anchor: preview_service.get_not_found_preview(),
    )
    return TestClient(
        Starlette(
            routes=[Mount("/", frontend.FrontendFiles(tmp_path, None), name="frontend")]
        )
    )


def test_security_txt_answers_the_file_as_text_not_the_page(
    frontend_client: TestClient,
) -> None:
    response = frontend_client.get(_SECURITY_TXT_PATH)

    assert response.status_code == status.HTTP_200_OK
    assert response.headers["content-type"].startswith("text/plain")
    assert response.text.startswith("Contact: mailto:royceinbox@hotmail.com\n")
    assert "<html" not in response.text
