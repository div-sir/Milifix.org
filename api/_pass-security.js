// @ts-check
import { createHash } from 'node:crypto';
// Security helpers for the public generate-pass endpoint.
// Files/directories prefixed with "_" are ignored by Vercel's builder,
// so this module is a plain helper import, NOT its own serverless route.
//
// All functions here are pure (or take their mutable state as an argument),
// so they can be unit-tested with plain node without spinning up the handler.

// ---------------------------------------------------------------------------
// Origin / Referer allowlist
// ---------------------------------------------------------------------------

/**
 * Decide whether a hostname is one of ours.
 * Allowed: milifix.com and any subdomain, this deployment's exact Vercel hosts,
 * and localhost / 127.0.0.1 / *.local outside production.
 * @param {string} host bare hostname (no scheme, no port)
 * @param {NodeJS.ProcessEnv} [env]
 */
function isAllowedHost(host, env = process.env) {
  if (!host) return false;
  const h = host.toLowerCase();
  if (h === 'milifix.com' || h.endsWith('.milifix.com')) return true;
  const exactVercelHosts = [
    env.VERCEL_URL,
    env.VERCEL_BRANCH_URL,
    env.VERCEL_PROJECT_PRODUCTION_URL,
    ...(env.ALLOWED_PREVIEW_HOSTS ?? '').split(','),
  ]
    .map((value) => String(value ?? '').trim().toLowerCase().replace(/^https?:\/\//, '').split('/')[0])
    .filter(Boolean);
  if (exactVercelHosts.includes(h)) return true;
  if (env.NODE_ENV !== 'production') {
    if (h === 'localhost' || h === '127.0.0.1' || h === '::1') return true;
    if (h.endsWith('.local') || h.endsWith('.localhost')) return true;
  }
  return false;
}

/**
 * Pull the bare hostname out of an Origin or Referer header value.
 * @param {string | undefined} value
 * @returns {string | null}
 */
function hostFromHeader(value) {
  if (!value || typeof value !== 'string') return null;
  try {
    // Origin is "scheme://host[:port]"; Referer is a full URL. Both parse via URL.
    return new URL(value).hostname;
  } catch {
    return null;
  }
}

/**
 * Origin/Referer allowlist check.
 *
 * Some in-app browsers (LINE / FB / IG webviews) strip Origin AND Referer.
 * Those requests must carry the first-party X-Milifix-Request marker:
 *   - If Origin (preferred) or Referer IS present, it MUST be one of our hosts,
 *     otherwise the request is rejected (this blocks the easy scripted-abuse and
 *     other-site-embedded cases).
 *   - If BOTH are absent, the marker is required; rate limiting remains the
 *     backstop against scripted clients that can forge arbitrary headers.
 *
 * @param {{origin?: string|string[]|undefined, referer?: string|string[]|undefined, 'x-milifix-request'?: string|string[]|undefined}} headers
 * @returns {{ allowed: boolean, present: boolean, host: string | null }}
 */
function checkOrigin(headers) {
  const originVal = Array.isArray(headers.origin) ? headers.origin[0] : headers.origin;
  const refererVal = Array.isArray(headers.referer) ? headers.referer[0] : headers.referer;

  const host = hostFromHeader(originVal) ?? hostFromHeader(refererVal);

  if (host === null) {
    // 部分 in-app browser 會移除 Origin/Referer。這時仍要求前端 fetch 加上
    // 自訂 header；一般跨站 HTML form 無法自行帶這個 header。
    const markerValue = Array.isArray(headers['x-milifix-request'])
      ? headers['x-milifix-request'][0]
      : headers['x-milifix-request'];
    return { allowed: markerValue === '1', present: false, host: null };
  }
  return { allowed: isAllowedHost(host), present: true, host };
}

// ---------------------------------------------------------------------------
// Rate limiting (in-memory, best-effort)
// ---------------------------------------------------------------------------
//
// NOTE: This is a BEST-EFFORT abuse brake, not a hard guarantee. Vercel
// serverless instances are ephemeral: a cold start starts with an empty Map,
// and concurrent requests may land on different warm instances, each with its
// own counter. A determined attacker who forces new instances can partially
// evade it. It is deliberately simple because the project has no KV/Redis
// (no Upstash etc.) account. For a hard guarantee you'd move this to Vercel WAF
// or a shared KV store.

const RATE_LIMIT_PER_MINUTE = 8;    // sliding 60s window per IP
const RATE_LIMIT_PER_DAY = 80;      // sliding 24h window per IP
const MINUTE_MS = 60_000;
const DAY_MS = 86_400_000;

// Guard against unbounded memory growth from many distinct IPs on a warm
// instance. If the store exceeds this, we sweep out IPs with no recent hits.
const MAX_TRACKED_IPS = 10_000;

/**
 * Sliding-window rate limit check + record. Mutates `store`.
 * @param {Map<string, number[]>} store  ip -> ascending list of hit timestamps (ms)
 * @param {string} ip
 * @param {number} [now]
 * @returns {{ limited: boolean, retryAfter: number }}  retryAfter in seconds
 */
function checkRateLimit(store, ip, now = Date.now()) {
  // Opportunistic sweep so the Map can't grow without bound.
  if (store.size > MAX_TRACKED_IPS) {
    for (const [key, hits] of store) {
      const last = hits[hits.length - 1];
      if (last === undefined || now - last >= DAY_MS) store.delete(key);
    }
  }

  const prev = store.get(ip) ?? [];
  // Drop hits older than the daily window.
  const withinDay = prev.filter((t) => now - t < DAY_MS);

  if (withinDay.length >= RATE_LIMIT_PER_DAY) {
    store.set(ip, withinDay);
    const retryAfter = Math.max(1, Math.ceil((DAY_MS - (now - withinDay[0])) / 1000));
    return { limited: true, retryAfter };
  }

  const withinMinute = withinDay.filter((t) => now - t < MINUTE_MS);
  if (withinMinute.length >= RATE_LIMIT_PER_MINUTE) {
    store.set(ip, withinDay);
    const retryAfter = Math.max(1, Math.ceil((MINUTE_MS - (now - withinMinute[0])) / 1000));
    return { limited: true, retryAfter };
  }

  withinDay.push(now);
  store.set(ip, withinDay);
  return { limited: false, retryAfter: 0 };
}

let warnedSharedRateLimitFailure = false;

/**
 * 優先使用 Upstash / Vercel Marketplace Redis 的 REST pipeline，讓不同
 * serverless instance 共用計數器；未設定或服務暫時不可用時才退回本機 Map。
 * @param {Map<string, number[]>} fallbackStore
 * @param {string} scope
 * @param {string} ip
 * @param {number} [now]
 */
async function checkSharedRateLimit(fallbackStore, scope, ip, now = Date.now()) {
  const url = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;
  if (!url || !token) return checkRateLimit(fallbackStore, ip, now);

  const salt = process.env.RATE_LIMIT_KEY_SALT ?? 'milifix-rate-limit';
  const subject = createHash('sha256').update(`${salt}:${ip}`).digest('hex').slice(0, 32);
  const safeScope = scope.replace(/[^a-z0-9_-]/gi, '-').slice(0, 48);
  const minuteWindow = Math.floor(now / MINUTE_MS);
  const dayWindow = Math.floor(now / DAY_MS);
  const minuteKey = `rl:${safeScope}:m:${minuteWindow}:${subject}`;
  const dayKey = `rl:${safeScope}:d:${dayWindow}:${subject}`;

  try {
    const response = await fetch(`${url.replace(/\/$/, '')}/pipeline`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify([
        ['INCR', minuteKey],
        ['EXPIRE', minuteKey, '120', 'NX'],
        ['INCR', dayKey],
        ['EXPIRE', dayKey, '172800', 'NX'],
      ]),
    });
    if (!response.ok) throw new Error(`shared rate limit ${response.status}`);
    const result = await response.json();
    const minuteCount = Number(result?.[0]?.result);
    const dayCount = Number(result?.[2]?.result);
    if (!Number.isFinite(minuteCount) || !Number.isFinite(dayCount)) {
      throw new Error('shared rate limit returned invalid counters');
    }
    if (dayCount > RATE_LIMIT_PER_DAY) {
      return { limited: true, retryAfter: Math.max(1, Math.ceil(((dayWindow + 1) * DAY_MS - now) / 1000)) };
    }
    if (minuteCount > RATE_LIMIT_PER_MINUTE) {
      return { limited: true, retryAfter: Math.max(1, Math.ceil(((minuteWindow + 1) * MINUTE_MS - now) / 1000)) };
    }
    return { limited: false, retryAfter: 0 };
  } catch (error) {
    if (!warnedSharedRateLimitFailure) {
      warnedSharedRateLimitFailure = true;
      console.error('[rate-limit] shared store unavailable; using per-instance fallback', error);
    }
    return checkRateLimit(fallbackStore, ip, now);
  }
}

/**
 * Extract the client IP. Vercel sets x-vercel-forwarded-for (its own trusted
 * value); x-forwarded-for is the standard chain — take the first (client) hop.
 * @param {{ headers: Record<string, string|string[]|undefined>, socket?: {remoteAddress?: string} }} req
 * @returns {string}
 */
function getClientIp(req) {
  const raw = req.headers['x-vercel-forwarded-for'] ?? req.headers['x-forwarded-for'] ?? '';
  const value = Array.isArray(raw) ? raw[0] : raw;
  const first = String(value).split(',')[0].trim();
  return first || req.socket?.remoteAddress || 'unknown';
}

// ---------------------------------------------------------------------------
// PNG image validation
// ---------------------------------------------------------------------------

const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const MAX_IMAGE_BASE64_LENGTH = 1_500_000; // ~1.1MB decoded, well under Vercel's 4.5MB body limit
const MAX_IMAGE_DIMENSION = 2000; // px, cap width & height to bound decode work downstream

/**
 * Validate + decode a user-supplied base64 image. Returns the Buffer only if it
 * is a real PNG (magic bytes + IHDR) within the size and dimension limits;
 * otherwise null. Callers treat null as a 400.
 * @param {unknown} value
 * @returns {Buffer | null}
 */
function decodeImage(value) {
  if (typeof value !== 'string' || value.length === 0) return null;
  if (value.length > MAX_IMAGE_BASE64_LENGTH) return null;
  if (!/^[A-Za-z0-9+/]+=*$/.test(value)) return null;

  const buf = Buffer.from(value, 'base64');
  // Need: 8-byte signature + 4-byte length + "IHDR" + 4 width + 4 height = 24 bytes min.
  if (buf.length < 24) return null;
  if (!buf.subarray(0, 8).equals(PNG_MAGIC)) return null;
  if (buf.subarray(12, 16).toString('ascii') !== 'IHDR') return null;

  const width = buf.readUInt32BE(16);
  const height = buf.readUInt32BE(20);
  if (width === 0 || height === 0) return null;
  if (width > MAX_IMAGE_DIMENSION || height > MAX_IMAGE_DIMENSION) return null;

  return buf;
}

// ---------------------------------------------------------------------------
// Field format validation
// ---------------------------------------------------------------------------

/**
 * Validate a Taiwan e-invoice mobile carrier ID: `/` followed by 7 chars from
 * the allowed alphabet (uppercase letters, digits, `+`, `-`, `.`).
 * @param {string} id
 */
function isValidCarrier(id) {
  return /^\/[A-Z0-9+\-.]{7}$/.test(id);
}

/**
 * Validate a 6-digit hex color string, e.g. `#1a1a2e`.
 * @param {string} hex
 */
function isValidHexColor(hex) {
  return typeof hex === 'string' && /^#[0-9a-fA-F]{6}$/.test(hex);
}

export {
  isAllowedHost,
  hostFromHeader,
  checkOrigin,
  checkRateLimit,
  checkSharedRateLimit,
  getClientIp,
  decodeImage,
  isValidCarrier,
  isValidHexColor,
  RATE_LIMIT_PER_MINUTE,
  RATE_LIMIT_PER_DAY,
  MAX_IMAGE_DIMENSION,
  MAX_IMAGE_BASE64_LENGTH,
};
