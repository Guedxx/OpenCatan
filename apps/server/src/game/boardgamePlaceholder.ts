import { createInitialGameState, type GameState } from '@catan/core';
import type { Game } from 'boardgame.io';

export const boardgamePlaceholder: Game<GameState> = {
  name: 'catan-placeholder',
  setup: () => createInitialGameState()
};

// TODO: Replace this placeholder with the real boardgame.io game definition once
// the server-side Catan rules and match flow are ready to be introduced.
