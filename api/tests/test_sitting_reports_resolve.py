import random
from urllib.parse import quote

import pytest
from fastapi import status
from fastapi.testclient import TestClient

pytestmark = pytest.mark.database

_SAMPLE_SEED = 20261026
_SITTING_SAMPLE_SIZE = 20


def _get_all_sitting_dates(api_client: TestClient) -> list[str]:
    parliaments = api_client.get("/parliaments").json()["parliaments"]
    return [
        sitting["sitting_date"]
        for parliament in parliaments
        for sitting in api_client.get(
            "/sittings", params={"parliament_number": parliament["parliament_number"]}
        ).json()["sittings"]
    ]


def test_every_report_in_a_sample_of_sittings_resolves(api_client: TestClient) -> None:
    sitting_dates = _get_all_sitting_dates(api_client)
    assert len(sitting_dates) >= _SITTING_SAMPLE_SIZE

    sampled_sitting_dates = random.Random(_SAMPLE_SEED).sample(
        sorted(sitting_dates), _SITTING_SAMPLE_SIZE
    )

    failures: list[str] = []
    checked_report_count = 0
    for sitting_date in sampled_sitting_dates:
        sitting_response = api_client.get(f"/sittings/{sitting_date}")
        if sitting_response.status_code != status.HTTP_200_OK:
            failures.append(
                f"sitting {sitting_date} answered {sitting_response.status_code}"
            )
            continue
        for report in sitting_response.json()["reports"]:
            report_slug = report["report_slug"]
            checked_report_count += 1
            report_response = api_client.get(f"/reports/{quote(report_slug, safe='')}")
            if report_response.status_code != status.HTTP_200_OK:
                failures.append(
                    f"report {report_slug} answered {report_response.status_code}"
                )
                continue
            report_body = report_response.json()
            if report_body["report_slug"] != report_slug:
                failures.append(
                    f"report {report_slug} answered slug {report_body['report_slug']}"
                )
            if report_body["sitting_date"] != sitting_date:
                failures.append(
                    f"report {report_slug} answered date {report_body['sitting_date']}, not {sitting_date}"
                )
    assert checked_report_count > 0
    assert failures == []
