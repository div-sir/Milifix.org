// @ts-check
// 投稿照片的解碼與驗證。純函式，可單元測試。底線前綴讓 Vercel builder 略過。
//
// 前端會先以 canvas 縮圖再上傳，故此處以「magic bytes 判型 + 位元組上限」把關，
// 不做完整影像解析（JPEG/WebP 尺寸解析成本高、意義有限）。

const MAX_PHOTOS = 3;
// 單張解碼後上限（前端縮圖後遠低於此；配合 Vercel 請求體上限）。
const MAX_IMAGE_BYTES = 3_500_000;
// base64 膨脹約 4/3，另含可能的 data URL 前綴，給寬鬆上限先擋超大字串。
const MAX_IMAGE_BASE64_LENGTH = Math.ceil((MAX_IMAGE_BYTES * 4) / 3) + 100;

const JPEG = [0xff, 0xd8, 0xff];
const PNG = [0x89, 0x50, 0x4e, 0x47];

/** @param {Buffer} buf @param {number[]} sig @param {number} [offset] */
function startsWith(buf, sig, offset = 0) {
  if (buf.length < offset + sig.length) return false;
  for (let i = 0; i < sig.length; i++) {
    if (buf[offset + i] !== sig[i]) return false;
  }
  return true;
}

/** WebP：位元組 0..3 = 'RIFF'，8..11 = 'WEBP' */
function isWebp(buf) {
  return (
    buf.length >= 12 &&
    buf.subarray(0, 4).toString('ascii') === 'RIFF' &&
    buf.subarray(8, 12).toString('ascii') === 'WEBP'
  );
}

/**
 * 解碼一張投稿照片。接受純 base64 或 data URL（data:image/...;base64,xxx）。
 * 回傳 { buffer, contentType, ext } 或 null（型別不符 / 過大 / 格式錯）。
 * @param {unknown} input
 */
function decodeReviewImage(input) {
  if (typeof input !== 'string' || input.length === 0) return null;

  let b64 = input;
  const m = /^data:([\w/+.-]+);base64,(.*)$/s.exec(input);
  if (m) b64 = m[2];

  if (b64.length > MAX_IMAGE_BASE64_LENGTH) return null;
  if (!/^[A-Za-z0-9+/]+=*$/.test(b64)) return null;

  const buf = Buffer.from(b64, 'base64');
  if (buf.length === 0 || buf.length > MAX_IMAGE_BYTES) return null;

  if (startsWith(buf, JPEG)) return { buffer: buf, contentType: 'image/jpeg', ext: 'jpg' };
  if (startsWith(buf, PNG)) return { buffer: buf, contentType: 'image/png', ext: 'png' };
  if (isWebp(buf)) return { buffer: buf, contentType: 'image/webp', ext: 'webp' };
  return null;
}

export { decodeReviewImage, MAX_PHOTOS, MAX_IMAGE_BYTES, MAX_IMAGE_BASE64_LENGTH };
