// Typed localStorage wrapper for persistent UI settings.

import type { GraphicsPreset, ShadowQuality } from "./settings.types";

const STORAGE_KEY = "opencatan.settings";
const ACTIVE_ROOM_KEY = "opencatan.activeRoom";
const ACTIVE_GAME_KEY = "opencatan.activeGame";
const RECENTLY_LEFT_GAME_KEY = "opencatan.recentlyLeftGame";

export interface MenuSettings {
  shadowQuality: ShadowQuality;
  oceanAnimation: boolean;
  floraAnimation: boolean;
  showFps: boolean;
  graphicsPreset: GraphicsPreset;
}

export const DEFAULT_SETTINGS: MenuSettings = {
  shadowQuality: "high",
  oceanAnimation: true,
  floraAnimation: true,
  showFps: true,
  graphicsPreset: "high",
};

export function loadSettings(): MenuSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    const parsed = JSON.parse(raw) as Partial<MenuSettings>;
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(settings: MenuSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Quota or disabled storage — ignore; settings stay in memory.
  }
}

export function resetSettings(): MenuSettings {
  const fresh = { ...DEFAULT_SETTINGS };
  saveSettings(fresh);
  return fresh;
}

// ---- Active room (survives reloads so the lobby can be rejoined) ----

export interface ActiveRoom {
  room_id: string;
  player_token: string;
  is_host: boolean;
  // Identity hints captured at save time so a reload can match the
  // correct slot even when multiple guests share `is_host = false`.
  // Optional for backward compatibility with records saved before this
  // field existed. `color` is authoritative (backend enforces unique
  // colors per room); `name` is a tiebreaker if the stored color is
  // stale for any reason.
  name?: string;
  color?: string;
}

export function loadActiveRoom(): ActiveRoom | null {
  try {
    const raw = localStorage.getItem(ACTIVE_ROOM_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ActiveRoom;
    if (!parsed.room_id || !parsed.player_token) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveActiveRoom(entry: ActiveRoom): void {
  try {
    localStorage.setItem(ACTIVE_ROOM_KEY, JSON.stringify(entry));
  } catch {
    // ignore
  }
}

export function clearActiveRoom(): void {
  try {
    localStorage.removeItem(ACTIVE_ROOM_KEY);
  } catch {
    // ignore
  }
}

// ---- Active game (survives reloads so the current match can be restored) ----

export interface ActiveGame {
  game_id: string;
  player_token: string;
}

export function loadActiveGame(): ActiveGame | null {
  try {
    const raw = localStorage.getItem(ACTIVE_GAME_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ActiveGame;
    if (!parsed.game_id || !parsed.player_token) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveActiveGame(entry: ActiveGame): void {
  try {
    localStorage.setItem(ACTIVE_GAME_KEY, JSON.stringify(entry));
  } catch {
    // ignore
  }
}

export function clearActiveGame(): void {
  try {
    localStorage.removeItem(ACTIVE_GAME_KEY);
  } catch {
    // ignore
  }
}

// ---- Recently left game (allows player to rejoin from main menu) ----

export interface RecentlyLeftGame {
  game_id: string;
  player_token: string;
  leftAt: number; // timestamp in ms
}

export function loadRecentlyLeftGame(): RecentlyLeftGame | null {
  try {
    const raw = localStorage.getItem(RECENTLY_LEFT_GAME_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as RecentlyLeftGame;
    if (!parsed.game_id || !parsed.player_token || !parsed.leftAt) return null;
    // Allow rejoin for up to 5 minutes after leaving
    if (Date.now() - parsed.leftAt > 5 * 60 * 1000) {
      clearRecentlyLeftGame();
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function saveRecentlyLeftGame(entry: Omit<RecentlyLeftGame, "leftAt">): void {
  try {
    localStorage.setItem(
      RECENTLY_LEFT_GAME_KEY,
      JSON.stringify({ ...entry, leftAt: Date.now() }),
    );
  } catch {
    // ignore
  }
}

export function clearRecentlyLeftGame(): void {
  try {
    localStorage.removeItem(RECENTLY_LEFT_GAME_KEY);
  } catch {
    // ignore
  }
}
