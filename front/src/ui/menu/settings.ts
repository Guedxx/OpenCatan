// Settings screen. Expanded with real 3D toggles that are applied live to
// the renderer and the animate loop. Persisted to localStorage so the
// user's preferences survive reloads.

import { setLanguage, translatePage } from "../../i18n";
import { GameState } from "../../state";
import { setAnimateFlora, setAnimateOcean } from "../../three/animate";
import { applyShadowQuality } from "../../three/scene";
import { $ } from "../dom";
import { setFpsEnabled } from "../fpsCounter";
import { showScreen } from "./nav";
import type { Language } from "./settings.types";
import {
  DEFAULT_SETTINGS,
  loadSettings,
  resetSettings,
  saveSettings,
  type MenuSettings,
} from "./storage";

let settings: MenuSettings = loadSettings();

/** Apply every setting to the running 3D scene. Called once at boot and
 *  again whenever the Settings panel changes a value. */
function applyAll(s: MenuSettings): void {
  applyShadowQuality("high");
  setAnimateOcean(s.oceanAnimation);
  setAnimateFlora(s.floraAnimation);
  setFpsEnabled(s.showFps);
  setLanguage(s.language);
}

function normalizeSettings(s: MenuSettings): MenuSettings {
  return {
    ...s,
    graphicsPreset: "high",
    shadowQuality: "high",
  };
}

function render(): void {
  $<HTMLSelectElement>("st-language").value = settings.language;
  $<HTMLInputElement>("st-ocean").checked = settings.oceanAnimation;
  $<HTMLInputElement>("st-flora").checked = settings.floraAnimation;
  $<HTMLInputElement>("st-fps").checked = settings.showFps;
  translatePage($("screen-settings"));
}

function update(patch: Partial<MenuSettings>): void {
  settings = normalizeSettings({ ...settings, ...patch });
  saveSettings(settings);
  applyAll(settings);
  render();
}

export function bindSettings(): void {
  $<HTMLSelectElement>("st-language").addEventListener("change", (e) => {
    update({ language: (e.target as HTMLSelectElement).value as Language });
  });
  $<HTMLInputElement>("st-ocean").addEventListener("change", (e) => {
    update({ oceanAnimation: (e.target as HTMLInputElement).checked });
  });
  $<HTMLInputElement>("st-flora").addEventListener("change", (e) => {
    update({ floraAnimation: (e.target as HTMLInputElement).checked });
  });
  $<HTMLInputElement>("st-fps").addEventListener("change", (e) => {
    update({ showFps: (e.target as HTMLInputElement).checked });
  });
  $("btn-st-reset").addEventListener("click", () => {
    settings = normalizeSettings(resetSettings());
    saveSettings(settings);
    applyAll(settings);
    render();
  });
  $("btn-st-back").addEventListener("click", () =>
    showScreen(GameState.publicState ? "none" : "main"),
  );

  render();
}

/** Called from main.ts on boot to push the saved settings into the 3D
 *  scene before the first frame is rendered. */
export function bootstrapSettings(): void {
  settings = normalizeSettings(loadSettings());
  saveSettings(settings);
  applyAll(settings);
}

export { DEFAULT_SETTINGS };
