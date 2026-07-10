/* 由 scripts/build-meridiel.mjs 從 components.jsx 編譯產生，請勿手動編輯 */
(function () {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* ============================================================
   MERIDIEL — Small UI components & icons (React, global)
   ============================================================ */
const {
  useState,
  useEffect,
  useRef
} = React;

/* ---------- Inline icons ---------- */
const Icon = {
  plane: p => /*#__PURE__*/React.createElement("svg", _extends({
    viewBox: "0 0 24 24",
    width: "1em",
    height: "1em",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.7",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, p), /*#__PURE__*/React.createElement("path", {
    d: "M3.5 13.5l17-6-3 9-4.5-1.5-3 4-1-4.5-5.5-1z"
  })),
  planeFill: p => /*#__PURE__*/React.createElement("svg", _extends({
    viewBox: "0 0 24 24",
    width: "1em",
    height: "1em",
    fill: "currentColor"
  }, p), /*#__PURE__*/React.createElement("path", {
    d: "M21 16v-2l-8-5V3.5a1.5 1.5 0 00-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5z"
  })),
  play: p => /*#__PURE__*/React.createElement("svg", _extends({
    viewBox: "0 0 24 24",
    width: "1em",
    height: "1em",
    fill: "currentColor"
  }, p), /*#__PURE__*/React.createElement("path", {
    d: "M7 5l12 7-12 7z"
  })),
  pause: p => /*#__PURE__*/React.createElement("svg", _extends({
    viewBox: "0 0 24 24",
    width: "1em",
    height: "1em",
    fill: "currentColor"
  }, p), /*#__PURE__*/React.createElement("path", {
    d: "M7 5h4v14H7zM13 5h4v14h-4z"
  })),
  share: p => /*#__PURE__*/React.createElement("svg", _extends({
    viewBox: "0 0 24 24",
    width: "1em",
    height: "1em",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.7",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, p), /*#__PURE__*/React.createElement("circle", {
    cx: "18",
    cy: "5",
    r: "2.4"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "6",
    cy: "12",
    r: "2.4"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "18",
    cy: "19",
    r: "2.4"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M8.1 10.9l7.8-4.6M8.1 13.1l7.8 4.6"
  })),
  plus: p => /*#__PURE__*/React.createElement("svg", _extends({
    viewBox: "0 0 24 24",
    width: "1em",
    height: "1em",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round"
  }, p), /*#__PURE__*/React.createElement("path", {
    d: "M12 5v14M5 12h14"
  })),
  x: p => /*#__PURE__*/React.createElement("svg", _extends({
    viewBox: "0 0 24 24",
    width: "1em",
    height: "1em",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round"
  }, p), /*#__PURE__*/React.createElement("path", {
    d: "M6 6l12 12M18 6L6 18"
  })),
  download: p => /*#__PURE__*/React.createElement("svg", _extends({
    viewBox: "0 0 24 24",
    width: "1em",
    height: "1em",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.7",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, p), /*#__PURE__*/React.createElement("path", {
    d: "M12 3v12M7 11l5 5 5-5M5 21h14"
  })),
  present: p => /*#__PURE__*/React.createElement("svg", _extends({
    viewBox: "0 0 24 24",
    width: "1em",
    height: "1em",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.7",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, p), /*#__PURE__*/React.createElement("rect", {
    x: "3",
    y: "4",
    width: "18",
    height: "13",
    rx: "1"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M12 17v3M8 20h8"
  })),
  link: p => /*#__PURE__*/React.createElement("svg", _extends({
    viewBox: "0 0 24 24",
    width: "1em",
    height: "1em",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.7",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, p), /*#__PURE__*/React.createElement("path", {
    d: "M10 13a5 5 0 007 0l2-2a5 5 0 00-7-7l-1 1M14 11a5 5 0 00-7 0l-2 2a5 5 0 007 7l1-1"
  })),
  compass: p => /*#__PURE__*/React.createElement("svg", _extends({
    viewBox: "0 0 24 24",
    width: "1em",
    height: "1em",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.4"
  }, p), /*#__PURE__*/React.createElement("circle", {
    cx: "12",
    cy: "12",
    r: "9"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M12 2v2M12 20v2M2 12h2M20 12h2",
    strokeLinecap: "round"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M15.5 8.5L13 13l-4.5 2.5L11 11z",
    fill: "currentColor",
    stroke: "none"
  })),
  globe: p => /*#__PURE__*/React.createElement("svg", _extends({
    viewBox: "0 0 24 24",
    width: "1em",
    height: "1em",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.5"
  }, p), /*#__PURE__*/React.createElement("circle", {
    cx: "12",
    cy: "12",
    r: "9"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M3 12h18M12 3c2.5 2.5 3.8 5.7 3.8 9S14.5 18.5 12 21c-2.5-2.5-3.8-5.7-3.8-9S9.5 5.5 12 3z"
  })),
  rotate: p => /*#__PURE__*/React.createElement("svg", _extends({
    viewBox: "0 0 24 24",
    width: "1em",
    height: "1em",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.7",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, p), /*#__PURE__*/React.createElement("circle", {
    cx: "12",
    cy: "12",
    r: "8"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M4 12h16M12 4c2.3 2.3 3.5 5.1 3.5 8s-1.2 5.7-3.5 8c-2.3-2.3-3.5-5.1-3.5-8s1.2-5.7 3.5-8z"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M12 1.6v2.1M12 20.3v2.1M1.6 12h2.1M20.3 12h2.1",
    strokeWidth: "1.3"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M21.4 7.3a10.9 10.9 0 011.4 5.6",
    strokeDasharray: "0.9 3.4"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M23 10l.9-2.9-2.9-.5"
  })),
  moon: p => /*#__PURE__*/React.createElement("svg", _extends({
    viewBox: "0 0 24 24",
    width: "1em",
    height: "1em",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.6",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, p), /*#__PURE__*/React.createElement("path", {
    d: "M21 12.8A8.5 8.5 0 1111.2 3a6.6 6.6 0 009.8 9.8z"
  })),
  sun: p => /*#__PURE__*/React.createElement("svg", _extends({
    viewBox: "0 0 24 24",
    width: "1em",
    height: "1em",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.6",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, p), /*#__PURE__*/React.createElement("circle", {
    cx: "12",
    cy: "12",
    r: "4"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"
  })),
  logout: p => /*#__PURE__*/React.createElement("svg", _extends({
    viewBox: "0 0 24 24",
    width: "1em",
    height: "1em",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.6",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, p), /*#__PURE__*/React.createElement("path", {
    d: "M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"
  })),
  chevron: p => /*#__PURE__*/React.createElement("svg", _extends({
    viewBox: "0 0 24 24",
    width: "1em",
    height: "1em",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.8",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, p), /*#__PURE__*/React.createElement("path", {
    d: "M6 9l6 6 6-6"
  })),
  edit: p => /*#__PURE__*/React.createElement("svg", _extends({
    viewBox: "0 0 24 24",
    width: "1em",
    height: "1em",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.6",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, p), /*#__PURE__*/React.createElement("path", {
    d: "M17 3a2.1 2.1 0 013 3L7 19l-4 1 1-4z"
  })),
  trash: p => /*#__PURE__*/React.createElement("svg", _extends({
    viewBox: "0 0 24 24",
    width: "1em",
    height: "1em",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.6",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, p), /*#__PURE__*/React.createElement("path", {
    d: "M4 7h16M9 7V5a1 1 0 011-1h4a1 1 0 011 1v2m2 0-1 13a1 1 0 01-1 1H8a1 1 0 01-1-1L6 7h12z"
  })),
  google: p => /*#__PURE__*/React.createElement("svg", _extends({
    viewBox: "0 0 48 48",
    width: "1em",
    height: "1em"
  }, p), /*#__PURE__*/React.createElement("path", {
    fill: "#4285F4",
    d: "M45.1 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h11.8c-.5 2.8-2 5.1-4.4 6.7v5.5h7.1c4.2-3.8 6.6-9.5 6.6-16.2z"
  }), /*#__PURE__*/React.createElement("path", {
    fill: "#34A853",
    d: "M24 46c5.9 0 10.9-2 14.5-5.3l-7.1-5.5c-2 1.3-4.5 2.1-7.4 2.1-5.7 0-10.5-3.8-12.2-9H4.5v5.7C8.1 41.1 15.4 46 24 46z"
  }), /*#__PURE__*/React.createElement("path", {
    fill: "#FBBC05",
    d: "M11.8 28.3c-.4-1.3-.7-2.7-.7-4.3s.2-3 .7-4.3v-5.7H4.5C3 17 2 20.4 2 24s1 7 2.5 10z"
  }), /*#__PURE__*/React.createElement("path", {
    fill: "#EA4335",
    d: "M24 10.8c3.2 0 6.1 1.1 8.4 3.3l6.3-6.3C34.9 4.1 29.9 2 24 2 15.4 2 8.1 6.9 4.5 14l7.3 5.7c1.7-5.2 6.5-8.9 12.2-8.9z"
  }))
};
window.Icon = Icon;

/* ---------- Flag (circle-flags via CDN) ---------- */
function Flag({
  cc,
  label,
  size
}) {
  const src = `https://cdn.jsdelivr.net/gh/HatScripts/circle-flags/flags/${cc}.svg`;
  return /*#__PURE__*/React.createElement("span", {
    className: "flag",
    style: size ? {
      width: size,
      height: size
    } : null
  }, /*#__PURE__*/React.createElement("img", {
    src: src,
    alt: label || cc,
    loading: "lazy"
  }), label && /*#__PURE__*/React.createElement("span", {
    className: "tip"
  }, label));
}
window.Flag = Flag;

/* ---------- SuggestField: type-ahead text field with a suggestion dropdown ----------
   Data-agnostic — the caller supplies `search(query)` returning up to a
   handful of { key, primary, secondary, commit } rows, and `getDisplay(value)`
   to render the committed value when the field isn't being edited.
   `allowFreeText`: on blur/Escape without picking a suggestion, commit the
   raw typed text instead of reverting (used for the airline field). */
function SuggestField({
  value,
  onCommit,
  getDisplay,
  search,
  placeholder,
  minChars = 1,
  allowFreeText = false
}) {
  const [editing, setEditing] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIdx, setActiveIdx] = useState(0);
  const wrapRef = useRef(null);
  const results = editing && query.trim().length >= minChars ? search(query) : [];
  const open = editing && results.length > 0;
  useEffect(() => {
    if (!editing) return;
    const onDocMouseDown = e => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) finishEditing();
    };
    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, [editing, query]);
  const commit = v => {
    onCommit(v);
    setEditing(false);
    setQuery("");
  };
  const finishEditing = () => {
    if (allowFreeText && query.trim()) onCommit(query.trim());
    setEditing(false);
    setQuery("");
  };
  const onKeyDown = e => {
    if (!open) {
      if (e.key === "Escape") finishEditing();
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx(i => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx(i => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const r = results[activeIdx];
      if (r) commit(r.commit);else finishEditing();
    } else if (e.key === "Escape") {
      setEditing(false);
      setQuery("");
    }
  };
  return /*#__PURE__*/React.createElement("div", {
    className: "suggest-field",
    ref: wrapRef
  }, /*#__PURE__*/React.createElement("input", {
    type: "text",
    value: editing ? query : getDisplay(value),
    placeholder: placeholder,
    onFocus: () => {
      setEditing(true);
      setQuery("");
      setActiveIdx(0);
    },
    onChange: e => {
      setQuery(e.target.value);
      setActiveIdx(0);
    },
    onKeyDown: onKeyDown
  }), open && /*#__PURE__*/React.createElement("div", {
    className: "suggest-list"
  }, results.map((r, i) => /*#__PURE__*/React.createElement("div", {
    key: r.key,
    className: "suggest-item" + (i === activeIdx ? " active" : ""),
    onMouseDown: e => {
      e.preventDefault();
      commit(r.commit);
    },
    onMouseEnter: () => setActiveIdx(i)
  }, /*#__PURE__*/React.createElement("span", {
    className: "suggest-primary"
  }, r.primary), r.secondary && /*#__PURE__*/React.createElement("span", {
    className: "suggest-secondary"
  }, r.secondary)))));
}
window.SuggestField = SuggestField;

/* ---------- Animated number (GSAP count-up) ---------- */
function StatNum({
  value,
  suffix = "",
  decimals = 0
}) {
  const ref = useRef(null);
  const prev = useRef(0);
  useEffect(() => {
    const obj = {
      n: prev.current
    };
    const el = ref.current;
    if (!el) return;
    if (window.gsap) {
      window.gsap.to(obj, {
        n: value,
        duration: 1.1,
        ease: "power2.out",
        onUpdate: () => {
          el.textContent = fmt(obj.n, decimals) + suffix;
        }
      });
    } else {
      el.textContent = fmt(value, decimals) + suffix;
    }
    prev.current = value;
  }, [value]);
  return /*#__PURE__*/React.createElement("span", {
    ref: ref
  }, fmt(value, decimals) + suffix);
}
function fmt(n, d) {
  return d ? (+n).toFixed(d) : Math.round(n).toLocaleString();
}
window.StatNum = StatNum;

/* ---------- Toast system ---------- */
function useToast() {
  const [toasts, setToasts] = useState([]);
  const push = msg => {
    const id = Math.random().toString(36).slice(2);
    setToasts(t => [...t, {
      id,
      msg
    }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 2600);
  };
  const node = /*#__PURE__*/React.createElement("div", {
    className: "toast-wrap"
  }, toasts.map(t => /*#__PURE__*/React.createElement("div", {
    key: t.id,
    className: "toast"
  }, t.msg)));
  return [push, node];
}
window.useToast = useToast;

/* ---------- Format helpers ---------- */
window.fmtDur = min => {
  const h = Math.floor(min / 60),
    m = min % 60;
  return `${h}h ${String(m).padStart(2, "0")}m`;
};
window.fmtDate = iso => {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
};
})();
