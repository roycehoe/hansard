from typing import Optional

from sqlalchemy.dialects.postgresql import ENUM
from sqlmodel import Field, SQLModel

from enums import DivisionVoteChoice, DivisionVoteListSource


class DivisionVote(SQLModel, table=True):
    __tablename__ = "division_vote"  # type: ignore[assignment]

    id: int = Field(primary_key=True)
    ordinal: int
    printed_name: str
    vote_choice: DivisionVoteChoice = Field(
        sa_type=ENUM(DivisionVoteChoice, name="divisionvotechoice", create_type=False)
    )
    list_source: DivisionVoteListSource = Field(
        sa_type=ENUM(
            DivisionVoteListSource, name="divisionvotelistsource", create_type=False
        )
    )
    party: Optional[str] = None
    is_party_uncertain: bool
    division_id: int
    speaker_id: Optional[int] = None
