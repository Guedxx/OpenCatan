// WebSocket client for a single room. Auto-reconnects with backoff and
// dispatches typed events to whichever lobby screen is active.

import { WS_BASE } from "../config";
import type { RoomState } from "./lobbyApi";

export type RoomWsEvent =
  | { type: "room_snapshot"; payload: RoomState }
  | { type: "room_updated"; payload: RoomState }
  | {
      type: "game_started";
      payload: { game_id: string; tokens: Record<string, string> };
    }
  | { type: "error"; payload: { message?: string } }
  | { type: "pong"; payload: unknown };

export type RoomWsHandler = (event: RoomWsEvent) => void;

export interface RoomWsConnection {
  close(): void;
}

const RECONNECT_DELAY_MS = 3000;

export function connectRoomWs(
  roomId: string,
  handler: RoomWsHandler,
): RoomWsConnection {
  let closedByUser = false;
  let ws: WebSocket | null = null;

  function open(): void {
    ws = new WebSocket(`${WS_BASE}/ws/rooms/${encodeURIComponent(roomId)}`);
    ws.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data) as RoomWsEvent;
        handler(parsed);
      } catch {
        /* ignore malformed */
      }
    };
    ws.onclose = () => {
      ws = null;
      if (!closedByUser) {
        setTimeout(open, RECONNECT_DELAY_MS);
      }
    };
    ws.onerror = () => {
      // Let onclose retry.
    };
  }

  open();

  return {
    close(): void {
      closedByUser = true;
      if (ws) {
        ws.onclose = null;
        ws.close();
        ws = null;
      }
    },
  };
}
