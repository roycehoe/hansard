_REPORT_ID_SUFFIX = "#"


def get_report_slug(report_id: str) -> str:
    return report_id.rstrip(_REPORT_ID_SUFFIX)


# NOTE: the scraper removed these duplicate reports (its data/excluded_report_ids.json), so a shared link opens the kept copy.
def _get_kept_report_slug(report_slug: str) -> str:
    if report_slug == "00069034-ZZ.00050649-ZZ_1#id006_19611130_S0005_T00052-motion":
        return "00069034-ZZ.00050644-ZZ_1#id002_19611130_S0006_T00051-speaker"
    if report_slug == "00004663-WA.00000937-WA_1":
        return "00075515-WA.00070101-ZZ_1"
    if report_slug == "00075693-WA.00074705-ZZ_1":
        return "00004818-WA.00004561-WA_1"
    if report_slug == "00077053-WA.00077057-WA_12#budget":
        return "00077053-WA.00077058-WA_11#budget"
    if report_slug == "00169088-ZZ.00051388-ZZ_1#id013_19630409_S0003_T0004-budget":
        return "#013_19630409_S0003_T0004.htm-budget"
    if report_slug == "00004688-WA.00001507-WA_1":
        return "00075539-WA.00070689-ZZ_1"
    if (
        report_slug
        == "00076180-WA.00076632-WA_8#id-f8ee1819-646d-47b3-9e05-bdbbed80eae6"
    ):
        return "00076180-WA.00076648-WA_8#id-dad3aad4-6dab-44be-b752-a2657c252087"
    if report_slug == "00004740-WA.00002521-WA_1":
        return "00075603-WA.00072129-ZZ_1"
    if report_slug == "#032_10031016_S0003_T0009.html-":
        return "#030_20031016_S0003_T0008.html-"
    if report_slug == "#018_10031016_S0004_T0002.html-":
        return "#017_20031016_S0004_T0001.html-"
    return report_slug


def get_report_id_candidates(report_slug: str) -> list[str]:
    kept_report_slug = _get_kept_report_slug(report_slug)
    return [
        kept_report_slug + _REPORT_ID_SUFFIX,
        kept_report_slug + _REPORT_ID_SUFFIX * 2,
    ]
