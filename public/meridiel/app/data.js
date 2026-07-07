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

    // ---- United States / Canada ----
    LAX: { city: "Los Angeles",   name: "Los Angeles Intl",    country: "United States", cc: "us", lat: 33.9416, lng: -118.4085 },
    ORD: { city: "Chicago",       name: "O'Hare Intl",         country: "United States", cc: "us", lat: 41.9742, lng: -87.9073 },
    ATL: { city: "Atlanta",       name: "Hartsfield–Jackson",  country: "United States", cc: "us", lat: 33.6407, lng: -84.4277 },
    DFW: { city: "Dallas",        name: "Dallas/Fort Worth",   country: "United States", cc: "us", lat: 32.8998, lng: -97.0403 },
    DEN: { city: "Denver",        name: "Denver Intl",         country: "United States", cc: "us", lat: 39.8561, lng: -104.6737 },
    SEA: { city: "Seattle",       name: "Seattle–Tacoma Intl", country: "United States", cc: "us", lat: 47.4502, lng: -122.3088 },
    MIA: { city: "Miami",         name: "Miami Intl",          country: "United States", cc: "us", lat: 25.7959, lng: -80.2870 },
    BOS: { city: "Boston",        name: "Logan Intl",          country: "United States", cc: "us", lat: 42.3656, lng: -71.0096 },
    IAD: { city: "Washington",    name: "Dulles Intl",         country: "United States", cc: "us", lat: 38.9531, lng: -77.4565 },
    DCA: { city: "Washington",    name: "Reagan National",     country: "United States", cc: "us", lat: 38.8512, lng: -77.0402 },
    PHX: { city: "Phoenix",       name: "Sky Harbor Intl",     country: "United States", cc: "us", lat: 33.4352, lng: -112.0101 },
    LAS: { city: "Las Vegas",     name: "Harry Reid Intl",     country: "United States", cc: "us", lat: 36.0840, lng: -115.1537 },
    IAH: { city: "Houston",       name: "George Bush Intercontinental", country: "United States", cc: "us", lat: 29.9902, lng: -95.3368 },
    MCO: { city: "Orlando",       name: "Orlando Intl",        country: "United States", cc: "us", lat: 28.4312, lng: -81.3081 },
    EWR: { city: "Newark",        name: "Newark Liberty",      country: "United States", cc: "us", lat: 40.6895, lng: -74.1745 },
    DTW: { city: "Detroit",       name: "Detroit Metro",       country: "United States", cc: "us", lat: 42.2124, lng: -83.3534 },
    MSP: { city: "Minneapolis",   name: "Minneapolis–St Paul", country: "United States", cc: "us", lat: 44.8848, lng: -93.2223 },
    PHL: { city: "Philadelphia",  name: "Philadelphia Intl",   country: "United States", cc: "us", lat: 39.8744, lng: -75.2424 },
    CLT: { city: "Charlotte",     name: "Charlotte Douglas",   country: "United States", cc: "us", lat: 35.2144, lng: -80.9473 },
    SAN: { city: "San Diego",     name: "San Diego Intl",      country: "United States", cc: "us", lat: 32.7338, lng: -117.1933 },
    PDX: { city: "Portland",      name: "Portland Intl",       country: "United States", cc: "us", lat: 45.5898, lng: -122.5951 },
    AUS: { city: "Austin",        name: "Austin–Bergstrom",    country: "United States", cc: "us", lat: 30.1975, lng: -97.6664 },
    SLC: { city: "Salt Lake City",name: "Salt Lake City Intl", country: "United States", cc: "us", lat: 40.7899, lng: -111.9791 },
    YYZ: { city: "Toronto",       name: "Toronto Pearson",     country: "Canada",        cc: "ca", lat: 43.6777, lng: -79.6248 },
    YUL: { city: "Montreal",      name: "Montréal–Trudeau",    country: "Canada",        cc: "ca", lat: 45.4706, lng: -73.7408 },
    YYC: { city: "Calgary",       name: "Calgary Intl",        country: "Canada",        cc: "ca", lat: 51.1315, lng: -114.0106 },
    YOW: { city: "Ottawa",        name: "Macdonald–Cartier",   country: "Canada",        cc: "ca", lat: 45.3225, lng: -75.6692 },

    // ---- Mexico / Caribbean / Central America ----
    CUN: { city: "Cancún",        name: "Cancún Intl",         country: "Mexico",             cc: "mx", lat: 21.0365, lng: -86.8771 },
    HAV: { city: "Havana",        name: "José Martí Intl",     country: "Cuba",               cc: "cu", lat: 22.9892, lng: -82.4091 },
    SJU: { city: "San Juan",      name: "Luis Muñoz Marín",    country: "Puerto Rico",        cc: "pr", lat: 18.4394, lng: -66.0018 },
    NAS: { city: "Nassau",        name: "Lynden Pindling Intl",country: "Bahamas",            cc: "bs", lat: 25.0389, lng: -77.4661 },
    PUJ: { city: "Punta Cana",    name: "Punta Cana Intl",     country: "Dominican Republic", cc: "do", lat: 18.5674, lng: -68.3634 },
    PTY: { city: "Panama City",   name: "Tocumen Intl",        country: "Panama",             cc: "pa", lat: 9.0714,  lng: -79.3835 },

    // ---- South America ----
    BOG: { city: "Bogotá",        name: "El Dorado Intl",      country: "Colombia",  cc: "co", lat: 4.7016,   lng: -74.1469 },
    LIM: { city: "Lima",          name: "Jorge Chávez Intl",   country: "Peru",      cc: "pe", lat: -12.0219, lng: -77.1143 },
    SCL: { city: "Santiago",      name: "Arturo Merino Benítez", country: "Chile",  cc: "cl", lat: -33.3930, lng: -70.7858 },
    UIO: { city: "Quito",         name: "Mariscal Sucre Intl", country: "Ecuador",   cc: "ec", lat: -0.1292,  lng: -78.3575 },
    CCS: { city: "Caracas",       name: "Simón Bolívar Intl",  country: "Venezuela", cc: "ve", lat: 10.6013,  lng: -66.9910 },
    GIG: { city: "Rio de Janeiro",name: "Galeão Intl",         country: "Brazil",    cc: "br", lat: -22.8090, lng: -43.2436 },
    MVD: { city: "Montevideo",    name: "Carrasco Intl",       country: "Uruguay",   cc: "uy", lat: -34.8384, lng: -56.0308 },
    ASU: { city: "Asunción",      name: "Silvio Pettirossi",   country: "Paraguay",  cc: "py", lat: -25.2400, lng: -57.5200 },

    // ---- Europe ----
    MAD: { city: "Madrid",        name: "Adolfo Suárez Barajas", country: "Spain",       cc: "es", lat: 40.4983, lng: -3.5676 },
    LIS: { city: "Lisbon",        name: "Humberto Delgado",    country: "Portugal",     cc: "pt", lat: 38.7813, lng: -9.1359 },
    OPO: { city: "Porto",         name: "Francisco Sá Carneiro", country: "Portugal",   cc: "pt", lat: 41.2481, lng: -8.6814 },
    MUC: { city: "Munich",        name: "Franz Josef Strauss", country: "Germany",      cc: "de", lat: 48.3538, lng: 11.7861 },
    ZRH: { city: "Zurich",        name: "Zurich Airport",      country: "Switzerland",  cc: "ch", lat: 47.4647, lng: 8.5492 },
    GVA: { city: "Geneva",        name: "Geneva Airport",      country: "Switzerland",  cc: "ch", lat: 46.2381, lng: 6.1089 },
    VIE: { city: "Vienna",        name: "Vienna Intl",         country: "Austria",      cc: "at", lat: 48.1103, lng: 16.5697 },
    CPH: { city: "Copenhagen",    name: "Copenhagen Airport",  country: "Denmark",      cc: "dk", lat: 55.6180, lng: 12.6560 },
    ARN: { city: "Stockholm",     name: "Arlanda",             country: "Sweden",       cc: "se", lat: 59.6519, lng: 17.9186 },
    OSL: { city: "Oslo",          name: "Gardermoen",          country: "Norway",       cc: "no", lat: 60.1976, lng: 11.1004 },
    HEL: { city: "Helsinki",      name: "Helsinki-Vantaa",     country: "Finland",      cc: "fi", lat: 60.3172, lng: 24.9633 },
    DUB: { city: "Dublin",        name: "Dublin Airport",      country: "Ireland",      cc: "ie", lat: 53.4213, lng: -6.2701 },
    BRU: { city: "Brussels",      name: "Brussels Airport",    country: "Belgium",      cc: "be", lat: 50.9014, lng: 4.4844 },
    WAW: { city: "Warsaw",        name: "Chopin Airport",      country: "Poland",       cc: "pl", lat: 52.1657, lng: 20.9671 },
    PRG: { city: "Prague",        name: "Václav Havel Airport",country: "Czechia",      cc: "cz", lat: 50.1008, lng: 14.2600 },
    BUD: { city: "Budapest",      name: "Ferenc Liszt Intl",   country: "Hungary",      cc: "hu", lat: 47.4298, lng: 19.2611 },
    ATH: { city: "Athens",        name: "Eleftherios Venizelos", country: "Greece",     cc: "gr", lat: 37.9364, lng: 23.9445 },
    MXP: { city: "Milan",         name: "Malpensa",            country: "Italy",        cc: "it", lat: 45.6306, lng: 8.7281 },
    VCE: { city: "Venice",        name: "Marco Polo",          country: "Italy",        cc: "it", lat: 45.5053, lng: 12.3519 },
    MAN: { city: "Manchester",    name: "Manchester Airport",  country: "United Kingdom", cc: "gb", lat: 53.3537, lng: -2.2750 },
    EDI: { city: "Edinburgh",     name: "Edinburgh Airport",   country: "United Kingdom", cc: "gb", lat: 55.9500, lng: -3.3725 },
    LGW: { city: "London",        name: "Gatwick",             country: "United Kingdom", cc: "gb", lat: 51.1537, lng: -0.1821 },
    NCE: { city: "Nice",          name: "Côte d'Azur",         country: "France",       cc: "fr", lat: 43.6584, lng: 7.2159 },
    LYS: { city: "Lyon",          name: "Saint-Exupéry",       country: "France",       cc: "fr", lat: 45.7256, lng: 5.0811 },

    // ---- Middle East ----
    DOH: { city: "Doha",          name: "Hamad Intl",          country: "Qatar",        cc: "qa", lat: 25.2609, lng: 51.6138 },
    AUH: { city: "Abu Dhabi",     name: "Zayed Intl",          country: "UAE",          cc: "ae", lat: 24.4330, lng: 54.6511 },
    RUH: { city: "Riyadh",        name: "King Khalid Intl",    country: "Saudi Arabia", cc: "sa", lat: 24.9576, lng: 46.6988 },
    JED: { city: "Jeddah",        name: "King Abdulaziz Intl", country: "Saudi Arabia", cc: "sa", lat: 21.6796, lng: 39.1565 },
    TLV: { city: "Tel Aviv",      name: "Ben Gurion",          country: "Israel",       cc: "il", lat: 32.0114, lng: 34.8867 },
    AMM: { city: "Amman",         name: "Queen Alia Intl",     country: "Jordan",       cc: "jo", lat: 31.7226, lng: 35.9932 },
    BEY: { city: "Beirut",        name: "Rafic Hariri Intl",   country: "Lebanon",      cc: "lb", lat: 33.8209, lng: 35.4884 },
    MCT: { city: "Muscat",        name: "Muscat Intl",         country: "Oman",         cc: "om", lat: 23.5933, lng: 58.2844 },
    KWI: { city: "Kuwait City",   name: "Kuwait Intl",         country: "Kuwait",       cc: "kw", lat: 29.2266, lng: 47.9689 },

    // ---- East / Southeast / South / Central Asia ----
    PEK: { city: "Beijing",       name: "Capital Intl",        country: "China",        cc: "cn", lat: 40.0799, lng: 116.6031 },
    PVG: { city: "Shanghai",      name: "Pudong Intl",         country: "China",        cc: "cn", lat: 31.1443, lng: 121.8083 },
    CAN: { city: "Guangzhou",     name: "Baiyun Intl",         country: "China",        cc: "cn", lat: 23.3924, lng: 113.2988 },
    SZX: { city: "Shenzhen",      name: "Bao'an Intl",         country: "China",        cc: "cn", lat: 22.6393, lng: 113.8107 },
    CTU: { city: "Chengdu",       name: "Tianfu Intl",         country: "China",        cc: "cn", lat: 30.3125, lng: 104.4416 },
    KUL: { city: "Kuala Lumpur",  name: "KLIA",                country: "Malaysia",     cc: "my", lat: 2.7456,  lng: 101.7099 },
    CGK: { city: "Jakarta",       name: "Soekarno–Hatta",      country: "Indonesia",    cc: "id", lat: -6.1256, lng: 106.6559 },
    DPS: { city: "Denpasar",      name: "Ngurah Rai (Bali)",   country: "Indonesia",    cc: "id", lat: -8.7482, lng: 115.1671 },
    MNL: { city: "Manila",        name: "Ninoy Aquino Intl",   country: "Philippines",  cc: "ph", lat: 14.5086, lng: 121.0194 },
    HAN: { city: "Hanoi",         name: "Noi Bai Intl",        country: "Vietnam",      cc: "vn", lat: 21.2212, lng: 105.8072 },
    SGN: { city: "Ho Chi Minh City", name: "Tan Son Nhat",     country: "Vietnam",      cc: "vn", lat: 10.8188, lng: 106.6520 },
    PNH: { city: "Phnom Penh",    name: "Phnom Penh Intl",     country: "Cambodia",     cc: "kh", lat: 11.5466, lng: 104.8441 },
    RGN: { city: "Yangon",        name: "Yangon Intl",         country: "Myanmar",      cc: "mm", lat: 16.9073, lng: 96.1332 },
    DAC: { city: "Dhaka",         name: "Hazrat Shahjalal",    country: "Bangladesh",   cc: "bd", lat: 23.8433, lng: 90.3978 },
    KTM: { city: "Kathmandu",     name: "Tribhuvan Intl",      country: "Nepal",        cc: "np", lat: 27.6966, lng: 85.3591 },
    CMB: { city: "Colombo",       name: "Bandaranaike Intl",   country: "Sri Lanka",    cc: "lk", lat: 7.1808,  lng: 79.8841 },
    KHI: { city: "Karachi",       name: "Jinnah Intl",         country: "Pakistan",     cc: "pk", lat: 24.9065, lng: 67.1608 },
    LHE: { city: "Lahore",        name: "Allama Iqbal Intl",   country: "Pakistan",     cc: "pk", lat: 31.5216, lng: 74.4036 },
    ISB: { city: "Islamabad",     name: "Islamabad Intl",      country: "Pakistan",     cc: "pk", lat: 33.5607, lng: 72.8258 },
    ULN: { city: "Ulaanbaatar",   name: "Chinggis Khaan Intl", country: "Mongolia",     cc: "mn", lat: 47.6469, lng: 106.8166 },
    TAS: { city: "Tashkent",      name: "Tashkent Intl",       country: "Uzbekistan",   cc: "uz", lat: 41.2579, lng: 69.2812 },
    ALA: { city: "Almaty",        name: "Almaty Intl",         country: "Kazakhstan",   cc: "kz", lat: 43.3521, lng: 77.0405 },
    BOM: { city: "Mumbai",        name: "Chhatrapati Shivaji", country: "India",        cc: "in", lat: 19.0896, lng: 72.8656 },
    BLR: { city: "Bengaluru",     name: "Kempegowda Intl",     country: "India",        cc: "in", lat: 13.1986, lng: 77.7066 },
    MAA: { city: "Chennai",       name: "Chennai Intl",        country: "India",        cc: "in", lat: 12.9941, lng: 80.1709 },
    CCU: { city: "Kolkata",       name: "Netaji Subhas Chandra Bose", country: "India", cc: "in", lat: 22.6547, lng: 88.4467 },
    HYD: { city: "Hyderabad",     name: "Rajiv Gandhi Intl",   country: "India",        cc: "in", lat: 17.2403, lng: 78.4294 },
    NGO: { city: "Nagoya",        name: "Chubu Centrair",      country: "Japan",        cc: "jp", lat: 34.8584, lng: 136.8054 },
    KIX: { city: "Osaka",         name: "Kansai Intl",         country: "Japan",        cc: "jp", lat: 34.4347, lng: 135.2440 },
    FUK: { city: "Fukuoka",       name: "Fukuoka Airport",     country: "Japan",        cc: "jp", lat: 33.5859, lng: 130.4506 },
    CTS: { city: "Sapporo",       name: "New Chitose",         country: "Japan",        cc: "jp", lat: 42.7752, lng: 141.6923 },
    PUS: { city: "Busan",         name: "Gimhae Intl",         country: "South Korea",  cc: "kr", lat: 35.1795, lng: 128.9382 },
    KHH: { city: "Kaohsiung",     name: "Kaohsiung Intl",      country: "Taiwan",       cc: "tw", lat: 22.5771, lng: 120.3499 },

    // ---- Africa ----
    JNB: { city: "Johannesburg",  name: "O.R. Tambo Intl",     country: "South Africa", cc: "za", lat: -26.1392, lng: 28.2460 },
    NBO: { city: "Nairobi",       name: "Jomo Kenyatta Intl",  country: "Kenya",        cc: "ke", lat: -1.3192,  lng: 36.9278 },
    LOS: { city: "Lagos",         name: "Murtala Muhammed",    country: "Nigeria",      cc: "ng", lat: 6.5774,   lng: 3.3212 },
    ACC: { city: "Accra",         name: "Kotoka Intl",         country: "Ghana",        cc: "gh", lat: 5.6052,   lng: -0.1668 },
    ADD: { city: "Addis Ababa",   name: "Bole Intl",           country: "Ethiopia",     cc: "et", lat: 8.9779,   lng: 38.7993 },
    CMN: { city: "Casablanca",    name: "Mohammed V Intl",     country: "Morocco",      cc: "ma", lat: 33.3675,  lng: -7.5900 },
    TUN: { city: "Tunis",         name: "Tunis–Carthage",      country: "Tunisia",      cc: "tn", lat: 36.8510,  lng: 10.2272 },
    ALG: { city: "Algiers",       name: "Houari Boumediene",   country: "Algeria",      cc: "dz", lat: 36.6910,  lng: 3.2154 },
    DAR: { city: "Dar es Salaam", name: "Julius Nyerere Intl", country: "Tanzania",     cc: "tz", lat: -6.8781,  lng: 39.2026 },
    KGL: { city: "Kigali",        name: "Kigali Intl",         country: "Rwanda",       cc: "rw", lat: -1.9686,  lng: 30.1395 },

    // ---- Oceania ----
    MEL: { city: "Melbourne",     name: "Melbourne Airport",   country: "Australia",    cc: "au", lat: -37.6690, lng: 144.8410 },
    BNE: { city: "Brisbane",      name: "Brisbane Airport",    country: "Australia",    cc: "au", lat: -27.3842, lng: 153.1175 },
    PER: { city: "Perth",         name: "Perth Airport",       country: "Australia",    cc: "au", lat: -31.9385, lng: 115.9672 },
    ADL: { city: "Adelaide",      name: "Adelaide Airport",    country: "Australia",    cc: "au", lat: -34.9461, lng: 138.5306 },
    NAN: { city: "Nadi",          name: "Nadi Intl",           country: "Fiji",         cc: "fj", lat: -17.7554, lng: 177.4434 },
    CHC: { city: "Christchurch",  name: "Christchurch Intl",   country: "New Zealand",  cc: "nz", lat: -43.4894, lng: 172.5320 },
    WLG: { city: "Wellington",    name: "Wellington Intl",     country: "New Zealand",  cc: "nz", lat: -41.3272, lng: 174.8050 },
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
