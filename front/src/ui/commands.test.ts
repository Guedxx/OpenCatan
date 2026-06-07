import { beforeEach, describe, expect, it, vi } from "vitest";

import { GameState } from "../state";
import {
  doBankTrade,
  doBuyDevCard,
  doEndTurn,
  doRollDice,
  registerActionCallbacks,
  startKnightCard,
  startRoadBuildingCard,
  toggleMode,
} from "./commands";

const apiCommandMock = vi.hoisted(() => vi.fn());
const openTradeDialogMock = vi.hoisted(() => vi.fn());
const showToastMock = vi.hoisted(() => vi.fn());

vi.mock("../net/api", () => ({
  apiCommand: apiCommandMock,
}));

vi.mock("./dialogs/development", () => ({
  showDevelopmentResourceDialog: vi.fn(),
}));

vi.mock("./dialogs/tradeOffer", () => ({
  openTradeDialog: openTradeDialogMock,
}));

vi.mock("./toast", () => ({
  showToast: showToastMock,
}));

describe("UI command helpers", () => {
  let rebuildScene: ReturnType<typeof vi.fn<() => void>>;
  let renderActionButtons: ReturnType<typeof vi.fn<() => void>>;

  beforeEach(() => {
    resetGameState();
    apiCommandMock.mockReset();
    openTradeDialogMock.mockReset();
    showToastMock.mockReset();
    rebuildScene = vi.fn<() => void>();
    renderActionButtons = vi.fn<() => void>();
    registerActionCallbacks({ rebuildScene, renderActionButtons });
  });

  it("toggles interaction mode and clears pending road-building edges when leaving that mode", () => {
    GameState.interactionMode = "play_road_building";
    GameState.pendingRoadBuildingEdgeIds = [1, 2];

    toggleMode("place_road");

    expect(GameState.interactionMode).toBe("place_road");
    expect(GameState.pendingRoadBuildingEdgeIds).toEqual([]);
    expect(rebuildScene).toHaveBeenCalledOnce();
    expect(renderActionButtons).toHaveBeenCalledOnce();
  });

  it("warns instead of starting knight mode when development cards are illegal", () => {
    GameState.privateState = {
      player_id: 1,
      resources: {},
      dev_cards: [],
      legal_actions: [],
    };

    startKnightCard();

    expect(GameState.interactionMode).toBe("none");
    expect(showToastMock).toHaveBeenCalledWith(
      "Development cards are not playable right now",
      "warning",
    );
  });

  it("starts road-building card mode when development cards are legal", () => {
    GameState.privateState = {
      player_id: 1,
      resources: {},
      dev_cards: [],
      legal_actions: ["play_development_card"],
    };
    GameState.pendingRoadBuildingEdgeIds = [7];

    startRoadBuildingCard();

    expect(GameState.interactionMode).toBe("play_road_building");
    expect(GameState.pendingRoadBuildingEdgeIds).toEqual([]);
    expect(showToastMock).toHaveBeenCalledWith("Choose two road edges", "info");
  });

  it("sends simple API commands for dice, buying development cards and ending turn", async () => {
    apiCommandMock.mockResolvedValue({
      accepted: true,
      events: [{ type: "development_card_bought", card_type: "KNIGHT" }],
    });
    GameState.interactionMode = "place_road";

    await doRollDice();
    await doBuyDevCard();
    await doEndTurn();

    expect(apiCommandMock).toHaveBeenNthCalledWith(1, "roll_dice");
    expect(apiCommandMock).toHaveBeenNthCalledWith(2, "buy_development_card");
    expect(apiCommandMock).toHaveBeenNthCalledWith(3, "end_turn");
    expect(GameState.interactionMode).toBe("none");
    expect(showToastMock).toHaveBeenCalledWith("Bought: KNIGHT", "success");
  });

  it("opens bank trade only when the action is legal", () => {
    GameState.privateState = {
      player_id: 1,
      resources: {},
      dev_cards: [],
      legal_actions: [],
    };

    doBankTrade();

    expect(openTradeDialogMock).not.toHaveBeenCalled();
    expect(showToastMock).toHaveBeenCalledWith(
      "Bank trade not available right now",
      "warning",
    );

    GameState.privateState.legal_actions = ["trade_bank"];
    doBankTrade();

    expect(openTradeDialogMock).toHaveBeenCalledWith("bank");
  });
});

function resetGameState(): void {
  GameState.interactionMode = "none";
  GameState.pendingRoadBuildingEdgeIds = [];
  GameState.privateState = null;
}
