import { matchMessage, createDraft } from './dist/index.js';
export const HISTORY_SOURCE='https://www.pasmo.co.jp/about/service/history/';
export const TRANSFER_SOURCE='https://www.tokyometro.jp/ticket/types/pasmo/index.html';
export const RULES_CHECKED='2026-09-18';

// Retention is always chronological. Printer order affects presentation only.
// These checks do not simulate gate settlement or certify printed labels.
export function reviewJourney(result, sequence, profile, model, {card='PASMO', afterRecords=0}={}) {
  if(result.status!=='found')throw new Error('請先計算成功的進出站方案');
  if(!Number.isSafeInteger(afterRecords)||afterRecords<0||afterRecords>100)throw new Error('後續新增履歷請輸入 0–100 的整數');
  if(!Number.isSafeInteger(profile.maxRows)||profile.maxRows<1)throw new Error('格式筆數無效');
  const records=result.records;
  const capacity=card==='PASMO'?Math.min(profile.maxRows,20):profile.maxRows;
  const messagePositions=records.flatMap((r,i)=>r.messageIndex===null?[]:[i]);
  const first=messagePositions[0],last=messagePositions.at(-1);
  const expiredCount=Math.min(records.length,Math.max(0,records.length+afterRecords-capacity));
  const missing=records.slice(0,expiredCount).filter(r=>r.messageIndex!==null).map(r=>r.messageIndex).sort((a,b)=>a-b);
  const extras={before:0,between:0,after:0};
  const rows=records.map((record,i)=>{
    const kind=record.messageIndex===null?(i<first?'before':i>last?'after':'between'):'message';
    if(kind!=='message')extras[kind]++;
    return {record,number:i+1,kind,retained:i>=expiredCount};
  });
  const boundaries=[];
  for(let i=1;i<records.length;i++) {
    const previous=records[i-1],next=records[i];
    const priorPath=model.paths.get(previous.edgeId),nextPath=model.paths.get(next.edgeId);
    if(!priorPath||!nextPath)throw new Error('方案路徑資料不完整，請重新計算');
    const changesLine=priorPath.lineId!==nextPath.lineId;
    const reverses=previous.entry===next.exit;
    if(changesLine||reverses)boundaries.push({after:i,stationId:previous.exit,changesLine,reverses});
  }
  const allowance=first===undefined?0:Math.max(0,capacity-(records.length-first));
  return {capacity,afterRecords,rows,missing,extras,boundaries,allowance,
    remainingAllowance:Math.max(0,allowance-afterRecords),
    complete:messagePositions.length===sequence.length&&missing.length===0,
    contiguous:messagePositions.length===sequence.length&&missing.length===0&&extras.between===0};
}

export function createMetroExample(bundle) {
  if(bundle.id!=='stationapi-japan')throw new Error('請先載入全國真實站名資料，再開啟範例');
  const names=['銀座','京橋','日本橋'];
  const stations=names.map(name=>bundle.stations.find(s=>s.operator==='東京メトロ'&&s.name===name));
  if(stations.some(s=>!s))throw new Error('範例站點不完整，請重新載入資料');
  const options={profileId:'stationapi-name-only',icCard:'PASMO',icSupportedOnly:true,verifiedOnly:false};
  const slots=matchMessage('銀京',bundle.stations,options);
  const selections=Object.fromEntries(slots.map((slot,i)=>[i,slot.candidates.findIndex(c=>c.stationId===stations[i].id)]));
  if(Object.values(selections).some(i=>i<0))throw new Error('範例印字候選不完整');
  return {draft:createDraft('銀京',bundle,options,selections,'entry','oldest-first'),start:stations[0].id,end:stations[2].id};
}
