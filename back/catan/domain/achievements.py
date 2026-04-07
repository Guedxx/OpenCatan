from __future__ import annotations

from dataclasses import dataclass
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .player import Player


@dataclass
class AchievementManager:
    largest_army_owner_id: int | None = None
    longest_road_owner_id: int | None = None

    def update_largest_army(self, players: list["Player"]) -> None:
        by_id = {player.id: player for player in players}
        eligible = [
            player for player in players if getattr(player, "played_knights", 0) >= 3
        ]
        current_holder = self.largest_army_owner_id

        if not eligible:
            self.largest_army_owner_id = None
            for player in players:
                player.has_largest_army = False
            return

        eligible_sorted = sorted(
            eligible,
            key=lambda player: getattr(player, "played_knights", 0),
            reverse=True,
        )
        top_player = eligible_sorted[0]
        top_score = getattr(top_player, "played_knights", 0)
        tied_top = [
            player
            for player in eligible
            if getattr(player, "played_knights", 0) == top_score
        ]

        winner_id: int | None
        if current_holder is None:
            winner_id = top_player.id if len(tied_top) == 1 else None
        else:
            current_score = getattr(by_id.get(current_holder), "played_knights", 0)
            if top_score > current_score:
                winner_id = top_player.id if len(tied_top) == 1 else current_holder
            else:
                winner_id = current_holder

        self.largest_army_owner_id = winner_id
        for player in players:
            player.has_largest_army = player.id == winner_id

    def update_longest_road(
        self, lengths: dict[int, int], players: list["Player"]
    ) -> None:
        eligible = [
            (player_id, length) for player_id, length in lengths.items() if length >= 5
        ]
        current_holder = self.longest_road_owner_id

        if not eligible:
            self.longest_road_owner_id = None
            for player in players:
                player.has_longest_road = False
            return

        eligible.sort(key=lambda item: item[1], reverse=True)
        top_player_id, top_length = eligible[0]
        tied_top = [item for item in eligible if item[1] == top_length]

        winner_id: int | None
        if current_holder is None:
            winner_id = top_player_id if len(tied_top) == 1 else None
        else:
            current_length = lengths.get(current_holder, 0)
            if current_length < 5:
                winner_id = top_player_id if len(tied_top) == 1 else None
            elif top_length > current_length:
                winner_id = top_player_id if len(tied_top) == 1 else current_holder
            else:
                winner_id = current_holder

        self.longest_road_owner_id = winner_id
        for player in players:
            player.has_longest_road = player.id == winner_id
