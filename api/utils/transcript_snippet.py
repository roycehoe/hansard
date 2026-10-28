import re

from utils.markdown_text import strip_markdown

_MAX_SNIPPET_WORDS = 35
_MAX_QUOTE_LENGTH = 200
_SENTENCE_END = re.compile(r"[.?!](?=\s|$)")
_WORD_SEPARATOR = " "
_SPEAKER_LABEL_SEPARATOR = ": "
_ASKED_WORD = "asked"
_ELLIPSIS = "…"


def get_transcript_snippet(transcript: str) -> str:
    words = transcript.split()
    if len(words) <= _MAX_SNIPPET_WORDS:
        return " ".join(words)
    return " ".join(words[:_MAX_SNIPPET_WORDS]) + "…"


def get_transcript_quote(transcript: str) -> str:
    plain = strip_markdown(transcript)
    if len(plain) <= _MAX_QUOTE_LENGTH:
        return plain
    sentence_ends = [
        match.end()
        for match in _SENTENCE_END.finditer(plain)
        if match.end() <= _MAX_QUOTE_LENGTH
    ]
    if sentence_ends:
        return plain[: sentence_ends[-1]]
    words = plain[: _MAX_QUOTE_LENGTH - 1].rsplit(_WORD_SEPARATOR, 1)[0]
    return words + _ELLIPSIS


def get_paragraph_quote(speaker_label: str, transcript: str) -> str:
    quote = get_transcript_quote(transcript)
    # NOTE: the record prints a question as one sentence with the asker as its subject, so that label takes no colon
    if quote.startswith(_ASKED_WORD):
        return f"{speaker_label}{_WORD_SEPARATOR}{quote}"
    return f"{speaker_label}{_SPEAKER_LABEL_SEPARATOR}{quote}"
