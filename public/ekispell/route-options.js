import { normalizeRouteOptions } from './routes.js';
const key='ekispell-route-options-v1';
const $=id=>document.getElementById(id);
let options=normalizeRouteOptions(), network, changed, initialized=false;
export function getRouteOptions() { return normalizeRouteOptions(options); }
function renderOptions() {
  $('route-max-changes').value=options.maxChanges===null ? '' : String(options.maxChanges);
  $('route-avoid-shinkansen').checked=options.avoidShinkansen;
  $('route-same-operator').checked=options.sameOperatorOnly;
  for (const [field,list,label] of [['excludedOperators','route-excluded-operators','業者'],['excludedLines','route-excluded-lines','路線']]) {
    $(list).replaceChildren();
    for (const value of options[field]) {
      const item=document.createElement('li'), button=document.createElement('button');
      const line=network.lines.get(value);
      const name=field==='excludedLines' && line ? `${line.operator}・${line.name} (${value.slice(11)})` : value;
      button.type='button'; button.textContent=`移除${label}：${name}`;
      button.addEventListener('click',()=>{ options[field]=options[field].filter(v=>v!==value); apply(); });
      item.append(button); $(list).append(item);
    }
  }
  const parts=[options.maxChanges===null ? '切換次數不限' : `每段最多切換 ${options.maxChanges} 次`];
  if (options.avoidShinkansen) parts.push('避開新幹線');
  if (options.sameOperatorOnly) parts.push('不跨業者轉乘');
  if (options.excludedOperators.length) parts.push(`排除 ${options.excludedOperators.length} 家業者`);
  if (options.excludedLines.length) parts.push(`排除 ${options.excludedLines.length} 條路線`);
  $('route-condition-summary').textContent=parts.join(' · ');
}
function apply() {
  options=normalizeRouteOptions(options);
  try { localStorage.setItem(key,JSON.stringify(options)); $('route-condition-storage').textContent='路線條件已保存在此瀏覽器。'; }
  catch { $('route-condition-storage').textContent='此瀏覽器無法保存條件，關閉頁面後需重新設定。'; }
  renderOptions(); changed();
}
function fillChoices() {
  const query=$('route-exclusion-search').value.trim().normalize('NFKC').toLowerCase();
  const matching=text=>text.normalize('NFKC').toLowerCase().includes(query);
  const operators=[...new Set([...network.lines.values()].map(l=>l.operator))].sort((a,b)=>a.localeCompare(b,'ja'));
  $('route-operator').replaceChildren(new Option('選擇業者',''),...operators.filter(matching).map(name=>new Option(name,name)));
  const lines=[...network.lines].map(([id,l])=>[id,`${l.operator}・${l.name} (${id.slice(11)})`]).sort((a,b)=>a[1].localeCompare(b[1],'ja'));
  $('route-line').replaceChildren(new Option('選擇路線',''),...lines.filter(([,label])=>matching(label)).map(([id,label])=>new Option(label,id)));
}
export function initializeRouteOptions(nextNetwork, onChange) {
  network=nextNetwork; changed=onChange;
  if (!initialized) {
    initialized=true;
    try {
      const saved=localStorage.getItem(key);
      if (saved) { options=normalizeRouteOptions(JSON.parse(saved)); $('route-condition-storage').textContent='已還原上次路線條件。'; }
    } catch { $('route-condition-storage').textContent='無法讀取已存條件，已使用預設值。'; }
    const max=$('route-max-changes');
    // Retain valid saved API limits even if they are not one of the common UI presets.
    if (options.maxChanges!==null && ![...max.options].some(o=>o.value===String(options.maxChanges))) max.add(new Option(`${options.maxChanges} 次`,String(options.maxChanges)));
    max.addEventListener('change',()=>{ options.maxChanges=max.value==='' ? null : Number(max.value); apply(); });
    for (const [id,field] of [['route-avoid-shinkansen','avoidShinkansen'],['route-same-operator','sameOperatorOnly']]) $(id).addEventListener('change',()=>{ options[field]=$(id).checked; apply(); });
    for (const [id,field] of [['operator','excludedOperators'],['line','excludedLines']]) {
      $(`route-add-${id}`).addEventListener('click',()=>{
        const value=$(`route-${id}`).value;
        if (value && !options[field].includes(value)) { options[field].push(value); apply(); }
      });
    }
    $('route-exclusion-search').addEventListener('input',fillChoices);
    $('route-reset-conditions').addEventListener('click',()=>{ options=normalizeRouteOptions(); $('route-exclusion-search').value=''; fillChoices(); apply(); });
  }
  fillChoices(); renderOptions();
}
