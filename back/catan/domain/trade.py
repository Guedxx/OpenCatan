from __future__ import annotations

from dataclasses import dataclass
from uuid import uuid4

from .enums import ResourceType


@dataclass(frozen=True)
class TradeOffer:
    id: str
    from_player_id: int
    to_player_id: int
    give: dict[ResourceType, int]
    receive: dict[ResourceType, int]

    @classmethod
    def create(
        cls,
        from_player_id: int,
        to_player_id: int,
        give: dict[ResourceType, int],
        receive: dict[ResourceType, int],
    ) -> "TradeOffer":
        return cls(
            id=uuid4().hex,
            from_player_id=from_player_id,
            to_player_id=to_player_id,
            give=give,
            receive=receive,
        )
