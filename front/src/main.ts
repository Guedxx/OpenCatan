// Bootstrap: wire runtime-registered callbacks, bind static DOM handlers,
// install Three.js input listeners, kick off animate(), and:
//   - auto-join if the URL carries `?game_id=...&player_token=...`
//   - otherwise try to rejoin the last active game (from localStorage)
//   - otherwise try to rejoin an active room (from localStorage)
//   - otherwise show the main menu.

import "./css/board.css";

import { bindGlobalButtonSounds, preloadSounds } from "./audio/sounds";
import { translatePage } from "./i18n";
import { scheduleRandomBotTurn } from "./ai/randomBot";
import { apiGetState } from "./net/api";
import { LobbyApiError, apiGetRoom } from "./net/lobbyApi";
import { connectWebSocket } from "./net/ws";
import { GameState, registerStateCallbacks, updateState } from "./state";
import {
  registerActionButtonsCallbacks,
  renderActionButtons,
} from "./ui/actions";
import { registerActionCallbacks } from "./ui/commands";
import { bindCostsDialog } from "./ui/dialogs/costs";
import { bindDiscardDialog } from "./ui/dialogs/discard";
import { bindInfoDialog } from "./ui/dialogs/info";
import { bindRulesDialog } from "./ui/dialogs/rules";
import { bindVictimDialog } from "./ui/dialogs/victim";
import { bindFpsCounter } from "./ui/fpsCounter";
import { bindGameOverDialog } from "./ui/gameOver";
import { bindCreateRoom, resumeAsHost } from "./ui/menu/createRoom";
import { bindJoinRoom, resumeAsGuest } from "./ui/menu/joinRoom";
import { bindMainMenu } from "./ui/menu/mainMenu";
import { bindMockGameButton } from "./ui/menu/mockGame";
import { bindMultiplayer } from "./ui/menu/multiplayer";
import { bindGameLobby } from "./ui/menu/gameLobby";
import { bootstrapSettings, bindSettings } from "./ui/menu/settings";
import { bindSinglePlayer } from "./ui/menu/singleplayer";
import { closeMenu, showScreen } from "./ui/menu/nav";
import {
  clearActiveGame,
  clearActiveRoom,
  loadActiveGame,
  loadActiveRoom,
} from "./ui/menu/storage";
import {
  checkPendingModals,
  registerPendingCallbacks,
} from "./ui/pendingModals";
import { bindRankingDrawer } from "./ui/rankingDrawer";
import { bindSidebar } from "./ui/sidebar";
import { showToast } from "./ui/toast";
import { updateUI } from "./ui/updateUI";
import { animate, installResizeHandler } from "./three/animate";
import { rebuildScene } from "./three/board/rebuild";
import { installInputListeners } from "./three/input/raycaster";
import type { PlayerColor } from "./types";

// ---- Wire cross-layer callbacks so state.ts / ui/* don't statically import
//      the 3D layer (and vice versa).
registerStateCallbacks({
  rebuildScene,
  updateUI,
  checkPendingModals: () => {
    checkPendingModals();
    scheduleRandomBotTurn();
  },
});
registerActionCallbacks({
  rebuildScene,
  renderActionButtons,
});
registerActionButtonsCallbacks({ rebuildScene });
registerPendingCallbacks({
  rebuildScene,
  renderActionButtons,
});

// ---- Static DOM bindings (sidebar, dialog buttons, canvas listeners).
bindSidebar();
bindRankingDrawer();
bindMainMenu();
bindMockGameButton();
bindSinglePlayer();
bindMultiplayer();
bindGameLobby();
bindCreateRoom();
bindJoinRoom();
bindSettings();
bindCostsDialog();
bindDiscardDialog();
bindInfoDialog();
bindRulesDialog();
bindVictimDialog();
bindFpsCounter();
bindGameOverDialog();
bindGlobalButtonSounds();
preloadSounds();
installInputListeners();
installResizeHandler();

// Apply saved settings (shadow quality, FPS visibility, etc) before the
// first frame renders.
bootstrapSettings();
translatePage();

// ---- Boot sequence ----
async function init(): Promise<void> {
  const params = new URLSearchParams(window.location.search);
  const gameId = params.get("game_id");
  const playerToken = params.get("player_token");

  // 1. URL auto-join into an already-running game.
  if (gameId && playerToken) {
    GameState.gameId = gameId;
    GameState.playerToken = playerToken;
    closeMenu();
    const state = await apiGetState(gameId, playerToken);
    if (state) {
      updateState(state);
      connectWebSocket(gameId);
      // Clear any leftover room record; we're already in a game.
      clearActiveRoom();
    } else {
      showScreen("main");
      showToast("Could not load game, create a new one", "error");
      clearActiveGame();
    }
    return;
  }

  // 2. Rejoin the last active game via localStorage.
  const activeGame = loadActiveGame();
  if (activeGame) {
    console.log(`[bootstrap] Found cached game: ${activeGame.game_id}`);
    try {
      GameState.gameId = activeGame.game_id;
      GameState.playerToken = activeGame.player_token;
      closeMenu();
      const state = await apiGetState(activeGame.game_id, activeGame.player_token);
      if (state) {
        console.log(`[bootstrap] Successfully restored game ${activeGame.game_id}`);
        updateState(state);
        connectWebSocket(activeGame.game_id);
        // The match cache is authoritative for the current game; the
        // lobby cache should not keep pointing at a stale room.
        clearActiveRoom();
      } else {
        console.warn(`[bootstrap] Game state is null for ${activeGame.game_id}`);
        showScreen("main");
        showToast("Could not restore your match (game not found), create a new one", "error");
        clearActiveGame();
      }
      return;
    } catch (err) {
      console.error(`[bootstrap] Failed to restore cached game:`, err);
      showToast(`Could not restore your match: ${err instanceof Error ? err.message : 'Unknown error'}`, "error");
      clearActiveGame();
    }
  }

  // 3. Rejoin an active lobby via localStorage (survives F5 / HMR).
  const active = loadActiveRoom();
  if (active) {
    try {
      const room = await apiGetRoom(active.room_id);
      // Backend never exposes player tokens on /rooms/{id}, so we match
      // our slot using the identity hints captured at save time. Colors
      // are unique per room (backend enforced) — that's the authoritative
      // match. Name is a tiebreaker if the stored color is stale for any
      // reason (e.g. partially-applied color change). Only after both
      // fail do we fall back to the ambiguous is_host flag, which is
      // only uniquely identifying for the host slot.
      const byColor = active.color
        ? room.players.find((p) => p.color === active.color)
        : undefined;
      const byName = active.name
        ? room.players.find((p) => p.name === active.name)
        : undefined;
      const byHost = active.is_host
        ? room.players.find((p) => p.is_host)
        : undefined;
      const me = byColor ?? byName ?? byHost;
      // On a total miss we still transition into the lobby so the user
      // isn't stranded — guest controls will re-sync from the next
      // room_updated frame, and illegal actions are server-rejected.
      const fallback: { name: string; color: PlayerColor } =
        me !== undefined
          ? { name: me.name, color: me.color as PlayerColor }
          : {
              name: active.name ?? "Player",
              color: (active.color as PlayerColor) ?? "red",
            };
      if (active.is_host) {
        resumeAsHost({
          roomId: room.room_id,
          playerToken: active.player_token,
          room,
          me: fallback,
        });
      } else {
        resumeAsGuest({
          roomId: room.room_id,
          playerToken: active.player_token,
          room,
          me: fallback,
        });
      }
      return;
    } catch (err) {
      // Room is gone, or backend down. Clear and fall through to main menu.
      if (err instanceof LobbyApiError && err.status === 404) {
        showToast("Your previous room has ended", "info");
      }
      clearActiveRoom();
    }
  }

  // 4. Default: show the main menu.
  showScreen("main");
}

animate();
void init();
