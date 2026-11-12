import pytest

from exceptions.search import SearchTooManyAlternativesException
from utils.search_query import (
    SearchQueryGroup,
    SearchQueryTerm,
    get_exact_form_pattern,
    get_excluded_term_groups,
    get_group_websearch_query,
    get_quoted_websearch_query,
    get_quoted_words_to_mark,
    get_search_query_group_count,
    get_search_query_groups,
    get_split_phrase_websearch_query,
    get_stemmed_websearch_query,
    get_websearch_query,
    get_words_to_mark_websearch_query,
    is_query_only_excluded_words,
    is_quote_in_query,
)
from validators.search import (
    MAX_SEARCH_QUERY_GROUP_COUNT,
    validate_can_get_report_matched_words,
)


@pytest.mark.parametrize(
    ("query", "expected_websearch_query"),
    [
        ("housing", "housing"),
        ("housing OR flats grants", "housing grants OR flats grants"),
        ("housing or flats", "housing flats"),
        ("housing - flats", "housing flats"),
        ("housing -flats", "housing -flats"),
        ("HEAD S - MINISTRY OF MANPOWER", "HEAD S MINISTRY OF MANPOWER"),
        ("housing -", "housing"),
        ('housing - "flats"', 'housing "flats"'),
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
        ("Ong Kian-Min", "Ong Kian-Min"),
        ("covid-19", "covid-19"),
        ("well-being", "well-being"),
        ("housing -kian-min", "housing -kian-min"),
        ('housing -"public flats" grants', "housing grants"),
        ('"housing" - "flats"', '"housing" "flats"'),
        ('"housing" -"flats"', '"housing"'),
        ('"Minister for Housing"', '"Minister for Housing"'),
        ('-"House"', ""),
        ('housing OR -"House"', "housing"),
    ],
)
def test_the_websearch_query_keeps_the_user_s_operators(
    query: str, expected_websearch_query: str
) -> None:
    assert (
        get_websearch_query(get_search_query_groups(query)) == expected_websearch_query
    )


@pytest.mark.parametrize(
    ("query", "expected_split_words"),
    [
        ("Kian-Min", ("Kian", "Min")),
        ("(Kian-Min),", ("Kian", "Min")),
        ("x-ray", ("x", "ray")),
        ("well-being", ()),
        ("follow-up", ()),
        ("to-do", ()),
        ("do-or-die", ()),
        ("covid-19", ()),
        ("housing", ()),
        ("-kian-min", ()),
    ],
)
def test_a_hyphenated_word_is_split_only_when_no_part_is_a_stop_word(
    query: str, expected_split_words: tuple[str, ...]
) -> None:
    groups = get_search_query_groups(f"ong {query}")

    assert groups[0].terms[-1].split_words == expected_split_words


def test_a_split_hyphenated_word_keeps_its_hyphen_and_gets_a_phrase_query() -> None:
    term = get_search_query_groups("Kian-Min")[0].terms[0]

    assert term.words == ("Kian-Min",)
    assert get_split_phrase_websearch_query(term) == '"Kian Min"'


def test_a_query_is_split_into_or_groups_of_terms() -> None:
    assert get_search_query_groups('housing -flats OR "public housing"') == (
        SearchQueryGroup(
            terms=(
                SearchQueryTerm(words=("housing",), is_quoted=False, is_excluded=False),
                SearchQueryTerm(words=("flats",), is_quoted=False, is_excluded=True),
            )
        ),
        SearchQueryGroup(
            terms=(
                SearchQueryTerm(words=("housing",), is_quoted=False, is_excluded=False),
                SearchQueryTerm(
                    words=("public", "housing"), is_quoted=True, is_excluded=False
                ),
            )
        ),
    )


@pytest.mark.parametrize(
    ("query", "expected_pattern"),
    [
        (
            '"co-payment"',
            r"(?<![[:alnum:]])(?<![[:alnum:]]-)co\-payment(?![[:alnum:]])(?!-[[:alnum:]])",
        ),
        (
            '"House\'s"',
            "(?<![[:alnum:]])(?<![[:alnum:]]-)House['\u2019]s(?![[:alnum:]])(?!-[[:alnum:]])",
        ),
        (
            '"House\u2019s"',
            "(?<![[:alnum:]])(?<![[:alnum:]]-)House['\u2019]s(?![[:alnum:]])(?!-[[:alnum:]])",
        ),
        (
            '"public housing"',
            "(?<![[:alnum:]])(?<![[:alnum:]]-)public[^[:alnum:]]+housing(?![[:alnum:]])(?!-[[:alnum:]])",
        ),
        (
            '"a.b*c"',
            r"(?<![[:alnum:]])(?<![[:alnum:]]-)a\.b\*c(?![[:alnum:]])(?!-[[:alnum:]])",
        ),
    ],
)
def test_a_quoted_term_becomes_an_exact_form_pattern(
    query: str, expected_pattern: str
) -> None:
    first_term = get_search_query_groups(query)[0].terms[0]

    assert get_exact_form_pattern(first_term.words) == expected_pattern


def test_the_quoted_websearch_query_keeps_only_positive_quoted_terms() -> None:
    groups = get_search_query_groups('"public housing" OR "flats" grants -"House"')

    assert get_quoted_websearch_query(groups) == '"public housing" OR "flats"'


def test_the_stemmed_and_words_to_mark_websearch_queries_split_on_quoting() -> None:
    groups = get_search_query_groups('"housing" grants OR flats -rent')

    assert get_stemmed_websearch_query(groups) == "grants OR flats"
    assert (
        get_words_to_mark_websearch_query(groups) == '"housing" OR "grants" OR "flats"'
    )


def test_quoted_words_are_lowercased_and_exclude_negated_terms() -> None:
    groups = get_search_query_groups('"Public Housing" grants -"House"')

    assert get_quoted_words_to_mark(groups) == ["public", "housing"]


@pytest.mark.parametrize("query", ['"housing"', "“housing”", '"'])
def test_a_quote_character_is_detected(query: str) -> None:
    assert is_quote_in_query(query)


def test_a_query_without_a_quote_character_is_not_detected() -> None:
    assert not is_quote_in_query("housing -flats")


def test_a_group_query_drops_excluded_quoted_terms_only() -> None:
    group = get_search_query_groups('housing -"House" -flats')[0]

    assert get_group_websearch_query(group.terms) == "housing -flats"


def test_excluded_term_groups_keep_only_the_excluded_terms_of_each_group() -> None:
    assert get_excluded_term_groups('-housing -"public flats" OR tax -grants') == (
        SearchQueryGroup(
            terms=(
                SearchQueryTerm(words=("housing",), is_quoted=False, is_excluded=True),
                SearchQueryTerm(
                    words=("public", "flats"), is_quoted=True, is_excluded=True
                ),
                SearchQueryTerm(words=("grants",), is_quoted=False, is_excluded=True),
            )
        ),
        SearchQueryGroup(
            terms=(
                SearchQueryTerm(words=("housing",), is_quoted=False, is_excluded=True),
                SearchQueryTerm(words=("grants",), is_quoted=False, is_excluded=True),
            )
        ),
    )


@pytest.mark.parametrize("query", ["", "housing", "housing OR tax"])
def test_a_query_with_no_excluded_word_has_no_excluded_term_groups(
    query: str,
) -> None:
    assert get_excluded_term_groups(query) == ()


def test_a_group_of_only_excluded_words_is_left_out_of_the_websearch_query() -> None:
    groups = get_search_query_groups("housing OR -other")

    assert len(groups) == 1
    assert get_websearch_query(groups) == "housing"


@pytest.mark.parametrize(
    ("query", "expected_websearch_query"),
    [
        ("hawker rent OR lease", "hawker rent OR hawker lease"),
        ("tax or budget", "tax budget"),
        ("not guilty", "not guilty"),
        ("CPF OR HDB", "CPF HDB"),
        (
            "SINGAPOREANS NOT COVERED BY MEDISHIELD",
            "SINGAPOREANS NOT COVERED BY MEDISHIELD",
        ),
        ('"substantive assistance" NOT courier', '"substantive assistance" -courier'),
        (
            '"substantive assistance" AND NOT courier',
            '"substantive assistance" -courier',
        ),
        (
            '"substantive assistance" BUT NOT courier',
            '"substantive assistance" -courier',
        ),
        ('"substantive assistance" % courier', '"substantive assistance" -courier'),
        (
            '"substantive assistance" NOT (courier OR trafficker)',
            '"substantive assistance" -courier -trafficker',
        ),
        (
            '"substantive assistance" AND (courier OR trafficker)',
            '"substantive assistance" courier OR "substantive assistance" trafficker',
        ),
        ("vaping (sale OR import)", "vaping sale OR vaping import"),
        ("rent /s lease", "rent lease"),
        ("rent w/s lease", "rent lease"),
        ("rent /p lease", "rent lease"),
        ("rent w/p lease", "rent lease"),
        ("rent & lease", "rent lease"),
        ("Art 12", '"article 12"'),
        ("cl 5", '"clause 5"'),
        ("s 33B", '"section 33B"'),
    ],
)
def test_the_legal_database_operators_are_read_as_the_adr_describes(
    query: str, expected_websearch_query: str
) -> None:
    assert (
        get_websearch_query(get_search_query_groups(query)) == expected_websearch_query
    )


def test_or_binds_before_and() -> None:
    assert len(get_search_query_groups("hawker rent OR lease")) == 2


@pytest.mark.parametrize("query", ["a (b (c OR d) OR e)", "a (b OR (c OR d))"])
def test_a_bracket_inside_a_bracket_is_not_read_as_a_second_level(
    query: str,
) -> None:
    assert get_search_query_group_count(query) == 3


def test_a_bracket_inside_a_bracket_is_flattened_into_the_outer_one() -> None:
    assert get_websearch_query(get_search_query_groups("a (b OR (c OR d))")) == (
        "a b OR a c OR a d"
    )


@pytest.mark.parametrize(
    ("query", "expected_is_only_excluded_words"),
    [
        ("NOT courier", True),
        ("% courier", True),
        ("courier NOT trafficker", False),
    ],
)
def test_a_query_of_only_excluded_words_is_detected_with_not_and_percent(
    query: str, expected_is_only_excluded_words: bool
) -> None:
    assert is_query_only_excluded_words(query) == expected_is_only_excluded_words


def test_four_bracket_pairs_of_two_alternatives_are_at_the_group_limit() -> None:
    query = "(a OR b) (c OR d) (e OR f) (g OR h)"

    assert get_search_query_group_count(query) == MAX_SEARCH_QUERY_GROUP_COUNT == 16
    validate_can_get_report_matched_words(query)


def test_five_bracket_pairs_of_two_alternatives_are_over_the_group_limit() -> None:
    query = "(a OR b) (c OR d) (e OR f) (g OR h) (i OR j)"

    assert get_search_query_group_count(query) == 32
    with pytest.raises(SearchTooManyAlternativesException):
        validate_can_get_report_matched_words(query)
