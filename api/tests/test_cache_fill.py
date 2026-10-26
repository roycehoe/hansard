import pytest

from middleware import cache_fill


def test_a_failed_coverage_fill_does_not_stop_the_parliament_and_sitemap_fills(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    fills_called: list[str] = []

    def fail_coverage_fill() -> None:
        fills_called.append("coverage")
        raise RuntimeError

    def record_parliament_fill() -> None:
        fills_called.append("parliament")

    def record_sitemap_fill() -> None:
        fills_called.append("sitemap")

    monkeypatch.setattr(cache_fill, "_fill_coverage_cache", fail_coverage_fill)
    monkeypatch.setattr(cache_fill, "_fill_parliament_cache", record_parliament_fill)
    monkeypatch.setattr(cache_fill, "_fill_sitemap_cache", record_sitemap_fill)

    with pytest.raises(RuntimeError):
        cache_fill._fill_coverage_parliament_and_sitemap_caches()

    assert fills_called == ["coverage", "parliament", "sitemap"]
