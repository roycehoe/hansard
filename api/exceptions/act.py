from exceptions.base import AppHttpExceptionBase, ErrorCode


class ActNotFoundException(AppHttpExceptionBase):
    def __init__(self):
        super().__init__(ErrorCode.ACT_NOT_FOUND)
