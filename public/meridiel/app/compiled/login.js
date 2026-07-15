/* 由 scripts/build-meridiel.mjs 從 login.jsx 編譯產生，請勿手動編輯 */
(function () {
/* ============================================================
   MERIDIEL — Welcome / optional Google sign-in
   Real Google sign-in via Google Identity Services (client-side,
   no backend). The Client ID and the auth/Drive plumbing live in
   store.js (window.MeridielAuth). Local exploration remains available
   when Google auth is not configured.
   ============================================================ */
const {
  useState: useStateL
} = React;
function LoginGate({
  theme,
  onToggleTheme,
  onLogin,
  onExplore
}) {
  const [step, setStep] = useStateL("signin"); // signin | connecting
  const [error, setError] = useStateL("");
  const [signingName, setSigningName] = useStateL("");
  const realAuth = !!(window.MeridielAuth && window.MeridielAuth.enabled);

  // Build an account object from a Google userinfo payload.
  const acctFromProfile = p => {
    const nm = (p.name || p.email || "Explorer").trim();
    return {
      name: nm,
      email: p.email || "",
      handle: p.email ? "@" + p.email.split("@")[0] : "",
      initial: (nm[0] || "?").toUpperCase(),
      picture: p.picture || "",
      mode: "google"
    };
  };

  // Real Google sign-in (token with Drive scope → userinfo), via store.js.
  const realSignIn = () => {
    setError("");
    setSigningName("");
    setStep("connecting");
    window.MeridielAuth.signIn().then(p => {
      setSigningName(p.name || p.email || "");
      onLogin(acctFromProfile(p));
    }).catch(err => {
      setStep("signin");
      const cancelled = err && (err.type === "popup_closed" || err.type === "popup_failed_to_open");
      setError(cancelled ? "Sign-in was cancelled." : "Google sign-in didn’t complete. Please try again.");
    });
  };

  // Entry point for the "Sign in with Google" button.
  const onSignInClick = () => {
    if (realAuth) {
      realSignIn();
      return;
    }
    setError("Google sync is temporarily unavailable. You can still explore locally.");
  };
  return /*#__PURE__*/React.createElement("div", {
    className: "login-stage"
  }, /*#__PURE__*/React.createElement("svg", {
    className: "login-deco",
    viewBox: "0 0 1200 800",
    preserveAspectRatio: "xMidYMid slice",
    "aria-hidden": "true"
  }, /*#__PURE__*/React.createElement("defs", null, /*#__PURE__*/React.createElement("radialGradient", {
    id: "lg-glow",
    cx: "50%",
    cy: "42%",
    r: "60%"
  }, /*#__PURE__*/React.createElement("stop", {
    offset: "0%",
    stopColor: "var(--ochre)",
    stopOpacity: "0.12"
  }), /*#__PURE__*/React.createElement("stop", {
    offset: "100%",
    stopColor: "var(--ochre)",
    stopOpacity: "0"
  }))), /*#__PURE__*/React.createElement("rect", {
    width: "1200",
    height: "800",
    fill: "url(#lg-glow)"
  }), /*#__PURE__*/React.createElement("path", {
    className: "lp",
    d: "M120 620 Q420 360 720 480 T1080 300"
  }), /*#__PURE__*/React.createElement("path", {
    className: "lp",
    d: "M80 200 Q360 120 600 260 T1120 200"
  }), /*#__PURE__*/React.createElement("path", {
    className: "lp",
    d: "M200 720 Q520 560 760 660 T1100 560"
  }), /*#__PURE__*/React.createElement("circle", {
    className: "ld",
    cx: "120",
    cy: "620",
    r: "5"
  }), /*#__PURE__*/React.createElement("circle", {
    className: "ld",
    cx: "1080",
    cy: "300",
    r: "5"
  }), /*#__PURE__*/React.createElement("circle", {
    className: "ld",
    cx: "80",
    cy: "200",
    r: "5"
  }), /*#__PURE__*/React.createElement("circle", {
    className: "ld",
    cx: "1120",
    cy: "200",
    r: "5"
  }), /*#__PURE__*/React.createElement("circle", {
    className: "ld",
    cx: "600",
    cy: "260",
    r: "4"
  }), /*#__PURE__*/React.createElement("circle", {
    className: "ld",
    cx: "720",
    cy: "480",
    r: "4"
  })), /*#__PURE__*/React.createElement("button", {
    className: "login-theme icon-btn",
    onClick: onToggleTheme,
    title: "Toggle theme"
  }, theme === "dark" ? /*#__PURE__*/React.createElement(window.Icon.sun, null) : /*#__PURE__*/React.createElement(window.Icon.moon, null)), /*#__PURE__*/React.createElement("div", {
    className: "login-card paper-tex"
  }, /*#__PURE__*/React.createElement("div", {
    className: "login-brand"
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
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("b", null, "Meridiel"), /*#__PURE__*/React.createElement("small", null, "Charted by hand"))), step !== "connecting" && /*#__PURE__*/React.createElement("p", {
    className: "login-tag"
  }, "Build a living atlas of every flight you've taken. Explore the globe now, then connect Google Drive only if you want cross-device sync."), step === "signin" && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("button", {
    className: "gbtn gbtn-primary",
    onClick: onExplore
  }, /*#__PURE__*/React.createElement("span", {
    className: "gbtn-g"
  }, /*#__PURE__*/React.createElement(window.Icon.globe, null)), /*#__PURE__*/React.createElement("span", null, "Explore atlas")), /*#__PURE__*/React.createElement("button", {
    className: "gbtn gbtn-secondary",
    onClick: onSignInClick
  }, /*#__PURE__*/React.createElement("span", {
    className: "gbtn-g"
  }, /*#__PURE__*/React.createElement(window.Icon.google, null)), /*#__PURE__*/React.createElement("span", null, "Continue with Google")), error && /*#__PURE__*/React.createElement("div", {
    className: "login-err"
  }, error), /*#__PURE__*/React.createElement("div", {
    className: "login-privacy"
  }, /*#__PURE__*/React.createElement("p", null, /*#__PURE__*/React.createElement("b", null, "Explore:"), " no account; changes stay in this browser."), /*#__PURE__*/React.createElement("p", null, /*#__PURE__*/React.createElement("b", null, "Google:"), " shares your basic profile and stores the atlas in Drive's private appData folder."), /*#__PURE__*/React.createElement("a", {
    href: "/privacy"
  }, "Privacy details")), /*#__PURE__*/React.createElement("div", {
    className: "login-meta"
  }, /*#__PURE__*/React.createElement("span", null, "NO PASSWORD STORED"), /*#__PURE__*/React.createElement("span", {
    className: "dot"
  }, "\u2022"), /*#__PURE__*/React.createElement("span", null, "YOU CHOOSE WHEN TO SYNC"))), step === "connecting" && /*#__PURE__*/React.createElement("div", {
    className: "login-connecting"
  }, /*#__PURE__*/React.createElement("div", {
    className: "spin"
  }), /*#__PURE__*/React.createElement("div", {
    className: "lc-name"
  }, signingName ? /*#__PURE__*/React.createElement(React.Fragment, null, "Signing in as ", /*#__PURE__*/React.createElement("b", null, signingName)) : "Signing you in…"), /*#__PURE__*/React.createElement("div", {
    className: "lc-sub"
  }, "Boarding your atlas\u2026"))), /*#__PURE__*/React.createElement("div", {
    className: "login-foot"
  }, "\u25CE Meridiel \u2014 a personal cartography project"));
}
window.LoginGate = LoginGate;
})();
