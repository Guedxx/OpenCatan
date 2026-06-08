// Main menu: Open Catan title + three big nav buttons.

import { GameState } from "../../state";
import { $ } from "../dom";
import { closeMenu, currentScreen, registerMainMenuRenderer, showScreen } from "./nav";
import { loadRecentlyLeftGame, clearRecentlyLeftGame, saveActiveGame, clearActiveRoom } from "./storage";
import { showToast } from "../toast";
import { apiGetState, apiCommand } from "../../net/api";
import { connectWebSocket } from "../../net/ws";
import { updateState } from "../../state";

export function renderMainMenu(): void {
  if (currentScreen() !== "main") return;
  
  const recentlyLeft = loadRecentlyLeftGame();
  const rejoinBtn = $<HTMLButtonElement>("btn-menu-rejoin-match");
  
  if (recentlyLeft) {
    rejoinBtn.classList.remove("hidden");
  } else {
    rejoinBtn.classList.add("hidden");
  }
}

async function rejoinRecentlyLeftMatch(): Promise<void> {
  const recentlyLeft = loadRecentlyLeftGame();
  if (!recentlyLeft) {
    showToast("No recent match to rejoin", "error");
    return;
  }

  try {
    GameState.gameId = recentlyLeft.game_id;
    GameState.playerToken = recentlyLeft.player_token;
    
    // Save active game for persistence
    saveActiveGame({
      game_id: recentlyLeft.game_id,
      player_token: recentlyLeft.player_token,
    });

    // Update URL to reflect game ID
    const url = new URL(window.location.href);
    url.searchParams.set("game_id", recentlyLeft.game_id);
    url.searchParams.set("player_token", recentlyLeft.player_token);
    history.replaceState(null, "", url);

    // First, execute rejoin_game command to mark player as active in server
    const rejoinRes = await apiCommand("rejoin_game");
    if (!rejoinRes || !rejoinRes.accepted) {
      showToast("Could not rejoin match on server", "error");
      clearRecentlyLeftGame();
      return;
    }

    // Then load the updated game state
    const state = await apiGetState(recentlyLeft.game_id, recentlyLeft.player_token);
    if (state) {
      updateState(state);
      connectWebSocket(recentlyLeft.game_id);
      clearActiveRoom();
      clearRecentlyLeftGame();
      closeMenu();
      showToast("Rejoined match!", "success");
    } else {
      showToast("Match no longer available", "error");
      clearRecentlyLeftGame();
    }
  } catch (err) {
    showToast(
      err instanceof Error ? err.message : "Could not rejoin match",
      "error",
    );
    clearRecentlyLeftGame();
  }
}

export function bindMainMenu(): void {
  $("btn-menu-singleplayer").addEventListener("click", () => {
    showScreen("sp-setup");
  });
  $("btn-menu-multiplayer").addEventListener("click", () => {
    showScreen("mp-menu");
  });
  $("btn-menu-settings").addEventListener("click", () => {
    showScreen("settings");
  });
  $("btn-menu-rejoin-match").addEventListener("click", () => {
    void rejoinRecentlyLeftMatch();
  });
  
  // Register renderer for when main menu is shown
  registerMainMenuRenderer(renderMainMenu);
}
