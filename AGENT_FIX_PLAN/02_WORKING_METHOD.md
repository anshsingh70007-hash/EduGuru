# 02 — Working Method (How to behave like the senior agent)

Follow this loop for **every** change. Do not skip verification.

## The loop: Investigate → Change → Verify → Log

### 1. Investigate first (never guess)
- Read the actual file and the code directly around your change before editing.
- Trace where data comes from: public pages are hydrated by `js/cms-content.js` from `/api/content/*`; the editor by `edit/js/edit.js`; CRM by `js/crm-integration.js` + `CRM/js/data.js`.
- Use `grep`/search to find every caller before renaming or changing a shared function or data key.
- Reuse what you already learned; stop searching once the change and its validation path are clear.

### 2. Make the smallest correct change
- Edit only the files that must change. Prefer targeted edits over rewrites.
- When removing code, remove the *usage* first, then the now-unused import/definition.
- Keep the existing structure and data contracts intact (see scope boundaries in `01`).
- Preserve existing comments and system markers (e.g. `{/* ... */}`, cache-bust query strings like `?v=3.5.0`).

### 3. Verify in a real browser (mandatory for anything visible)
Start the server once, then drive the browser with `agent-browser`:
```bash
node server.js        # run in background; serves http://localhost:3000/
```
```bash
# Public page visual check (match the user's dark theme):
agent-browser open "http://localhost:3000/" && agent-browser set media dark \
  && agent-browser set viewport 1280 800 && agent-browser wait --load networkidle \
  && agent-browser screenshot /tmp/agent-browser/check.png && agent-browser errors
```
- **Always** save screenshots under `/tmp/agent-browser/` — never inside the project (they can be committed).
- After an interaction that should change state, snapshot again before the next action (refs go stale).
- Check both `agent-browser console` (client) and the server log / `user_read_only_context/v0_debug_logs.log` (server + compile).
- For broken images: `agent-browser eval "(()=>[...document.images].filter(i=>i.complete&&i.naturalWidth===0).map(i=>i.src))()"`.

**Credentials for gated areas (local/dev):**
- CRM (`/CRM/`): `admin@educationistguru.com` / `EduGuru#Admin2026!` (there is an "Auto-fill" button).
- Content Studio (`/edit/`): same email + `EduGuru#Admin2026!`.

### 4. Log every change
Keep a running note. At the very end you will write `AGENT_FIX_PLAN/CHANGELOG_DONE.md` (see `07`).

## Hard safety gates specific to this repo (run before finishing any phase that touches them)

```bash
# A) edit.html <=> edit/index.html must stay identical (INVARIANT 2)
node -e "const fs=require('fs'),c=require('crypto');const h=f=>c.createHash('sha256').update(fs.readFileSync(f)).digest('hex');console.log('EDIT PARITY MATCH:',h('edit.html')===h('edit/index.html'));"

# B) Unbreakable-system test suite (INVARIANT 6)
node scratch/test_unbreakable_system.js
node scratch/test_unbreakable_recovery.js

# C) Rebuild the deployable bundle after schema/route/UI changes (INVARIANT 6)
node scratch/build_production_bundle.js
```

If a test fails, fix the cause and re-run — a failing test is real feedback, not an environment problem.

## Golden behavioral principles
- **Do no harm to leads or content.** If unsure whether a change risks the lead vault, the offline queue, or the section chain — don't do it; note it instead.
- **Refine, don't rebuild.** The CRM and Content Studio already work and look decent. Polish and harden; do not replace them.
- **Every public change is checked at desktop AND mobile** (`agent-browser set viewport 375 812`).
- **Keep the two engines in lockstep.** A server.js change without the matching api.php change is an incomplete change.
