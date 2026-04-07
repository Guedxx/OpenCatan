# Frontend Integration Contract

Canonical contract for `front` <-> `back` integration.

This document reflects the current backend implementation in:

- `catan/api/server.py`
- `catan/api/schemas.py`
- `catan/api/runtime.py`
- `catan/api/serialize.py`

## Base URLs

- HTTP: `http://localhost:8000`
- WS: `ws://localhost:8000`

## Transport Model

- Backend is authoritative.
- Frontend sends intent commands only.
- Frontend renders server snapshots.
- Use HTTP for create/state/commands.
- Use WebSocket for realtime notifications.

## Endpoints

- `GET /health`
- `POST /games`
- `GET /games/{game_id}/state?player_token=...`
- `POST /games/{game_id}/commands`
- `WS /ws/games/{game_id}`

## Game Bootstrap

1. Call `POST /games` with 2-4 players.
2. Persist `game_id` + each `player.token`.
3. Connect to `WS /ws/games/{game_id}`.
4. Immediately request WS snapshot (include `player_token`) and/or call `GET /state`.

Create-game request example:

```json
{
  "players": [
    { "name": "Alice", "color": "red" },
    { "name": "Bob", "color": "blue" }
  ]
}
```

Create-game response includes:

- `game_id`
- `version`
- `players[]` with `player_id`, `name`, `color`, `token`
- initial `state` envelope

Default colors (if omitted):

- `red`, `blue`, `white`, `orange`

## State Envelope

Returned by:

- `GET /games/{game_id}/state`
- successful `POST /commands` (as `response.state`)
- WS `snapshot` response payload

Shape:

```json
{
  "game_id": "...",
  "version": 1,
  "public_state": { ... },
  "private_state": { ... } | null
}
```

`private_state` is `null` unless a valid `player_token` is provided.

## Public State Fields (important)

- `phase`: `SETUP_1 | SETUP_2 | MAIN | FINISHED`
- `turn`:
  - `number`
  - `current_player_id`
  - `turn_phase`: `ROLL | TRADE | BUILD | END`
  - `last_roll`
- `board`:
  - `robber_tile_id`
  - `tiles[]`: `id`, `resource`, `number_token`, `vertex_ids[6]`, `edge_ids[6]`, `has_robber`
  - `vertices[]`: `id`, adjacency, `port_id`, `building`
  - `edges[]`: `id`, `v1`, `v2`, `adjacent_tile_ids`, `road`
  - `ports[]`: `id`, `port_type`, `trade_ratio`, `vertex_ids[2]`
- `players[]`:
  - `id`, `name`, `color`
  - `resource_count`, `dev_card_count`
  - `roads`, `settlements`, `cities`
  - `victory_points`, `played_knights`, `has_longest_road`, `has_largest_army`
- `bank`: resource counts + dev cards remaining
- `pending`:
  - `pending_discards` (map `player_id -> required_count`)
  - `robber_move_required` (bool)
  - `pending_trade_offer` (or `null`)
  - `setup`: round/order/index/pending road player

## Private State Fields (important)

- `player_id`
- `resources` (exact hand by resource)
- `dev_cards` (exact cards)
- `new_dev_cards_this_turn` (unplayable this turn)
- `legal_actions` (authoritative UI enablement)

Frontend should gate buttons/actions from `legal_actions` first.

## Command Request/Response

Request:

```json
{
  "player_token": "...",
  "command": "roll_dice",
  "payload": {},
  "request_id": "optional-idempotency-key",
  "expected_version": 3
}
```

Response:

```json
{
  "accepted": true,
  "version": 4,
  "reason": null,
  "idempotent_replay": false,
  "events": [ ... ],
  "state": { ... }
}
```

On rejection:

- `accepted = false`
- `reason` explains why
- HTTP status is still `200` for rule-level rejections
- invalid token is `401`; missing game is `404`

## Command Enum (exact names)

- `place_setup_settlement`
- `place_setup_road`
- `discard_resources`
- `roll_dice`
- `move_robber`
- `build_road`
- `build_settlement`
- `build_city`
- `buy_development_card`
- `play_development_card`
- `trade_bank`
- `propose_trade_offer`
- `respond_trade_offer`
- `cancel_trade_offer`
- `end_turn`

## Payload Contracts

### Setup / Build / Turn

- `place_setup_settlement`: `{ "vertex_id": int }`
- `place_setup_road`: `{ "edge_id": int }`
- `build_settlement`: `{ "vertex_id": int }`
- `build_city`: `{ "vertex_id": int }`
- `build_road`: `{ "edge_id": int }`
- `roll_dice`: `{}`
- `end_turn`: `{}`

### Roll 7 Discard Flow

- `discard_resources`:

```json
{ "resources": { "brick": 2, "wool": 1 } }
```

Resource keys are case-insensitive enum names.

### Robber

- `move_robber`:

```json
{ "tile_id": 5, "victim_id": 2 }
```

`victim_id` optional.

### Development Cards

- `buy_development_card`: `{}`

- `play_development_card`:

```json
{
  "card_type": "knight",
  "args": { "tile_id": 7, "victim_id": 2 }
}
```

`card_type` values:

- `knight`
- `road_building`
- `year_of_plenty`
- `monopoly`
- `victory_point` (cannot be actively played; backend rejects)

`args` by card:

- `knight`: `{ "tile_id": int, "victim_id"?: int }`
- `road_building`: `{ "edge_ids": [int, int] }`
- `year_of_plenty`: `{ "resources": ["brick", "ore"] }`
- `monopoly`: `{ "resource": "wool" }`

### Bank Trade

- `trade_bank`:

```json
{
  "give": { "brick": 4 },
  "receive": { "ore": 1 }
}
```

### Two-step Player Trade

- `propose_trade_offer`:

```json
{
  "to_player_id": 2,
  "give": { "brick": 1 },
  "receive": { "wool": 1 }
}
```

- `respond_trade_offer`:

```json
{ "offer_id": "...", "accept": true }
```

- `cancel_trade_offer`:

```json
{ "offer_id": "..." }
```

## WebSocket Contract

Connect:

- `WS /ws/games/{game_id}`

Server -> client messages:

- `connected`
- `snapshot`
- `game_state_updated`
- `error`
- `pong`

Client -> server messages:

- `{"type":"ping","payload":{}}`
- `{"type":"snapshot","payload":{"player_token":"..."}}`

Important:

- `game_state_updated` contains public state only.
- Frontend should re-fetch `GET /state?player_token=...` after update to refresh private hand/legal actions.

## Recommended Frontend Sync Logic

1. On every command send `expected_version` = current local version.
2. Include unique `request_id` to make retries idempotent.
3. If command rejected with version mismatch, immediately refetch state.
4. After any accepted command, trust returned `state` and replace local snapshot.
5. On WS `game_state_updated`, refresh full state via REST for private updates.

## Game Flow Notes

- Setup is strict snake order and enforced server-side.
- On roll `7`, required players must discard before robber moves.
- Build/trade/dev actions require legal turn state.
- Development cards bought this turn are not playable this turn.
- One non-victory development card per turn.
- Victory point cards are passive.

## UI Guidance

- Use `private_state.legal_actions` as primary button/interaction gating.
- Use `public_state.pending` for overlays/modals:
  - discard modal
  - robber-required prompt
  - incoming trade offer modal
- Show backend `reason` in toast on rejected command.

## Limits and Current Scope

- In-memory sessions only (server restart resets matches).
- No auth beyond `player_token`.
- No persistence/replay API yet.
