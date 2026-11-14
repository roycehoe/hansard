import re
from dataclasses import dataclass
from datetime import date
from html import escape
from itertools import accumulate
from typing import Optional
from urllib.parse import quote, urlencode

from utils.sitting_date import get_sitting_date_label

_MAX_QUOTE_LENGTH = 900
_SENTENCE_END = re.compile(r"[.?!][\"')\]]?(?=\s)")
_WORD_SEPARATOR = " "
_ELLIPSIS = "…"
_INLINE_MARKUP = re.compile(r"(\*\*[^*]+\*\*|_[^_]+_)")
_BOLD_MARKER = "**"
_ITALIC_MARKER = "_"
_BOLD_TAG_NAME = "strong"
_ITALIC_TAG_NAME = "em"
_NOT_FOUND_INDEX = -1
_NO_SPEAKER_LABEL = ""
_NO_ANCHOR = ""
_SPEECH_ORDINAL_PARAMETER = "s"
_SPEECH_ANCHOR_PARAMETER = "q"
_SITE_NAME = "Open Hansard"
_NEW_TAB_LABEL = " (opens in a new tab)"
# NOTE: the light theme's foreground, muted foreground, separator and link from app/src/palette.css. The page has no background of its own, so the host page's shows through, and no dark theme, because the host's background stays light when the reader's system is dark. A host frame has the fixed height the copied code set, so in a frame too short for the paragraph the quote scrolls and the source line stays in view
_EMBED_STYLE = (
    "*{box-sizing:border-box}"
    "html,body{height:100%;margin:0;background:transparent}"
    "body{padding:1px;color:#281c19;font-family:ui-serif,Georgia,serif;"
    "font-size:16px;line-height:28px;overflow-wrap:anywhere}"
    "figure,blockquote,p{margin:0}"
    "figure{display:flex;flex-direction:column;max-height:100%}"
    ".quote{flex:0 1 auto;min-height:0;overflow-y:auto;"
    "border-left:2px solid #e1bfae;padding-left:16px}"
    "strong{font-weight:600}"
    ".notice{font-family:ui-sans-serif,system-ui,sans-serif}"
    ".note{color:#674837;font-size:14px;line-height:24px}"
    "figcaption{flex:none;margin-top:8px;padding-left:18px;color:#674837;"
    "font-family:ui-sans-serif,system-ui,sans-serif;font-size:14px;line-height:24px}"
    "a{color:#6d3e31;text-decoration:none;text-underline-offset:2px}"
    "a:hover,a:focus-visible{text-decoration:underline;outline:none}"
    ".sr-only{position:absolute;width:1px;height:1px;overflow:hidden;"
    "clip-path:inset(50%);white-space:nowrap}"
)


@dataclass(frozen=True)
class _TranscriptPart:
    text: str
    tag_name: Optional[str]


def _get_transcript_part(markup_part: str) -> _TranscriptPart:
    if (
        len(markup_part) > len(_BOLD_MARKER) * 2
        and markup_part.startswith(_BOLD_MARKER)
        and markup_part.endswith(_BOLD_MARKER)
    ):
        return _TranscriptPart(
            markup_part[len(_BOLD_MARKER) : -len(_BOLD_MARKER)], _BOLD_TAG_NAME
        )
    if (
        len(markup_part) > len(_ITALIC_MARKER) * 2
        and markup_part.startswith(_ITALIC_MARKER)
        and markup_part.endswith(_ITALIC_MARKER)
    ):
        return _TranscriptPart(
            markup_part[len(_ITALIC_MARKER) : -len(_ITALIC_MARKER)], _ITALIC_TAG_NAME
        )
    return _TranscriptPart(markup_part, None)


# NOTE: the same bold and italic markup that parseTranscriptInline in app/src/lib/transcript.ts draws on the report page
def _get_transcript_parts(transcript: str) -> list[_TranscriptPart]:
    return [
        _get_transcript_part(markup_part)
        for markup_part in _INLINE_MARKUP.split(transcript)
        if markup_part != ""
    ]


def _get_quote_length(plain_text: str) -> int:
    if len(plain_text) <= _MAX_QUOTE_LENGTH:
        return len(plain_text)
    sentence_ends = [
        match.end()
        for match in _SENTENCE_END.finditer(plain_text)
        if match.end() <= _MAX_QUOTE_LENGTH
    ]
    if sentence_ends:
        return sentence_ends[-1]
    last_word_end = plain_text.rfind(_WORD_SEPARATOR, 0, _MAX_QUOTE_LENGTH + 1)
    if last_word_end == _NOT_FOUND_INDEX:
        return _MAX_QUOTE_LENGTH
    return last_word_end


def _get_transcript_part_html(text: str, tag_name: Optional[str]) -> str:
    if tag_name is None:
        return escape(text)
    return f"<{tag_name}>{escape(text)}</{tag_name}>"


# NOTE: the cut runs on the text after the markup is read, so a cut inside a bold or italic run still closes its tag
def _get_quote_html(transcript: str) -> str:
    parts = _get_transcript_parts(transcript)
    plain_text = "".join(part.text for part in parts)
    quote_length = _get_quote_length(plain_text)
    part_starts = accumulate((len(part.text) for part in parts), initial=0)
    part_htmls = [
        _get_transcript_part_html(part.text[: quote_length - part_start], part.tag_name)
        for part, part_start in zip(parts, part_starts)
        if part_start < quote_length
    ]
    if quote_length == len(plain_text):
        return "".join(part_htmls)
    return f"{''.join(part_htmls)}{_WORD_SEPARATOR}{_ELLIPSIS}"


def _get_speech_path(report_slug: str, ordinal: int, anchor: str) -> str:
    report_path = f"/reports/{quote(report_slug, safe='')}"
    if anchor == _NO_ANCHOR:
        return f"{report_path}#s{ordinal}"
    query = urlencode(
        {_SPEECH_ORDINAL_PARAMETER: ordinal, _SPEECH_ANCHOR_PARAMETER: anchor}
    )
    return f"{report_path}?{query}"


def _get_embed_document_html(title: str, body_html: str) -> str:
    return (
        '<!doctype html><html lang="en"><head><meta charset="utf-8">'
        '<meta name="viewport" content="width=device-width, initial-scale=1">'
        '<meta name="robots" content="noindex">'
        f"<title>{escape(title)}</title><style>{_EMBED_STYLE}</style></head>"
        f"<body>{body_html}</body></html>"
    )


def _get_speaker_label_html(speaker_label: str) -> str:
    if speaker_label == _NO_SPEAKER_LABEL:
        return ""
    return f"<strong>{escape(speaker_label)}</strong>: "


def get_speech_embed_html(
    report_title: str,
    sitting_date: date,
    report_slug: str,
    ordinal: int,
    anchor: str,
    speaker_label: str,
    transcript: str,
) -> str:
    speech_path = _get_speech_path(report_slug, ordinal, anchor)
    sitting_date_label = get_sitting_date_label(sitting_date)
    return _get_embed_document_html(
        report_title,
        "<figure>"
        '<blockquote class="quote"><p>'
        f"{_get_speaker_label_html(speaker_label)}"
        f"{_get_quote_html(transcript)}"
        "</p></blockquote>"
        f'<figcaption><a href="{escape(speech_path)}" target="_blank" '
        f'rel="nofollow noopener">Hansard, {escape(sitting_date_label)}'
        f'<span class="sr-only">{_NEW_TAB_LABEL}</span></a>, on {_SITE_NAME}.'
        "</figcaption></figure>",
    )


def get_notice_embed_html(title: str, description: str) -> str:
    return _get_embed_document_html(
        _SITE_NAME,
        '<figure><div class="quote notice">'
        f'<p><strong>{escape(title)}</strong></p><p class="note">{escape(description)}</p>'
        f"</div><figcaption>{_SITE_NAME}</figcaption></figure>",
    )
