from exceptions.base import AppHttpExceptionBase, ErrorCode


class PersonNotFoundException(AppHttpExceptionBase):
    def __init__(self):
        super().__init__(ErrorCode.PERSON_NOT_FOUND)
