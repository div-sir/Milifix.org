/* ============================================================
   MERIDIEL — Google auth + Drive appData storage
   Fully client-side, no backend. Flights are saved as a single
   JSON file in the user's own Google Drive "application data
   folder" (hidden; only this app can read it), so signing in with
   the same Google account on any device restores the same atlas.

   Requires, in the Google Cloud project for this Client ID:
     1. Google Drive API enabled (APIs & Services → Library).
     2. The scope .../auth/drive.appdata added on the OAuth consent
        screen (sensitive; fine for personal use in Testing mode
        with yourself as a test user).
   ============================================================ */
(function () {
  var CLIENT_ID = "827299294563-uika95bhd5g8foi4ins9jo5f3oi2hqgp.apps.googleusercontent.com";
  var SCOPES = "openid email profile https://www.googleapis.com/auth/drive.appdata";
  var FILE_NAME = "meridiel-flights.json";

  var TOKEN_CACHE_KEY = "fa-gtoken";

  var tokenClient = null;
  var fileId = null;  // cached Drive file id
  var pending = null; // { resolve, reject } for the in-flight token request

  function now() { return Date.now(); }

  // The access token only ever lived in a JS variable, so a plain page
  // reload threw it away and forced a fresh silent refresh every single
  // time. Google's silent ("prompt: none") refresh depends on a hidden
  // iframe that many browsers now block by default (Safari ITP, Chrome's
  // third-party-cookie phase-out), so on an affected browser *every* reload
  // could show "offline"/"reconnect" even though the user is genuinely
  // signed in. This is caching in localStorage rather than sessionStorage
  // because on mobile — especially a page added to the home screen — every
  // reopen is a fresh browsing context with its own sessionStorage, so a
  // session-scoped cache bought nothing there; it kept re-triggering the
  // same fragile silent refresh on every single open. localStorage survives
  // across those relaunches, so silent refresh is only needed once per real
  // token expiry (~1hr) instead of once per app open.
  function loadCachedToken() {
    try {
      var t = JSON.parse(localStorage.getItem(TOKEN_CACHE_KEY) || "null");
      if (t && t.access_token && t.expires_at > now()) return t;
    } catch (e) { /* corrupt cache — ignore */ }
    return null;
  }
  function cacheToken(t) {
    try {
      if (t) localStorage.setItem(TOKEN_CACHE_KEY, JSON.stringify(t));
      else localStorage.removeItem(TOKEN_CACHE_KEY);
    } catch (e) { /* storage full/private mode — fine, just won't persist */ }
  }
  var token = loadCachedToken(); // { access_token, expires_at }

  // The GIS script tag loads `async`, so it can still be mid-flight when the
  // app mounts and (for a returning, already-signed-in user) immediately
  // tries a silent token refresh. Without this wait, that first request sees
  // `window.google` not there yet and fails instantly — showing "offline"
  // even though the user really is signed in and GIS finishes loading a
  // moment later.
  function waitForGis(timeoutMs) {
    timeoutMs = timeoutMs || 8000;
    return new Promise(function (resolve, reject) {
      if (window.google && window.google.accounts && window.google.accounts.oauth2) { resolve(); return; }
      var start = now();
      var iv = setInterval(function () {
        if (window.google && window.google.accounts && window.google.accounts.oauth2) {
          clearInterval(iv);
          resolve();
        } else if (now() - start > timeoutMs) {
          clearInterval(iv);
          reject(new Error("gis-not-loaded"));
        }
      }, 150);
    });
  }

  function ensureClient() {
    if (tokenClient) return tokenClient;
    if (!(window.google && window.google.accounts && window.google.accounts.oauth2)) return null;
    tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPES,
      callback: function (resp) {
        if (!pending) return;
        var p = pending; pending = null;
        if (resp && resp.access_token) {
          token = {
            access_token: resp.access_token,
            expires_at: now() + ((resp.expires_in || 3600) - 60) * 1000,
          };
          cacheToken(token);
          p.resolve(resp.access_token);
        } else {
          p.reject(resp || new Error("no-token"));
        }
      },
      error_callback: function (err) {
        if (!pending) return;
        var p = pending; pending = null;
        p.reject(err || new Error("oauth-error"));
      },
    });
    return tokenClient;
  }

  // interactive=true → may show account chooser / consent.
  // interactive=false → silent refresh (fails if interaction is required).
  async function requestToken(interactive) {
    await waitForGis();
    return new Promise(function (resolve, reject) {
      var client = ensureClient();
      if (!client) { reject(new Error("gis-not-loaded")); return; }
      pending = { resolve: resolve, reject: reject };
      try {
        client.requestAccessToken(interactive ? {} : { prompt: "none" });
      } catch (e) {
        pending = null;
        reject(e);
      }
    });
  }

  // Tags a silent-refresh failure so the UI can offer a one-tap "reconnect"
  // (an interactive sign-in, which works even when the browser blocks the
  // hidden iframe silent refresh needs) instead of a generic, unhelpful
  // "offline" that looks like a network problem.
  async function getToken() {
    if (token && token.expires_at > now()) return token.access_token;
    try {
      return await requestToken(false);
    } catch (e) {
      console.error("Meridiel: silent Google sign-in refresh failed —", e);
      var err = new Error("reauth-required");
      err.code = "reauth-required";
      err.cause = e;
      throw err;
    }
  }

  // fetch with a valid bearer token; on a 401 refresh once and retry.
  async function driveFetch(url, opts) {
    opts = opts || {};
    var at = await getToken();
    var headers = Object.assign({}, opts.headers, { Authorization: "Bearer " + at });
    var r = await fetch(url, Object.assign({}, opts, { headers: headers }));
    if (r.status !== 401) return r;
    token = null;
    cacheToken(null);
    var at2 = await getToken();
    var h2 = Object.assign({}, opts.headers, { Authorization: "Bearer " + at2 });
    return fetch(url, Object.assign({}, opts, { headers: h2 }));
  }

  async function findFile() {
    if (fileId) return fileId;
    var q = encodeURIComponent("name='" + FILE_NAME + "'");
    var url = "https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&fields=files(id,name)&q=" + q;
    // A non-ok response (e.g. Drive API not enabled, or a scope/permission
    // error) used to get parsed as JSON anyway; its error body has no
    // `.files`, so this silently read as "no file yet" instead of a real
    // failure — masking a broken sync as a fresh first run.
    var r = await driveFetch(url);
    if (!r.ok) throw new Error("drive list " + r.status);
    var j = await r.json();
    if (j && j.files && j.files.length) fileId = j.files[0].id;
    return fileId;
  }

  // Returns the parsed JSON payload, or null if there is no file yet.
  async function load() {
    var id = await findFile();
    if (!id) return null;
    var r = await driveFetch("https://www.googleapis.com/drive/v3/files/" + id + "?alt=media");
    return r.ok ? r.json() : null;
  }

  // Create or overwrite the app-data file with `data`.
  async function save(data) {
    var body = JSON.stringify(data);
    var id = await findFile();
    if (id) {
      return driveFetch(
        "https://www.googleapis.com/upload/drive/v3/files/" + id + "?uploadType=media",
        { method: "PATCH", headers: { "Content-Type": "application/json" }, body: body }
      );
    }
    var boundary = "meridiel" + Math.random().toString(36).slice(2);
    var metadata = { name: FILE_NAME, parents: ["appDataFolder"] };
    var multipart =
      "--" + boundary + "\r\n" +
      "Content-Type: application/json; charset=UTF-8\r\n\r\n" +
      JSON.stringify(metadata) + "\r\n" +
      "--" + boundary + "\r\n" +
      "Content-Type: application/json\r\n\r\n" +
      body + "\r\n" +
      "--" + boundary + "--";
    var r = await driveFetch(
      "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id",
      { method: "POST", headers: { "Content-Type": "multipart/related; boundary=" + boundary }, body: multipart }
    );
    var j = await r.json();
    if (j && j.id) fileId = j.id;
    return j;
  }

  // Interactive sign-in: get a token (with Drive scope) + the profile.
  async function signIn() {
    var at = await requestToken(true);
    var r = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: "Bearer " + at },
    });
    if (!r.ok) throw new Error("userinfo " + r.status);
    return r.json();
  }

  window.MeridielAuth = { enabled: !!CLIENT_ID, clientId: CLIENT_ID, signIn: signIn };
  window.MeridielStore = { load: load, save: save };
})();
