from pathlib import Path

import pytest
from fastapi import status
from fastapi.testclient import TestClient
from starlette.applications import Starlette
from starlette.routing import Mount

from middleware import frontend

_ROUTES_PATH = Path(__file__).resolve().parents[2] / "app" / "src" / "routes"
_ROOT_ROUTE_STEM = "__root"
_DYNAMIC_SEGMENT_MARK = "$"
_INDEX_SEGMENT = "index"
_STEM_SEPARATOR = "."
_URL_SEPARATOR = "/"


def _get_static_route_paths() -> list[str]:
    paths = []
    for route_file in sorted(_ROUTES_PATH.rglob("*.tsx")):
        stem = route_file.relative_to(_ROUTES_PATH).with_suffix("").as_posix()
        if stem == _ROOT_ROUTE_STEM or _DYNAMIC_SEGMENT_MARK in stem:
            continue
        segments = [
            segment
            for segment in stem.replace(_URL_SEPARATOR, _STEM_SEPARATOR).split(
                _STEM_SEPARATOR
            )
            if segment != _INDEX_SEGMENT
        ]
        paths.append(_URL_SEPARATOR + _URL_SEPARATOR.join(segments))
    return paths


@pytest.fixture
def frontend_client(tmp_path: Path) -> TestClient:
    (tmp_path / "index.html").write_text("<html><head></head></html>")
    return TestClient(
        Starlette(
            routes=[Mount("/", frontend.FrontendFiles(tmp_path, None), name="frontend")]
        )
    )


def test_the_routes_folder_has_static_routes() -> None:
    assert _get_static_route_paths()


@pytest.mark.parametrize("path", _get_static_route_paths())
def test_every_static_client_route_answers_200(
    frontend_client: TestClient, path: str
) -> None:
    assert frontend_client.get(path).status_code == status.HTTP_200_OK


def test_an_unknown_path_answers_404(frontend_client: TestClient) -> None:
    assert frontend_client.get("/no-such-page-xyz").status_code == (
        status.HTTP_404_NOT_FOUND
    )
