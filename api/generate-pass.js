// @ts-check
import { PKPass } from 'passkit-generator';

const PASS_TYPE_ID = 'pass.com.milifix.invoice';
const TEAM_ID = process.env.APPLE_TEAM_ID ?? '3DX9A7VF2X';

/**
 * Validate Taiwan invoice carrier format: /[A-Z]{2}[0-9]{14}/
 * @param {string} id
 */
function isValidCarrier(id) {
  return /^[A-Z]{2}[0-9]{14}$/.test(id);
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
    res.status(400).json({ error: 'Invalid carrier ID. Expected format: XX00000000000000' });
    return;
  }

  const p12Base64 = process.env.PASS_P12_BASE64;
  const p12Password = process.env.PASS_P12_PASSWORD ?? '';
  const wwdrBase64 = process.env.APPLE_WWDR_BASE64;

  if (!p12Base64 || !wwdrBase64) {
    res.status(500).json({ error: 'Server not configured: missing signing certificates' });
    return;
  }

  try {
    const signerCert = Buffer.from(p12Base64, 'base64');
    const wwdrCert = Buffer.from(wwdrBase64, 'base64');

    const { readFileSync } = await import('node:fs');
    const { fileURLToPath } = await import('node:url');
    const { join, dirname } = await import('node:path');

    const __dir = dirname(fileURLToPath(import.meta.url));
    const assetsDir = join(__dir, '../pass-assets');

    const icon   = readFileSync(join(assetsDir, 'icon.png'));
    const icon2x = readFileSync(join(assetsDir, 'icon@2x.png'));
    const logo   = readFileSync(join(assetsDir, 'logo.png'));
    const logo2x = readFileSync(join(assetsDir, 'logo@2x.png'));

    const pass = await PKPass.from(
      {
        certificates: {
          wwdr: wwdrCert,
          signerCert,
          signerKey: signerCert,
          signerKeyPassphrase: p12Password,
        },
      },
      {
        passTypeIdentifier: PASS_TYPE_ID,
        teamIdentifier: TEAM_ID,
        serialNumber: `inv-${carrierId}-${Date.now()}`,
        description: '台灣統一發票載具',
        organizationName: 'Milifix',
        logoText: 'Invoice Pass',
        foregroundColor: hexToRgb(foregroundColor),
        labelColor: hexToRgb(labelColor),
        backgroundColor: hexToRgb(backgroundColor),
        generic: {
          primaryFields: [
            {
              key: 'carrier',
              label: '載具號碼',
              value: carrierId,
            },
          ],
          secondaryFields: [
            {
              key: 'org',
              label: '發行單位',
              value: 'Milifix',
            },
            {
              key: 'type',
              label: '類型',
              value: '統一發票',
            },
          ],
        },
        barcodes: [
          {
            message: carrierId,
            format: 'PKBarcodeFormatQR',
            messageEncoding: 'iso-8859-1',
            altText: carrierId,
          },
        ],
      },
    );

    pass.addBuffer('icon.png', icon);
    pass.addBuffer('icon@2x.png', icon2x);
    pass.addBuffer('logo.png', logo);
    pass.addBuffer('logo@2x.png', logo2x);

    const pkpassBuffer = await pass.getAsBuffer();

    res.setHeader('Content-Type', 'application/vnd.apple.pkpass');
    res.setHeader('Content-Disposition', `attachment; filename="invoice-${carrierId}.pkpass"`);
    res.setHeader('Content-Length', pkpassBuffer.length);
    res.status(200).send(pkpassBuffer);
  } catch (err) {
    console.error('[generate-pass]', err);
    res.status(500).json({ error: 'Failed to generate pass', detail: err?.message });
  }
}
