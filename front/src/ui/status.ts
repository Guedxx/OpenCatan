// Top-right status banner showing phase/turn/last-roll.

import { t } from "../i18n";
import { GameState } from "../state";
import { $ } from "./dom";

export function renderGameStatus(): void {
  const el = $("game-status");
  if (!GameState.publicState) {
    el.textContent = "";
    return;
  }
  const s = GameState.publicState;
  const phase = s.phase;
  const turnPhase = s.turn?.turn_phase ?? "";
  const roll = s.turn?.last_roll;
  const turnNum = s.turn?.number ?? 0;

  let text = t("Phase: ") + phase;
  if (phase === "MAIN") text = `${t("Turn")} ${turnNum} | ${turnPhase}`;
  if (phase === "SETUP_1") text = t("Setup Round 1");
  if (phase === "SETUP_2") text = t("Setup Round 2");
  if (phase === "FINISHED") text = t("Game Over");
  if (roll) text += ` | ${t("Last roll:")} ${roll}`;
  el.textContent = text;
}
