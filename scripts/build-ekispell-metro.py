"""Map reviewed official Metro stop sequences to exact pinned StationAPI identities.

Input evidence is a manually reviewed factual station-order transcription, not a
copy of the official maps. Never join branches by their position in the HTML table.
"""
import json
from pathlib import Path
root=Path(__file__).resolve().parents[1]
manifest=json.loads((root/'public/ekispell/data/stationapi/manifest.json').read_text())
assert manifest['revision']=='bf6f92d08c6346253713a754944085c526ec6645', 'Review topology against the new StationAPI revision first'
evidence=json.loads((root/'integrations/ekispell/metro-evidence.json').read_text())
rows=[r for p in sorted((root/'public/ekispell/data/stationapi').glob('pref-*.json')) for r in json.loads(p.read_text())]
line_ids=dict(zip(['ginza','marunouchi','hibiya','tozai','chiyoda','yurakucho','hanzomon','namboku','fukutoshin'],['28001','28002','28003','28004','28005','28006','28008','28009','28010']))
aliases={'麹町':'麴町','二重橋前〈丸の内〉':'二重橋前'}
assert {item['slug'] for item in evidence}==set(line_ids) and len(evidence)==9
lines=[]
for item in evidence:
    line_id=line_ids[item['slug']]
    stops=[]
    for code,name in item['stops']:
        matches=[r for r in rows if r[2]=='18' and r[1]==aliases.get(name,name) and any(m[1]==line_id for m in r[4])]
        assert len(matches)==1,(line_id,code,name,[r[1] for r in rows if any(m[1]==line_id for m in r[4])])
        stops.append({'code':code,'id':'stationapi:'+matches[0][0],'name':matches[0][1]})
    if item['slug']=='marunouchi':
        main=[s['id'] for s in stops if s['code'].startswith('M')]
        branch=[s['id'] for s in stops if s['code'].startswith('m')]+[next(s['id'] for s in stops if s['code']=='M06')]
        chains=[main,branch]
    else: chains=[[s['id'] for s in stops]]
    assert set(s['id'] for s in stops)==set(i for c in chains for i in c)
    lines.append({'id':'stationapi:'+line_id,'source':item['source'],'checkedAt':item['checkedAt'],'stops':stops,'chains':chains})
data={'schemaVersion':1,'revision':'bf6f92d08c6346253713a754944085c526ec6645','checkedAt':'2026-09-17','operator':'東京メトロ','scope':'Ordinary trains within Tokyo Metro only. No through service beyond the listed endpoints. No station-group walking or gate-free transfers inferred.','icSource':'https://www.tokyometro.jp/ticket/types/pasmo/index.html','lines':lines}
for folder in ['integrations/ekispell','public/ekispell']:
 (root/folder/'metro-topology.json').write_text(json.dumps(data,ensure_ascii=False,separators=(',',':'))+'\n')
print(len({s['id'] for l in lines for s in l['stops']}),'stations;',sum(len(c)-1 for l in lines for c in l['chains']),'adjacent connections')
