import { disconnectWebSocket } from "../net/ws";
import { GameState } from "../state";
import { showScreen } from "./menu/nav";
import { clearGameUrl } from "./returnToLobby";
import { clearActiveGame, clearRecentlyLeftGame } from "./menu/storage";

let handledGameId: string | null = null;

export function handleFinishedGame(): boolean {
  const state = GameState.publicState;
  if (!state || state.phase !== "FINISHED") {
    handledGameId = null;
    return false;
  }
  if (handledGameId === GameState.gameId) {
    return true;
  }
  handledGameId = GameState.gameId;
  disconnectWebSocket();
  clearGameUrl();
  clearActiveGame();
  clearRecentlyLeftGame();
  console.log(`[gameEnd] Game finished, cache cleared`);
  showScreen("game-over");
  return true;
}
