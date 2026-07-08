/* ============================================================
   MERIDIEL — Modals: Share card, Add flight, Present overlay
   ============================================================ */

/* ---------- Share Card modal ---------- */
function ShareModal({ flights, account, onClose, pushToast }) {
  const cardRef = React.useRef(null);
  const [busy, setBusy] = React.useState(false);
  const s = React.useMemo(() => window.ATLAS.statsFor(flights), [flights]);
  const countries = React.useMemo(() => window.ATLAS.countryList(flights), [flights]);
  const prof = window.ATLAS.profile;
  const name = (account && account.name) || prof.name;
  const handle = (account && account.handle) || prof.handle;

  const exportPng = async () => {
    if (!window.html2canvas || !cardRef.current) { pushToast("Export library still loading…"); return; }
    setBusy(true);
    try {
      const canvas = await window.html2canvas(cardRef.current, {
        scale: 2, backgroundColor: null, useCORS: true, logging: false,
      });
      const a = document.createElement("a");
      a.download = `meridiel-${handle.replace("@", "")}.png`;
      a.href = canvas.toDataURL("image/png");
      a.click();
      pushToast("Saved your share card ✓");
    } catch (e) {
      pushToast("Couldn't render — try again");
    } finally { setBusy(false); }
  };

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
          <button className="icon-btn" onClick={onClose} style={{ width: 32, height: 32 }}><window.Icon.x /></button>
        </div>
        <div className="modal-body">
          {/* The exported artifact */}
          <div className="share-card paper-tex" ref={cardRef}>
            <div className="sc-top">
              <div>
                <div className="ttl">{name}'s<br />Meridiel</div>
                <div className="sub">{handle} · {window.ATLAS.sinceOf(flights)}–{new Date().getFullYear()} · HOME {window.ATLAS.homeOf(flights)}</div>
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
              {countries.map((c) => <window.Flag key={c.country} cc={c.cc} size={28} />)}
            </div>
            <div className="sc-foot">
              <span>◎ Meridiel</span>
              <span>{countries.length} stamps collected</span>
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
            <button className="btn btn-solid" style={{ flex: 1, justifyContent: "center" }} onClick={exportPng} disabled={busy}>
              <window.Icon.download /> {busy ? "Rendering…" : "Download image"}
            </button>
            <button className="btn btn-ghost" style={{ justifyContent: "center" }} onClick={copyLink}>
              <window.Icon.link /> Copy link
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
window.ShareModal = ShareModal;

/* ---------- Add / Edit Flight modal ----------
   Pass `initial` (an existing flight) to edit it in place; omit it to add a new one. */

// Airport suggestions: match the code prefix or a substring of city/name/country.
function searchAirports(query) {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const codes = Object.keys(window.ATLAS.AIRPORTS);
  const starts = [], contains = [];
  codes.forEach((code) => {
    const a = window.ATLAS.AIRPORTS[code];
    const hay = `${code} ${a.city} ${a.name} ${a.country}`.toLowerCase();
    if (code.toLowerCase().startsWith(q)) starts.push(code);
    else if (hay.includes(q)) contains.push(code);
  });
  return [...starts, ...contains].slice(0, 8).map((code) => {
    const a = window.ATLAS.AIRPORTS[code];
    return { key: code, primary: `${code} — ${a.city}`, secondary: a.country, commit: code };
  });
}

// Airline suggestions: match a 2–3 letter IATA code, or a substring of the name.
// Selecting one fills the airline's real name; free typing is still allowed.
function searchAirlines(query) {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const byCode = [], byName = [];
  window.ATLAS.AIRLINES.forEach((a) => {
    if (a.code.toLowerCase().startsWith(q)) byCode.push(a);
    else if (a.name.toLowerCase().includes(q)) byName.push(a);
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
    if (!window.ATLAS.AIRPORTS[form.o] || !window.ATLAS.AIRPORTS[form.d]) { pushToast("Pick a valid airport for From and To"); return; }
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
          <button className="icon-btn" onClick={onClose} style={{ width: 32, height: 32 }}><window.Icon.x /></button>
        </div>
        <div className="modal-body">
          {!isEdit && (
            <div className="tab-row">
              <button className={tab === "manual" ? "on" : ""} onClick={() => setTab("manual")}>Manual</button>
              <button className={tab === "import" ? "on" : ""} onClick={() => setTab("import")}>Import CSV</button>
            </div>
          )}

          {(isEdit || tab === "manual") && (
            <React.Fragment>
              <div className="field-row">
                <div className="field">
                  <label>From</label>
                  <window.SuggestField
                    value={form.o}
                    onCommit={setVal("o")}
                    getDisplay={(code) => (window.ATLAS.AIRPORTS[code] ? `${code} — ${window.ATLAS.AIRPORTS[code].city}` : code)}
                    search={searchAirports}
                    placeholder="Type a city or code"
                  />
                </div>
                <div className="field">
                  <label>To</label>
                  <window.SuggestField
                    value={form.d}
                    onCommit={setVal("d")}
                    getDisplay={(code) => (window.ATLAS.AIRPORTS[code] ? `${code} — ${window.ATLAS.AIRPORTS[code].city}` : code)}
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
                  <window.SuggestField
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
                <window.Icon.chevron className={"advanced-toggle-chev" + (showAdvanced ? " open" : "")} />
                Advanced details
              </button>
              {showAdvanced && (
                <React.Fragment>
                  <div className="field-row">
                    <div className="field">
                      <label>Flight number</label>
                      <input placeholder="e.g. CI 100" value={form.flightNo} onChange={set("flightNo")} />
                    </div>
                    <div className="field">
                      <label>Registration</label>
                      <input placeholder="e.g. B-18317" value={form.reg} onChange={set("reg")} />
                    </div>
                  </div>
                  <div className="field">
                    <label>Notes (optional)</label>
                    <textarea rows={2} placeholder="Anything else worth remembering" value={form.notes} onChange={set("notes")} />
                  </div>
                </React.Fragment>
              )}

              <button className="btn btn-solid" style={{ width: "100%", justifyContent: "center", marginTop: 4 }} onClick={submit}>
                {isEdit ? <React.Fragment><window.Icon.edit /> Save changes</React.Fragment> : <React.Fragment><window.Icon.plus /> Add to log</React.Fragment>}
              </button>
            </React.Fragment>
          )}

          {!isEdit && tab === "import" && (
            <div>
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
window.AddFlightModal = AddFlightModal;
