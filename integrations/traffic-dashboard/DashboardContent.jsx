/* global document, Blob, URL */
import React from 'react';
import { EvidenceChart, DataComponent, DataTable, Filters, MetricCard, Section, SortableItem, SortableRegion, useDataApp, useDashboardTabs } from '../../data-app-public.jsx';
import './taiwan.css';
import { sum, rollup, rateRows, pct, num } from './metrics.js';
const vehicleFilters=['month','city','vehicle','severity','collision'];
const tabs=[{id:'protection',label:'乘員保護',filterIds:['protocol','ratingYear','make']},{id:'history',label:'五年事故趨勢',filterIds:['historyYear','historyCity']},{id:'overview',label:'2025事故明細',filterIds:vehicleFilters},{id:'vehicles',label:'2025車種分析',filterIds:vehicleFilters},{id:'brands',label:'理賠背景',filterIds:['brand','origin']},{id:'models',label:'實際死亡率資料',filterIds:[]}];
const allDimensions=['month','city','severity','vehicle','subtype','collision'];
const measureLabels={accidents:'事故件數',involvements:'涉事次數',per10k:'每萬輛涉事次數',claimFrequencyRate:'理賠頻率',claims:'理賠件數'};
const countChart=(x,y,extra={})=>({type:'horizontalBar',x,y,valueDecimals:0,legend:{labels:measureLabels},...extra});
function Note({children,tone=''}){return <p className={`tw-note ${tone}`}>{children}</p>}
function TableBlock({id,queryId,title,rows,sourceRows,columns,...rest}){return <DataComponent id={id} queryId={queryId} title={title} kind="table" variant="card" displayRows={rows} sourceRows={sourceRows} {...rest}><DataTable rows={rows} columns={columns} caption={title}/></DataComponent>}
function Plot({id,queryId,title,rows,sourceRows,spec,height=310,children,...rest}){return <EvidenceChart id={id} queryId={queryId} title={title} rows={rows} sourceRows={sourceRows} spec={spec} height={height} variant="card" {...rest}>{children}</EvidenceChart>}
function Protection(){
 const {reviewedRows,filters,setFilter}=useDataApp();const rows=reviewedRows('tncap',['protocol','ratingYear','make']);
 const [selected,setSelected]=React.useState([]);const [baseline,setBaseline]=React.useState('');
 const comparable=filters.protocol==='第一版'||filters.protocol==='第二版';const ordered=[...rows].sort((a,b)=>b.adultScorePct-a.adultScorePct);
 const labels={adultScorePct:'成人保護得分率（%）',childScorePct:'兒童保護得分率（%）'};
 return <>
 <DataComponent id="fatality-data-gap" queryId="models" title="重大事故乘客死亡率" kind="narrative" variant="card" displayRows={[]} sourceRows={[]}>
  <div className="tw-primary-gap"><strong>目前無法計算</strong><p>台灣公開事故檔沒有乘客個別傷亡、所屬車型及含未受傷者的完整分母。整起事故死亡人數不能當成車內乘客死亡人數。</p><p>目標指標：同一定義重大事故的乘客死亡人數 ÷ 同類事故全部乘客人數（含存活未受傷者）。乘客不含駕駛；乘員含駕駛，兩者需分開統計。</p></div>
 </DataComponent>
 <Section id="protection-section" title="車型乘員保護測試・TNCAP" columns={1}>
 <Note tone="amber">以下為官方碰撞／安全評等得分，並非實際死亡率或存活率。不可用「100 − 得分」推算死亡風險。第一版（2023–2025）與第二版（2026）標準不同，分開比較。</Note>
 {!comparable?<div className="tw-empty"><h2>先選同一版規章再比較</h2><p>跨版分數不合併排名；完整表仍列出來源值。</p><button type="button" onClick={()=>setFilter('protocol','第二版')}>查看第二版</button><button type="button" onClick={()=>setFilter('protocol','第一版')}>查看第一版</button></div>:<Section id="protection-chart-section" spacing="none" columns={2}>
 <Plot id="adult-protection-plot" queryId="tncap" title="成人保護得分率（%）" rows={ordered} sourceRows={rows} spec={{type:'horizontalBar',x:'modelLabel',y:'adultScorePct',domain:[0,100],valueDecimals:0,legend:{labels}}} height={Math.max(300,ordered.length*27)}/>
 <Plot id="child-protection-plot" queryId="tncap" title="兒童保護得分率（%）" rows={ordered} sourceRows={rows} spec={{type:'horizontalBar',x:'modelLabel',y:'childScorePct',domain:[0,100],valueDecimals:0,legend:{labels}}} height={Math.max(300,ordered.length*27)}/>
 </Section>}
 {comparable&&<Section id="protection-comparison-section" title="自選車款並排比較" columns={1}>
 <div className="tw-compare-controls"><label htmlFor="compare-models">選擇 2–5 筆受評結果（同版規章）</label><select id="compare-models" multiple size={Math.min(Math.max(rows.length,3),9)} value={selected.filter(id=>rows.some(r=>r.sourceUrl===id))} onChange={e=>setSelected([...e.target.selectedOptions].map(o=>o.value).slice(0,5))}>{rows.map(r=><option key={r.sourceUrl} value={r.sourceUrl}>{r.modelLabel} · {r.ratingYear}</option>)}</select><span>按 Ctrl／⌘ 可複選；最多 5 筆。更改年份或廠牌篩選會只顯示符合範圍的車款。</span></div>
 {(()=>{const picked=selected.map(id=>rows.find(r=>r.sourceUrl===id)).filter(Boolean);if(picked.length<2)return <Note>選取至少兩筆，顯示四個項目的原始得分與相對基準差距。</Note>;const base=picked.find(r=>r.sourceUrl===baseline)||picked[0];const metrics=[['adultScorePct','成人保護'],['childScorePct','兒童保護'],['vulnerableScorePct','行人／弱勢用路人'],['assistScorePct','安全輔助']];return <>
 <label className="tw-baseline">比較基準車款 <select value={base.sourceUrl} onChange={e=>setBaseline(e.target.value)}>{picked.map(r=><option key={r.sourceUrl} value={r.sourceUrl}>{r.modelLabel} · {r.ratingYear}</option>)}</select></label>
 <TableBlock id="tncap-selected-compare" queryId="tncap" title="同規章車款評分與基準差距" rows={picked.map(r=>({...r,adultDelta:r.adultScorePct-base.adultScorePct,childDelta:r.childScorePct-base.childScorePct}))} sourceRows={rows} columns={[{field:'modelLabel',label:'受評車款'},{field:'ratingYear',label:'年份'},...metrics.map(([field,label])=>({field,label:`${label}（%）`,renderCell:v=>num(v)})),{field:'adultDelta',label:'成人保護相差（百分點）',renderCell:v=>`${v>0?'+':''}${num(v)}`},{field:'childDelta',label:'兒童保護相差（百分點）',renderCell:v=>`${v>0?'+':''}${num(v)}`} ]}/>
 <Note>差距是測試得分的百分點差，並非死亡風險差；四項得分不加總，也不代表實際乘客死亡率。對照適用於當前同版規章與篩選結果。</Note>
 </>})()}
 </Section>}
 <Note>評等年份不等於所有年式皆適用；同車名升級配備或改版後可有不同結果。請點開官方報告核對受驗配備與 VIN 適用範圍。成人保護包含駕駛與乘客，並依規章納入指定安全項目。</Note>
 <TableBlock id="tncap-model-table" queryId="tncap" title="官方車型評等與報告" rows={ordered} sourceRows={rows} columns={[{field:'make',label:'廠牌'},{field:'model',label:'受評車型'},{field:'ratingYear',label:'評等年份'},{field:'protocol',label:'規章'},{field:'adultScorePct',label:'成人保護（%）'},{field:'childScorePct',label:'兒童保護（%）'},{field:'sourceUrl',label:'受驗規格／完整報告',renderCell:v=><a href={v} target="_blank" rel="noopener noreferrer">官方報告 ↗</a>}]}/>
 </Section>
 </>
}
function History(){
 const {reviewedRows}=useDataApp();const raw=reviewedRows('history',['historyYear','historyMonth','historyCity','severity']);
 const yearly=rollup(raw,['historyYear'],['accidents','deaths24h','injuries']).map(x=>{const fatal=raw.filter(r=>r.historyYear===x.historyYear&&r.severity==='A1');return {...x,fatalAccidents:sum(fatal,'accidents'),fatalCrashShare:x.accidents?sum(fatal,'accidents')/x.accidents:null};});
 const monthly=rollup(raw,['historyMonth'],['accidents','deaths24h','injuries']);
 const yearCompare=yearly.map((r,i)=>({...r,previousAccidents:i?yearly[i-1].accidents:null,changeAccidents:i&&yearly[i-1].accidents?(r.accidents/yearly[i-1].accidents-1):null,changeDeaths:i&&yearly[i-1].deaths24h?(r.deaths24h/yearly[i-1].deaths24h-1):null}));
 const labels={accidents:'傷亡事故件數',deaths24h:'24小時死亡人數',fatalAccidents:'A1死亡事故件數',fatalCrashShare:'A1事故占比'};
 return <>
 <Note tone="amber">2021–2025 年完整年度。此頁死傷包含整起事故所有當事者，可能有行人、騎士或對方車乘員；不是乘客死亡率或車型保護能力。A1 僅代表有人當場或24小時內死亡，不能當作所有重大碰撞的統一定義。</Note>
 <Section id="history-kpis-section" title="所選期間事故背景" spacing="none" columns={3}>
 <MetricCard id="history-accident-count" queryId="history" title="傷亡事故件數" value={num(sum(raw,'accidents'))} displayRows={yearly} sourceRows={raw}/>
 <MetricCard id="history-fatal-crash-count" queryId="history" title="A1 死亡事故件數" value={num(sum(raw.filter(x=>x.severity==='A1'),'accidents'))} displayRows={yearly} sourceRows={raw}/>
 <MetricCard id="history-death-count" queryId="history" title="事故整體24小時死亡人數" value={num(sum(raw,'deaths24h'))} displayRows={yearly} sourceRows={raw}/>
 </Section>
 <Section id="history-years-section" title="五年變化" columns={2}>
 <Plot id="historical-fatal-crashes" queryId="history" title="各年 A1 死亡事故件數" rows={yearly} sourceRows={raw} spec={{type:'bar',x:'historyYear',y:'fatalAccidents',valueDecimals:0,legend:{labels}}}/>
 <Plot id="historical-deaths" queryId="history" title="各年事故整體死亡人數（24小時）" rows={yearly} sourceRows={raw} spec={{type:'bar',x:'historyYear',y:'deaths24h',valueDecimals:0,legend:{labels}}}/>
 </Section>
 <Section id="history-months-section" title="月份與年度明細" columns={1}>
 <Plot id="historical-monthly-deaths" queryId="history" title="每月事故整體死亡趨勢（24小時）" rows={monthly} sourceRows={raw} spec={{type:'line',x:'historyMonth',y:'deaths24h',valueDecimals:0,legend:{labels}}} height={300}/>
 <TableBlock id="history-annual-table" queryId="history" title="年度件數、死亡及受傷" rows={yearCompare} sourceRows={raw} columns={[{field:'historyYear',label:'年份'},{field:'accidents',label:'傷亡事故件數'},{field:'fatalAccidents',label:'A1事故件數'},{field:'deaths24h',label:'24小時死亡人數'},{field:'injuries',label:'受傷人數'},{field:'fatalCrashShare',label:'A1占傷亡事故',renderCell:v=>v===null?'無分母':pct(v)},{field:'changeAccidents',label:'事故件數年增減',renderCell:v=>v===null?'—':`${v>0?'+':''}${pct(v)}`},{field:'changeDeaths',label:'死亡人數年增減',renderCell:v=>v===null?'—':`${v>0?'+':''}${pct(v)}`} ]}/>
 <Note>年度增減以相鄰完整年度相比；只選一年或縣市後，前一年不在所選範圍時顯示「—」。A1占比＝A1事故件數 ÷（A1＋A2）事故件數，不是涉事乘客死亡的機率。未混入30日死亡統計，亦未把後續年度或不完整月份補零。</Note>
 </Section>
 </>
}
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
function Models(){
 const {reviewedRows}=useDataApp();const rows=reviewedRows('models');
 const template=()=>{const text='accidentId,vehicleId,year,brand,model,modelYear,occupantRole,injurySeverity30d,crashSeverityDefinition,occupantCount,sourceUrl\n';const url=URL.createObjectURL(new Blob(['\uFEFF'+text],{type:'text/csv;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='passenger-outcome-data-template.csv';a.click();URL.revokeObjectURL(url);};
 return <Section id="model-data-section" title="重大事故乘客死亡率・所需資料" spacing="none" columns={1}>
 <DataComponent id="model-data-requirements" queryId="models" title="實際乘客死亡率：資料未取得" kind="narrative" variant="card" displayRows={rows} sourceRows={rows}>
 <div className="tw-empty"><span className="tw-status">無法計算，不是零死亡</span><h2>還缺個人、車輛與事故的對應資料</h2><p>需要：事故ID、乘客所屬車輛ID、廠牌／車型／年式、乘客角色、個別30日傷亡、完整乘客人數（含未受傷者），以及可比的碰撞嚴重度。</p><p>事故整體死傷可能來自對方車、騎士或行人，不能歸給第一當事者車種或每一輛涉事車。重大事故也須先以可比的撞擊或損傷條件界定；只篩A1會用死亡結果挑選母體。</p><p>取得資料後，應分開計算「乘客（不含駕駛）」與「乘員（含駕駛）」的30日死亡比例，並依車齡、車重、年式、碰撞型態、撞擊強度、安全帶及年齡等條件分層，附上樣本數及區間。</p><button type="button" onClick={template}>下載乘客傷亡資料欄位範本</button><p className="tw-small">空白欄位範本不含示例數值。統計更新應先核對資料授權、個人傷亡及分母涵蓋情況。</p></div>
 </DataComponent></Section>
}
export function DashboardContent(){const {activeTabId}=useDashboardTabs(tabs);const {snapshot,queries,filters,setFilter}=useDataApp();return <article className="tw-dashboard"><Filters sticky filters={snapshot.filters??[]} queries={queries} values={filters} onChange={setFilter}/>{activeTabId==='protection'?<Protection/>:activeTabId==='history'?<History/>:activeTabId==='vehicles'?<Vehicles/>:activeTabId==='brands'?<Brands/>:activeTabId==='models'?<Models/>:<Overview/>}</article>}
