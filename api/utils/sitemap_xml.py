from xml.sax.saxutils import escape

_XML_DECLARATION = '<?xml version="1.0" encoding="UTF-8"?>'
_SITEMAP_NAMESPACE = "http://www.sitemaps.org/schemas/sitemap/0.9"


def get_urlset_xml(urls: list[str]) -> str:
    entries = "".join(f"<url><loc>{escape(url)}</loc></url>" for url in urls)
    return f'{_XML_DECLARATION}<urlset xmlns="{_SITEMAP_NAMESPACE}">{entries}</urlset>'


def get_sitemap_index_xml(sitemap_urls: list[str]) -> str:
    entries = "".join(
        f"<sitemap><loc>{escape(sitemap_url)}</loc></sitemap>"
        for sitemap_url in sitemap_urls
    )
    return f'{_XML_DECLARATION}<sitemapindex xmlns="{_SITEMAP_NAMESPACE}">{entries}</sitemapindex>'
