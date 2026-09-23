# 04 — Phase-by-Phase Fix Plan (the main deliverable)

Execute phases **in order**. Finish, verify, and log each phase before starting the next. Every phase lists: goal → exact files → code guidance → verification. Respect all invariants in `01`.

> Reminder: any edit to `edit.html` must be mirrored **identically** into `edit/index.html` (INVARIANT 2), and any edit to `server.js` must be mirrored into `api.php` (INVARIANT 5).

---

## PHASE 0 — Baseline & safety net (do this first, ~no code)
**Goal:** Prove the current state and create a rollback point so you can never make things worse.

1. Start the server: `node server.js`.
2. Capture "before" screenshots of: `/`, `/courses.html`, `/CRM/` (dashboard after login), `/edit/` (after login). Save under `/tmp/agent-browser/before-*.png`.
3. Take a full backup via the app's own guarantee (INVARIANT 4):
   ```bash
   curl -s -X POST http://localhost:3000/api/system/snapshot -H "Content-Type: application/json" -d '{"label":"pre-remediation"}'
   ```
4. Record the parity + test baseline:
   ```bash
   node -e "const fs=require('fs'),c=require('crypto');const h=f=>c.createHash('sha256').update(fs.readFileSync(f)).digest('hex');console.log('EDIT PARITY:',h('edit.html')===h('edit/index.html'));"
   node scratch/test_unbreakable_system.js
   ```
**Verify:** snapshot created, parity = true, tests pass. If tests already fail, note it — you must not make them worse.

---

## PHASE 1 — Fix broken partner logos (B1)
**Goal:** No broken images anywhere on the public site; the partners strip looks intentional.

**Files:** `images/partner/1.png`–`5.png`, `index.html` (~759–763). Check other pages that reference `images/partner/` too (`grep -rl "images/partner" *.html`).

**Recommended approach (cleanest):** Replace the placeholders with real, valid raster logos.
- These represent recognized bodies (UGC, AICTE, NAAC, AIU, etc.) and partner universities. Generate clean, on-brand PNG badges (transparent background, consistent height ~64–80px) and save them as real PNGs at `images/partner/1.png`…`5.png` (overwrite the fakes). Use the image generation tool for neutral accreditation-style badge marks; do **not** fabricate real trademarked logos misleadingly — use generic "UGC Recognized", "AICTE Approved", "NAAC Accredited", "AIU Member", "ISO Certified" style badges which is truthful for this counseling business.
- Keep the same filenames/paths so no HTML change is needed.

**Belt-and-suspenders (also do this):** add a graceful fallback so a future missing asset never shows a broken icon. In `index.html` on each partner `<img>`:
```html
<img src="images/partner/1.png" alt="UGC Recognized" loading="lazy"
     onerror="this.closest('.partner-item').style.display='none'">
```
(Repeat per item with correct `alt`. This satisfies the "never look broken" bar even if an asset is later removed.)

**Verify:**
```bash
agent-browser open "http://localhost:3000/" && agent-browser wait --load networkidle \
  && agent-browser eval "(()=>[...document.images].filter(i=>i.complete&&i.naturalWidth===0).map(i=>i.src))()"
```
Expect `[]`. Screenshot the partners strip.

---

## PHASE 2 — Polish the intro / welcome screen (B2)
**Goal:** A clean, premium intro with **no** ghosting over the hero and a smooth curtain exit.

**Files:** `css/motion-welcome.css` (primary), `js/motion-welcome.js` (only if needed), markup `index.html` 35–79.

**Code guidance (CSS-only fix preferred):**
- Ensure `#eg-motion-welcome` sits above everything (`z-index: 99999`) and its background is fully opaque while active, so the hero is never seen through it before exit.
- On `.eg-exit`, fade the **inner content** (`.eg-welcome-stage`, `.eg-welcome-meta`, `.eg-progress-track`) to `opacity:0` slightly **before/faster** than the overlay itself slides/fades away. Example:
  ```css
  #eg-motion-welcome { z-index: 99999; will-change: opacity, transform; }
  #eg-motion-welcome.eg-exit { opacity: 0; transform: translateY(-100%); transition: opacity .45s ease, transform .7s cubic-bezier(.7,0,.3,1); pointer-events: none; }
  #eg-motion-welcome.eg-exit .eg-welcome-stage,
  #eg-motion-welcome.eg-exit .eg-welcome-meta,
  #eg-motion-welcome.eg-exit .eg-progress-track { opacity: 0; transition: opacity .25s ease; }
  ```
- Keep the JS behavior intact: 1.1s counter, 1.5s hard failsafe, click-to-skip, reduced-motion instant dismiss, `sessionStorage 'eg_welcomed'`. **Do not remove the failsafe.**
- Consider showing the intro only **once per session** (the code already sets `eg_welcomed`; if you want to honor it, gate the whole controller on `sessionStorage.getItem('eg_welcomed')` near the top of `js/motion-welcome.js`). This makes internal navigation feel instant. Optional but recommended.

**Verify:** reload `/` several times; confirm no duplicated/ghosted headline mid-exit; confirm the intro never sticks (wait past 2s). Test `prefers-reduced-motion` path.

---

## PHASE 3 — Homepage SEO & metadata cleanup (B3)
**Goal:** Professional, accurate metadata on the home page (and a quick pass over other pages).

**Files:** `index.html` `<head>`; scan all `*.html`.

**Code guidance:**
- Replace the title:
  ```html
  <title>EducationistGuru | Online, Distance & Regular University Admissions in India</title>
  ```
- Ensure a strong meta description (120–160 chars), e.g.:
  ```html
  <meta name="description" content="EducationistGuru streamlines admissions for Online, Distance & Regular university programs across India with expert, transparent counseling and end-to-end application support.">
  ```
- Add/curate Open Graph + Twitter tags for social sharing (use `images/logo-horizontal.png` or a dedicated OG image). Set `<meta name="author" content="EducationistGuru">` (remove any theme-author leftover).
- Quick scan for other boilerplate: `grep -rniE "html5 template|lorem ipsum|themeforest|rstheme|demo content" *.html` and clean anything that surfaces to users. Keep copy authentic (INVARIANT 7).

**Verify:** `agent-browser get title` on `/` returns the new title; `grep` for leftovers returns nothing user-facing.

---

## PHASE 4 — Harden the Content Studio (EDIT) — CRITICAL, see `06`
**Goal:** The editor must be unbreakable and pleasant. Fix the red-button design violation (B4) and reinforce the section chain (INVARIANT 1). **Full detail lives in `06_CMS_CRM_MANAGEMENT.md` — follow it.**

Summary of what this phase must achieve:
- Recolor the harsh red login button, access pill, and Sign Out button to the brand system (`--primary` orange / a neutral danger token) in **both** `edit.html` and `edit/index.html`.
- Audit `edit/js/edit.js renderAll()` to confirm every section is in its own `try/catch` and all list access is null-safe. Add missing guards.
- Confirm Save & Publish round-trips to `/api/content/*` and that a broken record in one section cannot blank the others.

**Verify:** editor loads, each section renders independently, edit→save→refresh persists, no console errors, parity hash still matches.

---

## PHASE 5 — Harden the CRM — CRITICAL, see `06`
**Goal:** Zero-loss lead capture and a frictionless CRM. **Full detail in `06_CMS_CRM_MANAGEMENT.md`.**

Summary:
- Verify the lead-capture guarantees in `js/crm-integration.js` (vault ledger, 8s abort, offline queue, background drainer, reassuring UX) are intact after any change.
- Confirm empty collections (`enrollments`, `fees`, `roles`) load safely (B5) and show a friendly empty-state instead of a blank/error.
- Recolor any harsh red in CRM nav/toolbars to the design system (keep semantic red only for true destructive/danger actions).

**Verify:** submit a callback/inquiry from the public site with the network throttled/offline → user sees success, lead lands in `eg_lead_vault_ledger` and drains to the server when back online. CRM pages all load.

---

## PHASE 6 — UI/UX enhancement pass (public site) — see `05`
**Goal:** Make the public site feel ahead of competitors **without changing structure**. Follow `05_UIUX_ENHANCEMENTS.md`. Do this after bugs are fixed so you polish a stable base.

**Verify:** desktop + mobile screenshots of `/`, `/courses.html`, `/colleges.html`, `/universities.html`, `/blog.html`, `/contact.html`. No layout breaks, no broken images, Lighthouse/vitals not regressed (`agent-browser vitals http://localhost:3000/ --json`).

---

## PHASE 7 — Empty-data & self-heal verification (B5, B6)
**Goal:** No blank crashes when a collection is empty.
- Confirm `readData()` self-heals empty/whitespace/corrupt files in **both** `server.js` and `api.php`. If not, patch both to return the correct default and rewrite a valid file.
- Add friendly empty-states in the CRM pages and public listing pages when a collection has 0 items (a short message + relevant CTA), rather than empty space.

**Verify:** temporarily point a page at an empty collection (or use the already-empty `enrollments`/`fees`) and confirm a graceful empty-state, no 500, no console error. Restore any test data.

---

## PHASE 8 — Final integration, tests, bundle, docs (INVARIANT 6)
1. Re-run edit parity check → must be `true`.
2. `node scratch/test_unbreakable_system.js` and `node scratch/test_unbreakable_recovery.js` → must pass.
3. Update `ARCHITECTURE_TITANIUM_CHAIN.md` with anything you changed (new asset conventions, empty-states, etc.).
4. `node scratch/build_production_bundle.js` → refresh `educationistguru_production_package.zip`.
5. Write `AGENT_FIX_PLAN/CHANGELOG_DONE.md` per `07_VERIFICATION_CHECKLIST.md`.
6. Final full-site browser sweep (desktop + mobile) with `agent-browser errors` clean on every page.

---

### Suggested commit sequence (small, reversible commits)
```
fix(home): replace broken partner logos with valid on-brand badges + graceful fallback
fix(home): remove intro-screen ghosting over hero; once-per-session intro
fix(seo): real homepage title/description/OG; remove template boilerplate
fix(edit): remove #ff3115 red; align auth + sign-out to brand tokens (both edit files)
harden(edit): null-safe section chain in renderAll()
harden(crm): verify zero-loss lead capture; friendly empty-states; self-healing readData (both engines)
feat(ux): public-site polish pass (spacing, type, cards, motion) — no structural change
chore: update ARCHITECTURE doc, run tests, rebuild production bundle
```
Keep each commit green (parity + tests) before the next.
