# EducationistGuru — Agent Remediation Plan (for Gemini 3.8)

> **Purpose:** This folder is a complete, self-contained execution plan. Read every file in order, then execute the phases in order. It is written so that another agent can act exactly like the senior agent who audited this codebase and fix everything **properly, safely, and without breaking the Titanium architecture.**

## How to use this folder

Read these files **in this exact order** before writing a single line of code:

| # | File | What it gives you |
|---|------|-------------------|
| 1 | `01_CONTEXT_AND_RULES.md` | What this project is, how it runs, and the **6 non-negotiable invariants** you may never violate. |
| 2 | `02_WORKING_METHOD.md` | How to behave like the senior agent: investigate → change → verify in a real browser → document. |
| 3 | `03_BUG_FINDINGS.md` | Every confirmed bug, with evidence and root cause. Do not re-debug; this is already done for you. |
| 4 | `04_PHASE_PLAN.md` | **The main deliverable.** Phase-by-phase fixes with exact files, line references, and copy-ready code. |
| 5 | `05_UIUX_ENHANCEMENTS.md` | The visual/UX upgrade brief to put this site ahead of competitors — without changing structure. |
| 6 | `06_CMS_CRM_MANAGEMENT.md` | **⚑ BUSINESS-CRITICAL.** The CRM + Content Studio (EDIT) are how the business runs and earns — refine and harden them so they are frictionless and unbreakable. They must never break. Verify-and-preserve first; the safety machinery is already built. |
| 7 | `07_VERIFICATION_CHECKLIST.md` | The gate you must pass before declaring done, plus the change-log you must write. |

## Golden rules (the 10-second version)

1. **Never break the Unbreakable Section Chain.** Every CMS section renders inside its own `try/catch`; one bad record must never blank another section.
2. **`edit.html` and `edit/index.html` must stay byte-for-byte identical (same SHA-256).** Edit one → mirror the change into the other in the same commit. They currently MATCH — keep it that way.
3. **`server.js` (Node) and `api.php` (PHP) must stay feature-identical.** Any route/fix added to one goes into the other.
4. **Never lose a lead.** The CRM lead-capture vault, offline queue, and 8s abort protection are sacred.
5. **Refine, do not rebuild.** Keep the existing structure, markup skeleton, routes, and data contracts. Improve styling, fix bugs, add missing polish.
6. **Verify every visible change in a real browser** with `agent-browser` before moving on.
7. **Respect the design system:** `--primary` orange `#ff6b00`, dark sidebar `#0f172a`, fonts Outfit + Plus Jakarta Sans. Never reintroduce the harsh `#ff3115` red bar.
8. **After schema/route/UI changes:** update `ARCHITECTURE_TITANIUM_CHAIN.md`, run `node scratch/test_unbreakable_system.js`, then `node scratch/build_production_bundle.js`.
9. **Work phase by phase.** Finish, verify, and log each phase before starting the next.
10. **When done, write `AGENT_FIX_PLAN/CHANGELOG_DONE.md`** describing exactly what changed, so the next agent is never confused.

## Environment quick reference

- Run the site: `node server.js` → serves on `http://localhost:3000/`
- Public site entry: `index.html`. CMS editor: `/edit/`. CRM: `/CRM/`. Mobile app shell: `/app/`.
- Data store: flat JSON in `data/*.json`. Public site hydrates from `/api/content/*`.
- Browser testing: use the `agent-browser` CLI (see `02_WORKING_METHOD.md`).
