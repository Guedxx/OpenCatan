// Left-side icon rail. Mostly non-implemented stubs that show toasts; keeping
// them wired here so the HTML can stay free of inline onclick.

import { doProposeTradeOffer } from "./commands";
import { openCostsDialog } from "./dialogs/costs";
import { openInfoDialog } from "./dialogs/info";
import { openRulesDialog } from "./dialogs/rules";
import { $, $opt } from "./dom";
import { bindEmotes, toggleEmotePanel } from "./emotes";
import { toggleRankingDrawer } from "./rankingDrawer";
import { openGameLobby } from "./menu/gameLobby";
import { showScreen } from "./menu/nav";
import { showToast } from "./toast";

export function bindSidebar(): void {
  $opt("sb-chat")?.addEventListener("click", () =>
    showToast("Chat not implemented yet"),
  );
  bindEmotes();
  $("sb-emotes").addEventListener("click", () => toggleEmotePanel());
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
