import { playSound, type SoundKey } from "../audio/sounds";
import { GameState } from "../state";
import { sendGameEmote } from "../net/ws";

interface EmoteDef {
  id: string;
  emoji: string;
  label: string;
  taunt: string;
  sound: SoundKey;
  speak?: string;
}

const EMOTES: EmoteDef[] = [
  { id: "laugh", emoji: "😂", label: "Laugh", taunt: "HI HI HA!", sound: "uiConfirm", speak: "Hi hi ha!" },
  { id: "cry", emoji: "😭", label: "Cry", taunt: "Boo hoo!", sound: "uiError", speak: "Boo hoo!" },
  { id: "rage", emoji: "😡", label: "Rage", taunt: "Grrr!", sound: "trade", speak: "Grrr!" },
  { id: "smug", emoji: "😏", label: "Smug", taunt: "Too easy.", sound: "cardPlay", speak: "Too easy." },
  { id: "clap", emoji: "👏", label: "Clap", taunt: "Well played!", sound: "resourceGain", speak: "Well played!" },
  { id: "oops", emoji: "💀", label: "Oops", taunt: "Oops...", sound: "buildPlace", speak: "Oops." },
];

const EMOTES_BY_ID = new Map(EMOTES.map((emote) => [emote.id, emote]));

let panel: HTMLDivElement | null = null;
let bubble: HTMLDivElement | null = null;
let bubbleTimer: number | null = null;

function ensurePanel(): HTMLDivElement {
  if (panel) return panel;
  panel = document.createElement("div");
  panel.id = "emote-panel";
  panel.className = "emote-panel hidden";
  panel.innerHTML = `
    <div class="emote-panel__title">Taunts</div>
    <div class="emote-panel__grid">
      ${EMOTES.map(
        (emote, index) => `
          <button type="button" class="emote-choice" data-emote-index="${index}" title="${emote.label}">
            <span class="emote-choice__emoji">${emote.emoji}</span>
            <span class="emote-choice__label">${emote.label}</span>
          </button>
        `,
      ).join("")}
    </div>
  `;
  document.body.appendChild(panel);
  panel.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const button = target.closest<HTMLButtonElement>("[data-emote-index]");
    if (!button) return;
    const index = Number(button.dataset.emoteIndex);
    const emote = EMOTES[index];
    if (emote) triggerEmote(emote);
  });
  return panel;
}

function ensureBubble(): HTMLDivElement {
  if (bubble) return bubble;
  bubble = document.createElement("div");
  bubble.id = "emote-bubble";
  bubble.className = "emote-bubble hidden";
  document.body.appendChild(bubble);
  return bubble;
}

function playerName(): string {
  const id = GameState.myPlayerId;
  if (id == null) return "You";
  return GameState.playerMap[id]?.name ?? "You";
}

function speakTaunt(text: string): void {
  if (!("speechSynthesis" in window) || !("SpeechSynthesisUtterance" in window)) {
    return;
  }
  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.pitch = text.toLowerCase().includes("hi hi ha") ? 0.65 : 1.15;
    utterance.rate = text.toLowerCase().includes("hi hi ha") ? 0.95 : 1.1;
    utterance.volume = 0.75;
    window.speechSynthesis.speak(utterance);
  } catch {
    // Voice taunts are best-effort; keep emoji and SFX even if unavailable.
  }
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>'"]/g, (char) => {
    switch (char) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case "'":
        return "&#39;";
      case '"':
        return "&quot;";
      default:
        return char;
    }
  });
}

function showEmote(emote: EmoteDef, name: string): void {
  playSound(emote.sound);
  if (emote.speak) speakTaunt(emote.speak);

  const el = ensureBubble();
  el.innerHTML = `
    <div class="emote-bubble__card">
      <div class="emote-bubble__emoji">${emote.emoji}</div>
      <div>
        <div class="emote-bubble__name">${escapeHtml(name)}</div>
        <div class="emote-bubble__taunt">${emote.taunt}</div>
      </div>
    </div>
  `;
  el.classList.remove("hidden");
  el.classList.remove("emote-bubble--pop");
  // Force animation restart.
  void el.offsetWidth;
  el.classList.add("emote-bubble--pop");

  if (bubbleTimer !== null) window.clearTimeout(bubbleTimer);
  bubbleTimer = window.setTimeout(() => {
    el.classList.add("hidden");
  }, 2400);
}

function triggerEmote(emote: EmoteDef): void {
  toggleEmotePanel(false);
  if (!sendGameEmote(emote.id)) {
    showEmote(emote, playerName());
  }
}

export function toggleEmotePanel(force?: boolean): void {
  const el = ensurePanel();
  const shouldOpen = force ?? el.classList.contains("hidden");
  el.classList.toggle("hidden", !shouldOpen);
}

export function bindEmotes(): void {
  ensurePanel();
  ensureBubble();
  document.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    if (target.closest("#emote-panel") || target.closest("#sb-emotes")) return;
    toggleEmotePanel(false);
  });
  document.addEventListener("opencatan:emote", (event) => {
    const detail = (event as CustomEvent).detail as {
      emote?: string;
      player_name?: string;
    };
    const emote = detail.emote ? EMOTES_BY_ID.get(detail.emote) : undefined;
    if (!emote) return;
    showEmote(emote, detail.player_name || "Player");
  });
  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape") toggleEmotePanel(false);
  });
}
