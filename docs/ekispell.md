# EkiSpell page

Route: https://milifix.com/ekispell/

The standalone static app lives in `public/ekispell`. Astro copies it into the deployment. The platform homepage links to this route. Vercel redirects the path without a trailing slash to keep relative module and data URLs correct.

The checked-in release pins EkiSpell commit `2163cc48db5229af3fa684c8142cbd7944fdfcef`. Production builds do not download upstream code. All station data is served from the same origin and verified by the upstream SHA-256 loader. The source and StationAPI MIT notices are included.

To update, review a new upstream commit, update the revision in `scripts/sync-ekispell.mjs`, then run `node scripts/sync-ekispell.mjs /absolute/path/to/clean/EkiSpell`. The script compiles upstream TypeScript with this site's pinned compiler. It adds the MILIFIX backlink, canonical URL, description, and license links. Review the generated diff. Run the site checks, build, and EkiSpell desktop/mobile browser test before deployment.

The app keeps upstream limitations: inferred printer names are unverified, IC coverage is scoped, and the preview is not a verified journey. Uploaded JSON is processed in the browser.

The hosted UI is maintained in `integrations/ekispell/` (HTML, CSS, and app.js). The importer copies these files while continuing to compile the pinned upstream core and data loader. Keep the hosted copies equal to these sources. Browser drafts use localStorage and are revalidated on restore; custom catalogs require JSON export. Text/PDF outputs are planning drafts, not tickets or verified journeys.

## Station map

The map opens on demand and follows selected stations. StationAPI coordinates use the same pinned revision as the name catalog and are keyed by exact station identity. Repeated/coincident stations share a marker and list all row numbers. Unknown/custom stations without matched identities have no marker. Coordinates represent stations, not entrances. No route lines or fares are inferred.

Run `python scripts/sync-ekispell-coordinates.py /path/to/clean/StationAPI` to regenerate coordinates from the pinned CSV. The map runtime is self-hosted Leaflet 1.9.4 (BSD-2-Clause; notice in vendor/LICENSE). Browser-requested OpenStreetMap tiles retain normal browser caching and visible attribution. No tile prefetch or offline download is implemented. Tile failures keep the station list available. Browser tests stub tiles to avoid consuming the public service.

## Line-transfer candidates

The route panel uses the full loaded StationAPI catalog. A breadth-first search minimizes line changes between each pair of selected stations, in receipt chronological order. Groups connect only by exact `sourceGroupId`; station names and proximity do not create links. Each endpoint retains its operator-specific line membership. Unknown stations and unmatched characters do not get skipped.

This is a **line-membership graph**, not a track adjacency graph. StationAPI's pinned `8!connections.csv` contains only a header. We do not infer neighboring stations from station codes. A shared line does not guarantee a through train; branches, service gaps, and same-group walks need verification. No time, fare, IC journey validity, or receipt-producing transaction is calculated. Dashed map links show boarding/interchange/alighting points only. Per-leg Google Maps transit links allow users to check current services. The topology uses the existing MIT StationAPI attribution and requires no new API key.

### Route conditions

All route conditions apply together. Users can set a per-leg line-change limit, avoid Shinkansen, forbid operator changes, and exclude multiple operators or exact line IDs. Conditions filter the graph before search; they never remove an unwanted segment from a completed path or fall back to an unrestricted result. Endpoint exclusions and constrained no-match results have separate messages. Same-station legs require no ride. Limits count line changes, not actual train changes, and each leg is optimized independently.

Shinkansen IDs come from active `line_type=1` rows in the pinned StationAPI `data/2!lines.csv` (1002–1012). They are not guessed from names. Other paid express services are not classified. Update this list when updating the source snapshot.

Conditions persist separately under `ekispell-route-options-v1`; invalid saved values fall back to defaults. They are not part of the existing layout JSON export. Search narrows the exclusion pickers but preserves added exclusions. Google Maps links carry endpoints only and do not carry these conditions. Existing IC card filters apply to selected message stations, not the full route.

### Tokyo Metro transaction-planning pilot

The separate Metro panel uses nine official line station lists, transcribed in
`integrations/ekispell/metro-evidence.json` (checked 2026-09-17), and 144 exact
operator/name/line identities from the pinned StationAPI projection. Regenerate
with `python scripts/build-ekispell-metro.py`. The Marunouchi branch explicitly
joins at Nakano-sakaue; HTML table row adjacency is not rail adjacency.

Each modeled edge represents a separate entry, ordinary-train ride on one Metro
line, and exit. Branch rides may require changing trains. No through service past
Metro endpoints, group-based walks, or free transfers are inferred. The planner
minimizes record count, not time, distance, or fare. It respects selected card
support evidence, excluded operators/lines, entry/exit field, print order, and
history capacity. Optional interleaved extra records are identified explicitly.

Official station order and PASMO acceptance are evidence; the transaction and
printer model remains unverified. Transfer-gate reentry may continue a transaction
instead of producing another record. Ticket products and other card transactions
may change history. Actual print labels, fare, timetables, and printer availability
are not verified. The table uses source station names, not asserted print strings.
A text export and schematic adjacent-stop map support reviewing the model.

### History retention and transaction review

The Metro example button replaces the draft with `銀京`, selects exact Metro
Ginza/Kyobashi station identities, sets PASMO/entry/oldest-first, clears route
conditions, and plans Ginza → Kyobashi → Nihombashi. The UI explains the replacement
before the user clicks. It does not mark the example as field-tested.

`journey-review.js` checks chronological retention separately from print order.
The user enters additional history records expected after the modeled journey.
For PASMO, capacity is the smaller of the selected format and the general 20-record
limit. Some operators support 100 records within 26 weeks; this UI does not assume
that equipment. Other cards use the selected format as an explicitly unverified
capacity assumption. Older history outside the plan is not rendered. Prefix,
interleaved and suffix positioning records count toward the same capacity; only
loss of a target letter makes the message incomplete. Exports include the current
retention assumptions and any missing letters. Invalid input disables export.

Line-change and return-trip boundaries are prompts to verify separate settlement,
not claims about whether particular gates merge transactions. No waiting duration
is recommended as a guarantee. Any change to the route context invalidates the
review and export. A future record count updates the review without rerouting.

Official sources checked 2026-09-18:
- https://www.pasmo.co.jp/about/service/history/ — general 20-record limit, optional
  100-record equipment, commuter-section omissions, recharge/purchase types,
  transfer type, and station-name limitations outside the PASMO/Suica area.
- https://www.tokyometro.jp/ticket/types/pasmo/index.html — qualifying out-of-gate
  transfers within 60 minutes can continue fare calculation.

These rules do not validate actual station abbreviations, printer column widths,
per-gate settlement, fares, timetables, or a physical receipt. No card number or
travel history is uploaded by this review.
