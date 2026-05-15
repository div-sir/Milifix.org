import type { CollectionEntry } from 'astro:content';
import type { CmsWork } from '../lib/cms';

export type WorkType = 'gallery' | 'article' | 'project';

export function inferWorkType(w: CollectionEntry<'works'> | CmsWork): WorkType {
  const workType = 'data' in w ? w.data.workType : w.workType;
  if (workType) return workType as WorkType;
  return 'project';
}
