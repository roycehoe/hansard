from urllib.parse import quote

_SSO_ACT_URL = "https://sso.agc.gov.sg/Act/"
_NO_SAFE_CHARACTERS = ""


def get_act_sso_url(sso_code: str) -> str:
    return f"{_SSO_ACT_URL}{quote(sso_code, safe=_NO_SAFE_CHARACTERS)}"
