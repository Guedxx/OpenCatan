from __future__ import annotations

from copy import deepcopy
from typing import Any

from fastapi.testclient import TestClient

from catan.api.server import app, store
from catan.domain.enums import DevelopmentCardType, ResourceType
from catan.domain.game import CatanGame


def _create_ready_game() -> tuple[TestClient, str, dict[str, Any], dict[str, Any], CatanGame]:
    client = TestClient(app)
    created = client.post(
        "/games",
        json={
            "players": [
                {"name": "Alice", "color": "red"},
                {"name": "Bob", "color": "blue"},
            ]
        },
    ).json()
    game_id = created["game_id"]
    p1, p2 = sorted(created["players"], key=lambda item: item["player_id"])

    setup_script = [
        (p1, "place_setup_settlement", {"vertex_id": 0}),
        (p1, "place_setup_road", {"edge_id": 0}),
        (p2, "place_setup_settlement", {"vertex_id": 10}),
        (p2, "place_setup_road", {"edge_id": 11}),
        (p2, "place_setup_settlement", {"vertex_id": 35}),
        (p2, "place_setup_road", {"edge_id": 45}),
        (p1, "place_setup_settlement", {"vertex_id": 47}),
        (p1, "place_setup_road", {"edge_id": 63}),
    ]
    for player, command, payload in setup_script:
        body = _command(client, game_id, player, command, payload)
        assert body["accepted"] is True

    session = store.get(game_id)
    session.game.dice.roll = lambda: 8  # type: ignore[method-assign]
    body = _command(client, game_id, p1, "roll_dice", {})
    assert body["accepted"] is True

    return client, game_id, p1, p2, session.game


def _command(
    client: TestClient,
    game_id: str,
    player: dict[str, Any],
    command: str,
    payload: dict[str, Any],
) -> dict[str, Any]:
    response = client.post(
        f"/games/{game_id}/commands",
        json={
            "player_token": player["token"],
            "command": command,
            "payload": payload,
        },
    )
    assert response.status_code == 200
    return response.json()


def _tile_with_victim(game: CatanGame, acting_player_id: int) -> int:
    robber_tile_id = game.board.robber.tile_id if game.board.robber else None
    for tile in game.board.tiles.values():
        if tile.id == robber_tile_id:
            continue
        victims = game.rules.robber_victims(
            game,
            tile.id,
            acting_player_id=acting_player_id,
        )
        if victims:
            return tile.id
    raise AssertionError("No robber target tile with a victim was found")


def _road_building_edges(game: CatanGame, player_id: int) -> list[int]:
    edge_ids = [edge.id for edge in game.board.edges.values() if edge.road is None]
    for first in edge_ids:
        for second in edge_ids:
            if first == second:
                continue
            candidate = deepcopy(game)
            try:
                candidate.play_development_card(
                    player_id,
                    DevelopmentCardType.ROAD_BUILDING,
                    args={"edge_ids": [first, second]},
                )
            except ValueError:
                continue
            return [first, second]
    raise AssertionError("No valid road building edge pair was found")


def test_play_development_card_api_payloads() -> None:
    client, game_id, p1, p2, game = _create_ready_game()
    alice = game.player_by_id(p1["player_id"])
    bob = game.player_by_id(p2["player_id"])

    bob.add_resource(ResourceType.BRICK, 1)
    alice.dev_cards_hand.append(DevelopmentCardType.KNIGHT)
    body = _command(
        client,
        game_id,
        p1,
        "play_development_card",
        {
            "card_type": "knight",
            "args": {
                "tile_id": _tile_with_victim(game, acting_player_id=alice.id),
                "victim_id": bob.id,
            },
        },
    )
    assert body["accepted"] is True
    assert body["events"][0]["card_type"] == "KNIGHT"
    assert alice.played_knights == 1

    game.played_non_vp_dev_this_turn = False
    alice.dev_cards_hand.append(DevelopmentCardType.YEAR_OF_PLENTY)
    before_brick = alice.resources.get(ResourceType.BRICK, 0)
    before_ore = alice.resources.get(ResourceType.ORE, 0)
    body = _command(
        client,
        game_id,
        p1,
        "play_development_card",
        {
            "card_type": "year_of_plenty",
            "args": {"resources": ["brick", "ore"]},
        },
    )
    assert body["accepted"] is True
    assert alice.resources.get(ResourceType.BRICK, 0) == before_brick + 1
    assert alice.resources.get(ResourceType.ORE, 0) == before_ore + 1

    game.played_non_vp_dev_this_turn = False
    bob.add_resource(ResourceType.WOOL, 3)
    alice.dev_cards_hand.append(DevelopmentCardType.MONOPOLY)
    before_alice_wool = alice.resources.get(ResourceType.WOOL, 0)
    body = _command(
        client,
        game_id,
        p1,
        "play_development_card",
        {"card_type": "monopoly", "args": {"resource": "wool"}},
    )
    assert body["accepted"] is True
    assert bob.resources.get(ResourceType.WOOL, 0) == 0
    assert alice.resources.get(ResourceType.WOOL, 0) >= before_alice_wool + 3

    game.played_non_vp_dev_this_turn = False
    alice.dev_cards_hand.append(DevelopmentCardType.ROAD_BUILDING)
    edge_ids = _road_building_edges(game, alice.id)
    body = _command(
        client,
        game_id,
        p1,
        "play_development_card",
        {"card_type": "road_building", "args": {"edge_ids": edge_ids}},
    )
    assert body["accepted"] is True
    assert all(game.board.edges[edge_id].road is not None for edge_id in edge_ids)

    game.played_non_vp_dev_this_turn = False
    alice.dev_cards_hand.append(DevelopmentCardType.VICTORY_POINT)
    body = _command(
        client,
        game_id,
        p1,
        "play_development_card",
        {"card_type": "victory_point", "args": {}},
    )
    assert body["accepted"] is False
    assert "Victory point cards are not played" in body["reason"]


def test_victory_point_cards_are_hidden_from_public_score() -> None:
    client, game_id, p1, p2, game = _create_ready_game()
    alice = game.player_by_id(p1["player_id"])
    visible_points = alice.visible_victory_points()
    alice.dev_cards_hand.append(DevelopmentCardType.VICTORY_POINT)

    public_for_bob = client.get(
        f"/games/{game_id}/state",
        params={"player_token": p2["token"]},
    ).json()
    alice_public = next(
        player
        for player in public_for_bob["public_state"]["players"]
        if player["id"] == alice.id
    )
    assert alice_public["victory_points"] == visible_points

    private_for_alice = client.get(
        f"/games/{game_id}/state",
        params={"player_token": p1["token"]},
    ).json()
    assert private_for_alice["private_state"]["victory_points"] == visible_points + 1


def test_failed_road_building_does_not_spend_card_or_build_partial_road() -> None:
    client, game_id, p1, _, game = _create_ready_game()
    alice = game.player_by_id(p1["player_id"])
    alice.dev_cards_hand.append(DevelopmentCardType.ROAD_BUILDING)
    first_edge_id = _road_building_edges(game, alice.id)[0]

    body = _command(
        client,
        game_id,
        p1,
        "play_development_card",
        {"card_type": "road_building", "args": {"edge_ids": [first_edge_id, 9999]}},
    )

    assert body["accepted"] is False
    assert DevelopmentCardType.ROAD_BUILDING in alice.dev_cards_hand
    assert game.board.edges[first_edge_id].road is None


def test_failed_year_of_plenty_does_not_spend_card_or_pay_partial_resource() -> None:
    client, game_id, p1, _, game = _create_ready_game()
    alice = game.player_by_id(p1["player_id"])
    alice.dev_cards_hand.append(DevelopmentCardType.YEAR_OF_PLENTY)
    game.bank.resource_cards[ResourceType.ORE] = 1
    before_ore = alice.resources.get(ResourceType.ORE, 0)

    body = _command(
        client,
        game_id,
        p1,
        "play_development_card",
        {
            "card_type": "year_of_plenty",
            "args": {"resources": ["ore", "ore"]},
        },
    )

    assert body["accepted"] is False
    assert DevelopmentCardType.YEAR_OF_PLENTY in alice.dev_cards_hand
    assert alice.resources.get(ResourceType.ORE, 0) == before_ore
    assert game.bank.resource_cards[ResourceType.ORE] == 1
