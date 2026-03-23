export type PlayerId = string;

export interface GameSnapshot {
  matchId: string;
  players: PlayerId[];
  status: 'booting' | 'waiting';
  turn: number;
}

export type ClientAction = {
  type: 'client:ping';
};

export const SERVER_HELLO_EVENT = 'server:hello';

export interface ServerHelloEvent {
  type: typeof SERVER_HELLO_EVENT;
  message: string;
  gameName: string;
  snapshot: GameSnapshot;
}

export type ServerEvent = ServerHelloEvent;
