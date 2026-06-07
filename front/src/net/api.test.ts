import { beforeEach, describe, expect, it, vi } from "vitest";

import { GameState } from "../state";
import type { StateEnvelope } from "../types";
import {
  apiCommand,
  apiCreateGame,
  apiGetState,
  apiReturnToLobby,
} from "./api";

const showToastMock = vi.hoisted(() => vi.fn());

vi.mock("../ui/toast", () => ({
  showToast: showToastMock,
}));

describe("game API contract", () => {
  const fetchMock = vi.fn<typeof fetch>();

  beforeEach(() => {
    resetGameState();
    fetchMock.mockReset();
    showToastMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  it("creates a game with the players payload expected by the backend", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(createGameResponse()));

    const result = await apiCreateGame([
      { name: "Alice", color: "red" },
      { name: "Bob", color: "blue" },
    ]);

    expect(fetchMock).toHaveBeenCalledWith("http://localhost:8000/games", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        players: [
          { name: "Alice", color: "red" },
          { name: "Bob", color: "blue" },
        ],
      }),
    });
    expect(result?.game_id).toBe("game-1");
  });

  it("gets public state without token and private state with token", async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse(envelope(null)))
      .mockResolvedValueOnce(jsonResponse(envelope(1)));

    await apiGetState("game-1", null);
    await apiGetState("game-1", "token-a");

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      "http://localhost:8000/games/game-1/state",
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "http://localhost:8000/games/game-1/state?player_token=token-a",
    );
  });

  it("sends commands with player token, expected version and request id", async () => {
    GameState.gameId = "game-1";
    GameState.playerToken = "token-a";
    GameState.version = 7;
    fetchMock.mockResolvedValueOnce(
      jsonResponse({
        accepted: true,
        version: 8,
        reason: null,
        idempotent_replay: false,
        events: [],
        state: envelope(1),
      }),
    );

    await apiCommand("build_road", { edge_id: 12 });

    const [, init] = fetchMock.mock.calls[0];
    const body = JSON.parse(String(init?.body)) as Record<string, unknown>;
    expect(fetchMock.mock.calls[0][0]).toBe(
      "http://localhost:8000/games/game-1/commands",
    );
    expect(init?.method).toBe("POST");
    expect(body.player_token).toBe("token-a");
    expect(body.command).toBe("build_road");
    expect(body.payload).toEqual({ edge_id: 12 });
    expect(body.expected_version).toBe(7);
    expect(String(body.request_id)).toContain("build_road");
  });

  it("refreshes state when the backend rejects a command by version mismatch", async () => {
    GameState.gameId = "game-1";
    GameState.playerToken = "token-a";
    GameState.version = 3;
    fetchMock
      .mockResolvedValueOnce(
        jsonResponse({
          accepted: false,
          version: 4,
          reason: "Version mismatch. Expected 3, current 4",
          idempotent_replay: false,
          events: [],
          state: null,
        }),
      )
      .mockResolvedValueOnce(jsonResponse(envelope(1, 4)));

    const result = await apiCommand("roll_dice");

    expect(result?.accepted).toBe(false);
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "http://localhost:8000/games/game-1/state?player_token=token-a",
    );
    expect(GameState.version).toBe(4);
    expect(showToastMock).toHaveBeenCalledWith(
      "State refreshed, try again",
      "warning",
    );
  });

  it("handles invalid token, missing game and network errors with user-facing messages", async () => {
    GameState.gameId = "game-1";
    GameState.playerToken = "bad-token";

    fetchMock.mockResolvedValueOnce(jsonResponse({}, { ok: false, status: 401 }));
    await apiCommand("roll_dice");
    expect(showToastMock).toHaveBeenCalledWith("Invalid player token", "error");

    fetchMock.mockResolvedValueOnce(jsonResponse({}, { ok: false, status: 404 }));
    await apiCommand("roll_dice");
    expect(showToastMock).toHaveBeenCalledWith("Game not found", "error");

    fetchMock.mockRejectedValueOnce(new Error("connection refused"));
    await apiCommand("roll_dice");
    expect(showToastMock).toHaveBeenCalledWith(
      "Network error: connection refused",
      "error",
    );
  });

  it("returns to lobby with the game token payload", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({
        room: roomState(),
        player_token: "lobby-token",
      }),
    );

    const result = await apiReturnToLobby("game-1", "game-token");

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8000/games/game-1/return-to-lobby",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ player_token: "game-token" }),
      },
    );
    expect(result?.player_token).toBe("lobby-token");
  });
});

function jsonResponse(
  body: unknown,
  options: { ok?: boolean; status?: number; statusText?: string } = {},
): Response {
  return {
    ok: options.ok ?? true,
    status: options.status ?? 200,
    statusText: options.statusText ?? "OK",
    json: async () => body,
  } as Response;
}

function createGameResponse() {
  return {
    game_id: "game-1",
    version: 1,
    players: [
      { player_id: 1, name: "Alice", color: "red", token: "token-a" },
      { player_id: 2, name: "Bob", color: "blue", token: "token-b" },
    ],
    state: envelope(null),
  };
}

function envelope(playerId: number | null, version = 1): StateEnvelope {
  return {
    game_id: "game-1",
    version,
    public_state: {
      phase: "MAIN",
      turn: {
        number: 1,
        current_player_id: 1,
        turn_phase: "ROLL",
        last_roll: null,
      },
      board: { robber_tile_id: null, tiles: [], vertices: [], edges: [], ports: [] },
      players: [],
    },
    private_state:
      playerId === null
        ? null
        : {
            player_id: playerId,
            resources: {},
            dev_cards: [],
            legal_actions: ["roll_dice"],
          },
  };
}

function roomState() {
  return {
    room_id: "ABC123",
    players: [{ name: "Alice", color: "red", ready: true, is_host: true }],
    game_id: null,
    created_at: 1,
  };
}

function resetGameState(): void {
  GameState.gameId = null;
  GameState.playerToken = null;
  GameState.myPlayerId = null;
  GameState.version = 0;
  GameState.publicState = null;
  GameState.privateState = null;
  GameState.playerMap = {};
  GameState.requestSeq = 0;
}
