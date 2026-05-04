import { GameState } from "../state";
import { setDiceSceneVisible, showDiceResult } from "../three/diceRoller";
import { $ } from "./dom";

const PIPS: Record<number, number[]> = {
  1: [4],
  2: [0, 8],
  3: [0, 4, 8],
  4: [0, 2, 6, 8],
  5: [0, 2, 4, 6, 8],
  6: [0, 2, 3, 5, 6, 8],
};

let lastAnimatedRollKey = "";

function die(value: number | null): string {
  const pips = value == null ? [] : PIPS[value] ?? [];
  let cells = "";
  for (let i = 0; i < 9; i += 1) {
    cells +=
      '<span class="' +
      (pips.includes(i) ? "bg-[#3e2723]" : "bg-transparent") +
      ' w-1.5 h-1.5 rounded-full"></span>';
  }
  const label = value == null ? "?" : String(value);
  return (
    '<div class="w-10 h-10 rounded-md bg-yellow-50 border-2 border-[#5d4037] shadow grid grid-cols-3 grid-rows-3 place-items-center p-1" title="Die ' +
    label +
    '">' +
    cells +
    "</div>"
  );
}

export function renderDiceDisplay(): void {
  const el = $("dice-display");
  const turn = GameState.publicState?.turn;
  const dice = turn?.last_roll_dice;
  const total = turn?.last_roll ?? null;
  const hasDice =
    Array.isArray(dice) &&
    dice.length === 2 &&
    typeof dice[0] === "number" &&
    typeof dice[1] === "number";

  if (!GameState.publicState || GameState.publicState.phase !== "MAIN") {
    el.classList.add("hidden");
    el.innerHTML = "";
    setDiceSceneVisible(false);
    return;
  }

  el.classList.remove("hidden");
  const first = hasDice ? dice[0] : null;
  const second = hasDice ? dice[1] : null;
  setDiceSceneVisible(total != null);
  if (hasDice) {
    const rollKey = `${turn?.number ?? 0}:${dice[0]}-${dice[1]}:${total ?? ""}`;
    if (rollKey !== lastAnimatedRollKey) {
      lastAnimatedRollKey = rollKey;
      showDiceResult([dice[0], dice[1]]);
    }
  } else {
    lastAnimatedRollKey = "";
  }
  el.innerHTML =
    '<div class="flex items-center gap-2">' +
    die(first) +
    die(second) +
    '<div class="min-w-12 text-center">' +
    '<div class="text-[10px] uppercase font-bold text-yellow-400 leading-none">Roll</div>' +
    '<div class="font-game text-xl text-white leading-tight">' +
    (total == null ? "--" : String(total)) +
    "</div></div></div>";
}
