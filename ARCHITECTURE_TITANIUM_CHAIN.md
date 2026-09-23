# 🛡️ EDUCATIONISTGURU TITANIUM ARCHITECTURE SPECIFICATION
**Version:** 2.0-unbreakable-titanium  
**Last Updated:** September 2026  
**Status:** Canonical Living Architecture Document  

---

## 📌 Executive Summary & Architectural Invariant
This document is the **single source of truth** for EducationistGuru's unbreakable data persistence, multi-tier disaster recovery vault, and zero-loss lead capture pipeline. 

> [!IMPORTANT]
> **PERMANENT INVARIANT:** Any feature added, modified, or removed in the future **MUST NEVER BREAK** the data persistence chain, the independent rendering lifecycle of other sections, or the lead capture engine. 
> Whenever code changes occur in the codebase, this document and `AGENTS.md` **MUST BE PROACTIVELY UPDATED**.

---

## 🏛️ The Three Titanium Pillars

```
+----------------------------------------------------------------------------------------------------+
|                                    EDUCATIONISTGURU ECOSYSTEM                                     |
+----------------------------------------------------------------------------------------------------+
                                                  |
         +----------------------------------------+----------------------------------------+
         |                                        |                                        |
         v                                        v                                        v
+------------------------+              +------------------------+              +------------------------+
|       PILLAR 1         |              |        PILLAR 2        |              |        PILLAR 3        |
|  Unbreakable Component |              |  Titanium Zero-Loss    |              |  3-Tier External Vault |
|    Rendering Chain     |              |   Lead & Inquiry Engine|              |  & Disaster Recovery   |
+------------------------+              +------------------------+              +------------------------+
| - Isolated try-catches |              | - Append-only Vault    |              | - Tier 1: ./data/      |
| - Null-safe fallbacks  |              |   Ledger in client     |              | - Tier 2: ./backups/   |
| - Zero cascading fail  |              | - 8-sec AbortController|              | - Tier 3: External     |
| - SHA256 Sync:         |              | - Persistent Offline   |              | - Rolling Snapshots    |
|   edit.html ==         |              |   Queue & Auto-Drainer |              | - Full 15-Collection   |
|   edit/index.html      |              | - Duplicate Merge      |              |   Instant Rollback     |
+------------------------+              +------------------------+              +------------------------+
```

---

## 🛡️ PILLAR 1: Unbreakable Component Rendering Chain

### 1.1 Isolated Section Boundaries in `edit/js/edit.js`
In the CMS Editor, all render operations pass through `renderAll()`. Every section renderer is isolated inside its own `try...catch` block:

```javascript
function renderAll() {
    try { populateDynamicFilterDropdowns(); } catch (e) { console.error('[RenderAll] Dynamic filters error:', e); }
    try { renderStats(); } catch (e) { console.error('[RenderAll] Stats error:', e); }
    try { renderCourses(); } catch (e) { console.error('[RenderAll] Courses error:', e); }
    try { renderColleges(); } catch (e) { console.error('[RenderAll] Colleges error:', e); }
    try { renderUniversities(); } catch (e) { console.error('[RenderAll] Universities error:', e); }
    try { renderBlogs(); } catch (e) { console.error('[RenderAll] Blogs error:', e); }
    try { renderVideos(); } catch (e) { console.error('[RenderAll] Videos error:', e); }
    try { renderHeadersTab(); } catch (e) { console.error('[RenderAll] Headers error:', e); }
}
```

### 1.2 Mandatory Defensive Coding Rules
1. **Array Guard:** Always coerce arrays before filtering:  
   `const list = Array.isArray(items) ? items.filter(Boolean) : [];`
2. **String Guard:** Never call `.slice()`, `.toLowerCase()`, or `.trim()` on undefined properties. Always use `String(item.prop || '').trim()`.
3. **Fallback Defaults:**
   - Courses: Duration (`'N/A'`), Mode (`'Online / Regular'`), Image (`'images/courses/1.jpg'`).
   - Colleges: Location (`'India'`), Approvals (`'UGC Approved'`), Categories (`['General']`).
   - Universities: Type (`'University'`), Streams (`['Management', 'Arts']`), Approvals (`'UGC / AICTE Approved'`).
   - Blogs: Author (`'EducationistGuru'`), Date (`'Recent'`), Excerpt (`item.content.slice(...)`).
   - Videos: Thumbnail (`hqdefault.jpg`), Description (`'Watch video guide...'`).

### 1.3 Strict SHA256 Sync Rule
The root editor file `edit.html` and the directory index `edit/index.html` **MUST BE BYTE-FOR-BYTE IDENTICAL AT ALL TIMES**.
- Verification command:
  ```bash
  node -e "const fs=require('fs'), crypto=require('crypto'); const h1=crypto.createHash('sha256').update(fs.readFileSync('edit.html')).digest('hex'); const h2=crypto.createHash('sha256').update(fs.readFileSync('edit/index.html')).digest('hex'); console.log('MATCH:', h1 === h2);"
  ```

---

## ⚡ PILLAR 2: Titanium Zero-Loss Lead & Inquiry Engine

### 2.1 Multi-Layered Lead Capture Pipeline (`js/crm-integration.js`)
When a student initiates WhatsApp chat, requests an instant callback, submits a course enrollment application, or fills a contact form:

1. **Layer 1 (Immediate Local Vault Ledger):**
   - The lead is instantly appended to `localStorage.getItem('eg_lead_vault_ledger')`.
   - This ledger is **append-only** and retains up to 2,000 historical interactions with device info, URL, and timestamps.
2. **Layer 2 (Authoritative Network Submission with AbortController):**
   - Direct HTTP POST sent to `/api/crm/leads` or `/api/crm/inquiries` using `getCrmApiBase()`.
   - Wrapped with an 8-second `AbortController` timeout to prevent hanging on weak 3G/4G networks.
3. **Layer 3 (Offline Resilient Queue & Draft Fallback):**
   - If server fails or times out, item is stamped with `_isLocalOfflineDraft: true` and enqueued into `eg_pending_leads_queue`.
   - The student is **never shown an error message**; they receive an immediate reassuring confirmation screen with a reference ID.

### 2.2 Background Auto-Drainer (`flushOfflineLeadsQueue`)
The queue drainer automatically transfers pending offline leads to the server:
- **Event: Page Load / Script Init** (fires after 2.5s)
- **Event: `window.addEventListener('online')`** (fires immediately when connectivity returns)
- **Event: `document.addEventListener('visibilitychange')`** (fires when student or counsellor switches back to the tab)
- **Timer: `setInterval(flushOfflineLeadsQueue, 30000)`** (recurring heartbeat every 30 seconds)

---

## 🏛️ PILLAR 3: 3-Tier Disaster Recovery & External Vault Savior

### 3.1 Three Storage Tiers
```
Tier 1 (Active)   : ./data/*.json               (Primary operational read/write)
Tier 2 (Mirror)   : ./backups/vault/*.json      (Immediate atomic synchronous mirror)
Tier 3 (External) : ~/.educationistguru_vault   (Persistent OS-level user profile backup)
Snapshots         : ./backups/snapshots/*.json  (Point-in-time timestamped snapshots)
```

### 3.2 Dual Atomic Writes & Self-Healing Reads
- **Write:** Any call to `writeData('courses.json', data)` in PHP or `writeDataFile('courses.json', data)` in Node writes to **both Tier 1 and Tier 2 simultaneously**.
- **Read:** If a file in `./data/` is missing, 0 bytes, or contains corrupt JSON, `readData()` automatically recovers the clean copy from `./backups/vault/` and heals the `./data/` file on the fly.

### 3.3 Complete Database Backup (`GET /api/system/backup`)
Backs up all **15 Core Collections** in a unified JSON bundle:
1. `courses`
2. `colleges`
3. `universities`
4. `blogs`
5. `videos`
6. `leads`
7. `inquiries`
8. `applications`
9. `enrollments`
10. `fees`
11. `subscribers`
12. `users`
13. `roles`
14. `settings`
15. `site_menu`

### 3.4 Savior Fallback Guarantee (`CRM/settings.html`)
If the server is unreachable or offline, the **"Download Full Database JSON"** button in Settings executes a client-side emergency compiler that bundles all 15 collections directly from browser storage (`localStorage`) and triggers the file download. **This download can never fail.**

### 3.5 Point-in-Time Snapshots & Instant Rollback
- **Safety Snapshots:** Automatically created before any restore (`pre_restore_safety`) or rollback (`pre_rollback_safety`).
- **Retention:** Server retains up to 50 rolling snapshots, purging oldest automatically.
- **Rollback API:** `POST /api/system/rollback` accepts `{ snapshotName }`, validates bundle integrity, creates a safety backup, and replaces all 15 collections atomically.

---

## 🔄 API Endpoint Parity Matrix (Hostinger PHP & Local Node.js)

| Route | Method | Description | Handled in `api.php` | Handled in `server.js` |
|---|---|---|:---:|:---:|
| `/api/system/vault-status` | GET | Status & collection counts across storage tiers | ✅ | ✅ |
| `/api/system/backup` | GET | Comprehensive 15-collection JSON download | ✅ | ✅ |
| `/api/system/restore` | POST | Restore database with pre-restore safety snapshot | ✅ | ✅ |
| `/api/system/snapshots` | GET | List rolling point-in-time snapshots | ✅ | ✅ |
| `/api/system/snapshot` | POST | Create manual point-in-time snapshot | ✅ | ✅ |
| `/api/system/rollback` | POST | Rollback entire database to chosen snapshot | ✅ | ✅ |
| `/api/crm/leads` | GET/POST/PUT/DELETE | Full CRUD for Leads & auto-inquiry link | ✅ | ✅ |
| `/api/crm/inquiries` | GET/POST/PUT/DELETE | Full CRUD for Student Inquiries | ✅ | ✅ |
| `/api/crm/all` | GET | 1-roundtrip hydration for CRM dashboard | ✅ | ✅ |

---

---

## 🎨 PILLAR 4: Modern Design System & Authentic UI/UX Standards

### 4.1 Anti-AI Design Philosophy & Visual Tokens
To prevent generic, AI-generated appearance and maintain authentic educational authority:
1. **Typography Unification:** Headings across all public and management views use `--font-display: 'Outfit', sans-serif` in natural Title Case (no aggressive ALL-CAPS). Body text uses `Plus Jakarta Sans` / `Inter`.
2. **Unified Color Palette:** 
   - Primary Brand Orange: `#ff6b00` (Hover: `#e65e00`, Soft Tint: `#fff0e6`)
   - Surface / Dark Slate: `#0f172a` (Elevated: `#1e293b`, Active: `#334155`)
   - Semantic Feedback: Success `#16a34a`, Warning `#f59e0b`, Info `#0ea5e9`, Danger `#ef4444`.
   - The aggressive, discordant `#ff3115` red is deprecated from the main toolbar and CRM dashboard.
3. **4-Tier Elevation System:** Replaces ad-hoc box shadows with light-direction calibrated depth:
   - `--elevation-1`: Subtle card border & micro-depth
   - `--elevation-2`: Interactive elements at rest
   - `--elevation-3`: Hover card lift with `-4px` / `-6px` translate
   - `--elevation-4`: Overlays, dropdowns, and flyout menus
   - `--elevation-orange`: Soft brand glow for primary CTAs (`0 8px 25px -4px rgba(255, 107, 0, 0.2)`)

### 4.2 Kinetic Animation & Scroll Reveal Pipeline
- **Lenis 1.1+ Smooth Engine (`js/smooth-scroll.js`):** Silky 1:1 wheel momentum with zero input lag.
- **Scroll-Triggered Reveal:** `.eg-reveal` elements transition smoothly to `.eg-visible` via an isolated `IntersectionObserver` observing section titles, service cards, course cards, and counters. Elements gracefully degrade if JavaScript is absent.
- **CRM Shimmer Skeletons:** `@keyframes shimmer` provides seamless visual feedback during asynchronous data fetching.

### 4.3 Management Portals (CRM & Edit CMS)
- **CRM (`CRM/css/admin.css`):**
  - Dark Slate `#0f172a` sidebar with high-contrast active route indicator (`rgba(255, 107, 0, 0.12)`).
  - Modern stat cards with 20px radius and animated color accent bars on hover.
  - Data tables with subtle zebra striping, smooth row hover highlight, and quick action bars.
- **Edit CMS (`edit/css/edit.css`):**
  - Sidebar ambient vertical gradient (`linear-gradient(180deg, #0f172a 0%, #1e293b 100%)`).
  - Elevated content cards, animated modal transitions (`modalIn`), and bulk action readiness.
  - Unbroken dual-file SHA256 parity maintained between `edit.html` and `edit/index.html`.

---

## 📋 Protocol for Future Code Changes (Self-Update Instruction)

Whenever you (the AI assistant) or any engineer makes changes to this project, **YOU MUST ADHERE TO THIS 6-STEP PROTOCOL**:

1. **Validate Section Isolation:** Ensure any new UI component or editor module is wrapped in defensive try-catches and doesn't introduce unhandled exceptions.
2. **Verify Dual-Engine Parity:** If an endpoint is added or modified in `server.js`, implement the exact equivalent in `api.php` (and vice-versa).
3. **Verify SHA256 Sync:** If `edit.html` is modified, sync `edit/index.html` and verify identical SHA256 hashes.
4. **Follow Anti-AI Design Rules:** Use unified design tokens (`--font-display`, `--primary: #ff6b00`, `--elevation-*`). Never reintroduce harsh red bars or repetitive template placeholder copy.
5. **Update Documentation:** Append any new collections, fields, or endpoints to this document (`ARCHITECTURE_TITANIUM_CHAIN.md`) and verify against `AGENTS.md`.
6. **Rebuild Production Bundle:** Run `node scratch/build_production_bundle.js` to ensure the Hostinger release zip (`educationistguru_production_package.zip`) is always up-to-date and ready for instant deployment.

