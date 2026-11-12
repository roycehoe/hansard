from exceptions.base import AppHttpExceptionBase, ErrorCode


class SeatConstituencyNotFoundException(AppHttpExceptionBase):
    def __init__(self):
        super().__init__(ErrorCode.SEAT_CONSTITUENCY_NOT_FOUND)
