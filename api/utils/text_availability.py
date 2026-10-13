from typing import Optional


def is_text_available(markdown_content: Optional[str]) -> bool:
    return markdown_content is not None and markdown_content != ""
