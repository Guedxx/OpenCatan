import cors from 'cors';
import express from 'express';
import { createServer } from 'node:http';
import { Server as SocketIOServer } from 'socket.io';

import { createHealthRouter } from './http/createHealthRouter.js';
import { boardgamePlaceholder } from './game/boardgamePlaceholder.js';
import { registerSocketHandlers } from './realtime/registerSocketHandlers.js';

const PORT = 3001;
const CLIENT_ORIGIN = 'http://localhost:5173';

const app = express();

app.use(
  cors({
    origin: CLIENT_ORIGIN
  })
);
app.use(express.json());
app.use(createHealthRouter());

const httpServer = createServer(app);
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: CLIENT_ORIGIN
  }
});

registerSocketHandlers({
  io,
  gameName: boardgamePlaceholder.name
});

httpServer.listen(PORT, () => {
  console.log(`[server] listening on http://localhost:${PORT}`);
  console.log(`[server] health endpoint ready at http://localhost:${PORT}/health`);
  console.log(`[server] boardgame.io placeholder loaded: ${boardgamePlaceholder.name}`);
});
