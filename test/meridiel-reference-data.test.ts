import { afterEach, describe, expect, it, vi } from 'vitest';

describe('Meridiel reference data cache ownership', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('uses the HTTP cache, clears legacy copies, and fetches each snapshot once per page', async () => {
    const getItem = vi.fn(() => { throw new Error('reference data must not be read from localStorage'); });
    const setItem = vi.fn(() => { throw new Error('reference data must not be written to localStorage'); });
    const removeItem = vi.fn();
    const fetchMock = vi.fn((input: string | URL | Request) => {
      const url = String(input);
      const body = url.includes('airports')
        ? '1,"Cache Test Airport","Cache City","Taiwan","QZX","RCZZ",25,121,0,8,"U","Asia/Taipei","airport","OurAirports"\n'
        : '1,"Cache Test Air",\\N,"Q9","QZZ","CACHE","Taiwan","Y"\n';
      return Promise.resolve(new Response(body));
    });

    vi.stubGlobal('localStorage', { getItem, setItem, removeItem });
    vi.stubGlobal('requestIdleCallback', (callback: IdleRequestCallback) => {
      callback({ didTimeout: false, timeRemaining: () => 50 } as IdleDeadline);
      return 1;
    });
    vi.stubGlobal('fetch', fetchMock);

    vi.resetModules();
    const { ATLAS } = await import('../public/meridiel/app/data.js');

    await ATLAS.loadReferenceData();
    await ATLAS.loadReferenceData();

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls.map(([url]) => String(url))).toEqual([
      'data/openflights-airports.dat?v=20260716m',
      'data/openflights-airlines.dat?v=20260716m',
    ]);
    expect(getItem).not.toHaveBeenCalled();
    expect(setItem).not.toHaveBeenCalled();
    expect(removeItem.mock.calls.map(([key]) => key)).toEqual([
      'fa-airports-db-v2',
      'fa-airlines-db-v2',
    ]);
    expect((ATLAS.AIRPORTS as Record<string, { name: string }>).QZX.name).toBe('Cache Test Airport');
    expect(ATLAS.AIRLINE_CODES.get('Q9')).toBe('Cache Test Air');
  });
});
