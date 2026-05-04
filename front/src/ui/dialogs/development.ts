import { RESOURCE_COLORS, RESOURCE_LABELS, RESOURCE_ORDER } from "../../config";
import { apiCommand } from "../../net/api";
import { GameState } from "../../state";
import { showToast } from "../toast";

type DevelopmentResourceMode = "year_of_plenty" | "monopoly";

let selectedResources: string[] = [];
let activeMode: DevelopmentResourceMode | null = null;

function ensureDialog(): HTMLDivElement {
  let dialog = document.getElementById("development-dialog") as HTMLDivElement | null;
  if (dialog) return dialog;

  dialog = document.createElement("div");
  dialog.id = "development-dialog";
  dialog.className =
    "fixed inset-0 bg-black/70 flex items-center justify-center z-50 hidden";
  dialog.innerHTML = `
    <div class="bg-[#3e2723] border-2 border-yellow-700 rounded-xl p-6 w-[420px] shadow-2xl">
      <h2 id="development-title" class="font-game text-yellow-400 text-xl text-center mb-3"></h2>
      <div id="development-resource-buttons" class="grid grid-cols-2 gap-2"></div>
      <div id="development-selection" class="text-yellow-100 text-sm text-center mt-3 min-h-5"></div>
      <div class="flex gap-2 mt-4">
        <button id="development-cancel" class="btn-side flex-1 py-2 rounded font-bold text-[#3e2723]">Cancel</button>
        <button id="development-submit" class="btn-action flex-1 py-2 rounded font-bold text-[#3e2723]">Play</button>
      </div>
    </div>`;
  document.body.appendChild(dialog);
  dialog
    .querySelector<HTMLButtonElement>("#development-cancel")
    ?.addEventListener("click", hideDevelopmentResourceDialog);
  dialog
    .querySelector<HTMLButtonElement>("#development-submit")
    ?.addEventListener("click", () => {
      void submitDevelopmentResourceDialog();
    });
  return dialog;
}

export function showDevelopmentResourceDialog(
  mode: DevelopmentResourceMode,
): void {
  if (!GameState.privateState?.legal_actions.includes("play_development_card")) {
    showToast("Development cards are not playable right now", "warning");
    return;
  }

  activeMode = mode;
  selectedResources = [];
  const dialog = ensureDialog();
  const title = dialog.querySelector<HTMLElement>("#development-title");
  const buttons = dialog.querySelector<HTMLElement>(
    "#development-resource-buttons",
  );
  if (!title || !buttons) return;

  title.textContent =
    mode === "year_of_plenty" ? "Year of Plenty" : "Monopoly";
  buttons.innerHTML = "";
  for (const resource of RESOURCE_ORDER) {
    const btn = document.createElement("button");
    btn.className =
      "rounded border-2 border-black/60 px-3 py-2 text-left font-bold text-white shadow";
    btn.style.background = RESOURCE_COLORS[resource];
    btn.textContent = RESOURCE_LABELS[resource];
    btn.addEventListener("click", () => chooseResource(resource));
    buttons.appendChild(btn);
  }
  renderSelection();
  dialog.classList.remove("hidden");
}

function chooseResource(resource: string): void {
  if (activeMode === "monopoly") {
    selectedResources = [resource];
  } else {
    selectedResources.push(resource);
    if (selectedResources.length > 2) selectedResources.shift();
  }
  renderSelection();
}

function renderSelection(): void {
  const dialog = ensureDialog();
  const selection = dialog.querySelector<HTMLElement>("#development-selection");
  const submit = dialog.querySelector<HTMLButtonElement>("#development-submit");
  if (!selection || !submit) return;

  if (activeMode === "monopoly") {
    selection.textContent =
      selectedResources.length === 0
        ? "Choose one resource to collect from all opponents."
        : "Selected: " + RESOURCE_LABELS[selectedResources[0]];
    submit.disabled = selectedResources.length !== 1;
    return;
  }

  selection.textContent =
    selectedResources.length === 0
      ? "Choose two resources. You may choose the same resource twice."
      : "Selected: " +
        selectedResources.map((r) => RESOURCE_LABELS[r]).join(", ");
  submit.disabled = selectedResources.length !== 2;
}

async function submitDevelopmentResourceDialog(): Promise<void> {
  if (!activeMode) return;
  if (activeMode === "year_of_plenty" && selectedResources.length !== 2) return;
  if (activeMode === "monopoly" && selectedResources.length !== 1) return;

  const payload =
    activeMode === "year_of_plenty"
      ? {
          card_type: "year_of_plenty",
          args: {
            resources: selectedResources.map((resource) =>
              resource.toLowerCase(),
            ),
          },
        }
      : {
          card_type: "monopoly",
          args: { resource: selectedResources[0].toLowerCase() },
        };
  const result = await apiCommand("play_development_card", payload);
  if (result?.accepted) {
    showToast(
      activeMode === "year_of_plenty"
        ? "Year of Plenty played"
        : "Monopoly played",
      "success",
    );
    hideDevelopmentResourceDialog();
  }
}

function hideDevelopmentResourceDialog(): void {
  ensureDialog().classList.add("hidden");
  activeMode = null;
  selectedResources = [];
}
