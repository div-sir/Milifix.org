import { describe, expect, it } from 'vitest';
import { MeridielData } from '../public/meridiel/app/model.js';

type FlightRecord = {
  id: string | number;
  updatedAt?: number;
  deletedAt?: number;
  [key: string]: unknown;
};

type MeridielDataApi = {
  activeRecords(records: FlightRecord[]): FlightRecord[];
  markDeleted(records: FlightRecord[], id: FlightRecord['id'], at?: number): FlightRecord[];
  mergeByFlightId(local: FlightRecord[], cloud: FlightRecord[]): FlightRecord[];
  readJson(storage: StorageLike, key: string, fallback: unknown): unknown;
  writeJson(storage: StorageLike, key: string, value: unknown): { ok: boolean; error?: unknown };
};

type StorageLike = Pick<Storage, 'getItem' | 'setItem'>;

const data = MeridielData as MeridielDataApi;

describe('Meridiel flight conflict resolution', () => {
  it('keeps a newer deletion instead of resurrecting a stale cloud record', () => {
    const local = [{ id: 'flight-1', updatedAt: 200, deletedAt: 200 }];
    const cloud = [{ id: 'flight-1', updatedAt: 100, route: 'TPE-NRT' }];

    const merged = data.mergeByFlightId(local, cloud);

    expect(merged).toEqual(local);
    expect(data.activeRecords(merged)).toEqual([]);
  });

  it('lets a genuinely newer edit restore a previously deleted record', () => {
    const local = [{ id: 'flight-1', updatedAt: 200, deletedAt: 200 }];
    const cloud = [{ id: 'flight-1', updatedAt: 300, route: 'TPE-KIX' }];

    expect(data.mergeByFlightId(local, cloud)).toEqual(cloud);
  });

  it('creates a tombstone for a bundled flight that is not in editable records', () => {
    expect(data.markDeleted([], 42, 500)).toEqual([{ id: 42, deletedAt: 500, updatedAt: 500 }]);
  });
});

describe('Meridiel safe local persistence', () => {
  it('reports quota failures instead of crashing the app', () => {
    const quotaError = new DOMException('quota exceeded', 'QuotaExceededError');
    const storage: StorageLike = {
      getItem: () => null,
      setItem: () => { throw quotaError; },
    };

    const result = data.writeJson(storage, 'fa-flights', [{ id: 1 }]);

    expect(result.ok).toBe(false);
    expect(result.error).toBe(quotaError);
  });

  it('falls back when persisted JSON is corrupt', () => {
    const storage: StorageLike = {
      getItem: () => '{broken',
      setItem: () => undefined,
    };

    expect(data.readJson(storage, 'fa-flights', [])).toEqual([]);
  });
});
