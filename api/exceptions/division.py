from exceptions.base import AppHttpExceptionBase, ErrorCode


class DivisionNotFoundException(AppHttpExceptionBase):
    def __init__(self):
        super().__init__(ErrorCode.DIVISION_NOT_FOUND)
