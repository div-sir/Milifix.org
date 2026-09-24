import { describe, expect, it } from 'vitest';
import { extractFlightsFromText, parseBoardingPass } from '../public/meridiel/app/text-import.js';
import { analyzeDrafts } from '../public/meridiel/app/csv-import.js';

const airports = Object.fromEntries(['TPE', 'NRT', 'HND', 'KIX', 'BKK', 'SIN', 'LHR'].map((c) => [c, { city: c }]));
const airlines = new Map([['CI', 'China Airlines'], ['BR', 'EVA Air'], ['JL', 'Japan Airlines'], ['TG', 'Thai Airways']]);
const today = '2026-09-24';
const opts = { airports, airlines, today };

// Build a single-leg BCBP string with the mandatory fixed-width fields.
function bcbp({ from, to, carrier, flight, day, seat }: Record<string, string>) {
  return 'M1' + 'DOE/JANE'.padEnd(20) + 'E' + 'ABC123'.padEnd(7) + from + to + carrier.padEnd(3)
    + flight.padStart(4, '0').padEnd(5) + day.padStart(3, '0') + 'Y' + seat.padStart(4, '0') + '0012 ' + '1' + '00';
}

describe('boarding pass barcodes', () => {
  it('reads route, flight, seat and resolves the day-of-year to a date', () => {
    const [draft] = parseBoardingPass(bcbp({ from: 'TPE', to: 'NRT', carrier: 'CI', flight: '100', day: '74', seat: '14A' }), { airlines, today });
    expect(draft).toEqual({ date: '2026-03-15', o: 'TPE', d: 'NRT', airline: 'China Airlines', flightNo: 'CI 100', seat: '14A' });
  });

  it('puts a day later in the year than today into last year', () => {
    const [draft] = parseBoardingPass(bcbp({ from: 'TPE', to: 'NRT', carrier: 'BR', flight: '198', day: '360', seat: '3K' }), { airlines, today });
    expect(draft.date).toBe('2025-12-26');
  });

  it('ignores text that is not a boarding pass', () => {
    expect(parseBoardingPass('hello', { today })).toEqual([]);
  });
});

describe('pasted booking text', () => {
  it('finds legs in an English confirmation email', () => {
    const text = `Your trip is confirmed!
      Fri, 14 Mar 2025   CI 100   Taipei TPE → Tokyo NRT   08:10 – 12:30
      Thu, 20 Mar 2025   JL 97    Tokyo HND → Taipei TPE   09:00 – 11:40`;
    const drafts = extractFlightsFromText(text, opts);
    expect(drafts).toEqual([
      { date: '2025-03-14', o: 'TPE', d: 'NRT', airline: 'China Airlines', flightNo: 'CI 100' },
      { date: '2025-03-20', o: 'HND', d: 'TPE', airline: 'Japan Airlines', flightNo: 'JL 97' },
    ]);
  });

  it('reads Chinese itineraries with parenthesised codes', () => {
    const text = '去程 2025年3月14日 長榮航空 BR198 台北 (TPE) 出發 → 東京成田 (NRT) 抵達\n回程 2025/3/20 BR197 東京成田 (NRT) → 台北 (TPE)';
    const drafts = extractFlightsFromText(text, opts);
    expect(drafts.map((d) => [d.date, d.o, d.d, d.flightNo])).toEqual([
      ['2025-03-14', 'TPE', 'NRT', 'BR 198'],
      ['2025-03-20', 'NRT', 'TPE', 'BR 197'],
    ]);
  });

  it('fills a missing year from the other dates and chains connections', () => {
    const drafts = extractFlightsFromText('2024-12-30 TG 635 TPE-BKK\n12月31日 BKK-SIN-LHR', opts);
    expect(drafts.map((d) => [d.date, d.o, d.d])).toEqual([
      ['2024-12-30', 'TPE', 'BKK'],
      ['2024-12-31', 'BKK', 'SIN'],
      ['2024-12-31', 'SIN', 'LHR'],
    ]);
  });

  it('recognises a pasted barcode string', () => {
    const drafts = extractFlightsFromText(bcbp({ from: 'KIX', to: 'TPE', carrier: 'CI', flight: '153', day: '200', seat: '30C' }), opts);
    expect(drafts[0]).toMatchObject({ o: 'KIX', d: 'TPE', flightNo: 'CI 153', date: '2026-07-19' });
  });

  it('returns nothing when no route is present', () => {
    expect(extractFlightsFromText('Thanks for booking! Total USD 420', opts)).toEqual([]);
  });

  it('feeds the shared validator, flagging legs without a date', () => {
    const drafts = extractFlightsFromText('CI 100 TPE → NRT', opts);
    const result = analyzeDrafts(drafts.map((raw, i) => ({ line: i + 1, raw })), { airports, today });
    expect(result.rows[0].issues[0].code).toBe('err.missingDate');
  });
});
