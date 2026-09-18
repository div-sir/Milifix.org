import { expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { buildStationApiCatalog, matchMessage, buildSequence } from '../public/ekispell/dist/index.js';
import { buildMetroTransactions, planMetroJourney } from '../public/ekispell/metro-journey.js';
const read=(name:string)=>JSON.parse(readFileSync('public/ekispell/'+name,'utf8'));
const manifest=read('data/stationapi/manifest.json');
const bundle=buildStationApiCatalog(manifest,{companies:read('data/stationapi/companies.json'),lines:read('data/stationapi/lines.json'),prefectures:Object.fromEntries(manifest.prefectures.map((p:number)=>[String(p).padStart(2,'0'),read(`data/stationapi/pref-${String(p).padStart(2,'0')}.json`)]))},manifest.licenseText);
const topology=read('metro-topology.json');
const model=buildMetroTransactions(bundle.stations,topology);
const station=(name:string)=>bundle.stations.find(s=>s.name===name&&s.operator==='東京メトロ')!;
const profile={...bundle.profiles.find(p=>p.id==='stationapi-name-only'),order:'oldest-first'};
function sequence(names:string[]){
 const slots=matchMessage(names.map(n=>n[0]).join(''),bundle.stations,{profileId:profile.id});
 return buildSequence(slots,slots.map((s,i)=>s.candidates.findIndex(c=>c.stationId===station(names[i]).id)));
}
it('ships exact official Metro coverage and synchronized maintained assets',()=>{
 expect(topology.lines).toHaveLength(9);expect(model.coverage.size).toBe(144);
 expect(topology.lines.reduce((n:number,l:{chains:string[][]})=>n+l.chains.reduce((a:number,c:string[])=>a+c.length-1,0),0)).toBe(176);
 for(const name of ['metro-journey.js','journey-panel.js','metro-evidence.json','metro-topology.json'])expect(readFileSync('public/ekispell/'+name)).toEqual(readFileSync('integrations/ekispell/'+name));
 expect(model.network.edges.every(e=>e.kind==='ride'&&e.from!==e.to)).toBe(true);
 expect(model.network.verification).toBe('unverified');
});
it('connects the Marunouchi branch through Nakano-sakaue, never table adjacency',()=>{
 const path=model.paths.get(`stationapi:28002|${station('新中野').id}|${station('方南町').id}`)!;
 expect(path.stations.map((id:string)=>model.coverage.get(id).name)).toEqual(['新中野','中野坂上','中野新橋','中野富士見町','方南町']);
});
it('honors line/operator exclusions and supported card evidence',()=>{
 expect(buildMetroTransactions(bundle.stations,topology,{excludedLines:['stationapi:28001']}).network.edges.some(e=>e.id.startsWith('stationapi:28001|'))).toBe(false);
 expect(buildMetroTransactions(bundle.stations,topology,{excludedOperators:['東京メトロ']}).network.edges).toHaveLength(0);
 expect(buildMetroTransactions(bundle.stations,topology,{},'unknown').network.edges).toHaveLength(0);
 expect(()=>buildMetroTransactions(bundle.stations.filter(s=>s.id!==station('銀座').id),topology)).toThrow();
});
it('plans entry and exit transactions, print order, and leaves unknown cost/time unknown',()=>{
 const options={start:station('銀座').id,end:station('日本橋').id,field:'entry'};
 const result=planMetroJourney(sequence(['銀座','京橋']),profile,model,options);
 expect(result.status).toBe('found');expect(result.records).toHaveLength(2);
 expect(result.records.map(r=>model.coverage.get(r.entry).name)).toEqual(['銀座','京橋']);
 expect(result.totalFare).toBeNull();expect(result.totalMinutes).toBeNull();
 const exit=planMetroJourney(sequence(['京橋','日本橋']),profile,model,{...options,field:'exit'});
 expect(exit.records.map(r=>model.coverage.get(r.exit).name)).toEqual(['京橋','日本橋']);
 const reversed=planMetroJourney(sequence(['京橋','銀座']),{...profile,order:'newest-first'},model,options);
 expect(reversed.displayRecords.map(r=>model.coverage.get(r.entry).name)).toEqual(['京橋','銀座']);
});
it('requires an extra record for repeated entry and respects receipt capacity',()=>{
 const seq=sequence(['銀座','銀座']), options={start:station('銀座').id,end:station('京橋').id,field:'entry'};
 expect(planMetroJourney(seq,profile,model,options).status).toBe('infeasible');
 const result=planMetroJourney(seq,profile,model,{...options,allowInterleavedRecords:true});
 expect(result.status).toBe('found');expect(result.records).toHaveLength(3);
 expect(result.records.filter(r=>r.messageIndex===null)).toHaveLength(1);
 expect(planMetroJourney(seq,{...profile,maxRows:2},model,{...options,allowInterleavedRecords:true}).status).toBe('infeasible');
 expect(()=>planMetroJourney(seq,profile,model,{...options,start:'unknown'})).toThrow();
});

import { reviewJourney, createMetroExample } from '../public/ekispell/journey-review.js';
it('provides a reproducible two-transaction example with exact Metro identities',()=>{
 const example=createMetroExample(bundle);
 expect(example.draft.message).toBe('銀京');
 expect(example.start).toBe(station('銀座').id);expect(example.end).toBe(station('日本橋').id);
 expect(()=>createMetroExample({...bundle,id:'custom'})).toThrow();
 expect(readFileSync('public/ekispell/journey-review.js')).toEqual(readFileSync('integrations/ekispell/journey-review.js'));
});
it('retains newest transactions regardless of printed order and counts future history',()=>{
 const seq=sequence(['銀座','京橋']);
 const result=planMetroJourney(seq,profile,model,{start:station('銀座').id,end:station('日本橋').id,field:'entry'});
 const initial=reviewJourney(result,seq,profile,model);
 expect(initial.allowance).toBe(18);expect(initial.contiguous).toBe(true);
 const atLimit=reviewJourney(result,seq,profile,model,{afterRecords:18});
 expect(atLimit.complete).toBe(true);expect(atLimit.remainingAllowance).toBe(0);
 for(const order of ['oldest-first','newest-first']){
  const expired=reviewJourney(result,seq,{...profile,order},model,{afterRecords:19});
  expect(expired.missing).toEqual([0]);expect(expired.rows.map((r:{retained:boolean})=>r.retained)).toEqual([false,true]);
  expect(expired.complete).toBe(false);
 }
 expect(reviewJourney(result,seq,profile,model,{afterRecords:100}).missing).toEqual([0,1]);
});
it('uses PASMO general capacity conservatively without assigning its rule to another card',()=>{
 const seq=sequence(['銀座','京橋']);
 const result=planMetroJourney(seq,profile,model,{start:station('銀座').id,end:station('日本橋').id,field:'entry'});
 expect(reviewJourney(result,seq,{...profile,maxRows:100},model,{card:'PASMO'}).capacity).toBe(20);
 expect(reviewJourney(result,seq,{...profile,maxRows:100},model,{card:'Suica'}).capacity).toBe(100);
 expect(reviewJourney(result,seq,{...profile,maxRows:1},model).missing).toEqual([0]);
 for(const afterRecords of [-1,1.5,101,NaN,Infinity])expect(()=>reviewJourney(result,seq,profile,model,{afterRecords})).toThrow();
});
it('locates middle positioning records and return-trip boundaries without certifying settlement',()=>{
 const seq=sequence(['銀座','銀座']);
 const result=planMetroJourney(seq,profile,model,{start:station('銀座').id,end:station('京橋').id,field:'entry',allowInterleavedRecords:true});
 const review=reviewJourney(result,seq,profile,model);
 expect(review.extras).toEqual({before:0,between:1,after:0});
 expect(review.complete).toBe(true);expect(review.contiguous).toBe(false);
 expect(review.boundaries.some(b=>b.reverses)).toBe(true);
});
it('ignores expendable prefix records when calculating the margin for target letters',()=>{
 const seq=sequence(['銀座']);
 const records=[{entry:'a',exit:'b',edgeId:'a',messageIndex:null},{entry:'b',exit:'c',edgeId:'a',messageIndex:0},{entry:'c',exit:'d',edgeId:'a',messageIndex:null}];
 const review=reviewJourney({status:'found',records},seq,{...profile,maxRows:3},{paths:new Map([['a',{lineId:'same'}]])});
 expect(review.extras).toEqual({before:1,between:0,after:1});expect(review.allowance).toBe(1);
 const expired=reviewJourney({status:'found',records},seq,{...profile,maxRows:3},{paths:new Map([['a',{lineId:'same'}]])},{afterRecords:1});
 expect(expired.missing).toEqual([]);expect(expired.complete).toBe(true);
});
it('identifies the exact station at a modeled line-change boundary',()=>{
 const seq=sequence(['銀座','日本橋']);
 const result=planMetroJourney(seq,profile,model,{start:station('銀座').id,end:station('茅場町').id,field:'entry'});
 expect(result.status).toBe('found');
 const review=reviewJourney(result,seq,profile,model);
 expect(review.boundaries).toEqual([{after:1,stationId:station('日本橋').id,changesLine:true,reverses:false}]);
});
