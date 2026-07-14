import { describe, it, expect } from 'vitest';
import {
  decodeImage,
  isAllowedHost,
  checkOrigin,
  checkRateLimit,
  isValidCarrier,
  isValidHexColor,
} from '../api/_pass-security.js';

// Minimal valid PNG: signature + IHDR chunk header with width=1, height=1.
// decodeImage only inspects the first 24 bytes (signature + length + "IHDR" + w + h),
// so we don't need a full, CRC-valid PNG for these tests.
function makePngBase64(width = 1, height = 1): string {
  const buf = Buffer.alloc(24);
  // PNG signature
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]).copy(buf, 0);
  // bytes 8-11: chunk length (unused by decodeImage, arbitrary)
  buf.writeUInt32BE(13, 8);
  // bytes 12-15: "IHDR"
  buf.write('IHDR', 12, 'ascii');
  buf.writeUInt32BE(width, 16);
  buf.writeUInt32BE(height, 20);
  return buf.toString('base64');
}

function makeJpegBase64(): string {
  // JPEG magic bytes (FF D8 FF), padded out to be long enough to pass the
  // length check but fail the PNG signature check.
  const buf = Buffer.alloc(24);
  Buffer.from([0xff, 0xd8, 0xff, 0xe0]).copy(buf, 0);
  return buf.toString('base64');
}

describe('decodeImage', () => {
  it('accepts a real PNG (magic bytes + IHDR)', () => {
    const b64 = makePngBase64(100, 50);
    const result = decodeImage(b64);
    expect(result).not.toBeNull();
    expect(Buffer.isBuffer(result)).toBe(true);
  });

  it('rejects a JPEG masquerading as base64', () => {
    expect(decodeImage(makeJpegBase64())).toBeNull();
  });

  it('rejects garbage base64 (invalid characters)', () => {
    expect(decodeImage('not-valid-base64!!! ###')).toBeNull();
  });

  it('rejects an empty string', () => {
    expect(decodeImage('')).toBeNull();
  });

  it('rejects null / non-string values', () => {
    expect(decodeImage(null)).toBeNull();
    expect(decodeImage(undefined)).toBeNull();
  });

  it('rejects an oversized payload', () => {
    const huge = 'A'.repeat(1_500_001);
    expect(decodeImage(huge)).toBeNull();
  });

  it('rejects a PNG whose dimensions exceed the max', () => {
    expect(decodeImage(makePngBase64(3000, 3000))).toBeNull();
  });
});

describe('isAllowedHost', () => {
  it('allows the apex domain', () => {
    expect(isAllowedHost('milifix.com')).toBe(true);
  });

  it('allows subdomains of the apex', () => {
    expect(isAllowedHost('www.milifix.com')).toBe(true);
  });

  it('rejects a lookalike host with the apex as a prefix', () => {
    expect(isAllowedHost('milifix.com.evil.com')).toBe(false);
  });

  it('rejects an unrelated host', () => {
    expect(isAllowedHost('evil.com')).toBe(false);
  });

  it('allows localhost for dev', () => {
    expect(isAllowedHost('localhost')).toBe(true);
  });
});

describe('checkOrigin', () => {
  it('allows a request whose Origin is our own domain', () => {
    const result = checkOrigin({ origin: 'https://milifix.com' });
    expect(result.allowed).toBe(true);
    expect(result.present).toBe(true);
  });

  it('rejects a request whose Origin is a lookalike domain', () => {
    const result = checkOrigin({ origin: 'https://milifix.com.evil.com' });
    expect(result.allowed).toBe(false);
  });

  it('allows an in-app request without Origin only when the first-party marker is present', () => {
    const result = checkOrigin({ 'x-milifix-request': '1' });
    expect(result.allowed).toBe(true);
    expect(result.present).toBe(false);
    expect(result.host).toBeNull();
  });

  it('rejects a header-less request without the first-party marker', () => {
    expect(checkOrigin({}).allowed).toBe(false);
  });

  it('only allows the exact Vercel deployment hosts supplied by the environment', () => {
    const env = {
      NODE_ENV: 'production',
      VERCEL_URL: 'milifix-org-git-main-soliliums-projects.vercel.app',
    } as NodeJS.ProcessEnv;
    expect(isAllowedHost('milifix-org-git-main-soliliums-projects.vercel.app', env)).toBe(true);
    expect(isAllowedHost('attacker.vercel.app', env)).toBe(false);
  });
});

describe('checkRateLimit', () => {
  it('allows requests under the per-minute limit', () => {
    const store = new Map<string, number[]>();
    const now = Date.now();
    const result = checkRateLimit(store, '1.2.3.4', now);
    expect(result.limited).toBe(false);
  });

  it('limits requests once the per-minute cap is exceeded', () => {
    const store = new Map<string, number[]>();
    const now = Date.now();
    let last;
    for (let i = 0; i < 9; i++) {
      last = checkRateLimit(store, '5.6.7.8', now + i);
    }
    expect(last!.limited).toBe(true);
    expect(last!.retryAfter).toBeGreaterThan(0);
  });
});

describe('isValidCarrier', () => {
  it('accepts a valid 7-character carrier ID', () => {
    expect(isValidCarrier('/KPEHNLS')).toBe(true);
  });

  it('rejects a carrier ID that is too short', () => {
    expect(isValidCarrier('/KPEHN')).toBe(false);
  });

  it('rejects a carrier ID with illegal characters', () => {
    expect(isValidCarrier('/kpehnls')).toBe(false);
  });
});

describe('isValidHexColor', () => {
  it('accepts a valid 6-digit hex color', () => {
    expect(isValidHexColor('#1a1a2e')).toBe(true);
  });

  it('rejects a 3-digit shorthand hex color', () => {
    expect(isValidHexColor('#fff')).toBe(false);
  });

  it('rejects a named color', () => {
    expect(isValidHexColor('red')).toBe(false);
  });

  it('rejects a color missing the leading #', () => {
    expect(isValidHexColor('1a1a2e')).toBe(false);
  });
});
