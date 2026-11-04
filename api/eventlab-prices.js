const EVENTS = {
 AAPL: [
  {date:"2022-09-07",title:"Far Out · iPhone 14"},
  {date:"2023-09-12",title:"Wonderlust · iPhone 15"},
  {date:"2024-09-09",title:"It's Glowtime · iPhone 16"},
  {date:"2025-09-09",title:"Awe Dropping · iPhone 17"}
 ],
 TSLA: [
  {date:"2023-11-30",title:"Cybertruck Delivery Event"},
  {date:"2024-10-10",title:"We, Robot"}
 ]
};
export default async function handler(req,res) {
 res.setHeader("Cache-Control","s-maxage=900, stale-while-revalidate=1800");
 const symbol=String(req.query.ticker||"AAPL").toUpperCase();
 if(!["AAPL","TSLA"].includes(symbol)) return res.status(400).json({error:"Only AAPL and TSLA are supported"});
 try {
  const url="https://query1.finance.yahoo.com/v8/finance/chart/"+symbol+"?range=5y&interval=1d&events=history";
  const response=await fetch(url,{headers:{"User-Agent":"Mozilla/5.0 (compatible; EventLab/1.0)","Accept":"application/json"},signal:AbortSignal.timeout(12000)});
  if(!response.ok) throw new Error("Market provider HTTP "+response.status);
  const json=await response.json();
  const data=json.chart?.result?.[0], quote=data?.indicators?.quote?.[0];
  if(!data||!quote) throw new Error("No market records returned");
  const dates=data.timestamp||[];
  const bars=dates.map((unix,i)=>({date:new Date(unix*1000).toLocaleDateString("en-CA",{timeZone:"America/New_York"}),open:quote.open?.[i],high:quote.high?.[i],low:quote.low?.[i],close:quote.close?.[i],volume:quote.volume?.[i]})).filter(b=>[b.open,b.high,b.low,b.close].every(Number.isFinite));
  if(!bars.length) throw new Error("No valid trading days");
  return res.status(200).json({ticker:symbol,bars,events:EVENTS[symbol],source:"Yahoo Finance historical OHLC (unadjusted)",latest:bars.at(-1).date});
 } catch(e) {
  return res.status(502).json({error:"Cannot load market history: "+e.message});
 }
}
