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

  var tokenClient = null;
  var token = null;   // { access_token, expires_at }
  var fileId = null;  // cached Drive file id
  var pending = null; // { resolve, reject } for the in-flight token request

  function now() { return Date.now(); }

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
  function requestToken(interactive) {
    return waitForGis().then(function () {
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
    });
  }

  function getToken() {
    if (token && token.expires_at > now()) return Promise.resolve(token.access_token);
    return requestToken(false);
  }

  // fetch with a valid bearer token; on a 401 refresh once and retry.
  function driveFetch(url, opts) {
    opts = opts || {};
    return getToken().then(function (at) {
      var headers = Object.assign({}, opts.headers, { Authorization: "Bearer " + at });
      return fetch(url, Object.assign({}, opts, { headers: headers })).then(function (r) {
        if (r.status !== 401) return r;
        token = null;
        return getToken().then(function (at2) {
          var h2 = Object.assign({}, opts.headers, { Authorization: "Bearer " + at2 });
          return fetch(url, Object.assign({}, opts, { headers: h2 }));
        });
      });
    });
  }

  function findFile() {
    if (fileId) return Promise.resolve(fileId);
    var q = encodeURIComponent("name='" + FILE_NAME + "'");
    var url = "https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&fields=files(id,name)&q=" + q;
    return driveFetch(url).then(function (r) { return r.json(); }).then(function (j) {
      if (j && j.files && j.files.length) fileId = j.files[0].id;
      return fileId;
    });
  }

  // Returns the parsed JSON payload, or null if there is no file yet.
  function load() {
    return findFile().then(function (id) {
      if (!id) return null;
      return driveFetch("https://www.googleapis.com/drive/v3/files/" + id + "?alt=media")
        .then(function (r) { return r.ok ? r.json() : null; });
    });
  }

  // Create or overwrite the app-data file with `data`.
  function save(data) {
    var body = JSON.stringify(data);
    return findFile().then(function (id) {
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
      return driveFetch(
        "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id",
        { method: "POST", headers: { "Content-Type": "multipart/related; boundary=" + boundary }, body: multipart }
      ).then(function (r) { return r.json(); }).then(function (j) {
        if (j && j.id) fileId = j.id;
        return j;
      });
    });
  }

  // Interactive sign-in: get a token (with Drive scope) + the profile.
  function signIn() {
    return requestToken(true).then(function (at) {
      return fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
        headers: { Authorization: "Bearer " + at },
      }).then(function (r) {
        if (!r.ok) throw new Error("userinfo " + r.status);
        return r.json();
      });
    });
  }

  window.MeridielAuth = { enabled: !!CLIENT_ID, clientId: CLIENT_ID, signIn: signIn };
  window.MeridielStore = { load: load, save: save };
})();
