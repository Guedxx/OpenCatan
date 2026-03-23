import { createInitialGameState } from '@catan/core';
import {
  SERVER_HELLO_EVENT,
  type ServerHelloEvent
} from '@catan/protocol';
import type { Server as SocketIOServer } from 'socket.io';

interface RegisterSocketHandlersOptions {
  io: SocketIOServer;
  gameName: string;
}

export function registerSocketHandlers({
  io,
  gameName
}: RegisterSocketHandlersOptions): void {
  io.on('connection', (socket) => {
    const state = createInitialGameState();

    console.log(`[socket] client connected: ${socket.id}`);

    const payload: ServerHelloEvent = {
      type: SERVER_HELLO_EVENT,
      message: 'Catan server is running.',
      gameName,
      snapshot: {
        matchId: 'local-dev',
        players: [],
        status: 'booting',
        turn: state.turn
      }
    };

    socket.emit(SERVER_HELLO_EVENT, payload);
  });
}
