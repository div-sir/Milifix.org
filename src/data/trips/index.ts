/**
 * 旅行報告書 registry。
 * 新增報告書：建立資料檔後在此 import 並加入 tripReports。
 */
import type { TripReport } from './types';
import { japanJrPass2026 } from './japan-jr-pass-2026';

export const tripReports: TripReport[] = [japanJrPass2026];

export function getTripReport(slug: string): TripReport | undefined {
  return tripReports.find((t) => t.slug === slug);
}

export * from './types';
