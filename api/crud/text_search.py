from sqlalchemy import ColumnElement, and_, false, func, literal_column, not_, or_

from utils.search_query import (
    SearchQueryGroup,
    SearchQueryTerm,
    get_exact_form_pattern,
    get_excluded_term_groups,
    get_group_websearch_query,
    get_positive_websearch_query,
    get_quoted_websearch_query,
    get_search_query_groups,
    get_stemmed_websearch_query,
    get_websearch_query,
    is_quote_in_query,
)

TEXT_SEARCH_CONFIGURATION = literal_column("'english'")
EXACT_TEXT_SEARCH_CONFIGURATION = literal_column("'simple'")
HEADLINE_OPTIONS = "StartSel=<mark>, StopSel=</mark>, MaxWords=35, MinWords=15"
HIGHLIGHT_ALL_OPTIONS = "StartSel=<mark>, StopSel=</mark>, HighlightAll=true"
_CASE_INSENSITIVE = "i"
_WORD_SEPARATOR = " "


def get_match_tsquery(query: str) -> ColumnElement:
    groups = get_search_query_groups(query)
    # NOTE: Postgres reads "housing or -other" as housing OR NOT other, which matches nearly every row, so a query with an excluded term is rebuilt from the groups that have a positive term
    is_rebuilt = is_quote_in_query(query) or (
        groups != () and get_excluded_term_groups(query) != ()
    )
    if not is_rebuilt:
        return func.websearch_to_tsquery(TEXT_SEARCH_CONFIGURATION, query)
    return func.websearch_to_tsquery(
        TEXT_SEARCH_CONFIGURATION, get_websearch_query(groups)
    )


def _get_group_match(
    group: SearchQueryGroup, tsv_column: ColumnElement, text_column: ColumnElement
) -> ColumnElement:
    return and_(
        tsv_column.op("@@")(
            func.websearch_to_tsquery(
                TEXT_SEARCH_CONFIGURATION, get_group_websearch_query(group.terms)
            )
        ),
        *[
            text_column.regexp_match(
                get_exact_form_pattern(term.words), flags=_CASE_INSENSITIVE
            )
            for term in group.terms
            if term.is_quoted and not term.is_excluded
        ],
        *[
            not_(
                text_column.regexp_match(
                    get_exact_form_pattern(term.words), flags=_CASE_INSENSITIVE
                )
            )
            for term in group.terms
            if term.is_quoted and term.is_excluded
        ],
    )


def get_match_filter(
    query: str, tsv_column: ColumnElement, text_column: ColumnElement
) -> ColumnElement:
    match = tsv_column.op("@@")(get_match_tsquery(query))
    if not is_quote_in_query(query):
        return match
    # NOTE: the full-text match narrows the rows through the index; each OR group is then checked again, its quoted words as exact forms, because the index only knows stems
    return and_(
        match,
        or_(
            false(),
            *[
                _get_group_match(group, tsv_column, text_column)
                for group in get_search_query_groups(query)
            ],
        ),
    )


def _get_excluded_term_match(
    term: SearchQueryTerm, tsv_column: ColumnElement, text_column: ColumnElement
) -> ColumnElement:
    if term.is_quoted:
        return text_column.regexp_match(
            get_exact_form_pattern(term.words), flags=_CASE_INSENSITIVE
        )
    return tsv_column.op("@@")(
        func.websearch_to_tsquery(
            TEXT_SEARCH_CONFIGURATION, _WORD_SEPARATOR.join(term.words)
        )
    )


def get_excluded_words_filters(
    query: str, tsv_column: ColumnElement, text_column: ColumnElement
) -> list[ColumnElement]:
    groups = get_excluded_term_groups(query)
    if groups == ():
        return []
    return [
        or_(
            *[
                and_(
                    *[
                        not_(_get_excluded_term_match(term, tsv_column, text_column))
                        for term in group.terms
                    ]
                )
                for group in groups
            ]
        )
    ]


def get_headline(query: str, text_column: ColumnElement, options: str) -> ColumnElement:
    groups = get_search_query_groups(query)
    if not is_quote_in_query(query) or get_quoted_websearch_query(groups) == "":
        return func.ts_headline(
            TEXT_SEARCH_CONFIGURATION, text_column, get_match_tsquery(query), options
        )
    exact_headline = func.ts_headline(
        EXACT_TEXT_SEARCH_CONFIGURATION,
        text_column,
        func.websearch_to_tsquery(
            EXACT_TEXT_SEARCH_CONFIGURATION,
            get_positive_websearch_query(groups),
        ),
        options,
    )
    stemmed_websearch_query = get_stemmed_websearch_query(groups)
    if stemmed_websearch_query == "":
        return exact_headline
    return func.ts_headline(
        TEXT_SEARCH_CONFIGURATION,
        exact_headline,
        func.websearch_to_tsquery(TEXT_SEARCH_CONFIGURATION, stemmed_websearch_query),
        HIGHLIGHT_ALL_OPTIONS,
    )
