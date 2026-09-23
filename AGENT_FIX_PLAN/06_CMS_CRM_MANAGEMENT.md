# 06 — CMS (EDIT) & CRM: The Business-Critical Pillars

> The user's livelihood depends on these two systems. **Primary directive: do no harm.**
> They already work. Your job is to **verify, harden, and gently polish** — never rebuild, never
> refactor for style, never "simplify" the safety machinery. When in doubt, leave it and log it.

Good news from investigation: most of the required safety machinery is **already present and working**.
This section tells you exactly what exists, what to preserve, what to verify, and the few safe
improvements to make.

---

## PART A — The CONTENT STUDIO / EDITOR (`/edit/`)

### What exists and works (baseline — keep it green)
- Login (`admin@educationistguru.com` / `EduGuru#Admin2026!`) → Content Studio.
- Sections in the sidebar: **1. Courses (107), 2. Colleges (8), 3. Universities (6), 4. Blog (7),
  5. YouTube (7), 6. Headers & Menu (Live)**, plus Overview & Activity.
- Header status chips: "Server Connected", "Live Sync Active", "Vault Backup", Refresh, Sign Out.
- Per-item **Edit** modal with SEO fields (Title, Meta Description w/ char counter, Tags, Categories,
  Keywords, Faculty, Duration, …) and **Save & Publish**.
- `edit/js/edit.js` is already heavily wrapped in `try/catch` (dozens of isolated blocks) — the
  Unbreakable Section Chain (INVARIANT 1) is largely implemented.

### The two absolute rules for the editor
1. **DUAL-FILE PARITY (INVARIANT 2):** `edit.html` and `edit/index.html` must be byte-identical.
   Any change to one is mirrored **exactly** into the other, in the same edit pass. Verify:
   ```bash
   node -e "const fs=require('fs'),c=require('crypto');const h=f=>c.createHash('sha256').update(fs.readFileSync(f)).digest('hex');console.log('MATCH:',h('edit.html')===h('edit/index.html'));"
   ```
   The logic lives in `edit/js/edit.js` (shared), so most changes are HTML/CSS in these two files.
2. **SECTION CHAIN (INVARIANT 1):** A bad/missing/null record in ONE section must never stop the
   others from rendering. Each section render stays in its own `try/catch`; all list access is
   null-safe.

### Verify the section chain is bulletproof (do this — it's the core promise)
Audit `renderAll()` and each `renderX()` in `edit/js/edit.js`:
- Every section render is inside its own `try { … } catch (e) { console.warn(...) }` so one throw
  doesn't abort the rest. (Most already are — confirm none were added without a guard.)
- All collection access uses the defensive pattern:
  ```js
  const items = Array.isArray(data.courses) ? data.courses.filter(Boolean) : [];
  ```
- Never call `.slice()/.trim()/.toLowerCase()/.map()` on a possibly-undefined value without
  `String(val || '')` / `(arr || [])` coercion first. Grep for risky calls:
  ```bash
  grep -nE "\.(trim|toLowerCase|toUpperCase|slice|split|map|filter)\(" edit/js/edit.js | grep -v "String(" | head
  ```
  For each hit, confirm the receiver can't be null/undefined; if it can, coerce.
- **Adversarial test:** temporarily inject a broken record (e.g. `null` and `{}` with missing title)
  into one collection via the API or a data file copy, reload `/edit/`, and confirm **every other
  section still renders** and only the bad card degrades gracefully. Restore the data afterward.

### Verify Save & Publish round-trips (the whole point of the CMS)
- Open a course → Edit → change the title → **Save & Publish** → Refresh → change persists.
- Confirm it wrote through `/api/content/<section>` (Network tab / server log), landed in
  `data/<section>.json`, and mirrored to the vault (INVARIANT 4/5).
- Confirm the **public** page reflects the change (`js/cms-content.js` hydrates from the same API).
  Editing in the CMS must visibly update the live site.

### The one visible fix here (B4): remove the harsh red
In **both** `edit.html` and `edit/index.html`, the login button "Sign In to Content Studio", the
"CONTENT STUDIO ACCESS" pill, and the header "Sign Out" button use an abrasive red (~`#ff3115`),
violating INVARIANT 7.
- Recolor the primary auth button + access pill to the brand orange system
  (`--primary` `#ff6b00`, or the existing gradient used elsewhere in the studio).
- "Sign Out" can be a **quiet neutral/ghost** button (it is not a destructive data action) — do not
  make it a loud red bar.
- Make the identical edit in both files; then re-run the parity check → must be `MATCH: true`.

### Editor UX polish (safe, optional)
- Add clear inline validation on required fields (Title, Faculty) before Save.
- Add a small non-blocking toast on successful save ("Saved & published ✓") if not already present.
- Ensure the modal is scroll-contained and closes on Esc / backdrop click without losing focus trap.
- Do **not** change field names/keys the API expects. Search before renaming anything.

---

## PART B — The CRM (`/CRM/`, dashboard at `/crm/dashboard`)

### What exists and works (baseline — keep it green)
- Login with an "Auto-fill Admin Credentials" helper.
- Dashboard: Total Leads / Enrollments / Revenue / Inquiries stat cards, "Leads by Source" bar chart,
  "Lead Status" panel, Recent Leads/Inquiries. Clean dark sidebar, orange accents, **no console errors.**
- Sidebar: Dashboard, Leads, Applications, Enrollments, Inquiries, Subscribers, Fee Management,
  Users & Roles, Settings, View Website.
- `js/crm-integration.js` already implements the **Titanium zero-loss lead pipeline** (INVARIANT 3).

### The zero-loss lead pipeline is ALREADY implemented — your job is to NOT break it
Confirmed present in `js/crm-integration.js`:
- `appendToTitaniumVaultLedger()` — stamps every lead into `eg_lead_vault_ledger` (append-only) first.
- `enqueueOfflineSync()` → `eg_pending_leads_queue` with `_isLocalOfflineDraft: true` on failure/offline.
- `flushOfflineLeadsQueue()` — the background drainer.
- Triggers: `window 'online'`, `document 'visibilitychange'`, `setInterval(…, 30000)`,
  and an initial `setTimeout(…, 2500)`.
- `AbortController` timeouts (~8s) around server POSTs (`crmSave`, and inside the drainer).
- `showFormSuccess()` — the reassuring UX so a student never sees a red network error.

**Rules when touching this file:**
- Never remove or shorten the vault-first write, the abort timeout, the offline queue, or any of the
  four drain triggers.
- Never surface a raw network error / red alert to a student submitting a form. Success + queue.
- If you add a new lead type (new form), route it through the **same** `crmSave`/vault/queue path —
  do not invent a parallel submit that bypasses the guarantees. Mirror any new server route into
  `api.php` too (INVARIANT 5).

### Verify the guarantee end-to-end (must pass)
1. Public site → submit "Request Callback" / an inquiry **normally** → success message; lead appears
   in CRM Leads/Inquiries and in `localStorage.eg_lead_vault_ledger`.
2. **Offline test:** in the browser, go offline (`agent-browser` devtools / block network) → submit →
   user still sees success; entry lands in `eg_pending_leads_queue` with `_isLocalOfflineDraft:true`.
3. Go back online (or wait 30s / switch tab) → the drainer flushes the queue to the server; the lead
   now appears in the CRM and is removed from the pending queue.
4. `agent-browser errors` clean throughout.

### Empty-collection safety (B5) — verify, fix only if broken
`data/enrollments.json`, `data/fees.json`, `data/roles.json` are currently **empty (0 bytes)**.
- Confirm `readData()` in **both** `server.js` and `api.php` treats empty/whitespace/corrupt as an
  empty collection (returns `[]`/`{}`) and rewrites a valid default (self-heal, INVARIANT 5). If it
  throws on `JSON.parse("")`, patch both engines.
- Confirm the CRM **Enrollments**, **Fee Management**, and **Users & Roles** pages render a friendly
  empty-state (message + CTA) instead of a blank screen or 500.
- `GET /api/crm/all` must return 200 with those keys present (even if empty).

### CRM UX polish (safe)
- Ensure no harsh red `#ff3115` in the CRM nav/toolbars (INVARIANT 7). Semantic red only for true
  destructive actions (delete lead, etc.).
- Add friendly empty-states and simple loading states where lists can be empty.
- Keep the dashboard numbers accurate (they read live from the API).

### Security note (B7) — flag, don't silently strip
The CRM login prints the real admin credentials + a weak fallback (`admin123`) in plaintext, and the
editor accepts the same. This is fine for handover/demo but risky in production. Recommended:
gate the credential hint + auto-fill behind a `location.hostname === 'localhost'` check so it never
ships to production, while keeping the normal login working everywhere. **Confirm with the owner
before removing entirely** — it may be intentional for their team.

---

## PART C — Both engines stay in lockstep (INVARIANT 5)
`server.js` (Node, local) and `api.php` (Hostinger PHP, production) must expose identical routes and
behavior: 3-tier vault persistence (`./data/`, `./backups/vault/`, `./backups/snapshots/`),
self-healing `readData()`, pre-restore/pre-rollback safety snapshots, and all CRM routes
(`/api/crm/leads`, `/api/crm/inquiries`, `/api/crm/all`, …) plus content routes (`/api/content/*`)
and system routes (`/api/system/backup|restore|snapshot|snapshots|rollback`).

**Every server-side change is done twice — once in each engine — or it is not done.**

## Final CMS/CRM gate (run before declaring these pillars done)
```bash
node -e "const fs=require('fs'),c=require('crypto');const h=f=>c.createHash('sha256').update(fs.readFileSync(f)).digest('hex');console.log('EDIT PARITY:',h('edit.html')===h('edit/index.html'));"
node scratch/test_unbreakable_system.js
node scratch/test_unbreakable_recovery.js
```
All must pass, and the end-to-end lead + edit-save flows above must succeed in the browser.
