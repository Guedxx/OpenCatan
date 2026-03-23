# Core Patterns

This skill targets the local `boardgame.io` repo at `/home/xigo/Documents/UFF/ES2/boardgame.io`, version `0.50.2`.

## Game Object Checklist

Use these fields deliberately:

- `name`: stable match type identifier.
- `setup`: initialize `G`. It can read `ctx` and `setupData`.
- `validateSetupData`: reject invalid map or scenario input before match creation.
- `moves`: prefer exported standalone functions; use long-form only when special behavior is needed.
- `playerView`: strip hidden state before it reaches a client.
- `turn`: per-turn hooks, order, move limits, active players, stages.
- `phases`: macro rule changes across the match.
- `endIf`: return a payload for `ctx.gameover`.
- `onEnd`: end-of-game cleanup or final scoring materialization.

Long-form move fields worth remembering:

- `undoable`
- `redact`
- `client: false`
- `noLimit`
- `ignoreStaleStateID`

## State Placement

Use this split:

- `G`: canonical game state for the match.
- `ctx`: framework-owned flow state such as `currentPlayer`, `phase`, `turn`, `playOrder`, and active player stages.
- UI-local React state: transient presentation only.

Do not mutate `ctx` directly. Use `events`.

## Phases vs Stages

Use phases for game-wide mode switches:

- setup placement
- normal play
- special end-state handling

Use stages for within-turn restrictions or reactions:

- forced discard
- robber victim selection
- trade acceptance / rejection
- extra road placement after a card effect

Key rule: phases override global `moves` and may override `turn`; stages override available moves for active players during a turn.

## Turn Order

Built-in options include:

- `TurnOrder.DEFAULT`
- `TurnOrder.RESET`
- `TurnOrder.CONTINUE`
- `TurnOrder.ONCE`
- `TurnOrder.CUSTOM([...])`
- `TurnOrder.CUSTOM_FROM('fieldInG')`

For Catan-style snake setup, a custom `turn.order` or phase transition logic is usually clearer than encoding setup order inside UI code.

If the next player depends on current state, `events.endTurn({ next: playerID })` or `turn.endIf` returning `{ next }` is often enough.

## Active Players

When more than the current player must act, use `events.setActivePlayers`.

Common shapes:

```ts
events.setActivePlayers({ others: 'discard', minMoves: 1, maxMoves: 1 });
events.setActivePlayers({ currentPlayer: 'robber', next: { currentPlayer: 'trade' } });
events.setActivePlayers({ value: { '0': 'respond', '2': 'respond' }, revert: true });
```

Use:

- `minMoves` to force a response before `endStage`
- `maxMoves` to auto-close a stage
- `revert: true` to return to the previous active-player configuration
- `next` when empty active players should transition automatically

## Hidden Information

Use `playerView` when clients should receive filtered state.

Patterns that fit OpenCatan:

- resources or dev cards stored under per-player records
- robber draw / steal operations hidden from other players until resolved
- secret deck order never exposed to clients

If a move requires hidden state or server-only RNG, use:

```ts
{
  move: ({ G, random }) => { /* ... */ },
  client: false,
}
```

Do not rely on the client merely choosing not to render secret data.

## Randomness

Use only boardgame.io randomness helpers:

- `random.Die(n, count)`
- `random.D6()`
- `random.Number()`
- `random.Shuffle(array)`

Use `seed` for reproducible tests. For exact control, use `MockRandom` from `boardgame.io/testing`.

## Events

Events change flow, not `G`:

- `endStage`
- `endTurn`
- `endPhase`
- `endGame`
- `setStage`
- `setPhase`
- `setActivePlayers`

Events called inside a move are queued and processed after the move's `G` updates.

## Plugin Guidance

Reach for a custom plugin only if normal moves, helpers, `playerView`, and stages are not enough.

`PluginPlayer` is the one built-in plugin most likely to help OpenCatan if per-player state needs a structured private store with helper accessors.

## Upstream Files

Read these first when details matter:

- `/home/xigo/Documents/UFF/ES2/boardgame.io/docs/documentation/api/Game.md`
- `/home/xigo/Documents/UFF/ES2/boardgame.io/docs/documentation/phases.md`
- `/home/xigo/Documents/UFF/ES2/boardgame.io/docs/documentation/stages.md`
- `/home/xigo/Documents/UFF/ES2/boardgame.io/docs/documentation/turn-order.md`
- `/home/xigo/Documents/UFF/ES2/boardgame.io/docs/documentation/events.md`
- `/home/xigo/Documents/UFF/ES2/boardgame.io/docs/documentation/secret-state.md`
- `/home/xigo/Documents/UFF/ES2/boardgame.io/docs/documentation/random.md`

