from exceptions.base import AppHttpExceptionBase, ErrorCode


class BillNotFoundException(AppHttpExceptionBase):
    def __init__(self):
        super().__init__(ErrorCode.BILL_NOT_FOUND)
