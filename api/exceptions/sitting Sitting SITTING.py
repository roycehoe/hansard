from exceptions.base import AppHttpExceptionBase, ErrorCode


class NotFoundException(AppHttpExceptionBase):
    def __init__(self):
        super().__init__(ErrorCode._NOT_FOUND)
