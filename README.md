# Catan

Minimal monorepo base for a backend-authoritative Catan project using Node.js, TypeScript, pnpm workspaces, Vite, React, Express, Socket.IO, and a placeholder `boardgame.io` integration.

## Architecture Overview

This scaffold is intentionally backend-first:

- `apps/server` owns the authoritative runtime and realtime transport.
- `apps/web` is mostly a renderer and input layer.
- `packages/core` holds future game/domain logic.
- `packages/protocol` holds shared transport contracts and DTOs.

`boardgame.io` is included on the server as a dependency and typed placeholder only. It does not dictate the scaffold yet.

## Folder Structure

```text
.
├── apps
│   ├── server
│   └── web
├── packages
│   ├── core
│   └── protocol
├── deps.toml
├── package.json
├── pnpm-workspace.yaml
└── tsconfig.base.json
```

## Stack Summary

- pnpm workspaces
- TypeScript everywhere
- Vite + React for the web app
- Express + Socket.IO for the backend
- Shared core/protocol packages
- `boardgame.io` kept minimal for now

## Install

```bash
pnpm install
```

## Development

Run the full stack:

```bash
pnpm dev
```

Run only the backend flow:

```bash
pnpm dev:server
```

Run only the frontend flow:

```bash
pnpm dev:web
```

Default dev URLs:

- Web: `http://localhost:5173`
- Server: `http://localhost:3001`

## Build

```bash
pnpm build
```

## Renderer-First, Backend-Authoritative

The frontend is intentionally thin so rules, state transitions, and realtime coordination can live on the backend and in shared packages. This keeps the transport contract explicit, avoids duplicating authoritative game logic in the browser, and leaves room to adopt fuller game orchestration later without rewriting the scaffold.
