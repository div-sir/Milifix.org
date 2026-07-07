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
  const RAW = [
    { date: "2016-03-12", o: "SFO", d: "JFK", airline: "United",            craft: "Boeing 737-900", seat: "14A" },
    { date: "2016-06-28", o: "SFO", d: "LHR", airline: "Virgin Atlantic",   craft: "Boeing 787-9",   seat: "8K", fav: true },
    { date: "2016-07-04", o: "LHR", d: "CDG", airline: "Air France",        craft: "Airbus A320",    seat: "3C" },
    { date: "2016-07-12", o: "CDG", d: "FCO", airline: "ITA Airways",       craft: "Airbus A321",    seat: "21F" },
    { date: "2016-07-20", o: "FCO", d: "SFO", airline: "United",            craft: "Boeing 777-200", seat: "30A" },
    { date: "2017-01-15", o: "SFO", d: "HNL", airline: "Hawaiian",          craft: "Airbus A330",    seat: "12L" },
    { date: "2017-01-22", o: "HNL", d: "SFO", airline: "Hawaiian",          craft: "Airbus A330",    seat: "12L" },
    { date: "2017-09-05", o: "SFO", d: "NRT", airline: "ANA",               craft: "Boeing 787-9",   seat: "7A", fav: true },
    { date: "2017-09-14", o: "NRT", d: "ICN", airline: "Korean Air",        craft: "Airbus A330",    seat: "33H" },
    { date: "2017-09-20", o: "ICN", d: "HKG", airline: "Cathay Pacific",    craft: "Airbus A350",    seat: "19D" },
    { date: "2017-09-27", o: "HKG", d: "SFO", airline: "Cathay Pacific",    craft: "Boeing 777-300", seat: "45K" },
    { date: "2018-05-10", o: "SFO", d: "FRA", airline: "Lufthansa",         craft: "Airbus A340",    seat: "16A" },
    { date: "2018-05-18", o: "FRA", d: "IST", airline: "Turkish Airlines",  craft: "Airbus A321",    seat: "9C" },
    { date: "2018-05-25", o: "IST", d: "DXB", airline: "Emirates",          craft: "Boeing 777",     seat: "24A" },
    { date: "2018-06-01", o: "DXB", d: "SFO", airline: "Emirates",          craft: "Airbus A380",    seat: "61A", fav: true },
    { date: "2018-11-20", o: "SFO", d: "MEX", airline: "Aeroméxico",        craft: "Boeing 737-800", seat: "11F" },
    { date: "2018-11-27", o: "MEX", d: "SFO", airline: "Aeroméxico",        craft: "Boeing 737-800", seat: "11F" },
    { date: "2019-02-14", o: "SFO", d: "SIN", airline: "Singapore Airlines",craft: "Airbus A350",    seat: "52A", fav: true },
    { date: "2019-02-22", o: "SIN", d: "BKK", airline: "Singapore Airlines",craft: "Boeing 787",     seat: "40C" },
    { date: "2019-03-01", o: "BKK", d: "DEL", airline: "Thai Airways",      craft: "Airbus A330",    seat: "27A" },
    { date: "2019-03-09", o: "DEL", d: "SFO", airline: "Air India",         craft: "Boeing 777",     seat: "34K" },
    { date: "2019-08-03", o: "SFO", d: "KEF", airline: "Icelandair",        craft: "Boeing 757",     seat: "6A" },
    { date: "2019-08-10", o: "KEF", d: "AMS", airline: "Icelandair",        craft: "Boeing 737-MAX", seat: "14F" },
    { date: "2019-08-17", o: "AMS", d: "SFO", airline: "KLM",               craft: "Boeing 777-300", seat: "20A" },
    { date: "2022-04-09", o: "SFO", d: "TPE", airline: "EVA Air",           craft: "Boeing 777-300", seat: "32A", fav: true },
    { date: "2022-04-18", o: "TPE", d: "SYD", airline: "Qantas",            craft: "Airbus A330",    seat: "44A" },
    { date: "2022-04-28", o: "SYD", d: "AKL", airline: "Air New Zealand",   craft: "Airbus A320",    seat: "8C" },
    { date: "2022-05-05", o: "AKL", d: "SFO", airline: "Air New Zealand",   craft: "Boeing 787-9",   seat: "5A" },
    { date: "2023-10-12", o: "SFO", d: "GRU", airline: "United",            craft: "Boeing 777",     seat: "28A" },
    { date: "2023-10-20", o: "GRU", d: "EZE", airline: "Aerolíneas Arg.",   craft: "Boeing 737",     seat: "12A" },
    { date: "2023-10-28", o: "EZE", d: "SFO", airline: "United",            craft: "Boeing 767",     seat: "19A" },
    { date: "2024-06-15", o: "SFO", d: "CDG", airline: "French Bee",        craft: "Airbus A350",    seat: "30K" },
    { date: "2024-06-22", o: "CDG", d: "CAI", airline: "EgyptAir",          craft: "Boeing 737-800", seat: "16A" },
    { date: "2024-06-29", o: "CAI", d: "CPT", airline: "Ethiopian",         craft: "Boeing 787",     seat: "22A", fav: true },
    { date: "2024-07-09", o: "CPT", d: "BCN", airline: "Iberia",            craft: "Airbus A330",    seat: "26A" },
    { date: "2024-07-15", o: "BCN", d: "SFO", airline: "Level",             craft: "Airbus A330",    seat: "31A" },
  ];

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

  window.ATLAS = {
    AIRPORTS, FLIGHTS, YEARS,
    statsFor, countryList, distKm, durMin,
    profile: { name: "Avery Lin", handle: "@averyflies", home: "SFO", since: 2016 },
  };
})();
