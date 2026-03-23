export interface BoardHex {
  id: string;
  terrain: string;
  token: number | null;
}

export interface BoardState {
  hexes: BoardHex[];
}

export interface GameState {
  turn: number;
  phase: 'setup';
  board: BoardState;
}

export function createInitialBoard(): BoardState {
  return {
    hexes: [
      { id: 'hex-1', terrain: 'forest', token: 8 },
      { id: 'hex-2', terrain: 'hill', token: 5 },
      { id: 'hex-3', terrain: 'pasture', token: 10 },
      { id: 'hex-4', terrain: 'mountain', token: 6 },
      { id: 'hex-5', terrain: 'field', token: 9 },
      { id: 'hex-6', terrain: 'desert', token: null }
    ]
  };
}

export function createInitialGameState(): GameState {
  return {
    turn: 1,
    phase: 'setup',
    board: createInitialBoard()
  };
}

// TODO: Replace mock board generation with real Catan board setup rules.
// TODO: Expand GameState once turn flow, players, and resources are modeled.
