import { beforeEach, describe, expect, it, vi } from "vitest";

import { GameState } from "../../state";
import type { PublicState } from "../../types";
import { handleBoardClick } from "./clickRouter";

const apiCommandMock = vi.hoisted(() => vi.fn());
const showVictimDialogMock = vi.hoisted(() => vi.fn());
const rebuildSceneMock = vi.hoisted(() => vi.fn());
const updateUIMock = vi.hoisted(() => vi.fn());

vi.mock("../../net/api", () => ({
  apiCommand: apiCommandMock,
}));

vi.mock("../../ui/dialogs/victim", () => ({
  showVictimDialog: showVictimDialogMock,
}));

vi.mock("../../ui/updateUI", () => ({
  updateUI: updateUIMock,
}));

vi.mock("../board/rebuild", () => ({
  rebuildScene: rebuildSceneMock,
}));

describe("handleBoardClick", () => {
  beforeEach(() => {
    resetGameState();
    apiCommandMock.mockReset();
    showVictimDialogMock.mockReset();
    rebuildSceneMock.mockReset();
    updateUIMock.mockReset();
  });

  it("places a setup settlement and switches to setup road mode", async () => {
    GameState.publicState = publicState("SETUP_1");
    GameState.interactionMode = "place_setup_settlement";
    apiCommandMock.mockResolvedValue({ accepted: true });

    await handleBoardClick("vertex", 12);

    expect(apiCommandMock).toHaveBeenCalledWith("place_setup_settlement", {
      vertex_id: 12,
    });
    expect(GameState.interactionMode).toBe("place_setup_road");
    expect(rebuildSceneMock).toHaveBeenCalledOnce();
    expect(updateUIMock).toHaveBeenCalledOnce();
  });

  it("builds a road in main phase when clicking an edge", async () => {
    GameState.publicState = publicState("MAIN");
    GameState.interactionMode = "place_road";

    await handleBoardClick("edge", 9);

    expect(apiCommandMock).toHaveBeenCalledWith("build_road", { edge_id: 9 });
  });

  it("opens victim selection when moving robber to a tile with enemy players", async () => {
    GameState.publicState = publicState("MAIN");
    GameState.playerMap = {
      1: player(1, "Alice", 4),
      2: player(2, "Bob", 3),
    };
    GameState.myPlayerId = 1;
    GameState.interactionMode = "move_robber";

    await handleBoardClick("tile", 1);

    expect(GameState.pendingRobberTileId).toBe(1);
    expect(showVictimDialogMock).toHaveBeenCalledWith(
      1,
      [2],
      "move_robber",
      { 2: 3 },
    );
    expect(apiCommandMock).not.toHaveBeenCalled();
  });

  it("plays knight immediately when target tile has no victims", async () => {
    GameState.publicState = publicState("MAIN");
    GameState.myPlayerId = 1;
    GameState.interactionMode = "play_knight";
    apiCommandMock.mockResolvedValue({ accepted: true });

    await handleBoardClick("tile", 2);

    expect(apiCommandMock).toHaveBeenCalledWith("play_development_card", {
      card_type: "knight",
      args: { tile_id: 2 },
    });
    expect(GameState.interactionMode).toBe("none");
  });

  it("collects two road-building edges before sending the development card command", async () => {
    GameState.publicState = publicState("MAIN");
    GameState.interactionMode = "play_road_building";
    apiCommandMock.mockResolvedValue({ accepted: true });

    await handleBoardClick("edge", 4);

    expect(GameState.pendingRoadBuildingEdgeIds).toEqual([4]);
    expect(apiCommandMock).not.toHaveBeenCalled();
    expect(rebuildSceneMock).toHaveBeenCalledOnce();
    expect(updateUIMock).toHaveBeenCalledOnce();

    await handleBoardClick("edge", 5);

    expect(apiCommandMock).toHaveBeenCalledWith("play_development_card", {
      card_type: "road_building",
      args: { edge_ids: [4, 5] },
    });
    expect(GameState.interactionMode).toBe("none");
    expect(GameState.pendingRoadBuildingEdgeIds).toEqual([]);
  });
});

function publicState(phase: PublicState["phase"]): PublicState {
  return {
    phase,
    turn: {
      number: 1,
      current_player_id: 1,
      turn_phase: "BUILD",
      last_roll: null,
    },
    board: {
      robber_tile_id: 0,
      tiles: [
        tile(0, [0, 1, 2, 3, 4, 5]),
        tile(1, [10, 11, 12, 13, 14, 15]),
        tile(2, [20, 21, 22, 23, 24, 25]),
      ],
      vertices: [
        vertex(10, 1),
        vertex(11, 2),
        vertex(20, null),
      ],
      edges: [],
      ports: [],
    },
    players: [player(1, "Alice", 4), player(2, "Bob", 3)],
  };
}

function tile(id: number, vertexIds: number[]) {
  return {
    id,
    resource: "BRICK" as const,
    number_token: 8,
    vertex_ids: vertexIds,
    edge_ids: [],
    has_robber: id === 0,
  };
}

function vertex(id: number, ownerId: number | null) {
  return {
    id,
    adjacent_vertex_ids: [],
    port_id: null,
    building:
      ownerId === null
        ? null
        : {
            type: "settlement" as const,
            owner_id: ownerId,
          },
  };
}

function player(id: number, name: string, resourceCount: number) {
  return {
    id,
    name,
    color: id === 1 ? ("red" as const) : ("blue" as const),
    is_active: true,
    is_host: id === 1,
    resource_count: resourceCount,
    dev_card_count: 0,
    roads: 0,
    settlements: 0,
    cities: 0,
    victory_points: 0,
    played_knights: 0,
    has_longest_road: false,
    has_largest_army: false,
  };
}

function resetGameState(): void {
  GameState.publicState = null;
  GameState.playerMap = {};
  GameState.myPlayerId = null;
  GameState.interactionMode = "none";
  GameState.pendingRobberTileId = null;
  GameState.pendingRoadBuildingEdgeIds = [];
}
