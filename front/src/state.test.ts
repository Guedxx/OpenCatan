import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  GameState,
  getLegalActions,
  hasLegalAction,
  isMyTurn,
  isSetupPhase,
  registerStateCallbacks,
  updateState,
} from "./state";
import type { PlayerPublic, PublicState, StateEnvelope } from "./types";

describe("GameState helpers", () => {
  beforeEach(() => {
    resetGameState();
    registerStateCallbacks({
      rebuildScene: () => {},
      updateUI: () => {},
      checkPendingModals: () => {},
    });
  });

  it("updates state, player map, current player and resets transient interaction state", () => {
    const rebuildScene = vi.fn();
    const updateUI = vi.fn();
    const checkPendingModals = vi.fn();
    registerStateCallbacks({ rebuildScene, updateUI, checkPendingModals });
    GameState.interactionMode = "place_road";
    GameState.pendingRoadBuildingEdgeIds = [3, 4];

    updateState(envelope());

    expect(GameState.version).toBe(12);
    expect(GameState.myPlayerId).toBe(1);
    expect(GameState.playerMap[1].name).toBe("Alice");
    expect(GameState.interactionMode).toBe("none");
    expect(GameState.pendingRoadBuildingEdgeIds).toEqual([]);
    expect(rebuildScene).toHaveBeenCalledOnce();
    expect(updateUI).toHaveBeenCalledOnce();
    expect(checkPendingModals).toHaveBeenCalledOnce();
  });

  it("reports setup phase, current turn and legal actions from the latest state", () => {
    updateState(envelope());

    expect(isSetupPhase()).toBe(true);
    expect(isMyTurn()).toBe(true);
    expect(getLegalActions()).toEqual(["place_setup_settlement", "end_turn"]);
    expect(hasLegalAction("place_setup_settlement")).toBe(true);
    expect(hasLegalAction("build_city")).toBe(false);
  });

  it("handles public-only state without private legal actions", () => {
    const state = envelope();
    state.private_state = null;
    state.public_state.phase = "MAIN";
    state.public_state.turn = {
      number: 3,
      current_player_id: 2,
      turn_phase: "ROLL",
      last_roll: null,
    };

    updateState(state);

    expect(GameState.myPlayerId).toBeNull();
    expect(isSetupPhase()).toBe(false);
    expect(isMyTurn()).toBe(false);
    expect(getLegalActions()).toEqual([]);
  });
});

function envelope(): StateEnvelope {
  return {
    game_id: "game-1",
    version: 12,
    public_state: publicState(),
    private_state: {
      player_id: 1,
      resources: { BRICK: 1 },
      dev_cards: [],
      legal_actions: ["place_setup_settlement", "end_turn"],
    },
  };
}

function publicState(): PublicState {
  return {
    phase: "SETUP_1",
    turn: {
      number: 1,
      current_player_id: 1,
      turn_phase: "BUILD",
      last_roll: null,
    },
    board: {
      robber_tile_id: null,
      tiles: [],
      vertices: [],
      edges: [],
      ports: [],
    },
    players: [player(1, "Alice"), player(2, "Bob")],
  };
}

function player(id: number, name: string): PlayerPublic {
  return {
    id,
    name,
    color: id === 1 ? "red" : "blue",
    is_active: true,
    is_host: id === 1,
    resource_count: 0,
    dev_card_count: 0,
    roads: [],
    settlements: [],
    cities: [],
    victory_points: 0,
    played_knights: 0,
    longest_road_length: 0,
    has_longest_road: false,
    has_largest_army: false,
  };
}

function resetGameState(): void {
  GameState.gameId = null;
  GameState.playerToken = null;
  GameState.myPlayerId = null;
  GameState.version = 0;
  GameState.publicState = null;
  GameState.privateState = null;
  GameState.vertexPositions = {};
  GameState.edgePositions = {};
  GameState.tilePositions = {};
  GameState.tileNumbers = {};
  GameState.playerMap = {};
  GameState.interactionMode = "none";
  GameState.pendingRobberTileId = null;
  GameState.pendingRoadBuildingEdgeIds = [];
  GameState.requestSeq = 0;
}
