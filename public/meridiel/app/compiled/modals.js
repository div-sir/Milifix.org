/* 由 scripts/build-meridiel.mjs 從 modals.jsx 編譯產生，請勿手動編輯 */
(function () {
/* ============================================================
   MERIDIEL — Modals: Share card, Add flight, Present overlay
   ============================================================ */

/* ---------- Share Card modal ---------- */
let html2canvasPromise = null;
function loadHtml2Canvas() {
  if (window.html2canvas) return Promise.resolve(window.html2canvas);
  if (html2canvasPromise) return html2canvasPromise;
  html2canvasPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = new URL("vendor/html2canvas.min.js?v=20260715d", document.baseURI).href;
    script.async = true;
    script.onload = () => window.html2canvas ? resolve(window.html2canvas) : reject(new Error("html2canvas did not initialize"));
    script.onerror = () => reject(new Error("html2canvas failed to load"));
    document.head.appendChild(script);
  }).catch(error => {
    html2canvasPromise = null;
    throw error;
  });
  return html2canvasPromise;
}
function ShareModal({
  flights,
  account,
  onClose,
  pushToast
}) {
  const cardRef = React.useRef(null);
  const [busy, setBusy] = React.useState(false);
  const s = React.useMemo(() => window.ATLAS.statsFor(flights), [flights]);
  const countries = React.useMemo(() => window.ATLAS.countryList(flights), [flights]);
  const prof = window.ATLAS.profile;
  const name = account && account.name || prof.name;
  const handle = account && account.handle || prof.handle;
  const exportPng = async () => {
    if (!cardRef.current) return;
    setBusy(true);
    try {
      const html2canvas = await loadHtml2Canvas();
      const canvas = await html2canvas(cardRef.current, {
        scale: 2,
        backgroundColor: null,
        useCORS: true,
        logging: false
      });
      const a = document.createElement("a");
      a.download = `meridiel-${handle.replace("@", "")}.png`;
      a.href = canvas.toDataURL("image/png");
      a.click();
      pushToast("Saved your share card ✓");
    } catch (e) {
      console.error("Meridiel: PNG export failed —", e);
      pushToast("Couldn't render — try again");
    } finally {
      setBusy(false);
    }
  };
  const warmExportLibrary = () => {
    loadHtml2Canvas().catch(() => {});
  };
  const copyLink = async () => {
    const url = location.href.split("#")[0] + "#shared";
    try {
      await navigator.clipboard.writeText(url);
      pushToast("Share link copied ✓");
    } catch {
      pushToast(url);
    }
  };
  return /*#__PURE__*/React.createElement("div", {
    className: "backdrop",
    onClick: onClose
  }, /*#__PURE__*/React.createElement("div", {
    className: "modal paper-tex",
    onClick: e => e.stopPropagation()
  }, /*#__PURE__*/React.createElement("div", {
    className: "modal-head"
  }, /*#__PURE__*/React.createElement("h2", null, "Share your Atlas"), /*#__PURE__*/React.createElement("button", {
    className: "icon-btn",
    onClick: onClose,
    style: {
      width: 32,
      height: 32
    }
  }, /*#__PURE__*/React.createElement(window.Icon.x, null))), /*#__PURE__*/React.createElement("div", {
    className: "modal-body"
  }, /*#__PURE__*/React.createElement("div", {
    className: "share-card paper-tex",
    ref: cardRef
  }, /*#__PURE__*/React.createElement("div", {
    className: "sc-top"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "ttl"
  }, name, "'s", /*#__PURE__*/React.createElement("br", null), "Meridiel"), /*#__PURE__*/React.createElement("div", {
    className: "sub"
  }, handle, " \xB7 ", window.ATLAS.sinceOf(flights), "\u2013", new Date().getFullYear(), " \xB7 HOME ", window.ATLAS.homeOf(flights))), /*#__PURE__*/React.createElement("svg", {
    className: "seal",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.2"
  }, /*#__PURE__*/React.createElement("circle", {
    cx: "12",
    cy: "12",
    r: "10"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "12",
    cy: "12",
    r: "7",
    strokeDasharray: "2 2"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M14.5 8.5L12 13l-4.5 2.5L10 11z",
    fill: "currentColor",
    stroke: "none"
  }))), /*#__PURE__*/React.createElement("div", {
    className: "sc-stats"
  }, /*#__PURE__*/React.createElement("div", {
    className: "sc-stat"
  }, /*#__PURE__*/React.createElement("div", {
    className: "v"
  }, s.miles.toLocaleString()), /*#__PURE__*/React.createElement("div", {
    className: "k"
  }, "Miles")), /*#__PURE__*/React.createElement("div", {
    className: "sc-stat"
  }, /*#__PURE__*/React.createElement("div", {
    className: "v"
  }, s.hours.toLocaleString()), /*#__PURE__*/React.createElement("div", {
    className: "k"
  }, "Hours aloft")), /*#__PURE__*/React.createElement("div", {
    className: "sc-stat"
  }, /*#__PURE__*/React.createElement("div", {
    className: "v"
  }, s.countries), /*#__PURE__*/React.createElement("div", {
    className: "k"
  }, "Countries")), /*#__PURE__*/React.createElement("div", {
    className: "sc-stat"
  }, /*#__PURE__*/React.createElement("div", {
    className: "v"
  }, s.flights), /*#__PURE__*/React.createElement("div", {
    className: "k"
  }, "Segments")), /*#__PURE__*/React.createElement("div", {
    className: "sc-stat"
  }, /*#__PURE__*/React.createElement("div", {
    className: "v"
  }, s.airports), /*#__PURE__*/React.createElement("div", {
    className: "k"
  }, "Airports")), /*#__PURE__*/React.createElement("div", {
    className: "sc-stat"
  }, /*#__PURE__*/React.createElement("div", {
    className: "v"
  }, s.laps, "\xD7"), /*#__PURE__*/React.createElement("div", {
    className: "k"
  }, "Around Earth"))), /*#__PURE__*/React.createElement("div", {
    className: "sc-flags"
  }, countries.map(c => /*#__PURE__*/React.createElement(window.Flag, {
    key: c.country,
    cc: c.cc,
    size: 28
  }))), /*#__PURE__*/React.createElement("div", {
    className: "sc-foot"
  }, /*#__PURE__*/React.createElement("span", null, "\u25CE Meridiel"), /*#__PURE__*/React.createElement("span", null, countries.length, " stamps collected"))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 10,
      marginTop: 18
    }
  }, /*#__PURE__*/React.createElement("button", {
    className: "btn btn-solid",
    style: {
      flex: 1,
      justifyContent: "center"
    },
    onClick: exportPng,
    onMouseEnter: warmExportLibrary,
    onFocus: warmExportLibrary,
    disabled: busy
  }, /*#__PURE__*/React.createElement(window.Icon.download, null), " ", busy ? "Rendering…" : "Download image"), /*#__PURE__*/React.createElement("button", {
    className: "btn btn-ghost",
    style: {
      justifyContent: "center"
    },
    onClick: copyLink
  }, /*#__PURE__*/React.createElement(window.Icon.link, null), " Copy link")), /*#__PURE__*/React.createElement("p", {
    className: "hint",
    style: {
      marginTop: 12
    }
  }, "PNG renders right in your browser \u2014 no server, no fees. The share link reopens this exact atlas."))));
}
window.ShareModal = ShareModal;

/* ---------- Add / Edit Flight modal ----------
   Pass `initial` (an existing flight) to edit it in place; omit it to add a new one. */

// The OpenFlights merge can add thousands of airports/airlines at runtime, so
// rebuilding lowercase "haystacks" for the whole dataset on every keystroke
// gets expensive. Cache an index per dataset and only rebuild it once the
// dataset's size actually changes (i.e. once, right after the async merge
// lands) rather than on every render/keystroke.
let airportIndexCache = null,
  airportIndexSize = -1;
function airportIndex() {
  const codes = Object.keys(window.ATLAS.AIRPORTS);
  if (airportIndexCache && airportIndexSize === codes.length) return airportIndexCache;
  airportIndexCache = codes.map(code => {
    const a = window.ATLAS.AIRPORTS[code];
    return {
      code,
      codeLower: code.toLowerCase(),
      hay: `${code} ${a.city} ${a.name} ${a.country}`.toLowerCase()
    };
  });
  airportIndexSize = codes.length;
  return airportIndexCache;
}
let airlineIndexCache = null,
  airlineIndexSize = -1;
function airlineIndex() {
  const list = window.ATLAS.AIRLINES;
  if (airlineIndexCache && airlineIndexSize === list.length) return airlineIndexCache;
  airlineIndexCache = list.map(a => ({
    a,
    codeLower: a.code.toLowerCase(),
    nameLower: a.name.toLowerCase()
  }));
  airlineIndexSize = list.length;
  return airlineIndexCache;
}

// Airport suggestions: match the code prefix or a substring of city/name/country.
function searchAirports(query) {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const starts = [],
    contains = [];
  airportIndex().forEach(entry => {
    if (entry.codeLower.startsWith(q)) starts.push(entry.code);else if (entry.hay.includes(q)) contains.push(entry.code);
  });
  return [...starts, ...contains].slice(0, 8).map(code => {
    const a = window.ATLAS.AIRPORTS[code];
    return {
      key: code,
      primary: `${code} — ${a.city}`,
      secondary: a.country,
      commit: code
    };
  });
}

// Airline suggestions: match a 2–3 letter IATA code, or a substring of the name.
// Selecting one fills the airline's real name; free typing is still allowed.
function searchAirlines(query) {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const byCode = [],
    byName = [];
  airlineIndex().forEach(entry => {
    if (entry.codeLower.startsWith(q)) byCode.push(entry.a);else if (entry.nameLower.includes(q)) byName.push(entry.a);
  });
  return [...byCode, ...byName].slice(0, 8).map(a => ({
    key: a.code,
    primary: a.name,
    secondary: a.code,
    commit: a.name
  }));
}
function AddFlightModal({
  onClose,
  onSubmit,
  pushToast,
  initial
}) {
  const isEdit = !!initial;
  const [tab, setTab] = React.useState("manual");
  const [form, setForm] = React.useState(() => initial ? {
    o: initial.o,
    d: initial.d,
    date: initial.date,
    airline: initial.airline,
    craft: initial.craft,
    seat: initial.seat,
    flightNo: initial.flightNo || "",
    reg: initial.reg || "",
    notes: initial.notes || ""
  } : {
    o: "SFO",
    d: "JFK",
    date: new Date().toISOString().slice(0, 10),
    airline: "",
    craft: "",
    seat: "",
    flightNo: "",
    reg: "",
    notes: ""
  });
  // Auto-expand when editing a flight that already has advanced details filled in.
  const [showAdvanced, setShowAdvanced] = React.useState(!!(initial && (initial.flightNo || initial.reg || initial.notes)));
  const set = k => e => setForm(f => ({
    ...f,
    [k]: e.target.value
  }));
  const setVal = k => v => setForm(f => ({
    ...f,
    [k]: v
  }));
  const dateRef = React.useRef(null);
  const openDatePicker = () => {
    try {
      dateRef.current.showPicker();
    } catch (e) {
      dateRef.current.focus();
    }
  };
  const submit = () => {
    if (!window.ATLAS.AIRPORTS[form.o] || !window.ATLAS.AIRPORTS[form.d]) {
      pushToast("Pick a valid airport for From and To");
      return;
    }
    if (form.o === form.d) {
      pushToast("Origin and destination must differ");
      return;
    }
    onSubmit(form);
    pushToast(isEdit ? "Flight updated ✓" : "Flight added to your log ✓");
    onClose();
  };
  return /*#__PURE__*/React.createElement("div", {
    className: "backdrop",
    onClick: onClose
  }, /*#__PURE__*/React.createElement("div", {
    className: "modal paper-tex",
    onClick: e => e.stopPropagation(),
    style: {
      width: "min(480px, 94vw)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "modal-head"
  }, /*#__PURE__*/React.createElement("h2", null, isEdit ? "Edit flight" : "Add a flight"), /*#__PURE__*/React.createElement("button", {
    className: "icon-btn",
    onClick: onClose,
    style: {
      width: 32,
      height: 32
    }
  }, /*#__PURE__*/React.createElement(window.Icon.x, null))), /*#__PURE__*/React.createElement("div", {
    className: "modal-body"
  }, !isEdit && /*#__PURE__*/React.createElement("div", {
    className: "tab-row"
  }, /*#__PURE__*/React.createElement("button", {
    className: tab === "manual" ? "on" : "",
    onClick: () => setTab("manual")
  }, "Manual"), /*#__PURE__*/React.createElement("button", {
    className: tab === "import" ? "on" : "",
    onClick: () => setTab("import")
  }, "Import CSV")), (isEdit || tab === "manual") && /*#__PURE__*/React.createElement("div", {
    className: "tab-panel"
  }, /*#__PURE__*/React.createElement("div", {
    className: "field-row"
  }, /*#__PURE__*/React.createElement("div", {
    className: "field"
  }, /*#__PURE__*/React.createElement("label", null, "From"), /*#__PURE__*/React.createElement(window.SuggestField, {
    value: form.o,
    onCommit: setVal("o"),
    getDisplay: code => window.ATLAS.AIRPORTS[code] ? `${code} — ${window.ATLAS.AIRPORTS[code].city}` : code,
    search: searchAirports,
    placeholder: "Type a city or code"
  })), /*#__PURE__*/React.createElement("div", {
    className: "field"
  }, /*#__PURE__*/React.createElement("label", null, "To"), /*#__PURE__*/React.createElement(window.SuggestField, {
    value: form.d,
    onCommit: setVal("d"),
    getDisplay: code => window.ATLAS.AIRPORTS[code] ? `${code} — ${window.ATLAS.AIRPORTS[code].city}` : code,
    search: searchAirports,
    placeholder: "Type a city or code"
  }))), /*#__PURE__*/React.createElement("div", {
    className: "field field-date",
    onClick: openDatePicker
  }, /*#__PURE__*/React.createElement("label", null, "Date"), /*#__PURE__*/React.createElement("input", {
    ref: dateRef,
    type: "date",
    value: form.date,
    onChange: set("date")
  })), /*#__PURE__*/React.createElement("div", {
    className: "field-row"
  }, /*#__PURE__*/React.createElement("div", {
    className: "field"
  }, /*#__PURE__*/React.createElement("label", null, "Airline"), /*#__PURE__*/React.createElement(window.SuggestField, {
    value: form.airline,
    onCommit: setVal("airline"),
    getDisplay: v => v,
    search: searchAirlines,
    placeholder: "Name or IATA code",
    allowFreeText: true
  })), /*#__PURE__*/React.createElement("div", {
    className: "field"
  }, /*#__PURE__*/React.createElement("label", null, "Aircraft"), /*#__PURE__*/React.createElement("input", {
    placeholder: "e.g. Boeing 787",
    value: form.craft,
    onChange: set("craft")
  }))), /*#__PURE__*/React.createElement("div", {
    className: "field"
  }, /*#__PURE__*/React.createElement("label", null, "Seat (optional)"), /*#__PURE__*/React.createElement("input", {
    placeholder: "e.g. 14A",
    value: form.seat,
    onChange: set("seat")
  })), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "advanced-toggle",
    onClick: () => setShowAdvanced(v => !v)
  }, /*#__PURE__*/React.createElement(window.Icon.chevron, {
    className: "advanced-toggle-chev" + (showAdvanced ? " open" : "")
  }), "Advanced details"), /*#__PURE__*/React.createElement("div", {
    className: "advanced-collapse" + (showAdvanced ? " open" : "")
  }, /*#__PURE__*/React.createElement("div", {
    className: "advanced-collapse-inner"
  }, /*#__PURE__*/React.createElement("div", {
    className: "field-row"
  }, /*#__PURE__*/React.createElement("div", {
    className: "field"
  }, /*#__PURE__*/React.createElement("label", null, "Flight number"), /*#__PURE__*/React.createElement("input", {
    placeholder: "e.g. CI 100",
    value: form.flightNo,
    onChange: set("flightNo"),
    tabIndex: showAdvanced ? 0 : -1
  })), /*#__PURE__*/React.createElement("div", {
    className: "field"
  }, /*#__PURE__*/React.createElement("label", null, "Registration"), /*#__PURE__*/React.createElement("input", {
    placeholder: "e.g. B-18317",
    value: form.reg,
    onChange: set("reg"),
    tabIndex: showAdvanced ? 0 : -1
  }))), /*#__PURE__*/React.createElement("div", {
    className: "field"
  }, /*#__PURE__*/React.createElement("label", null, "Notes (optional)"), /*#__PURE__*/React.createElement("textarea", {
    rows: 2,
    placeholder: "Anything else worth remembering",
    value: form.notes,
    onChange: set("notes"),
    tabIndex: showAdvanced ? 0 : -1
  })))), /*#__PURE__*/React.createElement("button", {
    className: "btn btn-solid",
    style: {
      width: "100%",
      justifyContent: "center",
      marginTop: 4
    },
    onClick: submit
  }, isEdit ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(window.Icon.edit, null), " Save changes") : /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(window.Icon.plus, null), " Add to log"))), !isEdit && tab === "import" && /*#__PURE__*/React.createElement("div", {
    className: "tab-panel"
  }, /*#__PURE__*/React.createElement("p", {
    className: "hint"
  }, "Drop a CSV with columns ", /*#__PURE__*/React.createElement("b", null, "date, from, to, airline, aircraft, seat"), ". Airport codes are matched to coordinates automatically."), /*#__PURE__*/React.createElement("div", {
    className: "detail-photo",
    style: {
      height: 120,
      marginTop: 14,
      borderRadius: 3,
      border: "1.5px dashed var(--line)"
    }
  }, /*#__PURE__*/React.createElement("span", null, "Drag & drop CSV \u2014 or click to browse")), /*#__PURE__*/React.createElement("p", {
    className: "hint",
    style: {
      marginTop: 12
    }
  }, "Works fully offline. Your data never leaves the browser.")))));
}
window.AddFlightModal = AddFlightModal;
})();
