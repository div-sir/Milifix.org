/* ============================================================
   MERIDIEL — Find flights in pasted text or a boarding-pass barcode
   Pure functions, no DOM. Both return drafts in the shape
   analyzeDrafts() (csv-import.js) validates, so every source shares
   one preview → confirm flow and nothing is saved without review.
   ============================================================ */

const MONTHS = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, sept: 9, oct: 10, nov: 11, dec: 12,
};
const MONTH_RE = "(jan|feb|mar|apr|may|jun|jul|aug|sept?|oct|nov|dec)[a-z]*\\.?";

function iso(y, m, d) {
  const probe = new Date(Date.UTC(y, m - 1, d));
  if (probe.getUTCFullYear() !== y || probe.getUTCMonth() !== m - 1 || probe.getUTCDate() !== d) return null;
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

function fullYear(y) {
  const n = Number(y);
  return y.length === 2 ? 2000 + n : n;
}

/* ---------- IATA BCBP (Resolution 792) boarding-pass barcodes ----------
   "M1DOE/JANE            EABC123 TPENRTCI 0100 074Y014A0012 100" … The
   date is a day-of-year without a year, so it resolves to the most recent
   such day (a pass can be a few days early, never months). */
function dayOfYearToIso(dayOfYear, today) {
  const ref = new Date(today + "T00:00:00Z");
  for (let year = ref.getUTCFullYear() + 1; year >= ref.getUTCFullYear() - 1; year--) {
    const date = new Date(Date.UTC(year, 0, dayOfYear));
    if (date.getUTCFullYear() !== year) continue;
    const isoDate = date.toISOString().slice(0, 10);
    const ahead = (date - ref) / 86400000;
    if (ahead <= 7) return isoDate;
  }
  return null;
}

export function parseBoardingPass(data, options) {
  const opts = options || {};
  const today = opts.today || new Date().toISOString().slice(0, 10);
  const airlines = opts.airlines || new Map();
  const text = String(data || "");
  if (!/^M[1-9]/.test(text) || text.length < 58) return [];
  const legs = Number(text[1]);
  const drafts = [];
  let pos = 23;
  for (let leg = 0; leg < legs && pos + 37 <= text.length; leg++) {
    const field = (offset, length) => text.slice(pos + offset, pos + offset + length);
    const o = field(7, 3).trim();
    const d = field(10, 3).trim();
    const carrier = field(13, 3).trim();
    const number = field(16, 5).trim().replace(/^0+(?=\d)/, "");
    const day = Number(field(21, 3));
    const seat = field(25, 4).trim().replace(/^0+(?=\d)/, "");
    const varSize = parseInt(field(35, 2), 16) || 0;
    if (/^[A-Z]{3}$/.test(o) && /^[A-Z]{3}$/.test(d)) {
      drafts.push({
        date: day ? dayOfYearToIso(day, today) || "" : "",
        o, d,
        airline: airlines.get(carrier) || "",
        flightNo: carrier && number ? `${carrier} ${number}` : "",
        seat: seat === "" || /^0+$/.test(seat) ? "" : seat,
      });
    }
    pos += 37 + varSize;
  }
  return drafts;
}

/* ---------- Free text: confirmation emails, itineraries, notes ----------
   Anchors are routes ("TPE → NRT", "TPE-NRT", or a "(TPE) … (NRT)" pair).
   Each date and flight number found is attached to its nearest route. */
function findDates(text, today) {
  const found = [];
  const push = (index, length, date) => { if (date) found.push({ index, end: index + length, date }); };
  let m;
  const numeric = /(\d{4})\s*[-/.年]\s*(\d{1,2})\s*[-/.月]\s*(\d{1,2})\s*日?/g;
  while ((m = numeric.exec(text))) push(m.index, m[0].length, iso(+m[1], +m[2], +m[3]));
  const dayMonthYear = new RegExp(`\\b(\\d{1,2})\\s*${MONTH_RE}[\\s,]*(\\d{4}|\\d{2})\\b`, "gi");
  while ((m = dayMonthYear.exec(text))) push(m.index, m[0].length, iso(fullYear(m[3]), MONTHS[m[2].toLowerCase()], +m[1]));
  const monthDayYear = new RegExp(`\\b${MONTH_RE}\\s+(\\d{1,2})(?:st|nd|rd|th)?,?\\s+(\\d{4})\\b`, "gi");
  while ((m = monthDayYear.exec(text))) push(m.index, m[0].length, iso(+m[3], MONTHS[m[1].toLowerCase()], +m[2]));

  // Dates without a year ("3月14日", "14 Mar", "Mar 14") borrow the year of
  // a dated neighbour, falling back to the current year.
  const covered = (index) => found.some((f) => index >= f.index && index < f.end);
  const yearless = [];
  const cjk = /(\d{1,2})\s*月\s*(\d{1,2})\s*日/g;
  while ((m = cjk.exec(text))) if (!covered(m.index)) yearless.push({ index: m.index, length: m[0].length, month: +m[1], day: +m[2] });
  const dm = new RegExp(`\\b(\\d{1,2})\\s*${MONTH_RE}`, "gi");
  while ((m = dm.exec(text))) if (!covered(m.index)) yearless.push({ index: m.index, length: m[0].length, month: MONTHS[m[2].toLowerCase()], day: +m[1] });
  const md = new RegExp(`\\b${MONTH_RE}\\s+(\\d{1,2})\\b`, "gi");
  while ((m = md.exec(text))) if (!covered(m.index)) yearless.push({ index: m.index, length: m[0].length, month: MONTHS[m[1].toLowerCase()], day: +m[2] });
  const fallbackYear = found.length ? +found[0].date.slice(0, 4) : +today.slice(0, 4);
  yearless.forEach((y) => push(y.index, y.length, iso(fallbackYear, y.month, y.day)));
  return found.sort((a, b) => a.index - b.index);
}

function findFlightNumbers(text, airlines) {
  const found = [];
  const re = /\b([A-Z][A-Z0-9]|[0-9][A-Z])\s?(\d{1,4})\b/g;
  let m;
  while ((m = re.exec(text))) {
    if (airlines.size && !airlines.has(m[1])) continue;
    found.push({ index: m.index, code: m[1], flightNo: `${m[1]} ${Number(m[2])}` });
  }
  return found;
}

function findRoutes(text, airports) {
  const routes = [];
  const taken = [];
  const overlaps = (a, b) => taken.some(([s, e]) => a < e && b > s);
  let m;
  const arrow = /\b([A-Z]{3})\b\s*(?:→|->|⇒|➔|✈|>|—|–|-|~|〜|～|\/|\bto\b|至|到)\s*\b([A-Z]{3})\b/g;
  while ((m = arrow.exec(text))) {
    if (airports[m[1]] && airports[m[2]] && m[1] !== m[2]) {
      routes.push({ index: m.index, end: m.index + m[0].length, o: m[1], d: m[2] });
      taken.push([m.index, m.index + m[0].length]);
    }
    arrow.lastIndex = m.index + 3; // allow chained legs: TPE-NRT-HND
  }
  // "Taipei TPE → Tokyo NRT": two codes on one line with an arrow between.
  const lineRe = /[^\n]+/g;
  while ((m = lineRe.exec(text))) {
    const lineStart = m.index;
    const codes = [];
    const codeRe = /\b[A-Z]{3}\b/g;
    let c;
    while ((c = codeRe.exec(m[0]))) {
      const at = lineStart + c.index;
      if (airports[c[0]] && !overlaps(at, at + 3)) codes.push({ index: at, code: c[0] });
    }
    for (let i = 0; i + 1 < codes.length; i++) {
      const a = codes[i], b = codes[i + 1];
      const between = text.slice(a.index + 3, b.index);
      if (a.code !== b.code && /→|->|⇒|➔|✈|—|–|\bto\b/.test(between) && between.length < 80) {
        routes.push({ index: a.index, end: b.index + 3, o: a.code, d: b.code });
        taken.push([a.index, b.index + 3]);
        i++;
      }
    }
  }
  // "Taipei (TPE) … Tokyo (NRT)": pair parenthesised codes in reading order.
  const codes = [];
  const paren = /\(\s*([A-Z]{3})\s*\)/g;
  while ((m = paren.exec(text))) {
    if (airports[m[1]] && !overlaps(m.index, m.index + m[0].length)) codes.push({ index: m.index, end: m.index + m[0].length, code: m[1] });
  }
  for (let i = 0; i + 1 < codes.length; i += 2) {
    const a = codes[i], b = codes[i + 1];
    if (a.code !== b.code && b.index - a.end < 240) routes.push({ index: a.index, end: b.end, o: a.code, d: b.code });
    else i -= 1; // re-pair starting from b
  }
  return routes.sort((a, b) => a.index - b.index);
}

// Pick the token for route i: the closest one on the same line, else the
// last one between the previous route and this one (a date heading above
// its legs), else none.
function pickToken(tokens, routes, i, lineOf) {
  const r = routes[i];
  const line = lineOf(r.index);
  const sameLine = tokens.filter((tok) => lineOf(tok.index) === line);
  if (sameLine.length) {
    const dist = (tok) => (tok.index < r.index ? r.index - tok.index : Math.max(0, tok.index - r.end));
    return sameLine.reduce((best, tok) => (dist(tok) < dist(best) ? tok : best));
  }
  const floor = i > 0 ? routes[i - 1].end : 0;
  const before = tokens.filter((tok) => tok.index >= floor && tok.index < r.index);
  return before.length ? before[before.length - 1] : null;
}

export function extractFlightsFromText(input, options) {
  const opts = options || {};
  const today = opts.today || new Date().toISOString().slice(0, 10);
  const airports = opts.airports || {};
  const airlines = opts.airlines || new Map();
  const text = String(input || "").normalize("NFKC");
  if (!text.trim()) return [];

  // A pasted boarding-pass barcode string.
  const bcbp = text.trim().match(/^M[1-9].{56,}/);
  if (bcbp) {
    const drafts = parseBoardingPass(bcbp[0], { today, airlines });
    if (drafts.length) return drafts;
  }

  const routes = findRoutes(text, airports);
  if (!routes.length) return [];
  const dates = findDates(text, today);
  const numbers = findFlightNumbers(text, airlines);

  const breaks = [];
  for (let i = 0; i < text.length; i++) if (text[i] === "\n") breaks.push(i);
  const lineOf = (index) => { let n = 0; while (n < breaks.length && breaks[n] < index) n++; return n; };
  const drafts = routes.map((r, i) => {
    const date = pickToken(dates, routes, i, lineOf);
    const number = pickToken(numbers, routes, i, lineOf);
    return {
      date: date ? date.date : "",
      o: r.o, d: r.d,
      airline: number ? airlines.get(number.code) || "" : "",
      flightNo: number ? number.flightNo : "",
    };
  });
  // A leg with no date of its own inherits the previous leg's (connections
  // listed under one day heading).
  drafts.forEach((draft, i) => { if (!draft.date && i > 0) draft.date = drafts[i - 1].date; });
  return drafts;
}
