/* ============================================================
   MERIDIEL — Small UI components & icons
   ============================================================ */
import { UI } from "./ui-registry.js";

const { useState, useEffect, useRef } = React;

/* ---------- Inline icons ---------- */
const Icon = {
  plane: (p) => (
    <svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M3.5 13.5l17-6-3 9-4.5-1.5-3 4-1-4.5-5.5-1z" />
    </svg>
  ),
  planeFill: (p) => (
    <svg viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor" {...p}>
      <path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 00-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5z" />
    </svg>
  ),
  play: (p) => (<svg viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor" {...p}><path d="M7 5l12 7-12 7z" /></svg>),
  pause: (p) => (<svg viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor" {...p}><path d="M7 5h4v14H7zM13 5h4v14h-4z" /></svg>),
  share: (p) => (<svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="18" cy="5" r="2.4"/><circle cx="6" cy="12" r="2.4"/><circle cx="18" cy="19" r="2.4"/><path d="M8.1 10.9l7.8-4.6M8.1 13.1l7.8 4.6"/></svg>),
  plus: (p) => (<svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" {...p}><path d="M12 5v14M5 12h14"/></svg>),
  x: (p) => (<svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" {...p}><path d="M6 6l12 12M18 6L6 18"/></svg>),
  download: (p) => (<svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M12 3v12M7 11l5 5 5-5M5 21h14"/></svg>),
  present: (p) => (<svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" {...p}><rect x="3" y="4" width="18" height="13" rx="1"/><path d="M12 17v3M8 20h8"/></svg>),
  link: (p) => (<svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M10 13a5 5 0 007 0l2-2a5 5 0 00-7-7l-1 1M14 11a5 5 0 00-7 0l-2 2a5 5 0 007 7l1-1"/></svg>),
  compass: (p) => (<svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth="1.4" {...p}><circle cx="12" cy="12" r="9"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2" strokeLinecap="round"/><path d="M15.5 8.5L13 13l-4.5 2.5L11 11z" fill="currentColor" stroke="none"/></svg>),
  globe: (p) => (<svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth="1.5" {...p}><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.5 3.8 5.7 3.8 9S14.5 18.5 12 21c-2.5-2.5-3.8-5.7-3.8-9S9.5 5.5 12 3z"/></svg>),
  rotate: (p) => (<svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="12" cy="12" r="8"/><path d="M4 12h16M12 4c2.3 2.3 3.5 5.1 3.5 8s-1.2 5.7-3.5 8c-2.3-2.3-3.5-5.1-3.5-8s1.2-5.7 3.5-8z"/><path d="M12 1.6v2.1M12 20.3v2.1M1.6 12h2.1M20.3 12h2.1" strokeWidth="1.3"/><path d="M21.4 7.3a10.9 10.9 0 011.4 5.6" strokeDasharray="0.9 3.4"/><path d="M23 10l.9-2.9-2.9-.5"/></svg>),
  moon: (p) => (<svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M21 12.8A8.5 8.5 0 1111.2 3a6.6 6.6 0 009.8 9.8z"/></svg>),
  sun: (p) => (<svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>),
  logout: (p) => (<svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/></svg>),
  chevron: (p) => (<svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M6 9l6 6 6-6"/></svg>),
  edit: (p) => (<svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M17 3a2.1 2.1 0 013 3L7 19l-4 1 1-4z"/></svg>),
  trash: (p) => (<svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M4 7h16M9 7V5a1 1 0 011-1h4a1 1 0 011 1v2m2 0-1 13a1 1 0 01-1 1H8a1 1 0 01-1-1L6 7h12z"/></svg>),
  google: (p) => (
    <svg viewBox="0 0 48 48" width="1em" height="1em" {...p}>
      <path fill="#4285F4" d="M45.1 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h11.8c-.5 2.8-2 5.1-4.4 6.7v5.5h7.1c4.2-3.8 6.6-9.5 6.6-16.2z"/>
      <path fill="#34A853" d="M24 46c5.9 0 10.9-2 14.5-5.3l-7.1-5.5c-2 1.3-4.5 2.1-7.4 2.1-5.7 0-10.5-3.8-12.2-9H4.5v5.7C8.1 41.1 15.4 46 24 46z"/>
      <path fill="#FBBC05" d="M11.8 28.3c-.4-1.3-.7-2.7-.7-4.3s.2-3 .7-4.3v-5.7H4.5C3 17 2 20.4 2 24s1 7 2.5 10z"/>
      <path fill="#EA4335" d="M24 10.8c3.2 0 6.1 1.1 8.4 3.3l6.3-6.3C34.9 4.1 29.9 2 24 2 15.4 2 8.1 6.9 4.5 14l7.3 5.7c1.7-5.2 6.5-8.9 12.2-8.9z"/>
    </svg>
  ),
};
UI.Icon = Icon;

/* ---------- Flag (pinned, same-origin circle-flags sprite) ---------- */
const FLAG_CODES = new Set("ac ad ae af ag ai al am an ao aq ar as at au aw ax az ba bb bd be bf bg bh bi bj bl bm bn bo bq br bs bt bv bw by bz ca cc cd cf cg ch ci ck cl cm cn co cp cq cr cu cv cw cx cy cz de dg dj dk dm do dz ea ec ee eg eh er es et eu fi fj fk fm fo fr fx ga gb gd ge gf gg gh gi gl gm gn gp gq gr gs gt gu gw gy hk hm hn hr ht hu ic id ie il im in io iq ir is it je jm jo jp ke kg kh ki km kn kp kr kw ky kz la lb lc li lk lr ls lt lu lv ly ma mc md me mf mg mh mk ml mm mn mo mp mq mr ms mt mu mv mw mx my mz na nc ne nf ng ni nl no np nr nu nz om pa pe pf pg ph pk pl pm pn pr ps pt pw py qa re ro rs ru rw sa sb sc sd se sg sh si sj sk sl sm sn so sr ss st su sv sx sy sz ta tc td tf tg th tj tk tl tm tn to tr tt tv tw tz ua ug uk um un us uy uz va vc ve vg vi vn vu wf ws xk xx ye yt yu za zm zw".split(" "));
const FLAG_SPRITE_URL = "data/circle-flags.svg?v=20260716k";
function Flag({ cc, label, size }) {
  const requested = String(cc || "").toLowerCase();
  const code = FLAG_CODES.has(requested) ? requested : "xx";
  const accessibleName = label || requested || "Unknown flag";
  return (
    <span className="flag" style={size ? { width: size, height: size } : null}>
      <svg viewBox="0 0 512 512" role="img" aria-label={accessibleName}>
        <use href={`${FLAG_SPRITE_URL}#flag-${code}`} />
      </svg>
      {label && <span className="tip">{label}</span>}
    </span>
  );
}
UI.Flag = Flag;

/* ---------- SuggestField: type-ahead text field with a suggestion dropdown ----------
   Data-agnostic — the caller supplies `search(query)` returning up to a
   handful of { key, primary, secondary, commit } rows, and `getDisplay(value)`
   to render the committed value when the field isn't being edited.
   `allowFreeText`: on blur/Escape without picking a suggestion, commit the
   raw typed text instead of reverting (used for the airline field). */
function SuggestField({ value, onCommit, getDisplay, search, placeholder, minChars = 1, allowFreeText = false }) {
  const [editing, setEditing] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIdx, setActiveIdx] = useState(0);
  const wrapRef = useRef(null);

  const results = editing && query.trim().length >= minChars ? search(query) : [];
  const open = editing && results.length > 0;

  useEffect(() => {
    if (!editing) return;
    const onDocMouseDown = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) finishEditing();
    };
    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, [editing, query]);

  const commit = (v) => { onCommit(v); setEditing(false); setQuery(""); };
  const finishEditing = () => {
    if (allowFreeText && query.trim()) onCommit(query.trim());
    setEditing(false); setQuery("");
  };

  const onKeyDown = (e) => {
    if (!open) { if (e.key === "Escape") finishEditing(); return; }
    if (e.key === "ArrowDown") { e.preventDefault(); setActiveIdx((i) => Math.min(i + 1, results.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActiveIdx((i) => Math.max(i - 1, 0)); }
    else if (e.key === "Enter") { e.preventDefault(); const r = results[activeIdx]; if (r) commit(r.commit); else finishEditing(); }
    else if (e.key === "Escape") { setEditing(false); setQuery(""); }
  };

  return (
    <div className="suggest-field" ref={wrapRef}>
      <input
        type="text"
        value={editing ? query : getDisplay(value)}
        placeholder={placeholder}
        onFocus={() => { setEditing(true); setQuery(""); setActiveIdx(0); }}
        onChange={(e) => { setQuery(e.target.value); setActiveIdx(0); }}
        onKeyDown={onKeyDown}
      />
      {open && (
        <div className="suggest-list">
          {results.map((r, i) => (
            <div
              key={r.key}
              className={"suggest-item" + (i === activeIdx ? " active" : "")}
              onMouseDown={(e) => { e.preventDefault(); commit(r.commit); }}
              onMouseEnter={() => setActiveIdx(i)}
            >
              <span className="suggest-primary">{r.primary}</span>
              {r.secondary && <span className="suggest-secondary">{r.secondary}</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
UI.SuggestField = SuggestField;

/* ---------- Animated number (GSAP count-up) ---------- */
function StatNum({ value, suffix = "", decimals = 0 }) {
  const ref = useRef(null);
  const prev = useRef(0);
  useEffect(() => {
    const obj = { n: prev.current };
    const el = ref.current;
    if (!el) return;
    if (window.gsap) {
      window.gsap.to(obj, {
        n: value, duration: 1.1, ease: "power2.out",
        onUpdate: () => { el.textContent = fmt(obj.n, decimals) + suffix; },
      });
    } else { el.textContent = fmt(value, decimals) + suffix; }
    prev.current = value;
  }, [value]);
  return <span ref={ref}>{fmt(value, decimals) + suffix}</span>;
}
function fmt(n, d) {
  return d ? (+n).toFixed(d) : Math.round(n).toLocaleString();
}
UI.StatNum = StatNum;

/* ---------- Toast system ---------- */
function useToast() {
  const [toasts, setToasts] = useState([]);
  const push = (msg) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((t) => [...t, { id, msg }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2600);
  };
  const node = (
    <div className="toast-wrap">
      {toasts.map((t) => <div key={t.id} className="toast">{t.msg}</div>)}
    </div>
  );
  return [push, node];
}
UI.useToast = useToast;

/* ---------- Format helpers ---------- */
UI.fmtDur = (min) => {
  const h = Math.floor(min / 60), m = min % 60;
  return `${h}h ${String(m).padStart(2, "0")}m`;
};
UI.fmtDate = (iso) => {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" });
};
