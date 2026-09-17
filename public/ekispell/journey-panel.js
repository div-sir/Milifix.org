import { buildMetroTransactions, planMetroJourney } from './metro-journey.js';
import { getRouteOptions } from './route-options.js';
import { updateRouteMap, openStationMap } from './map.js';
let context, topology, loading, generation=0, exportText='', resultSegments=[];
const $=id=>document.getElementById(id);
const node=(tag,text)=>{const n=document.createElement(tag);n.textContent=text;return n;};
export function invalidateJourney() {
  generation++; exportText=''; resultSegments=[]; updateRouteMap([]);
  $('journey-results').replaceChildren(); $('journey-history').replaceChildren();
  $('journey-export').disabled=true; $('journey-map').disabled=true;
  $('journey-status').textContent='選站或條件變更後，請重新計算進出站規劃。';
}
export function updateJourneyContext(next) {
  context=next; invalidateJourney();
  if (topology && context) fillStations();
}
function fillStations() {
  const ids=new Set(topology.lines.flatMap(line=>line.stops.map(s=>s.id)));
  const stations=context.stations.filter(s=>ids.has(s.id)).sort((a,b)=>a.name.localeCompare(b.name,'ja'));
  for (const id of ['journey-start','journey-end']) {
    const value=$(id).value;
    $(id).replaceChildren(new Option('請選擇車站',''),...stations.map(s=>new Option(s.name,s.id)));
    if (stations.some(s=>s.id===value)) $(id).value=value;
  }
  $('journey-coverage').textContent=`已載入官方站序核對的 9 條路線、${ids.size} 個站點識別。資料核對日：${topology.checkedAt}。目前卡種：${context.card || 'PASMO'}。`;
}
async function loadTopology() {
  if (!loading) loading=fetch('./metro-topology.json').then(r=>{if(!r.ok)throw new Error('Metro 路網載入失敗');return r.json();}).then(data=>{
    if(data.revision!=='bf6f92d08c6346253713a754944085c526ec6645'||data.schemaVersion!==1)throw new Error('Metro 路網版本不符');
    topology=data; return data;
  }).catch(error=>{loading=null;throw error;});
  return loading;
}
export function initializeJourneyPanel() {
  document.addEventListener('ekispell-route-conditions',invalidateJourney);
  $('load-metro').addEventListener('click',async()=>{
    $('load-metro').disabled=true;
    try {await loadTopology(); if(context)fillStations(); $('journey-controls').hidden=false;}
    catch(error){$('journey-status').textContent=error.message;}
    finally{$('load-metro').disabled=false;}
  });
  for(const id of ['journey-start','journey-end','journey-interleaved'])$(id).addEventListener('change',invalidateJourney);
  $('plan-journey').addEventListener('click',calculateJourney);
  $('journey-map').addEventListener('click',async()=>{const run=generation;await openStationMap();if(run===generation)updateRouteMap(resultSegments);});
  $('journey-export').addEventListener('click',()=>{
    if(!exportText)return;
    const url=URL.createObjectURL(new Blob([exportText],{type:'text/plain;charset=utf-8'})),a=document.createElement('a');
    a.href=url;a.download='ekispell-metro-journey.txt';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  });
}
async function calculateJourney() {
  invalidateJourney();const run=generation;
  $('plan-journey').disabled=true;$('journey-status').textContent='正在計算逐筆進出站…';
  try {
    await loadTopology();
    if(run!==generation)return;
    if(!context)throw new Error('請先建立排字草稿');
    if(!$('journey-start').value || !$('journey-end').value)throw new Error('請選擇起點及終點');
    const model=buildMetroTransactions(context.stations,topology,getRouteOptions(),context.card || 'PASMO');
    const result=planMetroJourney(context.sequence,context.profile,model,{start:$('journey-start').value,end:$('journey-end').value,field:context.field,allowInterleavedRecords:$('journey-interleaved').checked});
    if(result.status!=='found') {
      $('journey-status').textContent=result.status==='limit-reached' ? '搜尋達到上限，目前無法判定；請縮短文字或減少行程範圍。' : '此模型內找不到符合的進出站方案。請檢查格式筆數、欄寬、起終點，或允許插入額外履歷。';return;
    }
    const extra=result.records.filter(r=>r.messageIndex===null).length;
    $('journey-status').textContent=`找到模型方案：共 ${result.records.length} 筆／格式上限 ${context.profile.maxRows} 筆，其中 ${extra} 筆為額外履歷。尚未實測，非保證印字成功。`;
    const names=new Map(context.stations.map(s=>[s.id,s]));
    const warnings='每段都須完成獨立進站、乘車、出站扣款。轉乘閘門／連續轉乘可能合併交易，請向站務確認。每筆不跨路線，但支線可能換車。班次、票價、設備印字未驗證；定期券／一日券、充值與購物可能影響履歷。';
    const text=['EkiSpell 東京 Metro 進出站模型（未實測）',`核對日：${topology.checkedAt}；卡種：${context.card || 'PASMO'}`,warnings,''];
    result.records.forEach((record,i)=>{
      const path=model.paths.get(record.edgeId);
      const label=record.messageIndex===null ? '額外履歷' : `排字第 ${record.messageIndex+1} 字「${context.sequence[record.messageIndex].character}」`;
      const action=`${i+1}. 進站 ${names.get(record.entry).name} → ${path.line} → 出站 ${names.get(record.exit).name}｜${label}`;
      const li=node('li',action),detail=node('details',''); detail.append(node('summary','沿線站序'),node('p',path.stations.map(id=>names.get(id).name).join(' → ')));li.append(detail);$('journey-results').append(li);
      text.push(action);
      for(let j=1;j<path.stations.length;j++)resultSegments.push({line:path.line,from:names.get(path.stations[j-1]),to:names.get(path.stations[j])});
    });
    const head=node('tr','');for(const title of ['入場站','出場站','用途'])head.append(node('th',title));const thead=document.createElement('thead');thead.append(head);$('journey-history').append(thead);
    const body=document.createElement('tbody');
    for(const record of result.displayRecords){const tr=node('tr','');for(const value of [names.get(record.entry).name,names.get(record.exit).name,record.messageIndex===null?'額外履歷':`第 ${record.messageIndex+1} 字`])tr.append(node('td',value));body.append(tr);}
    $('journey-history').append(body);
    text.push('',`模型履歷表（${context.profile.order==='newest-first'?'新紀錄在上':'舊紀錄在上'}；站名為資料原文，非實際印字）`,...result.displayRecords.map(r=>`${names.get(r.entry).name} → ${names.get(r.exit).name}｜${r.messageIndex===null?'額外履歷':`第 ${r.messageIndex+1} 字`}`),'',...topology.lines.map(l=>l.source));
    exportText=text.join('\n');$('journey-export').disabled=false;$('journey-map').disabled=false;
  }catch(error){$('journey-status').textContent=error.message;}
  finally{$('plan-journey').disabled=false;}
}
