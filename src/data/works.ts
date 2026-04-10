import type { CollectionEntry } from 'astro:content';

export type WorkType = 'gallery' | 'article' | 'project';

export function inferWorkType(w: CollectionEntry<'works'>): WorkType {
  if (w.data.workType) return w.data.workType as WorkType;
  return 'project';
}
