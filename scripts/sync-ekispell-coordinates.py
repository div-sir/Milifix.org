"""Project coordinates only for the pinned, deployed StationAPI station identities."""
import csv, json, math, subprocess, sys
from pathlib import Path
root = Path(__file__).resolve().parents[1]
source = Path(sys.argv[1])
revision = 'bf6f92d08c6346253713a754944085c526ec6645'
assert subprocess.check_output(['git','-C',str(source),'rev-parse','HEAD'], text=True).strip() == revision
assert not subprocess.check_output(['git','-C',str(source),'status','--porcelain'], text=True).strip()
rows = {r['station_cd']:r for r in csv.DictReader((source/'data/3!stations.csv').open())}
points = {}
for path in sorted((root/'public/ekispell/data/stationapi').glob('pref-*.json')):
    for identity, name, company, group, members in json.loads(path.read_text()):
        for station_id, line_id in members:
            r = rows[station_id]
            assert r['station_name'] == name and r['station_g_cd'] == group and r['line_cd'] == line_id
            lat, lon = float(r['lat']), float(r['lon'])
            if math.isfinite(lat) and math.isfinite(lon) and 20 <= lat <= 46 and 122 <= lon <= 154:
                points[identity] = [lat, lon]
                break
out = root/'integrations/ekispell/coordinates.json'
out.write_text(json.dumps({'revision':revision,'points':points},ensure_ascii=False,separators=(',',':'))+'\n')
print(f'{len(points)} station coordinates')
