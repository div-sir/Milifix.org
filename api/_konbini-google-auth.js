// @ts-check
// 共用的 Google ID token 驗證，供 konbini 相關 serverless 路由匯入。
// 底線前綴讓 Vercel builder 略過、不視為獨立路由。

const CLIENT_ID =
  process.env.GOOGLE_OAUTH_CLIENT_ID ?? process.env.PUBLIC_GOOGLE_OAUTH_CLIENT_ID;

/** @param {string} url */
async function fetchTokenInfo(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10_000);
  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

/**
 * 以 Google tokeninfo 端點驗證 ID token。回傳已驗證的身分或 null。
 * @param {string} idToken
 */
async function verifyGoogleIdToken(idToken) {
  const res = await fetchTokenInfo(
    `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`,
  );
  if (!res.ok) return null;
  const p = await res.json();
  const issOk = p.iss === 'accounts.google.com' || p.iss === 'https://accounts.google.com';
  const audOk = CLIENT_ID && p.aud === CLIENT_ID;
  const notExpired = Number(p.exp) * 1000 > Date.now();
  if (!issOk || !audOk || !notExpired || !p.sub) return null;
  return {
    sub: String(p.sub),
    name: typeof p.name === 'string' ? p.name : '',
    emailVerified: p.email_verified === true || p.email_verified === 'true',
  };
}

export { CLIENT_ID, verifyGoogleIdToken };
