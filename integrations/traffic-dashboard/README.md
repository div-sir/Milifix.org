# Taiwan occupant protection and crash history

Public route: https://milifix.com/traffic-dashboard/

The primary view separates the requested real-world passenger fatality metric (currently unavailable) from official TNCAP occupant-protection test scores. It never converts a test score or an insurer claim frequency into a probability of death or survival.

`public/traffic-dashboard/index.html` embeds seven reviewed datasets and its standard Data runtime. Transient local task metadata is stripped. The public route has no dependency on the private ChatGPT Sites deployment. Browser-local filters, source inspection, charts and presentation controls remain available; Sites Worker owner editing and cloud refresh are not part of this static route.

## Occupant protection

- Official result list: https://www.tncap.org.tw/SafetyRatings/Result
- 30 standard-equipment assessments from 2023–2026, each retaining the official detail-report link, evaluation year, manufacturer and model, and the four published field scores.
- First-edition assessments (25, 2023–2025) and second-edition assessments (5, 2026) are separate cohorts. Selecting All protocols suppresses comparison charts while retaining the exact table. Do not interpret score changes between protocol editions as changes in mortality.
- Scores are not survival percentages. Adult protection includes drivers and passengers and the additional items required by the applicable protocol. Consult each report for tested trim, model-year/VIN scope and collision details; an evaluation year does not imply coverage of every vehicle with that name.
- The real-world metric requires passenger-level 30-day outcomes linked to the occupied vehicle, complete passenger exposure (including uninjured survivors), model/year and an independent comparable crash-severity definition. An A1-only population conditions on a fatal outcome and is not all serious impacts. Whole-crash deaths may be pedestrians or occupants of another vehicle.

## Five-year police history

| Year | Official dataset | A1+A2 accidents | A1 accidents | Deaths within 24h | Injuries |
| --- | --- | ---: | ---: | ---: | ---: |
| 2021 | https://data.gov.tw/dataset/158865 | 358,221 | 1,806 | 1,860 | 477,367 |
| 2022 | https://data.gov.tw/dataset/161199 | 375,844 | 1,809 | 1,846 | 500,356 |
| 2023 | https://data.gov.tw/dataset/167905 | 403,085 | 1,753 | 1,799 | 540,924 |
| 2024 | https://data.gov.tw/dataset/172969 | 393,883 | 1,673 | 1,714 | 525,628 |
| 2025 | https://data.gov.tw/dataset/177136 | 403,393 | 1,606 | 1,642 | 536,740 |

The history query contains all 60 months at month × county × A1/A2 grain, counted once per first-party record. Fatalities/injuries are whole-crash outcomes, not occupant outcomes attributable to a manufacturer. No A3 property-only crashes or 30-day deaths are mixed in. Same-time/location records are not speculatively merged without an official event ID.

The detailed vehicle, collision and registration-normalized involvement tabs remain explicitly scoped to 2025. Insurance background remains limited to the 2024 report's type-B body insurance for private passenger cars, 103 original manufacturer/origin categories: 248,303 incurred claims and 1,057,870 earned vehicles. It is not a crashworthiness ranking.

## Updates and validation

The source inspector retains the exact successful download URLs, counting methods, definitions and limitations. Authored React/CSS is retained here for future revisions with the supported Data app scaffold. Do not edit the bundled runtime by hand. Rebuild with the Data skill and use `data-app.mjs export-offline` to replace the public artifact; remove transient local-task metadata before publication.

The route-scoped CSP permits `data:` scripts because the official offline export uses a bundled runtime data URI. Other route policies are unchanged. The complete seed snapshot SHA-256 is `d1a03f109d25d8300c6dc871a3bc90efc5750b85aa4ab68b486397397513f22a`.
