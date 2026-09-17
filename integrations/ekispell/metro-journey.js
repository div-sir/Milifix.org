import { planJourney } from './dist/index.js';
import { normalizeRouteOptions } from './routes.js';
export const METRO_REVISION='bf6f92d08c6346253713a754944085c526ec6645';
export function buildMetroTransactions(stations, topology, conditions={}, card='PASMO') {
  if (topology?.schemaVersion!==1 || topology.revision!==METRO_REVISION || !Array.isArray(topology.lines) || topology.lines.length!==9) throw new Error('Metro 路網版本不符');
  const options=normalizeRouteOptions(conditions), byId=new Map(stations.map(s=>[s.id,s]));
  const stationIds=new Set(), edges=[], paths=new Map(), coverage=new Map();
  for (const line of topology.lines) {
    const listed=new Set();
    for (const stop of line.stops) {
      const station=byId.get(stop.id);
      if (!station || station.name!==stop.name || station.operator!==topology.operator || !station.lines.some(l=>l.id===line.id)) throw new Error('目前站名資料不符合 Metro 路網，請先載入真實資料');
      listed.add(stop.id); coverage.set(stop.id,station);
    }
    if (options.excludedLines.includes(line.id) || options.excludedOperators.includes(topology.operator)) continue;
    const allowed=id=>byId.get(id)?.ic?.status==='supported' && byId.get(id).ic.cards.includes(card);
    const adjacent=new Map([...listed].filter(allowed).map(id=>[id,new Set()]));
    for (const chain of line.chains) {
      for (let i=0;i<chain.length;i++) {
        if (!listed.has(chain[i])) throw new Error('Metro 路網含未知站點');
        if (i>0 && adjacent.has(chain[i-1]) && adjacent.has(chain[i])) {
          adjacent.get(chain[i-1]).add(chain[i]); adjacent.get(chain[i]).add(chain[i-1]);
        }
      }
    }
    // Each edge is a proposed separate fare transaction on a single Metro line.
    // Same-name/group walks and free transfers are intentionally not synthesized.
    for (const start of adjacent.keys()) {
      stationIds.add(start);
      const previous=new Map([[start,null]]), queue=[start];
      for (let i=0;i<queue.length;i++) for (const next of adjacent.get(queue[i])) {
        if (previous.has(next)) continue;
        previous.set(next,queue[i]); queue.push(next);
      }
      for (const end of queue.slice(1)) {
        const id=`${line.id}|${start}|${end}`, path=[];
        for (let at=end;at!==null;at=previous.get(at)) path.push(at);
        path.reverse();
        edges.push({id,from:start,to:end,kind:'ride'});
        paths.set(id,{lineId:line.id,line:byId.get(start).lines.find(l=>l.id===line.id).name,stations:path});
      }
    }
  }
  return {network:{id:'tokyo-metro-single-line-transactions',version:topology.checkedAt,source:'https://www.tokyometro.jp/station/',license:'StationAPI identifiers: MIT; official station-order facts: see metro-evidence.json',verification:'unverified',currency:'JPY',stations:[...stationIds],edges},paths,coverage};
}
export function planMetroJourney(sequence, profile, model, options) {
  if (!sequence.length || sequence.some(row=>!row.selected)) throw new Error('請先完成每個字的車站選擇');
  const allowed=new Set(model.network.stations);
  if (!allowed.has(options.start) || !allowed.has(options.end)) throw new Error('起點或終點不在目前條件及卡種可用的 Metro 範圍');
  if (sequence.some(row=>!allowed.has(row.selected.stationId))) throw new Error('部分選站不在目前條件及卡種可用的 Metro 範圍；請改選東京 Metro 車站或放寬排除條件');
  return planJourney(sequence,profile,model.network,{...options,maxExpansions:10000,maxStates:50000});
}
