# 01 — Project Context & Non-Negotiable Rules

## 1. What this project is

**EducationistGuru.com** is a production higher-education **admissions & counseling portal** for Indian universities (Online / Regular / Distance learning) plus an integrated **Admissions CRM** and a browser-based **CMS content editor**. The business runs on **student leads** (callback requests, WhatsApp inquiries, applications). Losing a lead = losing revenue.

It is **not** a Next.js / React app. It is a classic multi-page website:

```
Static HTML pages  ──►  hydrated at runtime by vanilla JS "managers"  ──►  data from /api/content/*
        │                              │                                            │
    index.html, courses.html,    js/cms-content.js (public site),          server.js  (Node engine, local/dev)
    colleges.html, etc.          js/site-menu.js, js/*-manager.js          api.php    (PHP engine, Hostinger prod)
                                                                                  │
                                                                           data/*.json (flat-file store)
```

### Three pillars (the "Titanium 3-Pillar" architecture)
1. **Public Portal** — the marketing/counseling website (`index.html` + `*.html` pages, `css/`, `js/`).
2. **CMS Editor** — `edit.html` (root) and `edit/index.html` (subdir), driven by `edit/js/edit.js`. Manages 5 content sections: `courses`, `colleges`, `universities`, `blogs`, `videos`, plus `siteMenu` and CRM.
3. **CRM** — `CRM/*.html` (dashboard, leads, inquiries, applications, enrollments, fees, subscribers, users, settings), lead capture via `js/crm-integration.js`.

### Dual persistence engines (must stay identical)
- **`server.js`** — Node.js dev/local engine (run with `node server.js`, port 3000).
- **`api.php`** — PHP engine for Hostinger Apache/LiteSpeed production.
- Both implement the same routes and the same **3-tier vault** persistence: primary `./data/`, vault mirror `./backups/vault/`, snapshots `./backups/snapshots/`.

### Key API routes (already implemented in both engines)
```
GET  /api/content/all | /courses | /colleges | /universities | /blogs | /menu
GET/POST /api/crm/all | /api/crm/leads | /api/crm/inquiries | /api/crm/stats | /api/crm/settings
POST /api/system/backup | /restore | /rollback | /snapshot   GET /api/system/snapshots | /vault-status
POST /api/upload        GET /api/youtube/videos | /fetch-info     /api/gmail/*
GET  /api/health | /api/ping
```

### Data files (`data/*.json`) — current state
```
courses.json (large, ~2258 lines)   colleges.json   universities.json   blogs.json
videos.json  channel_videos.json    site_menu.json  settings.json
leads.json   inquiries.json   applications.json   subscribers.json   users.json
enrollments.json  (EMPTY)   fees.json  (EMPTY)   roles.json  (EMPTY)   ← verify these parse safely
```

## 2. How to run & inspect

```bash
# From the project root:
node server.js            # serves http://localhost:3000/
# Public site:  http://localhost:3000/
# CMS editor:   http://localhost:3000/edit/
# CRM:          http://localhost:3000/CRM/
# Mobile shell: http://localhost:3000/app/
```

Browser verification uses the `agent-browser` CLI (details in `02_WORKING_METHOD.md`).

Debug logs (server + client console) are available via the virtual file
`user_read_only_context/v0_debug_logs.log` (read-only).

## 3. THE SIX INVARIANTS — you may NEVER violate these

These come straight from the repository `AGENTS.md`. Treat them as hard constraints, not suggestions.

### INVARIANT 1 — The Unbreakable Section Chain is sacrosanct
- In `edit/js/edit.js`, every section inside `renderAll()` MUST stay wrapped in its **own isolated `try...catch`**. A failure in `courses` must never stop `colleges`, `blogs`, etc. from rendering.
- All filter/map code must defend against nulls: `Array.isArray(x) ? x.filter(Boolean) : []`.
- Never call `.slice()`, `.trim()`, `.toLowerCase()`, `.map()` on a value without coercion: use `String(val || '')` / `(arr || [])`.
- The same defensive philosophy applies to the public-site hydrator `js/cms-content.js` and every `js/*-manager.js`.

### INVARIANT 2 — Dual-file SHA-256 parity (`edit.html` ⟺ `edit/index.html`)
- These two files MUST remain **100% byte-for-byte identical**. They currently MATCH.
- Edit one → immediately apply the **exact** same edit to the other, in the same commit.
- Verify:
  ```bash
  node -e "const fs=require('fs'),c=require('crypto');const h=f=>c.createHash('sha256').update(fs.readFileSync(f)).digest('hex');console.log('MATCH:',h('edit.html')===h('edit/index.html'));"
  ```

### INVARIANT 3 — Titanium lead capture & zero-loss guarantee
In `js/crm-integration.js`:
- **Append-only vault ledger:** every lead is first stamped into `eg_lead_vault_ledger` in `localStorage`.
- **8-second abort protection:** server submits use an `AbortController` timeout (~7–8s) so weak student mobile networks never freeze the UI.
- **Offline sync queue** (`eg_pending_leads_queue`): any failed/offline submit is queued with `_isLocalOfflineDraft: true`.
- **Background drainer** (`flushOfflineLeadsQueue`): auto-runs on script load, `online` event, `visibilitychange`, and a 30s interval.
- **Reassuring UX:** never show a student a red network error on an admission form — always confirm success and queue for background sync.

### INVARIANT 4 — External vault & disaster recovery
In `CRM/settings.html`:
- Always use `getSettingsApiBase()` (never hardcode origin/port — must survive `file://` too).
- "Download Full Database JSON" MUST have dual-layer fallback: primary server `/api/system/backup` + emergency **client-side** compiler from `localStorage`. It must NEVER fail, even with the server fully down.
- Restore writes to BOTH client cache (`localStorage`) and server `/api/system/restore`.
- Preserve snapshots/rollback routes (`/api/system/snapshots`, `/snapshot`, `/rollback`).

### INVARIANT 5 — Dual-engine parity (`api.php` ⟺ `server.js`)
- Every route/fix/feature added to one engine MUST be added identically to the other.
- Both must support: 3-tier vault persistence, self-healing `readData()`, pre-restore/pre-rollback safety snapshots, and all CRM routes.

### INVARIANT 6 — Self-updating architecture protocol
When you add a data collection, change a schema, add an API route, or change a UI workflow:
1. Update `ARCHITECTURE_TITANIUM_CHAIN.md` with the new details.
2. Update `AGENTS.md` if a new invariant/rule is created.
3. Run the test suite: `node scratch/test_unbreakable_system.js` (and `scratch/test_unbreakable_recovery.js`).
4. Rebuild the production bundle: `node scratch/build_production_bundle.js` (keeps `educationistguru_production_package.zip` fresh for 1-click Hostinger deploy).

### INVARIANT 7 — Anti-AI design system & visual harmony
- Use unified tokens: `var(--font-display)` = **Outfit**, `var(--font-sans)` = **Plus Jakarta Sans**, `var(--primary)` = brand orange **`#ff6b00`**, `var(--sidebar-bg)` = **`#0f172a`**.
- **Never** reintroduce harsh flat red bars (`#ff3115`) on the public toolbar or CRM nav.
- No repetitive dummy/template copy. Keep copy authentic, human, tailored to accredited Indian higher-education counseling.

## 4. Scope boundaries (what "refine, don't rebuild" means)
- ✅ Fix bugs, broken assets, stuck overlays, layout gaps, SEO leftovers.
- ✅ Improve CSS, spacing, typography, micro-interactions, responsiveness, accessibility.
- ✅ Add missing polish and small usability features to CMS/CRM.
- ❌ Do NOT rewrite the framework, swap to React/Next, or restructure routes.
- ❌ Do NOT rename data keys or break the `/api/content/*` contract consumed by `js/cms-content.js`.
- ❌ Do NOT delete the 3-pillar files or the vault/snapshot system.
