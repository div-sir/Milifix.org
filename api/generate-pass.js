// @ts-check
import { randomUUID } from 'node:crypto';
import { PKPass } from 'passkit-generator';
import {
  checkOrigin,
  checkRateLimit,
  getClientIp,
  decodeImage,
  isValidCarrier,
  isValidHexColor,
} from './_pass-security.js';

// Minimal 1x1 PNG — fallback when no icon provided
const PLACEHOLDER_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADElEQVQI12NgYGAAAAAEAAFmJ72TAAAAAElFTkSuQmCC',
  'base64'
);

const PASS_TYPE_ID = 'pass.com.milifix.invoice';
const TEAM_ID = process.env.APPLE_TEAM_ID ?? 'UZJ42KP5ND';

// In-memory rate-limit store, shared across requests on the same warm serverless
// instance. Ephemeral by design: cold starts reset it (see _pass-security.js).
/** @type {Map<string, number[]>} */
const RATE_LIMIT_STORE = new Map();

/** @param {string} hex */
function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgb(${r}, ${g}, ${b})`;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  // --- Origin / Referer allowlist ---
  // "Verify-if-present": a supplied Origin/Referer must be one of our hosts;
  // if both are absent (some in-app browsers strip them) we allow through and
  // rely on rate limiting instead. See checkOrigin() for the full rationale.
  const origin = checkOrigin(req.headers ?? {});
  if (!origin.allowed) {
    res.status(403).json({ error: 'Forbidden' });
    return;
  }

  // --- Rate limiting (best-effort, in-memory) ---
  const clientIp = getClientIp(req);
  const rl = checkRateLimit(RATE_LIMIT_STORE, clientIp);
  if (rl.limited) {
    res.setHeader('Retry-After', String(rl.retryAfter));
    res.status(429).json({ error: 'Too many requests. Please try again later.' });
    return;
  }

  const {
    carrierId,
    passStyle = 'eventTicket',
    backgroundColor = '#1a1a2e',
    foregroundColor = '#ffffff',
    labelColor = '#aaaacc',
    logoText = 'Invoice Pass',
    secFields = [],           // [{ key, label, value, textAlignment }, ...]
    iconPng = null,
    auxFields = [],
    backgroundPng = null,
    thumbnailPng = null,
  } = req.body ?? {};

  const VALID_PASS_STYLES = new Set(['eventTicket', 'storeCard', 'generic']);
  const safePassStyle = VALID_PASS_STYLES.has(passStyle) ? passStyle : 'eventTicket';

  if (!carrierId || !isValidCarrier(carrierId)) {
    res.status(400).json({ error: 'Invalid carrier ID. Expected format: /XXXXXXX (8 chars starting with /)' });
    return;
  }

  if (![backgroundColor, foregroundColor, labelColor].every(isValidHexColor)) {
    res.status(400).json({ error: 'Invalid color. Expected format: #RRGGBB' });
    return;
  }

  for (const [name, value] of [['iconPng', iconPng], ['backgroundPng', backgroundPng], ['thumbnailPng', thumbnailPng]]) {
    if (value !== null && decodeImage(value) === null) {
      res.status(400).json({ error: `Invalid or oversized ${name}` });
      return;
    }
  }

  const certBase64 = process.env.PASS_CERT_BASE64;
  const keyBase64  = process.env.PASS_KEY_BASE64;
  const wwdrBase64 = process.env.APPLE_WWDR_BASE64;

  if (!certBase64 || !keyBase64 || !wwdrBase64) {
    res.status(500).json({ error: 'Server not configured: missing signing certificates' });
    return;
  }

  try {
    const signerCert = Buffer.from(certBase64, 'base64');
    const signerKey  = Buffer.from(keyBase64,  'base64');
    const wwdr       = Buffer.from(wwdrBase64,  'base64');

    const safeLogoText = String(logoText).slice(0, 20) || 'Invoice Pass';
    // organizationName is fixed to our own name — never derived from user input,
    // so a signed pass can't impersonate a third party (phishing mitigation).
    const safeOrg = 'Milifix';

    const VALID_ALIGN = new Set(['PKTextAlignmentLeft', 'PKTextAlignmentCenter', 'PKTextAlignmentRight', 'PKTextAlignmentNatural']);

    const pass = new PKPass(
      {},
      { wwdr, signerCert, signerKey },
      {
        passTypeIdentifier: PASS_TYPE_ID,
        teamIdentifier: TEAM_ID,
        serialNumber: `inv-${randomUUID()}`,
        description: '台灣統一發票載具',
        organizationName: safeOrg,
        logoText: safeLogoText,
        foregroundColor: hexToRgb(foregroundColor),
        labelColor: hexToRgb(labelColor),
        backgroundColor: hexToRgb(backgroundColor),
      },
    );

    // eventTicket / storeCard support strip.png; generic does not
    pass.type = safePassStyle;

    pass.primaryFields.push(
      { key: 'carrier', label: '載具號碼', value: carrierId },
    );

    // Secondary fields — fully user-defined (max 4)
    const safeSec = Array.isArray(secFields) ? secFields.slice(0, 4) : [];
    for (const f of safeSec) {
      if (!f?.key) continue;
      const field = {
        key: String(f.key),
        label: String(f.label ?? '').slice(0, 20),
        value: String(f.value ?? '').slice(0, 24),
      };
      if (VALID_ALIGN.has(f.textAlignment)) field.textAlignment = f.textAlignment;
      pass.secondaryFields.push(field);
    }
    // Fallback if no sec fields provided
    if (safeSec.length === 0) {
      pass.secondaryFields.push(
        { key: 'org', label: '發行單位', value: 'Milifix' },
        { key: 'invoiceType', label: '類型', value: '統一發票' },
      );
    }

    // User-defined auxiliary fields (max 4, sanitised)
    const safeAux = Array.isArray(auxFields) ? auxFields.slice(0, 4) : [];
    for (const f of safeAux) {
      if (!f?.key) continue;
      const field = {
        key: String(f.key),
        label: String(f.label ?? '').slice(0, 20),
        value: String(f.value ?? '').slice(0, 30),
      };
      if (VALID_ALIGN.has(f.textAlignment)) field.textAlignment = f.textAlignment;
      pass.auxiliaryFields.push(field);
    }

    pass.backFields.push(
      {
        key: 'mof',
        label: '財政部電子發票整合服務平台',
        value: 'https://www.einvoice.nat.gov.tw',
        attributedValue: '<a href="https://www.einvoice.nat.gov.tw">財政部電子發票整合服務平台</a>',
      },
      {
        key: 'carrier_back',
        label: '載具號碼',
        value: carrierId,
      },
    );

    pass.setBarcodes({
      message: carrierId,
      format: 'PKBarcodeFormatCode128',
      messageEncoding: 'iso-8859-1',
      altText: carrierId,
    });

    // Use client-rendered icon PNG if provided, else placeholder
    const iconBuf = iconPng ? decodeImage(iconPng) : PLACEHOLDER_PNG;
    pass.addBuffer('icon.png',    iconBuf);
    pass.addBuffer('icon@2x.png', iconBuf);
    pass.addBuffer('icon@3x.png', iconBuf);
    pass.addBuffer('logo.png',    iconBuf);
    pass.addBuffer('logo@2x.png', iconBuf);
    pass.addBuffer('logo@3x.png', iconBuf);

    // Background image (optional, user-uploaded) — covers the whole card
    // Not supported on generic passes
    if (backgroundPng && safePassStyle !== 'generic') {
      const bgBuf = decodeImage(backgroundPng);
      pass.addBuffer('background.png',    bgBuf);
      pass.addBuffer('background@2x.png', bgBuf);
      pass.addBuffer('background@3x.png', bgBuf);
    }

    // Thumbnail image (optional, user-uploaded) — shown on the right side
    // Supported on generic and storeCard passes
    if (thumbnailPng && safePassStyle !== 'eventTicket') {
      const thumbBuf = decodeImage(thumbnailPng);
      pass.addBuffer('thumbnail.png',    thumbBuf);
      pass.addBuffer('thumbnail@2x.png', thumbBuf);
      pass.addBuffer('thumbnail@3x.png', thumbBuf);
    }

    const pkpassBuffer = await pass.getAsBuffer();

    res.setHeader('Content-Type', 'application/vnd.apple.pkpass');
    res.setHeader('Content-Disposition', 'attachment; filename="invoice-pass.pkpass"');
    res.setHeader('Content-Length', pkpassBuffer.length);
    res.status(200).send(pkpassBuffer);
  } catch (err) {
    // Log full detail server-side only; never leak internals to the client.
    console.error('[generate-pass]', err);
    res.status(500).json({ error: 'Failed to generate pass' });
  }
}
