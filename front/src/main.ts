// Bootstrap: wire runtime-registered callbacks, bind static DOM handlers,
// install Three.js input listeners, kick off animate(), and:
//   - auto-join if the URL carries `?game_id=...&player_token=...`
//   - otherwise try to rejoin an active room (from localStorage)
//   - otherwise show the main menu.

import "./css/board.css";

import { apiGetState } from "./net/api";
import { LobbyApiError, apiGetRoom } from "./net/lobbyApi";
import { connectWebSocket } from "./net/ws";
import { GameState, registerStateCallbacks, updateState } from "./state";
import {
  registerActionButtonsCallbacks,
  renderActionButtons,
} from "./ui/actions";
import { registerActionCallbacks } from "./ui/commands";
import { bindDiscardDialog } from "./ui/dialogs/discard";
import { bindVictimDialog } from "./ui/dialogs/victim";
import { bindFpsCounter } from "./ui/fpsCounter";
import { bindCreateRoom, resumeAsHost } from "./ui/menu/createRoom";
import { bindJoinRoom, resumeAsGuest } from "./ui/menu/joinRoom";
import { bindMainMenu } from "./ui/menu/mainMenu";
import { bindMultiplayer } from "./ui/menu/multiplayer";
import { bootstrapSettings, bindSettings } from "./ui/menu/settings";
import { bindSinglePlayer } from "./ui/menu/singleplayer";
import { closeMenu, showScreen } from "./ui/menu/nav";
import { clearActiveRoom, loadActiveRoom } from "./ui/menu/storage";
import {
  checkPendingModals,
  registerPendingCallbacks,
} from "./ui/pendingModals";
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
  checkPendingModals,
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
bindMainMenu();
bindSinglePlayer();
bindMultiplayer();
bindCreateRoom();
bindJoinRoom();
bindSettings();
bindDiscardDialog();
bindVictimDialog();
bindFpsCounter();
installInputListeners();
installResizeHandler();

// Apply saved settings (shadow quality, FPS visibility, etc) before the
// first frame renders.
bootstrapSettings();

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
    }
    return;
  }

  // 2. Rejoin an active lobby via localStorage (survives F5 / HMR).
  const active = loadActiveRoom();
  if (active) {
    try {
      const room = await apiGetRoom(active.room_id);
      const me = room.players.find(
        (p) => p.is_host === active.is_host && !!p, // naive; backend doesn't expose tokens on peek
      );
      // We can't verify the exact slot without exposing tokens; trust the
      // stored is_host flag. Identify ourselves heuristically by host flag
      // + find best match for display (color/name). On mismatch, the WS
      // will still receive our updates and the Ready/Color controls will
      // fall back to server rejection.
      const fallback: { name: string; color: PlayerColor } =
        me !== undefined
          ? { name: me.name, color: me.color as PlayerColor }
          : { name: "Player", color: "red" };
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

  // 3. Default: show the main menu.
  showScreen("main");
}

animate();
void init();
