/* ============================================================
   MERIDIEL — Main App
   ============================================================ */
const { useState: useStateA, useEffect: useEffectA, useLayoutEffect: useLayoutEffectA, useMemo: useMemoA, useRef: useRefA } = React;

/* ---------- persisted helpers ---------- */
function loadAccount() {
  try { return JSON.parse(localStorage.getItem("fa-account") || "null"); } catch (e) { return null; }
}
function loadTheme() {
  return localStorage.getItem("fa-theme") || "light";
}
function loadFlights() {
  try { return JSON.parse(localStorage.getItem("fa-flights") || "[]"); } catch (e) { return []; }
}

/* ---------- theme toggle: circular reveal from the click point, matching the rest of milifix.org ---------- */
function setThemeTransitionOrigin(ev) {
  const x = ev && Number.isFinite(ev.clientX) && ev.clientX >= 0 ? ev.clientX : window.innerWidth / 2;
  const y = ev && Number.isFinite(ev.clientY) && ev.clientY >= 0 ? ev.clientY : window.innerHeight / 2;
  document.documentElement.style.setProperty("--theme-vt-x", x + "px");
  document.documentElement.style.setProperty("--theme-vt-y", y + "px");
}
function supportsThemeViewTransition() {
  return typeof document.startViewTransition === "function" &&
    !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function App() {
  const ALL = window.ATLAS.FLIGHTS;
  const YEARS = window.ATLAS.YEARS;

  /* ---- auth + theme ---- */
  const [account, setAccount] = useStateA(loadAccount);
  const [theme, setTheme] = useStateA(loadTheme);
  const [acctMenu, setAcctMenu] = useStateA(false);

  // useLayoutEffect (not useEffect) so the DOM attribute flips synchronously —
  // required for the view-transition screenshot below to capture the new theme.
  useLayoutEffectA(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("fa-theme", theme);
  }, [theme]);

  const toggleTheme = (ev) => {
    setThemeTransitionOrigin(ev);
    const flip = () => setTheme((t) => (t === "dark" ? "light" : "dark"));
    if (supportsThemeViewTransition()) {
      document.startViewTransition(() => ReactDOM.flushSync(flip));
    } else {
      flip();
    }
  };

  const onLogin = (acct) => {
    setAccount(acct);
    localStorage.setItem("fa-account", JSON.stringify(acct));
  };
  const onLogout = () => {
    setAccount(null);
    setAcctMenu(false);
    localStorage.removeItem("fa-account");
  };

  /* ---- flights (cached in this browser + synced to Google Drive) ---- */
  const [extra, setExtra] = useStateA(loadFlights);   // user-added flights
  const [syncStatus, setSyncStatus] = useStateA("local"); // local | syncing | synced | offline
  const extraRef = useRefA(extra);
  const cloudLoaded = useRefA(false);
  extraRef.current = extra;
  const cloudSync = !!(window.MeridielAuth && window.MeridielAuth.enabled && window.MeridielStore);

  // On sign-in, pull the atlas from Drive (or seed the cloud with local data).
  useEffectA(() => {
    if (!account || !cloudSync) return;
    let cancelled = false;
    setSyncStatus("syncing");
    window.MeridielStore.load().then((data) => {
      if (cancelled) return;
      if (Array.isArray(data)) setExtra(data);
      else window.MeridielStore.save(extraRef.current).catch(() => {});
      cloudLoaded.current = true;
      setSyncStatus("synced");
    }).catch(() => { if (!cancelled) setSyncStatus("offline"); });
    return () => { cancelled = true; };
  }, [account]);

  // Always cache locally; debounce-push to Drive once the cloud copy is loaded.
  useEffectA(() => {
    localStorage.setItem("fa-flights", JSON.stringify(extra));
    if (!cloudLoaded.current || !cloudSync) return;
    setSyncStatus("syncing");
    const t = setTimeout(() => {
      window.MeridielStore.save(extra)
        .then(() => setSyncStatus("synced"))
        .catch(() => setSyncStatus("offline"));
    }, 800);
    return () => clearTimeout(t);
  }, [extra]);

  const flightsAll = useMemoA(() => [...ALL, ...extra], [extra]);
  const chrono = useMemoA(
    () => [...flightsAll].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0)),
    [flightsAll]
  );

  const [activeYear, setActiveYear] = useStateA(null);
  const [replayIdx, setReplayIdx] = useStateA(null);  // flight-by-flight cursor
  const [selectedId, setSelectedId] = useStateA(null);
  const [playing, setPlaying] = useStateA(false);
  const [autoRotate, setAutoRotate] = useStateA(true);
  const [loading, setLoading] = useStateA(true);
  const [modal, setModal] = useStateA(null);          // 'share' | 'add' | 'edit' | null
  const [editingFlight, setEditingFlight] = useStateA(null);
  const [present, setPresent] = useStateA(false);
  const [mobileTab, setMobileTab] = useStateA("globe"); // globe | log | stats
  const [pushToast, toastNode] = window.useToast();

  // visible flights: replay reveals chronologically, else year filter
  const visibleFlights = useMemoA(() => {
    if (replayIdx != null) return chrono.slice(0, replayIdx + 1);
    if (!activeYear) return flightsAll;
    return flightsAll.filter((f) => f.year <= activeYear);
  }, [chrono, flightsAll, activeYear, replayIdx]);

  const yearFlights = useMemoA(() => {
    if (!activeYear) return flightsAll;
    return flightsAll.filter((f) => f.year === activeYear);
  }, [flightsAll, activeYear]);

  const currentFlight = replayIdx != null ? chrono[replayIdx] : null;

  const selectedFlight = useMemoA(
    () => flightsAll.find((f) => f.id === selectedId) || null,
    [flightsAll, selectedId]
  );

  // single source of truth for the camera: manual selection wins, else replay
  const focusFlight = selectedFlight || currentFlight;

  // ---- Replay engine: fly one flight at a time, chronologically ----
  const playRef = useRefA();
  useEffectA(() => {
    if (!playing) { clearInterval(playRef.current); return; }
    setAutoRotate(false);
    setSelectedId(null);
    let idx = (replayIdx == null || replayIdx >= chrono.length - 1) ? -1 : replayIdx;
    const step = () => {
      idx += 1;
      if (idx >= chrono.length) {
        clearInterval(playRef.current);
        setPlaying(false);
        setReplayIdx(null);   // reveal everything, release the camera
        setAutoRotate(true);
        return;
      }
      setReplayIdx(idx);
    };
    step();
    playRef.current = setInterval(step, 2300);
    return () => clearInterval(playRef.current);
    // eslint-disable-next-line
  }, [playing]);

  const progress = replayIdx != null
    ? (replayIdx + 1) / chrono.length
    : (activeYear ? (YEARS.indexOf(activeYear) + 1) / YEARS.length : 0);

  // ---- Globe ready ----
  const globeApiRef = useRefA(null);
  const onGlobeReady = (world) => {
    globeApiRef.current = world;
    setTimeout(() => setLoading(false), 600);
  };

  const handleSelect = (id) => {
    setPlaying(false);
    setSelectedId((cur) => (cur === id ? null : id));
    setAutoRotate(false);
    if (window.innerWidth <= 900) setMobileTab("globe");
  };

  const handleYear = (y) => {
    setPlaying(false);
    setReplayIdx(null);
    setActiveYear(y);
    setSelectedId(null);
  };

  const addFlight = (form) => {
    const A = window.ATLAS.AIRPORTS[form.o], B = window.ATLAS.AIRPORTS[form.d];
    const km = window.ATLAS.distKm(A, B);
    const f = {
      id: Date.now(),
      date: form.date, o: form.o, d: form.d,
      airline: form.airline || "Personal", craft: form.craft || "—", seat: form.seat || "—",
      flightNo: form.flightNo || "", reg: form.reg || "", notes: form.notes || "",
      from: { code: form.o, ...A }, to: { code: form.d, ...B },
      km, miles: Math.round(km * 0.621371), dur: window.ATLAS.durMin(km),
      year: +form.date.slice(0, 4),
    };
    setExtra((e) => [...e, f]);
  };

  const updateFlight = (id, form) => {
    const A = window.ATLAS.AIRPORTS[form.o], B = window.ATLAS.AIRPORTS[form.d];
    const km = window.ATLAS.distKm(A, B);
    setExtra((e) => e.map((f) => f.id !== id ? f : {
      ...f,
      date: form.date, o: form.o, d: form.d,
      airline: form.airline || "Personal", craft: form.craft || "—", seat: form.seat || "—",
      flightNo: form.flightNo || "", reg: form.reg || "", notes: form.notes || "",
      from: { code: form.o, ...A }, to: { code: form.d, ...B },
      km, miles: Math.round(km * 0.621371), dur: window.ATLAS.durMin(km),
      year: +form.date.slice(0, 4),
    }));
  };

  const deleteFlight = (id) => {
    setExtra((e) => e.filter((f) => f.id !== id));
    setSelectedId((sid) => (sid === id ? null : sid));
  };

  // dataUrl (a compressed photo) or null to remove — synced to Drive/local
  // cache the same as everything else in `extra`, since it's just a field
  // on the flight object.
  const setFlightPhoto = (id, dataUrl) => {
    setExtra((e) => e.map((f) => (f.id !== id ? f : { ...f, photo: dataUrl || undefined })));
  };

  // present mode → spin, no selection
  useEffectA(() => {
    if (present) { setSelectedId(null); if (replayIdx == null) setAutoRotate(true); }
  }, [present]);

  // keyboard
  useEffectA(() => {
    const onKey = (e) => {
      if (e.key === "Escape") { setPresent(false); setModal(null); setSelectedId(null); setAcctMenu(false); }
      if (e.key === " " && !modal) { e.preventDefault(); setPlaying((p) => !p); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [modal]);

  // ---- not logged in → gate ----
  if (!account) {
    return <window.LoginGate theme={theme} onToggleTheme={toggleTheme} onLogin={onLogin} />;
  }

  const liveStats = window.ATLAS.statsFor(visibleFlights);
  const presentCountries = window.ATLAS.countryList(visibleFlights);

  return (
    <div className="app">
      {/* ---- Globe stage ---- */}
      <div className="stage">
        <window.GlobeView
          flights={visibleFlights}
          selectedId={selectedId}
          onSelect={handleSelect}
          autoRotate={autoRotate}
          onReady={onGlobeReady}
          focusFlight={focusFlight}
          theme={theme}
        />
        <svg className="compass-wm" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.8">
          <circle cx="12" cy="12" r="11" />
          <circle cx="12" cy="12" r="8" strokeDasharray="1 2" />
          <path d="M12 2v20M2 12h20" strokeWidth="0.5" />
          <path d="M15 9l-2.4 5.6L7 17l2.4-5.6z" fill="currentColor" stroke="none" opacity="0.8" />
          <text x="12" y="5.5" fontSize="2.4" textAnchor="middle" fill="currentColor" fontFamily="monospace">N</text>
        </svg>
        {loading && (
          <div className="loader">
            <div style={{ textAlign: "center" }}>
              <div className="spin" style={{ margin: "0 auto" }} />
              <div className="lbl">Charting your atlas…</div>
            </div>
          </div>
        )}
      </div>

      {present ? (
        /* ---------- PRESENT MODE ---------- */
        <React.Fragment>
          <div className="present-ui present-title">
            <b>{account.name}'s Meridiel</b>
            <small>{currentFlight ? currentFlight.date : `${window.ATLAS.sinceOf(flightsAll)} — ${new Date().getFullYear()}`}</small>
          </div>

          {/* countries visited so far */}
          <div className="present-ui present-flags">
            <div className="pf-label">{presentCountries.length} countries · passport stamps</div>
            {presentCountries.map((c) => (
              <window.Flag key={c.country} cc={c.cc} label={c.country} />
            ))}
          </div>

          <div className="present-ui present-stats">
            <div className="ps"><div className="v">{liveStats.miles.toLocaleString()}</div><div className="k">Miles</div></div>
            <div className="ps"><div className="v">{liveStats.countries}</div><div className="k">Countries</div></div>
            <div className="ps"><div className="v">{liveStats.flights}</div><div className="k">Flights</div></div>
            <div className="ps"><div className="v">{liveStats.laps}×</div><div className="k">Around Earth</div></div>
          </div>
          <div className="present-exit">
            <button className="icon-btn" onClick={toggleTheme} title="Toggle theme" style={{ marginRight: 8, color: "#F3EAD6", borderColor: "rgba(243,234,214,0.35)" }}>
              {theme === "dark" ? <window.Icon.sun /> : <window.Icon.moon />}
            </button>
            <button className="btn btn-solid" onClick={() => setPresent(false)}><window.Icon.x /> Exit</button>
          </div>
          <section className="panel timeline paper-tex" style={{ maxWidth: 760, margin: "0 auto", left: 0, right: 0 }}>
            <button className="tl-play" onClick={() => setPlaying((p) => !p)}>
              {playing ? <window.Icon.pause /> : <window.Icon.play />}
            </button>
            <div className="tl-track-wrap">
              <div className="tl-meta">
                <span className="now">
                  {currentFlight ? `${currentFlight.from.code} → ${currentFlight.to.code}` : "All Years"}
                </span>
                <span className="sub">
                  {currentFlight ? `${currentFlight.from.city} → ${currentFlight.to.city}` : (playing ? "Replaying…" : "Press play to fly through your flights")}
                </span>
              </div>
              <div className="tl-track">
                <div className="tl-line" /><div className="tl-fill" style={{ width: `${progress * 100}%` }} />
              </div>
            </div>
          </section>
        </React.Fragment>
      ) : (
        /* ---------- NORMAL MODE ---------- */
        <React.Fragment>
          {/* Top bar */}
          <header className="topbar">
            <div className="brand">
              <svg className="mark" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                <circle cx="12" cy="12" r="10" />
                <path d="M2 12h20M12 2c2.6 2.7 4 5.9 4 10s-1.4 7.3-4 10c-2.6-2.7-4-5.9-4-10s1.4-7.3 4-10z" />
              </svg>
              <div className="wordmark">
                <b>Meridiel</b>
                <small>Charted by hand</small>
              </div>
            </div>

            <div className="top-owner btn-like" onClick={() => setAcctMenu((v) => !v)}>
              <div className="avatar">{account.picture ? <img src={account.picture} alt="" referrerPolicy="no-referrer" /> : (account.initial || account.name[0])}</div>
              <div className="who">
                <b>{account.name}</b>
                <small>{account.handle}</small>
              </div>
              <window.Icon.chevron className="caret" />
              {acctMenu && (
                <div className="acct-menu paper-tex" onClick={(e) => e.stopPropagation()}>
                  <div className="am-head">
                    <div className="am-av">{account.picture ? <img src={account.picture} alt="" referrerPolicy="no-referrer" /> : (account.initial || account.name[0])}</div>
                    <div className="am-id">
                      <b>{account.name}</b>
                      <small>{account.email || account.handle}</small>
                    </div>
                  </div>
                  {cloudSync && (
                    <div className={"am-sync am-sync--" + syncStatus}>
                      {syncStatus === "synced" ? "✓ Synced to Google Drive"
                        : syncStatus === "syncing" ? "Syncing to Google Drive…"
                        : syncStatus === "offline" ? "Offline · saved on this device"
                        : "Saved on this device"}
                    </div>
                  )}
                  <button className="am-item" onClick={(e) => toggleTheme(e)}>
                    {theme === "dark" ? <window.Icon.sun /> : <window.Icon.moon />}
                    {theme === "dark" ? "Light mode" : "Dark mode"}
                  </button>
                  <button className="am-item" onClick={onLogout}>
                    <window.Icon.logout /> Sign out
                  </button>
                </div>
              )}
            </div>

            <div className="top-actions">
              <button className="icon-btn" title="Toggle dark mode" onClick={toggleTheme}>
                {theme === "dark" ? <window.Icon.sun /> : <window.Icon.moon />}
              </button>
              <button className="icon-btn" title={autoRotate ? "Pause spin" : "Resume spin"} onClick={() => setAutoRotate((r) => !r)}>
                <window.Icon.rotate />
              </button>
              <button className="btn btn-ghost" title="Present" onClick={() => setPresent(true)}><window.Icon.present /> <span className="btn-label">Present</span></button>
              <button className="btn btn-accent" title="Share" onClick={() => setModal("share")}><window.Icon.share /> <span className="btn-label">Share</span></button>
            </div>
          </header>

          {/* Panels */}
          <window.FlightLog
            flights={replayIdx != null ? visibleFlights : yearFlights}
            selectedId={selectedId}
            currentId={currentFlight ? currentFlight.id : null}
            onSelect={handleSelect}
            onAddFlight={() => setModal("add")}
            className={mobileTab === "log" ? "" : "hidden-mobile"}
          />

          {selectedFlight ? (
            <window.FlightDetail
              flight={selectedFlight}
              onClose={() => setSelectedId(null)}
              onEdit={(f) => { setEditingFlight(f); setModal("edit"); }}
              onDelete={deleteFlight}
              onSetPhoto={setFlightPhoto}
              className={mobileTab === "stats" || mobileTab === "globe" ? "" : "hidden-mobile"}
            />
          ) : (
            <window.StatsRail
              flights={visibleFlights}
              allFlights={flightsAll}
              className={mobileTab === "stats" ? "" : "hidden-mobile"}
            />
          )}

          {/* Mobile tab switch */}
          <div className="mobile-tabs">
            <button className={mobileTab === "log" ? "on" : ""} onClick={() => setMobileTab("log")}>Log</button>
            <button className={mobileTab === "globe" ? "on" : ""} onClick={() => setMobileTab("globe")}>Globe</button>
            <button className={mobileTab === "stats" ? "on" : ""} onClick={() => setMobileTab("stats")}>Stats</button>
          </div>

          {/* Timeline */}
          <window.Timeline
            years={YEARS}
            activeYear={activeYear}
            onYear={handleYear}
            playing={playing}
            onTogglePlay={() => setPlaying((p) => !p)}
            progress={progress}
            replayFlight={currentFlight}
            replayCount={replayIdx != null ? replayIdx + 1 : null}
            total={chrono.length}
          />
        </React.Fragment>
      )}

      {/* click-away for account menu */}
      {acctMenu && <div style={{ position: "fixed", inset: 0, zIndex: 29 }} onClick={() => setAcctMenu(false)} />}

      {/* Modals */}
      {modal === "share" && <window.ShareModal flights={flightsAll} account={account} onClose={() => setModal(null)} pushToast={pushToast} />}
      {modal === "add" && <window.AddFlightModal onClose={() => setModal(null)} onSubmit={addFlight} pushToast={pushToast} />}
      {modal === "edit" && editingFlight && (
        <window.AddFlightModal
          initial={editingFlight}
          onClose={() => { setModal(null); setEditingFlight(null); }}
          onSubmit={(form) => updateFlight(editingFlight.id, form)}
          pushToast={pushToast}
        />
      )}

      {toastNode}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
