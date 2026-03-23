---
name: boardgameio-opencatan
description: Use this when working on OpenCatan features that depend on boardgame.io, including game definitions, moves, phases, stages, turn order, secret state, React client wiring, multiplayer/server setup, lobby integration, and tests. This skill targets the local boardgame.io 0.50.2 source and documentation at /home/xigo/Documents/UFF/ES2/boardgame.io.
---

# boardgame.io for OpenCatan

Use this skill for any OpenCatan task that implements, refactors, debugs, or explains `boardgame.io` behavior.

Treat `/home/xigo/Documents/UFF/ES2/boardgame.io` as the primary source. Do not guess API names or behavior when the local docs or source can confirm them.

## Start Here

Read only what you need:

- For core framework decisions, read [references/core-patterns.md](references/core-patterns.md).
- For client, server, lobby, and test setup, read [references/integration-testing.md](references/integration-testing.md).
- If the references are insufficient, inspect the sibling repo docs under `/home/xigo/Documents/UFF/ES2/boardgame.io/docs/documentation` and examples under `/home/xigo/Documents/UFF/ES2/boardgame.io/examples/react-web`.

## Working Rules

- Keep game rules in the `Game` object and move functions, not in React components.
- Put authoritative game state in `G`; let `ctx` manage turn / phase / active player flow.
- Prefer standalone move functions exported next to the game definition so they are easy to test.
- Use `events` to advance flow. Do not hand-edit `ctx`.
- Use `random` helpers from boardgame.io. Never use `Math.random()` in game logic.
- Use long-form moves only when you need `undoable`, `redact`, `client`, `noLimit`, or `ignoreStaleStateID`.
- When a move depends on hidden information or server-only randomness, mark it `client: false`.
- Use `playerView` or `PluginPlayer` when players should not receive each other's private state.
- Start with the smallest framework feature that fits: plain moves first, then phases, then stages / `activePlayers`, then custom plugins if needed.

## OpenCatan Defaults

When the repo does not yet establish a stronger pattern, use these defaults:

- Prefer TypeScript for game logic and React UI code.
- Keep static board topology separate from mutable match state.
- Model macro flow with phases, for example `setup`, `main`, and `gameover`.
- Model within-turn subflows with stages or `setActivePlayers`, for example discard prompts, robber resolution, trade responses, or road-building side effects.
- Use custom turn order or phase hooks for snake-order setup.
- Keep hidden resources, development cards, or unrevealed draws out of publicly visible state.
- Store only canonical state in `G`; compute derived summaries in selectors / helpers unless persistence is necessary.

## Recommended Workflow

1. Inspect the current OpenCatan files that define game state, moves, board UI, and tests.
2. Map the requested behavior to the minimum boardgame.io primitives needed.
3. Implement or update standalone move / helper functions first.
4. Wire those functions into the `Game` definition.
5. Keep the board component thin: read props, render state, dispatch moves / events.
6. Add or update tests:
   - unit tests for move helpers
   - scenario tests with `Client`
   - local multiplayer tests with `Local()`
   - deterministic random tests with `seed` or `MockRandom`
7. If multiplayer or matchmaking is part of the task, verify `playerID`, `matchID`, and credentials flow explicitly.

## Decision Heuristics

- Use phases for large rule changes across the whole table.
- Use stages for within-turn restrictions or simultaneous reactions.
- Use `setActivePlayers` when more than the current player must act.
- Use `turn.order` presets or a custom order object when seat order matters.
- Use `validateSetupData` when lobby-created matches depend on scenario or map input.
- Use `deltaState: true` only when multiplayer state size justifies it.

## When To Inspect Upstream Source

Inspect the sibling `boardgame.io` repo directly when:

- the exact hook / event combination matters
- a move behaves differently in multiplayer than in local mode
- hidden information or optimistic updates are involved
- the docs are ambiguous about TypeScript shapes or lifecycle timing

Useful upstream entry points:

- `/home/xigo/Documents/UFF/ES2/boardgame.io/docs/documentation/api/Game.md`
- `/home/xigo/Documents/UFF/ES2/boardgame.io/docs/documentation/api/Client.md`
- `/home/xigo/Documents/UFF/ES2/boardgame.io/docs/documentation/api/Server.md`
- `/home/xigo/Documents/UFF/ES2/boardgame.io/docs/documentation/{phases,stages,turn-order,events,secret-state,random,testing,typescript,multiplayer}.md`
- `/home/xigo/Documents/UFF/ES2/boardgame.io/examples/react-web/src/tic-tac-toe`
- `/home/xigo/Documents/UFF/ES2/boardgame.io/examples/react-web/server.js`

