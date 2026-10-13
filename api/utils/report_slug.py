_REPORT_ID_SUFFIX = "#"


def get_report_slug(report_id: str) -> str:
    return report_id.rstrip(_REPORT_ID_SUFFIX)


def get_report_id_candidates(report_slug: str) -> tuple[str, str]:
    return (report_slug + _REPORT_ID_SUFFIX, report_slug + _REPORT_ID_SUFFIX * 2)
