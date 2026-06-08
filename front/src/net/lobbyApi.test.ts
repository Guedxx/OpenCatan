import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  LobbyApiError,
  apiChangeColor,
  apiCreateRoom,
  apiGetRoom,
  apiJoinRoom,
  apiLeaveRoom,
  apiSetReady,
  apiStartRoomGame,
} from "./lobbyApi";

describe("lobby API contract", () => {
  const fetchMock = vi.fn<typeof fetch>();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  it("creates and joins rooms with the expected request bodies", async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse(membership()))
      .mockResolvedValueOnce(jsonResponse(membership()));

    await apiCreateRoom("Alice", "red");
    await apiJoinRoom("AB C/123", "Bob", "blue");

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      "http://localhost:8000/rooms",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Alice", color: "red" }),
      },
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "http://localhost:8000/rooms/AB%20C%2F123/join",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Bob", color: "blue" }),
      },
    );
  });

  it("gets room state from the response envelope", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ room: roomState() }));

    const room = await apiGetRoom("ABC123");

    expect(fetchMock).toHaveBeenCalledWith("http://localhost:8000/rooms/ABC123");
    expect(room.room_id).toBe("ABC123");
  });

  it("changes color, readiness, leave and start using player_token payloads", async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ room: roomState() }))
      .mockResolvedValueOnce(jsonResponse({ room: roomState() }))
      .mockResolvedValueOnce(jsonResponse({}))
      .mockResolvedValueOnce(
        jsonResponse({ game_id: "game-1", game_token: "game-token" }),
      );

    await apiChangeColor("ABC123", "token-a", "orange");
    await apiSetReady("ABC123", "token-a", true);
    await apiLeaveRoom("ABC123", "token-a");
    const started = await apiStartRoomGame("ABC123", "token-a");

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      "http://localhost:8000/rooms/ABC123/color",
      expect.objectContaining({
        body: JSON.stringify({ player_token: "token-a", color: "orange" }),
      }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "http://localhost:8000/rooms/ABC123/ready",
      expect.objectContaining({
        body: JSON.stringify({ player_token: "token-a", ready: true }),
      }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      3,
      "http://localhost:8000/rooms/ABC123/leave",
      expect.objectContaining({
        body: JSON.stringify({ player_token: "token-a" }),
      }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      4,
      "http://localhost:8000/rooms/ABC123/start",
      expect.objectContaining({
        body: JSON.stringify({ player_token: "token-a" }),
      }),
    );
    expect(started).toEqual({ game_id: "game-1", game_token: "game-token" });
  });

  it("throws LobbyApiError with backend detail on rule rejection", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse(
        { detail: "Color already taken" },
        { ok: false, status: 400, statusText: "Bad Request" },
      ),
    );

    await expect(apiCreateRoom("Alice", "red")).rejects.toMatchObject({
      status: 400,
      message: "Color already taken",
    } satisfies Partial<LobbyApiError>);
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

function membership() {
  return {
    room: roomState(),
    player_token: "token-a",
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
