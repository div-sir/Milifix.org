import { describe, expect, it } from 'vitest';
import {
  bboxAround,
  buildNetworkGraph,
  nearestNodeId,
  dijkstra,
  paddingKmFor,
} from '../scripts/fetch-path-geometry.mjs';

describe('paddingKmFor', () => {
  it('clamps to the minimum padding for very short hops', () => {
    expect(paddingKmFor(0.05)).toBe(0.4);
  });

  it('clamps to the maximum padding for very long hops', () => {
    expect(paddingKmFor(50)).toBe(6);
  });

  it('scales with distance in between the bounds', () => {
    expect(paddingKmFor(2)).toBeCloseTo(1.2, 5);
  });
});

describe('bboxAround', () => {
  it('produces a box that encloses both points plus padding', () => {
    const from = [139.7671, 35.6812]; // 東京站 [lng, lat]
    const to = [139.6238, 35.9064]; // 大宮站
    const bbox = bboxAround(from, to, 1);

    expect(bbox.south).toBeLessThan(Math.min(from[1], to[1]));
    expect(bbox.north).toBeGreaterThan(Math.max(from[1], to[1]));
    expect(bbox.west).toBeLessThan(Math.min(from[0], to[0]));
    expect(bbox.east).toBeGreaterThan(Math.max(from[0], to[0]));
  });

  it('keeps south<north and west<east regardless of point order', () => {
    const bbox = bboxAround([139.9, 35.5], [139.6, 35.9], 0.5);
    expect(bbox.south).toBeLessThan(bbox.north);
    expect(bbox.west).toBeLessThan(bbox.east);
  });
});

describe('buildNetworkGraph', () => {
  // 三個節點的簡單折線：n1 - n2 - n3，模擬 Overpass out geom 回傳的單一 way。
  const elements = [
    {
      type: 'way',
      id: 1,
      nodes: [10, 20, 30],
      geometry: [
        { lat: 35.0, lon: 139.0 },
        { lat: 35.0, lon: 139.001 },
        { lat: 35.0, lon: 139.002 },
      ],
    },
  ];

  it('records coordinates for every node on the way', () => {
    const { nodeCoord } = buildNetworkGraph(elements);
    expect(nodeCoord.size).toBe(3);
    expect(nodeCoord.get(20)).toEqual([139.001, 35.0]);
  });

  it('builds a bidirectional adjacency list between consecutive nodes', () => {
    const { adjacency } = buildNetworkGraph(elements);
    const fromN1 = adjacency.get(10) ?? [];
    const fromN3 = adjacency.get(30) ?? [];
    expect(fromN1.some((e: { to: number }) => e.to === 20)).toBe(true);
    expect(fromN3.some((e: { to: number }) => e.to === 20)).toBe(true);
    // n1 直接沒有到 n3 的邊（中間隔著 n2）
    expect(fromN1.some((e: { to: number }) => e.to === 30)).toBe(false);
  });

  it('skips ways with mismatched nodes/geometry lengths', () => {
    const bad = [{ type: 'way', id: 2, nodes: [1, 2, 3], geometry: [{ lat: 0, lon: 0 }] }];
    const { nodeCoord, adjacency } = buildNetworkGraph(bad);
    expect(nodeCoord.size).toBe(0);
    expect(adjacency.size).toBe(0);
  });
});

describe('nearestNodeId', () => {
  it('finds the closest node to a target coordinate', () => {
    const nodeCoord = new Map([
      [1, [139.0, 35.0]],
      [2, [139.5, 35.5]],
      [3, [139.001, 35.0]],
    ]);
    const result = nearestNodeId(nodeCoord, [139.0009, 35.0]);
    expect(result?.id).toBe(3);
  });

  it('returns null for an empty graph', () => {
    expect(nearestNodeId(new Map(), [139.0, 35.0])).toBeNull();
  });
});

describe('dijkstra', () => {
  it('prefers the shorter of two paths between the same endpoints', () => {
    // a -> b -> d (短，總長 2)；a -> c -> d（長，總長 10）
    const adjacency = new Map([
      ['a', [{ to: 'b', distKm: 1 }, { to: 'c', distKm: 5 }]],
      ['b', [{ to: 'a', distKm: 1 }, { to: 'd', distKm: 1 }]],
      ['c', [{ to: 'a', distKm: 5 }, { to: 'd', distKm: 5 }]],
      ['d', [{ to: 'b', distKm: 1 }, { to: 'c', distKm: 5 }]],
    ]);
    const result = dijkstra(adjacency, 'a', 'd');
    expect(result).toEqual(['a', 'b', 'd']);
  });

  it('returns null when start and end are disconnected', () => {
    const adjacency = new Map([
      ['a', [{ to: 'b', distKm: 1 }]],
      ['b', [{ to: 'a', distKm: 1 }]],
      ['x', [{ to: 'y', distKm: 1 }]],
      ['y', [{ to: 'x', distKm: 1 }]],
    ]);
    expect(dijkstra(adjacency, 'a', 'x')).toBeNull();
  });

  it('returns a single-node path when start equals end', () => {
    const adjacency = new Map([['a', [{ to: 'b', distKm: 1 }]]]);
    expect(dijkstra(adjacency, 'a', 'a')).toEqual(['a']);
  });
});
