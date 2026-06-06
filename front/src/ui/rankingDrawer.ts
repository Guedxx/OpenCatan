import { PLAYER_COLORS, PLAYER_COLORS_DARK } from "../config";
import { GameState } from "../state";
import type { PlayerColor, PlayerPublic } from "../types";
import { $ } from "./dom";

let isOpen = false;

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function ensureDrawer(): HTMLDivElement {
  let drawer = document.getElementById("ranking-drawer") as HTMLDivElement | null;
  if (drawer) return drawer;

  drawer = document.createElement("div");
  drawer.id = "ranking-drawer";
  drawer.className = "ranking-drawer";
  drawer.setAttribute("aria-hidden", "true");
  drawer.innerHTML = `
    <div class="ranking-drawer__panel" role="dialog" aria-modal="false" aria-labelledby="ranking-title">
      <div class="ranking-drawer__header">
        <div>
          <div class="ranking-drawer__eyebrow">Ranking</div>
          <h2 id="ranking-title" class="font-game ranking-drawer__title">Army & Road</h2>
        </div>
        <button id="ranking-close" class="ranking-drawer__close" type="button" title="Close ranking" aria-label="Close ranking">&times;</button>
      </div>
      <div id="ranking-content" class="ranking-drawer__content"></div>
    </div>
  `;
  document.body.appendChild(drawer);
  drawer.addEventListener("click", (event) => {
    if (event.target === drawer) closeRankingDrawer();
  });
  drawer
    .querySelector<HTMLButtonElement>("#ranking-close")
    ?.addEventListener("click", closeRankingDrawer);
  return drawer;
}

function sortedByArmy(players: PlayerPublic[]): PlayerPublic[] {
  return [...players].sort(
    (a, b) => b.played_knights - a.played_knights || b.victory_points - a.victory_points,
  );
}

function sortedByRoad(players: PlayerPublic[]): PlayerPublic[] {
  return [...players].sort(
    (a, b) =>
      b.longest_road_length - a.longest_road_length ||
      b.roads.length - a.roads.length ||
      b.victory_points - a.victory_points,
  );
}

function playerRow(
  player: PlayerPublic,
  rank: number,
  metric: number,
  suffix: string,
  badge: string | null,
): string {
  const color = player.color as PlayerColor;
  const bg = PLAYER_COLORS[color] ?? color;
  const border = PLAYER_COLORS_DARK[color] ?? "#5d4037";
  const name = escapeHtml(player.name);
  const me = player.id === GameState.myPlayerId ? " you" : "";

  return `
    <div class="ranking-row" style="border-color:${border}">
      <div class="ranking-row__rank">${rank}</div>
      <div class="ranking-row__swatch" style="background:${bg};border-color:${border}"></div>
      <div class="ranking-row__name">${name}${me}</div>
      <div class="ranking-row__metric">${metric}<span>${suffix}</span></div>
      ${badge ? `<div class="ranking-row__badge">${badge}</div>` : ""}
    </div>
  `;
}

function section(
  title: string,
  imageSrc: string,
  imageAlt: string,
  rows: string,
  emptyText: string,
): string {
  return `
    <section class="ranking-section">
      <div class="ranking-section__title">
        <img src="${imageSrc}" alt="${imageAlt}" width="50" height="50" />
        <h3>${title}</h3>
      </div>
      <div class="ranking-section__rows">${rows || `<p>${emptyText}</p>`}</div>
    </section>
  `;
}

export function renderRankingDrawer(): void {
  const drawer = ensureDrawer();
  const content = drawer.querySelector<HTMLDivElement>("#ranking-content");
  if (!content) return;

  const players = GameState.publicState?.players ?? [];
  const armyRows = sortedByArmy(players)
    .map((player, index) =>
      playerRow(
        player,
        index + 1,
        player.played_knights,
        " knights",
        player.has_largest_army ? "Largest Army" : null,
      ),
    )
    .join("");
  const roadRows = sortedByRoad(players)
    .map((player, index) =>
      playerRow(
        player,
        index + 1,
        player.longest_road_length,
        " roads",
        player.has_longest_road ? "Longest Road" : null,
      ),
    )
    .join("");

  content.innerHTML =
    section(
      "Largest Army",
      "/assets/largest-army.webp",
      "Largest Army card",
      armyRows,
      "No players yet.",
    ) +
    section(
      "Longest Road",
      "/assets/longest-road.webp",
      "Longest Road card",
      roadRows,
      "No roads placed yet.",
    );
  drawer.classList.toggle("is-open", isOpen);
  drawer.setAttribute("aria-hidden", String(!isOpen));
}

export function toggleRankingDrawer(): void {
  isOpen = !isOpen;
  renderRankingDrawer();
}

export function closeRankingDrawer(): void {
  isOpen = false;
  renderRankingDrawer();
}

export function bindRankingDrawer(): void {
  ensureDrawer();
  $("sb-stats").setAttribute("title", "Open ranking");
  $("sb-stats").setAttribute("aria-label", "Open ranking");
}
