from exceptions.base import AppHttpExceptionBase, ErrorCode


class SitemapNotFoundException(AppHttpExceptionBase):
    def __init__(self):
        super().__init__(ErrorCode.SITEMAP_NOT_FOUND)
