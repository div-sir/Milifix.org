/* ============================================================
   MERIDIEL — Sample data + helpers
   ============================================================ */
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

    // ---- More United States / Canada ----
    BWI: { city: "Baltimore",     name: "BWI Marshall",        country: "United States", cc: "us", lat: 39.1774, lng: -76.6684 },
    RDU: { city: "Raleigh",       name: "Raleigh–Durham",      country: "United States", cc: "us", lat: 35.8776, lng: -78.7875 },
    SAT: { city: "San Antonio",   name: "San Antonio Intl",    country: "United States", cc: "us", lat: 29.5337, lng: -98.4698 },
    MSY: { city: "New Orleans",   name: "Louis Armstrong",     country: "United States", cc: "us", lat: 29.9934, lng: -90.2580 },
    TPA: { city: "Tampa",         name: "Tampa Intl",          country: "United States", cc: "us", lat: 27.9755, lng: -82.5332 },
    JAX: { city: "Jacksonville",  name: "Jacksonville Intl",   country: "United States", cc: "us", lat: 30.4941, lng: -81.6879 },
    BNA: { city: "Nashville",     name: "Nashville Intl",      country: "United States", cc: "us", lat: 36.1263, lng: -86.6774 },
    STL: { city: "St. Louis",     name: "Lambert Intl",        country: "United States", cc: "us", lat: 38.7487, lng: -90.3700 },
    IND: { city: "Indianapolis",  name: "Indianapolis Intl",   country: "United States", cc: "us", lat: 39.7173, lng: -86.2944 },
    OMA: { city: "Omaha",         name: "Eppley Airfield",     country: "United States", cc: "us", lat: 41.3032, lng: -95.8941 },
    ABQ: { city: "Albuquerque",   name: "Sunport",             country: "United States", cc: "us", lat: 35.0402, lng: -106.6092 },
    OAK: { city: "Oakland",       name: "Oakland Intl",        country: "United States", cc: "us", lat: 37.7126, lng: -122.2197 },
    SJC: { city: "San Jose",      name: "Mineta San José",     country: "United States", cc: "us", lat: 37.3639, lng: -121.9289 },
    SMF: { city: "Sacramento",    name: "Sacramento Intl",     country: "United States", cc: "us", lat: 38.6954, lng: -121.5908 },
    ANC: { city: "Anchorage",     name: "Ted Stevens Intl",    country: "United States", cc: "us", lat: 61.1743, lng: -149.9982 },
    BOI: { city: "Boise",         name: "Boise Airport",       country: "United States", cc: "us", lat: 43.5644, lng: -116.2228 },
    YEG: { city: "Edmonton",      name: "Edmonton Intl",       country: "Canada",        cc: "ca", lat: 53.3097, lng: -113.5801 },
    YHZ: { city: "Halifax",       name: "Halifax Stanfield",   country: "Canada",        cc: "ca", lat: 44.8808, lng: -63.5086 },
    YWG: { city: "Winnipeg",      name: "Richardson Intl",     country: "Canada",        cc: "ca", lat: 49.9100, lng: -97.2399 },

    // ---- More Mexico / Central America / Caribbean ----
    GDL: { city: "Guadalajara",   name: "Miguel Hidalgo",      country: "Mexico",             cc: "mx", lat: 20.5218, lng: -103.3112 },
    MTY: { city: "Monterrey",     name: "Del Norte Intl",      country: "Mexico",             cc: "mx", lat: 25.7785, lng: -100.1069 },
    SAL: { city: "San Salvador",  name: "El Salvador Intl",    country: "El Salvador",        cc: "sv", lat: 13.4409, lng: -89.0557 },
    GUA: { city: "Guatemala City",name: "La Aurora Intl",      country: "Guatemala",          cc: "gt", lat: 14.5833, lng: -90.5275 },
    SJO: { city: "San José",      name: "Juan Santamaría",     country: "Costa Rica",         cc: "cr", lat: 9.9981,  lng: -84.2041 },
    KIN: { city: "Kingston",      name: "Norman Manley Intl",  country: "Jamaica",            cc: "jm", lat: 17.9357, lng: -76.7875 },
    CUR: { city: "Willemstad",    name: "Curaçao Intl",        country: "Curaçao",            cc: "cw", lat: 12.1889, lng: -68.9598 },
    BGI: { city: "Bridgetown",    name: "Grantley Adams Intl", country: "Barbados",           cc: "bb", lat: 13.0746, lng: -59.4925 },

    // ---- More South America ----
    FOR: { city: "Fortaleza",     name: "Pinto Martins",       country: "Brazil",    cc: "br", lat: -3.7763,  lng: -38.5326 },
    REC: { city: "Recife",       name: "Guararapes Intl",     country: "Brazil",    cc: "br", lat: -8.1264,  lng: -34.9236 },
    BSB: { city: "Brasília",      name: "Brasília Intl",       country: "Brazil",    cc: "br", lat: -15.8697, lng: -47.9208 },
    POA: { city: "Porto Alegre",  name: "Salgado Filho",       country: "Brazil",    cc: "br", lat: -29.9939, lng: -51.1714 },
    CWB: { city: "Curitiba",      name: "Afonso Pena",         country: "Brazil",    cc: "br", lat: -25.5285, lng: -49.1758 },
    VVI: { city: "Santa Cruz",    name: "Viru Viru Intl",      country: "Bolivia",   cc: "bo", lat: -17.6448, lng: -63.1354 },
    GYE: { city: "Guayaquil",     name: "José Joaquín Olmedo", country: "Ecuador",   cc: "ec", lat: -2.1574,  lng: -79.8836 },

    // ---- More Europe ----
    BER: { city: "Berlin",        name: "Brandenburg",         country: "Germany",   cc: "de", lat: 52.3667, lng: 13.5033 },
    HAM: { city: "Hamburg",       name: "Hamburg Airport",     country: "Germany",   cc: "de", lat: 53.6304, lng: 9.9882 },
    STR: { city: "Stuttgart",     name: "Stuttgart Airport",   country: "Germany",   cc: "de", lat: 48.6899, lng: 9.2220 },
    CGN: { city: "Cologne",       name: "Cologne Bonn",        country: "Germany",   cc: "de", lat: 50.8659, lng: 7.1427 },
    DUS: { city: "Düsseldorf",    name: "Düsseldorf Airport",  country: "Germany",   cc: "de", lat: 51.2895, lng: 6.7668 },
    INN: { city: "Innsbruck",     name: "Innsbruck Airport",   country: "Austria",   cc: "at", lat: 47.2602, lng: 11.3440 },
    ZAG: { city: "Zagreb",        name: "Zagreb Airport",      country: "Croatia",   cc: "hr", lat: 45.7429, lng: 16.0688 },
    LJU: { city: "Ljubljana",     name: "Jože Pučnik",         country: "Slovenia",  cc: "si", lat: 46.2237, lng: 14.4576 },
    SOF: { city: "Sofia",         name: "Sofia Airport",       country: "Bulgaria",  cc: "bg", lat: 42.6952, lng: 23.4062 },
    OTP: { city: "Bucharest",     name: "Henri Coandă",        country: "Romania",   cc: "ro", lat: 44.5711, lng: 26.0850 },
    KRK: { city: "Kraków",        name: "John Paul II",        country: "Poland",    cc: "pl", lat: 50.0777, lng: 19.7848 },
    GDN: { city: "Gdańsk",        name: "Lech Wałęsa",         country: "Poland",    cc: "pl", lat: 54.3776, lng: 18.4662 },
    RIX: { city: "Riga",          name: "Riga Intl",           country: "Latvia",    cc: "lv", lat: 56.9236, lng: 23.9711 },
    VNO: { city: "Vilnius",       name: "Vilnius Airport",     country: "Lithuania", cc: "lt", lat: 54.6341, lng: 25.2858 },
    TLL: { city: "Tallinn",       name: "Lennart Meri",        country: "Estonia",   cc: "ee", lat: 59.4133, lng: 24.8328 },
    LUX: { city: "Luxembourg",    name: "Findel Airport",      country: "Luxembourg",cc: "lu", lat: 49.6233, lng: 6.2044 },
    BOD: { city: "Bordeaux",      name: "Mérignac",            country: "France",    cc: "fr", lat: 44.8283, lng: -0.7156 },
    TLS: { city: "Toulouse",      name: "Blagnac",             country: "France",    cc: "fr", lat: 43.6293, lng: 1.3638 },
    MRS: { city: "Marseille",     name: "Provence Airport",    country: "France",    cc: "fr", lat: 43.4393, lng: 5.2214 },
    BHX: { city: "Birmingham",    name: "Birmingham Airport",  country: "United Kingdom", cc: "gb", lat: 52.4539, lng: -1.7480 },
    GLA: { city: "Glasgow",       name: "Glasgow Airport",     country: "United Kingdom", cc: "gb", lat: 55.8642, lng: -4.4331 },
    BFS: { city: "Belfast",       name: "Belfast Intl",        country: "United Kingdom", cc: "gb", lat: 54.6575, lng: -6.2158 },
    SVQ: { city: "Seville",       name: "San Pablo",           country: "Spain",     cc: "es", lat: 37.4180, lng: -5.8931 },
    BIO: { city: "Bilbao",        name: "Bilbao Airport",      country: "Spain",     cc: "es", lat: 43.3011, lng: -2.9106 },
    PMI: { city: "Palma",         name: "Palma de Mallorca",   country: "Spain",     cc: "es", lat: 39.5517, lng: 2.7388 },
    AGP: { city: "Málaga",        name: "Costa del Sol",       country: "Spain",     cc: "es", lat: 36.6749, lng: -4.4991 },
    VLC: { city: "Valencia",      name: "Valencia Airport",    country: "Spain",     cc: "es", lat: 39.4893, lng: -0.4816 },
    IBZ: { city: "Ibiza",         name: "Ibiza Airport",       country: "Spain",     cc: "es", lat: 38.8729, lng: 1.3731 },
    NAP: { city: "Naples",        name: "Capodichino",         country: "Italy",     cc: "it", lat: 40.8860, lng: 14.2908 },
    BLQ: { city: "Bologna",       name: "Guglielmo Marconi",   country: "Italy",     cc: "it", lat: 44.5354, lng: 11.2887 },
    CTA: { city: "Catania",       name: "Fontanarossa",        country: "Italy",     cc: "it", lat: 37.4668, lng: 15.0664 },
    PSA: { city: "Pisa",          name: "Galileo Galilei",     country: "Italy",     cc: "it", lat: 43.6839, lng: 10.3927 },
    SPU: { city: "Split",         name: "Split Airport",       country: "Croatia",   cc: "hr", lat: 43.5389, lng: 16.2980 },
    TIA: { city: "Tirana",        name: "Nënë Tereza",         country: "Albania",   cc: "al", lat: 41.4147, lng: 19.7206 },

    // ---- More Middle East ----
    BAH: { city: "Manama",        name: "Bahrain Intl",        country: "Bahrain",       cc: "bh", lat: 26.2708, lng: 50.6336 },
    MED: { city: "Medina",        name: "Prince Mohammad",     country: "Saudi Arabia",  cc: "sa", lat: 24.5534, lng: 39.7051 },
    DMM: { city: "Dammam",        name: "King Fahd Intl",      country: "Saudi Arabia",  cc: "sa", lat: 26.4712, lng: 49.7979 },

    // ---- More Africa ----
    MRU: { city: "Port Louis",    name: "Sir Seewoosagur",     country: "Mauritius",     cc: "mu", lat: -20.4302, lng: 57.6836 },
    SEZ: { city: "Victoria",      name: "Seychelles Intl",     country: "Seychelles",    cc: "sc", lat: -4.6743,  lng: 55.5218 },
    ABJ: { city: "Abidjan",       name: "Félix-Houphouët",     country: "Côte d'Ivoire", cc: "ci", lat: 5.2614,   lng: -3.9263 },
    DKR: { city: "Dakar",         name: "Blaise Diagne",       country: "Senegal",       cc: "sn", lat: 14.6704,  lng: -17.0730 },
    LAD: { city: "Luanda",        name: "Quatro de Fevereiro", country: "Angola",        cc: "ao", lat: -8.8584,  lng: 13.2312 },
    WDH: { city: "Windhoek",      name: "Hosea Kutako",        country: "Namibia",       cc: "na", lat: -22.4799, lng: 17.4709 },
    GBE: { city: "Gaborone",      name: "Sir Seretse Khama",   country: "Botswana",      cc: "bw", lat: -24.5552, lng: 25.9182 },
    LUN: { city: "Lusaka",        name: "Kenneth Kaunda",      country: "Zambia",        cc: "zm", lat: -15.3308, lng: 28.4527 },
    HRE: { city: "Harare",        name: "Robert Gabriel Mugabe", country: "Zimbabwe",    cc: "zw", lat: -17.9318, lng: 31.0928 },
    MPM: { city: "Maputo",        name: "Maputo Intl",         country: "Mozambique",    cc: "mz", lat: -25.9208, lng: 32.5726 },
    TNR: { city: "Antananarivo",  name: "Ivato Intl",          country: "Madagascar",    cc: "mg", lat: -18.7969, lng: 47.4788 },
    KRT: { city: "Khartoum",      name: "Khartoum Intl",       country: "Sudan",         cc: "sd", lat: 15.5895, lng: 32.5532 },

    // ---- More South / Central Asia ----
    AMD: { city: "Ahmedabad",     name: "Sardar Vallabhbhai",  country: "India",     cc: "in", lat: 23.0772, lng: 72.6347 },
    PNQ: { city: "Pune",          name: "Pune Airport",        country: "India",     cc: "in", lat: 18.5822, lng: 73.9197 },
    GOI: { city: "Goa",           name: "Dabolim Airport",     country: "India",     cc: "in", lat: 15.3808, lng: 73.8314 },
    COK: { city: "Kochi",         name: "Cochin Intl",         country: "India",     cc: "in", lat: 10.1520, lng: 76.4019 },
    LKO: { city: "Lucknow",       name: "Chaudhary Charan",    country: "India",     cc: "in", lat: 26.7606, lng: 80.8893 },
    MLE: { city: "Malé",          name: "Velana Intl",         country: "Maldives",  cc: "mv", lat: 4.1917,  lng: 73.5290 },
    THR: { city: "Tehran",        name: "Imam Khomeini",       country: "Iran",      cc: "ir", lat: 35.4161, lng: 51.1522 },
    SHJ: { city: "Sharjah",       name: "Sharjah Intl",        country: "UAE",       cc: "ae", lat: 25.3286, lng: 55.5172 },

    // ---- More East / Southeast Asia ----
    XIY: { city: "Xi'an",         name: "Xianyang Intl",       country: "China",     cc: "cn", lat: 34.4471, lng: 108.7517 },
    WUH: { city: "Wuhan",         name: "Tianhe Intl",         country: "China",     cc: "cn", lat: 30.7838, lng: 114.2081 },
    NKG: { city: "Nanjing",       name: "Lukou Intl",          country: "China",     cc: "cn", lat: 31.7420, lng: 118.8622 },
    HGH: { city: "Hangzhou",      name: "Xiaoshan Intl",       country: "China",     cc: "cn", lat: 30.2295, lng: 120.4344 },
    XMN: { city: "Xiamen",        name: "Gaoqi Intl",          country: "China",     cc: "cn", lat: 24.5440, lng: 118.1279 },
    KMG: { city: "Kunming",       name: "Changshui Intl",      country: "China",     cc: "cn", lat: 25.1019, lng: 102.9292 },
    CKG: { city: "Chongqing",     name: "Jiangbei Intl",       country: "China",     cc: "cn", lat: 29.7192, lng: 106.6417 },
    TAE: { city: "Taichung",      name: "Taichung Intl",       country: "Taiwan",    cc: "tw", lat: 24.2647, lng: 120.6224 },
    CJU: { city: "Jeju",          name: "Jeju Intl",           country: "South Korea", cc: "kr", lat: 33.5113, lng: 126.4930 },
    OKA: { city: "Okinawa",       name: "Naha Airport",        country: "Japan",     cc: "jp", lat: 26.1958, lng: 127.6459 },
    HIJ: { city: "Hiroshima",     name: "Hiroshima Airport",   country: "Japan",     cc: "jp", lat: 34.4361, lng: 132.9194 },
    SDJ: { city: "Sendai",        name: "Sendai Airport",      country: "Japan",     cc: "jp", lat: 38.1397, lng: 140.9169 },
    VTE: { city: "Vientiane",     name: "Wattay Intl",         country: "Laos",      cc: "la", lat: 17.9883, lng: 102.5633 },
    BWN: { city: "Bandar Seri Begawan", name: "Brunei Intl",   country: "Brunei",    cc: "bn", lat: 4.9442,  lng: 114.9283 },
    CEB: { city: "Cebu",          name: "Mactan-Cebu",         country: "Philippines", cc: "ph", lat: 10.3075, lng: 123.9789 },
    DVO: { city: "Davao",         name: "Francisco Bangoy",    country: "Philippines", cc: "ph", lat: 7.1255,  lng: 125.6456 },
    KCH: { city: "Kuching",       name: "Kuching Intl",        country: "Malaysia",  cc: "my", lat: 1.4847,   lng: 110.3468 },
    BKI: { city: "Kota Kinabalu", name: "Kota Kinabalu Intl",  country: "Malaysia",  cc: "my", lat: 5.9372,   lng: 116.0511 },
    PEN: { city: "Penang",        name: "Penang Intl",         country: "Malaysia",  cc: "my", lat: 5.2971,   lng: 100.2769 },
    SUB: { city: "Surabaya",      name: "Juanda Intl",         country: "Indonesia", cc: "id", lat: -7.3798,  lng: 112.7869 },
    UPG: { city: "Makassar",      name: "Sultan Hasanuddin",   country: "Indonesia", cc: "id", lat: -5.0616,  lng: 119.5541 },

    // ---- More Oceania / Pacific ----
    OOL: { city: "Gold Coast",    name: "Gold Coast Airport",  country: "Australia", cc: "au", lat: -28.1644, lng: 153.5047 },
    CNS: { city: "Cairns",        name: "Cairns Airport",      country: "Australia", cc: "au", lat: -16.8858, lng: 145.7553 },
    DRW: { city: "Darwin",        name: "Darwin Airport",      country: "Australia", cc: "au", lat: -12.4147, lng: 130.8767 },
    HBA: { city: "Hobart",        name: "Hobart Airport",      country: "Australia", cc: "au", lat: -42.8361, lng: 147.5103 },
    NOU: { city: "Nouméa",        name: "La Tontouta",         country: "New Caledonia", cc: "nc", lat: -22.0146, lng: 166.2130 },
    POM: { city: "Port Moresby",  name: "Jacksons Intl",       country: "Papua New Guinea", cc: "pg", lat: -9.4433, lng: 147.2200 },
    RAR: { city: "Rarotonga",     name: "Rarotonga Intl",      country: "Cook Islands", cc: "ck", lat: -21.2027, lng: -159.8055 },
    VLI: { city: "Port Vila",     name: "Bauerfield Intl",     country: "Vanuatu",   cc: "vu", lat: -17.6993, lng: 168.3200 },
    TBU: { city: "Nuku'alofa",    name: "Fua'amotu Intl",      country: "Tonga",     cc: "to", lat: -21.2412, lng: -175.1500 },
    PPT: { city: "Papeete",       name: "Faa'a Intl",          country: "French Polynesia", cc: "pf", lat: -17.5537, lng: -149.6070 },

    // ---- More airports for cities with multiple hubs, sourced from OpenFlights ----
    LGA: { city: "New York", name: "La Guardia", country: "United States", cc: "us", lat: 40.7772, lng: -73.8726 },
    HND: { city: "Tokyo", name: "Haneda", country: "Japan", cc: "jp", lat: 35.5523, lng: 139.78 },
    LCY: { city: "London", name: "London City", country: "United Kingdom", cc: "gb", lat: 51.5053, lng: 0.0553 },
    STN: { city: "London", name: "Stansted", country: "United Kingdom", cc: "gb", lat: 51.885, lng: 0.235 },
    LTN: { city: "London", name: "Luton", country: "United Kingdom", cc: "gb", lat: 51.8747, lng: -0.3683 },
    ORY: { city: "Paris", name: "Paris-Orly", country: "France", cc: "fr", lat: 48.7233, lng: 2.3794 },
    SVO: { city: "Moscow", name: "Sheremetyevo", country: "Russia", cc: "ru", lat: 55.9726, lng: 37.4146 },
    DME: { city: "Moscow", name: "Domodedovo", country: "Russia", cc: "ru", lat: 55.4088, lng: 37.9063 },
    VKO: { city: "Moscow", name: "Vnukovo", country: "Russia", cc: "ru", lat: 55.5915, lng: 37.2615 },
    LIN: { city: "Milan", name: "Linate", country: "Italy", cc: "it", lat: 45.4451, lng: 9.2767 },
    MDW: { city: "Chicago", name: "Midway", country: "United States", cc: "us", lat: 41.786, lng: -87.7524 },
    HOU: { city: "Houston", name: "William P. Hobby", country: "United States", cc: "us", lat: 29.6454, lng: -95.2789 },
    SHA: { city: "Shanghai", name: "Hongqiao Intl", country: "China", cc: "cn", lat: 31.1979, lng: 121.336 },
    GMP: { city: "Seoul", name: "Gimpo Intl", country: "South Korea", cc: "kr", lat: 37.5583, lng: 126.791 },
    ITM: { city: "Osaka", name: "Itami", country: "Japan", cc: "jp", lat: 34.7855, lng: 135.438 },
    CGH: { city: "São Paulo", name: "Congonhas", country: "Brazil", cc: "br", lat: -23.6261, lng: -46.6564 },
    SDU: { city: "Rio de Janeiro", name: "Santos Dumont", country: "Brazil", cc: "br", lat: -22.9105, lng: -43.1631 },
    AEP: { city: "Buenos Aires", name: "Aeroparque Jorge Newbery", country: "Argentina", cc: "ar", lat: -34.5592, lng: -58.4156 },
    YTZ: { city: "Toronto", name: "Billy Bishop City Centre", country: "Canada", cc: "ca", lat: 43.6275, lng: -79.3962 },
    PKX: { city: "Beijing", name: "Daxing Intl", country: "China", cc: "cn", lat: 39.5099, lng: 116.4109 },
    DMK: { city: "Bangkok", name: "Don Mueang Intl", country: "Thailand", cc: "th", lat: 13.9126, lng: 100.607 },
    TSA: { city: "Taipei", name: "Songshan", country: "Taiwan", cc: "tw", lat: 25.0694, lng: 121.552 },
    SAW: { city: "Istanbul", name: "Sabiha Gökçen", country: "Turkey", cc: "tr", lat: 40.8986, lng: 29.3092 },
    CRK: { city: "Angeles City", name: "Clark Intl", country: "Philippines", cc: "ph", lat: 15.186, lng: 120.56 },
    DWC: { city: "Dubai", name: "Al Maktoum Intl", country: "UAE", cc: "ae", lat: 24.8964, lng: 55.1614 },
    FLL: { city: "Fort Lauderdale", name: "Fort Lauderdale–Hollywood", country: "United States", cc: "us", lat: 26.0726, lng: -80.1527 },
    BUF: { city: "Buffalo", name: "Buffalo Niagara Intl", country: "United States", cc: "us", lat: 42.9405, lng: -78.7322 },
    YQB: { city: "Québec City", name: "Jean Lesage Intl", country: "Canada", cc: "ca", lat: 46.7911, lng: -71.3933 },
    PVR: { city: "Puerto Vallarta", name: "Puerto Vallarta Intl", country: "Mexico", cc: "mx", lat: 20.6801, lng: -105.254 },
    SJD: { city: "Los Cabos", name: "Los Cabos Intl", country: "Mexico", cc: "mx", lat: 23.1518, lng: -109.721 },
    MZT: { city: "Mazatlán", name: "Mazatlán Intl", country: "Mexico", cc: "mx", lat: 23.1614, lng: -106.266 },
    HAK: { city: "Haikou", name: "Meilan Intl", country: "China", cc: "cn", lat: 19.9349, lng: 110.459 },
    PIT: { city: "Pittsburgh", name: "Pittsburgh Intl", country: "United States", cc: "us", lat: 40.4915, lng: -80.2329 },
    MCI: { city: "Kansas City", name: "Kansas City Intl", country: "United States", cc: "us", lat: 39.2976, lng: -94.7139 },
    CLE: { city: "Cleveland", name: "Cleveland Hopkins", country: "United States", cc: "us", lat: 41.4117, lng: -81.8498 },
    MEM: { city: "Memphis", name: "Memphis Intl", country: "United States", cc: "us", lat: 35.0424, lng: -89.9767 },
    ORF: { city: "Norfolk", name: "Norfolk Intl", country: "United States", cc: "us", lat: 36.8946, lng: -76.2012 },
    YXE: { city: "Saskatoon", name: "Saskatoon Intl", country: "Canada", cc: "ca", lat: 52.1708, lng: -106.7 },
    YQR: { city: "Regina", name: "Regina Intl", country: "Canada", cc: "ca", lat: 50.4319, lng: -104.666 },
    GSO: { city: "Greensboro", name: "Piedmont Triad Intl", country: "United States", cc: "us", lat: 36.0978, lng: -79.9373 },
    CHS: { city: "Charleston", name: "Charleston Intl", country: "United States", cc: "us", lat: 32.8986, lng: -80.0405 },
    SAV: { city: "Savannah", name: "Savannah/Hilton Head Intl", country: "United States", cc: "us", lat: 32.1276, lng: -81.2021 },
    MYR: { city: "Myrtle Beach", name: "Myrtle Beach Intl", country: "United States", cc: "us", lat: 33.6797, lng: -78.9283 },
  };

  // ---- Airlines: real carriers + IATA code, for the airline autocomplete ----
  const AIRLINES = [
    // Star Alliance
    { code: "UA", name: "United Airlines" }, { code: "LH", name: "Lufthansa" },
    { code: "AC", name: "Air Canada" }, { code: "SQ", name: "Singapore Airlines" },
    { code: "NH", name: "ANA" }, { code: "TG", name: "Thai Airways" },
    { code: "TK", name: "Turkish Airlines" }, { code: "LX", name: "Swiss" },
    { code: "OS", name: "Austrian Airlines" }, { code: "SK", name: "SAS" },
    { code: "CA", name: "Air China" }, { code: "BR", name: "EVA Air" },
    { code: "OZ", name: "Asiana Airlines" }, { code: "AI", name: "Air India" },
    { code: "AV", name: "Avianca" }, { code: "CM", name: "Copa Airlines" },
    { code: "MS", name: "EgyptAir" }, { code: "ET", name: "Ethiopian Airlines" },
    { code: "LO", name: "LOT Polish Airlines" }, { code: "SA", name: "South African Airways" },
    { code: "TP", name: "TAP Air Portugal" }, { code: "SN", name: "Brussels Airlines" },
    { code: "NZ", name: "Air New Zealand" }, { code: "ZH", name: "Shenzhen Airlines" },
    // oneworld
    { code: "AA", name: "American Airlines" }, { code: "BA", name: "British Airways" },
    { code: "CX", name: "Cathay Pacific" }, { code: "QF", name: "Qantas" },
    { code: "JL", name: "Japan Airlines" }, { code: "QR", name: "Qatar Airways" },
    { code: "AY", name: "Finnair" }, { code: "IB", name: "Iberia" },
    { code: "MH", name: "Malaysia Airlines" }, { code: "RJ", name: "Royal Jordanian" },
    { code: "AT", name: "Royal Air Maroc" }, { code: "UL", name: "SriLankan Airlines" },
    { code: "FJ", name: "Fiji Airways" }, { code: "AS", name: "Alaska Airlines" },
    // SkyTeam
    { code: "DL", name: "Delta Air Lines" }, { code: "AF", name: "Air France" },
    { code: "KL", name: "KLM" }, { code: "KE", name: "Korean Air" },
    { code: "MU", name: "China Eastern" }, { code: "CZ", name: "China Southern" },
    { code: "SU", name: "Aeroflot" }, { code: "AM", name: "Aeroméxico" },
    { code: "UX", name: "Air Europa" }, { code: "GA", name: "Garuda Indonesia" },
    { code: "KQ", name: "Kenya Airways" }, { code: "ME", name: "Middle East Airlines" },
    { code: "SV", name: "Saudia" }, { code: "VN", name: "Vietnam Airlines" },
    { code: "MF", name: "Xiamen Airlines" },
    // Middle East / Gulf
    { code: "EK", name: "Emirates" }, { code: "EY", name: "Etihad Airways" },
    { code: "FZ", name: "flydubai" }, { code: "G9", name: "Air Arabia" },
    { code: "GF", name: "Gulf Air" }, { code: "WY", name: "Oman Air" },
    { code: "KU", name: "Kuwait Airways" }, { code: "LY", name: "El Al" },
    // Low-cost / regional Americas
    { code: "WN", name: "Southwest Airlines" }, { code: "B6", name: "JetBlue" },
    { code: "NK", name: "Spirit Airlines" }, { code: "F9", name: "Frontier Airlines" },
    { code: "VS", name: "Virgin Atlantic" }, { code: "VA", name: "Virgin Australia" },
    { code: "LA", name: "LATAM Airlines" }, { code: "G3", name: "GOL Linhas Aéreas" },
    { code: "AD", name: "Azul Brazilian Airlines" }, { code: "Y4", name: "Volaris" },
    // Low-cost Europe
    { code: "FR", name: "Ryanair" }, { code: "U2", name: "easyJet" },
    { code: "W6", name: "Wizz Air" }, { code: "DY", name: "Norwegian" },
    { code: "VY", name: "Vueling" }, { code: "FI", name: "Icelandair" },
    { code: "GL", name: "Air Greenland" }, { code: "JU", name: "Air Serbia" },
    // Asia-Pacific carriers (Taiwan-relevant + regional)
    { code: "CI", name: "China Airlines" }, { code: "JX", name: "STARLUX Airlines" },
    { code: "B7", name: "Uni Air" }, { code: "IT", name: "Tigerair Taiwan" },
    { code: "HX", name: "Hong Kong Airlines" }, { code: "UO", name: "HK Express" },
    { code: "AK", name: "AirAsia" }, { code: "TR", name: "Scoot" },
    { code: "6E", name: "IndiGo" }, { code: "SG", name: "SpiceJet" },
    { code: "UK", name: "Vistara" }, { code: "JQ", name: "Jetstar" },
    { code: "MM", name: "Peach Aviation" }, { code: "7C", name: "Jeju Air" },
    { code: "BX", name: "Air Busan" }, { code: "TW", name: "T'way Air" },
    { code: "PR", name: "Philippine Airlines" }, { code: "5J", name: "Cebu Pacific" },
    { code: "FD", name: "Thai AirAsia" }, { code: "DD", name: "Nok Air" },
    { code: "PG", name: "Bangkok Airways" },
    // South / Central Asia + Africa
    { code: "PK", name: "Pakistan International" }, { code: "BG", name: "Biman Bangladesh" },
    { code: "RA", name: "Nepal Airlines" }, { code: "KC", name: "Air Astana" },
    { code: "HY", name: "Uzbekistan Airways" },
  ];
  const AIRLINE_CODES = new Map(AIRLINES.map((a) => [a.code, a.name]));

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

  // Guarantees a flight carries embedded from/to airport objects. Older-schema
  // records (or a partial sync) may only have the o/d codes; without this,
  // every consumer that reads f.from.country / f.from.code — the stats, the
  // flag wall, the flight log, the globe arcs — would throw on the first such
  // record and take the whole app's render down with it. Fills from/to from
  // the AIRPORTS table by code; if even that isn't possible, leaves them as
  // safe empty stubs rather than undefined.
  const EMPTY_AP = { code: "", city: "", name: "", country: "", cc: "", lat: NaN, lng: NaN };
  function hydrateEndpoint(point, code) {
    if (point && isFinite(point.lat) && isFinite(point.lng)) return point;
    const a = code && AIRPORTS[code];
    if (a) return { code, ...a };
    return { ...EMPTY_AP, code: code || "" };
  }
  function hydrateFlight(f) {
    if (!f) return f;
    const from = hydrateEndpoint(f.from, f.o || (f.from && f.from.code));
    const to = hydrateEndpoint(f.to, f.d || (f.to && f.to.code));
    return from === f.from && to === f.to ? f : { ...f, from, to };
  }

  // ---- Aggregate stats ----
  function statsFor(flights) {
    const countries = new Set(), airports = new Set();
    let km = 0, min = 0;
    flights.forEach((raw) => {
      const f = hydrateFlight(raw);
      km += f.km || 0; min += f.dur || 0;
      if (f.from.country) countries.add(f.from.country);
      if (f.to.country) countries.add(f.to.country);
      if (f.from.code) airports.add(f.from.code);
      if (f.to.code) airports.add(f.to.code);
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
    flights.forEach((raw) => {
      const f = hydrateFlight(raw);
      [f.from, f.to].forEach((p) => {
        if (p && p.country && !map.has(p.country)) map.set(p.country, { country: p.country, cc: p.cc, city: p.city, first: f.date });
      });
    });
    return [...map.values()].sort((a, b) => a.country.localeCompare(b.country));
  }


  // ---- Country name -> ISO 3166-1 alpha-2, for expanding AIRPORTS below ----
  const COUNTRY_ISO = {
    "Afghanistan": "af",
    "Albania": "al",
    "Algeria": "dz",
    "American Samoa": "as",
    "Angola": "ao",
    "Anguilla": "ai",
    "Antarctica": "aq",
    "Antigua and Barbuda": "ag",
    "Argentina": "ar",
    "Armenia": "am",
    "Aruba": "aw",
    "Ashmore and Cartier Islands": "at",
    "Australia": "au",
    "Austria": "at",
    "Azerbaijan": "az",
    "Bahamas": "bs",
    "Bahrain": "bh",
    "Baker Island": "fq",
    "Bangladesh": "bd",
    "Barbados": "bb",
    "Belarus": "by",
    "Belgium": "be",
    "Belize": "bz",
    "Benin": "bj",
    "Bermuda": "bm",
    "Bhutan": "bt",
    "Bolivia": "bo",
    "Bonaire, Saint Eustatius and Saba": "bq",
    "Bosnia and Herzegovina": "ba",
    "Botswana": "bw",
    "Bouvet Island": "bv",
    "Brazil": "br",
    "British Indian Ocean Territory": "io",
    "British Virgin Islands": "vg",
    "Brunei Darussalam": "bn",
    "Bulgaria": "bg",
    "Burkina Faso": "bf",
    "Burundi": "bi",
    "Cabo Verde": "cv",
    "Cambodia": "kh",
    "Cameroon": "cm",
    "Canada": "ca",
    "Cayman Islands": "ky",
    "Central African Republic": "cf",
    "Chad": "td",
    "Chile": "cl",
    "China": "cn",
    "Christmas Island": "cx",
    "Clipperton Island": "ip",
    "Cocos (Keeling) Islands": "cc",
    "Colombia": "co",
    "Comoros": "km",
    "Congo (Brazzaville)": "cg",
    "Congo (Kinshasa)": "cd",
    "Congo Republic": "cg",
    "Cook Islands": "ck",
    "Coral Sea Islands": "cr",
    "Costa Rica": "cr",
    "Cote d'Ivoire": "ci",
    "Croatia": "hr",
    "Cuba": "cu",
    "Cyprus": "cy",
    "Czech Republic": "cz",
    "DR Congo": "cd",
    "Denmark": "dk",
    "Djibouti": "dj",
    "Dominica": "dm",
    "Dominican Republic": "do",
    "East Timor": "tl",
    "Ecuador": "ec",
    "Egypt": "eg",
    "El Salvador": "sv",
    "Equatorial Guinea": "gq",
    "Eritrea": "er",
    "Estonia": "ee",
    "Eswatini": "sz",
    "Ethiopia": "et",
    "Europa Island": "eu",
    "Faeroe Islands": "fo",
    "Falkland Islands": "fk",
    "Fiji": "fj",
    "Finland": "fi",
    "France": "fr",
    "French Guiana": "gf",
    "French Polynesia": "pf",
    "French Southern Territories": "tf",
    "Gabon": "ga",
    "Gambia": "gm",
    "Georgia": "ge",
    "Germany": "de",
    "Ghana": "gh",
    "Gibraltar": "gi",
    "Glorioso Islands": "go",
    "Greece": "gr",
    "Greenland": "gl",
    "Grenada": "gd",
    "Guadeloupe": "gp",
    "Guam": "gu",
    "Guatemala": "gt",
    "Guernsey": "gg",
    "Guinea": "gn",
    "Guinea-Bissau": "gw",
    "Guyana": "gy",
    "Haiti": "ht",
    "Heard and McDonald Islands": "hm",
    "Honduras": "hn",
    "Hong Kong": "hk",
    "Howland Island": "hq",
    "Hungary": "hu",
    "Iceland": "is",
    "India": "in",
    "Indonesia": "id",
    "Iran": "ir",
    "Iraq": "iq",
    "Ireland": "ie",
    "Isle of Man": "im",
    "Israel": "il",
    "Italy": "it",
    "Ivory Coast": "ci",
    "Jamaica": "jm",
    "Jan Mayen": "jn",
    "Japan": "jp",
    "Jarvis Island": "dq",
    "Jersey": "je",
    "Johnston Atoll": "jq",
    "Jordan": "jo",
    "Juan de Nova Island": "ju",
    "Kazakhstan": "kz",
    "Kenya": "ke",
    "Kingman Reef": "kq",
    "Kiribati": "ki",
    "Kuwait": "kw",
    "Kyrgyz Republic": "kg",
    "Laos": "la",
    "Latvia": "lv",
    "Lebanon": "lb",
    "Lesotho": "ls",
    "Liberia": "lr",
    "Libya": "ly",
    "Lithuania": "lt",
    "Luxembourg": "lu",
    "Macao": "mo",
    "Macau": "mo",
    "Macedonia": "mk",
    "Madagascar": "mg",
    "Malawi": "mw",
    "Malaysia": "my",
    "Maldives": "mv",
    "Mali": "ml",
    "Malta": "mt",
    "Marshall Islands": "mh",
    "Martinique": "mq",
    "Mauritania": "mr",
    "Mauritius": "mu",
    "Mayotte": "yt",
    "Mexico": "mx",
    "Micronesia": "fm",
    "Micronesia, Fed. Sts.": "fm",
    "Midway Islands": "mq",
    "Moldova": "md",
    "Monaco": "mc",
    "Mongolia": "mn",
    "Montenegro": "me",
    "Montserrat": "ms",
    "Morocco": "ma",
    "Mozambique": "mz",
    "Myanmar": "mm",
    "Namibia": "na",
    "Nauru": "nr",
    "Navassa Island": "bq",
    "Nepal": "np",
    "Netherlands": "nl",
    "Netherlands Antilles": "an",
    "New Caledonia": "nc",
    "New Zealand": "nz",
    "Nicaragua": "ni",
    "Niger": "ne",
    "Nigeria": "ng",
    "Niue": "nu",
    "Norfolk Island": "nf",
    "North Korea": "kp",
    "Northern Mariana Islands": "mp",
    "Norway": "no",
    "Oman": "om",
    "Pakistan": "pk",
    "Palau": "pw",
    "Palestine": "ps",
    "Palmyra Atoll": "lq",
    "Panama": "pa",
    "Papua New Guinea": "pg",
    "Paracel Islands": "pf",
    "Paraguay": "py",
    "Peru": "pe",
    "Philippines": "ph",
    "Pitcairn": "pn",
    "Poland": "pl",
    "Portugal": "pt",
    "Puerto Rico": "pr",
    "Qatar": "qa",
    "Reunion": "re",
    "Romania": "ro",
    "Russia": "ru",
    "Rwanda": "rw",
    "Samoa": "ws",
    "Sao Tome and Principe": "st",
    "Saudi Arabia": "sa",
    "Senegal": "sn",
    "Serbia": "rs",
    "Seychelles": "sc",
    "Sierra Leone": "sl",
    "Singapore": "sg",
    "Slovakia": "sk",
    "Slovenia": "si",
    "Solomon Islands": "sb",
    "Somalia": "so",
    "South Africa": "za",
    "South Georgia and South Sandwich Is.": "gs",
    "South Korea": "kr",
    "South Sudan": "ss",
    "Spain": "es",
    "Spratly Islands": "pg",
    "Sri Lanka": "lk",
    "St. Helena": "sh",
    "St. Kitts and Nevis": "kn",
    "St. Lucia": "lc",
    "St. Pierre and Miquelon": "pm",
    "St. Vincent and the Grenadines": "vc",
    "Sudan": "sd",
    "Suriname": "sr",
    "Svalbard and Jan Mayen Islands": "sj",
    "Swaziland": "sz",
    "Sweden": "se",
    "Switzerland": "ch",
    "Syria": "sy",
    "Taiwan": "tw",
    "Tajikistan": "tj",
    "Tanzania": "tz",
    "Thailand": "th",
    "Timor-Leste": "tl",
    "Togo": "tg",
    "Tokelau": "tk",
    "Tonga": "to",
    "Trinidad and Tobago": "tt",
    "Tromelin Island": "te",
    "Tunisia": "tn",
    "Turkey": "tr",
    "Turkmenistan": "tm",
    "Turks and Caicos Islands": "tc",
    "Tuvalu": "tv",
    "Uganda": "ug",
    "Ukraine": "ua",
    "United Arab Emirates": "ae",
    "United Kingdom": "gb",
    "United States": "us",
    "United States Virgin Islands": "vi",
    "Uruguay": "uy",
    "Uzbekistan": "uz",
    "Vanuatu": "vu",
    "Venezuela": "ve",
    "Vietnam": "vn",
    "Virgin Islands": "vi",
    "Wake Island": "wq",
    "Wallis and Futuna Islands": "wf",
    "Western Sahara": "eh",
    "Yemen": "ye",
    "Zambia": "zm",
    "Zimbabwe": "zw",
    // A few OpenFlights "Country" spellings that differ from the ISO list above.
    "Saint Helena": "sh", "Cape Verde": "cv", "Saint Pierre and Miquelon": "pm",
    "Wallis and Futuna": "wf", "Saint Kitts and Nevis": "kn", "Saint Lucia": "lc",
    "Saint Vincent and the Grenadines": "vc", "Kyrgyzstan": "kg",
    "Faroe Islands": "fo", "Burma": "mm", "Brunei": "bn",
  };

  // ---- Full-world airport database, merged in at runtime ----
  // AIRPORTS above is a hand-picked, always-available fallback (curated
  // names, instant on load, no network needed). This fetches the public
  // OpenFlights database (~6000 airports with IATA codes) once, caches the
  // parsed result in localStorage, and merges in every code we don't
  // already have — so first-run search still works instantly, and everyone
  // gets full world coverage within a second or two, without shipping
  // several hundred KB of airport data in this file. Mirrors how
  // globe.jsx already fetches country borders from the same GitHub host.
  const AIRPORTS_DB_URL = "https://raw.githubusercontent.com/jpatokal/openflights/master/data/airports.dat";
  const AIRPORTS_CACHE_KEY = "fa-airports-db-v1";

  // Keep non-critical parsing and network work off the interaction path. The
  // curated lists already work immediately; the full databases are requested
  // only when the add-flight workflow actually needs global search coverage.
  function deferIdle(fn) {
    if (typeof requestIdleCallback === "function") requestIdleCallback(fn, { timeout: 3000 });
    else setTimeout(fn, 1200);
  }

  function parseCsvLine(line) {
    const out = [];
    let field = "", inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (inQuotes) {
        if (c === '"') {
          if (line[i + 1] === '"') { field += '"'; i++; }
          else inQuotes = false;
        } else field += c;
      } else if (c === '"') {
        inQuotes = true;
      } else if (c === ",") {
        out.push(field); field = "";
      } else {
        field += c;
      }
    }
    out.push(field);
    return out;
  }

  // Processes a big line array in small time-boxed slices (via
  // requestIdleCallback, falling back to setTimeout where it's unavailable,
  // e.g. Safari) so parsing several thousand CSV rows never blocks the main
  // thread for more than a few ms at a stretch — measured ~50ms if done in
  // one synchronous pass, enough to visibly stutter the globe/animations.
  function processLinesChunked(lines, perLine) {
    return new Promise((resolve) => {
      let i = 0;
      const now = () => (typeof performance !== "undefined" && performance.now ? performance.now() : Date.now());
      const schedule = typeof requestIdleCallback === "function"
        ? (cb) => requestIdleCallback(cb, { timeout: 200 })
        : (cb) => setTimeout(cb, 0);
      function step() {
        const start = now();
        while (i < lines.length) {
          perLine(lines[i]);
          i++;
          if (now() - start > 6) break; // yield back after ~6ms of work
        }
        if (i < lines.length) schedule(step);
        else resolve();
      }
      schedule(step);
    });
  }

  // Parses OpenFlights' airports.dat rows (id,name,city,country,iata,icao,
  // lat,lng,alt,tz,dst,tzdb,type,source), keeping only codes we don't
  // already have. Resolves with just the added entries (what gets cached).
  async function mergeAirportRows(text) {
    const added = {};
    const lines = text.split("\n");
    await processLinesChunked(lines, (rawLine) => {
      const line = rawLine.trim();
      if (!line) return;
      const row = parseCsvLine(line);
      const iata = row[4];
      if (!/^[A-Z]{3}$/.test(iata) || AIRPORTS[iata]) return;
      if (row[12] && row[12] !== "airport") return;
      const lat = parseFloat(row[6]), lng = parseFloat(row[7]);
      if (!isFinite(lat) || !isFinite(lng)) return;
      const country = row[3] || "";
      added[iata] = { city: row[2] || iata, name: row[1] || iata, country, cc: COUNTRY_ISO[country] || "", lat, lng };
    });
    Object.assign(AIRPORTS, added);
    return added;
  }

  let airportDatabasePromise = null;
  function loadFullAirportDatabase() {
    if (airportDatabasePromise) return airportDatabasePromise;

    airportDatabasePromise = new Promise((resolve) => deferIdle(resolve))
      .then(() => {
        try {
          const cached = localStorage.getItem(AIRPORTS_CACHE_KEY);
          if (cached) { Object.assign(AIRPORTS, JSON.parse(cached)); return null; }
        } catch (e) { /* corrupt cache — fall through to a fresh fetch */ }

        return fetch(AIRPORTS_DB_URL)
          .then((r) => (r.ok ? r.text() : Promise.reject(new Error("HTTP " + r.status))))
          .then((text) => mergeAirportRows(text))
          .then((added) => {
            try { localStorage.setItem(AIRPORTS_CACHE_KEY, JSON.stringify(added)); } catch (e) { /* storage full/private mode — fine, just won't cache */ }
            return null;
          });
      })
      .catch(() => { /* offline or blocked — the curated ~316 above still work fine */ });
    return airportDatabasePromise;
  }

  // ---- Full airline list, merged in at runtime (same approach as airports) ----
  // OpenFlights' airlines.dat also carries a lot of defunct operators and
  // duplicate/reused codes, so this only fills in codes our curated list
  // doesn't already have, and only ones flagged "active" — the curated list
  // still wins on any conflict (e.g. JX staying STARLUX Airlines).
  const AIRLINES_DB_URL = "https://raw.githubusercontent.com/jpatokal/openflights/master/data/airlines.dat";
  const AIRLINES_CACHE_KEY = "fa-airlines-db-v1";

  async function mergeAirlineRows(text) {
    const added = [];
    const seen = new Set(AIRLINES.map((a) => a.code));
    const lines = text.split("\n");
    await processLinesChunked(lines, (rawLine) => {
      const line = rawLine.trim();
      if (!line) return;
      const row = parseCsvLine(line);
      // id,name,alias,iata,icao,callsign,country,active
      const iata = row[3], active = row[7];
      if (active !== "Y" || !/^[A-Z0-9]{2}$/.test(iata) || seen.has(iata)) return;
      seen.add(iata);
      added.push({ code: iata, name: row[1] || iata });
    });
    added.forEach((a) => { AIRLINES.push(a); AIRLINE_CODES.set(a.code, a.name); });
    return added;
  }

  let airlineDatabasePromise = null;
  function loadFullAirlineDatabase() {
    if (airlineDatabasePromise) return airlineDatabasePromise;

    airlineDatabasePromise = new Promise((resolve) => deferIdle(resolve))
      .then(() => {
        try {
          const cached = localStorage.getItem(AIRLINES_CACHE_KEY);
          if (cached) {
            const list = JSON.parse(cached);
            list.forEach((a) => { AIRLINES.push(a); AIRLINE_CODES.set(a.code, a.name); });
            return null;
          }
        } catch (e) { /* corrupt cache — fall through to a fresh fetch */ }

        return fetch(AIRLINES_DB_URL)
          .then((r) => (r.ok ? r.text() : Promise.reject(new Error("HTTP " + r.status))))
          .then((text) => mergeAirlineRows(text))
          .then((added) => {
            try { localStorage.setItem(AIRLINES_CACHE_KEY, JSON.stringify(added)); } catch (e) { /* storage full/private mode — fine, just won't cache */ }
            return null;
          });
      })
      .catch(() => { /* offline or blocked — the curated ~105 above still work fine */ });
    return airlineDatabasePromise;
  }

  let referenceDataPromise = null;
  function loadReferenceData() {
    if (!referenceDataPromise) {
      referenceDataPromise = Promise.all([
        loadFullAirportDatabase(),
        loadFullAirlineDatabase(),
      ]).then(() => undefined);
    }
    return referenceDataPromise;
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

  export const ATLAS = {
    AIRPORTS, AIRLINES, AIRLINE_CODES, FLIGHTS, YEARS,
    statsFor, countryList, distKm, durMin, sinceOf, homeOf, hydrateFlight, loadReferenceData,
    // name/handle fall back to these only when not signed in; a Google login overrides them.
    profile: { name: "Traveler", handle: "@traveler", home: "—", since: new Date().getFullYear() },
  };
