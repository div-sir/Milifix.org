// A line-membership graph, not a timetable or an adjacent-track graph.
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
export function findLineRoute(network, fromId, toId) {
  const from = network.byId.get(fromId), to = network.byId.get(toId);
  if (!from || !to) return {status:'unsupported',segments:[]};
  if (fromId === toId) return {status:'same-station',segments:[]};
  if (from.sourceGroupId === to.sourceGroupId) return {status:'same-group',segments:[]};
  const targets = new Set(to.lines.map(l=>l.id)), queue = [], previous = new Map(), seenGroups = new Set();
  for (const line of from.lines) {
    if (!network.lines.has(line.id)) continue;
    queue.push(line.id); previous.set(line.id, null);
  }
  let found;
  for (let i=0; i<queue.length; i++) {
    const lineId = queue[i];
    if (targets.has(lineId)) { found = lineId; break; }
    for (const groupId of network.lines.get(lineId).groups) {
      if (seenGroups.has(groupId)) continue;
      seenGroups.add(groupId);
      for (const nextId of network.groups.get(groupId).keys()) {
        if (previous.has(nextId)) continue;
        previous.set(nextId, {lineId,groupId}); queue.push(nextId);
      }
    }
  }
  if (!found) return {status:'disconnected',segments:[]};
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
