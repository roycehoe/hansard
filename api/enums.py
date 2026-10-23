from enum import StrEnum


class ReportType(StrEnum):
    ORAL_ANSWER = "oral-answer"
    WRITTEN_ANSWER = "written-answer"
    WRITTEN_ANSWER_NA = "written-answer-na"
    CLARIFICATION = "clarification"
    MOTION = "motion"
    MATTER_ADJ = "matter-adj"
    BILL = "bill"
    BILL_INTRO = "bill-intro"
    MINISTERIAL_STATEMENT = "ministerial-statement"
    WRITTEN_STATEMENT = "written-statement"
    BUDGET = "budget"
    SPEAKER = "speaker"
    DEPUTY_SPEAKER = "deputy-speaker"
    PERSONAL_EXPLANATION = "personal-explanation"
    POINT_OF_ORDER = "point-of-order"
    TRIBUTE = "tribute"
    PRESIDENT_ADDRESS = "president-address"
    PETITION = "petition"
    ADMIN_OATHS = "admin-oaths"
    OBITUARY_SPEECH = "obituary-speech"
    YANG_DI_MESSAGE = "yang-di-message"
    MISC = "misc"
    ATBP = "atbp"


class SearchSort(StrEnum):
    RELEVANCE = "relevance"
    DATE = "date"
    OLDEST = "oldest"


class SpeechKind(StrEnum):
    SPEECH = "SPEECH"
    PROCEDURAL = "PROCEDURAL"
    CHAMBER_EVENT = "CHAMBER_EVENT"
    EDITORIAL_NOTE = "EDITORIAL_NOTE"
    DOCUMENT_TEXT = "DOCUMENT_TEXT"
    HEADING = "HEADING"
    UNCLASSIFIED = "UNCLASSIFIED"


class ColumnNote(StrEnum):
    LIKELY_MISPRINT = "LIKELY_MISPRINT"
    SPEAKER_NAMED_IN_COLUMN_BEFORE = "SPEAKER_NAMED_IN_COLUMN_BEFORE"
    PRINTED_WITH_L_FOR_1 = "PRINTED_WITH_L_FOR_1"


class DatePrecision(StrEnum):
    DAY = "DAY"
    MONTH = "MONTH"


class SpeechLinkStatus(StrEnum):
    FOUND = "found"
    MOVED = "moved"
    MISSING = "missing"


class PreviewType(StrEnum):
    ARTICLE = "article"
    WEBSITE = "website"


class RefreshRunStatus(StrEnum):
    RUNNING = "RUNNING"
    SUCCEEDED = "SUCCEEDED"
    HALTED = "HALTED"
    FAILED = "FAILED"
