import { describe, expect, it } from 'vitest';
import { analyzeCsv, CSV_TEMPLATE, normalizeDate, parseCsv } from '../public/meridiel/app/csv-import.js';

const airports = {
  TPE: { city: 'Taipei' },
  NRT: { city: 'Tokyo' },
  HND: { city: 'Tokyo' },
  KIX: { city: 'Osaka' },
};
const today = '2026-09-24';

describe('Meridiel CSV parsing', () => {
  it('handles quotes, escaped quotes, CRLF, BOM and newlines inside quotes', () => {
    const rows = parseCsv('﻿date,notes\r\n2025-01-02,"hello, ""world"""\r\n2025-01-03,"two\nlines"\r\n');
    expect(rows.map((r) => r.cells)).toEqual([
      ['date', 'notes'],
      ['2025-01-02', 'hello, "world"'],
      ['2025-01-03', 'two\nlines'],
    ]);
    expect(rows.map((r) => r.line)).toEqual([1, 2, 3]);
  });

  it('detects semicolon and tab delimiters', () => {
    expect(parseCsv('date;from;to\n2025-01-02;TPE;NRT')[1].cells).toEqual(['2025-01-02', 'TPE', 'NRT']);
    expect(parseCsv('date\tfrom\tto\n2025-01-02\tTPE\tNRT')[1].cells).toEqual(['2025-01-02', 'TPE', 'NRT']);
  });

  it('only accepts real calendar dates', () => {
    expect(normalizeDate('2025/3/4')).toBe('2025-03-04');
    expect(normalizeDate('2024-02-29')).toBe('2024-02-29');
    expect(normalizeDate('2025-02-29')).toBeNull();
    expect(normalizeDate('14/03/2025')).toBeNull();
    expect(normalizeDate('')).toBeNull();
  });
});

describe('Meridiel CSV import analysis', () => {
  it('imports every row of a valid file', () => {
    const result = analyzeCsv('date,from,to,airline\n2025-03-14,tpe,nrt,EVA Air\n2025-03-20,NRT,TPE,', { airports, today });
    expect(result.fatal).toBeNull();
    expect(result.counts).toEqual({ ok: 2, warning: 0, rejected: 0, duplicate: 0 });
    expect(result.flights[0]).toMatchObject({ date: '2025-03-14', o: 'TPE', d: 'NRT', airline: 'EVA Air' });
  });

  it('accepts the downloadable template', () => {
    const result = analyzeCsv(CSV_TEMPLATE, { airports, today });
    expect(result.counts.ok).toBe(2);
  });

  it('accepts Chinese and Japanese headers', () => {
    expect(analyzeCsv('日期,出發,抵達\n2025-01-01,TPE,KIX', { airports, today }).counts.ok).toBe(1);
    expect(analyzeCsv('日付,出発,到着\n2025-01-01,HND,TPE', { airports, today }).counts.ok).toBe(1);
  });

  it('reports partial errors per line without dropping the good rows', () => {
    const csv = [
      'date,from,to,flight_no',
      '2025-01-01,TPE,NRT,CI 100',
      '2025-13-01,TPE,NRT,',
      '2025-01-02,XXX,NRT,',
      '2025-01-03,TPE,TPE,',
      '2030-01-01,TPE,HND,',
      '2025-01-01,TPE,NRT,CI100',
    ].join('\n');
    const result = analyzeCsv(csv, { airports, today });
    expect(result.counts).toEqual({ ok: 1, warning: 1, rejected: 3, duplicate: 1 });
    expect(result.flights).toHaveLength(2);
    const byLine = Object.fromEntries(result.rows.map((r) => [r.line, r]));
    expect(byLine[3].issues[0].code).toBe('err.badDate');
    expect(byLine[4].issues[0]).toEqual({ code: 'err.unknownAirport', params: { value: 'XXX' } });
    expect(byLine[5].issues[0].code).toBe('err.sameAirport');
    expect(byLine[6].issues[0].code).toBe('warn.futureDate');
    expect(byLine[7].issues[0]).toEqual({ code: 'dup.inFile', params: { line: 2 } });
  });

  it('skips flights already in the log', () => {
    const existing = [{ date: '2025-01-01', o: 'TPE', d: 'NRT', flightNo: '' }];
    const result = analyzeCsv('date,from,to\n2025-01-01,TPE,NRT\n2025-01-02,TPE,NRT', { airports, existing, today });
    expect(result.counts).toMatchObject({ ok: 1, duplicate: 1 });
    expect(result.rows[0].issues[0].code).toBe('dup.existing');
  });

  it('rejects a whole file that is unusable', () => {
    expect(analyzeCsv('', { airports, today }).fatal?.code).toBe('err.empty');
    expect(analyzeCsv('date,from,to\n', { airports, today }).fatal?.code).toBe('err.empty');
    expect(analyzeCsv('when,origin\n2025-01-01,TPE', { airports, today }).fatal).toEqual({
      code: 'err.noHeader',
      params: { columns: 'date, to' },
    });
    const result = analyzeCsv('hello world', { airports, today });
    expect(result.fatal?.code).toBe('err.noHeader');
    expect(result.flights).toEqual([]);
  });

  it('truncates oversized optional fields with a warning', () => {
    const result = analyzeCsv(`date,from,to,notes\n2025-01-01,TPE,NRT,${'x'.repeat(600)}`, { airports, today });
    expect(result.counts.warning).toBe(1);
    expect(result.flights[0].notes).toHaveLength(500);
  });
});
