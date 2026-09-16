import { expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { coordinateFor } from '../public/ekispell/map.js';
const data = JSON.parse(readFileSync('public/ekispell/coordinates.json','utf8'));
it('maps only exact station IDs to valid Japanese coordinates', () => {
  expect(Object.keys(data.points)).toHaveLength(9485);
  for (const [id, point] of Object.entries(data.points)) expect(coordinateFor({id:`stationapi:${id}`},data.points)).toEqual(point);
  expect(coordinateFor({id:'sample:tokyo'}, data.points)).toBeNull();
  expect(coordinateFor({id:'stationapi:missing'}, data.points)).toBeNull();
  expect(coordinateFor({id:'stationapi:x'}, {x:[NaN,139]})).toBeNull();
  expect(coordinateFor({id:'stationapi:x'}, {x:[0,0]})).toBeNull();
});
it('keeps map sources and hosted files identical', () => {
  for (const name of ['map.js','coordinates.json','vendor/leaflet.js','vendor/leaflet.css','vendor/LICENSE']) expect(readFileSync(`public/ekispell/${name}`)).toEqual(readFileSync(`integrations/ekispell/${name}`));
});
