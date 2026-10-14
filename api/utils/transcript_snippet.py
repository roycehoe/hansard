_MAX_SNIPPET_WORDS = 35


def get_transcript_snippet(transcript: str) -> str:
    words = transcript.split()
    if len(words) <= _MAX_SNIPPET_WORDS:
        return " ".join(words)
    return " ".join(words[:_MAX_SNIPPET_WORDS]) + "…"
