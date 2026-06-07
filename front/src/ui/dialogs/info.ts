import { RESOURCE_LABELS, RESOURCE_ORDER } from "../../config";
import { onLanguageChange, t, translatePage } from "../../i18n";
import { GameState } from "../../state";
import type { LegalAction, PlayerPublic } from "../../types";
import { $ } from "../dom";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function currentPlayerName(): string {
  const currentId = GameState.publicState?.turn?.current_player_id;
  if (currentId == null) return t("No one");
  return GameState.playerMap[currentId]?.name ?? t("Player");
}

function lastRollText(): string {
  const turn = GameState.publicState?.turn;
  if (!turn?.last_roll_dice || turn.last_roll_dice.length !== 2) {
    return t("Dice have not been rolled yet.");
  }
  return `${turn.last_roll_dice[0]} + ${turn.last_roll_dice[1]} = ${turn.last_roll ?? "-"}`;
}

function pendingMessage(): string {
  const pending = GameState.publicState?.pending;
  if (!pending) {
    return t("The game is waiting for the current player to continue.");
  }

  const myId = GameState.myPlayerId;
  const myDiscard = myId != null ? pending.pending_discards?.[String(myId)] ?? 0 : 0;
  if (myDiscard > 0) {
    return `${t("You must discard")} ${myDiscard} ${t(myDiscard === 1 ? "resource" : "resources")} ${t("before the game can continue.")}`;
  }

  const otherDiscards = Object.entries(pending.pending_discards ?? {})
    .filter(([, required]) => required > 0)
    .map(([playerId]) => GameState.playerMap[Number(playerId)]?.name ?? t("Player"));
  if (otherDiscards.length > 0) {
    return otherDiscards.length === 1
      ? `${t("Waiting for")} ${otherDiscards[0]} ${t("to discard resources.")}`
      : `${t("Waiting for these players to discard resources:")} ${otherDiscards.join(", ")}.`;
  }

  if (pending.robber_move_required) {
    return t("The robber must be moved before normal play can continue.");
  }

  if (pending.pending_trade_offer) {
    const offer = pending.pending_trade_offer;
    const from = GameState.playerMap[offer.from_player_id]?.name ?? t("Player");
    const to = GameState.playerMap[offer.to_player_id]?.name ?? t("Player");
    if (offer.to_player_id === GameState.myPlayerId) {
      return `${from} ${t("sent you a trade offer. Open Trade to answer it.")}`;
    }
    if (offer.from_player_id === GameState.myPlayerId) {
      return `${t("Your trade offer to")} ${to} ${t("is still waiting for an answer.")}`;
    }
    return `${from} ${t("and")} ${to} ${t("are resolving a trade.")}`;
  }

  if (pending.setup?.pending_setup_road_player_id != null) {
    const name =
      GameState.playerMap[pending.setup.pending_setup_road_player_id]?.name ??
      t("Player");
    return `${name} ${t("still needs to place a setup road.")}`;
  }

  return t("Nothing special is blocking the game right now.");
}

function actionLabel(action: LegalAction): string {
  const labels: Record<LegalAction, string> = {
    place_setup_settlement: "Place your starting settlement",
    place_setup_road: "Place your starting road",
    discard_resources: "Discard the required resources",
    roll_dice: "Roll the dice",
    move_robber: "Move the robber",
    build_road: "Build a road",
    build_settlement: "Build a settlement",
    build_city: "Upgrade to a city",
    buy_development_card: "Buy a development card",
    play_development_card: "Play a development card",
    trade_bank: "Trade with the bank",
    propose_trade_offer: "Offer a trade to another player",
    respond_trade_offer: "Answer a trade offer",
    cancel_trade_offer: "Cancel your pending trade offer",
    end_turn: "End your turn",
  };
  return t(labels[action]);
}

function whatYouCanDoText(): string[] {
  const actions = GameState.privateState?.legal_actions ?? [];
  return actions.map(actionLabel);
}

function winningTip(player: PlayerPublic): string {
  const parts: string[] = [];
  parts.push(`${player.victory_points} ${t(player.victory_points === 1 ? "point" : "points")}`);
  if (player.has_longest_road) {
    parts.push(t("has Longest Road"));
  }
  if (player.has_largest_army) {
    parts.push(t("has Largest Army"));
  }
  return parts.join(" | ");
}

function playersHtml(): string {
  const players = GameState.publicState?.players ?? [];
  return players
    .map((player) => {
      const isCurrent = player.id === GameState.publicState?.turn?.current_player_id;
      const isMe = player.id === GameState.myPlayerId;
      return `
        <div class="bg-black/25 border border-yellow-900 rounded-xl p-4">
          <div class="flex items-start justify-between gap-3">
            <div>
              <div class="text-white font-bold text-base">${escapeHtml(player.name)}${isMe ? ` ${t("(you)")}` : ""}</div>
              <div class="text-yellow-300 text-sm mt-1">${winningTip(player)}</div>
            </div>
            ${
              isCurrent
                ? `<span class="px-3 py-1 rounded-full bg-yellow-500/20 border border-yellow-700 text-yellow-200 text-xs font-bold">${t("Playing now")}</span>`
                : ""
            }
          </div>
          <div class="mt-4 grid grid-cols-2 gap-2 text-sm text-white/85">
            <div>${t("Resources in hand:")} ${player.resource_count}</div>
            <div>${t("Development cards:")} ${player.dev_card_count}</div>
            <div>${t("Roads on board:")} ${player.roads}</div>
            <div>${t("Settlements:")} ${player.settlements}</div>
            <div>${t("Cities:")} ${player.cities}</div>
            <div>${t("Knights played:")} ${player.played_knights}</div>
          </div>
        </div>
      `;
    })
    .join("");
}

function bankSummaryHtml(): string {
  const bank = GameState.publicState?.bank;
  if (!bank) {
    return `<p class="text-white/80 text-sm">${t("The bank counts are not available right now.")}</p>`;
  }
  const resourceCards = bank.resource_cards ?? {};
  return `
    <div class="grid grid-cols-2 md:grid-cols-5 gap-3">
      ${RESOURCE_ORDER.map((resource) => `
        <div class="bg-black/25 border border-yellow-900 rounded-xl px-3 py-3">
          <div class="text-yellow-400 text-[11px] font-bold uppercase">${t(RESOURCE_LABELS[resource])}</div>
          <div class="text-white text-xl font-game mt-1">${resourceCards[resource] ?? 0}</div>
        </div>
      `).join("")}
    </div>
  `;
}

function phaseHint(): string {
  const phase = GameState.publicState?.phase;
  if (phase === "SETUP_1") {
    return t("Players are placing their first starting settlement and road.");
  }
  if (phase === "SETUP_2") {
    return t("Players are placing their second starting settlement and road.");
  }
  if (phase === "FINISHED") {
    return t("The match is over. The winner reached the victory point goal.");
  }

  const turnPhase = GameState.publicState?.turn?.turn_phase;
  if (turnPhase === "ROLL") {
    return t("The active player should roll the dice.");
  }
  if (turnPhase === "TRADE") {
    return t("The active player can trade and prepare their turn.");
  }
  if (turnPhase === "BUILD") {
    return t("The active player can build, buy cards, and keep trading if allowed.");
  }
  if (turnPhase === "END") {
    return t("The active player can finish the turn.");
  }
  return t("Follow the current turn flow shown on the right side of the screen.");
}

export function renderInfoDialog(): void {
  const content = $("info-content");
  if (!GameState.publicState) {
    content.innerHTML =
      '<p class="text-white text-sm">Start or join a game to see player-friendly match info.</p>';
    return;
  }

  const actions = whatYouCanDoText();

  content.innerHTML = `
    <div class="space-y-5">
      <section class="bg-black/25 border border-yellow-900 rounded-2xl p-5">
        <h3 class="text-yellow-400 font-bold text-lg mb-2">${t("What Is Happening Now")}</h3>
        <p class="text-white text-base leading-7">
          ${t("It is")} <span class="text-yellow-300 font-bold">${escapeHtml(currentPlayerName())}</span>${t("'s turn.")}
          ${escapeHtml(phaseHint())}
        </p>
        <div class="grid md:grid-cols-2 gap-3 mt-4 text-sm text-white/85">
          <div>${t("Current step:")} <span class="text-yellow-200 font-bold">${escapeHtml(GameState.publicState.turn?.turn_phase ?? GameState.publicState.phase)}</span></div>
          <div>${t("Last roll:")} <span class="text-yellow-200 font-bold">${escapeHtml(lastRollText())}</span></div>
        </div>
      </section>

      <section class="bg-black/25 border border-yellow-900 rounded-2xl p-5">
        <h3 class="text-yellow-400 font-bold text-lg mb-2">${t("What You Should Know")}</h3>
        <p class="text-white text-base leading-7">${escapeHtml(pendingMessage())}</p>
      </section>

      <section class="bg-black/25 border border-yellow-900 rounded-2xl p-5">
        <h3 class="text-yellow-400 font-bold text-lg mb-3">${t("What You Can Do Right Now")}</h3>
        ${
          actions.length > 0
            ? `
              <div class="space-y-2">
                ${actions
                  .map(
                    (action) => `
                      <div class="bg-yellow-600/10 border border-yellow-700 rounded-xl px-4 py-3 text-white text-sm">
                        ${escapeHtml(action)}
                      </div>
                    `,
                  )
                  .join("")}
              </div>
            `
            : `<p class="text-white/85 text-sm">${t("You cannot act right now. You are probably waiting for another player or for the game to advance.")}</p>`
        }
      </section>

      <section class="bg-black/25 border border-yellow-900 rounded-2xl p-5">
        <h3 class="text-yellow-400 font-bold text-lg mb-2">${t("How To Win")}</h3>
        <p class="text-white text-base leading-7">
          ${t("Reach the victory point goal before everyone else. Build settlements and cities, and try to earn bonuses like")}
          <span class="text-yellow-300 font-bold"> ${t("Longest Road")} </span>
          ${t("and")}
          <span class="text-yellow-300 font-bold"> ${t("Largest Army")}</span>.
        </p>
      </section>

      <section class="bg-black/25 border border-yellow-900 rounded-2xl p-5">
        <h3 class="text-yellow-400 font-bold text-lg mb-3">${t("Players")}</h3>
        <div class="grid md:grid-cols-2 gap-4">
          ${playersHtml()}
        </div>
      </section>

      <section class="bg-black/25 border border-yellow-900 rounded-2xl p-5">
        <h3 class="text-yellow-400 font-bold text-lg mb-3">${t("Bank Resources")}</h3>
        <p class="text-white/85 text-sm mb-3">${t("This shows how many resource cards are still available in the bank.")}</p>
        ${bankSummaryHtml()}
      </section>
    </div>
  `;
  translatePage(content);
}

export function openInfoDialog(): void {
  $("info-dialog").classList.remove("hidden");
  renderInfoDialog();
}

export function closeInfoDialog(): void {
  $("info-dialog").classList.add("hidden");
}

export function bindInfoDialog(): void {
  $("info-close").addEventListener("click", closeInfoDialog);
  $("info-dialog").addEventListener("click", (event) => {
    if (event.target === $("info-dialog")) {
      closeInfoDialog();
    }
  });
  onLanguageChange(() => {
    translatePage($("info-dialog"));
    syncInfoDialog();
  });
}

export function syncInfoDialog(): void {
  if (!$("info-dialog").classList.contains("hidden")) {
    renderInfoDialog();
  }
}
