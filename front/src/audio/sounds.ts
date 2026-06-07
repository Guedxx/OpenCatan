import type { CommandEvent, CommandName, CommandResponse } from "../types";

export type SoundKey =
  | "uiClick"
  | "uiConfirm"
  | "uiError"
  | "select"
  | "diceRoll"
  | "buildPlace"
  | "cardDraw"
  | "cardPlay"
  | "resourceGain"
  | "trade";

const SOUND_PATHS: Record<SoundKey, string> = {
  uiClick: "/assets/sounds/ui-click.ogg",
  uiConfirm: "/assets/sounds/ui-confirm.ogg",
  uiError: "/assets/sounds/ui-error.ogg",
  select: "/assets/sounds/select.ogg",
  diceRoll: "/assets/sounds/dice-roll.ogg",
  buildPlace: "/assets/sounds/build-place.ogg",
  cardDraw: "/assets/sounds/card-draw.ogg",
  cardPlay: "/assets/sounds/card-play.ogg",
  resourceGain: "/assets/sounds/resource-gain.ogg",
  trade: "/assets/sounds/trade.ogg",
};

const VOLUME: Record<SoundKey, number> = {
  uiClick: 0.35,
  uiConfirm: 0.45,
  uiError: 0.5,
  select: 0.35,
  diceRoll: 0.55,
  buildPlace: 0.55,
  cardDraw: 0.55,
  cardPlay: 0.55,
  resourceGain: 0.45,
  trade: 0.5,
};

const cache = new Map<SoundKey, HTMLAudioElement>();

function audioFor(key: SoundKey): HTMLAudioElement {
  let audio = cache.get(key);
  if (!audio) {
    audio = new Audio(SOUND_PATHS[key]);
    audio.preload = "auto";
    audio.volume = VOLUME[key];
    cache.set(key, audio);
  }
  return audio;
}

export function playSound(key: SoundKey): void {
  if (typeof window === "undefined") return;
  try {
    const source = audioFor(key);
    const audio = source.cloneNode(true) as HTMLAudioElement;
    audio.volume = VOLUME[key];
    void audio.play().catch(() => {
      // Browsers may block audio until the first user gesture. Ignore; the
      // next user-triggered sound will work after the page is unlocked.
    });
  } catch {
    // Sound effects are best-effort only.
  }
}

export function preloadSounds(): void {
  (Object.keys(SOUND_PATHS) as SoundKey[]).forEach((key) => audioFor(key).load());
}

export function bindGlobalButtonSounds(root: Document = document): void {
  root.addEventListener(
    "click",
    (event) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const clickable = target.closest(
        "button, [role='button'], a[href], input[type='button'], input[type='submit']",
      );
      if (!clickable) return;
      if (clickable instanceof HTMLButtonElement && clickable.disabled) return;
      playSound("uiClick");
    },
    true,
  );
}

function eventTypes(events: CommandEvent[] | null | undefined): Set<string> {
  return new Set((events ?? []).map((event) => event.type));
}

function acceptedCommandSound(
  command: CommandName,
  response: CommandResponse,
): SoundKey {
  const types = eventTypes(response.events);

  if (types.has("dice_rolled")) return "diceRoll";
  if (
    types.has("road_built") ||
    types.has("settlement_built") ||
    types.has("city_built") ||
    types.has("setup_road_placed") ||
    types.has("setup_settlement_placed")
  ) {
    return "buildPlace";
  }
  if (types.has("development_card_bought")) return "cardDraw";
  if (types.has("development_card_played")) return "cardPlay";
  if (
    types.has("bank_trade") ||
    types.has("trade_offer_proposed") ||
    types.has("trade_offer_responded") ||
    types.has("trade_offer_cancelled")
  ) {
    return "trade";
  }
  if (types.has("resources_discarded")) return "resourceGain";

  switch (command) {
    case "roll_dice":
      return "diceRoll";
    case "place_setup_settlement":
    case "place_setup_road":
    case "build_road":
    case "build_settlement":
    case "build_city":
      return "buildPlace";
    case "buy_development_card":
      return "cardDraw";
    case "play_development_card":
      return "cardPlay";
    case "trade_bank":
    case "propose_trade_offer":
    case "respond_trade_offer":
    case "cancel_trade_offer":
      return "trade";
    default:
      return "uiConfirm";
  }
}

export function playCommandSound(
  command: CommandName,
  response: CommandResponse | null,
): void {
  if (!response) return;
  if (!response.accepted) {
    playSound("uiError");
    return;
  }
  playSound(acceptedCommandSound(command, response));
}
