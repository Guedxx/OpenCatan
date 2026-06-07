// Top-level UI aggregator called by state.updateState after each snapshot.

import { translatePage } from "../i18n";
import { renderActionButtons } from "./actions";
import { renderDiceDisplay } from "./dice";
import { syncCostsDialog } from "./dialogs/costs";
import { syncInfoDialog } from "./dialogs/info";
import { handleFinishedGame } from "./gameEnd";
import { renderGameOverDialog } from "./gameOver";
import { renderGameLobby } from "./menu/gameLobby";
import { renderPlayerCards } from "./players";
import { renderRankingDrawer } from "./rankingDrawer";
import { renderResourceBar } from "./resources";
import { renderGameStatus } from "./status";

export function updateUI(): void {
  handleFinishedGame();
  renderPlayerCards();
  renderResourceBar();
  renderActionButtons();
  renderGameStatus();
  renderDiceDisplay();
  renderRankingDrawer();
  syncCostsDialog();
  syncInfoDialog();
  renderGameOverDialog();
  renderGameLobby();
  translatePage();
}
