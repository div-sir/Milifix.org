# Taiwan traffic dashboard

Public route: https://milifix.com/traffic-dashboard/

`public/traffic-dashboard/index.html` is the complete standalone export of the reviewed dashboard. The export’s transient local task metadata is stripped before publication. It embeds all five datasets and its runtime; it does not iframe, redirect to, or fetch data from the private ChatGPT Sites deployment. Filters, chart exploration, source inspection, and browser-local presentation controls remain available. Shared owner-only editing and cloud refresh from the Sites Worker are not provided by this static route.

## Evidence

- 2025 police A1/A2 data: https://data.gov.tw/dataset/177136 — 403,393 first-party accident records, 1,642 deaths within 24 hours, 536,740 injuries. A3 property-only crashes and 30-day deaths are outside this dataset. A first party is not a legal fault determination.
- 2025 registered vehicles: https://data.gov.tw/dataset/14208 — monthly national counts for six matching vehicle classes. The rate divides selected-period vehicle involvements by the mean month-end registered population; it is not an individual crash probability or a mileage-adjusted safety ranking. County filters suppress the rate because county-level denominators are not supplied.
- 2024 insurance report, table 17, PDF pages 84–88: https://www.nlia.org.tw/wp-content/uploads/doc/auto/113年度汽車保險概況及檢討報告.pdf — 103 original manufacturer/origin categories, 248,303 incurred claims, 1,057,870 earned vehicles. Limited to private passenger cars with the specified type-B body policy, excluding add-ons. Claim frequency is not police crash incidence; country/manufacturer labels are preserved without speculative brand consolidation. Motorcycle brands are not covered.
- Model-level crash data remains unavailable. The model page says so and supplies an empty CSV schema; no invented observations are included.

The public page's source inspector carries transformations, definitions, source links, coverage, and limitations. The matching authored dashboard content is retained here for future revisions. A new build must use the Data app skill's supported runtime and reviewed snapshot; do not edit the compiled runtime by hand. Generate the standalone artifact through `data-app.mjs export-offline` and replace the public file after verification.

The route-scoped CSP permits `data:` scripts because the standard offline exporter embeds its bundled runtime as a data URI. The site's global policy is unchanged. The sitemap and multilingual project homepages link the public route.

The immutable seed snapshot SHA-256 is `7f914eecc701f91b648a2a4fcadefe406d459a562e8b09119cf2dfa23f87511c`.
