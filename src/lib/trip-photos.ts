import type { PhotoSlot } from '../data/trips/types';

/**
 * 行程照片的路徑解析。
 *
 * 照片放在 `src/assets/trips/<trip-slug>/<檔名>`，`PhotoSlot.src` 只寫相對於
 * `src/assets/trips/` 的路徑（如 `japan-jr-pass-2026/day1-enoshima.jpg`）。
 * 這裡用 import.meta.glob 在建置期把它換成 astro:assets 的 ImageMetadata，
 * 交給 <Image> 產生 WebP／AVIF 與 responsive srcset。
 *
 * 為什麼不直接放 public/：`public/` 的檔案會原封不動輸出，astro:assets 不會
 * 處理，等於沒有最佳化——對以攝影為主的內容差別很大。
 *
 * 仍然接受外部網址（http/https）與站內絕對路徑（/foo.jpg）：這兩種無法在建置期
 * 最佳化，會退回原生 <img>。遠端圖刻意不走 <Image>——astro:assets 抓不到遠端圖
 * 時會直接讓整個 build 失敗，而本站的資料層是「CMS 連不到就回空陣列繼續 build」，
 * 兩者相衝突。
 */

const TRIP_PHOTOS = import.meta.glob<{ default: ImageMetadata }>(
  '/src/assets/trips/**/*.{jpg,jpeg,png,webp,avif}',
  { eager: true }
);

/** 建置期可最佳化的本地圖 */
export type LocalTripPhoto = { kind: 'local'; image: ImageMetadata };
/** 無法最佳化，直接輸出 <img src> */
export type RawTripPhoto = { kind: 'raw'; src: string };
/** 沒有填 src，渲染佔位框 */
export type EmptyTripPhoto = { kind: 'empty' };

export type ResolvedTripPhoto = LocalTripPhoto | RawTripPhoto | EmptyTripPhoto;

const isExternal = (src: string): boolean => /^(https?:)?\/\//.test(src) || src.startsWith('/');

/** 供錯誤訊息使用：列出目前實際存在的照片鍵值 */
export function availableTripPhotoKeys(): string[] {
  return Object.keys(TRIP_PHOTOS)
    .map((p) => p.replace('/src/assets/trips/', ''))
    .sort();
}

export function resolveTripPhoto(src: string | undefined): ResolvedTripPhoto {
  const raw = src?.trim();
  if (!raw) return { kind: 'empty' };
  if (isExternal(raw)) return { kind: 'raw', src: raw };

  const key = `/src/assets/trips/${raw.replace(/^\/+/, '')}`;
  const mod = TRIP_PHOTOS[key];
  if (mod) return { kind: 'local', image: mod.default };

  // 寫了相對路徑卻找不到檔案：多半是檔名打錯或忘了把檔案加進 repo。
  // 這種情況不該安靜地退成壞掉的 <img>，直接讓 build 失敗並指出可用的鍵值。
  throw new Error(
    `[trip-photos] 找不到照片 "${raw}"（預期位置 src/assets/trips/${raw}）。\n` +
      `外部網址請寫完整 https:// 開頭。目前 src/assets/trips/ 底下有：\n` +
      (availableTripPhotoKeys().map((k) => `  - ${k}`).join('\n') || '  （空的）')
  );
}

/** 給客戶端腳本用的字串網址（沈浸式 HUD 由 JS 換圖，拿不到 ImageMetadata 物件）。 */
export function tripPhotoUrl(src: string | undefined): string {
  const resolved = resolveTripPhoto(src);
  if (resolved.kind === 'local') return resolved.image.src;
  if (resolved.kind === 'raw') return resolved.src;
  return '';
}

/** PhotoSlot 的 alt：優先 alt，其次 caption，皆無則視為裝飾性圖片。 */
export function tripPhotoAlt(photo: PhotoSlot): string {
  return photo.alt ?? photo.caption ?? '';
}
