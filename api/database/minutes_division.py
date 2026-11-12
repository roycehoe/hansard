from typing import Optional

from sqlalchemy.dialects.postgresql import ENUM
from sqlmodel import Field, SQLModel

from enums import DivisionListStatus, MinutesDivisionPairing


class MinutesDivision(SQLModel, table=True):
    __tablename__ = "minutes_division"  # type: ignore[assignment]

    id: int = Field(primary_key=True)
    ordinal: int
    printed_counts: str
    printed_list: Optional[str] = None
    list_status: DivisionListStatus = Field(
        sa_type=ENUM(DivisionListStatus, name="divisionliststatus", create_type=False)
    )
    pairing: MinutesDivisionPairing = Field(
        sa_type=ENUM(
            MinutesDivisionPairing, name="minutesdivisionpairing", create_type=False
        )
    )
    minutes_id: int
    division_id: int
