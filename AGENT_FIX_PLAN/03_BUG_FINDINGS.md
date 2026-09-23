# 03 — Confirmed Bug Findings (already investigated — do not re-debug)

Each item below was reproduced in a real browser against `node server.js`. Evidence and root cause are given so you can go straight to the fix in `04_PHASE_PLAN.md`.

## B1 — Broken partner logos on the homepage  ▲ HIGH (visible)
- **Symptom:** The "partners" strip near the footer shows 5 broken-image icons with `alt="Partner"`. Browser reports 15 broken images (5 logos × 3, repeated in a marquee).
- **Evidence:** `[...document.images].filter(i=>i.naturalWidth===0)` → `images/partner/1.png … 5.png`.
- **Root cause:** `images/partner/1.png`–`5.png` are ~200-byte **SVG** files with a `.png` extension. The browser is told they are PNG and fails to decode them.
- **Location:** `index.html` lines ~759–763 (`#rs-partner .partner-item img`). Files in `images/partner/`.

## B2 — Motion welcome screen overlaps the hero on exit  ▲ MEDIUM (visible)
- **Symptom:** During the intro animation's exit, the animated "Welcome to EducationistGuru" text and the "Initializing Portal / 100%" meta are briefly visible **on top of** the real hero, producing a ghosted/duplicated headline.
- **Root cause:** The exit curtain (`#eg-motion-welcome.eg-exit`) reveals the hero behind it before the overlay's own content has faded, and/or its `z-index`/opacity timing in `css/motion-welcome.css` overlaps the hero reveal. The controller `js/motion-welcome.js` dismisses correctly (1.1s timeline, 1.5s failsafe, click-to-skip) — this is a **CSS timing/stacking** polish issue, not a JS logic bug.
- **Location:** `css/motion-welcome.css` (`.eg-exit`, `.eg-welcome-*`), markup `index.html` lines 35–79.

## B3 — Template-leftover page title / weak SEO on the homepage  ▲ MEDIUM
- **Symptom:** `<title>` of `index.html` is **"EducationistGuru | Responsive Education HTML5 Template"** — leftover boilerplate from the purchased theme.
- **Evidence:** Only `index.html` still has this; all other pages already have proper titles.
- **Root cause:** Never updated after theme purchase. Also check `<meta name="description">`, Open Graph, and `<meta name="author">` for "template"/author leftovers on the home page.
- **Location:** `index.html` `<head>`.

## B4 — Harsh red UI in the Content Studio (design-invariant violation)  ▲ MEDIUM
- **Symptom:** In `/edit/`, the login button "**Sign In to Content Studio**", the "CONTENT STUDIO ACCESS" pill, and the header "**Sign Out**" button render in an abrasive flat red (~`#ff3115`).
- **Root cause:** Hardcoded red that violates **INVARIANT 7** (never reintroduce `#ff3115`; brand is orange `#ff6b00`).
- **Location:** `edit.html` **and** `edit/index.html` (inline styles / classes for the auth button, access pill, and sign-out button). Remember **both files must change identically** (INVARIANT 2).

## B5 — Empty JSON data files may not self-heal  ▲ VERIFY / LOW
- **Symptom (potential):** `data/enrollments.json`, `data/fees.json`, and `data/roles.json` are **0 bytes**. `JSON.parse("")` throws.
- **Why it may be fine:** INVARIANT 5 requires `readData()` in both engines to self-heal. It probably already returns `[]`/`{}` on empty/corrupt files.
- **Action:** Confirm both `server.js readData()` and `api.php readData()` treat empty/whitespace files as an empty collection and rewrite a valid default. If not, that is a real bug — fix in both engines. Verify `GET /api/crm/all` and the CRM "Enrollments"/"Fee Management"/"Users & Roles" pages load without a 500 or blank crash.

## B6 — Homepage has large vertical gaps in a full-page screenshot  ▲ VERIFY
- **Symptom:** A full-page screenshot shows big blank bands between sections (e.g. around the counter/testimonial/"apply now" bands).
- **Likely cause:** Large image/counter background sections whose images are lazy-loaded and hadn't painted when the screenshot was taken, plus generous section padding. May be cosmetic, not a bug.
- **Action:** Re-verify with `agent-browser wait --load networkidle` + scroll before screenshotting. If a section is genuinely empty because a CMS collection is empty or an image path is wrong, fix the asset/path or add an empty-state. Do **not** delete the section.

## B7 — Security: admin credentials printed on the CRM login page  ▲ NOTE (confirm intent)
- **Symptom:** `/CRM/` login shows the real admin email + password and an "Auto-fill Admin Credentials" button in plaintext; a weak fallback password (`admin123`) is referenced.
- **Action:** This is convenient for a demo but is a production risk. Do **not** silently remove it (it may be intentional for handover). Flag it in the changelog and gate it behind a `localhost`-only check, or make it easy for the owner to toggle off. Keep the primary login flow working.

## What is already GOOD (do not "fix") 
- CRM dashboard (`/crm/dashboard`): clean dark sidebar (`#0f172a`), orange accents, working stat cards + charts. **No console errors.**
- Content Studio (`/edit/`): functional section switcher (Courses 107, Colleges 8, Universities 6, Blog 7, YouTube 7, Headers & Menu), working Edit modal with SEO fields, "Save & Publish". **No console errors.**
- `edit.html` ⟺ `edit/index.html` currently **MATCH** (SHA-256). Preserve this.
- Public site hydration and lead-capture flow load without console errors.

Treat these as regression baselines: after your changes, they must remain at least this good.
