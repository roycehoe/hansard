from typing import Optional

from sqlalchemy.dialects.postgresql import ENUM
from sqlmodel import Field, SQLModel

from enums import DivisionVoteChoice, DivisionVoteListSource


class DivisionPartyCount(SQLModel, table=True):
    __tablename__ = "division_party_count"  # type: ignore[assignment]

    id: int = Field(primary_key=True)
    member_count: int
    uncertain_member_count: int
    party: Optional[str] = None
    list_source: DivisionVoteListSource = Field(
        sa_type=ENUM(
            DivisionVoteListSource, name="divisionvotelistsource", create_type=False
        )
    )
    vote_choice: DivisionVoteChoice = Field(
        sa_type=ENUM(DivisionVoteChoice, name="divisionvotechoice", create_type=False)
    )
    division_id: int
