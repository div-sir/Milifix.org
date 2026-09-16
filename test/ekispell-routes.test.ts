import { expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { buildLineNetwork, findLineRoute, transitUrl } from '../public/ekispell/routes.js';
const station=(id:string,group:string,lines:string[])=>({id:`stationapi:${id}`,name:id,operator:'operator',sourceGroupId:group,lines:lines.map(id=>({id:`stationapi:${id}`,name:id}))});
it('minimizes line changes and reconstructs interchange stations across operators',()=>{
 const a=station('a','a',['1']), b=station('b','b',['3']);
 const n=buildLineNetwork([a,b,station('x1','x',['1']),station('x2','x',['2']),station('y','y',['2','3']),station('z','z',['1','3'])]);
 const result=findLineRoute(n,a.id,b.id);
 expect(result.status).toBe('found'); expect(result.changes).toBe(1);
 expect(result.segments.map(s=>s.line)).toEqual(['1','3']);
 expect(result.segments[0].to.name).toBe('z');
 expect(result.segments[1].from.name).toBe('z');
 const via=buildLineNetwork([a,b,station('x1','x',['1']),station('x2','x',['2']),station('y','y',['2','3'])]);
 const r=findLineRoute(via,a.id,b.id); expect(r.changes).toBe(2);
 expect(r.segments[0].to.name).toBe('x1'); expect(r.segments[1].from.name).toBe('x2');
});
it('handles shared lines, repeated stations, same-group transfers, cycles and disconnected stations',()=>{
 const a=station('a','a',['1','2']), b=station('b','b',['2']), c=station('c','c',['3']), x=station('x','a',['4']);
 const n=buildLineNetwork([a,b,c,x]);
 expect(findLineRoute(n,a.id,b.id).changes).toBe(0);
 expect(findLineRoute(n,a.id,a.id).status).toBe('same-station');
 expect(findLineRoute(n,a.id,x.id).status).toBe('same-group');
 expect(findLineRoute(n,a.id,c.id).status).toBe('disconnected');
 expect(findLineRoute(n,'sample:x',b.id).status).toBe('unsupported');
});
it('uses exact groups rather than names and encodes transit URLs',()=>{
 const a=station('a','a',['1']),b={...station('b','b',['2']),name:'a'};
 expect(findLineRoute(buildLineNetwork([a,b]),a.id,b.id).status).toBe('disconnected');
 const url=new URL(transitUrl({...a,name:'東京 & 品川'},b));
 expect(url.searchParams.get('travelmode')).toBe('transit');
 expect(url.searchParams.get('origin')).toBe('東京 & 品川駅 operator 日本');
});
it('routes real Tokyo to Yokohama via their shared line and keeps all source files synchronized',()=>{
 const root='public/ekispell/data/stationapi/';
 const lines=JSON.parse(readFileSync(root+'lines.json','utf8'));
 const stations=readdirSync(root).filter(f=>/^pref-/.test(f)).flatMap(f=>JSON.parse(readFileSync(root+f,'utf8'))).map(([id,name,company,group,members]:[string,string,string,string,string[][]])=>({id:`stationapi:${id}`,name,operator:company,sourceGroupId:group,lines:[...new Set(members.map(m=>m[1]))].map(id=>({id:`stationapi:${id}`,name:lines[id][0]}))}));
 const from=stations.find(s=>s.name==='東京'&&s.operator==='2')!;
 const to=stations.find(s=>s.name==='横浜'&&s.operator==='2')!;
 const result=findLineRoute(buildLineNetwork(stations),from.id,to.id);
 expect(result.status).toBe('found'); expect(result.changes).toBe(0);
 for(const name of ['routes.js','route-panel.js']) expect(readFileSync('public/ekispell/'+name)).toEqual(readFileSync('integrations/ekispell/'+name));
});
