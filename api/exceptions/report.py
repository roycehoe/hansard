from exceptions.base import AppHttpExceptionBase, ErrorCode


class ReportNotFoundException(AppHttpExceptionBase):
    def __init__(self):
        super().__init__(ErrorCode.REPORT_NOT_FOUND)


class ReportTakenDownException(AppHttpExceptionBase):
    def __init__(self):
        super().__init__(ErrorCode.REPORT_TAKEN_DOWN)
