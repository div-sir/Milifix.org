/* 由 scripts/build-meridiel.mjs 從 app.jsx 編譯產生，請勿手動編輯 */
(function () {
/* ============================================================
   MERIDIEL — Main App
   ============================================================ */
const {
  useState: useStateA,
  useEffect: useEffectA,
  useLayoutEffect: useLayoutEffectA,
  useMemo: useMemoA,
  useRef: useRefA
} = React;

/* ---------- persisted helpers ---------- */
function loadAccount() {
  return window.MeridielData.readJson(localStorage, "fa-account", null);
}
function loadTheme() {
  try {
    return localStorage.getItem("fa-theme") || "light";
  } catch (e) {
    return "light";
  }
}
function loadFlights() {
  const value = window.MeridielData.readJson(localStorage, "fa-flights", []);
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
  return typeof document.startViewTransition === "function" && !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
function App() {
  const ALL = window.ATLAS.FLIGHTS;
  const LOCAL_ACCOUNT = {
    name: "Explorer",
    handle: "Local atlas",
    initial: "E",
    mode: "local"
  };

  /* ---- auth + theme ---- */
  const [account, setAccount] = useStateA(loadAccount);
  const [theme, setTheme] = useStateA(loadTheme);
  const [acctMenu, setAcctMenu] = useStateA(false);

  // useLayoutEffect (not useEffect) so the DOM attribute flips synchronously —
  // required for the view-transition screenshot below to capture the new theme.
  useLayoutEffectA(() => {
    document.documentElement.setAttribute("data-theme", theme);
    try {
      localStorage.setItem("fa-theme", theme);
    } catch (e) {
      console.error("Meridiel: theme preference could not be saved —", e);
    }
  }, [theme]);
  const toggleTheme = ev => {
    setThemeTransitionOrigin(ev);
    const flip = () => setTheme(t => t === "dark" ? "light" : "dark");
    if (supportsThemeViewTransition()) {
      document.startViewTransition(() => ReactDOM.flushSync(flip));
    } else {
      flip();
    }
  };
  const onLogin = acct => {
    setAccount(acct);
    const result = window.MeridielData.writeJson(localStorage, "fa-account", acct);
    if (!result.ok) console.error("Meridiel: account cache could not be saved —", result.error);
  };
  const onExplore = () => {
    setAccount(LOCAL_ACCOUNT);
  };
  const onLogout = () => {
    setAccount(null);
    setAcctMenu(false);
    cloudLoaded.current = false;
    try {
      localStorage.removeItem("fa-account");
    } catch (e) {
      console.error("Meridiel: account cache could not be cleared —", e);
    }
  };

  /* ---- flights (cached in this browser + synced to Google Drive) ---- */
  const [extra, setExtra] = useStateA(loadFlights); // user-added flights
  const [syncStatus, setSyncStatus] = useStateA("local"); // local | syncing | synced | offline | reauth | storage-full
  const [storageError, setStorageError] = useStateA(false);
  const extraRef = useRefA(extra);
  const cloudLoaded = useRefA(false);
  extraRef.current = extra;
  const cloudSync = !!(account && account.mode !== "local" && window.MeridielAuth && window.MeridielAuth.enabled && window.MeridielStore);

  // A failed *silent* refresh (browser blocking the hidden iframe GIS needs,
  // third-party cookies off, etc.) is tagged "reauth-required" by store.js —
  // that's not "offline", it just needs one more click, so it gets its own
  // status instead of being lumped in with a real network failure.
  const statusForSyncError = e => {
    console.error("Meridiel: Drive sync failed —", e);
    return e && e.code === "reauth-required" ? "reauth" : "offline";
  };

  // On sign-in, pull the atlas from Drive (or seed the cloud with local data).
  useEffectA(() => {
    if (!account || !cloudSync) return;
    let cancelled = false;
    setSyncStatus("syncing");
    window.MeridielStore.load().then(data => {
      if (cancelled) return;
      if (Array.isArray(data)) setExtra(local => window.MeridielData.mergeByFlightId(local, data));else window.MeridielStore.save(extraRef.current).catch(() => {});
      cloudLoaded.current = true;
      setSyncStatus("synced");
    }).catch(e => {
      if (!cancelled) setSyncStatus(statusForSyncError(e));
    });
    return () => {
      cancelled = true;
    };
  }, [account]);

  // Always cache locally; push to Drive right away once the cloud copy is
  // loaded. Each add/edit/delete/photo change is one discrete user action —
  // not continuous typing — so there's nothing to debounce; every change
  // gets its own sync instead of waiting on an artificial delay.
  useEffectA(() => {
    const localResult = window.MeridielData.writeJson(localStorage, "fa-flights", extra);
    if (!localResult.ok) {
      console.error("Meridiel: local flight save failed —", localResult.error);
      setStorageError(true);
    } else setStorageError(false);
    if (!cloudLoaded.current || !cloudSync) return;
    setSyncStatus("syncing");
    window.MeridielStore.save(extra).then(() => setSyncStatus("synced")).catch(e => setSyncStatus(statusForSyncError(e)));
  }, [extra]);

  // Manual reconnect: an interactive sign-in works even when the browser
  // blocks the silent refresh, since it's a real user gesture, not a hidden
  // iframe. Re-runs the same pull-from-Drive flow afterwards.
  const reconnectSync = () => {
    if (!cloudSync || !window.MeridielAuth) return;
    setSyncStatus("syncing");
    window.MeridielAuth.signIn().then(() => window.MeridielStore.load()).then(data => {
      if (Array.isArray(data)) setExtra(local => window.MeridielData.mergeByFlightId(local, data));else window.MeridielStore.save(extraRef.current).catch(() => {});
      cloudLoaded.current = true;
      setSyncStatus("synced");
    }).catch(e => setSyncStatus(statusForSyncError(e)));
  };

  // Hydrate every flight so its embedded from/to are always present — an
  // older-schema or partially-synced record with only o/d codes would
  // otherwise crash any panel/stat that reads f.from.country etc.
  const flightsAll = useMemoA(() => {
    const removed = window.MeridielData.deletedIds(extra);
    const bundled = ALL.filter(f => !removed.has(f.id));
    return [...bundled, ...window.MeridielData.activeRecords(extra)].map(f => window.ATLAS.hydrateFlight(f));
  }, [extra]);
  const [selectedId, setSelectedId] = useStateA(null);
  const [autoRotate, setAutoRotate] = useStateA(true);
  const [loading, setLoading] = useStateA(true);
  const [modal, setModal] = useStateA(null); // 'share' | 'add' | 'edit' | null
  const [editingFlight, setEditingFlight] = useStateA(null);
  const [present, setPresent] = useStateA(false);
  const [mobileTab, setMobileTab] = useStateA("globe"); // globe | log | stats
  const [pushToast, toastNode] = window.useToast();
  const connectGoogle = () => {
    if (!(window.MeridielAuth && window.MeridielAuth.enabled)) {
      pushToast("Google sync is not configured.");
      return;
    }
    setSyncStatus("syncing");
    window.MeridielAuth.signIn().then(profile => {
      const name = (profile.name || profile.email || "Explorer").trim();
      onLogin({
        name,
        email: profile.email || "",
        handle: profile.email ? "@" + profile.email.split("@")[0] : "",
        initial: (name[0] || "?").toUpperCase(),
        picture: profile.picture || "",
        mode: "google"
      });
      setAcctMenu(false);
      pushToast("Google connected. Syncing your atlas…");
    }).catch(error => {
      console.error("Meridiel: Google connection failed —", error);
      setSyncStatus("local");
      pushToast("Google connection didn’t complete.");
    });
  };
  const selectedFlight = useMemoA(() => flightsAll.find(f => f.id === selectedId) || null, [flightsAll, selectedId]);

  // single source of truth for the camera
  const focusFlight = selectedFlight;

  // ---- Globe ready ----
  const globeApiRef = useRefA(null);
  const onGlobeReady = world => {
    globeApiRef.current = world;
    setTimeout(() => setLoading(false), 600);
  };
  const handleSelect = id => {
    setSelectedId(cur => cur === id ? null : id);
    setAutoRotate(false);
    if (window.innerWidth <= 900) setMobileTab("globe");
  };
  const addFlight = form => {
    const A = window.ATLAS.AIRPORTS[form.o],
      B = window.ATLAS.AIRPORTS[form.d];
    const km = window.ATLAS.distKm(A, B);
    const f = {
      id: window.MeridielData.createId(),
      date: form.date,
      o: form.o,
      d: form.d,
      airline: form.airline || "Personal",
      craft: form.craft || "—",
      seat: form.seat || "—",
      flightNo: form.flightNo || "",
      reg: form.reg || "",
      notes: form.notes || "",
      from: {
        code: form.o,
        ...A
      },
      to: {
        code: form.d,
        ...B
      },
      km,
      miles: Math.round(km * 0.621371),
      dur: window.ATLAS.durMin(km),
      year: +form.date.slice(0, 4),
      updatedAt: Date.now()
    };
    setExtra(e => [...e, f]);
  };
  const updateFlight = (id, form) => {
    const A = window.ATLAS.AIRPORTS[form.o],
      B = window.ATLAS.AIRPORTS[form.d];
    const km = window.ATLAS.distKm(A, B);
    setExtra(e => e.map(f => f.id !== id ? f : {
      ...f,
      date: form.date,
      o: form.o,
      d: form.d,
      airline: form.airline || "Personal",
      craft: form.craft || "—",
      seat: form.seat || "—",
      flightNo: form.flightNo || "",
      reg: form.reg || "",
      notes: form.notes || "",
      from: {
        code: form.o,
        ...A
      },
      to: {
        code: form.d,
        ...B
      },
      km,
      miles: Math.round(km * 0.621371),
      dur: window.ATLAS.durMin(km),
      year: +form.date.slice(0, 4),
      updatedAt: Date.now()
    }));
  };
  const deleteFlight = id => {
    setExtra(e => window.MeridielData.markDeleted(e, id));
    setSelectedId(sid => sid === id ? null : sid);
  };

  // dataUrl (a compressed photo) or null to remove — synced to Drive/local
  // cache the same as everything else in `extra`, since it's just a field
  // on the flight object.
  const setFlightPhoto = (id, dataUrl) => {
    setExtra(e => e.map(f => f.id !== id ? f : {
      ...f,
      photo: dataUrl || undefined,
      updatedAt: Date.now()
    }));
  };

  // present mode → spin, no selection
  useEffectA(() => {
    if (present) {
      setSelectedId(null);
      setAutoRotate(true);
    }
  }, [present]);

  // keyboard
  useEffectA(() => {
    const onKey = e => {
      if (e.key === "Escape") {
        setPresent(false);
        setModal(null);
        setSelectedId(null);
        setAcctMenu(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // ---- not logged in → gate ----
  if (!account) {
    return /*#__PURE__*/React.createElement(window.LoginGate, {
      theme: theme,
      onToggleTheme: toggleTheme,
      onLogin: onLogin,
      onExplore: onExplore
    });
  }
  const liveStats = window.ATLAS.statsFor(flightsAll);
  const presentCountries = window.ATLAS.countryList(flightsAll);
  return /*#__PURE__*/React.createElement("div", {
    className: "app"
  }, /*#__PURE__*/React.createElement("div", {
    className: "stage"
  }, /*#__PURE__*/React.createElement(window.GlobeView, {
    flights: flightsAll,
    selectedId: selectedId,
    onSelect: handleSelect,
    autoRotate: autoRotate,
    onReady: onGlobeReady,
    focusFlight: focusFlight,
    theme: theme
  }), /*#__PURE__*/React.createElement("svg", {
    className: "compass-wm",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "0.8"
  }, /*#__PURE__*/React.createElement("circle", {
    cx: "12",
    cy: "12",
    r: "11"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "12",
    cy: "12",
    r: "8",
    strokeDasharray: "1 2"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M12 2v20M2 12h20",
    strokeWidth: "0.5"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M15 9l-2.4 5.6L7 17l2.4-5.6z",
    fill: "currentColor",
    stroke: "none",
    opacity: "0.8"
  }), /*#__PURE__*/React.createElement("text", {
    x: "12",
    y: "5.5",
    fontSize: "2.4",
    textAnchor: "middle",
    fill: "currentColor",
    fontFamily: "monospace"
  }, "N")), loading && /*#__PURE__*/React.createElement("div", {
    className: "loader"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: "center"
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "spin",
    style: {
      margin: "0 auto"
    }
  }), /*#__PURE__*/React.createElement("div", {
    className: "lbl"
  }, "Charting your atlas\u2026")))), present ?
  /*#__PURE__*/
  /* ---------- PRESENT MODE ---------- */
  React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "present-ui present-title"
  }, /*#__PURE__*/React.createElement("b", null, account.name, "'s Meridiel"), /*#__PURE__*/React.createElement("small", null, window.ATLAS.sinceOf(flightsAll), " \u2014 ", new Date().getFullYear())), /*#__PURE__*/React.createElement("div", {
    className: "present-ui present-flags"
  }, /*#__PURE__*/React.createElement("div", {
    className: "pf-label"
  }, presentCountries.length, " countries \xB7 passport stamps"), presentCountries.map(c => /*#__PURE__*/React.createElement(window.Flag, {
    key: c.country,
    cc: c.cc,
    label: c.country
  }))), /*#__PURE__*/React.createElement("div", {
    className: "present-ui present-stats"
  }, /*#__PURE__*/React.createElement("div", {
    className: "ps"
  }, /*#__PURE__*/React.createElement("div", {
    className: "v"
  }, liveStats.miles.toLocaleString()), /*#__PURE__*/React.createElement("div", {
    className: "k"
  }, "Miles")), /*#__PURE__*/React.createElement("div", {
    className: "ps"
  }, /*#__PURE__*/React.createElement("div", {
    className: "v"
  }, liveStats.countries), /*#__PURE__*/React.createElement("div", {
    className: "k"
  }, "Countries")), /*#__PURE__*/React.createElement("div", {
    className: "ps"
  }, /*#__PURE__*/React.createElement("div", {
    className: "v"
  }, liveStats.flights), /*#__PURE__*/React.createElement("div", {
    className: "k"
  }, "Flights")), /*#__PURE__*/React.createElement("div", {
    className: "ps"
  }, /*#__PURE__*/React.createElement("div", {
    className: "v"
  }, liveStats.laps, "\xD7"), /*#__PURE__*/React.createElement("div", {
    className: "k"
  }, "Around Earth"))), /*#__PURE__*/React.createElement("div", {
    className: "present-exit"
  }, /*#__PURE__*/React.createElement("button", {
    className: "icon-btn",
    onClick: toggleTheme,
    title: "Toggle theme",
    style: {
      marginRight: 8,
      color: "#F3EAD6",
      borderColor: "rgba(243,234,214,0.35)"
    }
  }, theme === "dark" ? /*#__PURE__*/React.createElement(window.Icon.sun, null) : /*#__PURE__*/React.createElement(window.Icon.moon, null)), /*#__PURE__*/React.createElement("button", {
    className: "btn btn-solid",
    onClick: () => setPresent(false)
  }, /*#__PURE__*/React.createElement(window.Icon.x, null), " Exit"))) :
  /*#__PURE__*/
  /* ---------- NORMAL MODE ---------- */
  React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("header", {
    className: "topbar"
  }, /*#__PURE__*/React.createElement("div", {
    className: "brand"
  }, /*#__PURE__*/React.createElement("svg", {
    className: "mark",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.6"
  }, /*#__PURE__*/React.createElement("circle", {
    cx: "12",
    cy: "12",
    r: "10"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M2 12h20M12 2c2.6 2.7 4 5.9 4 10s-1.4 7.3-4 10c-2.6-2.7-4-5.9-4-10s1.4-7.3 4-10z"
  })), /*#__PURE__*/React.createElement("div", {
    className: "wordmark"
  }, /*#__PURE__*/React.createElement("b", null, "Meridiel"), /*#__PURE__*/React.createElement("small", null, "Charted by hand"))), /*#__PURE__*/React.createElement("div", {
    className: "account-control"
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "top-owner btn-like",
    onClick: () => setAcctMenu(v => !v),
    "aria-label": "Open account menu",
    "aria-expanded": acctMenu,
    "aria-controls": "meridiel-account-menu"
  }, /*#__PURE__*/React.createElement("span", {
    className: "avatar"
  }, account.picture ? /*#__PURE__*/React.createElement("img", {
    src: account.picture,
    alt: "",
    referrerPolicy: "no-referrer"
  }) : account.initial || account.name[0]), /*#__PURE__*/React.createElement("span", {
    className: "who"
  }, /*#__PURE__*/React.createElement("b", null, account.name), /*#__PURE__*/React.createElement("small", null, account.handle)), /*#__PURE__*/React.createElement(window.Icon.chevron, {
    className: "caret"
  })), acctMenu && /*#__PURE__*/React.createElement("div", {
    id: "meridiel-account-menu",
    className: "acct-menu paper-tex",
    onClick: e => e.stopPropagation()
  }, /*#__PURE__*/React.createElement("div", {
    className: "am-head"
  }, /*#__PURE__*/React.createElement("div", {
    className: "am-av"
  }, account.picture ? /*#__PURE__*/React.createElement("img", {
    src: account.picture,
    alt: "",
    referrerPolicy: "no-referrer"
  }) : account.initial || account.name[0]), /*#__PURE__*/React.createElement("div", {
    className: "am-id"
  }, /*#__PURE__*/React.createElement("b", null, account.name), /*#__PURE__*/React.createElement("small", null, account.email || account.handle))), cloudSync ? /*#__PURE__*/React.createElement("div", {
    className: "am-sync am-sync--" + (storageError ? "storage-full" : syncStatus)
  }, storageError ? "Device storage full · cloud sync only" : syncStatus === "synced" ? "✓ Synced to Google Drive" : syncStatus === "syncing" ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("span", {
    className: "am-sync-spin"
  }), " Syncing to Google Drive\u2026") : syncStatus === "reauth" ? /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "am-sync-reconnect",
    onClick: reconnectSync
  }, "\u27F2 Reconnect Google Drive") : syncStatus === "offline" ? "Offline · saved in this browser" : "Saved in this browser") : /*#__PURE__*/React.createElement("div", {
    className: "am-sync " + (storageError ? "am-sync--storage-full" : "am-sync--local")
  }, storageError ? "Browser storage full · changes not saved" : "Local only · saved in this browser"), account.mode === "local" && /*#__PURE__*/React.createElement("button", {
    className: "am-item",
    onClick: connectGoogle
  }, /*#__PURE__*/React.createElement(window.Icon.google, null), " Sync with Google Drive"), /*#__PURE__*/React.createElement("button", {
    className: "am-item",
    onClick: () => {
      setAcctMenu(false);
      setModal("share");
    }
  }, /*#__PURE__*/React.createElement(window.Icon.share, null), " Share atlas"), /*#__PURE__*/React.createElement("button", {
    className: "am-item",
    onClick: () => {
      setAcctMenu(false);
      setPresent(true);
    }
  }, /*#__PURE__*/React.createElement(window.Icon.present, null), " Present mode"), /*#__PURE__*/React.createElement("button", {
    className: "am-item",
    onClick: e => toggleTheme(e)
  }, theme === "dark" ? /*#__PURE__*/React.createElement(window.Icon.sun, null) : /*#__PURE__*/React.createElement(window.Icon.moon, null), theme === "dark" ? "Light mode" : "Dark mode"), /*#__PURE__*/React.createElement("button", {
    className: "am-item",
    onClick: onLogout
  }, /*#__PURE__*/React.createElement(window.Icon.logout, null), " Sign out"))), /*#__PURE__*/React.createElement("div", {
    className: "top-actions"
  }, /*#__PURE__*/React.createElement("button", {
    className: "icon-btn top-action-secondary",
    title: autoRotate ? "Pause spin" : "Resume spin",
    onClick: () => setAutoRotate(r => !r)
  }, /*#__PURE__*/React.createElement(window.Icon.rotate, null)), /*#__PURE__*/React.createElement("button", {
    className: "btn btn-ghost top-action-secondary",
    title: "Share atlas",
    onClick: () => setModal("share")
  }, /*#__PURE__*/React.createElement(window.Icon.share, null), " ", /*#__PURE__*/React.createElement("span", {
    className: "btn-label"
  }, "Share")), /*#__PURE__*/React.createElement("button", {
    className: "btn btn-accent",
    title: "Add flight",
    onClick: () => setModal("add")
  }, /*#__PURE__*/React.createElement(window.Icon.plus, null), " ", /*#__PURE__*/React.createElement("span", {
    className: "btn-label"
  }, "Add flight")))), /*#__PURE__*/React.createElement(window.FlightLog, {
    flights: flightsAll,
    selectedId: selectedId,
    onSelect: handleSelect,
    onAddFlight: () => setModal("add"),
    syncing: syncStatus === "syncing",
    className: mobileTab === "log" ? "" : "hidden-mobile"
  }), selectedFlight ? /*#__PURE__*/React.createElement(window.FlightDetail, {
    flight: selectedFlight,
    onClose: () => setSelectedId(null),
    onEdit: f => {
      setEditingFlight(f);
      setModal("edit");
    },
    onDelete: deleteFlight,
    onSetPhoto: setFlightPhoto,
    syncing: syncStatus === "syncing",
    className: mobileTab === "stats" || mobileTab === "globe" ? "" : "hidden-mobile"
  }) : /*#__PURE__*/React.createElement(window.StatsRail, {
    flights: flightsAll,
    allFlights: flightsAll,
    className: mobileTab === "stats" ? "" : "hidden-mobile"
  }), /*#__PURE__*/React.createElement("div", {
    className: "mobile-tabs",
    role: "tablist",
    "aria-label": "Atlas views"
  }, /*#__PURE__*/React.createElement("button", {
    role: "tab",
    "aria-selected": mobileTab === "log",
    className: mobileTab === "log" ? "on" : "",
    onClick: () => setMobileTab("log")
  }, "Log"), /*#__PURE__*/React.createElement("button", {
    role: "tab",
    "aria-selected": mobileTab === "globe",
    className: mobileTab === "globe" ? "on" : "",
    onClick: () => setMobileTab("globe")
  }, "Globe"), /*#__PURE__*/React.createElement("button", {
    role: "tab",
    "aria-selected": mobileTab === "stats",
    className: mobileTab === "stats" ? "on" : "",
    onClick: () => setMobileTab("stats")
  }, "Stats"))), acctMenu && /*#__PURE__*/React.createElement("div", {
    style: {
      position: "fixed",
      inset: 0,
      zIndex: 29
    },
    onClick: () => setAcctMenu(false)
  }), modal === "share" && /*#__PURE__*/React.createElement(window.ShareModal, {
    flights: flightsAll,
    account: account,
    onClose: () => setModal(null),
    pushToast: pushToast
  }), modal === "add" && /*#__PURE__*/React.createElement(window.AddFlightModal, {
    onClose: () => setModal(null),
    onSubmit: addFlight,
    pushToast: pushToast
  }), modal === "edit" && editingFlight && /*#__PURE__*/React.createElement(window.AddFlightModal, {
    initial: editingFlight,
    onClose: () => {
      setModal(null);
      setEditingFlight(null);
    },
    onSubmit: form => updateFlight(editingFlight.id, form),
    pushToast: pushToast
  }), toastNode);
}
ReactDOM.createRoot(document.getElementById("root")).render(/*#__PURE__*/React.createElement(App, null));
})();
