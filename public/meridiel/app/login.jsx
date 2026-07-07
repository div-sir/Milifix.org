/* ============================================================
   MERIDIEL — Google OAuth Login Gate (mock flow)
   Two-step: sign-in card → account chooser → connecting → app.
   ============================================================ */
const { useState: useStateL, useEffect: useEffectL } = React;

/* The account that "Google" offers — feels real, fully client-side. */
const GOOGLE_ACCOUNT = {
  name: "Avery Lin",
  email: "avery.lin@gmail.com",
  handle: "@averyflies",
  initial: "A",
};

function LoginGate({ theme, onToggleTheme, onLogin }) {
  const [step, setStep] = useStateL("signin"); // signin | choose | connecting
  const acct = GOOGLE_ACCOUNT;

  const connect = () => {
    setStep("connecting");
    setTimeout(() => onLogin(acct), 1500);
  };

  return (
    <div className="login-stage">
      {/* decorative dashed flight paths */}
      <svg className="login-deco" viewBox="0 0 1200 800" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <defs>
          <radialGradient id="lg-glow" cx="50%" cy="42%" r="60%">
            <stop offset="0%" stopColor="var(--ochre)" stopOpacity="0.12" />
            <stop offset="100%" stopColor="var(--ochre)" stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width="1200" height="800" fill="url(#lg-glow)" />
        <path className="lp" d="M120 620 Q420 360 720 480 T1080 300" />
        <path className="lp" d="M80 200 Q360 120 600 260 T1120 200" />
        <path className="lp" d="M200 720 Q520 560 760 660 T1100 560" />
        <circle className="ld" cx="120" cy="620" r="5" /><circle className="ld" cx="1080" cy="300" r="5" />
        <circle className="ld" cx="80" cy="200" r="5" /><circle className="ld" cx="1120" cy="200" r="5" />
        <circle className="ld" cx="600" cy="260" r="4" /><circle className="ld" cx="720" cy="480" r="4" />
      </svg>

      <button className="login-theme icon-btn" onClick={onToggleTheme} title="Toggle theme">
        {theme === "dark" ? <window.Icon.sun /> : <window.Icon.moon />}
      </button>

      <div className="login-card paper-tex">
        <div className="login-brand">
          <svg className="mark" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
            <circle cx="12" cy="12" r="10" />
            <path d="M2 12h20M12 2c2.6 2.7 4 5.9 4 10s-1.4 7.3-4 10c-2.6-2.7-4-5.9-4-10s1.4-7.3 4-10z" />
          </svg>
          <div>
            <b>Meridiel</b>
            <small>Charted by hand</small>
          </div>
        </div>

        {step !== "connecting" && (
          <p className="login-tag">
            Every flight you've ever taken, drawn across a living globe.
            Sign in to chart and keep your atlas.
          </p>
        )}

        {step === "signin" && (
          <React.Fragment>
            <button className="gbtn" onClick={() => setStep("choose")}>
              <span className="gbtn-g"><window.Icon.google /></span>
              <span>Sign in with Google</span>
            </button>
            <div className="login-or"><span>secure · client-side · nothing leaves your browser</span></div>
            <div className="login-meta">
              <span>EST. 2016</span><span className="dot">•</span><span>NO PASSWORD STORED</span>
            </div>
          </React.Fragment>
        )}

        {step === "choose" && (
          <div className="gchoose">
            <div className="gchoose-head">
              <span className="gword">Google</span>
              <span className="gchoose-sub">Choose an account <em>to continue to Flight&nbsp;Atlas</em></span>
            </div>
            <button className="gacct" onClick={connect}>
              <span className="gacct-av">{acct.initial}</span>
              <span className="gacct-id">
                <b>{acct.name}</b>
                <small>{acct.email}</small>
              </span>
            </button>
            <button className="gacct ghost" onClick={connect}>
              <span className="gacct-av plus"><window.Icon.plus /></span>
              <span className="gacct-id"><b>Use another account</b></span>
            </button>
            <p className="gfine">
              To continue, Google will share your name, email address, and
              profile picture with Meridiel.
            </p>
          </div>
        )}

        {step === "connecting" && (
          <div className="login-connecting">
            <div className="spin" />
            <div className="lc-name">Signing in as <b>{acct.name}</b></div>
            <div className="lc-sub">Boarding your atlas…</div>
          </div>
        )}
      </div>

      <div className="login-foot">◎ Meridiel — a personal cartography project</div>
    </div>
  );
}
window.LoginGate = LoginGate;
