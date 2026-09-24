/* ============================================================
   MERIDIEL — CSV flight import (pure, no DOM)
   Parses a user's CSV into validated flight drafts. Nothing here
   touches state: the caller previews the result and commits every
   accepted row in one update, so a bad file never leaves half an
   import behind. Issues are { code, params } so the UI can
   translate them; see the err.* / warn.* / dup.* keys in i18n.js.
   ============================================================ */

export const MAX_IMPORT_ROWS = 5000;
const FIELD_MAX = { airline: 80, craft: 80, seat: 16, flightNo: 16, reg: 16, notes: 500 };

// Header aliases, compared after lowercasing and dropping spaces/_/-.
const HEADER_ALIASES = {
  date: ["date", "flightdate", "日期", "日付", "搭乘日期", "搭乗日"],
  o: ["from", "origin", "o", "dep", "departure", "出發", "出發地", "出发", "起點", "出発", "出発地"],
  d: ["to", "destination", "dest", "d", "arr", "arrival", "抵達", "目的地", "到達", "到着", "到着地"],
  airline: ["airline", "carrier", "航空公司", "航空会社"],
  craft: ["aircraft", "craft", "plane", "機型", "机型", "機材"],
  seat: ["seat", "座位", "座席"],
  flightNo: ["flightno", "flightnumber", "flight", "航班", "航班編號", "航班号", "便名"],
  reg: ["registration", "reg", "tail", "註冊編號", "機身編號", "機体記号"],
  notes: ["notes", "note", "memo", "備註", "备注", "メモ"],
};
const REQUIRED = ["date", "o", "d"];
const COLUMN_NAMES = { date: "date", o: "from", d: "to" };

export const CSV_TEMPLATE =
  "date,from,to,airline,aircraft,seat,flight_no,registration,notes\r\n" +
  "2025-03-14,TPE,NRT,China Airlines,Airbus A350,32A,CI 100,,Cherry blossom trip\r\n" +
  "2025-03-20,NRT,TPE,EVA Air,Boeing 787,41K,BR 197,,\r\n";

function normHeader(h) {
  return String(h || "").replace(/^\uFEFF/, "").trim().toLowerCase().replace(/[\s_\-.]/g, "");
}

function detectDelimiter(firstLine) {
  const counts = { ",": 0, ";": 0, "\t": 0 };
  let quoted = false;
  for (const ch of firstLine) {
    if (ch === '"') quoted = !quoted;
    else if (!quoted && ch in counts) counts[ch]++;
  }
  const best = Object.keys(counts).sort((a, b) => counts[b] - counts[a])[0];
  return counts[best] > 0 ? best : ",";
}

// RFC 4180-style parser: quoted fields, "" escapes, CR/LF/CRLF line breaks and
// newlines inside quotes. Each row remembers the physical line it started on
// so error messages point at the line the user sees in their editor.
export function parseCsv(text) {
  const src = String(text || "").replace(/^\uFEFF/, "");
  const firstBreak = src.search(/\r|\n/);
  const delim = detectDelimiter(firstBreak === -1 ? src : src.slice(0, firstBreak));
  const rows = [];
  let field = "", row = [], quoted = false, line = 1, rowLine = 1;
  const endRow = () => {
    row.push(field);
    if (row.some((cell) => cell.trim() !== "")) rows.push({ line: rowLine, cells: row });
    row = []; field = "";
  };
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (quoted) {
      if (ch === '"') {
        if (src[i + 1] === '"') { field += '"'; i++; }
        else quoted = false;
      } else {
        if (ch === "\n" || (ch === "\r" && src[i + 1] !== "\n")) line++;
        field += ch;
      }
    } else if (ch === '"' && field.trim() === "") {
      field = ""; quoted = true;
    } else if (ch === delim) {
      row.push(field); field = "";
    } else if (ch === "\r" || ch === "\n") {
      if (ch === "\r" && src[i + 1] === "\n") i++;
      endRow();
      line++; rowLine = line;
    } else {
      field += ch;
    }
  }
  if (field !== "" || row.length) endRow();
  return rows;
}

// Accepts YYYY-MM-DD, YYYY/M/D and YYYY.M.D; returns ISO or null for
// anything that is not a real calendar date.
export function normalizeDate(value) {
  const m = String(value || "").trim().match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
  if (!m) return null;
  const y = +m[1], mo = +m[2], d = +m[3];
  if (y < 1900 || mo < 1 || mo > 12 || d < 1) return null;
  const probe = new Date(Date.UTC(y, mo - 1, d));
  if (probe.getUTCMonth() !== mo - 1 || probe.getUTCDate() !== d) return null;
  return `${m[1]}-${String(mo).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

function normFlightNo(v) { return String(v || "").replace(/\s+/g, "").toUpperCase(); }

// Two records describe the same flight when date, route and flight number
// all match (a missing flight number only matches another missing one).
export function flightKey(f) {
  return [f.date, String(f.o || "").toUpperCase(), String(f.d || "").toUpperCase(), normFlightNo(f.flightNo)].join("|");
}

function mapHeader(cells) {
  const map = {};
  cells.forEach((cell, idx) => {
    const h = normHeader(cell);
    for (const [key, aliases] of Object.entries(HEADER_ALIASES)) {
      if (map[key] == null && aliases.some((a) => normHeader(a) === h)) { map[key] = idx; break; }
    }
  });
  return map;
}

/**
 * @param {string} text      raw CSV
 * @param {object} options   { airports: {IATA: {...}}, existing: flight[], today: "YYYY-MM-DD" }
 * @returns {{
 *   fatal: { code: string, params: object } | null,
 *   rows: Array<{ line: number, status: string, issues: Array<{ code: string, params: object }>, record: object | null }>,
 *   flights: Array<Record<string, string>>,
 *   counts: { ok: number, warning: number, rejected: number, duplicate: number },
 * }}
 */
export function analyzeCsv(text, options) {
  const opts = options || {};
  const empty = { ok: 0, warning: 0, rejected: 0, duplicate: 0 };
  const fail = (code, params) => ({ fatal: { code, params: params || {} }, rows: [], flights: [], counts: empty });

  const parsed = parseCsv(text);
  if (!parsed.length) return fail("err.empty");
  const header = mapHeader(parsed[0].cells);
  const missing = REQUIRED.filter((k) => header[k] == null);
  if (missing.length) return fail("err.noHeader", { columns: missing.map((k) => COLUMN_NAMES[k]).join(", ") });
  const body = parsed.slice(1);
  if (!body.length) return fail("err.empty");
  if (body.length > MAX_IMPORT_ROWS) return fail("err.tooManyRows", { max: MAX_IMPORT_ROWS });

  const drafts = body.map(({ line, cells }) => {
    const raw = {};
    Object.keys(HEADER_ALIASES).forEach((key) => {
      raw[key] = header[key] == null ? "" : String(cells[header[key]] || "").trim();
    });
    return { line, raw };
  });
  return analyzeDrafts(drafts, opts);
}

/**
 * Validate and de-duplicate flight drafts from any source (CSV rows, pasted
 * text, scanned boarding passes). `line` is whatever position the UI shows.
 * @param {Array<{ line: number, raw: Record<string, string> }>} drafts
 * @param {object} options   { airports, existing, today }
 */
export function analyzeDrafts(drafts, options) {
  const opts = options || {};
  const airports = opts.airports || {};
  const today = opts.today || new Date().toISOString().slice(0, 10);
  const seen = new Map();
  (opts.existing || []).forEach((f) => { if (f && f.date) seen.set(flightKey(f), 0); });

  const rows = drafts.map(({ line, raw }) => {
    const get = (key) => String((raw && raw[key]) || "").trim();
    const issues = [];
    const rawDate = get("date");
    const date = normalizeDate(rawDate);
    const o = get("o").toUpperCase();
    const d = get("d").toUpperCase();

    if (!rawDate) issues.push({ code: "err.missingDate", params: {} });
    else if (!date) issues.push({ code: "err.badDate", params: { value: rawDate } });
    if (!airports[o]) issues.push({ code: "err.unknownAirport", params: { value: get("o") } });
    if (!airports[d]) issues.push({ code: "err.unknownAirport", params: { value: get("d") } });
    if (o && o === d) issues.push({ code: "err.sameAirport", params: { value: o } });
    if (issues.length) return { line, status: "rejected", issues, record: null, raw };

    const record = { date, o, d };
    const labels = { airline: "airline", craft: "aircraft", seat: "seat", flightNo: "flight_no", reg: "registration", notes: "notes" };
    Object.keys(FIELD_MAX).forEach((key) => {
      let v = get(key);
      if (v.length > FIELD_MAX[key]) {
        v = v.slice(0, FIELD_MAX[key]);
        issues.push({ code: "warn.fieldTruncated", params: { field: labels[key], max: FIELD_MAX[key] } });
      }
      record[key] = v;
    });
    if (date > today) issues.push({ code: "warn.futureDate", params: { value: date } });

    const key = flightKey(record);
    if (seen.has(key)) {
      const first = seen.get(key);
      return {
        line, record, raw,
        status: "duplicate",
        issues: [first ? { code: "dup.inFile", params: { line: first } } : { code: "dup.existing", params: {} }],
      };
    }
    seen.set(key, line);
    return { line, record, raw, status: issues.length ? "warning" : "ok", issues };
  });

  const counts = { ok: 0, warning: 0, rejected: 0, duplicate: 0 };
  rows.forEach((r) => { counts[r.status]++; });
  return {
    fatal: null,
    rows,
    flights: rows.filter((r) => r.status === "ok" || r.status === "warning").map((r) => r.record),
    counts,
  };
}
