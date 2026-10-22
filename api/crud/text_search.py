from sqlalchemy import ColumnElement, and_, false, func, literal_column, not_, or_

from utils.search_query import (
    SearchQueryGroup,
    get_exact_form_pattern,
    get_group_websearch_query,
    get_positive_websearch_query,
    get_quoted_websearch_query,
    get_search_query,
    get_stemmed_websearch_query,
    get_websearch_query,
    is_quote_in_query,
)

TEXT_SEARCH_CONFIGURATION = literal_column("'english'")
EXACT_TEXT_SEARCH_CONFIGURATION = literal_column("'simple'")
HEADLINE_OPTIONS = "StartSel=<mark>, StopSel=</mark>, MaxWords=35, MinWords=15"
HIGHLIGHT_ALL_OPTIONS = "StartSel=<mark>, StopSel=</mark>, HighlightAll=true"
_CASE_INSENSITIVE = "i"


def get_match_tsquery(query: str) -> ColumnElement:
    if not is_quote_in_query(query):
        return func.websearch_to_tsquery(TEXT_SEARCH_CONFIGURATION, query)
    return func.websearch_to_tsquery(
        TEXT_SEARCH_CONFIGURATION, get_websearch_query(get_search_query(query).groups)
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
                for group in get_search_query(query).groups
            ],
        ),
    )


def get_headline(query: str, text_column: ColumnElement, options: str) -> ColumnElement:
    groups = get_search_query(query).groups
    quoted_websearch_query = get_quoted_websearch_query(groups)
    if not is_quote_in_query(query) or quoted_websearch_query == "":
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
