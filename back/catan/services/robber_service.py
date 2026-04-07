from __future__ import annotations

import random
from typing import TYPE_CHECKING

from catan.domain.enums import ResourceType

if TYPE_CHECKING:
    from catan.domain.game import CatanGame


class RobberService:
    @staticmethod
    def move_and_rob(
        game: "CatanGame",
        player_id: int,
        tile_id: int,
        victim_id: int | None = None,
        rng: random.Random | None = None,
    ) -> ResourceType | None:
        game.board.move_robber(tile_id)
        victims = game.rules.robber_victims(game, tile_id, acting_player_id=player_id)
        if not victims:
            return None

        target_id = victim_id if victim_id in victims else victims[0]
        victim = game.player_by_id(target_id)
        stealable = _weighted_hand(victim.resources)
        if not stealable:
            return None

        stolen_resource = (rng or random).choice(stealable)
        victim.remove_resource(stolen_resource, 1)
        game.player_by_id(player_id).add_resource(stolen_resource, 1)
        return stolen_resource


def _weighted_hand(resource_counts: dict[ResourceType, int]) -> list[ResourceType]:
    weighted: list[ResourceType] = []
    for resource, amount in resource_counts.items():
        if amount <= 0:
            continue
        weighted.extend([resource] * amount)
    return weighted
