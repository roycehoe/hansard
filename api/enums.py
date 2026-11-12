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


class PersonReportFilter(StrEnum):
    ASKED = "asked"


class SearchEndpoint(StrEnum):
    SPEECHES = "/search/speeches"
    REPORTS = "/search/reports"
    MATCHED_WORDS = "/reports/{report_slug}/matched-words"


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


class PersonNameSpellingKind(StrEnum):
    CANONICAL = "CANONICAL"
    OTHER_SPELLING = "OTHER_SPELLING"
    TRANSLITERATION = "TRANSLITERATION"
    OTHER_NAME = "OTHER_NAME"


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


class ReportLinkType(StrEnum):
    CORRECTION = "CORRECTION"
    REPLY = "REPLY"
    CONTINUATION = "CONTINUATION"


class ReportLinkRelation(StrEnum):
    CORRECTS = "corrects"
    CORRECTED_BY = "corrected_by"
    REFERS_TO = "refers_to"
    CONTINUES = "continues"


class LeaveEntryFormat(StrEnum):
    STRUCTURED_LIST = "STRUCTURED_LIST"
    PROSE_RANGE = "PROSE_RANGE"
    PROSE_SINGLE_DAY = "PROSE_SINGLE_DAY"
    PROSE_DAY_LIST = "PROSE_DAY_LIST"
    PROSE_DURATION = "PROSE_DURATION"
    PROSE_MIXED = "PROSE_MIXED"
    TABLE_ROW = "TABLE_ROW"
    UNREAD = "UNREAD"


class LeaveNameSource(StrEnum):
    PRINTED = "PRINTED"
    CARRIED_FROM_ROW_ABOVE = "CARRIED_FROM_ROW_ABOVE"
    NONE = "NONE"


class LeaveYearSource(StrEnum):
    NEAREST_TO_SITTING = "NEAREST_TO_SITTING"
    PRINTED_IN_ENTRY = "PRINTED_IN_ENTRY"
    PRINTED_COLUMN_HEADING = "PRINTED_COLUMN_HEADING"


class LeaveOfficeSource(StrEnum):
    PRINTED_ON_ENTRY = "PRINTED_ON_ENTRY"
    ATTENDANCE_LIST = "ATTENDANCE_LIST"


class BillStage(StrEnum):
    FIRST_READING = "FIRST_READING"
    SECOND_READING_ORDER = "SECOND_READING_ORDER"
    SECOND_READING_AGREED = "SECOND_READING_AGREED"
    THIRD_READING = "THIRD_READING"


class BillReportRole(StrEnum):
    READING = "READING"
    BUDGET_DEBATE = "BUDGET_DEBATE"


class ActHistoryEntryKind(StrEnum):
    ACT = "ACT"
    ORDINANCE = "ORDINANCE"
    REVISED_EDITION = "REVISED_EDITION"
    SUBSIDIARY_LEGISLATION = "SUBSIDIARY_LEGISLATION"
    OTHER = "OTHER"


class BillLinkSource(StrEnum):
    FIRST_READING_DATE = "FIRST_READING_DATE"
    THIRD_READING_DATE = "THIRD_READING_DATE"
    SECOND_READING_DATE = "SECOND_READING_DATE"
    LOOSE_TITLE_READING_DATES = "LOOSE_TITLE_READING_DATES"
    SIMILAR_TITLE_READING_DATES = "SIMILAR_TITLE_READING_DATES"
    HAND_KEPT = "HAND_KEPT"
    BILL_NUMBER_PASSING_DATE = "BILL_NUMBER_PASSING_DATE"


class OfficeClass(StrEnum):
    PRIME_MINISTER = "PRIME_MINISTER"
    DEPUTY_PRIME_MINISTER = "DEPUTY_PRIME_MINISTER"
    MINISTER = "MINISTER"
    SENIOR_MINISTER_OF_STATE = "SENIOR_MINISTER_OF_STATE"
    MINISTER_OF_STATE = "MINISTER_OF_STATE"
    SENIOR_PARLIAMENTARY_SECRETARY = "SENIOR_PARLIAMENTARY_SECRETARY"
    PARLIAMENTARY_SECRETARY = "PARLIAMENTARY_SECRETARY"
    OTHER = "OTHER"


class AttendanceOfficeSource(StrEnum):
    AFTER_CONSTITUENCY_BRACKET = "AFTER_CONSTITUENCY_BRACKET"
    AFTER_NAME_COMMA = "AFTER_NAME_COMMA"
    CHAIR_FORM = "CHAIR_FORM"
    BEFORE_EX_OFFICIO_BRACKET = "BEFORE_EX_OFFICIO_BRACKET"


class OfficeTitleMinistrySource(StrEnum):
    CLOSED_LIST_RULE = "CLOSED_LIST_RULE"
    HAND_KEPT_TITLE = "HAND_KEPT_TITLE"


class ParticipantRole(StrEnum):
    ASKER = "ASKER"
    ABSENT_FILER = "ABSENT_FILER"
    READER = "READER"
    ASKER_FOLLOW_UP = "ASKER_FOLLOW_UP"
    SUPPLEMENTARY = "SUPPLEMENTARY"
    ANSWERER = "ANSWERER"
    CHAIR = "CHAIR"
    UNLABELLED = "UNLABELLED"


class MinistryQuestionRelation(StrEnum):
    PUT_TO = "put_to"
    ANSWERED_BY = "answered_by"
