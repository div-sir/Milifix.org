import { getRouteOptions, initializeRouteOptions } from './route-options.js';
import { buildLineNetwork, findLineRoute, transitUrl } from './routes.js';
import { updateRouteMap } from './map.js';
let catalog, network, rows = [], active = false, coordinates;
const $ = id => document.getElementById(id);
const node = (tag, text) => { const n = document.createElement(tag); n.textContent=text; return n; };
export function updateRoutePlan(stations, nextRows) {
  rows = nextRows;
  if (catalog !== stations) { catalog=stations; network=buildLineNetwork(stations); initializeRouteOptions(network,()=>{ if (active) calculateRoutes(); }); }
  updateRouteMap([]);
  if (active) calculateRoutes();
}
export function calculateRoutes() {
  active=true; $('route-results').replaceChildren();
  if (!coordinates) coordinates=fetch('./coordinates.json').then(r=>{ if (!r.ok) throw new Error('coordinates'); return r.json(); }).then(data=>{ if (data.revision!=='bf6f92d08c6346253713a754944085c526ec6645') throw new Error('revision'); return data.points; }).catch(()=>{ coordinates=null; return null; });
  updateRouteMap([]);
  if (rows.length<2) { $('route-status').textContent='請先選擇至少兩個車站。'; return; }
  if (rows.some(row=>!row)) { $('route-status').textContent='仍有文字未匹配車站。請完成選站後再計算，避免跳過中間站。'; return; }
  const mapSegments = []; let found=0;
  for (let i=1;i<rows.length;i++) {
    const from=rows[i-1], to=rows[i], result=findLineRoute(network,from.id,to.id,getRouteOptions());
    const li=node('li',''); li.append(node('h3',`${i}. ${from.name} → ${to.name}`));
    if (result.status==='found') {
      found++;
      li.append(node('p',`路線切換 ${result.changes} 次（資料圖內最少，非最快路線）`));
      const list=node('ol','');
      for (const segment of result.segments) {
        list.append(node('li',`${segment.from.name} → ${segment.to.name}｜${segment.operator}・${segment.line}`));
        mapSegments.push(segment);
      }
      li.append(list);
      li.append(node('p','轉乘點依同站群判定，可能需要出站步行；同一路線也可能需要換車。'));
    } else {
      const messages = {
        'same-station':'相同車站，不需移動；若要產生另一筆 IC 履歷，仍須另規劃進出站。',
        'same-group':'位於同站群，可能需步行或出站轉乘，請確認實際動線。',
        'unsupported':'此站缺少可用的路線資料，無法計算。',
        'disconnected':'現有資料找不到連接，可能需要步行、巴士或其他未收錄路線。',
        'excluded-endpoint':'起點或終點的所有可用路線都被排除，請放寬條件或更換選站。',
        'restricted':'此條件下找不到路線候選。可放寬條件，或使用外部查詢確認其他走法。'
      };
      li.append(node('p',messages[result.status]));
    }
    const link=node('a','在 Google Maps 查詢此段班次');
    link.href=transitUrl(from,to); link.target='_blank'; link.rel='noopener noreferrer';
    link.title='請確認起訖站；Google Maps 不會套用本頁的路線條件';
    li.append(link); $('route-results').append(li);
    coordinates.then(points=>{ if (points && link.isConnected) link.href=transitUrl(from,to,points); });
  }
  updateRouteMap(mapSegments);
  $('route-status').textContent=`按紀錄建立順序，共 ${rows.length-1} 段；${found} 段找到路線候選。各段獨立計算，非全程最佳化；其餘請查看各段提示。`;
}
