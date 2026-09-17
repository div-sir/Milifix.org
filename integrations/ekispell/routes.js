// A line-membership graph, not a timetable or an adjacent-track graph.
// StationAPI bf6f92d08c6346253713a754944085c526ec6645, 2!lines.csv:
// active rows with line_type=1. Do not infer train category from line names.
const shinkansen = new Set(['1002','1003','1004','1005','1006','1007','1008','1009','1010','1011','1012'].map(id=>`stationapi:${id}`));
export function normalizeRouteOptions(value = {}) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Invalid route conditions');
  const result = {maxChanges:null,avoidShinkansen:false,sameOperatorOnly:false,excludedOperators:[],excludedLines:[]};
  for (const key of ['avoidShinkansen','sameOperatorOnly']) {
    if (value[key] !== undefined && typeof value[key] !== 'boolean') throw new Error('Invalid route condition');
    result[key]=value[key] ?? false;
  }
  if (value.maxChanges != null) {
    if (!Number.isInteger(value.maxChanges) || value.maxChanges<0 || value.maxChanges>100) throw new Error('Invalid line-change limit');
    result.maxChanges=value.maxChanges;
  }
  for (const key of ['excludedOperators','excludedLines']) {
    if (value[key] !== undefined && (!Array.isArray(value[key]) || value[key].length>1000 || value[key].some(v=>typeof v!=='string' || !v || v.length>300))) throw new Error('Invalid route exclusion');
    result[key]=[...new Set(value[key] || [])];
  }
  return result;
}
export function buildLineNetwork(stations) {
  const byId = new Map(), groups = new Map(), lines = new Map();
  for (const station of stations) {
    if (!station.id.startsWith('stationapi:') || !station.sourceGroupId) continue;
    byId.set(station.id, station);
    const groupId = station.sourceGroupId;
    if (!groups.has(groupId)) groups.set(groupId, new Map());
    for (const line of station.lines || []) {
      if (!line.id.startsWith('stationapi:')) continue;
      if (!lines.has(line.id)) lines.set(line.id, {name:line.name,operator:station.operator,groups:new Set()});
      lines.get(line.id).groups.add(groupId);
      groups.get(groupId).set(line.id, station);
    }
  }
  return {byId, groups, lines};
}
export function findLineRoute(network, fromId, toId, conditions = {}) {
  const options=normalizeRouteOptions(conditions);
  const excludedOperators=new Set(options.excludedOperators), excludedLines=new Set(options.excludedLines);
  const allowed=id=>network.lines.has(id) && !excludedLines.has(id) && !excludedOperators.has(network.lines.get(id).operator) && !(options.avoidShinkansen && shinkansen.has(id));
  const restricted=options.maxChanges!==null || options.avoidShinkansen || options.sameOperatorOnly || excludedOperators.size>0 || excludedLines.size>0;
  const from = network.byId.get(fromId), to = network.byId.get(toId);
  if (!from || !to) return {status:'unsupported',segments:[]};
  if (fromId === toId) return {status:'same-station',segments:[]};
  if (!from.lines.some(l=>allowed(l.id)) || !to.lines.some(l=>allowed(l.id))) return {status:'excluded-endpoint',segments:[]};
  if (options.sameOperatorOnly && from.operator!==to.operator) return {status:'restricted',segments:[]};
  if (from.sourceGroupId === to.sourceGroupId) return {status:'same-group',segments:[]};
  const targets = new Set(to.lines.map(l=>l.id)), queue = [], previous = new Map(), seenGroups = new Set(), depth = new Map();
  for (const line of from.lines) {
    if (!allowed(line.id)) continue;
    queue.push(line.id); previous.set(line.id, null); depth.set(line.id,0);
  }
  let found;
  for (let i=0; i<queue.length; i++) {
    const lineId = queue[i];
    if (targets.has(lineId)) { found = lineId; break; }
    if (options.maxChanges!==null && depth.get(lineId)>=options.maxChanges) continue;
    for (const groupId of network.lines.get(lineId).groups) {
      const groupKey=`${groupId}:${options.sameOperatorOnly ? network.lines.get(lineId).operator : '*'}`;
      if (seenGroups.has(groupKey)) continue;
      seenGroups.add(groupKey);
      for (const nextId of network.groups.get(groupId).keys()) {
        if (previous.has(nextId) || !allowed(nextId)) continue;
        if (options.sameOperatorOnly && network.lines.get(nextId).operator!==network.lines.get(lineId).operator) continue;
        previous.set(nextId, {lineId,groupId}); depth.set(nextId,depth.get(lineId)+1); queue.push(nextId);
      }
    }
  }
  if (!found) return {status:restricted ? 'restricted' : 'disconnected',segments:[]};
  const chain = [];
  for (let id=found; id; id=previous.get(id)?.lineId) chain.push({id,via:previous.get(id)?.groupId});
  chain.reverse();
  const segments = chain.map((step,i)=>({
    lineId:step.id, line:network.lines.get(step.id).name, operator:network.lines.get(step.id).operator,
    from:i===0 ? from : network.groups.get(step.via).get(step.id),
    to:i===chain.length-1 ? to : network.groups.get(chain[i+1].via).get(step.id)
  }));
  return {status:'found',changes:segments.length-1,segments};
}
export function transitUrl(from, to, points) {
  const location = station => {
    const p = points?.[station.id.replace(/^stationapi:/,'')];
    return Array.isArray(p) && p.length===2 && p.every(Number.isFinite) && p[0]>=20 && p[0]<=46 && p[1]>=122 && p[1]<=154 ? p.join(',') : `${station.name}駅 ${station.operator} 日本`;
  };
  const params = new URLSearchParams({api:'1',origin:location(from),destination:location(to),travelmode:'transit'});
  return `https://www.google.com/maps/dir/?${params}`;
}
