# 05 — UI/UX Enhancement Brief (put it ahead of competitors)

**Constraint:** Refine, don't restructure. Improve styling, spacing, typography, motion, and clarity within the existing markup and routes. Every change must survive a desktop + mobile browser check.

## Competitive context (what leading admissions/counseling sites do well)
Benchmarks in this space (e.g. large Indian admission-counseling portals and modern edtech sites) win on:
1. **Instant trust:** accreditation badges (UGC/AICTE/NAAC/AIU), real counselor faces, transparent fees, student outcomes/placements.
2. **Frictionless lead capture:** a persistent, low-pressure "Get free counseling / Request callback" that is always reachable but never annoying.
3. **Fast, scannable course/university discovery:** strong filters, comparison, clear eligibility + fee at a glance.
4. **Credible content:** genuine blogs/guides, FAQ, video guidance — positioned as an authority.
5. **Speed + polish:** fast load, smooth motion, no layout shift, flawless mobile.

Aim to match #1–#5 while keeping the current information architecture.

## Design system (use tokens; do not invent new palettes)
- Primary brand: `--primary` orange **`#ff6b00`** (with a warm `#ffa800` for gradients/accents).
- Dark surfaces: `--sidebar-bg` **`#0f172a`** (used in CRM/editor and footer).
- Fonts: display = **Outfit** (`--font-display`), body = **Plus Jakarta Sans** (`--font-sans`). Max 2 families.
- Neutrals: near-white background, slate grays for text. Keep total palette to ~4–5 colors.
- **Never** `#ff3115` harsh red. Reserve true red only for destructive actions.
- Body line-height 1.4–1.6; wrap headlines in `text-balance`/`text-pretty` where the CSS allows.

## High-impact, low-risk enhancements (public site)

### A. Hero (index.html)
- Keep the structure. Improve legibility: stronger, controlled gradient scrim over the campus photo so the headline always has contrast; tighten the headline/subhead rhythm; make the two CTAs clearly primary (filled orange) vs secondary (outline). Ensure the animated "Welcome" layer (see Phase 2) never overlaps.
- Add a slim trust bar directly under the hero CTAs: "UGC-DEB Approved • 15+ Faculties • 90+ Programs • Free Expert Counseling" — small, tasteful, load-bearing (not decorative filler).

### B. Cards (courses / colleges / universities)
- Consistent card system: equal heights, consistent image aspect ratio (use `object-fit: cover`), clear title → meta (duration/eligibility/mode) → fee → actions. Subtle elevation on hover (`transform: translateY(-4px)` + soft shadow), never jarring.
- Ensure the fee/eligibility line is always visible "above the fold" of the card — that is the decision info.
- Add a lightweight filter/search polish where it already exists (courses page) — sticky filter bar, active-filter chips.

### C. Trust & credibility sections
- Replace the broken partners strip (Phase 1) with a clean, greyscale-on-default / color-on-hover accreditation row.
- Founder/leadership section already exists (Jatinder Kaur) — keep it; refine typography and spacing, add a subtle verified/credential line.

### D. Conversion elements
- Keep the floating "Request Callback" and WhatsApp button, but make them polished and non-overlapping on mobile (stack/space them; respect safe areas). They must never cover primary CTAs.
- Every major section should have one clear next step (Explore / Apply / Talk to a counselor).

### E. Motion (purposeful, not scattered)
- One well-orchestrated entrance per section (staggered fade/slide on scroll) using the existing smooth-scroll/lenis setup. Avoid many competing micro-animations. Respect `prefers-reduced-motion`.

### F. Accessibility & performance
- All images have meaningful `alt` (or empty `alt=""` if decorative). Add `loading="lazy"` to below-the-fold images and explicit `width`/`height` to cut CLS.
- Sufficient color contrast on orange-on-white text (use a darker orange for small text if needed).
- Keyboard focus states visible on all interactive elements.
- Target: no CLS regressions; LCP reasonable. Check with `agent-browser vitals http://localhost:3000/ --json`.

## Where to make CSS changes
- Global/site: `style.css` (large, the main stylesheet) and `css/smooth-ui.css`.
- Page-specific: `css/courses.css`, `css/colleges-universities.css`, `css/blog.css`, `css/youtube.css`, `css/responsive.css`, `css/site-menu.css`, `css/motion-welcome.css`.
- Prefer adding scoped rules over rewriting existing ones; reuse existing class names so JS hydration keeps working.

## Guardrails
- Do not change class names/IDs that `js/cms-content.js`, `js/site-menu.js`, or `js/*-manager.js` query for hydration. Search before renaming.
- After each visual change: desktop (1280×800) **and** mobile (375×812) screenshot; confirm no overflow, no overlap, no broken image.
- Keep it tasteful: one signature element per view, quiet supporting UI. Remove anything decorative that isn't load-bearing.
