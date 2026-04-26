"""WebSocket hub for room events — separate from the game hub to keep the
two concerns cleanly decoupled."""

from __future__ import annotations

from collections import defaultdict
from typing import Any

from fastapi import WebSocket


class RoomConnectionHub:
    def __init__(self) -> None:
        self._connections: dict[str, set[WebSocket]] = defaultdict(set)

    async def connect(self, room_id: str, websocket: WebSocket) -> None:
        await websocket.accept()
        self._connections[room_id].add(websocket)

    def disconnect(self, room_id: str, websocket: WebSocket) -> None:
        if room_id in self._connections:
            self._connections[room_id].discard(websocket)
            if not self._connections[room_id]:
                del self._connections[room_id]

    def count(self, room_id: str) -> int:
        return len(self._connections.get(room_id, set()))

    async def broadcast(self, room_id: str, message: dict[str, Any]) -> None:
        sockets = list(self._connections.get(room_id, set()))
        for socket in sockets:
            try:
                await socket.send_json(message)
            except Exception:
                self.disconnect(room_id, socket)

    async def send_to(self, websocket: WebSocket, message: dict[str, Any]) -> None:
        try:
            await websocket.send_json(message)
        except Exception:
            # Caller will normally already follow up with disconnect().
            return
