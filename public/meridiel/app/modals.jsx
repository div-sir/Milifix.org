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
                <div className="sub">{handle} · {window.ATLAS.profile.since}–{new Date().getFullYear()} · HOME {prof.home}</div>
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

/* ---------- Add Flight modal ---------- */
function AddFlightModal({ onClose, onAdd, pushToast }) {
  const codes = Object.keys(window.ATLAS.AIRPORTS).sort();
  const [tab, setTab] = React.useState("manual");
  const [form, setForm] = React.useState({
    o: "SFO", d: "JFK", date: new Date().toISOString().slice(0, 10),
    airline: "", craft: "", seat: "",
  });
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = () => {
    if (form.o === form.d) { pushToast("Origin and destination must differ"); return; }
    onAdd(form);
    pushToast("Flight added to your log ✓");
    onClose();
  };

  return (
    <div className="backdrop" onClick={onClose}>
      <div className="modal paper-tex" onClick={(e) => e.stopPropagation()} style={{ width: "min(480px, 94vw)" }}>
        <div className="modal-head">
          <h2>Add a flight</h2>
          <button className="icon-btn" onClick={onClose} style={{ width: 32, height: 32 }}><window.Icon.x /></button>
        </div>
        <div className="modal-body">
          <div className="tab-row">
            <button className={tab === "manual" ? "on" : ""} onClick={() => setTab("manual")}>Manual</button>
            <button className={tab === "import" ? "on" : ""} onClick={() => setTab("import")}>Import CSV</button>
            <button className={tab === "sync" ? "on" : ""} onClick={() => setTab("sync")}>Sync app</button>
          </div>

          {tab === "manual" && (
            <React.Fragment>
              <div className="field-row">
                <div className="field">
                  <label>From</label>
                  <select value={form.o} onChange={set("o")}>
                    {codes.map((c) => <option key={c} value={c}>{c} — {window.ATLAS.AIRPORTS[c].city}</option>)}
                  </select>
                </div>
                <div className="field">
                  <label>To</label>
                  <select value={form.d} onChange={set("d")}>
                    {codes.map((c) => <option key={c} value={c}>{c} — {window.ATLAS.AIRPORTS[c].city}</option>)}
                  </select>
                </div>
              </div>
              <div className="field">
                <label>Date</label>
                <input type="date" value={form.date} onChange={set("date")} />
              </div>
              <div className="field-row">
                <div className="field">
                  <label>Airline</label>
                  <input placeholder="e.g. United" value={form.airline} onChange={set("airline")} />
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
              <button className="btn btn-solid" style={{ width: "100%", justifyContent: "center", marginTop: 4 }} onClick={submit}>
                <window.Icon.plus /> Add to log
              </button>
            </React.Fragment>
          )}

          {tab === "import" && (
            <div>
              <p className="hint">Drop a CSV with columns <b>date, from, to, airline, aircraft, seat</b>. Airport codes are matched to coordinates automatically.</p>
              <div className="detail-photo" style={{ height: 120, marginTop: 14, borderRadius: 3, border: "1.5px dashed var(--line)" }}>
                <span>Drag &amp; drop CSV — or click to browse</span>
              </div>
              <p className="hint" style={{ marginTop: 12 }}>Works fully offline. Your data never leaves the browser.</p>
            </div>
          )}

          {tab === "sync" && (
            <div>
              <p className="hint">Connect a flight-log service to import history automatically:</p>
              <div style={{ display: "grid", gap: 8, marginTop: 12 }}>
                {["MyFlightradar24", "App in the Air", "OpenFlights export", "Google Timeline"].map((x) => (
                  <button key={x} className="btn btn-ghost" style={{ justifyContent: "space-between", width: "100%" }}>
                    {x} <window.Icon.link />
                  </button>
                ))}
              </div>
              <p className="hint" style={{ marginTop: 12 }}>Imports run client-side via each service's public export file — no paid API needed.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
window.AddFlightModal = AddFlightModal;
