import re
from dataclasses import dataclass

_QUOTE = '"'
_CURLY_QUOTES = re.compile(r"[“”]")
_QUOTE_CHARACTERS = ('"', "“", "”")
_OR_OPERATOR = "or"
_EXCLUDED_PREFIX = "-"
_WEBSEARCH_OR = " OR "
_WORD_SEPARATOR = " "
_TOKEN = re.compile(r'(-?)"([^"]*)"?|[^\s"]+')
_WORD_EDGE = re.compile(r"^[\W_]+|[\W_]+$")
_EXACT_FORM_START = "(?<![[:alnum:]])"
_EXACT_FORM_END = "(?![[:alnum:]])"
_EXACT_FORM_WORD_SEPARATOR = "[^[:alnum:]]+"


@dataclass(frozen=True)
class SearchQueryTerm:
    words: tuple[str, ...]
    is_quoted: bool
    is_excluded: bool


@dataclass(frozen=True)
class SearchQueryGroup:
    terms: tuple[SearchQueryTerm, ...]


def _get_words(text: str) -> tuple[str, ...]:
    return tuple(
        trimmed_word
        for trimmed_word in (_WORD_EDGE.sub("", word) for word in text.split())
        if trimmed_word != ""
    )


def _is_group_searchable(terms: tuple[SearchQueryTerm, ...]) -> bool:
    return any(not term.is_excluded for term in terms)


def _get_all_search_query_groups(query: str) -> tuple[SearchQueryGroup, ...]:
    groups = []
    terms = []
    is_next_term_excluded = False
    for match in _TOKEN.finditer(_CURLY_QUOTES.sub(_QUOTE, query)):
        token = match.group(0)
        if match.group(2) is not None:
            quoted_words = _get_words(match.group(2))
            if quoted_words != ():
                terms.append(
                    SearchQueryTerm(
                        words=quoted_words,
                        is_quoted=True,
                        is_excluded=is_next_term_excluded
                        or match.group(1) == _EXCLUDED_PREFIX,
                    )
                )
            is_next_term_excluded = False
            continue
        if token == _EXCLUDED_PREFIX:
            is_next_term_excluded = True
            continue
        is_excluded = is_next_term_excluded or token.startswith(_EXCLUDED_PREFIX)
        is_next_term_excluded = False
        bare_token = token.removeprefix(_EXCLUDED_PREFIX)
        if bare_token.lower() == _OR_OPERATOR:
            if not is_excluded:
                groups.append(SearchQueryGroup(terms=tuple(terms)))
                terms = []
            continue
        words = _get_words(bare_token)
        if words != ():
            terms.append(
                SearchQueryTerm(words=words, is_quoted=False, is_excluded=is_excluded)
            )
    groups.append(SearchQueryGroup(terms=tuple(terms)))
    return tuple(groups)


def get_search_query_groups(query: str) -> tuple[SearchQueryGroup, ...]:
    return tuple(
        group
        for group in _get_all_search_query_groups(query)
        if _is_group_searchable(group.terms)
    )


def is_query_only_excluded_words(query: str) -> bool:
    terms = [
        term for group in _get_all_search_query_groups(query) for term in group.terms
    ]
    return terms != [] and all(term.is_excluded for term in terms)


def is_quote_in_query(query: str) -> bool:
    return any(quote in query for quote in _QUOTE_CHARACTERS)


def _get_websearch_term(term: SearchQueryTerm) -> str:
    words = _WORD_SEPARATOR.join(term.words)
    if term.is_quoted:
        return _QUOTE + words + _QUOTE
    if term.is_excluded:
        return _EXCLUDED_PREFIX + words
    return words


def get_group_websearch_query(terms: tuple[SearchQueryTerm, ...]) -> str:
    return _WORD_SEPARATOR.join(
        _get_websearch_term(term)
        for term in terms
        if not term.is_quoted or not term.is_excluded
    )


def get_websearch_query(groups: tuple[SearchQueryGroup, ...]) -> str:
    return _WEBSEARCH_OR.join(
        get_group_websearch_query(group.terms) for group in groups
    )


def get_exact_form_pattern(words: tuple[str, ...]) -> str:
    return (
        _EXACT_FORM_START
        + _EXACT_FORM_WORD_SEPARATOR.join(re.escape(word) for word in words)
        + _EXACT_FORM_END
    )


def get_quoted_websearch_query(groups: tuple[SearchQueryGroup, ...]) -> str:
    return _WEBSEARCH_OR.join(
        _get_websearch_term(term)
        for group in groups
        for term in group.terms
        if term.is_quoted and not term.is_excluded
    )


def get_positive_websearch_query(groups: tuple[SearchQueryGroup, ...]) -> str:
    return _WEBSEARCH_OR.join(
        _get_websearch_term(term)
        for group in groups
        for term in group.terms
        if not term.is_excluded
    )


def get_stemmed_websearch_query(groups: tuple[SearchQueryGroup, ...]) -> str:
    return _WEBSEARCH_OR.join(
        _get_websearch_term(term)
        for group in groups
        for term in group.terms
        if not term.is_quoted and not term.is_excluded
    )


def get_quoted_words(groups: tuple[SearchQueryGroup, ...]) -> list[str]:
    return [
        word.lower()
        for group in groups
        for term in group.terms
        if term.is_quoted and not term.is_excluded
        for word in term.words
    ]
