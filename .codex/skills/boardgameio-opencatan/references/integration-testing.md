# Integration And Testing

## Client Choices

Prefer `boardgame.io/react` for the OpenCatan board UI.

Use:

- `Client` from `boardgame.io/react` for the mounted game component
- `BoardProps<G>` in TypeScript board components
- `Client` from `boardgame.io/client` for scenario tests and non-React harnesses

Minimal React shape:

```ts
import { Client } from 'boardgame.io/react';

const App = Client({
  game: OpenCatanGame,
  board: OpenCatanBoard,
});
```

Keep the board component thin:

- render from `G`, `ctx`, `isActive`, `playerID`, `matchData`
- dispatch via `moves.*` and `events.*`
- avoid duplicating rule checks that the game logic already enforces

## Multiplayer Choices

Use `Local()` first while developing turn flow and multi-client interactions.

```ts
import { Local } from 'boardgame.io/multiplayer';

const App = Client({
  game: OpenCatanGame,
  board: OpenCatanBoard,
  multiplayer: Local(),
});
```

Switch to `SocketIO({ server })` only when the task actually needs a remote master.

When using a remote master:

- expect the client state to be `null` before initial sync
- ensure every acting client has the right `playerID`
- if credentials are enabled, wire `matchID`, `playerID`, and `credentials` together explicitly

## Server And Lobby

Use `Server` from `boardgame.io/server` for remote multiplayer.

Typical concerns:

- `games: [OpenCatanGame]`
- `origins` configured for local dev or the deployed frontend
- optional `db` only when persistence matters
- optional auth hooks only when credential policy must be customized

If matchmaking or authenticated seats matter, use the Lobby API or `LobbyClient`.

Useful lobby flows:

- `createMatch`
- `listMatches`
- `joinMatch`
- `leaveMatch`
- `updatePlayer`

Use `validateSetupData` in the game if lobby-created matches accept custom map or scenario data.

## Suggested OpenCatan Layout

If the repo still has no established structure, start from something close to:

```text
src/
  game/
    game.ts
    moves/
    phases/
    selectors/
    setup.ts
  ui/
    board/
    components/
  server/
    index.ts
tests/
  game/
  ui/
```

Guidelines:

- keep move logic and pure helpers outside React
- keep selectors separate from mutating moves
- keep server bootstrap isolated from game rules

## Testing Recipes

### Move Unit Tests

Export move helpers and test them against in-memory `G`.

### Scenario Tests

Use `Client({ game })` from `boardgame.io/client`, override `setup` for the starting scenario, run moves, then assert on `client.getState()`.

### Multiplayer Tests

Use `Local()` with multiple clients and distinct `playerID`s to verify sync and flow transitions.

### Random Tests

Use:

- `seed` for reproducible sequences
- `MockRandom` for exact outcomes

### UI Tests

Test the React board as a client of the game logic, not as the authority for rules.

## Upstream Files

Read these when needed:

- `/home/xigo/Documents/UFF/ES2/boardgame.io/docs/documentation/api/Client.md`
- `/home/xigo/Documents/UFF/ES2/boardgame.io/docs/documentation/api/Server.md`
- `/home/xigo/Documents/UFF/ES2/boardgame.io/docs/documentation/api/Lobby.md`
- `/home/xigo/Documents/UFF/ES2/boardgame.io/docs/documentation/multiplayer.md`
- `/home/xigo/Documents/UFF/ES2/boardgame.io/docs/documentation/testing.md`
- `/home/xigo/Documents/UFF/ES2/boardgame.io/docs/documentation/typescript.md`
- `/home/xigo/Documents/UFF/ES2/boardgame.io/examples/react-web/src/tic-tac-toe/game.js`
- `/home/xigo/Documents/UFF/ES2/boardgame.io/examples/react-web/server.js`
