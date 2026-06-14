import type { CmsWork } from '../lib/cms';

export type WorkType = 'gallery' | 'article' | 'project';

export function inferWorkType(w: CmsWork): WorkType {
  return w.workType ?? 'project';
}
