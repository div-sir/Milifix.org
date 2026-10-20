/* ============================================================
   MERIDIEL — Modals: Share card, Add flight, Present overlay
   ============================================================ */
import { UI } from "./ui-registry.js";
import { ATLAS } from "./data.js";
import { t } from "./i18n.js";
import { AIRPORT_ALIASES } from "./airport-aliases.js";
import { analyzeCsv, analyzeDrafts, CSV_TEMPLATE } from "./csv-import.js";
import { extractFlightsFromText, parseBoardingPass } from "./text-import.js";


/* ---------- Share Card modal ---------- */
let html2canvasPromise = null;

function loadHtml2Canvas() {
  if (window.html2canvas) return Promise.resolve(window.html2canvas);
  if (html2canvasPromise) return html2canvasPromise;

  html2canvasPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = new URL("vendor/html2canvas.min.js?v=20260715d", document.baseURI).href;
    script.async = true;
    script.onload = () => window.html2canvas
      ? resolve(window.html2canvas)
      : reject(new Error("html2canvas did not initialize"));
    script.onerror = () => reject(new Error("html2canvas failed to load"));
    document.head.appendChild(script);
  }).catch((error) => {
    html2canvasPromise = null;
    throw error;
  });

  return html2canvasPromise;
}

function ShareModal({ flights, account, onClose, pushToast }) {
  const cardRef = React.useRef(null);
  const [busy, setBusy] = React.useState(false);
  const s = React.useMemo(() => ATLAS.statsFor(flights), [flights]);
  const countries = React.useMemo(() => ATLAS.countryList(flights), [flights]);
  const prof = ATLAS.profile;
  const name = (account && account.name) || prof.name;
  const handle = (account && account.handle) || prof.handle;

  const exportPng = async () => {
    if (!cardRef.current) return;
    setBusy(true);
    try {
      const html2canvas = await loadHtml2Canvas();
      const canvas = await html2canvas(cardRef.current, {
        scale: 2, backgroundColor: null, useCORS: true, logging: false,
      });
      const a = document.createElement("a");
      a.download = `meridiel-${handle.replace("@", "")}.png`;
      a.href = canvas.toDataURL("image/png");
      a.click();
      pushToast(t("share.saved"));
    } catch (e) {
      console.error("Meridiel: PNG export failed —", e);
      pushToast(t("share.failed"));
    } finally { setBusy(false); }
  };

  const warmExportLibrary = () => { loadHtml2Canvas().catch(() => {}); };

  return (
    <div className="backdrop" onClick={onClose}>
      <div className="modal paper-tex" role="dialog" aria-modal="true" aria-labelledby="meridiel-share-title" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h2 id="meridiel-share-title">{t("share.title")}</h2>
          <button className="icon-btn" onClick={onClose} style={{ width: 32, height: 32 }} title={t("common.close")} aria-label={t("common.close")}><UI.Icon.x /></button>
        </div>
        <div className="modal-body">
          {/* The exported artifact */}
          <div className="share-card paper-tex" ref={cardRef}>
            <div className="sc-top">
              <div>
                <div className="ttl">{t("share.ttl", { name })}<br />Meridiel</div>
                <div className="sub">{handle} · {ATLAS.sinceOf(flights)}–{new Date().getFullYear()} · {t("share.home")} {ATLAS.homeOf(flights)}</div>
              </div>
              <svg className="seal" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
                <circle cx="12" cy="12" r="10" />
                <circle cx="12" cy="12" r="7" strokeDasharray="2 2" />
                <path d="M14.5 8.5L12 13l-4.5 2.5L10 11z" fill="currentColor" stroke="none" />
              </svg>
            </div>
            <div className="sc-stats">
              <div className="sc-stat"><div className="v">{UI.fmtNum(s.miles)}</div><div className="k">{t("stat.miles")}</div></div>
              <div className="sc-stat"><div className="v">{UI.fmtNum(s.hours)}</div><div className="k">{t("stat.hoursAloft")}</div></div>
              <div className="sc-stat"><div className="v">{s.countries}</div><div className="k">{t("stat.countries")}</div></div>
              <div className="sc-stat"><div className="v">{s.flights}</div><div className="k">{t("stat.segments")}</div></div>
              <div className="sc-stat"><div className="v">{s.airports}</div><div className="k">{t("stat.airports")}</div></div>
              <div className="sc-stat"><div className="v">{s.laps}×</div><div className="k">{t("stat.aroundEarth")}</div></div>
            </div>
            <div className="sc-flags">
              {countries.map((c) => <UI.Flag key={c.country} cc={c.cc} size={28} />)}
            </div>
            <div className="sc-foot">
              <span>◎ Meridiel</span>
              <span>{t("share.stamps", { count: countries.length })}</span>
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
            <button className="btn btn-solid" style={{ flex: 1, justifyContent: "center" }} onClick={exportPng} onMouseEnter={warmExportLibrary} onFocus={warmExportLibrary} disabled={busy}>
              <UI.Icon.download /> {busy ? t("share.rendering") : t("share.download")}
            </button>
          </div>
          <p className="hint" style={{ marginTop: 12 }}>{t("share.hint")}</p>
        </div>
      </div>
    </div>
  );
}
UI.ShareModal = ShareModal;

/* ---------- Add / Edit Flight modal ----------
   Pass `initial` (an existing flight) to edit it in place; omit it to add a new one. */

// The OpenFlights merge can add thousands of airports/airlines at runtime, so
// rebuilding lowercase "haystacks" for the whole dataset on every keystroke
// gets expensive. Cache an index per dataset and only rebuild it once the
// dataset's size actually changes (i.e. once, right after the async merge
// lands) rather than on every render/keystroke.
let airportIndexCache = null, airportIndexSize = -1;
function airportIndex() {
  const codes = Object.keys(ATLAS.AIRPORTS);
  if (airportIndexCache && airportIndexSize === codes.length) return airportIndexCache;
  airportIndexCache = codes.map((code) => {
    const a = ATLAS.AIRPORTS[code];
    return { code, codeLower: code.toLowerCase(), hay: `${code} ${a.city} ${a.name} ${a.country} ${AIRPORT_ALIASES[code] || ""}`.toLowerCase() };
  });
  airportIndexSize = codes.length;
  return airportIndexCache;
}

let airlineIndexCache = null, airlineIndexSize = -1;
function airlineIndex() {
  const list = ATLAS.AIRLINES;
  if (airlineIndexCache && airlineIndexSize === list.length) return airlineIndexCache;
  airlineIndexCache = list.map((a) => ({ a, codeLower: a.code.toLowerCase(), nameLower: a.name.toLowerCase() }));
  airlineIndexSize = list.length;
  return airlineIndexCache;
}

// Airport suggestions: match the code prefix or a substring of city/name/country.
function searchAirports(query) {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const starts = [], contains = [];
  airportIndex().forEach((entry) => {
    if (entry.codeLower.startsWith(q)) starts.push(entry.code);
    else if (entry.hay.includes(q)) contains.push(entry.code);
  });
  return [...starts, ...contains].slice(0, 8).map((code) => {
    const a = ATLAS.AIRPORTS[code];
    return { key: code, primary: `${code} — ${a.city}`, secondary: a.country, commit: code };
  });
}

// Airline suggestions: match a 2–3 letter IATA code, or a substring of the name.
// Selecting one fills the airline's real name; free typing is still allowed.
function searchAirlines(query) {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const byCode = [], byName = [];
  airlineIndex().forEach((entry) => {
    if (entry.codeLower.startsWith(q)) byCode.push(entry.a);
    else if (entry.nameLower.includes(q)) byName.push(entry.a);
  });
  return [...byCode, ...byName].slice(0, 8).map((a) => (
    { key: a.code, primary: a.name, secondary: a.code, commit: a.name }
  ));
}

/* ---------- CSV import ----------
   Read → analyze → preview → commit. Parsing never mutates the log; only the
   confirm button hands every accepted row to onImport in one call, so a file
   with errors can't leave half an import behind. */
const MAX_IMPORT_BYTES = 5 * 1024 * 1024;
const PREVIEW_LIMIT = 50;
// The BOM makes Excel open the template as UTF-8 (Chinese/Japanese notes).
const TEMPLATE_HREF = "data:text/csv;charset=utf-8," + encodeURIComponent("﻿" + CSV_TEMPLATE);
const STATUS_LABEL = { ok: "import.ready", warning: "import.warning", rejected: "import.rejected", duplicate: "import.duplicate" };
const STATUS_ORDER = { rejected: 0, warning: 1, duplicate: 2, ok: 3 };

/* Shared by CSV, paste and boarding-pass import: summary, per-row reasons,
   and one confirm button that commits every accepted row at once. */
function ImportPreview({ result, summary, fatalPrefix, rowLabel, resetLabel, onReset, onConfirm }) {
  const importable = result.flights.length;
  const listed = [...result.rows].sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status] || a.line - b.line);
  return (
    <div className="import-preview">
      {result.fatal ? (
        <p className="import-error" role="alert">{fatalPrefix}{t(result.fatal.code, result.fatal.params)}</p>
      ) : (
        <React.Fragment>
          <p className="import-summary" role="status">{summary}</p>
          <ul className="import-rows">
            {listed.slice(0, PREVIEW_LIMIT).map((row) => {
              const route = row.record || row.raw;
              return (
                <li key={row.line} className={"import-row import-row--" + row.status}>
                  <span className="ir-badge">{t(STATUS_LABEL[row.status])}</span>
                  <span className="ir-line">{rowLabel(row)}</span>
                  {route && (route.o || route.d) && (
                    <span className="ir-route">{route.date || "????-??-??"} {route.o || "???"} → {route.d || "???"}{route.flightNo ? " · " + route.flightNo : ""}</span>
                  )}
                  {row.issues.map((issue, i) => <span key={i} className="ir-issue">{t(issue.code, issue.params)}</span>)}
                </li>
              );
            })}
          </ul>
          {listed.length > PREVIEW_LIMIT && (
            <p className="hint">{t("import.moreRows", { count: listed.length - PREVIEW_LIMIT })}</p>
          )}
          {!importable && <p className="import-error">{t("import.nothing")}</p>}
        </React.Fragment>
      )}
      <div className="import-actions">
        <button type="button" className="btn btn-ghost" onClick={onReset}>{resetLabel}</button>
        {!result.fatal && importable > 0 && (
          <button type="button" className="btn btn-solid" onClick={onConfirm}>
            <UI.Icon.plus /> {t("import.confirm", { count: importable })}
          </button>
        )}
      </div>
    </div>
  );
}

/* ---------- Paste a booking email / scan a boarding pass ----------
   Text is parsed locally; a boarding-pass screenshot is decoded with the
   browser's BarcodeDetector (PDF417/Aztec/QR) where available. */
const BARCODE_FORMATS = ["pdf417", "aztec", "qr_code", "data_matrix"];

async function readBoardingPassImage(file) {
  if (typeof window.BarcodeDetector !== "function") return { unsupported: true };
  const supported = window.BarcodeDetector.getSupportedFormats
    ? await window.BarcodeDetector.getSupportedFormats()
    : BARCODE_FORMATS;
  const formats = BARCODE_FORMATS.filter((f) => supported.includes(f));
  if (!formats.length) return { unsupported: true };
  const bitmap = await createImageBitmap(file);
  try {
    const codes = await new window.BarcodeDetector({ formats }).detect(bitmap);
    return { values: codes.map((code) => code.rawValue).filter(Boolean) };
  } finally {
    if (bitmap.close) bitmap.close();
  }
}

function PastePanel({ onImport, existingFlights, pushToast, onClose }) {
  const [text, setText] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [message, setMessage] = React.useState("");
  const [result, setResult] = React.useState(null);
  const imageRef = React.useRef(null);

  const preview = (drafts) => {
    if (!drafts.length) return false;
    setResult(analyzeDrafts(drafts.map((raw, i) => ({ line: i + 1, raw })), {
      airports: ATLAS.AIRPORTS,
      existing: existingFlights,
    }));
    return true;
  };

  const findInText = async () => {
    setMessage("");
    setBusy(true);
    try {
      await ATLAS.loadReferenceData({ urgent: true });
      const drafts = extractFlightsFromText(text, { airports: ATLAS.AIRPORTS, airlines: ATLAS.AIRLINE_CODES });
      if (!preview(drafts)) setMessage(t("paste.noFlights"));
    } finally { setBusy(false); }
  };

  const onImage = async (e) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = "";
    if (!file) return;
    setMessage("");
    setBusy(true);
    try {
      const [scan] = await Promise.all([readBoardingPassImage(file), ATLAS.loadReferenceData({ urgent: true })]);
      if (scan.unsupported) { setMessage(t("paste.unsupported")); return; }
      const drafts = scan.values.flatMap((value) => parseBoardingPass(value, { airlines: ATLAS.AIRLINE_CODES }));
      if (!preview(drafts)) setMessage(t("paste.noBarcode"));
    } catch (error) {
      console.error("Meridiel: boarding pass scan failed —", error);
      setMessage(t("paste.noBarcode"));
    } finally { setBusy(false); }
  };

  const confirm = () => {
    if (!result || !result.flights.length) return;
    onImport(result.flights);
    pushToast(t("import.done", { count: result.flights.length }));
    onClose();
  };

  if (result) {
    return (
      <div className="tab-panel import-panel">
        <ImportPreview
          result={result}
          summary={t("paste.summary", {
            ok: result.counts.ok,
            warn: result.counts.warning,
            rejected: result.counts.rejected,
            dup: result.counts.duplicate,
          })}
          fatalPrefix=""
          rowLabel={(row) => t("import.item", { n: row.line })}
          resetLabel={t("paste.again")}
          onReset={() => setResult(null)}
          onConfirm={confirm}
        />
      </div>
    );
  }

  return (
    <div className="tab-panel import-panel">
      <p className="hint">{t("paste.intro")}</p>
      <textarea
        className="paste-box"
        rows={6}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={t("paste.placeholder")}
        aria-label={t("paste.label")}
      />
      <div className="import-actions">
        <button type="button" className="btn btn-ghost" onClick={() => imageRef.current && imageRef.current.click()} disabled={busy}>
          <UI.Icon.plus /> {t("paste.scan")}
        </button>
        <button type="button" className="btn btn-solid" onClick={findInText} disabled={busy || !text.trim()}>
          {busy ? <span className="spin spin-sm" /> : <UI.Icon.plane />} {t("paste.find")}
        </button>
      </div>
      <input ref={imageRef} type="file" accept="image/*" hidden aria-label={t("paste.scan")} data-testid="meridiel-pass-input" onChange={onImage} />
      {message && <p className="import-error" role="alert">{message}</p>}
      <p className="hint" style={{ marginTop: 12 }}>{t("import.offline")}</p>
    </div>
  );
}

function ImportPanel({ onImport, existingFlights, pushToast, onClose }) {
  const [phase, setPhase] = React.useState("idle"); // idle | reading | preview
  const [fileName, setFileName] = React.useState("");
  const [result, setResult] = React.useState(null);
  const [error, setError] = React.useState("");
  const [dragging, setDragging] = React.useState(false);
  const inputRef = React.useRef(null);

  const handleFile = async (file) => {
    if (!file) return;
    setError("");
    setResult(null);
    setFileName(file.name);
    if (file.size > MAX_IMPORT_BYTES) { setPhase("idle"); setError(t("import.readFailed")); return; }
    setPhase("reading");
    try {
      const [text] = await Promise.all([file.text(), ATLAS.loadReferenceData({ urgent: true })]);
      setResult(analyzeCsv(text, { airports: ATLAS.AIRPORTS, existing: existingFlights }));
      setPhase("preview");
    } catch (e) {
      console.error("Meridiel: CSV import failed —", e);
      setPhase("idle");
      setError(t("import.readFailed"));
    }
  };

  const onPick = (e) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = "";
    handleFile(file);
  };
  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]);
  };
  const confirm = () => {
    if (!result || !result.flights.length) return;
    onImport(result.flights);
    pushToast(t("import.done", { count: result.flights.length }));
    onClose();
  };
  const reset = () => { setPhase("idle"); setResult(null); setError(""); };

  return (
    <div className="tab-panel import-panel">
      <p className="hint"><UI.Rich text={t("import.intro")} /></p>
      <a className="import-template" href={TEMPLATE_HREF} download="meridiel-template.csv">
        <UI.Icon.download /> {t("import.template")}
      </a>

      {phase !== "preview" && (
        <button
          type="button"
          className={"import-drop" + (dragging ? " dragging" : "")}
          onClick={() => inputRef.current && inputRef.current.click()}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          disabled={phase === "reading"}
        >
          {phase === "reading"
            ? <React.Fragment><span className="spin spin-sm" /> {t("import.reading", { file: fileName })}</React.Fragment>
            : <React.Fragment><UI.Icon.plus /> {t("import.drop")}</React.Fragment>}
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept=".csv,text/csv"
        hidden
        aria-label={t("import.pick")}
        data-testid="meridiel-csv-input"
        onChange={onPick}
      />
      {error && <p className="import-error" role="alert">{error}</p>}

      {phase === "preview" && result && (
        <ImportPreview
          result={result}
          summary={t("import.summary", {
            file: fileName,
            ok: result.counts.ok,
            warn: result.counts.warning,
            rejected: result.counts.rejected,
            dup: result.counts.duplicate,
          })}
          fatalPrefix={fileName + ": "}
          rowLabel={(row) => t("import.line", { line: row.line })}
          resetLabel={t("import.another")}
          onReset={reset}
          onConfirm={confirm}
        />
      )}

      <p className="hint" style={{ marginTop: 12 }}>{t("import.offline")}</p>
    </div>
  );
}

function AddFlightModal({ onClose, onSubmit, onImport, existingFlights, pushToast, initial, initialTab, defaultOrigin }) {
  const isEdit = !!initial;
  const [tab, setTab] = React.useState(initialTab || "manual");
  const [, setReferenceDataVersion] = React.useState(0);
  React.useEffect(() => {
    let cancelled = false;
    ATLAS.loadReferenceData().then(() => {
      if (!cancelled) setReferenceDataVersion((version) => version + 1);
    });
    return () => { cancelled = true; };
  }, []);
  const [form, setForm] = React.useState(() => (
    initial
      ? {
          o: initial.o, d: initial.d, date: initial.date, airline: initial.airline, craft: initial.craft, seat: initial.seat,
          flightNo: initial.flightNo || "", reg: initial.reg || "", notes: initial.notes || "",
        }
      : { o: defaultOrigin || "", d: "", date: new Date().toISOString().slice(0, 10), airline: "", craft: "", seat: "", flightNo: "", reg: "", notes: "" }
  ));
  // Only route and date are needed; the rest waits behind "More details",
  // which opens by itself when editing a flight that already has them.
  const filled = (v) => !!v && v !== "—";
  const [showAdvanced, setShowAdvanced] = React.useState(
    !!(initial && [initial.craft, initial.seat, initial.reg, initial.notes].some(filled))
  );
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const setVal = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));
  const dateRef = React.useRef(null);
  const openDatePicker = () => {
    try { dateRef.current.showPicker(); } catch (e) { dateRef.current.focus(); }
  };

  const submit = () => {
    if (!ATLAS.AIRPORTS[form.o] || !ATLAS.AIRPORTS[form.d]) { pushToast(t("add.invalidAirport")); return; }
    if (form.o === form.d) { pushToast(t("add.sameAirport")); return; }
    onSubmit(form);
    pushToast(isEdit ? t("add.updated") : t("add.added"));
    onClose();
  };

  return (
    <div className="backdrop" onClick={onClose}>
      <div className="modal paper-tex" role="dialog" aria-modal="true" aria-labelledby="meridiel-flight-title" onClick={(e) => e.stopPropagation()} style={{ width: "min(520px, 94vw)" }}>
        <div className="modal-head">
          <h2 id="meridiel-flight-title">{isEdit ? t("add.titleEdit") : t("add.titleAdd")}</h2>
          <button className="icon-btn" onClick={onClose} style={{ width: 32, height: 32 }} title={t("common.close")} aria-label={t("common.close")}><UI.Icon.x /></button>
        </div>
        <div className="modal-body">
          {!isEdit && (
            <div className="tab-row">
              <button className={tab === "manual" ? "on" : ""} aria-pressed={tab === "manual"} onClick={() => setTab("manual")}>{t("add.tabManual")}</button>
              <button className={tab === "paste" ? "on" : ""} aria-pressed={tab === "paste"} onClick={() => setTab("paste")}>{t("add.tabPaste")}</button>
              <button className={tab === "import" ? "on" : ""} aria-pressed={tab === "import"} onClick={() => setTab("import")}>{t("add.tabImport")}</button>
            </div>
          )}

          {(isEdit || tab === "manual") && (
            <div className="tab-panel">
              <div className="field-row">
                <div className="field">
                  <label>{t("add.from")}</label>
                  <UI.SuggestField
                    value={form.o}
                    onCommit={setVal("o")}
                    getDisplay={(code) => (ATLAS.AIRPORTS[code] ? `${code} — ${ATLAS.AIRPORTS[code].city}` : code)}
                    search={searchAirports}
                    placeholder={t("add.airportPlaceholder")}
                  />
                </div>
                <div className="field">
                  <label>{t("add.to")}</label>
                  <UI.SuggestField
                    value={form.d}
                    onCommit={setVal("d")}
                    getDisplay={(code) => (ATLAS.AIRPORTS[code] ? `${code} — ${ATLAS.AIRPORTS[code].city}` : code)}
                    search={searchAirports}
                    placeholder={t("add.airportPlaceholder")}
                  />
                </div>
              </div>
              <div className="field field-date" onClick={openDatePicker}>
                <label>{t("add.date")}</label>
                <input ref={dateRef} type="date" value={form.date} onChange={set("date")} />
              </div>
              <div className="field-row">
                <div className="field">
                  <label>{t("add.airline")}</label>
                  <UI.SuggestField
                    value={form.airline}
                    onCommit={setVal("airline")}
                    getDisplay={(v) => v}
                    search={searchAirlines}
                    placeholder={t("add.airlinePlaceholder")}
                    allowFreeText
                  />
                </div>
                <div className="field">
                  <label>{t("add.flightNo")}</label>
                  <input placeholder={t("add.flightNoPlaceholder")} value={form.flightNo} onChange={set("flightNo")} />
                </div>
              </div>

              <button type="button" className="advanced-toggle" onClick={() => setShowAdvanced((v) => !v)}>
                <UI.Icon.chevron className={"advanced-toggle-chev" + (showAdvanced ? " open" : "")} />
                {t("add.advanced")}
              </button>
              <div className={"advanced-collapse" + (showAdvanced ? " open" : "")}>
                <div className="advanced-collapse-inner">
                  <div className="field-row">
                    <div className="field">
                      <label>{t("add.aircraft")}</label>
                      <input placeholder={t("add.aircraftPlaceholder")} value={form.craft} onChange={set("craft")} tabIndex={showAdvanced ? 0 : -1} />
                    </div>
                    <div className="field">
                      <label>{t("add.seat")}</label>
                      <input placeholder={t("add.seatPlaceholder")} value={form.seat} onChange={set("seat")} tabIndex={showAdvanced ? 0 : -1} />
                    </div>
                  </div>
                  <div className="field">
                    <label>{t("add.registration")}</label>
                    <input placeholder={t("add.registrationPlaceholder")} value={form.reg} onChange={set("reg")} tabIndex={showAdvanced ? 0 : -1} />
                  </div>
                  <div className="field">
                    <label>{t("add.notes")}</label>
                    <textarea rows={2} placeholder={t("add.notesPlaceholder")} value={form.notes} onChange={set("notes")} tabIndex={showAdvanced ? 0 : -1} />
                  </div>
                </div>
              </div>

              <button className="btn btn-solid" style={{ width: "100%", justifyContent: "center", marginTop: 4 }} onClick={submit}>
                {isEdit ? <React.Fragment><UI.Icon.edit /> {t("add.save")}</React.Fragment> : <React.Fragment><UI.Icon.plus /> {t("add.submit")}</React.Fragment>}
              </button>
            </div>
          )}

          {!isEdit && tab === "paste" && (
            <PastePanel onImport={onImport} existingFlights={existingFlights} pushToast={pushToast} onClose={onClose} />
          )}

          {!isEdit && tab === "import" && (
            <ImportPanel onImport={onImport} existingFlights={existingFlights} pushToast={pushToast} onClose={onClose} />
          )}
        </div>
      </div>
    </div>
  );
}
UI.AddFlightModal = AddFlightModal;
