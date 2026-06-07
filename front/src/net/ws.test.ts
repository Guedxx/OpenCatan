import { beforeEach, describe, expect, it, vi } from "vitest";

import { GameState } from "../state";
import type { StateEnvelope } from "../types";
import { connectWebSocket, disconnectWebSocket } from "./ws";

const apiGetStateMock = vi.hoisted(() => vi.fn());
const showToastMock = vi.hoisted(() => vi.fn());

vi.mock("./api", () => ({
  apiGetState: apiGetStateMock,
}));

vi.mock("../ui/toast", () => ({
  showToast: showToastMock,
}));

describe("game websocket contract", () => {
  beforeEach(() => {
    resetGameState();
    MockWebSocket.instances = [];
    apiGetStateMock.mockReset();
    showToastMock.mockReset();
    vi.useFakeTimers();
    vi.stubGlobal("WebSocket", MockWebSocket);
  });

  it("connects to the game endpoint and requests a private snapshot on open", () => {
    GameState.playerToken = "token-a";

    connectWebSocket("game-1");
    const socket = MockWebSocket.instances[0];
    socket.open();

    expect(socket.url).toBe("ws://localhost:8000/ws/games/game-1");
    expect(socket.sent).toEqual([
      JSON.stringify({
        type: "snapshot",
        payload: { player_token: "token-a" },
      }),
    ]);
  });

  it("updates state from snapshot messages", () => {
    connectWebSocket("game-1");
    const socket = MockWebSocket.instances[0];

    socket.message({ type: "snapshot", payload: envelope(5) });

    expect(GameState.version).toBe(5);
  });

  it("refetches private state after game_state_updated messages", async () => {
    GameState.gameId = "game-1";
    GameState.playerToken = "token-a";
    apiGetStateMock.mockResolvedValue(envelope(6));
    connectWebSocket("game-1");
    const socket = MockWebSocket.instances[0];

    socket.message({ type: "game_state_updated", payload: { version: 6 } });
    await Promise.resolve();

    expect(apiGetStateMock).toHaveBeenCalledWith("game-1", "token-a");
    expect(GameState.version).toBe(6);
  });

  it("shows websocket error messages from the backend", () => {
    connectWebSocket("game-1");
    const socket = MockWebSocket.instances[0];

    socket.message({ type: "error", payload: { message: "Invalid message" } });

    expect(showToastMock).toHaveBeenCalledWith("Invalid message", "error");
  });

  it("disconnects without scheduling reconnect", () => {
    connectWebSocket("game-1");
    const socket = MockWebSocket.instances[0];

    disconnectWebSocket();
    socket.closeFromServer();
    vi.runOnlyPendingTimers();

    expect(socket.closed).toBe(true);
    expect(MockWebSocket.instances).toHaveLength(1);
  });
});

class MockWebSocket {
  static instances: MockWebSocket[] = [];
  readonly sent: string[] = [];
  onopen: (() => void) | null = null;
  onmessage: ((event: { data: string }) => void) | null = null;
  onclose: (() => void) | null = null;
  closed = false;

  constructor(readonly url: string) {
    MockWebSocket.instances.push(this);
  }

  send(data: string): void {
    this.sent.push(data);
  }

  close(): void {
    this.closed = true;
  }

  open(): void {
    this.onopen?.();
  }

  message(data: unknown): void {
    this.onmessage?.({ data: JSON.stringify(data) });
  }

  closeFromServer(): void {
    this.onclose?.();
  }
}

function envelope(version: number): StateEnvelope {
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
    private_state: {
      player_id: 1,
      resources: {},
      dev_cards: [],
      legal_actions: ["roll_dice"],
    },
  };
}

function resetGameState(): void {
  disconnectWebSocket();
  GameState.gameId = null;
  GameState.playerToken = null;
  GameState.myPlayerId = null;
  GameState.version = 0;
  GameState.publicState = null;
  GameState.privateState = null;
}
