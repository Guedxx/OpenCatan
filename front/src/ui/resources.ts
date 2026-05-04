// Bottom-center resource bar showing the private hand + my VP.

import { RESOURCE_COLORS, RESOURCE_LABELS, RESOURCE_ORDER } from "../config";
import { GameState, hasLegalAction } from "../state";
import { $ } from "./dom";
import {
  startKnightCard,
  startMonopolyCard,
  startRoadBuildingCard,
  startYearOfPlentyCard,
} from "./commands";

const DEVELOPMENT_LABELS: Record<string, string> = {
  KNIGHT: "Knight",
  ROAD_BUILDING: "Road Building",
  YEAR_OF_PLENTY: "Year of Plenty",
  MONOPOLY: "Monopoly",
  VICTORY_POINT: "Victory Point",
};

const DEVELOPMENT_HINTS: Record<string, string> = {
  KNIGHT: "Move robber",
  ROAD_BUILDING: "Place 2 roads",
  YEAR_OF_PLENTY: "Take 2 resources",
  MONOPOLY: "Claim one resource",
  VICTORY_POINT: "Passive point",
};

function countCards(cards: Record<string, number> | string[] | undefined): Record<string, number> {
  const counts: Record<string, number> = {};
  if (!cards) return counts;
  if (Array.isArray(cards)) {
    for (const card of cards) {
      const key = card.toUpperCase();
      counts[key] = (counts[key] ?? 0) + 1;
    }
    return counts;
  }
  for (const [card, count] of Object.entries(cards)) {
    counts[card.toUpperCase()] = count;
  }
  return counts;
}

function playHandler(card: string): (() => void) | null {
  if (card === "KNIGHT") return startKnightCard;
  if (card === "ROAD_BUILDING") return startRoadBuildingCard;
  if (card === "YEAR_OF_PLENTY") return startYearOfPlentyCard;
  if (card === "MONOPOLY") return startMonopolyCard;
  return null;
}

export function renderResourceBar(): void {
  const bar = $("resource-bar");
  if (!GameState.privateState) {
    bar.innerHTML = '<span class="text-white text-sm">Waiting for game state...</span>';
    return;
  }
  const res = GameState.privateState.resources;
  const vp =
    GameState.privateState.victory_points ??
    (GameState.myPlayerId != null
      ? GameState.playerMap[GameState.myPlayerId]?.victory_points ?? 0
      : 0);

  bar.className =
    "max-w-[min(1100px,calc(100vw-2rem))] bg-black/90 border-2 border-red-800 shadow-[0_0_15px_rgba(200,49,52,0.6)] rounded-lg px-3 py-2 flex items-stretch gap-2 overflow-x-auto";
  bar.innerHTML = "";

  for (const key of RESOURCE_ORDER) {
    const count = res[key] ?? 0;
    const color = RESOURCE_COLORS[key];
    const card = document.createElement("div");
    card.className =
      "w-20 min-w-20 h-24 rounded border-2 border-black/70 shadow flex flex-col justify-between p-2 text-white";
    card.style.background = color;
    card.title = RESOURCE_LABELS[key];
    card.innerHTML =
      '<span class="text-[11px] font-bold uppercase leading-tight">' +
      RESOURCE_LABELS[key] +
      '</span><span class="text-3xl font-game text-right leading-none">' +
      count +
      "</span>";
    bar.appendChild(card);
  }

  const divider = document.createElement("div");
  divider.className = "w-px min-w-px bg-yellow-800/70 mx-1";
  bar.appendChild(divider);

  const devCounts = countCards(GameState.privateState.dev_cards);
  const newDevCounts = countCards(GameState.privateState.new_dev_cards_this_turn);
  const canPlayDev = hasLegalAction("play_development_card");
  for (const key of [
    "KNIGHT",
    "ROAD_BUILDING",
    "YEAR_OF_PLENTY",
    "MONOPOLY",
    "VICTORY_POINT",
  ]) {
    const count = devCounts[key] ?? 0;
    if (count <= 0) continue;
    const freshCount = newDevCounts[key] ?? 0;
    const playableCount = Math.max(0, count - freshCount);
    const handler = playHandler(key);
    const card = document.createElement("div");
    card.className =
      "w-28 min-w-28 h-24 rounded border-2 border-yellow-700 bg-[#5d4037] shadow flex flex-col justify-between p-2 text-yellow-50";
    card.title = DEVELOPMENT_HINTS[key];
    card.innerHTML =
      '<div><div class="text-[11px] font-bold uppercase leading-tight text-yellow-300">' +
      DEVELOPMENT_LABELS[key] +
      '</div><div class="text-[10px] text-yellow-100/80 leading-tight">' +
      DEVELOPMENT_HINTS[key] +
      '</div></div><div class="flex items-end justify-between"><span class="text-2xl font-game leading-none">' +
      count +
      "</span></div>";
    if (handler) {
      const btn = document.createElement("button");
      btn.className =
        "btn-action px-2 py-1 rounded text-[11px] font-bold text-[#3e2723]";
      btn.textContent = "Play";
      btn.disabled = !canPlayDev || playableCount <= 0;
      btn.title =
        playableCount <= 0
          ? "Cards bought this turn cannot be played"
          : "Play " + DEVELOPMENT_LABELS[key];
      btn.addEventListener("click", handler);
      card.querySelector("div:last-child")?.appendChild(btn);
    }
    bar.appendChild(card);
  }

  const vpCard = document.createElement("div");
  vpCard.className =
    "w-20 min-w-20 h-24 rounded border-2 border-yellow-500 bg-black/70 shadow flex flex-col justify-between p-2 text-white";
  vpCard.innerHTML =
    '<span class="text-[11px] font-bold uppercase text-yellow-300">Points</span>' +
    '<span class="text-3xl font-game text-right leading-none">' +
    vp +
    "</span>";
  bar.appendChild(vpCard);
}
