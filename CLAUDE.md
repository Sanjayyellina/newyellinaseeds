# Yellina Seeds — Operations Platform
## Project Knowledge Base for Claude

> Last updated: 26 March 2026
> App URL: https://www.yellinaseeds.com
> Repo: https://github.com/Sanjayyellina/saisanjusseeds.git

---

## What This App Is
A seed drying & operations management platform for **Yellina Seeds Pvt. Ltd.**, Sathupally.
Built with: **Vanilla JS + Supabase (PostgreSQL)** + Vercel hosting + PWA (offline-capable).

Features:
- **Dashboard** — live bin status overview, KPI cards
- **Intake Register** — log incoming corn loads with bin allocation
- **Bin Monitor** — track 20 drying chambers, moisture, status, airflow
- **Dispatch** — generate signed receipts for outgoing seed
- **Receipts** — view/verify dispatch receipts with QR code
- **Analytics** — yield, moisture trends, utilization
- **Maintenance Log** — facility maintenance records
- **Labor & Shifts** — labor tracking
- **Manager Access** — PIN-protected admin features
- **Multi-language** — English, Hindi (हिंदी), Telugu (తెలుగు)

---

## Tech Stack & Architecture

| Layer | Tech |
|---|---|
| Frontend | Vanilla JS (ES6+), no framework |
| Database | Supabase (PostgreSQL) with RLS |
| Auth | Supabase Auth (email/password) |
| Hosting | Vercel (auto-deploy from GitHub main) |
| Offline | Service Worker (cache-first), PWA manifest |
| Styling | CSS custom properties (design tokens) |
| Exports | SheetJS (xlsx), QRCodeJS |

### File Structure
```
index.html              — entire app UI (single page, all tabs inline)
css/
  variables.css         — design tokens (:root CSS vars)
  layout.css            — topbar, sidebar, avatar, user menu
  components.css        — cards, buttons, modals, tables, offline bar
js/
  db.js                 — all Supabase queries + auth (dbClient)
  init.js               — initApp() sign-out gate, bootApp() data load, SW registration
  state.js              — global state object + Store (pub/sub)
  render.js             — renderPage() for all pages
  actions.js            — form submissions, bin updates, dispatch creation
  i18n.js               — translations (en/hi/te), changeLanguage()
  binTile.js            — bin card HTML generator
  selects.js            — dropdown population helpers
  utils.js              — toast(), debounce(), formatters
  clock.js              — live clock in topbar
  crypto.js             — receipt hash/signature (DJB2/FNV1a — NOT real crypto)
  receipt.js            — receipt rendering, PDF, global search
  seed.js               — demo seed data (unused/dead code)
  error-boundary.js     — global error handler
service-worker.js       — cache-first SW, ignoreSearch:true for ?v= URLs
manifest.json           — PWA manifest (name, icons, theme #F5A623)
assets/logo.jpg         — company logo
pages/                  — OLD modular HTML fragments (DEAD CODE — not used)
```

---

## Supabase Database

**Project**: (credentials hardcoded in js/db.js — anon key is public by design)

### Tables
| Table | Purpose |
|---|---|
| `bins` | 20 drying chambers with status, moisture, hybrid info |
| `intakes` | Incoming corn load records |
| `intake_allocations` | Which bins each intake is assigned to |
| `dispatches` | Outgoing dispatch records with receipt IDs |
| `maintenance_logs` | Facility maintenance entries |
| `labor_logs` | Labor/shift records |
| `bin_history` | Snapshot of bin when emptied |
| `activity_log` | Audit trail of all actions |

### Security
- **RLS is ON** on all 8 tables (fixed during audit)
- All tables: only authenticated users can read/write
- 8 indexes added on FK columns and `created_at`
- `dispatches.bins` is **jsonb** (not text — do NOT use JSON.stringify)

### Key Columns
- `bins.intake_date_ts` — stored as text (Unix ms timestamp as string)
- `dispatches.bins` — jsonb array of bin allocation objects
- `intake_allocations.bin_id` — bigint FK to bins.id

---

## Important Patterns & Gotchas

### Auth Flow
```
Page load → initApp() → signOut() → show login screen
Login success → doLogin() → bootApp() → load all data → show app
```
> Every page load forces re-login. This is intentional (facility security).

### Data Load (bootApp)
All 6 DB tables fetched **in parallel** with `Promise.all` for fast boot.

### State Management
- `window.state` = global mutable state object
- `window.Store` = pub/sub wrapper; call `Store.emitChange()` to re-render
- `Store.reset()` replaces `Store.state` but `window.state` still points to old ref — known issue

### Bin Access Pattern
**KNOWN BUG**: Some code uses `state.bins[bin.id - 1]` (index-based).
Should use `state.bins.find(b => b.id === binId)` — not yet fixed.

### Receipt IDs
Format: `YDS-{YEAR}-{6-digit-counter}` e.g. `YDS-2026-001001`
Year is now dynamic (`new Date().getFullYear()`).

### Manager PIN
PIN `"1234"` is hardcoded in `js/actions.js` line ~497.
⚠️ This is client-side only — not real security. Visible in DevTools.

### Moisture Display
Moisture shown as single number e.g. `10` (not `9–11%`).

### Offline / PWA
- Service Worker registered in `init.js` on page load
- Static assets pre-cached on SW install
- `ignoreSearch: true` in `caches.match()` so `?v=N` versioned URLs hit cache
- **Writes (intake/dispatch/moisture save) are NOT queued offline** — they will fail when offline
- **Reads work offline indefinitely** from cache

---

## CSS Design Tokens (variables.css)

```css
--gold: #F5A623          /* primary brand colour */
--gold-dark: #C8821A
--ink: #0F1923           /* primary text */
--ink-2 to --ink-5       /* text scale */
--surface: #FFFFFF       /* card background */
--surface-2 to -4        /* surface scale */
--green / --blue / --amber / --red / --purple   /* status colours */
--sidebar-w: 240px
--topbar-h: 60px
--radius / --radius-sm / --radius-lg / --radius-xl
--shadow-xs through --shadow-xl
```
> There is NO `--text` or `--text-secondary` token — use `--ink` and `--ink-4` instead.

---

## Deployment

- **Auto-deploys** from GitHub `main` branch via Vercel
- Push to `main` → live at yellinaseeds.com in ~1–2 min
- **Cache busting**: bump `?v=N` on CSS/JS `<script>` and `<link>` tags in index.html, AND bump `CACHE_VERSION` in service-worker.js

### Current versions (last updated 26 Mar 2026)
```
css/variables.css?v=10
css/layout.css?v=10
css/components.css?v=10
js/i18n.js?v=3
js/actions.js?v=2
js/clock.js?v=2
js/init.js?v=3
service-worker.js CACHE_VERSION = 'v9'
```

---

## Known Issues / TODO

| Priority | Issue | Location |
|---|---|---|
| 🔴 | `state.bins[id-1]` fragile index access | render.js, seed.js |
| 🔴 | `Store.reset()` doesn't update `window.state` ref | state.js |
| 🟡 | No offline write queue — writes fail when offline | db.js |
| 🟡 | No loading spinner during bootApp data fetch | init.js |
| 🟡 | Manager PIN is client-side only (hardcoded "1234") | actions.js |
| 🟡 | `globalSearch()` finds intakes but doesn't navigate to them | receipt.js |
| 🟡 | No debounce on search inputs | index.html |
| 🟡 | `pages/` folder full of dead HTML fragments | pages/ |
| 🟢 | Bin count hardcoded as 20 in several places | render.js, state.js |
| 🟢 | Many UI strings not in i18n (hardcoded English) | render.js |
| 🟢 | Receipt hash uses non-crypto hash functions (misleading) | crypto.js |
| 🟢 | Manifest icons: same file for 192 & 512, maskable not split | manifest.json |
| 🟢 | No `<noscript>` fallback | index.html |

---

## History of Major Changes (Chronological)

1. **Fixed save button** — Supabase RLS was OFF on all tables; enabled + created policies
2. **Added 8 DB indexes** on FK columns and `created_at`
3. **Fixed `dispatches.bins`** — migrated from text to jsonb; removed JSON.stringify/parse
4. **Fixed BIN undefined** in Intake tab — `binIds[0] || null` when no allocation
5. **Fixed moisture display** — `→9–11%` changed to show single value e.g. `10`
6. **Force login on every visit** — `initApp()` calls `signOut()` on every page load
7. **Added bin history** — snapshot saved when bin is emptied
8. **Added PWA** — service-worker.js, manifest.json, offline bar in CSS
9. **Added offline write queue** — `_enqueue()`, `syncOfflineQueue()` in db.js (then later audit found it wasn't wired up properly)
10. **Removed duplicate "New Intake" button** from dashboard header
11. **Fixed avatar** — now shows real user initial from Supabase auth email; dropdown with Sign Out
12. **Fixed double + on intake button** — removed `+` prefix from i18n strings (SVG icon already has `+`)
13. **Full audit fixes** — SW registration, parallel DB fetches, hardcoded year, dead config-banner removed, duplicate Supabase script removed, duplicate `</head>` removed, CSS var fixes, clock null guard
