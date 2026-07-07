/* ============================================================
   MERIDIEL — Sample data + helpers (plain JS, global)
   ============================================================ */
(function () {
  // ---- Airports: code -> {name, city, country, cc, lat, lng} ----
  const AIRPORTS = {
    SFO: { city: "San Francisco", name: "San Francisco Intl", country: "United States", cc: "us", lat: 37.6213, lng: -122.3790 },
    JFK: { city: "New York",      name: "John F. Kennedy",     country: "United States", cc: "us", lat: 40.6413, lng: -73.7781 },
    HNL: { city: "Honolulu",      name: "Daniel K. Inouye",    country: "United States", cc: "us", lat: 21.3187, lng: -157.9225 },
    LHR: { city: "London",        name: "Heathrow",            country: "United Kingdom", cc: "gb", lat: 51.4700, lng: -0.4543 },
    CDG: { city: "Paris",         name: "Charles de Gaulle",   country: "France",         cc: "fr", lat: 49.0097, lng: 2.5479 },
    FCO: { city: "Rome",          name: "Fiumicino",           country: "Italy",          cc: "it", lat: 41.8003, lng: 12.2389 },
    AMS: { city: "Amsterdam",     name: "Schiphol",            country: "Netherlands",    cc: "nl", lat: 52.3105, lng: 4.7683 },
    FRA: { city: "Frankfurt",     name: "Frankfurt am Main",   country: "Germany",        cc: "de", lat: 50.0379, lng: 8.5622 },
    BCN: { city: "Barcelona",     name: "El Prat",             country: "Spain",          cc: "es", lat: 41.2974, lng: 2.0833 },
    KEF: { city: "Reykjavík",     name: "Keflavík",            country: "Iceland",        cc: "is", lat: 63.9850, lng: -22.6056 },
    IST: { city: "Istanbul",      name: "İstanbul",            country: "Türkiye",        cc: "tr", lat: 41.2753, lng: 28.7519 },
    CAI: { city: "Cairo",         name: "Cairo Intl",          country: "Egypt",          cc: "eg", lat: 30.1219, lng: 31.4056 },
    DXB: { city: "Dubai",         name: "Dubai Intl",          country: "UAE",            cc: "ae", lat: 25.2532, lng: 55.3657 },
    DEL: { city: "Delhi",         name: "Indira Gandhi",       country: "India",          cc: "in", lat: 28.5562, lng: 77.1000 },
    BKK: { city: "Bangkok",       name: "Suvarnabhumi",        country: "Thailand",       cc: "th", lat: 13.6900, lng: 100.7501 },
    SIN: { city: "Singapore",     name: "Changi",              country: "Singapore",      cc: "sg", lat: 1.3644,  lng: 103.9915 },
    HKG: { city: "Hong Kong",     name: "Hong Kong Intl",      country: "Hong Kong",      cc: "hk", lat: 22.3080, lng: 113.9185 },
    TPE: { city: "Taipei",        name: "Taoyuan",             country: "Taiwan",         cc: "tw", lat: 25.0777, lng: 121.2328 },
    NRT: { city: "Tokyo",         name: "Narita",              country: "Japan",          cc: "jp", lat: 35.7720, lng: 140.3929 },
    ICN: { city: "Seoul",         name: "Incheon",             country: "South Korea",    cc: "kr", lat: 37.4602, lng: 126.4407 },
    SYD: { city: "Sydney",        name: "Kingsford Smith",     country: "Australia",      cc: "au", lat: -33.9399, lng: 151.1753 },
    AKL: { city: "Auckland",      name: "Auckland",            country: "New Zealand",    cc: "nz", lat: -37.0082, lng: 174.7850 },
    GRU: { city: "São Paulo",     name: "Guarulhos",           country: "Brazil",         cc: "br", lat: -23.4356, lng: -46.4731 },
    EZE: { city: "Buenos Aires",  name: "Ezeiza",              country: "Argentina",      cc: "ar", lat: -34.8222, lng: -58.5358 },
    MEX: { city: "Mexico City",   name: "Benito Juárez",       country: "Mexico",         cc: "mx", lat: 19.4361, lng: -99.0719 },
    YVR: { city: "Vancouver",     name: "Vancouver Intl",      country: "Canada",         cc: "ca", lat: 49.1967, lng: -123.1815 },
    CPT: { city: "Cape Town",     name: "Cape Town Intl",      country: "South Africa",   cc: "za", lat: -33.9715, lng: 18.6021 },
  };

  // ---- Flights (chronological). dist/dur derived where dur omitted ----
  const RAW = [];  // your own flights are added in-app and saved to your browser

  // ---- Haversine (km) ----
  function distKm(a, b) {
    const R = 6371, toRad = (x) => x * Math.PI / 180;
    const dLat = toRad(b.lat - a.lat), dLng = toRad(b.lng - a.lng);
    const s = Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
    return Math.round(2 * R * Math.asin(Math.sqrt(s)));
  }
  // Rough flight time: taxi/climb overhead + cruise ~ 820 km/h
  function durMin(km) { return Math.round(35 + (km / 820) * 60); }

  const FLIGHTS = RAW.map((f, i) => {
    const A = AIRPORTS[f.o], B = AIRPORTS[f.d];
    const km = distKm(A, B);
    return {
      id: i + 1,
      ...f,
      from: { code: f.o, ...A },
      to:   { code: f.d, ...B },
      km,
      miles: Math.round(km * 0.621371),
      dur: durMin(km),
      year: +f.date.slice(0, 4),
    };
  });

  // ---- Aggregate stats ----
  function statsFor(flights) {
    const countries = new Set(), airports = new Set();
    let km = 0, min = 0;
    flights.forEach((f) => {
      km += f.km; min += f.dur;
      countries.add(f.from.country); countries.add(f.to.country);
      airports.add(f.from.code); airports.add(f.to.code);
    });
    return {
      flights: flights.length,
      miles: Math.round(km * 0.621371),
      km,
      hours: +(min / 60).toFixed(0),
      countries: countries.size,
      airports: airports.size,
      // earth circumference ~40075 km
      laps: +(km / 40075).toFixed(1),
    };
  }

  // Unique countries with a representative airport (for flag wall)
  function countryList(flights) {
    const map = new Map();
    flights.forEach((f) => {
      [f.from, f.to].forEach((p) => {
        if (!map.has(p.country)) map.set(p.country, { country: p.country, cc: p.cc, city: p.city, first: f.date });
      });
    });
    return [...map.values()].sort((a, b) => a.country.localeCompare(b.country));
  }

  const YEARS = [...new Set(FLIGHTS.map((f) => f.year))].sort();

  // Derive identity from the actual flights instead of hard-coded demo values.
  function sinceOf(flights) {
    return flights.length ? Math.min(...flights.map((f) => f.year)) : new Date().getFullYear();
  }
  function homeOf(flights) {
    if (!flights.length) return "—";
    const count = {};
    flights.forEach((f) => { count[f.o] = (count[f.o] || 0) + 1; });
    return Object.keys(count).sort((a, b) => count[b] - count[a])[0];
  }

  window.ATLAS = {
    AIRPORTS, FLIGHTS, YEARS,
    statsFor, countryList, distKm, durMin, sinceOf, homeOf,
    // name/handle fall back to these only when not signed in; a Google login overrides them.
    profile: { name: "Traveler", handle: "@traveler", home: "—", since: new Date().getFullYear() },
  };
})();
