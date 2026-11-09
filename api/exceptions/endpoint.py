from exceptions.base import AppHttpExceptionBase, ErrorCode


class EndpointNotFoundException(AppHttpExceptionBase):
    def __init__(self):
        super().__init__(ErrorCode.ENDPOINT_NOT_FOUND)
