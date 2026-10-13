from exceptions.base import AppHttpExceptionBase, ErrorCode


class SittingNotFoundException(AppHttpExceptionBase):
    def __init__(self):
        super().__init__(ErrorCode.SITTING_NOT_FOUND)
