/* ============================================================
   MERIDIEL — Modals: Share card, Add flight, Present overlay
   ============================================================ */
import { UI } from "./ui-registry.js";
import { ATLAS } from "./data.js";


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
      pushToast("Saved your share card ✓");
    } catch (e) {
      console.error("Meridiel: PNG export failed —", e);
      pushToast("Couldn't render — try again");
    } finally { setBusy(false); }
  };

  const warmExportLibrary = () => { loadHtml2Canvas().catch(() => {}); };

  const copyLink = async () => {
    const url = location.href.split("#")[0] + "#shared";
    try { await navigator.clipboard.writeText(url); pushToast("Share link copied ✓"); }
    catch { pushToast(url); }
  };

  return (
    <div className="backdrop" onClick={onClose}>
      <div className="modal paper-tex" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h2>Share your Atlas</h2>
          <button className="icon-btn" onClick={onClose} style={{ width: 32, height: 32 }}><UI.Icon.x /></button>
        </div>
        <div className="modal-body">
          {/* The exported artifact */}
          <div className="share-card paper-tex" ref={cardRef}>
            <div className="sc-top">
              <div>
                <div className="ttl">{name}'s<br />Meridiel</div>
                <div className="sub">{handle} · {ATLAS.sinceOf(flights)}–{new Date().getFullYear()} · HOME {ATLAS.homeOf(flights)}</div>
              </div>
              <svg className="seal" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
                <circle cx="12" cy="12" r="10" />
                <circle cx="12" cy="12" r="7" strokeDasharray="2 2" />
                <path d="M14.5 8.5L12 13l-4.5 2.5L10 11z" fill="currentColor" stroke="none" />
              </svg>
            </div>
            <div className="sc-stats">
              <div className="sc-stat"><div className="v">{s.miles.toLocaleString()}</div><div className="k">Miles</div></div>
              <div className="sc-stat"><div className="v">{s.hours.toLocaleString()}</div><div className="k">Hours aloft</div></div>
              <div className="sc-stat"><div className="v">{s.countries}</div><div className="k">Countries</div></div>
              <div className="sc-stat"><div className="v">{s.flights}</div><div className="k">Segments</div></div>
              <div className="sc-stat"><div className="v">{s.airports}</div><div className="k">Airports</div></div>
              <div className="sc-stat"><div className="v">{s.laps}×</div><div className="k">Around Earth</div></div>
            </div>
            <div className="sc-flags">
              {countries.map((c) => <UI.Flag key={c.country} cc={c.cc} size={28} />)}
            </div>
            <div className="sc-foot">
              <span>◎ Meridiel</span>
              <span>{countries.length} stamps collected</span>
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
            <button className="btn btn-solid" style={{ flex: 1, justifyContent: "center" }} onClick={exportPng} onMouseEnter={warmExportLibrary} onFocus={warmExportLibrary} disabled={busy}>
              <UI.Icon.download /> {busy ? "Rendering…" : "Download image"}
            </button>
            <button className="btn btn-ghost" style={{ justifyContent: "center" }} onClick={copyLink}>
              <UI.Icon.link /> Copy link
            </button>
          </div>
          <p className="hint" style={{ marginTop: 12 }}>
            PNG renders right in your browser — no server, no fees. The share link reopens this exact atlas.
          </p>
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
    return { code, codeLower: code.toLowerCase(), hay: `${code} ${a.city} ${a.name} ${a.country}`.toLowerCase() };
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

function AddFlightModal({ onClose, onSubmit, pushToast, initial }) {
  const isEdit = !!initial;
  const [tab, setTab] = React.useState("manual");
  const [form, setForm] = React.useState(() => (
    initial
      ? {
          o: initial.o, d: initial.d, date: initial.date, airline: initial.airline, craft: initial.craft, seat: initial.seat,
          flightNo: initial.flightNo || "", reg: initial.reg || "", notes: initial.notes || "",
        }
      : { o: "SFO", d: "JFK", date: new Date().toISOString().slice(0, 10), airline: "", craft: "", seat: "", flightNo: "", reg: "", notes: "" }
  ));
  // Auto-expand when editing a flight that already has advanced details filled in.
  const [showAdvanced, setShowAdvanced] = React.useState(
    !!(initial && (initial.flightNo || initial.reg || initial.notes))
  );
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const setVal = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));
  const dateRef = React.useRef(null);
  const openDatePicker = () => {
    try { dateRef.current.showPicker(); } catch (e) { dateRef.current.focus(); }
  };

  const submit = () => {
    if (!ATLAS.AIRPORTS[form.o] || !ATLAS.AIRPORTS[form.d]) { pushToast("Pick a valid airport for From and To"); return; }
    if (form.o === form.d) { pushToast("Origin and destination must differ"); return; }
    onSubmit(form);
    pushToast(isEdit ? "Flight updated ✓" : "Flight added to your log ✓");
    onClose();
  };

  return (
    <div className="backdrop" onClick={onClose}>
      <div className="modal paper-tex" onClick={(e) => e.stopPropagation()} style={{ width: "min(480px, 94vw)" }}>
        <div className="modal-head">
          <h2>{isEdit ? "Edit flight" : "Add a flight"}</h2>
          <button className="icon-btn" onClick={onClose} style={{ width: 32, height: 32 }}><UI.Icon.x /></button>
        </div>
        <div className="modal-body">
          {!isEdit && (
            <div className="tab-row">
              <button className={tab === "manual" ? "on" : ""} onClick={() => setTab("manual")}>Manual</button>
              <button className={tab === "import" ? "on" : ""} onClick={() => setTab("import")}>Import CSV</button>
            </div>
          )}

          {(isEdit || tab === "manual") && (
            <div className="tab-panel">
              <div className="field-row">
                <div className="field">
                  <label>From</label>
                  <UI.SuggestField
                    value={form.o}
                    onCommit={setVal("o")}
                    getDisplay={(code) => (ATLAS.AIRPORTS[code] ? `${code} — ${ATLAS.AIRPORTS[code].city}` : code)}
                    search={searchAirports}
                    placeholder="Type a city or code"
                  />
                </div>
                <div className="field">
                  <label>To</label>
                  <UI.SuggestField
                    value={form.d}
                    onCommit={setVal("d")}
                    getDisplay={(code) => (ATLAS.AIRPORTS[code] ? `${code} — ${ATLAS.AIRPORTS[code].city}` : code)}
                    search={searchAirports}
                    placeholder="Type a city or code"
                  />
                </div>
              </div>
              <div className="field field-date" onClick={openDatePicker}>
                <label>Date</label>
                <input ref={dateRef} type="date" value={form.date} onChange={set("date")} />
              </div>
              <div className="field-row">
                <div className="field">
                  <label>Airline</label>
                  <UI.SuggestField
                    value={form.airline}
                    onCommit={setVal("airline")}
                    getDisplay={(v) => v}
                    search={searchAirlines}
                    placeholder="Name or IATA code"
                    allowFreeText
                  />
                </div>
                <div className="field">
                  <label>Aircraft</label>
                  <input placeholder="e.g. Boeing 787" value={form.craft} onChange={set("craft")} />
                </div>
              </div>
              <div className="field">
                <label>Seat (optional)</label>
                <input placeholder="e.g. 14A" value={form.seat} onChange={set("seat")} />
              </div>

              <button type="button" className="advanced-toggle" onClick={() => setShowAdvanced((v) => !v)}>
                <UI.Icon.chevron className={"advanced-toggle-chev" + (showAdvanced ? " open" : "")} />
                Advanced details
              </button>
              <div className={"advanced-collapse" + (showAdvanced ? " open" : "")}>
                <div className="advanced-collapse-inner">
                  <div className="field-row">
                    <div className="field">
                      <label>Flight number</label>
                      <input placeholder="e.g. CI 100" value={form.flightNo} onChange={set("flightNo")} tabIndex={showAdvanced ? 0 : -1} />
                    </div>
                    <div className="field">
                      <label>Registration</label>
                      <input placeholder="e.g. B-18317" value={form.reg} onChange={set("reg")} tabIndex={showAdvanced ? 0 : -1} />
                    </div>
                  </div>
                  <div className="field">
                    <label>Notes (optional)</label>
                    <textarea rows={2} placeholder="Anything else worth remembering" value={form.notes} onChange={set("notes")} tabIndex={showAdvanced ? 0 : -1} />
                  </div>
                </div>
              </div>

              <button className="btn btn-solid" style={{ width: "100%", justifyContent: "center", marginTop: 4 }} onClick={submit}>
                {isEdit ? <React.Fragment><UI.Icon.edit /> Save changes</React.Fragment> : <React.Fragment><UI.Icon.plus /> Add to log</React.Fragment>}
              </button>
            </div>
          )}

          {!isEdit && tab === "import" && (
            <div className="tab-panel">
              <p className="hint">Drop a CSV with columns <b>date, from, to, airline, aircraft, seat</b>. Airport codes are matched to coordinates automatically.</p>
              <div className="detail-photo" style={{ height: 120, marginTop: 14, borderRadius: 3, border: "1.5px dashed var(--line)" }}>
                <span>Drag &amp; drop CSV — or click to browse</span>
              </div>
              <p className="hint" style={{ marginTop: 12 }}>Works fully offline. Your data never leaves the browser.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
UI.AddFlightModal = AddFlightModal;
