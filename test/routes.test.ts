import { describe, it, expect } from 'vitest';
import {
  parseLocalizedPath,
  equivalentUrl,
  availableLangsForPath,
  spacePath,
  workPath,
  cardSlugPath,
  homePath,
  travelPath,
} from '../src/i18n/routes';

describe('parseLocalizedPath', () => {
  it('parses the root path as en', () => {
    expect(parseLocalizedPath('/')).toEqual({ lang: 'en', logicalPath: '/' });
  });

  it('parses /zh (no trailing slash) as zh root', () => {
    expect(parseLocalizedPath('/zh')).toEqual({ lang: 'zh', logicalPath: '/' });
  });

  it('parses /zh/ (trailing slash) as zh root', () => {
    expect(parseLocalizedPath('/zh/')).toEqual({ lang: 'zh', logicalPath: '/' });
  });

  it('parses /ja/solilium/foo as ja with nested logical path', () => {
    expect(parseLocalizedPath('/ja/solilium/foo')).toEqual({
      lang: 'ja',
      logicalPath: '/solilium/foo',
    });
  });

  it('parses /travel (no lang prefix) as en', () => {
    expect(parseLocalizedPath('/travel')).toEqual({ lang: 'en', logicalPath: '/travel' });
  });
});

describe('equivalentUrl', () => {
  it('keeps the logical path when switching en -> zh', () => {
    expect(equivalentUrl('zh', '/solilium/foo')).toBe('/zh/solilium/foo');
  });

  it('keeps the logical path when switching zh -> ja', () => {
    expect(equivalentUrl('ja', '/zh/solilium/foo')).toBe('/ja/solilium/foo');
  });

  it('keeps the logical path when switching ja -> en (prefix stripped)', () => {
    expect(equivalentUrl('en', '/ja/solilium/foo')).toBe('/solilium/foo');
  });

  it('maps the root path to the target language home path', () => {
    expect(equivalentUrl('zh', '/')).toBe(homePath('zh'));
    expect(equivalentUrl('en', '/zh/')).toBe(homePath('en'));
  });
});

describe('availableLangsForPath', () => {
  it('returns only zh for /travel', () => {
    expect(availableLangsForPath('/travel')).toEqual(['zh']);
  });

  it('returns only zh for /travel subpaths regardless of lang prefix', () => {
    expect(availableLangsForPath('/zh/travel/cards')).toEqual(['zh']);
  });

  it('returns en/zh/ja for other paths', () => {
    expect(availableLangsForPath('/solilium/foo')).toEqual(['en', 'zh', 'ja']);
    expect(availableLangsForPath('/')).toEqual(['en', 'zh', 'ja']);
  });
});

describe('path builders: en gets no prefix, zh/ja do', () => {
  it('spacePath', () => {
    expect(spacePath('en', 'solilium')).toBe('/solilium');
    expect(spacePath('zh', 'solilium')).toBe('/zh/solilium');
    expect(spacePath('ja', 'solilium')).toBe('/ja/solilium');
  });

  it('workPath', () => {
    expect(workPath('en', 'solilium', 'foo')).toBe('/solilium/foo');
    expect(workPath('zh', 'solilium', 'foo')).toBe('/zh/solilium/foo');
    expect(workPath('ja', 'solilium', 'foo')).toBe('/ja/solilium/foo');
  });

  it('cardSlugPath', () => {
    expect(cardSlugPath('en', 'my-card')).toBe('/zh/travel/cards/my-card');
    expect(cardSlugPath('zh', 'my-card')).toBe('/zh/travel/cards/my-card');
    expect(cardSlugPath('ja', 'my-card')).toBe('/zh/travel/cards/my-card');
  });

  it('travelPath', () => {
    expect(travelPath('en')).toBe('/zh/travel');
    expect(travelPath('zh')).toBe('/zh/travel');
  });
});
