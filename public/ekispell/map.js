let map, layer, points, current = [], ready;
const $ = id => document.getElementById(id);
export function coordinateFor(station, data) {
  if (!station?.id?.startsWith('stationapi:')) return null;
  const p = data[station.id.slice('stationapi:'.length)];
  return Array.isArray(p) && p.length === 2 && p.every(Number.isFinite) && p[0] >= 20 && p[0] <= 46 && p[1] >= 122 && p[1] <= 154 ? p : null;
}
function script() {
  if (window.L) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const tag = document.createElement('script'); tag.src = './vendor/leaflet.js';
    tag.onload = resolve; tag.onerror = () => { tag.remove(); reject(new Error('地圖程式無法載入')); };
    document.head.append(tag);
  });
}
async function initialize() {
  const [response] = await Promise.all([fetch('./coordinates.json'), script()]);
  if (!response.ok) throw new Error('座標資料無法載入');
  const data = await response.json();
  if (data.revision !== 'bf6f92d08c6346253713a754944085c526ec6645') throw new Error('座標版本不符');
  points = data.points;
  map = window.L.map('station-map', {scrollWheelZoom:false}).setView([36,138],5);
  window.L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom:19, attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).on('tileerror', () => { $('map-tiles').textContent = '底圖暫時無法載入；車站位置與清單仍可查看。'; }).addTo(map);
  layer = window.L.layerGroup().addTo(map);
  paint();
}
function paint() {
  if (!map) return;
  layer.clearLayers(); $('map-stations').replaceChildren();
  const bounds = [], groups = new Map(); let missing = 0;
  current.forEach(({station, number}) => {
    const point = coordinateFor(station, points);
    if (!point) { missing++; return; }
    // Combine repeated stations and colocated stops, rather than hiding overlapping markers.
    const key = point.join(',');
    if (!groups.has(key)) groups.set(key, {point, entries:[]});
    groups.get(key).entries.push({station, number});
  });
  for (const {point, entries} of groups.values()) {
    bounds.push(point);
    const popup = document.createElement('div');
    for (const {station, number} of entries) {
      const p = document.createElement('p');
      p.textContent = `${number}. ${station.name} · ${station.operator} · ${station.lines?.map(l=>l.name).join('／') || ''}`;
      popup.append(p);
    }
    const numbers = entries.map(e=>e.number).join('・');
    const marker = window.L.marker(point, {icon:window.L.divIcon({className:'station-pin',html:String(entries[0].number),iconSize:[30,30]}), title:popup.textContent}).addTo(layer).bindPopup(popup);
    const li = document.createElement('li'), button = document.createElement('button');
    button.type = 'button'; button.textContent = `${numbers}. ${entries.map(e=>e.station.name).join('／')}`;
    button.addEventListener('click', () => { map.setView(point,14); marker.openPopup(); });
    li.append(button); $('map-stations').append(li);
  }
  if (bounds.length) map.fitBounds(bounds, {padding:[30,30],maxZoom:14});
  $('map-status').textContent = `${current.length-missing} 個選站有座標${missing ? `；${missing} 個缺少可靠座標` : ''}。數字為排字順序，不是乘車路線。`;
}
export function updateStationMap(selected) { current = selected; paint(); }
export async function openStationMap() {
  $('map-panel').hidden = false; $('show-map').disabled = true;
  try {
    if (!ready) ready = initialize();
    await ready; map.invalidateSize(); paint(); $('show-map').textContent = '重新聚焦全部選站';
  } catch (error) { ready = null; $('map-status').textContent = `${error.message}，請按按鈕重試。`; }
  finally { $('show-map').disabled = false; }
}
