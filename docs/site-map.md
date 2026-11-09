# Milifix.com Site Map & Application Registry v1.1

Last verified: 2026-11-09 (America/Phoenix)  
Repository: [`div-sir/Milifix.org`](https://github.com/div-sir/Milifix.org)  
Application source baseline (parent of this docs-only change): `main` @ `c21a5ee3dfbbfe41247bf738d16ab88ba3a5160f`  
Production origin: <https://milifix.com>

This is the maintenance source of truth for the public routes, deployable applications,
serverless endpoints, and external dependencies contained in this repository. It records
what was verified from `main`, the Vercel project, a production build, and live HTTP
responses. Items that could not be verified are explicitly marked **Unverified**.

## Verification vocabulary

| Label | Meaning |
| --- | --- |
| **Verified: source** | Confirmed in the referenced file on the recorded `main` commit. |
| **Verified: build** | Generated successfully by a local production build using the public production CMS URL. |
| **Verified: production** | Confirmed from the Vercel project/deployment record or an HTTP request to `milifix.com`. |
| **Unverified** | Not exposed by the available read-only evidence, not inspected, or dependent on secret/runtime state. |

Do not convert an **Unverified** item into a fact without recording the evidence and
updating the verification date and commit above.

## Deployment snapshot

| Item | Verified value | Evidence/status |
| --- | --- | --- |
| Vercel project | `milifix-org` (`prj_IL4zAf1KHKQAtVAqiVwYX2i5zxHw`) | **Verified: production** |
| Framework / Node.js | Astro / Node.js `24.x` | **Verified: production** from Vercel project metadata; repository engine is `>=24 <25`. |
| Production deployment | `dpl_14c63Q92D5iciRUx6gaadiMYKxxP` | **Verified: production**, `READY`; built from `main` at the exact commit recorded above. |
| Production deployment time | 2026-10-25 03:27–03:28 MST | **Verified: production** from Vercel build and ready timestamps. |
| Production aliases | `milifix.com`, `milifix-org.vercel.app`, `milifix-org-soliliums-projects.vercel.app`, `milifix-org-git-main-soliliums-projects.vercel.app` | **Verified: production** from the production deployment. |
| Custom domain | `milifix.com` | **Verified: production**; Vercel reports it verified and HTTPS requests succeed. |
| Output model | Astro static output plus Vercel Functions under `api/` | **Verified: source/build**. |
| Local production build | 204 Astro pages | **Verified: build** on 2026-11-09 with `CMS_URL=https://milifix-cms.onrender.com`; standalone files under `public/` are copied in addition. |

The newest deployments visible during verification were `READY` previews from
`feat/eventlab-apple-tesla`. They are not production, are not on the recorded `main`
commit, and are therefore intentionally excluded from this registry.

## System boundary

```text
Payload CMS on Render ── build-time REST reads ──> Astro static site
         ^                                      ├─ localized pages
         └─ Konbini POSTs via Vercel Functions ├─ three standalone static apps
                                                └─ sitemap and static assets

Browser ── optional Google Identity ──> Konbini submission auth
Browser ── optional Google Drive appData sync ──> Meridiel
Vercel Git integration / deploy hook ──> production and preview builds
```

The CMS is a separate deployment and repository. This document verifies the frontend
contract in this repository; it does not claim to verify the CMS schema, migrations,
RBAC, webhook, or backup state.

## Route registry

### Astro pages

`{lang}` below means English with no prefix, Traditional Chinese at `/zh`, and Japanese
at `/ja`, unless the row states a smaller language set. Trailing-slash variants may be
normalized by Vercel/Astro.

| Route family | Languages | Source of route/data | Status |
| --- | --- | --- | --- |
| `/`, `/zh/`, `/ja/` | en, zh, ja | `src/pages/{index,zh/index,ja/index}.astro` | **Verified: source/build/production** (HTTP 200). |
| `/{space}`, `/zh/{space}`, `/ja/{space}` | en, zh, ja | `src/pages/[space]/index.astro`; registry in `src/data/spaces.ts` | **Verified** for `solilium` and `voidlane` (HTTP 200). |
| `/{space}/{slug}` with localized equivalents | en, zh, ja | Payload `works` via `src/lib/cms.ts` | **Verified: build/production**; current slugs are CMS-controlled and must not be hard-coded here. |
| `/blog` and localized equivalents | en, zh, ja | `src/pages/**/blog/index.astro`; Payload `posts` | **Verified: build/production** (HTTP 200). |
| `/blog/{...slug}` and localized equivalents | en, zh, ja | Payload `posts`; translated text also uses `src/data/post-translations.json` | **Verified: build/production**; paths are CMS-controlled and can contain multiple segments. |
| `/lumiveil` and localized equivalents | en, zh, ja | `src/pages/**/lumiveil.astro` | **Verified: source/build/production** (HTTP 200). |
| `/reports` and localized equivalents | en, zh, ja | `src/data/trips/index.ts` | **Verified: source/build/production** (HTTP 200). |
| `/reports/japan-jr-pass-2026` and localized equivalents | en, zh, ja | `src/data/trips/japan-jr-pass-2026.ts` | **Verified: source/build/production** (HTTP 200); this is the only checked-in report at verification time. |
| `/zh/travel` | zh only | `src/pages/zh/travel/index.astro`; Payload travel collections | **Verified: build/production** (HTTP 200). `/travel` redirects here. |
| `/zh/travel/cards/{slug}` | zh only | Payload `credit-cards` | **Verified: build/production**. |
| `/zh/travel/lounges/{slug}` | zh only | Payload `lounges` | **Verified: build/production**. |
| `/zh/travel/programs/{slug}` | zh only | Payload `programs` | **Verified: build/production**. |
| `/zh/travel/airlines/{slug}` | zh only | `src/pages/zh/travel/airlines/[slug].astro` | **Verified: source** as intentionally disabled: `getStaticPaths()` returns an empty array, so no pages are generated. |
| `/konbini`, `/zh/konbini` | en, zh | Payload approved products/reviews | **Verified: build/production** (HTTP 200). |
| `/konbini/{slug}`, `/zh/konbini/{slug}` | en, zh | Payload approved product slugs | **Verified: build/production**; current slugs are CMS-controlled. |
| `/konbini/new`, `/zh/konbini/new` | en, zh | Astro form plus Vercel Functions | **Verified: build/production**. |
| `/privacy`, `/zh/privacy`; `/terms`, `/zh/terms` | en, zh | `src/pages` policy pages | **Verified: source/build/production** (HTTP 200). No Japanese policy routes exist on `main`. |
| `/linktree` | one route | `src/pages/linktree.astro` | **Verified: source/build/production** (HTTP 200); deliberately `noindex` and filtered from the sitemap. |
| `/404.html` | one route | `src/pages/404.astro` | **Verified: source/build**. |

### Standalone static applications

These are copied from `public/` into the same Vercel deployment. They are not separate
Vercel projects.

| Application | Public route | Implementation / data | Status |
| --- | --- | --- | --- |
| Meridiel | `/meridiel/` | Static React/JSX application in `public/meridiel`; `npm run prebuild` compiles the checked-in source into `app/compiled/app.bundle.js`. Local-first flight data, optional Google Drive `appDataFolder` sync, same-origin pinned reference data. | **Verified: source/build/production**; `/meridiel` returns 308 to the slash route, which returns 200. Not currently included in the generated sitemap. |
| EkiSpell | `/ekispell/` | Static app in `public/ekispell`; upstream `div-sir/EkiSpell` is pinned by `public/ekispell/release.json` to commit `2163cc48db5229af3fa684c8142cbd7944fdfcef`. Same-origin StationAPI snapshot and self-hosted Leaflet; browser drafts use `localStorage`. | **Verified: source/build/production**; `/ekispell` returns 308 and the slash route returns 200. Explicitly added to the sitemap. |
| Taiwan occupant-protection and crash dashboard | `/traffic-dashboard/` | Single generated static data application at `public/traffic-dashboard/index.html`; the file contains the report runtime and embedded data snapshot. The embedded source metadata was executed 2026-10-17 and covers 2021–2025. | **Verified: source/build/production**; `/traffic-dashboard` returns 308 and the slash route returns 200. Explicitly added to the sitemap. Generation source outside this checked-in HTML is **Unverified**. |

### Vercel Functions

| Endpoint | Expected method | Responsibility | Status |
| --- | --- | --- | --- |
| `/api/konbini-submit` | POST | Create a pending review and upload sanitized submission media. | **Verified: source/production**; unauthenticated GET returns 405. End-to-end authenticated write was not performed. |
| `/api/konbini-propose-product` | POST | Create a pending product and its first pending review. | **Verified: source**; end-to-end write is **Unverified**. |
| `/api/konbini-report` | POST | Create a Konbini issue report; login is not required. | **Verified: source**; end-to-end write is **Unverified**. |
| `api/_*.js` | not public application routes | Shared CMS, authentication, image, validation, origin, and rate-limit modules. | **Verified: source**. |

## Canonical redirects

The complete redirect list lives in `vercel.json`. The maintained route families are:

- Missing trailing slashes for the three standalone apps redirect to their slash routes.
- `/EkiSpell`, `/Meridiel`, and `/Meridiel/{path}` normalize legacy capitalization.
- `/travel` and `/travel/{path}` redirect to `/zh/travel`.
- `/zh/travel/reports` redirects to `/zh/reports`.
- Former travel list pages redirect to anchors on `/zh/travel`.
- Two former program slugs redirect to their canonical Hilton and Marriott program slugs.

All redirect rules were verified from source. Representative production redirects
(`/travel`, `/ekispell`, `/meridiel`, and `/traffic-dashboard`) returned HTTP 308.

## Sitemap behavior

`@astrojs/sitemap` generates `sitemap-index.xml` and `sitemap-0.xml` from the production
build. CMS-backed slugs reflect the CMS snapshot available at build time.

- `linktree` is intentionally excluded.
- `/ekispell/` and `/traffic-dashboard/` are explicitly added through `customPages`.
- `/meridiel/` is live and linked by the site but is not in `customPages`, so it was
  absent from the verified production sitemap. This document records the current state;
  it does not assume whether the omission is intentional.
- API endpoints and the 404 page are not public sitemap entries.

## Application registry

| ID | Surface | Delivery unit | Primary dependencies | Current status |
| --- | --- | --- | --- | --- |
| `platform-home` | Home, navigation, legal, linktree | Astro static pages | Local source and UI dictionaries | Production verified. |
| `portfolio-spaces` | Solilium and Voidlane index/detail pages | Astro static pages generated at build | Payload `works`, UploadThing-hosted media referenced by CMS | Production verified; content inventory varies by CMS snapshot. |
| `blog` | Three-language blog | Astro static pages generated at build | Payload `posts`, checked-in translation JSON | Production verified. Build reported an unknown CMS bucket (`其他 · 未分類`) and used the fallback category. |
| `lumiveil` | Product landing page | Astro static page | Local source | Production verified; no application backend is present in this repository. |
| `trip-reports` | Localized report index/detail | Astro static pages | Checked-in TypeScript trip registry and local assets | Production verified; one report registered. |
| `travel` | Taiwanese card/travel benefit explorer | Astro static pages generated at build | Payload cards, lounges, programs, airlines; remote media | Production verified. Airline detail generation is disabled on `main`. |
| `konbini` | Product/review browsing and submissions | Astro static pages + three Vercel Functions | Payload CMS, Google Identity, optional shared Redis rate limit, UploadThing through CMS | Read routes and function presence verified; authenticated write flow not exercised. |
| `meridiel` | Personal flight atlas | Standalone static app in the main deployment | Browser storage, optional Google Identity/Drive, pinned same-origin datasets | Production verified; multi-device conflict handling and other open work remain tracked in `docs/MERIDIEL_ROADMAP.md`. |
| `ekispell` | Station/route/message planning tool | Standalone static app in the main deployment | Pinned EkiSpell and StationAPI data, Leaflet, browser storage, map tiles | Production verified; limitations and update procedure live in `docs/ekispell.md`. |
| `traffic-dashboard` | Occupant-protection/crash data report | Standalone generated HTML in the main deployment | Embedded snapshot and same-origin runtime | Production verified; upstream generation pipeline is unverified from this repository. |

## Dependency and configuration registry

| Dependency/configuration | Used by | Verified state |
| --- | --- | --- |
| Payload CMS at `https://milifix-cms.onrender.com` | Build-time content and Konbini writes | **Verified:** public `/api/posts` returned 200 on 2026-11-09. Vercel has `CMS_URL` configured for preview and production, but its secret value was not decrypted. CMS code/schema/migrations are **Unverified**. |
| `KONBINI_SUBMIT_API_KEY` | Konbini Functions to write pending records | **Verified:** key exists as a Vercel sensitive variable for preview and production. Value and write permission are **Unverified**. |
| `GOOGLE_OAUTH_CLIENT_ID`, `PUBLIC_GOOGLE_OAUTH_CLIENT_ID` | Konbini Google ID-token flow | **Verified:** both exist as Vercel sensitive variables for preview and production. OAuth console configuration and complete sign-in flow are **Unverified**. |
| Meridiel Google client and Drive API | Optional Drive app-data sync | **Verified: source:** client ID and Drive scope are compiled into the static app. Live sign-in/sync was not exercised. |
| Upstash/KV REST variables | Cross-instance Konbini rate limiting | **Unverified/not present** in the Vercel environment-variable list returned during this check. Source falls back to an in-process `Map`, which is not shared between instances. |
| `RATE_LIMIT_KEY_SALT` | Hashes rate-limit IP keys | **Unverified/not present** in the returned Vercel variable list. Source therefore has a fixed fallback string unless supplied by another runtime mechanism. |
| `ALLOWED_PREVIEW_HOSTS` | Optional exact preview-origin allowlist | Not present in the returned Vercel variable list; this is valid when no extra preview hosts should be allowed. |
| `PASS_*` and Apple credential variables | No reference found in current `main` source | **Verified:** several variables remain configured in Vercel, but no consumer exists in the recorded commit. Treat as orphan-candidate configuration; do not remove without owner confirmation and deployment-history review. |
| UploadThing | CMS media storage/CDN | Referenced by repository documentation and remote-image policy. CMS-side integration and credentials are **Unverified**. |
| GitHub Actions | CI, manual rebuild recovery, blog translation | **Verified: source:** `ci.yml`, `scheduled-rebuild.yml`, and `translate.yml`. Secret presence, deploy-hook validity, branch protections, and current run status are **Unverified**. |

## Known unverified or time-sensitive items

1. Vercel Root Directory, install command, build command overrides, Deployment Checks,
   analytics, logs/drains, and observability settings were not exposed by the inspected
   project response.
2. The CMS webhook that should trigger rebuilds, the GitHub `VERCEL_DEPLOY_HOOK_URL`
   secret, and the Render deployment/migration state were not inspected.
3. Secret values were deliberately not decrypted. Variable presence does not prove that
   credentials are current or correctly authorized.
4. CMS-backed route slugs and counts change at each successful production build. Use the
   live sitemap or a production build; do not maintain a copied slug list here.
5. An HTTP 200 verifies delivery, not complete interactive behavior. Authenticated Konbini
   writes, Meridiel Drive sync, and all browser/device combinations remain outside this
   registry check.

## Maintenance procedure

When routes, applications, deployment configuration, or dependencies change:

1. Pull `main`; update the recorded commit and verification date.
2. Review `src/pages/`, `src/data/spaces.ts`, `src/data/trips/`, `public/`, `api/`,
   `astro.config.mjs`, `vercel.json`, `package.json`, and `.github/workflows/`.
3. Run `npm ci`, `npm run check`, `npm run lint`, `npm test`, and
   `npm audit --omit=dev --audit-level=moderate`.
4. Run `CMS_URL=https://milifix-cms.onrender.com npm run build`. A normal build without
   `CMS_URL` intentionally tries localhost and fails fast in production mode.
5. Confirm that the latest Vercel **production** deployment is `READY`, targets `main`,
   and records the same commit. Do not substitute the newest preview deployment.
6. Verify the custom domain and representative routes from every route family, the three
   standalone apps, sitemap files, redirects, and method handling for Functions.
7. Compare only environment-variable names and targets unless a separate security review
   explicitly authorizes secret access. Record missing optional infrastructure as
   **Unverified**, not as working or broken.
8. Update this file in the same change as the route/application change whenever practical.

## Verification log for v1.1

- `npm run check`: passed (0 errors, 0 warnings, 1 deprecation hint).
- `npm run lint`: passed.
- `npm test`: passed (23 files, 217 tests).
- Production dependency audit: passed (0 vulnerabilities).
- Production CMS build: passed (204 Astro pages).
- Live smoke checks: all sampled page/app routes returned 200; canonical redirects returned
  308; GET on `/api/konbini-submit` returned 405.
- Vercel: production deployment is `READY` and matches the recorded `main` commit.

