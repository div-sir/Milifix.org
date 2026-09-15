import { matchMessage, buildSequence, renderPreview, graphemes, cellWidth, validateCatalog, validateBundle, createDraft, restoreDraft } from './dist/index.js';
import { sampleBundle, demoProfile } from './dist/sample.js';
import { loadRealCatalog } from './real-data.js';
const prefectureNames = '北海道 青森 岩手 宮城 秋田 山形 福島 茨城 栃木 群馬 埼玉 千葉 東京 神奈川 新潟 富山 石川 福井 山梨 長野 岐阜 靜岡 愛知 三重 滋賀 京都 大阪 兵庫 奈良 和歌山 鳥取 島根 岡山 廣島 山口 德島 香川 愛媛 高知 福岡 佐賀 長崎 熊本 大分 宮崎 鹿兒島 沖繩'.split(' ');
const regionName = r => /^JP-\d{2}$/.test(r) ? prefectureNames[Number(r.slice(3))-1] ?? r : r;
const $ = id => document.getElementById(id);
let bundle = sampleBundle;
let stations = bundle.stations;
let stationById = new Map(stations.map(s => [s.id, s]));
let selections = {};
let draft = null;
let starting = true;
let catalogRevision = 0;
let exportText = '';
const savedKey = 'ekispell-draft-v1';
let saved = null;
try { saved = JSON.parse(localStorage.getItem(savedKey) || 'null'); } catch { /* Storage is optional. */ }
function saveLocal() {
  if (starting || !draft) return;
  if (!['stationapi-japan', sampleBundle.id].includes(bundle.id)) {
    $('save-status').textContent = '自訂資料請下載 JSON 草稿與站名資料備份。'; return;
  }
  try {
    localStorage.setItem(savedKey, JSON.stringify(draft));
    $('save-status').textContent = '已自動保存在此瀏覽器；草稿不會上傳。';
  } catch { $('save-status').textContent = '瀏覽器無法保存，請下載 JSON 備份。'; }
}
const element = (tag, text, className) => {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  if (className) node.className = className;
  return node;
};
function render() {
  stationById = new Map(stations.map(s => [s.id, s]));
  $('error').textContent = '';
  $('column').disabled = $('alignment').value !== 'fixed';
  try {
    const activeProfile = bundle.profiles.find(p => p.id === $('profile').value);
    if (!activeProfile) throw new Error('請選擇列印格式');
    const options = { profileId: activeProfile.id, region: $('region').value, verifiedOnly: $('verified').checked, icSupportedOnly: $('ic-supported').checked };
    if ($('ic-card').value) options.icCard = $('ic-card').value;
    const covered = stations.filter(s => s.ic?.status === 'supported' && (!options.icCard || s.ic.cards.includes(options.icCard))).length;
    $('ic-summary').textContent = `${covered} / ${stations.length} 筆站點有符合卡種的支援依據；未列入不等於不支援。指定卡種會直接篩選。`;
    if ($('alignment').value === 'fixed') options.column = Number($('column').value) - 1;
    const slots = matchMessage($('message').value, stations, options);
    const sequence = buildSequence(slots, selections);
    const profile = { ...activeProfile, order: $('order').value };
    const preview = renderPreview(sequence, profile, $('field').value);
    draft = createDraft($('message').value, bundle, options, selections, $('field').value, profile.order);
    $('receipt-profile').textContent = profile.name;
    $('profile-note').replaceChildren(document.createTextNode(`${profile.maxRows} 筆 · 每欄 ${profile.fieldCells} 格 · ${draft.profile.verification === 'receipt-verified' ? '有收據佐證（資料提供者標記）' : '格式未驗證'}`));
    if (profile.evidence) $('profile-note').append(sourceLink('格式佐證', profile.evidence));
    $('candidates').replaceChildren();
    slots.forEach((slot, index) => {
      const row = element('div', undefined, 'candidate');
      row.append(element('span', slot.character === ' ' ? '␠' : slot.character, 'glyph'));
      const content = element('div');
      if (!slot.candidates.length) content.append(element('p', options.verifiedOnly ? '目前沒有收據已驗證印字。取消「僅使用收據已驗證」可查看推測。' : '此字沒有符合的站點。可放寬地區、卡種或固定位置，或改寫文字。', 'missing'));
      else {
        const label = element('label', `第 ${index + 1} 字 · ${slot.candidates.length} 個候選`);
        label.htmlFor = `candidate-${index}`;
        const select = element('select'); select.id = label.htmlFor;
        slot.candidates.forEach((candidate, i) => {
          const option = element('option', `${candidate.text} · ${stationById.get(candidate.stationId)?.operator ?? ''} · 第 ${candidate.column + 1} 格 · ${candidate.verification === 'unverified' ? '未驗證' : '已驗證'}`);
          option.value = String(i); select.append(option);
        });
        select.value = String(selections[index] ?? 0);
        select.addEventListener('change', () => { selections[index] = Number(select.value); render(); $(`candidate-${index}`).focus(); });
        const search = element('input'); search.type = 'search';
        search.placeholder = '搜尋此字的車站、業者或路線'; search.setAttribute('aria-label', `搜尋第 ${index + 1} 字候選站`);
        const countNote = element('p', '', 'hint');
        const allOptions = [...select.options];
        search.addEventListener('input', () => {
          const query = search.value.trim().normalize('NFKC').toLowerCase();
          const current = select.value;
          const filtered = allOptions.filter(option => {
            const c = slot.candidates[Number(option.value)];
            const station = stationById.get(c.stationId);
            return `${station.name} ${station.operator} ${station.lines?.map(l => l.name).join(' ') ?? ''} ${c.text}`.normalize('NFKC').toLowerCase().includes(query);
          });
          // Keep the current choice until the user explicitly selects another station.
          const currentOption = allOptions.find(o => o.value === current);
          select.replaceChildren(...(filtered.includes(currentOption) ? filtered : [currentOption, ...filtered]));
          select.value = current;
          countNote.textContent = `${filtered.length} 個搜尋結果；目前選站保持不變。`;
        });
        content.append(label, search, countNote, select);
        const selected = slot.candidates[selections[index] ?? 0];
        const station = stationById.get(selected.stationId);
        const printed = station.labels.find(l => l.id === selected.labelId);
        const source = element('p', `${station.operator} · ${station.name}${station.lines?.length ? " · " + station.lines.map(l => l.name).join("／") : ""} · `, 'source');
        source.append(sourceLink('正式站名來源', station.nameSource));
        if (printed.evidence) source.append(document.createTextNode(' · '), sourceLink('列印佐證', printed.evidence));
        else source.append(document.createTextNode(' · 列印名稱尚無佐證'));
        if (printed.inference) source.append(document.createTextNode(' · ' + printed.inference));
        const ic = station.ic;
        source.append(document.createTextNode(ic?.status === 'supported' ? ' · IC：官方規則涵蓋（資料提供者標記）' : ic?.status === 'unsupported' ? ' · IC：指定卡種不支援' : ' · IC：未知'));
        if (ic && ic.status !== 'unknown') {
          source.append(document.createTextNode(` · ${ic.cards.join('／')} · 查核 ${ic.checkedAt} · ${ic.scope} · `), sourceLink('IC 依據', ic.source));
        }
        const details = element('details'); details.append(element('summary', '查看來源、IC 卡與印字依據'), source);
        content.append(details);
      }
      row.append(content); $('candidates').append(row);
    });
    $('rows').replaceChildren();
    preview.rows.forEach((row, i) => {
      const tr = element('tr'); tr.append(element('td', String(i + 1).padStart(2, '0')));
      for (const field of ['entry', 'exit']) {
        const td = element('td');
        if (field !== preview.field) td.textContent = '—';
        else if (!row.selected) td.textContent = '［未匹配］';
        else {
          const label = element('span', undefined, 'print-label');
          graphemes(row.selected.text).forEach((g, index) => {
            const cell = element('span'); cell.style.width = `${cellWidth(g)}ch`;
            cell.append(element(index === row.selected.graphemeIndex ? 'mark' : 'span', g)); label.append(cell);
          }); td.append(label);
        }
        tr.append(td);
      }
      $('rows').append(tr);
    });
    const count = sequence.filter(row => row.selected).length;
    $('status').textContent = `${count} / ${sequence.length} 字已匹配 · ${preview.overflow ? '超過示意格式筆數' : '預覽由上往下閱讀'}`;
    $('sequence').textContent = `紀錄建立順序（僅排字）：${preview.chronologicalRows.map(row => row.selected?.stationName ?? '？').join(' → ') || '請輸入文字'}`;
    $('warnings').replaceChildren();
    if (preview.overflow) $('warnings').append(element('li', `超過此格式的 ${profile.maxRows} 筆上限；所有列仍保留供檢查。`));
    if (preview.warnings.some(w => w.includes('field width'))) $('warnings').append(element('li', '部分名稱超過欄位寬度。請確認設備的截斷規則。'));
    exportText = ['EkiSpell 排字規劃（非可行乘車行程）', `文字：${draft.message}`, `格式：${profile.name}`, `卡種：${options.icCard || '不限'}`, '', ...preview.chronologicalRows.map((row, i) => {
      if (!row.selected) return `${i + 1}. ${row.character}：未匹配`;
      const station = stationById.get(row.selected.stationId);
      return `${i + 1}. ${row.character}：${station.name}／${station.operator}／${station.lines?.map(l => l.name).join('、') || '路線未知'}；印字 ${row.selected.text}（${row.selected.verification === 'receipt-verified' ? '有佐證' : '未驗證'}）`;
    }), '', '另一端車站、票價、連接行程與實際印字仍須確認。'].join('\n');
    $('text-export').disabled = !sequence.length;
    $('print-preview').disabled = !sequence.length;
    $('download').disabled = !sequence.length;
    saveLocal();
  } catch (error) {
    exportText = ''; $('text-export').disabled = true; $('print-preview').disabled = true;
    draft = null; $('error').textContent = error.message;
    $('rows').replaceChildren(); $('candidates').replaceChildren(); $('warnings').replaceChildren();
    $('status').textContent = '無法建立預覽'; $('sequence').textContent = ''; $('download').disabled = true;
  }
}
function sourceLink(title, value) {
  try {
    const url = new URL(value);
    if (!['http:', 'https:'].includes(url.protocol)) throw new Error('Not a web link');
    const link = element('a', title); link.href = url.href; link.target = '_blank'; link.rel = 'noopener noreferrer'; return link;
  } catch { return element('span', `${title}：${value}`); }
}
function updateControls(profileId = bundle.profiles[0].id) {
  $('profile').replaceChildren(...bundle.profiles.map(p => new Option(p.name, p.id)));
  $('profile').value = profileId;
  $('region').replaceChildren(new Option('全部', ''), ...[...new Set(stations.map(s => s.region))].map(r => new Option(regionName(r), r)));
  const profile = bundle.profiles.find(p => p.id === profileId);
  $('order').value = profile.order;
  $('column').max = String(profile.fieldCells);
  $('catalog-note').textContent = `${stations.length} 站 · ${bundle.id} / ${bundle.version}。未匹配的字會保留空位。`;
}
for (const id of ['message', 'region', 'alignment', 'column', 'verified', 'ic-supported', 'ic-card']) {
  $(id).addEventListener(id === 'message' || id === 'column' ? 'input' : 'change', () => { selections = {}; $('import-status').textContent = ''; render(); });
}
for (const id of ['field', 'order']) $(id).addEventListener('change', render);
$('profile').addEventListener('change', () => {
  selections = {}; const profile = bundle.profiles.find(p => p.id === $('profile').value);
  $('order').value = profile.order; $('column').max = String(profile.fieldCells); render();
});
async function readJson(input) {
  const file = input.files[0];
  if (!file) return undefined;
  if (file.size > 12_000_000) throw new Error('資料檔上限為 12 MB');
  return JSON.parse(await file.text());
}
$('catalog').addEventListener('change', async () => {
  try {
    const data = await readJson($('catalog')); if (data === undefined) return;
    let next = data;
    if (Array.isArray(data)) {
      validateCatalog(data);
      const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(JSON.stringify(data)));
      const version = Array.from(new Uint8Array(digest), n => n.toString(16).padStart(2, '0')).join('');
      next = { schemaVersion: 1, id: 'legacy-local', version, profiles: [demoProfile], stations: data };
    }
    validateBundle(next);
    catalogRevision++;
    bundle = next; stations = bundle.stations; selections = {}; updateControls(); render();
    $('import-status').textContent = '站名資料已載入。';
  } catch (error) { $('error').textContent = `匯入失敗，保留原資料：${error.message}`; }
  $('catalog').value = '';
});
function applyDraft(data) {
    const restored = restoreDraft(data, bundle);
    const d = restored.draft;
    // Commit UI state only after the complete draft has validated.
    updateControls(d.profile.id);
    if (d.options.region && ![...$('region').options].some(o => o.value === d.options.region)) $('region').add(new Option(d.options.region, d.options.region));
    $('message').value = d.message; $('region').value = d.options.region ?? '';
    $('field').value = d.field; $('order').value = d.profile.order;
    $('alignment').value = d.options.column === undefined ? 'any' : 'fixed';
    $('column').value = String((d.options.column ?? 5) + 1);
    if (d.options.icCard && ![...$('ic-card').options].some(o => o.value === d.options.icCard)) $('ic-card').add(new Option(d.options.icCard, d.options.icCard));
    $('ic-card').value = d.options.icCard ?? '';
    $('ic-supported').checked = d.options.icSupportedOnly ?? false;
    $('verified').checked = d.options.verifiedOnly ?? false;
    selections = restored.selections; render();
}
$('draft-file').addEventListener('change', async () => {
  try {
    const data = await readJson($('draft-file')); if (data === undefined) return;
    applyDraft(data);
    $('import-status').textContent = data.schemaVersion === 1 ? '舊版草稿已重新驗證並轉為新版。' : '草稿已還原，候選站已重新驗證。';
  } catch (error) { $('error').textContent = `草稿匯入失敗，保留目前內容：${error.message}`; }
  $('draft-file').value = '';
});
$('reset').addEventListener('click', () => {
  catalogRevision++;
  bundle = sampleBundle; stations = bundle.stations; selections = {}; updateControls(); render();
  $('import-status').textContent = '已恢復示範資料。';
});
function downloadJson(value, name) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(value, null, 2)], { type: 'application/json' }));
  const link = element('a'); link.href = url; link.download = name; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
async function loadStations() {
  const request = ++catalogRevision;
  $('load-real').disabled = true; $('real-status').textContent = '正在載入及校驗全國站名資料…';
  try {
    const next = await loadRealCatalog();
    if (request !== catalogRevision) return;
    bundle = next; stations = bundle.stations; selections = {}; updateControls(); render();
    $('real-status').textContent = `已載入 ${stations.length.toLocaleString()} 筆車站資料（依營運公司分組）。站名為社群資料；IC 列印未驗證。`;
  } catch (error) { $('real-status').textContent = `載入失敗，保留目前資料：${error.message}`; }
  finally { $('load-real').disabled = false; }
}
$('load-real').addEventListener('click', loadStations);
$('download').addEventListener('click', () => { if (draft) downloadJson(draft, 'ekispell-draft.json'); });
$('export-catalog').addEventListener('click', () => downloadJson(bundle, 'ekispell-catalog.json'));
$('text-export').addEventListener('click', () => {
  const url = URL.createObjectURL(new Blob([exportText], {type:'text/plain;charset=utf-8'}));
  const link = element('a'); link.href = url; link.download = 'ekispell-plan.txt'; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});
$('print-preview').addEventListener('click', () => window.print());
$('clear-saved').addEventListener('click', () => {
  try { localStorage.removeItem(savedKey); $('save-status').textContent = '已刪除瀏覽器草稿；再次編輯後會重新保存。'; }
  catch { $('save-status').textContent = '無法存取瀏覽器儲存空間。'; }
});
updateControls();
render();
async function start() {
  if (!saved || saved.catalog?.id === 'stationapi-japan') await loadStations();
  if (saved) {
    try { applyDraft(saved); $('save-status').textContent = '已還原上次草稿，並重新驗證選站。'; }
    catch { $('save-status').textContent = '上次草稿版本不符或已損壞；保留原備份，請下載目前草稿後再編輯。'; }
  }
  starting = false;
}
start();
