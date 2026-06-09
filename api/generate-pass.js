// @ts-check
import { PKPass } from 'passkit-generator';

// Minimal 1x1 PNG embedded — no filesystem dependency on Vercel
const PLACEHOLDER_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADElEQVQI12NgYGAAAAAEAAFmJ72TAAAAAElFTkSuQmCC',
  'base64'
);

const PASS_TYPE_ID = 'pass.com.milifix.invoice';
const TEAM_ID = process.env.APPLE_TEAM_ID ?? 'UZJ42KP5ND';

/**
 * 手機條碼載具：/ 開頭 + 7 個大寫英數或 +-. 等特殊符號，共 8 碼
 * @param {string} id
 */
function isValidCarrier(id) {
  return /^\/[A-Z0-9+\-.]{7}$/.test(id);
}

/**
 * Convert #rrggbb hex to "rgb(r, g, b)" string for pass.json
 * @param {string} hex
 */
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
  } = req.body ?? {};

  if (!carrierId || !isValidCarrier(carrierId)) {
    res.status(400).json({ error: 'Invalid carrier ID. Expected format: /XXXXXXX (8 chars starting with /)' });
    return;
  }

  // Cert and key are PEM, stored as base64 in ENV
  // Generate with:
  //   openssl pkcs12 -in Cert.p12 -clcerts -nokeys -passin pass:PW | base64  → PASS_CERT_BASE64
  //   openssl pkcs12 -in Cert.p12 -nocerts -nodes  -passin pass:PW | base64  → PASS_KEY_BASE64
  //   base64 AppleWWDRCAG4.cer → APPLE_WWDR_BASE64
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

    const pass = new PKPass(
      {},
      { wwdr, signerCert, signerKey },
      {
        passTypeIdentifier: PASS_TYPE_ID,
        teamIdentifier: TEAM_ID,
        serialNumber: `inv-${Date.now()}`,
        description: '台灣統一發票載具',
        organizationName: 'Milifix',
        logoText: 'Invoice Pass',
        foregroundColor: hexToRgb(foregroundColor),
        labelColor: hexToRgb(labelColor),
        backgroundColor: hexToRgb(backgroundColor),
      },
    );

    // passkit-generator v5: type must be set via setter, then fields via methods
    pass.type = 'generic';

    pass.primaryFields.push(
      { key: 'carrier', label: '載具號碼', value: carrierId },
    );
    pass.secondaryFields.push(
      { key: 'org',          label: '發行單位', value: 'Milifix' },
      { key: 'invoiceType',  label: '類型',     value: '統一發票' },
    );

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

    pass.addBuffer('icon.png',    PLACEHOLDER_PNG);
    pass.addBuffer('icon@2x.png', PLACEHOLDER_PNG);
    pass.addBuffer('logo.png',    PLACEHOLDER_PNG);
    pass.addBuffer('logo@2x.png', PLACEHOLDER_PNG);

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
