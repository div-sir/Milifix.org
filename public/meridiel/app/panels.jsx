/* ============================================================
   MERIDIEL — Panels: Log, Rail (stats+flags), Detail, Timeline
   ============================================================ */
const { useMemo: useMemoP } = React;

/* ---------- Flight Log (left) ---------- */
function FlightLog({ flights, selectedId, currentId, onSelect, onAddFlight, className }) {
  return (
    <section className={"panel log paper-tex " + (className || "")}>
      <div className="panel-head">
        <h3>Flight Log</h3>
        <span className="count">{flights.length} segments</span>
      </div>
      <div className="log-list">
        {flights.map((f) => (
          <div
            key={f.id}
            className={"log-row" + (f.id === selectedId ? " active" : "") + (f.id === currentId ? " now" : "")}
            onClick={() => onSelect(f.id)}
          >
            {f.id === currentId && <span className="lr-now">NOW FLYING</span>}
            {f.fav && f.id !== currentId && <span className="lr-fav">★</span>}
            <div className="lr-route">
              <span>{f.from.code}</span>
              <span className="arrow">→</span>
              <span>{f.to.code}</span>
            </div>
            <div className="lr-date">{window.fmtDate(f.date)}</div>
            <div className="lr-sub">{f.airline}</div>
            <div className="lr-miles">{f.miles.toLocaleString()} mi</div>
          </div>
        ))}
        {/* Always-present closing CTA — gives a short log somewhere to land
            instead of trailing off into blank panel space. */}
        <button className="log-add-hint" onClick={onAddFlight}>
          <window.Icon.plus />
          {flights.length === 0 ? "Log your first flight" : "Add your next flight"}
        </button>
      </div>
    </section>
  );
}
window.FlightLog = FlightLog;

/* ---------- Stats + Flag wall (right rail) ---------- */
function StatsRail({ flights, allFlights, className }) {
  const s = useMemoP(() => window.ATLAS.statsFor(flights), [flights]);
  const countries = useMemoP(() => window.ATLAS.countryList(flights), [flights]);
  return (
    <section className={"panel rail paper-tex " + (className || "")}>
      <div className="panel-head">
        <h3>The Tally</h3>
        <span className="count">since {window.ATLAS.sinceOf(flights)}</span>
      </div>
      <div className="panel-body">
        <div className="stat-grid">
          <div className="stat">
            <span className="v"><window.StatNum value={s.miles} /></span>
            <span className="k">Miles flown</span>
          </div>
          <div className="stat">
            <span className="v"><window.StatNum value={s.hours} /><small> hrs</small></span>
            <span className="k">In the air</span>
          </div>
          <div className="stat">
            <span className="v"><window.StatNum value={s.countries} /></span>
            <span className="k">Countries</span>
          </div>
          <div className="stat">
            <span className="v"><window.StatNum value={s.airports} /></span>
            <span className="k">Airports</span>
          </div>
          <div className="stat wide">
            <div>
              <span className="v"><window.StatNum value={s.flights} /></span>
              <span className="k">Flight segments logged</span>
            </div>
            <div style={{ textAlign: "right" }}>
              <span className="v"><window.StatNum value={s.laps} decimals={1} /></span>
              <span className="k">× around Earth</span>
            </div>
          </div>
        </div>

        <div className="section-label">Passport · {countries.length} stamps</div>
        <div className="flagwall">
          {countries.map((c) => (
            <window.Flag key={c.country} cc={c.cc} label={c.country} />
          ))}
        </div>
      </div>
    </section>
  );
}
window.StatsRail = StatsRail;

/* ---------- Flight Detail (replaces rail when a flight is picked) ---------- */
function FlightDetail({ flight, onClose, onEdit, onDelete, className }) {
  if (!flight) return null;
  const f = flight;
  const remove = () => {
    if (window.confirm(`Delete the ${f.from.code} → ${f.to.code} flight? This can't be undone.`)) {
      onDelete(f.id);
    }
  };
  return (
    <section className={"panel rail " + (className || "")} style={{ background: "var(--paper)" }}>
      <div className="panel-head" style={{ background: "var(--paper-3)" }}>
        <h3>Boarding Pass</h3>
        <div style={{ display: "flex", gap: 6 }}>
          <button className="icon-btn" onClick={() => onEdit(f)} title="Edit flight" style={{ width: 30, height: 30 }}>
            <window.Icon.edit />
          </button>
          <button className="icon-btn" onClick={remove} title="Delete flight" style={{ width: 30, height: 30 }}>
            <window.Icon.trash />
          </button>
          <button className="icon-btn" onClick={onClose} style={{ width: 30, height: 30 }}>
            <window.Icon.x />
          </button>
        </div>
      </div>
      <div className="panel-body">
        <div className="detail-hero">
          <div className="detail-route">
            <div className="detail-ap">
              <span className="code">{f.from.code}</span>
              <span className="city">{f.from.city}</span>
            </div>
            <div className="detail-mid">
              <span className="plane"><window.Icon.planeFill /></span>
              <span className="line" />
              <span style={{ fontFamily: "var(--mono)", fontSize: 10 }}>{f.miles.toLocaleString()} mi</span>
            </div>
            <div className="detail-ap to">
              <span className="code">{f.to.code}</span>
              <span className="city">{f.to.city}</span>
            </div>
          </div>
        </div>

        <figure className="detail-photo">
          <window.ImageSlotMaybe flight={f} />
        </figure>

        <div className="detail-rows">
          <div className="drow"><span className="k">Date</span><span className="vv">{window.fmtDate(f.date)}</span></div>
          <div className="drow"><span className="k">Airline</span><span className="vv">{f.airline}</span></div>
          <div className="drow"><span className="k">Aircraft</span><span className="vv">{f.craft}</span></div>
          <div className="drow"><span className="k">Flight time</span><span className="vv">{window.fmtDur(f.dur)}</span></div>
          <div className="drow"><span className="k">Distance</span><span className="vv">{f.km.toLocaleString()} km · {f.miles.toLocaleString()} mi</span></div>
          <div className="drow"><span className="k">Seat</span><span className="vv">{f.seat}</span></div>
          <div className="drow">
            <span className="k">Route</span>
            <span className="vv" style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <window.Flag cc={f.from.cc} size={20} /> → <window.Flag cc={f.to.cc} size={20} />
            </span>
          </div>
        </div>
        {f.fav && <div style={{ padding: "0 16px 18px" }}><span className="stamp">Favourite Leg</span></div>}
      </div>
    </section>
  );
}
window.FlightDetail = FlightDetail;

/* photo placeholder that the user can later replace */
function ImageSlotMaybe({ flight }) {
  return (
    <React.Fragment>
      <span>{flight.to.city} · add a photo</span>
    </React.Fragment>
  );
}
window.ImageSlotMaybe = ImageSlotMaybe;

/* ---------- Timeline replay ---------- */
function Timeline({ years, activeYear, onYear, playing, onTogglePlay, progress, replayFlight, replayCount, total }) {
  const markYear = replayFlight ? replayFlight.year : activeYear;
  return (
    <section className="panel timeline paper-tex">
      <button className="tl-play" onClick={onTogglePlay} aria-label={playing ? "Pause" : "Play replay"}>
        {playing ? <window.Icon.pause /> : <window.Icon.play />}
      </button>
      <div className="tl-track-wrap">
        <div className="tl-meta">
          {replayFlight ? (
            <React.Fragment>
              <span className="now">
                {replayFlight.from.code} <span className="tl-arrow">→</span> {replayFlight.to.code}
                <span className="tl-route-city">{replayFlight.from.city} → {replayFlight.to.city}</span>
              </span>
              <span className="sub">{window.fmtDate(replayFlight.date)} · {replayFlight.airline} · {replayCount}/{total}</span>
            </React.Fragment>
          ) : (
            <React.Fragment>
              <span className="now">{activeYear ? activeYear : "All Years"}</span>
              <span className="sub">{playing ? "Taking off…" : "Press play to fly flight-by-flight · or tap a year"}</span>
            </React.Fragment>
          )}
        </div>
        <div className="tl-track">
          <div className="tl-line" />
          <div className="tl-fill" style={{ width: `${progress * 100}%` }} />
          <div className="tl-ticks">
            <button
              className={"tl-tick" + (!markYear ? " current" : "")}
              onClick={() => onYear(null)}
            >
              <span className="tl-node" />
              <span className="yr">ALL</span>
            </button>
            {years.map((y) => {
              const done = markYear && y < markYear;
              const cur = y === markYear;
              return (
                <button
                  key={y}
                  className={"tl-tick" + (done ? " done" : "") + (cur ? " current" : "")}
                  onClick={() => onYear(y)}
                >
                  <span className="tl-node" />
                  <span className="yr">{String(y).slice(2)}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
window.Timeline = Timeline;
