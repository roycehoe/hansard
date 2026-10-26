import pytest
from fastapi import status
from fastapi.testclient import TestClient

pytestmark = pytest.mark.database

_COMPARED_FIELD_NAMES = ("person_id", "person_slug", "canonical_name")


def test_every_person_in_the_people_list_resolves(api_client: TestClient) -> None:
    people_response = api_client.get("/people")
    assert people_response.status_code == status.HTTP_200_OK
    persons = people_response.json()["persons"]
    assert persons

    failures: list[str] = []
    for person in persons:
        person_response = api_client.get(f"/people/{person['person_id']}")
        if person_response.status_code != status.HTTP_200_OK:
            failures.append(
                f"person {person['person_id']} answered {person_response.status_code}"
            )
            continue
        person_body = person_response.json()
        for field_name in _COMPARED_FIELD_NAMES:
            if person_body[field_name] != person[field_name]:
                failures.append(
                    f"person {person['person_id']} answered {field_name} {person_body[field_name]!r}, not {person[field_name]!r}"
                )
    assert failures == []
