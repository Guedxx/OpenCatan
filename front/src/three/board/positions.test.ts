import { describe, expect, it } from "vitest";

import { HEX_GAP, HEX_SIZE } from "../../config";
import type { Edge, Tile } from "../../types";
import {
  computeEdgePositions,
  computeTilePositions,
  computeVertexPositions,
  getHexPixelPos,
} from "./positions";

describe("board position helpers", () => {
  it("maps axial coordinates to pixel positions", () => {
    expect(getHexPixelPos(0, 0)).toEqual({ x: 0, z: 0 });

    const pos = getHexPixelPos(1, -2);

    expect(pos.x).toBeCloseTo(HEX_SIZE * HEX_GAP * Math.sqrt(3) * 0);
    expect(pos.z).toBeCloseTo(-3 * HEX_SIZE * HEX_GAP);
  });

  it("computes tile positions only for known tile ids", () => {
    const tiles = [
      tile(0, [0, 1, 2, 3, 4, 5]),
      tile(999, [6, 7, 8, 9, 10, 11]),
    ];

    const positions = computeTilePositions(tiles);

    expect(positions[0]).toEqual(getHexPixelPos(0, -2));
    expect(positions[999]).toBeUndefined();
  });

  it("averages shared vertex samples from adjacent tiles", () => {
    const tiles = [
      tile(0, [0, 1, 2, 3, 4, 5]),
      tile(1, [6, 7, 8, 2, 9, 10]),
    ];
    const tilePositions = computeTilePositions(tiles);

    const positions = computeVertexPositions(tiles, tilePositions);
    const tile0Vertex2 = {
      x: tilePositions[0].x + HEX_SIZE * Math.cos(Math.PI / 2),
      z: tilePositions[0].z + HEX_SIZE * Math.sin(Math.PI / 2),
    };
    const tile1Vertex3 = {
      x: tilePositions[1].x + HEX_SIZE * Math.cos((5 * Math.PI) / 6),
      z: tilePositions[1].z + HEX_SIZE * Math.sin((5 * Math.PI) / 6),
    };

    expect(positions[0]).toBeDefined();
    expect(positions[2]).toBeDefined();
    expect(positions[2].x).toBeCloseTo((tile0Vertex2.x + tile1Vertex3.x) / 2);
    expect(positions[2].z).toBeCloseTo((tile0Vertex2.z + tile1Vertex3.z) / 2);
  });

  it("computes edge midpoint and angle from vertex positions", () => {
    const edges: Edge[] = [
      { id: 7, v1: 1, v2: 2, adjacent_tile_ids: [], road: null },
    ];

    const positions = computeEdgePositions(edges, {
      1: { x: 0, z: 0 },
      2: { x: 10, z: 10 },
    });

    expect(positions[7]).toEqual({
      x: 5,
      z: 5,
      angle: Math.PI / 4,
    });
  });
});

function tile(id: number, vertexIds: number[]): Tile {
  return {
    id,
    resource: "BRICK",
    number_token: 8,
    vertex_ids: vertexIds,
    edge_ids: [0, 1, 2, 3, 4, 5],
    has_robber: false,
  };
}
