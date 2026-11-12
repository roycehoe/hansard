from exceptions.base import AppHttpExceptionBase, ErrorCode


class OfficeMinistryNotFoundException(AppHttpExceptionBase):
    def __init__(self):
        super().__init__(ErrorCode.OFFICE_MINISTRY_NOT_FOUND)


class OfficeMembershipNotFoundException(AppHttpExceptionBase):
    def __init__(self):
        super().__init__(ErrorCode.OFFICE_MEMBERSHIP_NOT_FOUND)
