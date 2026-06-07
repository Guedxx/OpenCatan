// Left-side icon rail. Mostly non-implemented stubs that show toasts; keeping
// them wired here so the HTML can stay free of inline onclick.

import { doProposeTradeOffer } from "./commands";
import { openCostsDialog } from "./dialogs/costs";
import { openInfoDialog } from "./dialogs/info";
import { openRulesDialog } from "./dialogs/rules";
import { $ } from "./dom";
import { toggleRankingDrawer } from "./rankingDrawer";
import { openGameLobby } from "./menu/gameLobby";
import { showScreen } from "./menu/nav";
import { showToast } from "./toast";

export function bindSidebar(): void {
  $("sb-emotes").addEventListener("click", () =>
    showToast("Emotes not implemented yet"),
  );
  $("sb-trade").addEventListener("click", doProposeTradeOffer);
  $("sb-costs").addEventListener("click", openCostsDialog);
  $("sb-stats").addEventListener("click", toggleRankingDrawer);
  $("sb-info").addEventListener("click", openInfoDialog);
  $("sb-rules").addEventListener("click", openRulesDialog);
  $("sb-lobby").addEventListener("click", () => {
    openGameLobby();
  });
  $("sb-settings").addEventListener("click", () => showScreen("settings"));
}
