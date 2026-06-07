import { translatePage } from "../../i18n";
import { $ } from "../dom";

const RULE_SECTIONS: Array<{
  title: string;
  icon: string;
  items: string[];
}> = [
  {
    title: "Goal",
    icon: "&#127942;",
    items: [
      "Be the first player to reach the victory point goal.",
      "Points usually come from settlements, cities, Longest Road, Largest Army, and some development cards.",
    ],
  },
  {
    title: "Turn Flow",
    icon: "&#127922;",
    items: [
      "On your turn, roll the dice first.",
      "After rolling, collect resources, trade, build, buy development cards, or end your turn.",
    ],
  },
  {
    title: "Resource Production",
    icon: "&#127793;",
    items: [
      "When a number is rolled, each tile with that number produces resources.",
      "A settlement next to that tile collects 1 resource. A city collects 2.",
      "Tiles with the robber do not produce resources.",
    ],
  },
  {
    title: "Building",
    icon: "&#127968;",
    items: [
      "Roads must connect to your existing roads, settlements, or cities.",
      "Settlements must be at least two edges away from every other settlement or city.",
      "Cities upgrade your own settlements and produce more resources.",
    ],
  },
  {
    title: "Robber",
    icon: "&#128683;",
    items: [
      "If a 7 is rolled, players with too many cards may need to discard.",
      "The current player moves the robber to a tile.",
      "The robber blocks that tile and may let the current player steal from a nearby opponent.",
    ],
  },
  {
    title: "Trading",
    icon: "&#x1F91D;",
    items: [
      "You can trade resources with the bank or with other players when the turn allows it.",
      "Ports can improve bank trade rates if you have a settlement or city on that port.",
    ],
  },
  {
    title: "Development Cards",
    icon: "&#128220;",
    items: [
      "Development cards can help with resources, roads, victory points, or the robber.",
      "Most development cards cannot be played on the same turn they were bought.",
      "Playing knights can help you compete for Largest Army.",
    ],
  },
];

function sectionHtml(section: (typeof RULE_SECTIONS)[number]): string {
  return `
    <section class="rounded-lg border border-yellow-900 bg-black/25 p-4">
      <h3 class="text-base font-bold text-yellow-300">
        <span class="mr-2">${section.icon}</span>${section.title}
      </h3>
      <ul class="mt-3 space-y-2 text-sm leading-6 text-white/85">
        ${section.items
          .map((item) => `<li class="flex gap-2"><span class="text-yellow-400">-</span><span>${item}</span></li>`)
          .join("")}
      </ul>
    </section>
  `;
}

export function renderRulesDialog(): void {
  const content = $("rules-content");
  content.innerHTML = `
    <div class="space-y-3">
      ${RULE_SECTIONS.map(sectionHtml).join("")}
    </div>
  `;
  translatePage(content);
}

export function openRulesDialog(): void {
  $("rules-dialog").classList.remove("hidden");
  renderRulesDialog();
}

export function closeRulesDialog(): void {
  $("rules-dialog").classList.add("hidden");
}

export function bindRulesDialog(): void {
  $("rules-close").addEventListener("click", closeRulesDialog);
  $("rules-dialog").addEventListener("click", (event) => {
    if (event.target === $("rules-dialog")) {
      closeRulesDialog();
    }
  });
}
