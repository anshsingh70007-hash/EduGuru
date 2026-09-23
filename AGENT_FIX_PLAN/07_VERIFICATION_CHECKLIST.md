# 07 — Verification Checklist & Definition of Done

Nothing is "done" until it is verified in a real browser and the invariant gates pass.
Copy this checklist into `AGENT_FIX_PLAN/CHANGELOG_DONE.md` and tick items as you complete them.

## Per-change gate (every single change)
- [ ] Changed only the files that needed changing; structure/data contracts preserved.
- [ ] Verified the specific behavior in the browser (desktop **and** mobile where visible).
- [ ] `agent-browser errors` and `agent-browser console` are clean on affected pages.
- [ ] If a server route changed: mirrored into **both** `server.js` and `api.php`.
- [ ] If `edit.html`/`edit/index.html` changed: SHA-256 parity re-checked = MATCH.
- [ ] Logged the change (file, what, why) in `CHANGELOG_DONE.md`.

## Invariant gates (run at the end of each pillar/phase and before finishing)
- [ ] **Parity:** `edit.html` ⟺ `edit/index.html` SHA-256 = MATCH.
- [ ] **Section chain:** breaking one editor section does not blank the others (adversarial test done + data restored).
- [ ] **Zero-loss leads:** normal + offline submit both succeed; queue drains online; ledger intact.
- [ ] **Backup guarantee:** "Download Full Database JSON" works even with server stopped (client fallback).
- [ ] **Self-heal:** empty/corrupt data files load as empty collections, no 500 (both engines).
- [ ] **Tests:** `node scratch/test_unbreakable_system.js` and `test_unbreakable_recovery.js` pass.
- [ ] **Bundle:** `node scratch/build_production_bundle.js` regenerated the production zip.
- [ ] **Docs:** `ARCHITECTURE_TITANIUM_CHAIN.md` updated for any schema/route/UI change; `AGENTS.md` updated if a new invariant was introduced.

## Public site — page-by-page (desktop 1280×800 + mobile 375×812, dark media)
For each page: loads, no broken images, no overlap/overflow, CTAs work, `agent-browser errors` clean.
- [ ] `/` (index) — intro screen no ghosting; partners fixed; hero legible; title/SEO fixed.
- [ ] `/courses.html` — cards consistent, filters/search work.
- [ ] `/colleges.html`
- [ ] `/universities.html`
- [ ] `/blog.html`
- [ ] `/contact.html` — lead form submits (zero-loss path).
- [ ] Floating Callback + WhatsApp buttons don't overlap content on mobile.
- [ ] `agent-browser vitals http://localhost:3000/ --json` — no CLS/LCP regression vs. Phase 0 baseline.

## Business-critical pillars
- [ ] **Content Studio:** login, all 6 sections render, edit→Save&Publish persists + reflects on public site, no red `#ff3115`, no console errors.
- [ ] **CRM:** login, dashboard + all sidebar pages load (incl. empty Enrollments/Fees/Roles with friendly empty-states), zero-loss lead flow verified, no red `#ff3115`.

## Broken-image sweep (run on every public page)
```bash
agent-browser eval "(()=>[...document.images].filter(i=>i.complete&&i.naturalWidth===0).map(i=>i.src))()"
```
Expect `[]` on every page.

## Regression guard
- [ ] Everything listed under "What is already GOOD" in `03_BUG_FINDINGS.md` is still at least as good.
- [ ] No new console errors anywhere.
- [ ] Phase 0 snapshot still exists as a rollback point.

---

## `CHANGELOG_DONE.md` format (create this as you work)
```
# Remediation Changelog

## Phase 1 — Partner logos
- Replaced images/partner/1-5.png (were mislabeled SVGs) with valid on-brand PNG badges.
- Added onerror graceful-hide fallback on partner <img> in index.html.
- Verified: broken-image sweep on / returns []. Screenshot: /tmp/agent-browser/after-partners.png
- Gates: edit parity N/A, tests pass.

## Phase 2 — Intro screen
- ...

(one entry per phase; include what changed, files, verification evidence, gate results)
```

## Definition of Done (all must be true)
1. All confirmed bugs in `03` fixed and verified in-browser.
2. CMS + CRM verified unbreakable per `06`, invariant gates green.
3. Public UI/UX improved per `05` with no structural changes and no regressions.
4. Both engines in lockstep; tests pass; production bundle rebuilt; docs updated.
5. `CHANGELOG_DONE.md` complete with evidence.
