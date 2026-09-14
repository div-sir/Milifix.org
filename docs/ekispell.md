# EkiSpell page

Route: https://milifix.com/ekispell/

The standalone static app lives in `public/ekispell`. Astro copies it into the deployment. The platform homepage links to this route. Vercel redirects the path without a trailing slash to keep relative module and data URLs correct.

The checked-in release pins EkiSpell commit `2163cc48db5229af3fa684c8142cbd7944fdfcef`. Production builds do not download upstream code. All station data is served from the same origin and verified by the upstream SHA-256 loader. The source and StationAPI MIT notices are included.

To update, review a new upstream commit, update the revision in `scripts/sync-ekispell.mjs`, then run `node scripts/sync-ekispell.mjs /absolute/path/to/clean/EkiSpell`. The script compiles upstream TypeScript with this site's pinned compiler. It adds the MILIFIX backlink, canonical URL, description, and license links. Review the generated diff. Run the site checks, build, and EkiSpell desktop/mobile browser test before deployment.

The app keeps upstream limitations: inferred printer names are unverified, IC coverage is scoped, and the preview is not a verified journey. Uploaded JSON is processed in the browser.
