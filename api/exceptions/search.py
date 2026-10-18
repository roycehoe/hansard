from exceptions.base import AppHttpExceptionBase, ErrorCode


class SearchTimedOutException(AppHttpExceptionBase):
    def __init__(self):
        super().__init__(ErrorCode.SEARCH_TIMED_OUT)


class SearchBusyException(AppHttpExceptionBase):
    def __init__(self):
        super().__init__(ErrorCode.SEARCH_BUSY)


class SearchFilterRequiredException(AppHttpExceptionBase):
    def __init__(self):
        super().__init__(ErrorCode.SEARCH_FILTER_REQUIRED)
