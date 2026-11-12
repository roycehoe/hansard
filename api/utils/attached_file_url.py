from typing import Optional
from urllib.parse import quote

_SPRS_DOWNLOAD_URL = "https://sprs.parl.gov.sg/search/search/download?value="
_PATH_SAFE_CHARACTERS = "/"


def get_attached_file_url(download_value: Optional[str]) -> Optional[str]:
    if download_value is None:
        return None
    return f"{_SPRS_DOWNLOAD_URL}{quote(download_value, safe=_PATH_SAFE_CHARACTERS)}"
