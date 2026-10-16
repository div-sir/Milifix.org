/* global document, Blob, URL */
import React from 'react';
import { EvidenceChart, DataComponent, DataTable, Filters, MetricCard, Section, SortableItem, SortableRegion, useDataApp, useDashboardTabs } from '../../data-app-public.jsx';
import './taiwan.css';
import { sum, rollup, rateRows, pct, num } from './metrics.js';
const vehicleFilters=['month','city','vehicle','severity','collision'];
const tabs=[{id:'overview',label:'事故概覽',filterIds:vehicleFilters},{id:'vehicles',label:'車種與事故率',filterIds:vehicleFilters},{id:'brands',label:'廠牌理賠比較',filterIds:['brand','origin']},{id:'models',label:'車型資料',filterIds:[]}];
const allDimensions=['month','city','severity','vehicle','subtype','collision'];
const measureLabels={accidents:'事故件數',involvements:'涉事次數',per10k:'每萬輛涉事次數',claimFrequencyRate:'理賠頻率',claims:'理賠件數'};
const countChart=(x,y,extra={})=>({type:'horizontalBar',x,y,valueDecimals:0,legend:{labels:measureLabels},...extra});
function Note({children,tone=''}){return <p className={`tw-note ${tone}`}>{children}</p>}
function TableBlock({id,queryId,title,rows,sourceRows,columns,...rest}){return <DataComponent id={id} queryId={queryId} title={title} kind="table" variant="card" displayRows={rows} sourceRows={sourceRows} {...rest}><DataTable rows={rows} columns={columns} caption={title}/></DataComponent>}
function Plot({id,queryId,title,rows,sourceRows,spec,height=310,children,...rest}){return <EvidenceChart id={id} queryId={queryId} title={title} rows={rows} sourceRows={sourceRows} spec={spec} height={height} variant="card" {...rest}>{children}</EvidenceChart>}
function Overview(){
 const {reviewedRows}=useDataApp();const rows=reviewedRows('accidents',allDimensions);
 const trend=rollup(rows,['month'],['accidents','deaths24h','injuries']);
 const cities=rollup(rows,['city'],['accidents']).sort((a,b)=>b.accidents-a.accidents);
 const collisions=rollup(rows,['collision'],['accidents']).sort((a,b)=>b.accidents-a.accidents);
 const vehicles=rollup(rows,['vehicle'],['accidents']).sort((a,b)=>b.accidents-a.accidents);
 return <><Note>2025 年 1–12 月・A1／A2 傷亡事故，不含 A3 財損。此頁車種篩選指「第一當事者車種／類別」，順位不代表最終肇責。</Note>
 <SortableRegion id="overview-canvas" variant="canvas" columns={12} spacing="standard" rows={[{id:'overview-kpis',kind:'metrics',items:['accident-total','death-total','injury-total']},{id:'overview-trend',items:['monthly-accidents']},{id:'overview-comparison',items:['collision-counts','city-counts']},{id:'overview-vehicles',items:['first-vehicle-counts']}]}>
 <SortableItem id="accident-total" span={4} kind="metric"><MetricCard id="accident-total" queryId="accidents" title="傷亡事故件數" value={num(sum(rows,'accidents'))} displayRows={trend} sourceRows={rows} trendValues={trend.map(x=>x.accidents)} trendLabel="月份趨勢"/></SortableItem>
 <SortableItem id="death-total" span={4} kind="metric"><MetricCard id="death-total" queryId="accidents" title="24 小時死亡人數" value={num(sum(rows,'deaths24h'))} displayRows={trend} sourceRows={rows} trendValues={trend.map(x=>x.deaths24h)}/></SortableItem>
 <SortableItem id="injury-total" span={4} kind="metric"><MetricCard id="injury-total" queryId="accidents" title="受傷人數" value={num(sum(rows,'injuries'))} displayRows={trend} sourceRows={rows} trendValues={trend.map(x=>x.injuries)}/></SortableItem>
 <SortableItem id="monthly-accidents" span={12} kind="chart"><Plot id="monthly-accidents" queryId="accidents" title="每月傷亡事故件數" rows={trend} sourceRows={rows} spec={{type:'line',x:'month',y:'accidents',valueDecimals:0,legend:{labels:measureLabels}}}/></SortableItem>
 <SortableItem id="collision-counts" span={6} kind="chart"><Plot id="collision-counts" queryId="accidents" title="事故型態件數（前 12 類）" rows={collisions.slice(0,12)} sourceRows={rows} spec={countChart('collision','accidents')} height={380}/></SortableItem>
 <SortableItem id="city-counts" span={6} kind="chart"><Plot id="city-counts" queryId="accidents" title="各縣市事故件數" rows={cities} sourceRows={rows} spec={countChart('city','accidents')} height={540}/></SortableItem>
 <SortableItem id="first-vehicle-counts" span={12} kind="chart"><Plot id="first-vehicle-counts" queryId="accidents" title="第一當事者類別 × 事故件數" rows={vehicles} sourceRows={rows} spec={countChart('vehicle','accidents')} height={430}/></SortableItem>
 </SortableRegion></>
}
function Vehicles(){
 const {reviewedRows,filters}=useDataApp();const rows=reviewedRows('participants',allDimensions);const registry=reviewedRows('registry',['month','vehicle']);
 const national=!filters.city||filters.city==='all';const rates=rateRows(rows,registry,national);
 const counts=rollup(rows,['vehicle'],['involvements']).sort((a,b)=>b.involvements-a.involvements);
 const trend=rollup(rows,['month','vehicle'],['involvements']);const topVehicles=counts.slice(0,8).map(x=>x.vehicle);
 const topCollisions=rollup(rows,['collision'],['involvements']).sort((a,b)=>b.involvements-a.involvements).slice(0,9).map(x=>x.collision);
 const matrix=rollup(rows.filter(x=>topVehicles.includes(x.vehicle)&&topCollisions.includes(x.collision)),['vehicle','collision'],['involvements']);
 const evidence={queryIds:['participants','registry'],sourceRowsByQuery:{participants:rows,registry}};
 return <><Note>2025 年・每個涉事車輛紀錄計一次，同一事故可有多車。涉事次數與事故件數不同；排除「人」與未填車種，保留來源車種細類。</Note>
 <Section id="vehicles-count-section" title="涉事車種與碰撞型態" spacing="none" columns={2}>
 <Plot id="vehicle-involvements" queryId="participants" title="各車種涉事次數" rows={counts} sourceRows={rows} spec={countChart('vehicle','involvements')} height={430}/>
 <Plot id="vehicle-month-trend" queryId="participants" title="車種每月涉事次數" rows={trend} sourceRows={rows} spec={{type:'line',x:'month',y:'involvements',series:'vehicle',stackable:false,valueDecimals:0,legend:{labels:measureLabels}}} height={430}/>
 </Section>
 <Section id="vehicles-rate-section" title="用車輛登記數校正規模" columns={1}>
 <Note tone="amber">每萬輛涉事次數＝所選期間涉事次數 ÷ 所選月份月底平均登記數 × 10,000。未年化、未控制里程或駕駛人差異，不能解讀為車輛安全排名。僅六大車種可對應分母。</Note>
 {!national?<Note tone="amber">目前選了縣市；分母僅有全國資料，事故率暫不顯示。將縣市切回 All 可查看。</Note>:<Plot id="vehicle-rates" queryId="participants" title="每萬輛涉事次數（全國、所選期間）" rows={rates.filter(x=>x.per10k!==null)} sourceRows={rows} {...evidence} spec={countChart('vehicle','per10k',{valueDecimals:1})} height={300}/>}
 <TableBlock id="vehicle-rate-detail" queryId="participants" title="車種、件次與登記分母" rows={rates} sourceRows={rows} {...evidence} columns={[{field:'vehicle',label:'車種'},{field:'involvements',label:'涉事次數'},{field:'averageRegistered',label:'平均登記車數',renderCell:v=>v===null?'無對應分母':num(v)},{field:'per10k',label:'每萬輛涉事次數',renderCell:v=>v===null?'無法計算':num(v,1)}]}/>
 </Section>
 <Section id="vehicles-matrix-section" title="車種 × 事故型態" columns={1}>
 <Plot id="vehicle-collision-matrix" queryId="participants" title="涉事次數熱圖（前 8 車種 × 前 9 型態）" rows={matrix} sourceRows={rows} spec={{type:'heatmap',x:'collision',y:'involvements',series:'vehicle',showValues:true,missingValues:'gap',valueDecimals:0}} height={360}/>
 <TableBlock id="vehicle-subtypes" queryId="participants" title="車種細類與碰撞型態明細" rows={rollup(rows,['vehicle','subtype','collision'],['involvements']).sort((a,b)=>b.involvements-a.involvements)} sourceRows={rows} columns={[{field:'vehicle',label:'車種'},{field:'subtype',label:'細類'},{field:'collision',label:'事故型態'},{field:'involvements',label:'涉事次數'}]}/>
 </Section></>
}
function Brands(){
 const {reviewedRows}=useDataApp();const rows=reviewedRows('brands');const earned=sum(rows,'earnedVehicles'),claims=sum(rows,'claims');
 const stable=rows.filter(x=>x.earnedVehicles>=1000).sort((a,b)=>b.earnedVehicles-a.earnedVehicles);
 const freq=stable.slice(0,20).sort((a,b)=>b.claimFrequencyRate-a.claimFrequencyRate);const counts=[...stable].sort((a,b)=>b.claims-a.claims).slice(0,20);
 return <><Note tone="amber">2024 年・乙式車體險・自用小客車・原公會報送版商品條款，不含附加險。這是保險理賠，不是全台道路事故率；未含機車廠牌，無碰撞型態與車型欄位，不能與 2025 警政資料合併比較。</Note>
 <Section id="brand-kpis-section" title="廠牌保險樣本" spacing="none" columns={3}>
 <MetricCard id="brand-claims" queryId="brands" title="已發生賠款件數" value={num(claims)} displayRows={rows} sourceRows={rows}/>
 <MetricCard id="brand-earned" queryId="brands" title="滿期車數（理賠頻率分母）" value={num(earned)} displayRows={rows} sourceRows={rows}/>
 <MetricCard id="brand-frequency" queryId="brands" title="樣本加權理賠頻率" value={earned?pct(claims/earned):'無法計算'} displayRows={[{claims,earnedVehicles:earned,claimFrequencyRate:earned?claims/earned:null}]} sourceRows={rows}/>
 </Section>
 <Note>理賠頻率＝已發生賠款件數 ÷ 滿期車數；不是賠款金額占保費的「賠款率」。保留原廠牌／產地名稱，國瑞與 Toyota、裕隆與 Nissan 不自行合併。</Note>
 <Section id="brand-charts-section" title="相同險種下的廠牌比較" columns={2}>
 <Plot id="brand-frequency-compare" queryId="brands" title="大樣本廠牌理賠頻率" rows={freq} sourceRows={stable} spec={countChart('brand','claimFrequencyRate',{valueDecimals:2})} height={590}><Note>滿期車數 ≥ 1,000，取滿期車數最大的前 20 個原始分類。小樣本仍保留於下方完整表。</Note></Plot>
 <Plot id="brand-claims-compare" queryId="brands" title="大樣本廠牌理賠件數（前 20 類）" rows={counts} sourceRows={stable} spec={countChart('brand','claims')} height={590}/>
 </Section>
 <Section id="brand-detail-section" title="完整廠牌分類" columns={1}>
 <TableBlock id="brand-detail" queryId="brands" title="廠牌理賠與樣本明細" rows={[...rows].sort((a,b)=>b.earnedVehicles-a.earnedVehicles)} sourceRows={rows} columns={[{field:'brand',label:'原廠牌分類'},{field:'origin',label:'產地分類'},{field:'claims',label:'理賠件數'},{field:'earnedVehicles',label:'滿期車數'},{field:'claimFrequencyRate',label:'理賠頻率',renderCell:v=>v===null?'無分母':pct(v)},{field:'lossRatioRate',label:'賠款率（金額）',renderCell:v=>v===null?'無分母':pct(v)},{field:'page',label:'PDF頁'}]}/>
 </Section></>
}
const modelColumns=[{field:'year',label:'年度'},{field:'brand',label:'廠牌'},{field:'model',label:'車型'},{field:'collision',label:'事故型態'},{field:'accidents',label:'涉事次數'},{field:'averageRegistered',label:'平均登記車數'},{field:'per10k',label:'每萬輛涉事次數',renderCell:v=>v===null?'資料未取得':num(v,1)}];
function Models(){
 const {reviewedRows}=useDataApp();const raw=reviewedRows('models');const rows=raw.map(x=>({...x,per10k:Number.isFinite(x.accidents)&&Number.isFinite(x.averageRegistered)&&x.averageRegistered>0?x.accidents/x.averageRegistered*10000:null}));
 const template=()=>{const text='year,brand,model,collision,accidents,averageRegistered,sourceUrl\n';const url=URL.createObjectURL(new Blob(['\uFEFF'+text],{type:'text/csv;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='vehicle-model-data-template.csv';a.click();URL.revokeObjectURL(url);};
 return <Section id="model-data-section" title="車型事故件數與事故率" spacing="none" columns={1}>
 {!rows.length&&<div className="tw-empty"><span className="tw-status">資料未取得</span><h2>車型比較需要額外資料</h2><p>尚無可驗證的 Corolla、Model Y 等車型事故統計。警政署公開資料未提供廠牌／車型，車體險表17也僅到廠牌／產地分類。</p><p>廠牌 × 車型 × 事故型態的比較，需要同一期間的涉事次數、平均登記車數、資料來源及一致的計數口徑。缺資料不等於零事故。</p><button type="button" onClick={template}>下載車型資料欄位範本</button><p className="tw-small">補齊並核對資料後，可請 ChatGPT 更新本頁的車型資料集；此範本不含示例數值。</p></div>}
 {rows.length>0&&<Plot id="model-rate-plot" queryId="models" title="車型每萬輛涉事次數" rows={rows.filter(x=>x.per10k!==null).map(x=>({...x,modelLabel:`${x.brand} ${x.model}・${x.year}・${x.collision}`}))} sourceRows={raw} spec={countChart('modelLabel','per10k',{valueDecimals:1})} height={400}/>}
 <TableBlock id="model-data-table" queryId="models" title="車型資料明細" rows={rows} sourceRows={raw} columns={modelColumns}/>
 </Section>
}
export function DashboardContent(){const {activeTabId}=useDashboardTabs(tabs);const {snapshot,queries,filters,setFilter}=useDataApp();return <article className="tw-dashboard"><Filters sticky filters={snapshot.filters??[]} queries={queries} values={filters} onChange={setFilter}/>{activeTabId==='vehicles'?<Vehicles/>:activeTabId==='brands'?<Brands/>:activeTabId==='models'?<Models/>:<Overview/>}</article>}
