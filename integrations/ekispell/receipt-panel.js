import { parseReceipt, expectedReceipt, compareReceipt } from './receipt-check.js';
const $=id=>document.getElementById(id);
const node=(tag,text)=>{const n=document.createElement(tag);n.textContent=text;return n;};
let snapshot=null,report=null;
function invalidate() {
  report=null;$('receipt-report-download').disabled=true;
  $('receipt-check-results').replaceChildren();
  $('receipt-check-status').textContent='輸入內容或方案變更後，請重新核對。手動輸入不會變成已驗證印字。';
}
export function updateReceiptPlan(next) {
  snapshot=next;invalidate();$('receipt-check-panel').hidden=!next;
}
export function initializeReceiptPanel() {
  for(const id of ['receipt-actual','receipt-actual-order','receipt-observed-date','receipt-device'])$(id).addEventListener('input',invalidate);
  $('receipt-compare').addEventListener('click',()=>{
    invalidate();
    try {
      if(!snapshot)throw new Error('請先計算進出站方案');
      const {result,context}=snapshot,observed=parseReceipt($('receipt-actual').value);
      const expected=expectedReceipt(result,context);
      const comparison=compareReceipt(expected,observed,{order:$('receipt-actual-order').value,field:context.field});
      const labels={same:'兩欄文字相同',changed:'文字不同',missing:'未對應到實際筆數',extra:'多出的實際紀錄'};
      const counts=comparison.counts;
      $('receipt-check-status').textContent=`相同 ${counts.same} 筆／文字不同 ${counts.changed} 筆／缺筆 ${counts.missing} 筆／多筆 ${counts.extra} 筆。${comparison.ambiguous?'存在多種同分對齊，以下只是其中一種，請逐筆確認。':'以下為文字序列比對，仍需逐筆確認。'} 不判定是否合併扣款，也不將手動輸入標為收據已驗證。`;
      for(const row of comparison.rows){
        const plan=row.expected,actual=row.observed;
        const li=node('li',labels[row.kind]);
        li.append(node('p',`規劃${plan?`第 ${plan.number} 筆：${plan.entry} → ${plan.exit}`:'：無對應'}`),node('p',`輸入${actual?`第 ${actual.line} 行：${actual.entry} → ${actual.exit}`:'：無對應'}`));
        if(plan?.messageIndex!==null&&plan?.messageIndex!==undefined)li.append(node('p',`第 ${plan.messageIndex+1} 字「${plan.character}」，${context.field==='entry'?'入場':'出場'}欄第 ${plan.column+1} 格：${row.targetMatches?'輸入文字在此格含目標字':'未在此格找到目標字'}（格寬仍採模型假設）。`));
        $('receipt-check-results').append(li);
      }
      report={schemaVersion:1,createdAt:new Date().toISOString(),source:snapshot.source,type:'ekispell-manual-receipt-comparison',verification:'manual-unverified',
        observedDate:$('receipt-observed-date').value||null,device:$('receipt-device').value.slice(0,120),
        assumptions:'Manual transcription. Minimum-edit alignment can be ambiguous. Expected target field uses selected unverified labels; other fields use source station names. No image, gate behavior or printer width has been verified. Full modeled plan is compared; retention simulation is not applied.',
        plan:{message:context.sequence.map(r=>r.character).join(''),card:context.card,field:context.field,profile:context.profile,records:result.records,expected},
        observedOrder:$('receipt-actual-order').value,observed,comparison};
      $('receipt-report-download').disabled=false;
    }catch(error){$('receipt-check-status').textContent=error.message;}
  });
  $('receipt-report-download').addEventListener('click',()=>{
    if(!report)return;
    const url=URL.createObjectURL(new Blob([JSON.stringify(report,null,2)],{type:'application/json'}));
    const a=document.createElement('a');a.href=url;a.download='ekispell-receipt-comparison.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  });
}
