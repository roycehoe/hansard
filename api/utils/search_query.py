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
_HYPHEN_BETWEEN_LETTERS = re.compile(r"(?<=[^\W\d_])-(?=[^\W\d_])")
_WORD_EDGE = re.compile(r"^[\W_]+|[\W_]+$")
_EXACT_FORM_START = "(?<![[:alnum:]])"
_EXACT_FORM_END = "(?![[:alnum:]])"
_EXACT_FORM_WORD_SEPARATOR = "[^[:alnum:]]+"
# NOTE: Postgres's english stop words (tsearch_data/english.stop); a hyphenated word with one of these as a part is not split, because the part would vanish from the query ("well-being" would become "well") or the query would match nothing ("to-do")
_STOP_WORDS = frozenset(
    "i me my myself we our ours ourselves you your yours yourself yourselves "
    "he him his himself she her hers herself it its itself they them their "
    "theirs themselves what which who whom this that these those am is are "
    "was were be been being have has had having do does did doing a an the "
    "and but if or because as until while of at by for with about against "
    "between into through during before after above below to from up down in "
    "out on off over under again further then once here there when where why "
    "how all any both each few more most other some such no nor not only own "
    "same so than too very s t can will just don should now".split()
)
_APOSTROPHES = re.compile("['\u2019]")
_EXACT_FORM_APOSTROPHE = "['\u2019]"


@dataclass(frozen=True)
class SearchQueryTerm:
    words: tuple[str, ...]
    is_quoted: bool
    is_excluded: bool
    # the parts of a hyphenated word that the record may print apart; the word itself stays in words
    split_words: tuple[str, ...] = ()


@dataclass(frozen=True)
class SearchQueryGroup:
    terms: tuple[SearchQueryTerm, ...]


def _get_words(text: str) -> tuple[str, ...]:
    return tuple(
        trimmed_word
        for trimmed_word in (_WORD_EDGE.sub("", word) for word in text.split())
        if trimmed_word != ""
    )


def _get_split_words(word: str) -> tuple[str, ...]:
    parts = _HYPHEN_BETWEEN_LETTERS.split(word)
    if len(parts) == 1 or any(part.lower() in _STOP_WORDS for part in parts):
        return ()
    return tuple(parts)


def _is_group_searchable(terms: tuple[SearchQueryTerm, ...]) -> bool:
    return any(not term.is_excluded for term in terms)


def _get_all_search_query_groups(query: str) -> tuple[SearchQueryGroup, ...]:
    groups = []
    terms = []
    for match in _TOKEN.finditer(_CURLY_QUOTES.sub(_QUOTE, query)):
        token = match.group(0)
        if match.group(2) is not None:
            quoted_words = _get_words(match.group(2))
            if quoted_words != ():
                terms.append(
                    SearchQueryTerm(
                        words=quoted_words,
                        is_quoted=True,
                        is_excluded=match.group(1) == _EXCLUDED_PREFIX,
                    )
                )
            continue
        # NOTE: a dash with a space after it, or alone, is punctuation, as in a pasted title such as "HEAD S - MINISTRY"; only a dash attached to the next word excludes it
        is_excluded = token.startswith(_EXCLUDED_PREFIX) and token != _EXCLUDED_PREFIX
        bare_token = token.removeprefix(_EXCLUDED_PREFIX)
        if bare_token.lower() == _OR_OPERATOR:
            if not is_excluded:
                groups.append(SearchQueryGroup(terms=tuple(terms)))
                terms = []
            continue
        words = _get_words(bare_token)
        if words != ():
            terms.append(
                SearchQueryTerm(
                    words=words,
                    is_quoted=False,
                    is_excluded=is_excluded,
                    # NOTE: a hyphen typed between letters also finds the words written apart, because the record may print "Kian Min" where the query says "Kian-Min"; Postgres reads an unsplit hyphenated word such as "well-being" itself, and an excluded word keeps only its hyphen, because a term excluded in two words would exclude only the first
                    split_words=() if is_excluded else _get_split_words(words[0]),
                )
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


def get_excluded_term_groups(query: str) -> tuple[SearchQueryGroup, ...]:
    return tuple(
        SearchQueryGroup(terms=tuple(term for term in group.terms if term.is_excluded))
        for group in _get_all_search_query_groups(query)
        if any(term.is_excluded for term in group.terms)
    )


def is_quote_in_query(query: str) -> bool:
    return any(quote in query for quote in _QUOTE_CHARACTERS)


def _get_websearch_term(term: SearchQueryTerm) -> str:
    words = _WORD_SEPARATOR.join(term.words)
    if term.is_quoted:
        return _QUOTE + words + _QUOTE
    if term.is_excluded:
        return _EXCLUDED_PREFIX + words
    return words


def get_split_phrase_websearch_query(term: SearchQueryTerm) -> str:
    return _QUOTE + _WORD_SEPARATOR.join(term.split_words) + _QUOTE


def get_group_websearch_query(terms: tuple[SearchQueryTerm, ...]) -> str:
    return _WORD_SEPARATOR.join(
        _get_websearch_term(term)
        for term in terms
        if not term.is_quoted or not term.is_excluded
    )


def _get_unquoted_websearch_term(term: SearchQueryTerm) -> str:
    if term.is_excluded:
        return _EXCLUDED_PREFIX + _WORD_SEPARATOR.join(term.words)
    if term.is_quoted:
        return _WORD_SEPARATOR.join(_QUOTE + word + _QUOTE for word in term.words)
    return _WORD_SEPARATOR.join(term.words)


def get_unquoted_websearch_query(groups: tuple[SearchQueryGroup, ...]) -> str:
    return _WEBSEARCH_OR.join(
        _WORD_SEPARATOR.join(
            _get_unquoted_websearch_term(term)
            for term in group.terms
            if not term.is_quoted or not term.is_excluded
        )
        for group in groups
    )


def get_websearch_query(groups: tuple[SearchQueryGroup, ...]) -> str:
    return _WEBSEARCH_OR.join(
        get_group_websearch_query(group.terms) for group in groups
    )


def get_exact_form_pattern(words: tuple[str, ...]) -> str:
    return (
        _EXACT_FORM_START
        + _EXACT_FORM_WORD_SEPARATOR.join(
            _APOSTROPHES.sub(_EXACT_FORM_APOSTROPHE, re.escape(word)) for word in words
        )
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
