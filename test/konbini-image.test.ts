import { describe, it, expect } from 'vitest';
import { decodeReviewImage, MAX_IMAGE_BYTES } from '../api/_konbini-image.js';

/** 用指定 magic bytes + padding 組出一個假影像 buffer 的 base64。 */
function fakeImage(magic: number[], totalLen = 64): string {
  const buf = Buffer.alloc(totalLen, 0);
  magic.forEach((b, i) => (buf[i] = b));
  return buf.toString('base64');
}

const JPEG = fakeImage([0xff, 0xd8, 0xff]);
const PNG = fakeImage([0x89, 0x50, 0x4e, 0x47]);

function fakeWebp(): string {
  const buf = Buffer.alloc(64, 0);
  buf.write('RIFF', 0, 'ascii');
  buf.write('WEBP', 8, 'ascii');
  return buf.toString('base64');
}

describe('decodeReviewImage', () => {
  it('accepts JPEG / PNG / WebP by magic bytes', () => {
    expect(decodeReviewImage(JPEG)?.contentType).toBe('image/jpeg');
    expect(decodeReviewImage(PNG)?.contentType).toBe('image/png');
    expect(decodeReviewImage(fakeWebp())?.contentType).toBe('image/webp');
  });

  it('strips a data URL prefix before decoding', () => {
    const withPrefix = `data:image/jpeg;base64,${JPEG}`;
    expect(decodeReviewImage(withPrefix)?.contentType).toBe('image/jpeg');
  });

  it('rejects non-image / unknown magic bytes', () => {
    expect(decodeReviewImage(fakeImage([0x00, 0x01, 0x02, 0x03]))).toBeNull();
    expect(decodeReviewImage(Buffer.from('hello world').toString('base64'))).toBeNull();
  });

  it('rejects empty, non-string, and non-base64 input', () => {
    expect(decodeReviewImage('')).toBeNull();
    expect(decodeReviewImage(null)).toBeNull();
    expect(decodeReviewImage('not*valid*base64!!')).toBeNull();
  });

  it('rejects an oversized image', () => {
    const big = Buffer.alloc(MAX_IMAGE_BYTES + 1000, 0);
    big[0] = 0xff; big[1] = 0xd8; big[2] = 0xff;
    expect(decodeReviewImage(big.toString('base64'))).toBeNull();
  });

  it('returns the correct file extension', () => {
    expect(decodeReviewImage(JPEG)?.ext).toBe('jpg');
    expect(decodeReviewImage(PNG)?.ext).toBe('png');
    expect(decodeReviewImage(fakeWebp())?.ext).toBe('webp');
  });
});
