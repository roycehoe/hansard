import re
from dataclasses import dataclass, field
from itertools import product
from math import prod

_QUOTE = '"'
_CURLY_QUOTES = re.compile(r"[“”]")
_OR_OPERATOR = "OR"
_NOT_OPERATOR = "NOT"
# NOTE: AND and BUT change nothing, because every word must appear anyway; they are operators so that "AND NOT x" and "BUT NOT x" leave x out
_OPERATOR_WORDS = frozenset((_OR_OPERATOR, "AND", _NOT_OPERATOR, "BUT"))
_EXCLUDING_SYMBOL = "%"
# NOTE: the legal databases' same-paragraph and same-sentence connectors; every search already matches within one paragraph, and none can narrow to a sentence
_SAME_PARAGRAPH_CONNECTOR = re.compile(r"&|w?/[ps]", re.IGNORECASE)
# NOTE: websearch_to_tsquery reads "or" in any case as its OR operator, so where the query means it as a word it is dropped; it is a stop word, so it would match nothing anyway
_OR_WORD = "or"
_OPENING_BRACKET = "("
_CLOSING_BRACKET = ")"
_MIN_TITLE_WORD_LETTER_COUNT = 7
_EXCLUDED_PREFIX = "-"
_HYPHEN = "-"
_WEBSEARCH_OR = " OR "
_WORD_SEPARATOR = " "
_TOKEN = re.compile(r'(-?)"([^"]*)"?|[^\s"]+')
_HYPHEN_BETWEEN_LETTERS = re.compile(r"(?<=[^\W\d_])-(?=[^\W\d_])")
_WORD_EDGE = re.compile(r"^[\W_]+|[\W_]+$")
# NOTE: a quoted word is the whole word, so a hyphen joined to a letter is not a word edge; "employment" does not match "Re-employment"
_EXACT_FORM_START = "(?<![[:alnum:]])(?<![[:alnum:]]-)"
_EXACT_FORM_END = "(?![[:alnum:]])(?!-[[:alnum:]])"
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
_APOSTROPHES = re.compile("['’]")
_EXACT_FORM_APOSTROPHE = "['’]"
_PROVISION_CITATION = re.compile(
    r'(?<![^\s"(])(ss?|art|cl)\.?\s+(\d{1,3}[^\W\d_]{0,3})(?![^\W_])',
    re.IGNORECASE,
)
_PLURAL_SECTION_ABBREVIATION = "ss"
_ARTICLE_ABBREVIATION = "art"
_CLAUSE_ABBREVIATION = "cl"
_SECTION_WORD = "section"
_PLURAL_SECTION_WORD = "sections"
_ARTICLE_WORD = "article"
_CLAUSE_WORD = "clause"


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


@dataclass(frozen=True)
class _Bracket:
    clauses: tuple[tuple[SearchQueryTerm, ...], ...]
    is_excluded: bool


@dataclass
class _ClauseList[OperandT]:
    clauses: list[list[OperandT]] = field(default_factory=list)
    is_or_pending: bool = False

    def add_operand(self, operand: OperandT) -> None:
        if self.is_or_pending and self.clauses != []:
            self.clauses[-1].append(operand)
        else:
            self.clauses.append([operand])
        self.is_or_pending = False


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


def _get_term(
    words: tuple[str, ...], is_quoted: bool, is_excluded: bool
) -> SearchQueryTerm:
    return SearchQueryTerm(
        words=words,
        is_quoted=is_quoted,
        is_excluded=is_excluded,
        # NOTE: a hyphen typed between letters also finds the words written apart, because the record may print "Kian Min" where the query says "Kian-Min"; Postgres reads an unsplit hyphenated word such as "well-being" itself, and an excluded word keeps only its hyphen, because a term excluded in two words would exclude only the first
        split_words=(() if is_quoted or is_excluded else _get_split_words(words[0])),
    )


def _is_group_searchable(terms: tuple[SearchQueryTerm, ...]) -> bool:
    return any(not term.is_excluded for term in terms)


def _get_provision_word(abbreviation: str) -> str:
    lowercase_abbreviation = abbreviation.lower()
    if lowercase_abbreviation == _PLURAL_SECTION_ABBREVIATION:
        return _PLURAL_SECTION_WORD
    if lowercase_abbreviation == _ARTICLE_ABBREVIATION:
        return _ARTICLE_WORD
    if lowercase_abbreviation == _CLAUSE_ABBREVIATION:
        return _CLAUSE_WORD
    return _SECTION_WORD


def _is_inside_quotes(text: str, position: int) -> bool:
    return text.count(_QUOTE, 0, position) % 2 == 1


def _get_spelled_out_provision_citation(citation: re.Match[str]) -> str:
    spelled_out_citation = (
        _get_provision_word(citation.group(1)) + _WORD_SEPARATOR + citation.group(2)
    )
    # NOTE: Hansard prints "section 33B" where a lawyer writes "s 33B", and "s" is a stop word, so the citation is spelled out; outside quotes it becomes a phrase of its own, or it would match 33B anywhere in the paragraph
    if _is_inside_quotes(citation.string, citation.start()):
        return spelled_out_citation
    return _QUOTE + spelled_out_citation + _QUOTE


def _get_query_to_parse(query: str) -> str:
    return _PROVISION_CITATION.sub(
        _get_spelled_out_provision_citation, _CURLY_QUOTES.sub(_QUOTE, query)
    )


# NOTE: report titles before 2011 are printed in capitals and get pasted whole, as in "SINGAPOREANS NOT COVERED BY MEDISHIELD", so a query typed in capitals with a word of seven letters or more reads OR, AND and NOT as words; every such title holding OR or NOT has a word that long (54 on 13 Nov 2026), while an acronym search such as "POFMA OR FICA" has none and keeps its operators
def _is_query_a_title_in_capitals(query: str) -> bool:
    return not any(character.islower() for character in query) and any(
        sum(character.isalpha() for character in word) >= _MIN_TITLE_WORD_LETTER_COUNT
        for word in _get_words(query)
    )


def _is_closing_bracket(token: str) -> bool:
    return token.endswith(_CLOSING_BRACKET) and token.count(
        _OPENING_BRACKET
    ) < token.count(_CLOSING_BRACKET)


def _is_at_word_start(text: str, position: int) -> bool:
    return position == 0 or text[position - 1].isspace()


class _SearchQueryParser:
    def __init__(self, is_operator_word_read: bool):
        self.is_operator_word_read = is_operator_word_read
        self.clause_list = _ClauseList[SearchQueryTerm | _Bracket]()
        self.bracket_clause_list = _ClauseList[SearchQueryTerm]()
        self.is_bracket_open = False
        self.is_bracket_excluded = False
        self.is_exclusion_pending = False

    def _get_current_clause_list(
        self,
    ) -> _ClauseList[SearchQueryTerm] | _ClauseList[SearchQueryTerm | _Bracket]:
        if self.is_bracket_open:
            return self.bracket_clause_list
        return self.clause_list

    def _add_term(
        self, words: tuple[str, ...], is_quoted: bool, is_excluded: bool
    ) -> None:
        if words == ():
            return
        self._get_current_clause_list().add_operand(
            _get_term(words, is_quoted, is_excluded != self.is_exclusion_pending)
        )
        self.is_exclusion_pending = False

    def _open_bracket(self, is_excluded: bool) -> None:
        self.is_bracket_open = True
        self.is_bracket_excluded = is_excluded != self.is_exclusion_pending
        self.is_exclusion_pending = False

    def close_bracket(self) -> None:
        if self.bracket_clause_list.clauses != []:
            self.clause_list.add_operand(
                _Bracket(
                    clauses=tuple(
                        tuple(clause) for clause in self.bracket_clause_list.clauses
                    ),
                    is_excluded=self.is_bracket_excluded,
                )
            )
        self.bracket_clause_list = _ClauseList[SearchQueryTerm]()
        self.is_bracket_open = False

    def _read_operator_word(self, operator_word: str) -> None:
        if operator_word == _OR_OPERATOR:
            self._get_current_clause_list().is_or_pending = True
        if operator_word == _NOT_OPERATOR:
            self.is_exclusion_pending = not self.is_exclusion_pending

    def _read_bare_token(self, bare_token: str, is_excluded: bool) -> None:
        if self.is_operator_word_read and bare_token in _OPERATOR_WORDS:
            if not is_excluded:
                self._read_operator_word(bare_token)
            return
        if bare_token == _EXCLUDING_SYMBOL:
            self.is_exclusion_pending = not self.is_exclusion_pending
            return
        if _SAME_PARAGRAPH_CONNECTOR.fullmatch(bare_token):
            return
        words = _get_words(bare_token)
        if words != () and words[0].lower() == _OR_WORD:
            return
        self._add_term(words, False, is_excluded)

    def read_quoted_token(self, quoted_text: str, is_excluded: bool) -> None:
        self._add_term(_get_words(quoted_text), True, is_excluded)

    def read_unquoted_token(self, token: str, is_at_word_start: bool) -> None:
        # NOTE: a dash with a space after it, or alone, is punctuation, as in a pasted title such as "HEAD S - MINISTRY"; only a dash attached to the next word excludes it
        is_excluded = token.startswith(_EXCLUDED_PREFIX) and token != _EXCLUDED_PREFIX
        bare_token = token.removeprefix(_EXCLUDED_PREFIX)
        # NOTE: a bracket opens only where a word starts and closes only on a bracket the word itself did not open, so "33B(2)(a)" stays a word; brackets go one level deep, as a nested one is read as part of its word
        if (
            is_at_word_start
            and not self.is_bracket_open
            and bare_token.startswith(_OPENING_BRACKET)
        ):
            self._open_bracket(is_excluded)
            self.read_unquoted_token(
                bare_token.removeprefix(_OPENING_BRACKET), is_at_word_start=False
            )
            return
        if not self.is_bracket_open or not _is_closing_bracket(bare_token):
            self._read_bare_token(bare_token, is_excluded)
            return
        self._read_bare_token(bare_token.removesuffix(_CLOSING_BRACKET), is_excluded)
        self.close_bracket()

    def get_clauses(self) -> tuple[tuple[SearchQueryTerm | _Bracket, ...], ...]:
        return tuple(tuple(clause) for clause in self.clause_list.clauses)


# NOTE: OR binds before AND, as in Westlaw and Lexis, so the query is an AND of clauses that each hold alternatives; "hawker rent OR lease" is hawker with rent or lease
def _get_search_query_clauses(
    query: str,
) -> tuple[tuple[SearchQueryTerm | _Bracket, ...], ...]:
    parser = _SearchQueryParser(
        is_operator_word_read=not _is_query_a_title_in_capitals(query)
    )
    query_to_parse = _get_query_to_parse(query)
    for match in _TOKEN.finditer(query_to_parse):
        if match.group(2) is not None:
            parser.read_quoted_token(
                match.group(2), is_excluded=match.group(1) == _EXCLUDED_PREFIX
            )
            continue
        parser.read_unquoted_token(
            match.group(0), _is_at_word_start(query_to_parse, match.start())
        )
    parser.close_bracket()
    return parser.get_clauses()


def _get_negated_term(term: SearchQueryTerm) -> SearchQueryTerm:
    return _get_term(term.words, term.is_quoted, not term.is_excluded)


def _get_operand_groups(
    operand: SearchQueryTerm | _Bracket,
) -> tuple[tuple[SearchQueryTerm, ...], ...]:
    if isinstance(operand, SearchQueryTerm):
        return ((operand,),)
    # NOTE: a bracket is an AND of clauses of alternatives, so leaving it out is an OR of groups that each leave out every alternative of one clause
    if operand.is_excluded:
        return tuple(
            tuple(_get_negated_term(term) for term in clause)
            for clause in operand.clauses
        )
    return tuple(product(*operand.clauses))


def _get_operand_group_count(operand: SearchQueryTerm | _Bracket) -> int:
    if isinstance(operand, SearchQueryTerm):
        return 1
    if operand.is_excluded:
        return len(operand.clauses)
    return prod(len(clause) for clause in operand.clauses)


def _get_operand_terms(
    operand: SearchQueryTerm | _Bracket,
) -> tuple[SearchQueryTerm, ...]:
    if isinstance(operand, SearchQueryTerm):
        return (operand,)
    if operand.is_excluded:
        return tuple(
            _get_negated_term(term) for clause in operand.clauses for term in clause
        )
    return tuple(term for clause in operand.clauses for term in clause)


def _get_all_search_query_groups(query: str) -> tuple[SearchQueryGroup, ...]:
    clause_groups = [
        [group for operand in clause for group in _get_operand_groups(operand)]
        for clause in _get_search_query_clauses(query)
    ]
    return tuple(
        SearchQueryGroup(terms=tuple(term for group in combination for term in group))
        for combination in product(*clause_groups)
    )


def get_search_query_group_count(query: str) -> int:
    return prod(
        sum(_get_operand_group_count(operand) for operand in clause)
        for clause in _get_search_query_clauses(query)
    )


def get_search_query_groups(query: str) -> tuple[SearchQueryGroup, ...]:
    return tuple(
        group
        for group in _get_all_search_query_groups(query)
        if _is_group_searchable(group.terms)
    )


# NOTE: read from the clauses rather than the groups, because it runs before the group count is checked; every term lands in at least one group, so the answer is the same
def is_query_only_excluded_words(query: str) -> bool:
    terms = [
        term
        for clause in _get_search_query_clauses(query)
        for operand in clause
        for term in _get_operand_terms(operand)
    ]
    return terms != [] and all(term.is_excluded for term in terms)


def get_excluded_term_groups(query: str) -> tuple[SearchQueryGroup, ...]:
    return tuple(
        SearchQueryGroup(terms=tuple(term for term in group.terms if term.is_excluded))
        for group in _get_all_search_query_groups(query)
        if any(term.is_excluded for term in group.terms)
    )


def is_quote_in_query(query: str) -> bool:
    return _QUOTE in _get_query_to_parse(query)


def is_quoted_or_query(query: str) -> bool:
    return len(get_search_query_groups(query)) > 1 and is_quote_in_query(query)


def is_hyphenated_word_in_query(query: str) -> bool:
    return any(
        _HYPHEN in word
        for group in get_search_query_groups(query)
        for term in group.terms
        if not term.is_excluded
        for word in term.words
    )


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
    # NOTE: a bracket repeats each term outside it in every group, so each term is listed once
    return _WEBSEARCH_OR.join(
        dict.fromkeys(
            _get_websearch_term(term)
            for group in groups
            for term in group.terms
            if term.is_quoted and not term.is_excluded
        )
    )


def _get_words_to_mark(term: SearchQueryTerm) -> tuple[str, ...]:
    content_words = tuple(
        word for word in term.words if word.lower() not in _STOP_WORDS
    )
    # NOTE: Postgres marks every word of a quoted phrase wherever it appears, so a stop word in the phrase would mark each "of" in the text; a phrase of stop words alone keeps them, or nothing would be marked
    if content_words == () and term.is_quoted:
        return term.words
    return content_words


def get_words_to_mark_websearch_query(groups: tuple[SearchQueryGroup, ...]) -> str:
    return _WEBSEARCH_OR.join(
        dict.fromkeys(
            _QUOTE + word + _QUOTE
            for group in groups
            for term in group.terms
            if not term.is_excluded
            for word in _get_words_to_mark(term)
        )
    )


def get_stemmed_websearch_query(groups: tuple[SearchQueryGroup, ...]) -> str:
    return _WEBSEARCH_OR.join(
        dict.fromkeys(
            _get_websearch_term(term)
            for group in groups
            for term in group.terms
            if not term.is_quoted and not term.is_excluded
        )
    )


def get_quoted_words_to_mark(groups: tuple[SearchQueryGroup, ...]) -> list[str]:
    return [
        word.lower()
        for group in groups
        for term in group.terms
        if term.is_quoted and not term.is_excluded
        for word in _get_words_to_mark(term)
    ]
