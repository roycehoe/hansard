import json
import subprocess
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import pytest

from main import app

pytestmark = pytest.mark.contract

_APP_PATH = Path(__file__).resolve().parents[2] / "app"
_INTERFACES_COMMAND = ("node", "scripts/api-interfaces.ts")
_INTERFACES_TIMEOUT_SECONDS = 120
_SUCCESS_STATUS_PREFIX = "2"
_JSON_MEDIA_TYPE = "application/json"
_SCHEMA_REFERENCE_PREFIX = "#/components/schemas/"
_NULL_TYPE = "null"
_PROPERTIES_KEY = "properties"

_REPORT_INTERFACES_FILE = "src/api/reports/getReport.ts"
_SEARCH_SPEECHES_INTERFACES_FILE = "src/api/search/getSearchSpeeches.ts"
_SEARCH_REPORTS_INTERFACES_FILE = "src/api/search/getSearchReports.ts"
_SITTING_INTERFACES_FILE = "src/api/sittings/getSitting.ts"
_ALL_SITTINGS_INTERFACES_FILE = "src/api/sittings/getAllSittings.ts"
_COVERAGE_INTERFACES_FILE = "src/api/coverage/getCoverage.ts"
_PARLIAMENTS_INTERFACES_FILE = "src/api/parliaments/getAllParliaments.ts"
_ALL_PERSONS_INTERFACES_FILE = "src/api/people/getAllPersons.ts"
_PERSON_INTERFACES_FILE = "src/api/people/getPerson.ts"
_PERSON_REPORTS_INTERFACES_FILE = "src/api/people/getPersonReports.ts"
_PEOPLE_TYPES_FILE = "src/types/people/interfaces.ts"

_SCHEMA_NAME_AND_INTERFACE_KEY = (
    ("GetCoverageResponse", f"{_COVERAGE_INTERFACES_FILE}::GetCoverageResponse"),
    ("YearCoverageData", f"{_COVERAGE_INTERFACES_FILE}::YearCoverageData"),
    (
        "AttributionFiguresData",
        f"{_COVERAGE_INTERFACES_FILE}::AttributionFiguresData",
    ),
    (
        "ParliamentGroupFiguresData",
        f"{_COVERAGE_INTERFACES_FILE}::ParliamentGroupFiguresData",
    ),
    (
        "GetAllParliamentsResponse",
        f"{_PARLIAMENTS_INTERFACES_FILE}::GetAllParliamentsResponse",
    ),
    ("ParliamentData", f"{_PARLIAMENTS_INTERFACES_FILE}::ParliamentData"),
    (
        "GetRefreshResponse",
        "src/api/refresh/getRefresh.ts::GetRefreshResponse",
    ),
    (
        "GetAllPersonsResponse",
        f"{_ALL_PERSONS_INTERFACES_FILE}::GetAllPersonsResponse",
    ),
    ("PersonData", f"{_ALL_PERSONS_INTERFACES_FILE}::PersonData"),
    ("MembershipData", f"{_ALL_PERSONS_INTERFACES_FILE}::MembershipData"),
    ("GetPersonResponse", f"{_PERSON_INTERFACES_FILE}::GetPersonResponse"),
    ("PersonMembershipData", f"{_PERSON_INTERFACES_FILE}::PersonMembershipData"),
    ("ParliamentCountData", f"{_PERSON_INTERFACES_FILE}::ParliamentCountData"),
    (
        "GetPersonReportsResponse",
        f"{_PERSON_REPORTS_INTERFACES_FILE}::GetPersonReportsResponse",
    ),
    ("PersonReportData", f"{_PERSON_REPORTS_INTERFACES_FILE}::PersonReportData"),
    ("PartyAffiliationData", f"{_PEOPLE_TYPES_FILE}::PartyAffiliationData"),
    (
        "PartyAffiliationSourceReportData",
        f"{_PEOPLE_TYPES_FILE}::PartyAffiliationSourceReportData",
    ),
    ("GetReportResponse", f"{_REPORT_INTERFACES_FILE}::GetReportResponse"),
    ("ReferencedReportData", f"{_REPORT_INTERFACES_FILE}::ReferencedReportData"),
    ("SpeechData", f"{_REPORT_INTERFACES_FILE}::SpeechData"),
    ("SpeechLinkData", f"{_REPORT_INTERFACES_FILE}::SpeechLinkData"),
    (
        "GetReportMatchedWordsResponse",
        "src/api/reports/getReportMatchedWords.ts::GetReportMatchedWordsResponse",
    ),
    (
        "SearchSpeechesResponse",
        f"{_SEARCH_SPEECHES_INTERFACES_FILE}::GetSearchSpeechesResponse",
    ),
    (
        "SpeechMatchData",
        f"{_SEARCH_SPEECHES_INTERFACES_FILE}::SpeechMatchData",
    ),
    (
        "SearchReportsResponse",
        f"{_SEARCH_REPORTS_INTERFACES_FILE}::GetSearchReportsResponse",
    ),
    ("ReportMatchData", f"{_SEARCH_REPORTS_INTERFACES_FILE}::ReportMatchData"),
    ("GetSittingResponse", f"{_SITTING_INTERFACES_FILE}::GetSittingResponse"),
    ("SittingReportData", f"{_SITTING_INTERFACES_FILE}::SittingReportData"),
    ("AttendanceData", f"{_SITTING_INTERFACES_FILE}::AttendanceData"),
    (
        "GetAllSittingsResponse",
        f"{_ALL_SITTINGS_INTERFACES_FILE}::GetAllSittingsResponse",
    ),
    ("SittingData", f"{_ALL_SITTINGS_INTERFACES_FILE}::SittingData"),
)

# NOTE: the frontend never calls /parties, /preview-fetches or /search-counts, so these have no interface.
_SCHEMAS_WITHOUT_FRONTEND_INTERFACE = (
    "GetAllPartiesResponse",
    "GetPreviewFetchesResponse",
    "PreviewFetchData",
    "GetSearchCountsResponse",
    "SearchCountData",
)


@dataclass(frozen=True)
class ContractDifference:
    field: str
    schema: str
    interface: str
    kind: str


def _get_referenced_schema_names(node: Any) -> set[str]:
    if isinstance(node, dict):
        reference = node.get("$ref")
        names = (
            {reference.removeprefix(_SCHEMA_REFERENCE_PREFIX)}
            if isinstance(reference, str)
            else set()
        )
        for value in node.values():
            names |= _get_referenced_schema_names(value)
        return names
    if isinstance(node, list):
        return set().union(*(_get_referenced_schema_names(item) for item in node))
    return set()


def _get_response_schemas() -> dict[str, dict[str, Any]]:
    openapi_schema = app.openapi()
    name_to_schema = openapi_schema["components"]["schemas"]
    names_to_visit = set()
    for operations in openapi_schema["paths"].values():
        for operation in operations.values():
            for status_code, response in operation["responses"].items():
                if status_code.startswith(_SUCCESS_STATUS_PREFIX):
                    body = response.get("content", {}).get(_JSON_MEDIA_TYPE, {})
                    names_to_visit |= _get_referenced_schema_names(body)
    response_names: set[str] = set()
    while names_to_visit:
        name = names_to_visit.pop()
        response_names.add(name)
        names_to_visit |= _get_referenced_schema_names(name_to_schema[name]) - (
            response_names
        )
    return {
        name: name_to_schema[name]
        for name in sorted(response_names)
        if _PROPERTIES_KEY in name_to_schema[name]
    }


def _is_nullable(property_schema: dict[str, Any]) -> bool:
    return property_schema.get("type") == _NULL_TYPE or any(
        _is_nullable(member) for member in property_schema.get("anyOf", ())
    )


@pytest.fixture(scope="module")
def interface_key_to_interface() -> dict[str, dict[str, Any]]:
    completed = subprocess.run(
        _INTERFACES_COMMAND,
        cwd=_APP_PATH,
        capture_output=True,
        text=True,
        timeout=_INTERFACES_TIMEOUT_SECONDS,
        check=False,
    )
    assert completed.returncode == 0, completed.stderr
    return json.loads(completed.stdout)


def test_every_response_schema_has_a_mapping() -> None:
    mapped_names = {name for name, _ in _SCHEMA_NAME_AND_INTERFACE_KEY}
    unmapped_names = (
        set(_get_response_schemas())
        - mapped_names
        - set(_SCHEMAS_WITHOUT_FRONTEND_INTERFACE)
    )

    assert not unmapped_names, f"response schemas with no mapping: {unmapped_names}"


def test_every_mapping_points_at_a_schema_and_an_interface(
    interface_key_to_interface: dict[str, dict[str, Any]],
) -> None:
    response_names = set(_get_response_schemas())
    stale_entries = [
        (name, interface_key)
        for name, interface_key in _SCHEMA_NAME_AND_INTERFACE_KEY
        if name not in response_names or interface_key not in interface_key_to_interface
    ]
    stale_names = [
        name
        for name in _SCHEMAS_WITHOUT_FRONTEND_INTERFACE
        if name not in response_names
    ]

    assert not stale_entries, f"mappings with no schema or interface: {stale_entries}"
    assert not stale_names, f"unmapped names with no schema: {stale_names}"


def test_response_schemas_match_frontend_interfaces(
    interface_key_to_interface: dict[str, dict[str, Any]],
) -> None:
    schema_name_to_schema = _get_response_schemas()
    differences = []
    for schema_name, interface_key in _SCHEMA_NAME_AND_INTERFACE_KEY:
        property_name_to_schema = schema_name_to_schema[schema_name][_PROPERTIES_KEY]
        field_name_to_field = interface_key_to_interface[interface_key]["fields"]
        interface_name = interface_key.split("::")[-1]
        for field in sorted(
            property_name_to_schema.keys() - field_name_to_field.keys()
        ):
            differences.append(
                ContractDifference(
                    field, schema_name, interface_name, "missing_in_interface"
                )
            )
        for field in sorted(
            field_name_to_field.keys() - property_name_to_schema.keys()
        ):
            differences.append(
                ContractDifference(
                    field, schema_name, interface_name, "missing_in_schema"
                )
            )
        for field in sorted(
            property_name_to_schema.keys() & field_name_to_field.keys()
        ):
            if (
                _is_nullable(property_name_to_schema[field])
                != field_name_to_field[field]["nullable"]
            ):
                differences.append(
                    ContractDifference(
                        field, schema_name, interface_name, "nullable_differs"
                    )
                )

    report = "\n".join(
        f"{difference.field}\t{difference.schema}\t{difference.interface}\t{difference.kind}"
        for difference in differences
    )
    assert not differences, f"field\tschema\tinterface\tkind\n{report}"
