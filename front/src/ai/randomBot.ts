import { apiCommandForPlayer, apiGetState } from "../net/api";
import { GameState } from "../state";
import { showToast } from "../ui/toast";
import type {
  CommandName,
  CreatedPlayer,
  LegalAction,
  PublicState,
  Resource,
  StateEnvelope,
} from "../types";

const STORAGE_KEY = "opencatan.singleplayerBots";
const BOT_THINK_MS = 700;
const MAX_PLACEMENT_ATTEMPTS = 96;
const RESOURCES: Exclude<Resource, "DESERT">[] = [
  "BRICK",
  "LUMBER",
  "WOOL",
  "GRAIN",
  "ORE",
];

interface BotPlayer {
  playerId: number;
  token: string;
}

interface BotSession {
  gameId: string;
  bots: BotPlayer[];
}

let session: BotSession | null = loadSession();
let timer: number | null = null;
let running = false;

export function startRandomBots(gameId: string, players: CreatedPlayer[]): void {
  session = {
    gameId,
    bots: players.map((p) => ({ playerId: p.player_id, token: p.token })),
  };
  saveSession();
  scheduleRandomBotTurn();
}

export function scheduleRandomBotTurn(): void {
  if (!session || !GameState.publicState || GameState.publicState.phase === "FINISHED") {
    return;
  }
  if (session.gameId !== GameState.gameId) return;
  const currentPlayerId = GameState.publicState.turn?.current_player_id;
  const hasPendingBotDiscard = session.bots.some((bot) =>
    botHasPendingDiscard(GameState.publicState, bot.playerId),
  );
  const hasPendingBotTrade = session.bots.some((bot) =>
    botHasPendingTrade(GameState.publicState, bot.playerId),
  );
  const isBotTurn = session.bots.some((bot) => bot.playerId === currentPlayerId);
  if (!hasPendingBotDiscard && !hasPendingBotTrade && !isBotTurn) return;
  if (timer != null || running) return;
  timer = window.setTimeout(() => {
    timer = null;
    void playCurrentBotTurn();
  }, BOT_THINK_MS);
}

function loadSession(): BotSession | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as BotSession;
    if (!parsed.gameId || !Array.isArray(parsed.bots)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function saveSession(): void {
  if (!session) return;
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

async function playCurrentBotTurn(): Promise<void> {
  if (!session || !GameState.gameId || !GameState.publicState) return;

  running = true;
  try {
    const discarded = await discardForPendingBots();
    if (discarded) {
      await delay(180);
    }

    const traded = await respondForPendingBotTrades();
    if (traded) {
      await delay(180);
    }

    const currentPlayerId = GameState.publicState.turn?.current_player_id;
    const bot = session.bots.find((item) => item.playerId === currentPlayerId);
    if (!bot) return;

    for (let step = 0; step < 8; step++) {
      const state = await apiGetState(session.gameId, bot.token);
      if (!state?.private_state || state.public_state.phase === "FINISHED") return;
      if (state.public_state.turn?.current_player_id !== bot.playerId) return;

      const acted = await playOneAction(state, bot.token);
      if (!acted) return;
      await delay(180);
    }
  } finally {
    running = false;
    scheduleRandomBotTurn();
  }
}

async function discardForPendingBots(): Promise<boolean> {
  if (!session) return false;
  let discarded = false;

  for (const bot of session.bots) {
    const state = await apiGetState(session.gameId, bot.token);
    if (!state?.private_state || state.public_state.phase === "FINISHED") continue;
    if (!botHasPendingDiscard(state.public_state, bot.playerId)) continue;

    const accepted = await send(state, bot.token, "discard_resources", {
      resources: randomDiscardBundle(state),
    });
    discarded = accepted || discarded;
    if (accepted) {
      await delay(120);
    }
  }

  return discarded;
}

async function respondForPendingBotTrades(): Promise<boolean> {
  if (!session) return false;
  const offer = GameState.publicState?.pending?.pending_trade_offer;
  if (!offer) return false;

  const bot = session.bots.find((item) => item.playerId === offer.to_player_id);
  if (!bot) return false;

  const state = await apiGetState(session.gameId, bot.token);
  if (!state?.private_state || state.public_state.phase === "FINISHED") {
    return false;
  }
  if (!botHasPendingTrade(state.public_state, bot.playerId)) {
    return false;
  }

  return respondToTradeOffer(state, bot.token);
}

async function playOneAction(state: StateEnvelope, token: string): Promise<boolean> {
  const legal = state.private_state?.legal_actions ?? [];
  const playerId = state.private_state?.player_id;
  if (playerId == null) return false;

  if (legal.includes("discard_resources")) {
    return send(state, token, "discard_resources", {
      resources: randomDiscardBundle(state),
    });
  }

  if (legal.includes("respond_trade_offer")) {
    const offer = state.public_state.pending?.pending_trade_offer;
    if (offer?.to_player_id === playerId) {
      return respondToTradeOffer(state, token);
    }
  }

  if (legal.includes("place_setup_settlement")) {
    return tryPlacements(state, token, "place_setup_settlement", "vertex_id");
  }

  if (legal.includes("place_setup_road")) {
    return tryPlacements(state, token, "place_setup_road", "edge_id");
  }

  if (legal.includes("roll_dice")) {
    return send(state, token, "roll_dice");
  }

  if (legal.includes("move_robber")) {
    return tryMoveRobber(state, token);
  }

  const buildAction = shuffled<LegalAction>([
    "build_city",
    "build_settlement",
    "build_road",
    "buy_development_card",
  ]).find((action) => legal.includes(action));
  if (buildAction) {
    const built = await playBuildAction(state, token, buildAction);
    if (built) return true;
  }

  if (legal.includes("end_turn")) {
    return send(state, token, "end_turn");
  }

  return false;
}

async function playBuildAction(
  state: StateEnvelope,
  token: string,
  action: LegalAction,
): Promise<boolean> {
  if (action === "buy_development_card") {
    return send(state, token, "buy_development_card");
  }
  if (action === "build_city") {
    return tryPlacements(state, token, "build_city", "vertex_id");
  }
  if (action === "build_settlement") {
    return tryPlacements(state, token, "build_settlement", "vertex_id");
  }
  if (action === "build_road") {
    return tryPlacements(state, token, "build_road", "edge_id");
  }
  return false;
}

async function tryPlacements(
  state: StateEnvelope,
  token: string,
  command: CommandName,
  idKey: "vertex_id" | "edge_id",
): Promise<boolean> {
  const ids =
    idKey === "vertex_id"
      ? state.public_state.board.vertices.map((v) => v.id)
      : state.public_state.board.edges.map((e) => e.id);
  for (const id of shuffled(ids).slice(0, MAX_PLACEMENT_ATTEMPTS)) {
    const accepted = await send(state, token, command, { [idKey]: id });
    if (accepted) return true;
  }
  return false;
}

async function tryMoveRobber(state: StateEnvelope, token: string): Promise<boolean> {
  const currentTile = state.public_state.board.robber_tile_id;
  const tileIds = state.public_state.board.tiles
    .map((tile) => tile.id)
    .filter((id) => id !== currentTile);
  for (const tileId of shuffled(tileIds)) {
    const victimId = randomVictimForTile(state.public_state, tileId);
    const accepted = await send(state, token, "move_robber", {
      tile_id: tileId,
      ...(victimId == null ? {} : { victim_id: victimId }),
    });
    if (accepted) return true;
  }
  return false;
}

function randomVictimForTile(state: PublicState, tileId: number): number | null {
  const tile = state.board.tiles.find((item) => item.id === tileId);
  const currentPlayerId = state.turn?.current_player_id;
  if (!tile || currentPlayerId == null) return null;
  const victimIds = new Set<number>();
  for (const vertexId of tile.vertex_ids) {
    const vertex = state.board.vertices.find((item) => item.id === vertexId);
    const ownerId = vertex?.building?.owner_id;
    if (ownerId != null && ownerId !== currentPlayerId) victimIds.add(ownerId);
  }
  return pick([...victimIds]) ?? null;
}

function botHasPendingDiscard(state: PublicState | null, playerId: number): boolean {
  return Number(state?.pending?.pending_discards?.[String(playerId)] ?? 0) > 0;
}

function botHasPendingTrade(state: PublicState | null, playerId: number): boolean {
  return state?.pending?.pending_trade_offer?.to_player_id === playerId;
}

function canPay(
  resources: Record<string, number>,
  cost: Record<string, number>,
): boolean {
  return Object.entries(cost).every(
    ([resource, amount]) => (resources[resource] ?? 0) >= amount,
  );
}

async function respondToTradeOffer(
  state: StateEnvelope,
  token: string,
): Promise<boolean> {
  const offer = state.public_state.pending?.pending_trade_offer;
  const privateState = state.private_state;
  if (!offer || !privateState || offer.to_player_id !== privateState.player_id) {
    return false;
  }

  const canAccept = canPay(privateState.resources, offer.receive);
  const accept = canAccept && Math.random() < 0.5;
  const accepted = await send(state, token, "respond_trade_offer", {
    offer_id: offer.id,
    accept,
  });
  if (accepted && offer.from_player_id === GameState.myPlayerId) {
    const botName = GameState.playerMap[offer.to_player_id]?.name ?? "Bot";
    showToast(
      accept
        ? `${botName} accepted your trade`
        : `${botName} refused your trade`,
      accept ? "success" : "info",
    );
  }
  return accepted;
}

function randomDiscardBundle(state: StateEnvelope): Record<string, number> {
  const playerId = state.private_state?.player_id;
  const required =
    playerId == null
      ? 0
      : Number(state.public_state.pending?.pending_discards?.[String(playerId)] ?? 0);
  const resources = { ...(state.private_state?.resources ?? {}) };
  const bundle: Record<string, number> = {};

  for (let i = 0; i < required; i++) {
    const available = RESOURCES.filter((resource) => (resources[resource] ?? 0) > 0);
    const resource = pick(available);
    if (!resource) break;
    resources[resource] = (resources[resource] ?? 0) - 1;
    bundle[resource] = (bundle[resource] ?? 0) + 1;
  }

  return bundle;
}

async function send(
  state: StateEnvelope,
  token: string,
  command: CommandName,
  payload: Record<string, unknown> = {},
): Promise<boolean> {
  const response = await apiCommandForPlayer({
    gameId: state.game_id,
    playerToken: token,
    command,
    payload,
    expectedVersion: state.version,
  });
  return response?.accepted === true;
}

function shuffled<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function pick<T>(items: T[]): T | undefined {
  return items[Math.floor(Math.random() * items.length)];
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}
