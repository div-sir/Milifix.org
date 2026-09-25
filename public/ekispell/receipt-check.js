import { graphemes, cellWidth } from './dist/index.js';

export function parseReceipt(text) {
  if(typeof text!=='string'||text.length>20000)throw new Error('履歷文字上限為 20,000 字元');
  const lines=text.replace(/\r\n?/g,'\n').split('\n');
  while(lines.length&&lines.at(-1)==='')lines.pop();
  if(!lines.length||lines.every(line=>!line.trim()))throw new Error('請輸入實際履歷');
  if(lines.length>100)throw new Error('一次最多核對 100 筆');
  return lines.map((line,i)=>{
    const fields=line.includes('\t')?line.split('\t'):line.split('|');
    if(fields.length!==2||fields.some(value=>!value.trim()||value.length>100))throw new Error(`第 ${i+1} 行需有兩欄，以 | 或 Tab 分隔；每欄 1–100 字元，無站名請填「—」`);
    return {entry:fields[0],exit:fields[1],line:i+1};
  });
}
export function expectedReceipt(result,context) {
  const names=new Map(context.stations.map(s=>[s.id,s.name]));
  return result.records.map((record,i)=>{
    const target=record.messageIndex===null?null:context.sequence[record.messageIndex];
    const row={number:i+1,entry:names.get(record.entry),exit:names.get(record.exit),messageIndex:record.messageIndex,
      character:target?.character??null,column:target?.selected?.column??null};
    if(target)row[context.field]=target.selected.text;
    return row;
  });
}
const normalized=text=>text.normalize('NFKC').trim();
const same=(a,b)=>normalized(a.entry)===normalized(b.entry)&&normalized(a.exit)===normalized(b.exit);
function characterAtCell(text,column) {
  let position=0;
  for(const character of graphemes(text)) {
    if(position===column)return character;
    position+=cellWidth(character);
    if(position>column)return null;
  }
  return null;
}
// Minimum edit alignment; a substitution costs one, an insertion/deletion one.
// Repeated names or ties can be ambiguous. The report never certifies a receipt.
export function compareReceipt(expected,observed,{order='newest-first',field='entry'}={}) {
  if(!['newest-first','oldest-first'].includes(order)||!['entry','exit'].includes(field))throw new Error('履歷順序或目標欄位無效');
  if(!expected.length||expected.length>100||!observed.length||observed.length>100)throw new Error('規劃與履歷各需 1–100 筆');
  const actual=order==='newest-first'?[...observed].reverse():[...observed];
  const n=expected.length,m=actual.length;
  const cost=Array.from({length:n+1},()=>Array(m+1).fill(0));
  const ways=Array.from({length:n+1},()=>Array(m+1).fill(1));
  for(let i=0;i<=n;i++)cost[i][0]=i;
  for(let j=0;j<=m;j++)cost[0][j]=j;
  for(let i=1;i<=n;i++)for(let j=1;j<=m;j++){
    const values=[cost[i-1][j-1]+Number(!same(expected[i-1],actual[j-1])),cost[i-1][j]+1,cost[i][j-1]+1];
    cost[i][j]=Math.min(...values);
    ways[i][j]=Math.min(2,values.reduce((sum,value,k)=>sum+(value===cost[i][j]?[ways[i-1][j-1],ways[i-1][j],ways[i][j-1]][k]:0),0));
  }
  const rows=[];let i=n,j=m;
  while(i||j){
    if(i&&j&&cost[i][j]===cost[i-1][j-1]+Number(!same(expected[i-1],actual[j-1]))){
      const plan=expected[--i],actualRow=actual[--j];
      rows.push({kind:same(plan,actualRow)?'same':'changed',expected:plan,observed:actualRow,
        targetMatches:plan.messageIndex===null?null:characterAtCell(actualRow[field],plan.column)===plan.character});
    }else if(i&&cost[i][j]===cost[i-1][j]+1)rows.push({kind:'missing',expected:expected[--i],observed:null,targetMatches:false});
    else rows.push({kind:'extra',expected:null,observed:actual[--j],targetMatches:null});
  }
  rows.reverse();
  const counts={same:0,changed:0,missing:0,extra:0};for(const row of rows)counts[row.kind]++;
  return {rows,counts,ambiguous:ways[n][m]>1,verification:'manual-unverified'};
}
