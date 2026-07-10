/* 由 scripts/build-meridiel.mjs 從 panels.jsx 編譯產生，請勿手動編輯 */
(function () {
/* ============================================================
   MERIDIEL — Panels: Log, Rail (stats+flags), Detail, Timeline
   ============================================================ */
const {
  useMemo: useMemoP
} = React;

/* ---------- Flight Log (left) ---------- */
// While a Drive sync is in flight (initial pull/merge on sign-in, or an
// immediate push right after an edit), editing is locked — an edit made
// mid-sync could race an in-flight network response and get clobbered by a
// stale one landing after it. The overlay makes that wait visible instead
// of leaving the log clickable but silently unsafe to touch.
function FlightLog({
  flights,
  selectedId,
  onSelect,
  onAddFlight,
  syncing,
  className
}) {
  return /*#__PURE__*/React.createElement("section", {
    className: "panel log paper-tex " + (className || "")
  }, /*#__PURE__*/React.createElement("div", {
    className: "panel-head"
  }, /*#__PURE__*/React.createElement("h3", null, "Flight Log"), /*#__PURE__*/React.createElement("span", {
    className: "count"
  }, flights.length, " segments")), /*#__PURE__*/React.createElement("div", {
    className: "log-list" + (syncing ? " log-list--locked" : "")
  }, flights.map(f => /*#__PURE__*/React.createElement("div", {
    key: f.id,
    className: "log-row" + (f.id === selectedId ? " active" : ""),
    onClick: () => !syncing && onSelect(f.id)
  }, f.fav && /*#__PURE__*/React.createElement("span", {
    className: "lr-fav"
  }, "\u2605"), /*#__PURE__*/React.createElement("div", {
    className: "lr-route"
  }, /*#__PURE__*/React.createElement("span", null, f.from.code), /*#__PURE__*/React.createElement("span", {
    className: "arrow"
  }, "\u2192"), /*#__PURE__*/React.createElement("span", null, f.to.code)), /*#__PURE__*/React.createElement("div", {
    className: "lr-date"
  }, window.fmtDate(f.date)), /*#__PURE__*/React.createElement("div", {
    className: "lr-sub"
  }, f.airline), /*#__PURE__*/React.createElement("div", {
    className: "lr-miles"
  }, f.miles.toLocaleString(), " mi"))), /*#__PURE__*/React.createElement("button", {
    className: "log-add-hint",
    onClick: onAddFlight,
    disabled: syncing
  }, /*#__PURE__*/React.createElement(window.Icon.plus, null), flights.length === 0 ? "Log your first flight" : "Add your next flight")), syncing && /*#__PURE__*/React.createElement("div", {
    className: "log-sync-veil"
  }, /*#__PURE__*/React.createElement("span", {
    className: "log-sync-spin"
  })));
}
window.FlightLog = FlightLog;

/* ---------- Stats + Flag wall (right rail) ---------- */
function StatsRail({
  flights,
  allFlights,
  className
}) {
  const s = useMemoP(() => window.ATLAS.statsFor(flights), [flights]);
  const countries = useMemoP(() => window.ATLAS.countryList(flights), [flights]);
  return /*#__PURE__*/React.createElement("section", {
    className: "panel rail paper-tex " + (className || "")
  }, /*#__PURE__*/React.createElement("div", {
    className: "panel-head"
  }, /*#__PURE__*/React.createElement("h3", null, "The Tally"), /*#__PURE__*/React.createElement("span", {
    className: "count"
  }, "since ", window.ATLAS.sinceOf(allFlights || flights))), /*#__PURE__*/React.createElement("div", {
    className: "panel-body"
  }, /*#__PURE__*/React.createElement("div", {
    className: "stat-grid"
  }, /*#__PURE__*/React.createElement("div", {
    className: "stat"
  }, /*#__PURE__*/React.createElement("span", {
    className: "v"
  }, /*#__PURE__*/React.createElement(window.StatNum, {
    value: s.miles
  })), /*#__PURE__*/React.createElement("span", {
    className: "k"
  }, "Miles flown")), /*#__PURE__*/React.createElement("div", {
    className: "stat"
  }, /*#__PURE__*/React.createElement("span", {
    className: "v"
  }, /*#__PURE__*/React.createElement(window.StatNum, {
    value: s.hours
  }), /*#__PURE__*/React.createElement("small", null, " hrs")), /*#__PURE__*/React.createElement("span", {
    className: "k"
  }, "In the air")), /*#__PURE__*/React.createElement("div", {
    className: "stat"
  }, /*#__PURE__*/React.createElement("span", {
    className: "v"
  }, /*#__PURE__*/React.createElement(window.StatNum, {
    value: s.countries
  })), /*#__PURE__*/React.createElement("span", {
    className: "k"
  }, "Countries")), /*#__PURE__*/React.createElement("div", {
    className: "stat"
  }, /*#__PURE__*/React.createElement("span", {
    className: "v"
  }, /*#__PURE__*/React.createElement(window.StatNum, {
    value: s.airports
  })), /*#__PURE__*/React.createElement("span", {
    className: "k"
  }, "Airports")), /*#__PURE__*/React.createElement("div", {
    className: "stat wide"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    className: "v"
  }, /*#__PURE__*/React.createElement(window.StatNum, {
    value: s.flights
  })), /*#__PURE__*/React.createElement("span", {
    className: "k"
  }, "Flight segments logged")), /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: "right"
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "v"
  }, /*#__PURE__*/React.createElement(window.StatNum, {
    value: s.laps,
    decimals: 1
  })), /*#__PURE__*/React.createElement("span", {
    className: "k"
  }, "\xD7 around Earth")))), /*#__PURE__*/React.createElement("div", {
    className: "section-label"
  }, "Passport \xB7 ", countries.length, " stamps"), /*#__PURE__*/React.createElement("div", {
    className: "flagwall"
  }, countries.map(c => /*#__PURE__*/React.createElement(window.Flag, {
    key: c.country,
    cc: c.cc,
    label: c.country
  })))));
}
window.StatsRail = StatsRail;

/* ---------- Flight Detail (replaces rail when a flight is picked) ---------- */
function FlightDetail({
  flight,
  onClose,
  onEdit,
  onDelete,
  onSetPhoto,
  syncing,
  className
}) {
  if (!flight) return null;
  const f = flight;
  const remove = () => {
    if (window.confirm(`Delete the ${f.from.code} → ${f.to.code} flight? This can't be undone.`)) {
      onDelete(f.id);
    }
  };
  return /*#__PURE__*/React.createElement("section", {
    className: "panel rail " + (className || ""),
    style: {
      background: "var(--paper)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "panel-head",
    style: {
      background: "var(--paper-3)"
    }
  }, /*#__PURE__*/React.createElement("h3", null, "Boarding Pass"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 6
    }
  }, /*#__PURE__*/React.createElement("button", {
    className: "icon-btn icon-btn-sm",
    onClick: () => onEdit(f),
    title: "Edit flight",
    disabled: syncing
  }, /*#__PURE__*/React.createElement(window.Icon.edit, null)), /*#__PURE__*/React.createElement("button", {
    className: "icon-btn icon-btn-sm",
    onClick: remove,
    title: "Delete flight",
    disabled: syncing
  }, /*#__PURE__*/React.createElement(window.Icon.trash, null)), /*#__PURE__*/React.createElement("button", {
    className: "icon-btn icon-btn-sm",
    onClick: onClose
  }, /*#__PURE__*/React.createElement(window.Icon.x, null)))), /*#__PURE__*/React.createElement("div", {
    className: "panel-body"
  }, /*#__PURE__*/React.createElement("div", {
    className: "detail-hero"
  }, /*#__PURE__*/React.createElement("div", {
    className: "detail-route"
  }, /*#__PURE__*/React.createElement("div", {
    className: "detail-ap"
  }, /*#__PURE__*/React.createElement("span", {
    className: "code"
  }, f.from.code), /*#__PURE__*/React.createElement("span", {
    className: "city"
  }, f.from.city)), /*#__PURE__*/React.createElement("div", {
    className: "detail-mid"
  }, /*#__PURE__*/React.createElement("span", {
    className: "plane"
  }, /*#__PURE__*/React.createElement(window.Icon.planeFill, null)), /*#__PURE__*/React.createElement("span", {
    className: "line"
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--mono)",
      fontSize: 10
    }
  }, f.miles.toLocaleString(), " mi")), /*#__PURE__*/React.createElement("div", {
    className: "detail-ap to"
  }, /*#__PURE__*/React.createElement("span", {
    className: "code"
  }, f.to.code), /*#__PURE__*/React.createElement("span", {
    className: "city"
  }, f.to.city)))), /*#__PURE__*/React.createElement("figure", {
    className: "detail-photo"
  }, /*#__PURE__*/React.createElement(window.ImageSlotMaybe, {
    flight: f,
    onSetPhoto: onSetPhoto,
    disabled: syncing
  })), /*#__PURE__*/React.createElement("div", {
    className: "detail-rows"
  }, /*#__PURE__*/React.createElement("div", {
    className: "drow"
  }, /*#__PURE__*/React.createElement("span", {
    className: "k"
  }, "Date"), /*#__PURE__*/React.createElement("span", {
    className: "vv"
  }, window.fmtDate(f.date))), /*#__PURE__*/React.createElement("div", {
    className: "drow"
  }, /*#__PURE__*/React.createElement("span", {
    className: "k"
  }, "Airline"), /*#__PURE__*/React.createElement("span", {
    className: "vv"
  }, f.airline)), f.flightNo && /*#__PURE__*/React.createElement("div", {
    className: "drow"
  }, /*#__PURE__*/React.createElement("span", {
    className: "k"
  }, "Flight"), /*#__PURE__*/React.createElement("span", {
    className: "vv"
  }, f.flightNo)), /*#__PURE__*/React.createElement("div", {
    className: "drow"
  }, /*#__PURE__*/React.createElement("span", {
    className: "k"
  }, "Aircraft"), /*#__PURE__*/React.createElement("span", {
    className: "vv"
  }, f.craft)), f.reg && /*#__PURE__*/React.createElement("div", {
    className: "drow"
  }, /*#__PURE__*/React.createElement("span", {
    className: "k"
  }, "Registration"), /*#__PURE__*/React.createElement("span", {
    className: "vv"
  }, f.reg)), /*#__PURE__*/React.createElement("div", {
    className: "drow"
  }, /*#__PURE__*/React.createElement("span", {
    className: "k"
  }, "Flight time"), /*#__PURE__*/React.createElement("span", {
    className: "vv"
  }, window.fmtDur(f.dur))), /*#__PURE__*/React.createElement("div", {
    className: "drow"
  }, /*#__PURE__*/React.createElement("span", {
    className: "k"
  }, "Distance"), /*#__PURE__*/React.createElement("span", {
    className: "vv"
  }, f.km.toLocaleString(), " km \xB7 ", f.miles.toLocaleString(), " mi")), /*#__PURE__*/React.createElement("div", {
    className: "drow"
  }, /*#__PURE__*/React.createElement("span", {
    className: "k"
  }, "Seat"), /*#__PURE__*/React.createElement("span", {
    className: "vv"
  }, f.seat)), /*#__PURE__*/React.createElement("div", {
    className: "drow"
  }, /*#__PURE__*/React.createElement("span", {
    className: "k"
  }, "Route"), /*#__PURE__*/React.createElement("span", {
    className: "vv",
    style: {
      display: "flex",
      gap: 8,
      alignItems: "center"
    }
  }, /*#__PURE__*/React.createElement(window.Flag, {
    cc: f.from.cc,
    size: 20
  }), " \u2192 ", /*#__PURE__*/React.createElement(window.Flag, {
    cc: f.to.cc,
    size: 20
  })))), f.notes && /*#__PURE__*/React.createElement("div", {
    className: "detail-notes"
  }, f.notes), f.fav && /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "0 16px 18px"
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "stamp"
  }, "Favourite Leg"))));
}
window.FlightDetail = FlightDetail;

/* Resize + compress a picked image client-side (no upload, no server) so a
   photo stays small enough to live comfortably inside the synced flight
   JSON (Drive appData + localStorage), however many flights get one. */
function compressImageFile(file, maxDim, quality) {
  maxDim = maxDim || 1280;
  quality = quality || 0.72;
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("read failed"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("decode failed"));
      img.onload = () => {
        let w = img.width,
          h = img.height;
        if (w > maxDim || h > maxDim) {
          const scale = maxDim / Math.max(w, h);
          w = Math.round(w * scale);
          h = Math.round(h * scale);
        }
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        canvas.getContext("2d").drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

/* Photo slot: click to add, or shows the photo with change/remove controls.
   Fully client-side — the compressed image is just a field on the flight,
   so it rides along with everything else that syncs to Drive/localStorage. */
function ImageSlotMaybe({
  flight,
  onSetPhoto,
  disabled
}) {
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState("");
  const inputRef = React.useRef(null);
  const pick = () => inputRef.current && inputRef.current.click();
  const onFile = e => {
    const file = e.target.files && e.target.files[0];
    e.target.value = "";
    if (!file) return;
    setError("");
    setBusy(true);
    compressImageFile(file).then(dataUrl => onSetPhoto(flight.id, dataUrl)).catch(() => setError("Couldn't read that image — try another one.")).finally(() => setBusy(false));
  };
  const remove = e => {
    e.stopPropagation();
    onSetPhoto(flight.id, null);
  };
  if (flight.photo) {
    return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("img", {
      className: "detail-photo-img",
      src: flight.photo,
      alt: ""
    }), /*#__PURE__*/React.createElement("div", {
      className: "detail-photo-tools"
    }, /*#__PURE__*/React.createElement("button", {
      type: "button",
      className: "icon-btn icon-btn-sm",
      title: "Change photo",
      onClick: pick,
      disabled: disabled
    }, /*#__PURE__*/React.createElement(window.Icon.edit, null)), /*#__PURE__*/React.createElement("button", {
      type: "button",
      className: "icon-btn icon-btn-sm",
      title: "Remove photo",
      onClick: remove,
      disabled: disabled
    }, /*#__PURE__*/React.createElement(window.Icon.trash, null))), /*#__PURE__*/React.createElement("input", {
      ref: inputRef,
      type: "file",
      accept: "image/*",
      hidden: true,
      onChange: onFile
    }));
  }
  return /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "detail-photo-add",
    onClick: pick,
    disabled: busy || disabled
  }, /*#__PURE__*/React.createElement(window.Icon.plus, null), /*#__PURE__*/React.createElement("span", null, busy ? "Processing…" : error || `${flight.to.city} · add a photo`), /*#__PURE__*/React.createElement("input", {
    ref: inputRef,
    type: "file",
    accept: "image/*",
    hidden: true,
    onChange: onFile
  }));
}
window.ImageSlotMaybe = ImageSlotMaybe;
})();
