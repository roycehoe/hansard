import pytest

from utils.search_query import (
    SearchQuery,
    SearchQueryGroup,
    SearchQueryTerm,
    get_exact_form_pattern,
    get_group_websearch_query,
    get_positive_websearch_query,
    get_quoted_websearch_query,
    get_quoted_words,
    get_search_query,
    get_stemmed_websearch_query,
    get_websearch_query,
    is_quote_in_query,
)


@pytest.mark.parametrize(
    ("query", "expected_websearch_query"),
    [
        ("housing", "housing"),
        ("housing OR flats grants", "housing OR flats grants"),
        ("housing or flats", "housing OR flats"),
        ("housing - flats", "housing -flats"),
        ("housing -OR flats", "housing flats"),
        ("OR housing", "housing"),
        ("or housing OR", "housing"),
        ("housing OR OR flats", "housing OR flats"),
        ('"housing"grants', '"housing" grants'),
        ("“housing” grants", '"housing" grants'),
        ('"unclosed housing', '"unclosed housing"'),
        ('"housing" "") x', '"housing" x'),
        ('"" housing', "housing"),
        ("(housing), flats.", "housing flats"),
        ("x-ray", "x-ray"),
        ('housing -"public flats" grants', "housing grants"),
        ('"housing" - "flats"', '"housing"'),
        ('"Minister for Housing"', '"Minister for Housing"'),
        ('-"House"', ""),
        ('housing OR -"House"', "housing"),
    ],
)
def test_the_websearch_query_keeps_the_user_s_operators(
    query: str, expected_websearch_query: str
) -> None:
    assert get_websearch_query(get_search_query(query)) == expected_websearch_query


def test_a_query_is_split_into_or_groups_of_terms() -> None:
    assert get_search_query('housing -flats OR "public housing"') == SearchQuery(
        groups=(
            SearchQueryGroup(
                terms=(
                    SearchQueryTerm(
                        words=("housing",), is_quoted=False, is_excluded=False
                    ),
                    SearchQueryTerm(
                        words=("flats",), is_quoted=False, is_excluded=True
                    ),
                )
            ),
            SearchQueryGroup(
                terms=(
                    SearchQueryTerm(
                        words=("public", "housing"), is_quoted=True, is_excluded=False
                    ),
                )
            ),
        )
    )


@pytest.mark.parametrize(
    ("query", "expected_pattern"),
    [
        ('"co-payment"', r"(?<![[:alnum:]])co\-payment(?![[:alnum:]])"),
        ('"House\'s"', "(?<![[:alnum:]])House's(?![[:alnum:]])"),
        (
            '"public housing"',
            "(?<![[:alnum:]])public[^[:alnum:]]+housing(?![[:alnum:]])",
        ),
        ('"a.b*c"', r"(?<![[:alnum:]])a\.b\*c(?![[:alnum:]])"),
    ],
)
def test_a_quoted_term_becomes_an_exact_form_pattern(
    query: str, expected_pattern: str
) -> None:
    first_term = get_search_query(query).groups[0].terms[0]

    assert get_exact_form_pattern(first_term) == expected_pattern


def test_the_quoted_websearch_query_keeps_only_positive_quoted_terms() -> None:
    search_query = get_search_query('"public housing" OR "flats" grants -"House"')

    assert get_quoted_websearch_query(search_query) == '"public housing" OR "flats"'


def test_the_stemmed_and_positive_websearch_queries_split_on_quoting() -> None:
    search_query = get_search_query('"housing" grants OR flats -rent')

    assert get_stemmed_websearch_query(search_query) == "grants OR flats"
    assert get_positive_websearch_query(search_query) == '"housing" OR grants OR flats'


def test_quoted_words_are_lowercased_and_exclude_negated_terms() -> None:
    search_query = get_search_query('"Public Housing" grants -"House"')

    assert get_quoted_words(search_query) == ["public", "housing"]


@pytest.mark.parametrize("query", ['"housing"', "“housing”", '"'])
def test_a_quote_character_is_detected(query: str) -> None:
    assert is_quote_in_query(query)


def test_a_query_without_a_quote_character_is_not_detected() -> None:
    assert not is_quote_in_query("housing -flats")


def test_a_group_query_drops_excluded_quoted_terms_only() -> None:
    group = get_search_query('housing -"House" -flats').groups[0]

    assert get_group_websearch_query(group) == "housing -flats"
