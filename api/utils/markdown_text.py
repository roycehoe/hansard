import re

_HEADING_HASHES = re.compile(r"(?:(?<=\s)|^)#{1,6}(?=\s|$)")
_BLOCKQUOTE_MARKER = re.compile(r"^[ \t]*>+[ \t]?", re.MULTILINE)
_BULLET_MARKER = re.compile(r"^[ \t]*[-*+][ \t]+", re.MULTILINE)
_LINK = re.compile(r"!?\[([^\]]*)\]\([^)\s]*\)")
_ASTERISK_EMPHASIS = re.compile(r"(\*{1,3})(?=\S)(.+?)(?<=\S)\1", re.DOTALL)
_UNDERSCORE_EMPHASIS = re.compile(
    r"(?<!\w)(_{1,3})(?=\S)(.+?)(?<=\S)\1(?!\w)", re.DOTALL
)
_STRAY_ASTERISKS = re.compile(r"\*+")


def strip_markdown(text: str) -> str:
    plain = _BLOCKQUOTE_MARKER.sub("", text)
    plain = _BULLET_MARKER.sub("", plain)
    plain = _HEADING_HASHES.sub("", plain)
    plain = _LINK.sub(r"\1", plain)
    plain = _ASTERISK_EMPHASIS.sub(r"\2", plain)
    plain = _UNDERSCORE_EMPHASIS.sub(r"\2", plain)
    plain = _STRAY_ASTERISKS.sub("", plain)
    return " ".join(plain.split())
