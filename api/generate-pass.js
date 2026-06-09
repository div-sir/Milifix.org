// @ts-check
import { PKPass } from 'passkit-generator';

// Minimal 1x1 PNG — fallback when no icon provided
const PLACEHOLDER_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADElEQVQI12NgYGAAAAAEAAFmJ72TAAAAAElFTkSuQmCC',
  'base64'
);

const PASS_TYPE_ID = 'pass.com.milifix.invoice';
const TEAM_ID = process.env.APPLE_TEAM_ID ?? 'UZJ42KP5ND';

/** @param {string} id */
function isValidCarrier(id) {
  return /^\/[A-Z0-9+\-.]{7}$/.test(id);
}

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

  const {
    carrierId,
    backgroundColor = '#1a1a2e',
    foregroundColor = '#ffffff',
    labelColor = '#aaaacc',
    logoText = 'Invoice Pass',
    secFields = [],           // [{ key, label, value, textAlignment }, ...]
    iconPng = null,
    auxFields = [],
    backgroundPng = null,
  } = req.body ?? {};

  if (!carrierId || !isValidCarrier(carrierId)) {
    res.status(400).json({ error: 'Invalid carrier ID. Expected format: /XXXXXXX (8 chars starting with /)' });
    return;
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
    // Derive organizationName from sec1 value if provided
    const sec1Val = Array.isArray(secFields) && secFields[0]?.value ? String(secFields[0].value).trim() : '';
    const safeOrg = sec1Val.slice(0, 24) || 'Milifix';

    const VALID_ALIGN = new Set(['PKTextAlignmentLeft', 'PKTextAlignmentCenter', 'PKTextAlignmentRight', 'PKTextAlignmentNatural']);

    const pass = new PKPass(
      {},
      { wwdr, signerCert, signerKey },
      {
        passTypeIdentifier: PASS_TYPE_ID,
        teamIdentifier: TEAM_ID,
        serialNumber: `inv-${Date.now()}`,
        description: '台灣統一發票載具',
        organizationName: safeOrg,
        logoText: safeLogoText,
        foregroundColor: hexToRgb(foregroundColor),
        labelColor: hexToRgb(labelColor),
        backgroundColor: hexToRgb(backgroundColor),
      },
    );

    // eventTicket supports background.png; generic does not
    pass.type = 'eventTicket';

    pass.primaryFields.push(
      { key: 'carrier', label: '載具號碼', value: carrierId },
    );

    // Secondary fields — fully user-defined (max 2)
    const safeSec = Array.isArray(secFields) ? secFields.slice(0, 2) : [];
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

    // User-defined auxiliary fields (max 2, sanitised)
    const safeAux = Array.isArray(auxFields) ? auxFields.slice(0, 2) : [];
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
    const iconBuf = iconPng ? Buffer.from(iconPng, 'base64') : PLACEHOLDER_PNG;
    pass.addBuffer('icon.png',    iconBuf);
    pass.addBuffer('icon@2x.png', iconBuf);
    pass.addBuffer('logo.png',    iconBuf);
    pass.addBuffer('logo@2x.png', iconBuf);

    // Background image (optional, user-uploaded)
    if (backgroundPng) {
      const bgBuf = Buffer.from(backgroundPng, 'base64');
      pass.addBuffer('background.png',    bgBuf);
      pass.addBuffer('background@2x.png', bgBuf);
    }

    const pkpassBuffer = await pass.getAsBuffer();

    res.setHeader('Content-Type', 'application/vnd.apple.pkpass');
    res.setHeader('Content-Disposition', 'attachment; filename="invoice-pass.pkpass"');
    res.setHeader('Content-Length', pkpassBuffer.length);
    res.status(200).send(pkpassBuffer);
  } catch (err) {
    console.error('[generate-pass]', err);
    res.status(500).json({ error: 'Failed to generate pass', detail: err?.message });
  }
}
