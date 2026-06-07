import { RESOURCE_COLORS, RESOURCE_LABELS, RESOURCE_ORDER } from "../../config";
import { t, translatePage } from "../../i18n";
import { GameState } from "../../state";
import { $ } from "../dom";

type Cost = Record<string, number>;

const BUILD_COSTS: Array<{
  title: string;
  hint: string;
  icon: string;
  cost: Cost;
}> = [
  {
    title: "Road",
    hint: "Builds one road edge.",
    icon: "&#128739;&#65039;",
    cost: { LUMBER: 1, BRICK: 1 },
  },
  {
    title: "Settlement",
    hint: "Places a new house on an empty vertex.",
    icon: "&#127968;",
    cost: { LUMBER: 1, BRICK: 1, WOOL: 1, GRAIN: 1 },
  },
  {
    title: "City",
    hint: "Upgrades one of your settlements.",
    icon: "&#127983;",
    cost: { GRAIN: 2, ORE: 3 },
  },
  {
    title: "Development Card",
    hint: "Buys one card from the development deck.",
    icon: "&#128220;",
    cost: { WOOL: 1, GRAIN: 1, ORE: 1 },
  },
];

function resourceAmount(resource: string): number {
  return GameState.privateState?.resources?.[resource] ?? 0;
}

function missingFor(cost: Cost): Cost {
  const missing: Cost = {};
  for (const resource of RESOURCE_ORDER) {
    const required = cost[resource] ?? 0;
    const missingAmount = Math.max(0, required - resourceAmount(resource));
    if (missingAmount > 0) {
      missing[resource] = missingAmount;
    }
  }
  return missing;
}

function resourceChip(resource: string, amount: number): string {
  const label = t(RESOURCE_LABELS[resource] ?? resource);
  const color = RESOURCE_COLORS[resource] ?? "#5d4037";
  return `
    <span class="inline-flex items-center justify-center rounded-md px-2 py-1 text-xs font-bold text-white shadow" style="background:${color}">
      ${amount} ${label}
    </span>
  `;
}

function costLine(cost: Cost): string {
  return RESOURCE_ORDER.filter((resource) => (cost[resource] ?? 0) > 0)
    .map((resource) => resourceChip(resource, cost[resource]))
    .join("");
}

function missingLine(cost: Cost): string {
  const missing = missingFor(cost);
  const missingResources = RESOURCE_ORDER.filter(
    (resource) => (missing[resource] ?? 0) > 0,
  );
  if (missingResources.length === 0) {
    return '<span class="text-green-300 font-bold">You have enough resources.</span>';
  }
  return `
    <span class="text-white/80">Missing:</span>
    <span class="inline-flex flex-wrap gap-1.5">
      ${missingResources
        .map((resource) => resourceChip(resource, missing[resource]))
        .join("")}
    </span>
  `;
}

export function renderCostsDialog(): void {
  const content = $("costs-content");
  const hasPrivateResources = GameState.privateState?.resources != null;
  content.innerHTML = `
    <div class="space-y-3">
      ${
        hasPrivateResources
          ? ""
          : '<p class="rounded-lg border border-yellow-800 bg-black/25 px-3 py-2 text-sm text-yellow-100">Start or join a game to compare costs with your hand.</p>'
      }
      ${BUILD_COSTS.map(
        (item) => `
          <section class="rounded-lg border border-yellow-900 bg-black/25 p-4">
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0">
                <h3 class="text-base font-bold text-yellow-300">
                  <span class="mr-2">${item.icon}</span>${item.title}
                </h3>
                <p class="mt-1 text-sm text-white/75">${item.hint}</p>
              </div>
            </div>
            <div class="mt-3 flex flex-wrap gap-1.5">${costLine(item.cost)}</div>
            <div class="mt-3 flex flex-wrap items-center gap-1.5 text-sm">
              ${hasPrivateResources ? missingLine(item.cost) : '<span class="text-white/70">Cost only.</span>'}
            </div>
          </section>
        `,
      ).join("")}
    </div>
  `;
  translatePage(content);
}

export function openCostsDialog(): void {
  $("costs-dialog").classList.remove("hidden");
  renderCostsDialog();
}

export function closeCostsDialog(): void {
  $("costs-dialog").classList.add("hidden");
}

export function bindCostsDialog(): void {
  $("costs-close").addEventListener("click", closeCostsDialog);
  $("costs-dialog").addEventListener("click", (event) => {
    if (event.target === $("costs-dialog")) {
      closeCostsDialog();
    }
  });
}

export function syncCostsDialog(): void {
  if (!$("costs-dialog").classList.contains("hidden")) {
    renderCostsDialog();
  }
}
