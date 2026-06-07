import { startRandomBots } from "../../ai/randomBot";
import { apiCreateGame } from "../../net/api";
import { showToast } from "../toast";
import { $ } from "../dom";
import { enterGame } from "./lobbyCommon";

const MOCK_PLAYERS = [
  { name: "Bot Red", color: "red" },
  { name: "Bot Blue", color: "blue" },
  { name: "Bot White", color: "white" },
  { name: "Bot Orange", color: "orange" },
] as const;

export function bindMockGameButton(): void {
  const button = $<HTMLButtonElement>("btn-menu-mock-game");
  button.addEventListener("click", () => {
    void loadMockGame(button);
  });
}

async function loadMockGame(button: HTMLButtonElement): Promise<void> {
  const originalText = button.textContent ?? "Mock Game";
  button.disabled = true;
  button.textContent = "Loading...";

  try {
    const game = await apiCreateGame([...MOCK_PLAYERS]);
    const spectatorToken = game?.players[0]?.token;
    if (!game || !spectatorToken) {
      showToast("Could not create mock game", "error");
      return;
    }
    startRandomBots(game.game_id, game.players);
    await enterGame(game.game_id, spectatorToken);
    showToast("Mock game started: 4 AI players", "success");
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    showToast(`Could not load mock game: ${message}`, "error");
  } finally {
    button.disabled = false;
    button.textContent = originalText;
  }
}
