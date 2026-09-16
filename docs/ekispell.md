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
