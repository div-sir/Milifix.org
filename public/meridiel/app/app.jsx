/* ============================================================
   MERIDIEL — Main App
   ============================================================ */
import "./components.jsx";
import "./globe.jsx";
import "./panels.jsx";
import "./modals.jsx";
import "./login.jsx";
import { ATLAS } from "./data.js";
import { MeridielData } from "./model.js";
import { MeridielAuth, MeridielStore } from "./store.js";
import { loadGlobeRuntime } from "./globe-runtime.js";
import { UI } from "./ui-registry.js";

const { useState: useStateA, useEffect: useEffectA, useLayoutEffect: useLayoutEffectA, useMemo: useMemoA, useRef: useRefA } = React;

/* ---------- persisted helpers ---------- */
function loadAccount() {
  return MeridielData.readJson(localStorage, "fa-account", null);
}
function loadTheme() {
  try { return localStorage.getItem("fa-theme") || "light"; } catch (e) { return "light"; }
}
function loadFlights() {
  const value = MeridielData.readJson(localStorage, "fa-flights", []);
  return Array.isArray(value) ? value : [];
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
  const ALL = ATLAS.FLIGHTS;
  const LOCAL_ACCOUNT = { name: "Explorer", handle: "Local atlas", initial: "E", mode: "local" };

  /* ---- auth + theme ---- */
  const [account, setAccount] = useStateA(loadAccount);
  const [theme, setTheme] = useStateA(loadTheme);
  const [acctMenu, setAcctMenu] = useStateA(false);
  const [runtimeStatus, setRuntimeStatus] = useStateA(
    () => (window.Globe && window.gsap ? "ready" : "idle")
  );
  const [runtimeAttempt, setRuntimeAttempt] = useStateA(0);

  // The welcome screen does not need WebGL. Load the heavy globe and animation
  // runtimes only after a visitor enters (or a remembered account resumes),
  // and do not mount GlobeView until both globals are actually available.
  useEffectA(() => {
    if (!account) return;
    if (window.Globe && window.gsap) {
      setRuntimeStatus("ready");
      return;
    }
    let cancelled = false;
    setRuntimeStatus("loading");
    loadGlobeRuntime()
      .then(() => { if (!cancelled) setRuntimeStatus("ready"); })
      .catch((error) => {
        console.error("Meridiel: 3D runtime failed to load —", error);
        if (!cancelled) setRuntimeStatus("error");
      });
    return () => { cancelled = true; };
  }, [account, runtimeAttempt]);

  // useLayoutEffect (not useEffect) so the DOM attribute flips synchronously —
  // required for the view-transition screenshot below to capture the new theme.
  useLayoutEffectA(() => {
    document.documentElement.setAttribute("data-theme", theme);
    try { localStorage.setItem("fa-theme", theme); } catch (e) {
      console.error("Meridiel: theme preference could not be saved —", e);
    }
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
    const result = MeridielData.writeJson(localStorage, "fa-account", acct);
    if (!result.ok) console.error("Meridiel: account cache could not be saved —", result.error);
  };
  const onExplore = () => {
    setAccount(LOCAL_ACCOUNT);
  };
  const onLogout = () => {
    setAccount(null);
    setAcctMenu(false);
    cloudLoaded.current = false;
    try { localStorage.removeItem("fa-account"); } catch (e) {
      console.error("Meridiel: account cache could not be cleared —", e);
    }
  };

  /* ---- flights (cached in this browser + synced to Google Drive) ---- */
  const [extra, setExtra] = useStateA(loadFlights);   // user-added flights
  const [syncStatus, setSyncStatus] = useStateA("local"); // local | syncing | synced | offline | reauth | storage-full
  const [storageError, setStorageError] = useStateA(false);
  const extraRef = useRefA(extra);
  const cloudLoaded = useRefA(false);
  extraRef.current = extra;
  const cloudSync = !!(account && account.mode !== "local" && MeridielAuth.enabled && MeridielStore);

  // A failed *silent* refresh (browser blocking the hidden iframe GIS needs,
  // third-party cookies off, etc.) is tagged "reauth-required" by store.js —
  // that's not "offline", it just needs one more click, so it gets its own
  // status instead of being lumped in with a real network failure.
  const statusForSyncError = (e) => {
    console.error("Meridiel: Drive sync failed —", e);
    return e && e.code === "reauth-required" ? "reauth" : "offline";
  };

  // On sign-in, pull the atlas from Drive (or seed the cloud with local data).
  useEffectA(() => {
    if (!account || !cloudSync) return;
    let cancelled = false;
    setSyncStatus("syncing");
    MeridielStore.load().then((data) => {
      if (cancelled) return;
      if (Array.isArray(data)) setExtra((local) => MeridielData.mergeByFlightId(local, data));
      else MeridielStore.save(extraRef.current).catch(() => {});
      cloudLoaded.current = true;
      setSyncStatus("synced");
    }).catch((e) => { if (!cancelled) setSyncStatus(statusForSyncError(e)); });
    return () => { cancelled = true; };
  }, [account]);

  // Always cache locally; push to Drive right away once the cloud copy is
  // loaded. Each add/edit/delete/photo change is one discrete user action —
  // not continuous typing — so there's nothing to debounce; every change
  // gets its own sync instead of waiting on an artificial delay.
  useEffectA(() => {
    const localResult = MeridielData.writeJson(localStorage, "fa-flights", extra);
    if (!localResult.ok) {
      console.error("Meridiel: local flight save failed —", localResult.error);
      setStorageError(true);
    } else setStorageError(false);
    if (!cloudLoaded.current || !cloudSync) return;
    setSyncStatus("syncing");
    MeridielStore.save(extra)
      .then(() => setSyncStatus("synced"))
      .catch((e) => setSyncStatus(statusForSyncError(e)));
  }, [extra]);

  // Manual reconnect: an interactive sign-in works even when the browser
  // blocks the silent refresh, since it's a real user gesture, not a hidden
  // iframe. Re-runs the same pull-from-Drive flow afterwards.
  const reconnectSync = () => {
    if (!cloudSync) return;
    setSyncStatus("syncing");
    MeridielAuth.signIn()
      .then(() => MeridielStore.load())
      .then((data) => {
        if (Array.isArray(data)) setExtra((local) => MeridielData.mergeByFlightId(local, data));
        else MeridielStore.save(extraRef.current).catch(() => {});
        cloudLoaded.current = true;
        setSyncStatus("synced");
      })
      .catch((e) => setSyncStatus(statusForSyncError(e)));
  };

  // Hydrate every flight so its embedded from/to are always present — an
  // older-schema or partially-synced record with only o/d codes would
  // otherwise crash any panel/stat that reads f.from.country etc.
  const flightsAll = useMemoA(() => {
    const removed = MeridielData.deletedIds(extra);
    const bundled = ALL.filter((f) => !removed.has(f.id));
    return [...bundled, ...MeridielData.activeRecords(extra)]
      .map((f) => ATLAS.hydrateFlight(f));
  }, [extra]);

  const [selectedId, setSelectedId] = useStateA(null);
  const [autoRotate, setAutoRotate] = useStateA(true);
  const [loading, setLoading] = useStateA(true);
  const [modal, setModal] = useStateA(null);          // 'share' | 'add' | 'edit' | null
  const [editingFlight, setEditingFlight] = useStateA(null);
  const [present, setPresent] = useStateA(false);
  const [mobileTab, setMobileTab] = useStateA("globe"); // globe | log | stats
  const [pushToast, toastNode] = UI.useToast();

  const connectGoogle = () => {
    if (!MeridielAuth.enabled) {
      pushToast("Google sync is not configured.");
      return;
    }
    setSyncStatus("syncing");
    MeridielAuth.signIn().then((profile) => {
      const name = (profile.name || profile.email || "Explorer").trim();
      onLogin({
        name,
        email: profile.email || "",
        handle: profile.email ? "@" + profile.email.split("@")[0] : "",
        initial: (name[0] || "?").toUpperCase(),
        picture: profile.picture || "",
        mode: "google",
      });
      setAcctMenu(false);
      pushToast("Google connected. Syncing your atlas…");
    }).catch((error) => {
      console.error("Meridiel: Google connection failed —", error);
      setSyncStatus("local");
      pushToast("Google connection didn’t complete.");
    });
  };

  const selectedFlight = useMemoA(
    () => flightsAll.find((f) => f.id === selectedId) || null,
    [flightsAll, selectedId]
  );

  // single source of truth for the camera
  const focusFlight = selectedFlight;

  // ---- Globe ready ----
  const globeApiRef = useRefA(null);
  const onGlobeReady = (world) => {
    globeApiRef.current = world;
    setTimeout(() => setLoading(false), 600);
  };

  const handleSelect = (id) => {
    setSelectedId((cur) => (cur === id ? null : id));
    setAutoRotate(false);
    if (window.innerWidth <= 900) setMobileTab("globe");
  };

  const addFlight = (form) => {
    const A = ATLAS.AIRPORTS[form.o], B = ATLAS.AIRPORTS[form.d];
    const km = ATLAS.distKm(A, B);
    const f = {
      id: MeridielData.createId(),
      date: form.date, o: form.o, d: form.d,
      airline: form.airline || "Personal", craft: form.craft || "—", seat: form.seat || "—",
      flightNo: form.flightNo || "", reg: form.reg || "", notes: form.notes || "",
      from: { code: form.o, ...A }, to: { code: form.d, ...B },
      km, miles: Math.round(km * 0.621371), dur: ATLAS.durMin(km),
      year: +form.date.slice(0, 4),
      updatedAt: Date.now(),
    };
    setExtra((e) => [...e, f]);
  };

  const updateFlight = (id, form) => {
    const A = ATLAS.AIRPORTS[form.o], B = ATLAS.AIRPORTS[form.d];
    const km = ATLAS.distKm(A, B);
    setExtra((e) => e.map((f) => f.id !== id ? f : {
      ...f,
      date: form.date, o: form.o, d: form.d,
      airline: form.airline || "Personal", craft: form.craft || "—", seat: form.seat || "—",
      flightNo: form.flightNo || "", reg: form.reg || "", notes: form.notes || "",
      from: { code: form.o, ...A }, to: { code: form.d, ...B },
      km, miles: Math.round(km * 0.621371), dur: ATLAS.durMin(km),
      year: +form.date.slice(0, 4),
      updatedAt: Date.now(),
    }));
  };

  const deleteFlight = (id) => {
    setExtra((e) => MeridielData.markDeleted(e, id));
    setSelectedId((sid) => (sid === id ? null : sid));
  };

  // dataUrl (a compressed photo) or null to remove — synced to Drive/local
  // cache the same as everything else in `extra`, since it's just a field
  // on the flight object.
  const setFlightPhoto = (id, dataUrl) => {
    setExtra((e) => e.map((f) => (f.id !== id ? f : { ...f, photo: dataUrl || undefined, updatedAt: Date.now() })));
  };

  // present mode → spin, no selection
  useEffectA(() => {
    if (present) { setSelectedId(null); setAutoRotate(true); }
  }, [present]);

  // keyboard
  useEffectA(() => {
    const onKey = (e) => {
      if (e.key === "Escape") { setPresent(false); setModal(null); setSelectedId(null); setAcctMenu(false); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // ---- not logged in → gate ----
  if (!account) {
    return <UI.LoginGate theme={theme} onToggleTheme={toggleTheme} onLogin={onLogin} onExplore={onExplore} />;
  }

  const liveStats = ATLAS.statsFor(flightsAll);
  const presentCountries = ATLAS.countryList(flightsAll);

  return (
    <div className="app">
      {/* ---- Globe stage ---- */}
      <div className="stage">
        {runtimeStatus === "ready" && (
          <UI.GlobeView
            flights={flightsAll}
            selectedId={selectedId}
            onSelect={handleSelect}
            autoRotate={autoRotate}
            onReady={onGlobeReady}
            focusFlight={focusFlight}
            theme={theme}
          />
        )}
        <svg className="compass-wm" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.8">
          <circle cx="12" cy="12" r="11" />
          <circle cx="12" cy="12" r="8" strokeDasharray="1 2" />
          <path d="M12 2v20M2 12h20" strokeWidth="0.5" />
          <path d="M15 9l-2.4 5.6L7 17l2.4-5.6z" fill="currentColor" stroke="none" opacity="0.8" />
          <text x="12" y="5.5" fontSize="2.4" textAnchor="middle" fill="currentColor" fontFamily="monospace">N</text>
        </svg>
        {(runtimeStatus !== "ready" || loading) && (
          <div className="loader">
            <div style={{ textAlign: "center" }}>
              {runtimeStatus === "error" ? (
                <React.Fragment>
                  <div className="lbl">The 3D globe couldn’t load.</div>
                  <button className="btn btn-solid" onClick={() => setRuntimeAttempt((attempt) => attempt + 1)}>Retry globe</button>
                </React.Fragment>
              ) : (
                <React.Fragment>
                  <div className="spin" style={{ margin: "0 auto" }} />
                  <div className="lbl">{runtimeStatus === "ready" ? "Charting your atlas…" : "Loading the 3D atlas engine…"}</div>
                </React.Fragment>
              )}
            </div>
          </div>
        )}
      </div>

      {present ? (
        /* ---------- PRESENT MODE ---------- */
        <React.Fragment>
          <div className="present-ui present-title">
            <b>{account.name}'s Meridiel</b>
            <small>{ATLAS.sinceOf(flightsAll)} — {new Date().getFullYear()}</small>
          </div>

          {/* countries visited so far */}
          <div className="present-ui present-flags">
            <div className="pf-label">{presentCountries.length} countries · passport stamps</div>
            {presentCountries.map((c) => (
              <UI.Flag key={c.country} cc={c.cc} label={c.country} />
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
              {theme === "dark" ? <UI.Icon.sun /> : <UI.Icon.moon />}
            </button>
            <button className="btn btn-solid" onClick={() => setPresent(false)}><UI.Icon.x /> Exit</button>
          </div>
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

            <div className="account-control">
              <button
                type="button"
                className="top-owner btn-like"
                onClick={() => setAcctMenu((v) => !v)}
                aria-label="Open account menu"
                aria-expanded={acctMenu}
                aria-controls="meridiel-account-menu"
              >
                <span className="avatar">{account.picture ? <img src={account.picture} alt="" referrerPolicy="no-referrer" /> : (account.initial || account.name[0])}</span>
                <span className="who">
                  <b>{account.name}</b>
                  <small>{account.handle}</small>
                </span>
                <UI.Icon.chevron className="caret" />
              </button>
              {acctMenu && (
                <div id="meridiel-account-menu" className="acct-menu paper-tex" onClick={(e) => e.stopPropagation()}>
                  <div className="am-head">
                    <div className="am-av">{account.picture ? <img src={account.picture} alt="" referrerPolicy="no-referrer" /> : (account.initial || account.name[0])}</div>
                    <div className="am-id">
                      <b>{account.name}</b>
                      <small>{account.email || account.handle}</small>
                    </div>
                  </div>
                  {cloudSync ? (
                    <div className={"am-sync am-sync--" + (storageError ? "storage-full" : syncStatus)}>
                      {storageError ? "Device storage full · cloud sync only"
                        : syncStatus === "synced" ? "✓ Synced to Google Drive"
                        : syncStatus === "syncing" ? (
                            <React.Fragment>
                              <span className="am-sync-spin" /> Syncing to Google Drive…
                            </React.Fragment>
                          )
                        : syncStatus === "reauth" ? (
                            <button type="button" className="am-sync-reconnect" onClick={reconnectSync}>
                              ⟲ Reconnect Google Drive
                            </button>
                          )
                        : syncStatus === "offline" ? "Offline · saved in this browser"
                        : "Saved in this browser"}
                    </div>
                  ) : (
                    <div className={"am-sync " + (storageError ? "am-sync--storage-full" : "am-sync--local")}>
                      {storageError ? "Browser storage full · changes not saved" : "Local only · saved in this browser"}
                    </div>
                  )}
                  {account.mode === "local" && (
                    <button className="am-item" onClick={connectGoogle}>
                      <UI.Icon.google /> Sync with Google Drive
                    </button>
                  )}
                  <button className="am-item" onClick={() => { setAcctMenu(false); setModal("share"); }}>
                    <UI.Icon.share /> Share atlas
                  </button>
                  <button className="am-item" onClick={() => { setAcctMenu(false); setPresent(true); }}>
                    <UI.Icon.present /> Present mode
                  </button>
                  <button className="am-item" onClick={(e) => toggleTheme(e)}>
                    {theme === "dark" ? <UI.Icon.sun /> : <UI.Icon.moon />}
                    {theme === "dark" ? "Light mode" : "Dark mode"}
                  </button>
                  <button className="am-item" onClick={onLogout}>
                    <UI.Icon.logout /> Sign out
                  </button>
                </div>
              )}
            </div>

            <div className="top-actions">
              <button className="icon-btn top-action-secondary" title={autoRotate ? "Pause spin" : "Resume spin"} onClick={() => setAutoRotate((r) => !r)}>
                <UI.Icon.rotate />
              </button>
              <button className="btn btn-ghost top-action-secondary" title="Share atlas" onClick={() => setModal("share")}><UI.Icon.share /> <span className="btn-label">Share</span></button>
              <button className="btn btn-accent" title="Add flight" onClick={() => setModal("add")}><UI.Icon.plus /> <span className="btn-label">Add flight</span></button>
            </div>
          </header>

          {/* Panels */}
          <UI.FlightLog
            flights={flightsAll}
            selectedId={selectedId}
            onSelect={handleSelect}
            onAddFlight={() => setModal("add")}
            syncing={syncStatus === "syncing"}
            className={mobileTab === "log" ? "" : "hidden-mobile"}
          />

          {selectedFlight ? (
            <UI.FlightDetail
              flight={selectedFlight}
              onClose={() => setSelectedId(null)}
              onEdit={(f) => { setEditingFlight(f); setModal("edit"); }}
              onDelete={deleteFlight}
              onSetPhoto={setFlightPhoto}
              syncing={syncStatus === "syncing"}
              className={mobileTab === "stats" || mobileTab === "globe" ? "" : "hidden-mobile"}
            />
          ) : (
            <UI.StatsRail
              flights={flightsAll}
              allFlights={flightsAll}
              className={mobileTab === "stats" ? "" : "hidden-mobile"}
            />
          )}

          {/* Mobile tab switch */}
          <div className="mobile-tabs" role="tablist" aria-label="Atlas views">
            <button role="tab" aria-selected={mobileTab === "log"} className={mobileTab === "log" ? "on" : ""} onClick={() => setMobileTab("log")}>Log</button>
            <button role="tab" aria-selected={mobileTab === "globe"} className={mobileTab === "globe" ? "on" : ""} onClick={() => setMobileTab("globe")}>Globe</button>
            <button role="tab" aria-selected={mobileTab === "stats"} className={mobileTab === "stats" ? "on" : ""} onClick={() => setMobileTab("stats")}>Stats</button>
          </div>
        </React.Fragment>
      )}

      {/* click-away for account menu */}
      {acctMenu && <div style={{ position: "fixed", inset: 0, zIndex: 29 }} onClick={() => setAcctMenu(false)} />}

      {/* Modals */}
      {modal === "share" && <UI.ShareModal flights={flightsAll} account={account} onClose={() => setModal(null)} pushToast={pushToast} />}
      {modal === "add" && <UI.AddFlightModal onClose={() => setModal(null)} onSubmit={addFlight} pushToast={pushToast} />}
      {modal === "edit" && editingFlight && (
        <UI.AddFlightModal
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
