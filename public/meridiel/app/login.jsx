/* ============================================================
   MERIDIEL — Google Sign-in Gate
   Real Google sign-in via Google Identity Services (client-side,
   no backend). The Client ID and the auth/Drive plumbing live in
   store.js (window.MeridielAuth); if it's disabled the built-in
   demo account is used so the app still runs.
   ============================================================ */
const { useState: useStateL } = React;

/* Demo account — used only when Google auth is disabled (no Client ID). */
const DEMO_ACCOUNT = {
  name: "Avery Lin",
  email: "avery.lin@gmail.com",
  handle: "@averyflies",
  initial: "A",
};

function LoginGate({ theme, onToggleTheme, onLogin }) {
  const [step, setStep] = useStateL("signin"); // signin | choose | connecting
  const [error, setError] = useStateL("");
  const [signingName, setSigningName] = useStateL("");
  const acct = DEMO_ACCOUNT;
  const realAuth = !!(window.MeridielAuth && window.MeridielAuth.enabled);

  // Build an account object from a Google userinfo payload.
  const acctFromProfile = (p) => {
    const nm = (p.name || p.email || "Explorer").trim();
    return {
      name: nm,
      email: p.email || "",
      handle: p.email ? "@" + p.email.split("@")[0] : "",
      initial: (nm[0] || "?").toUpperCase(),
      picture: p.picture || "",
    };
  };

  // Real Google sign-in (token with Drive scope → userinfo), via store.js.
  const realSignIn = () => {
    setError("");
    setSigningName("");
    setStep("connecting");
    window.MeridielAuth.signIn().then((p) => {
      setSigningName(p.name || p.email || "");
      onLogin(acctFromProfile(p));
    }).catch((err) => {
      setStep("signin");
      const cancelled = err && (err.type === "popup_closed" || err.type === "popup_failed_to_open");
      setError(cancelled ? "Sign-in was cancelled." : "Google sign-in didn’t complete. Please try again.");
    });
  };

  // Entry point for the "Sign in with Google" button.
  const onSignInClick = () => {
    if (realAuth) realSignIn();
    else setStep("choose");
  };

  // Demo connect (mock account chooser path).
  const connect = () => {
    setSigningName(acct.name);
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
            <button className="gbtn" onClick={onSignInClick}>
              <span className="gbtn-g"><window.Icon.google /></span>
              <span>Sign in with Google</span>
            </button>
            {error && <div className="login-err">{error}</div>}
            <div className="login-or"><span>secure · Google sign-in · your data stays in your browser</span></div>
            <div className="login-meta">
              <span>EST. 2016</span><span className="dot">•</span><span>NO PASSWORD STORED</span>
            </div>
          </React.Fragment>
        )}

        {step === "choose" && (
          <div className="gchoose">
            <div className="gchoose-head">
              <span className="gword">Google</span>
              <span className="gchoose-sub">Choose an account <em>to continue to Meridiel</em></span>
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
            <div className="lc-name">
              {signingName ? <React.Fragment>Signing in as <b>{signingName}</b></React.Fragment> : "Signing you in…"}
            </div>
            <div className="lc-sub">Boarding your atlas…</div>
          </div>
        )}
      </div>

      <div className="login-foot">◎ Meridiel — a personal cartography project</div>
    </div>
  );
}
window.LoginGate = LoginGate;
