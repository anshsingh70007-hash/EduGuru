# 🤖 ANTIGRAVITY AGENT OPERATING GUIDELINES & ARCHITECTURAL INVARIANTS

> **PROJECT:** EducationistGuru.com (Production Educational Portal & Admissions CRM)  
> **ARCHITECTURAL BASELINE:** Titanium 3-Pillar Unbreakable Architecture  
> **LIVING SPECIFICATION FILE:** [`ARCHITECTURE_TITANIUM_CHAIN.md`](file:///c:/Users/Harmeet%20Singh/Downloads/educationistguru.com/ARCHITECTURE_TITANIUM_CHAIN.md)

---

## 🚨 MANDATORY INSTRUCTIONS FOR THE AGENT (DO NOT VIOLATE)

Whenever you are interacting with or modifying this codebase, you **MUST STRICTLY OBEY** the following 6 core invariants:

### 1. UNBREAKABLE SECTION CHAIN IS SACROSANCT
- The CMS editor manages 5 primary sections (`courses`, `colleges`, `universities`, `blogs`, `videos`) + `siteMenu` + CRM.
- **NEVER** allow an error, missing property, or null entry in one section to stop or break other sections.
- In [`edit/js/edit.js`](file:///c:/Users/Harmeet%20Singh/Downloads/educationistguru.com/edit/js/edit.js):
  - Every section in `renderAll()` must stay wrapped in its own isolated `try...catch` block.
  - All filtering and mapping functions must defend against null items (`Array.isArray(x) ? x.filter(Boolean) : []`) and undefined properties.
  - Never call methods like `.slice()`, `.trim()`, or `.toLowerCase()` without `String(val || '')` coercion.

### 2. DUAL-FILE SHA256 PARITY (`edit.html` <===> `edit/index.html`)
- The root [`edit.html`](file:///c:/Users/Harmeet%20Singh/Downloads/educationistguru.com/edit.html) and subdirectory [`edit/index.html`](file:///c:/Users/Harmeet%20Singh/Downloads/educationistguru.com/edit/index.html) must remain **100% byte-for-byte identical (matching SHA256)** at all times.
- Whenever you edit one of them, you **must immediately synchronize the exact same changes** to the other.
- Verification command:
  ```powershell
  node -e "const fs=require('fs'), crypto=require('crypto'); const h1=crypto.createHash('sha256').update(fs.readFileSync('edit.html')).digest('hex'); const h2=crypto.createHash('sha256').update(fs.readFileSync('edit/index.html')).digest('hex'); console.log('MATCH:', h1 === h2);"
  ```

### 3. TITANIUM LEAD CAPTURE & ZERO-LOSS GUARANTEE
- Student leads, callback requests, WhatsApp inquiries, and applications are the lifeblood of the business.
- In [`js/crm-integration.js`](file:///c:/Users/Harmeet%20Singh/Downloads/educationistguru.com/js/crm-integration.js):
  - **Append-Only Vault Ledger:** Every lead must first be permanently stamped into `eg_lead_vault_ledger` in client `localStorage`.
  - **8-Second Abort Protection:** Server submissions must use an `AbortController` timeout (7-8s) so weak student mobile networks don't freeze the UI.
  - **Offline Sync Queue (`eg_pending_leads_queue`):** Any failed or offline submission must be queued with `_isLocalOfflineDraft: true`.
  - **Background Drainer (`flushOfflineLeadsQueue`):** Must automatically trigger on script load, `online` event, `visibilitychange` event, and 30-second interval.
  - **Reassuring UX:** Never display a network error or red alert to a student submitting an admission form; provide a success confirmation and queue for background sync.

### 4. EXTERNAL VAULT & DISASTER RECOVERY (SAVIOR GUARANTEE)
- In [`CRM/settings.html`](file:///c:/Users/Harmeet%20Singh/Downloads/educationistguru.com/CRM/settings.html):
  - Always use `getSettingsApiBase()` to prevent origin/port/file protocol breakage.
  - The **"Download Full Database JSON"** button must ALWAYS have the dual-layer fallback: primary server `/api/system/backup` + emergency client-side compiler from `localStorage`. **It must NEVER fail, even if the server is completely down.**
  - **Dual-Layer Restore:** Restoring a backup must write to both local client cache (`localStorage`) and the server endpoint `/api/system/restore`.
  - Point-in-time snapshots and rollbacks (`/api/system/snapshots`, `/api/system/snapshot`, `/api/system/rollback`) must be preserved and tested.

### 5. DUAL-ENGINE PARITY (`api.php` <===> `server.js`)
- Hostinger Apache/LiteSpeed runs PHP via [`api.php`](file:///c:/Users/Harmeet%20Singh/Downloads/educationistguru.com/api.php).
- Local development runs Node.js via [`server.js`](file:///c:/Users/Harmeet%20Singh/Downloads/educationistguru.com/server.js).
- **EVERY SINGLE ROUTE, FIX, OR FEATURE** added to `server.js` must also be implemented identically in `api.php` (and vice-versa).
- Both engines must support:
  - 3-tier vault persistence (Primary `./data/`, Vault Mirror `./backups/vault/`, Snapshots `./backups/snapshots/`).
  - Self-healing on `readData()`.
  - Pre-restore and pre-rollback safety snapshots.
  - All CRM routes (`/api/crm/leads`, `/api/crm/inquiries`, `/api/crm/all`, etc.).

### 6. SELF-UPDATING ARCHITECTURE PROTOCOL (NEVER FUMBLE)
- **Time-to-time Architecture Maintenance:** If you or any user request adds a new data collection, changes data schemas, introduces a new API route, or modifies UI workflows:
  1. **Immediately update [`ARCHITECTURE_TITANIUM_CHAIN.md`](file:///c:/Users/Harmeet%20Singh/Downloads/educationistguru.com/ARCHITECTURE_TITANIUM_CHAIN.md)** with the new details.
  2. **Update this [`AGENTS.md`](file:///c:/Users/Harmeet%20Singh/Downloads/educationistguru.com/AGENTS.md)** file if new invariants or rules are created.
  3. **Run the test suite:**
     ```bash
     node scratch/test_unbreakable_system.js
     ```
  4. **Rebuild the production package:**
     ```bash
     node scratch/build_production_bundle.js
     ```
     This keeps `educationistguru_production_package.zip` permanently fresh for 1-click Hostinger cPanel extraction.

### 7. ANTI-AI DESIGN SYSTEM & VISUAL HARMONY
- Public portal, CRM, and Edit CMS must uphold hand-crafted, authentic aesthetic standards.
- Always use the unified design tokens (`var(--font-display)` Outfit, `var(--font-sans)` Plus Jakarta Sans, `var(--primary)` #ff6b00 brand orange, and `var(--sidebar-bg)` #0f172a).
- Never reintroduce abrasive, flat red bars (`#ff3115`) on the public toolbar or CRM navigation.
- Never use repetitive template dummy copy. Keep copy authentic, human, and tailored to accredited Indian higher education counseling.

