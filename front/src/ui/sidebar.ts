// Left-side icon rail. Mostly non-implemented stubs that show toasts; keeping
// them wired here so the HTML can stay free of inline onclick.

import { doProposeTradeOffer } from "./commands";
import { openInfoDialog } from "./dialogs/info";
import { $ } from "./dom";
import { bindEmotes, toggleEmotePanel } from "./emotes";
import { toggleFps } from "./fpsCounter";
import { toggleRankingDrawer } from "./rankingDrawer";
import { openGameLobby } from "./menu/gameLobby";
import { showToast } from "./toast";

export function bindSidebar(): void {
  $("sb-chat").addEventListener("click", () =>
    showToast("Chat not implemented yet"),
  );
  bindEmotes();
  $("sb-emotes").addEventListener("click", () => toggleEmotePanel());
  $("sb-trade").addEventListener("click", doProposeTradeOffer);
  $("sb-stats").addEventListener("click", toggleRankingDrawer);
  $("sb-info").addEventListener("click", openInfoDialog);
  $("sb-rules").addEventListener("click", () =>
    showToast("Rules not implemented yet"),
  );
  $("sb-lobby").addEventListener("click", () => {
    openGameLobby();
  });
  $("sb-settings").addEventListener("click", () =>
    showToast("Settings not implemented yet"),
  );
  $("sb-fps").addEventListener("click", toggleFps);
}
