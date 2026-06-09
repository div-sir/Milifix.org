// @ts-check
import { PKPass } from 'passkit-generator';
import forge from 'node-forge';

const PASS_TYPE_ID = 'pass.com.milifix.invoice';
const TEAM_ID = process.env.APPLE_TEAM_ID ?? '3DX9A7VF2X';

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

/**
 * Extract PEM cert and PEM key from a P12 Buffer
 * @param {Buffer} p12Buf
 * @param {string} password
 * @returns {{ certPem: string, keyPem: string }}
 */
function extractFromP12(p12Buf, password) {
  const p12Der = forge.util.createBuffer(p12Buf.toString('binary'));
  const p12Asn1 = forge.asn1.fromDer(p12Der);
  const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, false, password);

  let certPem = '';
  let keyPem = '';

  for (const safeContent of p12.safeContents) {
    for (const safeBag of safeContent.safeBags) {
      if (safeBag.type === forge.pki.oids.certBag && safeBag.cert) {
        certPem = forge.pki.certificateToPem(safeBag.cert);
      }
      if (safeBag.type === forge.pki.oids.pkcs8ShroudedKeyBag && safeBag.key) {
        keyPem = forge.pki.privateKeyToPem(safeBag.key);
      }
    }
  }

  if (!certPem || !keyPem) {
    throw new Error('Could not extract certificate or private key from P12');
  }

  return { certPem, keyPem };
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

  const p12Base64 = process.env.PASS_P12_BASE64;
  const p12Password = process.env.PASS_P12_PASSWORD ?? '';
  const wwdrBase64 = process.env.APPLE_WWDR_BASE64;

  if (!p12Base64 || !wwdrBase64) {
    res.status(500).json({ error: 'Server not configured: missing signing certificates' });
    return;
  }

  try {
    const p12Buf = Buffer.from(p12Base64, 'base64');
    const wwdrBuf = Buffer.from(wwdrBase64, 'base64');

    // Extract PEM cert + key from P12
    const { certPem, keyPem } = extractFromP12(p12Buf, p12Password);

    const { readFileSync } = await import('node:fs');
    const { fileURLToPath } = await import('node:url');
    const { join, dirname } = await import('node:path');

    const __dir = dirname(fileURLToPath(import.meta.url));
    const assetsDir = join(__dir, '../pass-assets');

    const icon   = readFileSync(join(assetsDir, 'icon.png'));
    const icon2x = readFileSync(join(assetsDir, 'icon@2x.png'));
    const logo   = readFileSync(join(assetsDir, 'logo.png'));
    const logo2x = readFileSync(join(assetsDir, 'logo@2x.png'));

    const pass = new PKPass(
      {},
      {
        wwdr: wwdrBuf,
        signerCert: Buffer.from(certPem),
        signerKey: Buffer.from(keyPem),
        signerKeyPassphrase: '',
      },
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
        generic: {
          primaryFields: [
            { key: 'carrier', label: '載具號碼', value: carrierId },
          ],
          secondaryFields: [
            { key: 'org',  label: '發行單位', value: 'Milifix' },
            { key: 'type', label: '類型',     value: '統一發票' },
          ],
        },
        barcodes: [
          {
            message: carrierId,
            format: 'PKBarcodeFormatCode39',
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
    res.setHeader('Content-Disposition', `attachment; filename="invoice-pass.pkpass"`);
    res.setHeader('Content-Length', pkpassBuffer.length);
    res.status(200).send(pkpassBuffer);
  } catch (err) {
    console.error('[generate-pass]', err);
    res.status(500).json({ error: 'Failed to generate pass', detail: err?.message });
  }
}
