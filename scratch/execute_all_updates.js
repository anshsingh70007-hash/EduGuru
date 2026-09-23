const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const editHtmlPath = path.join(rootDir, 'edit', 'index.html');
const rootEditHtmlPath = path.join(rootDir, 'edit.html');
const cssPath = path.join(rootDir, 'edit', 'css', 'edit.css');
const serverPath = path.join(rootDir, 'server.js');

console.log('--- Step 1: Updating edit/index.html and edit.html ---');
let html = fs.readFileSync(editHtmlPath, 'utf8');

// Normalize line endings for reliable replacement
const isCRLF = html.includes('\r\n');
const newline = isCRLF ? '\r\n' : '\n';

// 1. College Modal Update (Add Meta Description, Tags, Keywords, Facilities)
if (!html.includes('collegeMetaDescInput')) {
    console.log('Injecting SEO and Facilities into College Modal...');
    // Find Section 1 end: closing </div> of Section 1
    const targetPattern = /<input[^>]*id="collegeAccreditationInput"[^>]*>[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/;
    const match = html.match(targetPattern);
    if (match) {
        const replacement = `<input type="text" id="collegeAccreditationInput" class="form-control" placeholder="e.g. PCI Approved, AICTE, NAAC A+">
                            </div>
                        </div>

                        <!-- 2. Meta Description (SEO Google Snippet) -->
                        <div class="form-group" style="margin-top:14px;">
                            <label><strong>2. Meta Description (SEO Google Snippet)</strong></label>
                            <textarea id="collegeMetaDescInput" class="form-control" rows="2" maxlength="200" placeholder="e.g. Admissions Open at Metro Institute of Pharmaceutical Sciences. Approved by PCI & AICTE with 100% placement support."></textarea>
                            <div class="meta-counter"><span id="collegeMetaCount">0 / 160 characters</span><span>Recommended: 120-160 characters for search rankings</span></div>
                        </div>

                        <!-- 3 & 4. Tags ++ and Keywords ++ -->
                        <div class="form-row">
                            <div class="form-group">
                                <label><strong>3. Tags (+ +)</strong></label>
                                <div class="chip-input-wrapper">
                                    <input type="text" id="collegeTagInput" class="form-control" placeholder="e.g. Top Pharmacy College">
                                    <button type="button" class="btn btn-sm btn-outline" onclick="window.addChip('college', 'tag')"><i class="fa fa-plus"></i></button>
                                </div>
                                <div class="chips-container" id="collegeTagsChips"></div>
                            </div>
                            <div class="form-group">
                                <label><strong>4. Keywords (+ +)</strong></label>
                                <div class="chip-input-wrapper">
                                    <input type="text" id="collegeKeywordInput" class="form-control" placeholder="e.g. B.Pharm Admission Delhi">
                                    <button type="button" class="btn btn-sm btn-outline" onclick="window.addChip('college', 'kw')"><i class="fa fa-plus"></i></button>
                                </div>
                                <div class="chips-container" id="collegeKeywordsChips"></div>
                            </div>
                        </div>

                        <!-- 5. Campus Facilities (++ Chips & 1-Click Preset Toggles) -->
                        <div class="form-group" style="margin-top:12px;">
                            <label><strong>5. Campus Facilities (+ +)</strong> <span style="font-weight:400; color:#64748b;">(Add custom or tap quick presets below)</span></label>
                            <div class="chip-input-wrapper">
                                <input type="text" id="collegeFacilityInput" class="form-control" placeholder="e.g. Wi-Fi Campus, Modern Computer Labs, AC Hostel">
                                <button type="button" class="btn btn-sm btn-outline" onclick="window.addChip('college', 'fac')"><i class="fa fa-plus"></i></button>
                            </div>
                            <div class="chips-container" id="collegeFacilitiesChips" style="margin-top:6px;"></div>

                            <!-- 1-Click Quick Facility Toggles -->
                            <div style="margin-top:8px; display:flex; flex-wrap:wrap; gap:6px;">
                                <span class="facility-preset-pill" onclick="window.addPresetFacility('college', 'Wi-Fi Campus')"><i class="fa fa-wifi"></i> + Wi-Fi Campus</span>
                                <span class="facility-preset-pill" onclick="window.addPresetFacility('college', 'Boys & Girls Hostel')"><i class="fa fa-bed"></i> + Hostel</span>
                                <span class="facility-preset-pill" onclick="window.addPresetFacility('college', 'Advanced Research Labs')"><i class="fa fa-flask"></i> + Modern Labs</span>
                                <span class="facility-preset-pill" onclick="window.addPresetFacility('college', 'Digital Library & E-Books')"><i class="fa fa-book"></i> + Central Library</span>
                                <span class="facility-preset-pill" onclick="window.addPresetFacility('college', 'Sports Complex & Gym')"><i class="fa fa-futbol-o"></i> + Sports Complex</span>
                                <span class="facility-preset-pill" onclick="window.addPresetFacility('college', 'Cafeteria & Mess')"><i class="fa fa-cutlery"></i> + Cafeteria</span>
                                <span class="facility-preset-pill" onclick="window.addPresetFacility('college', 'Placement Cell & Tie-ups')"><i class="fa fa-briefcase"></i> + Placement Cell</span>
                                <span class="facility-preset-pill" onclick="window.addPresetFacility('college', 'Auditorium & Seminars')"><i class="fa fa-users"></i> + Auditorium</span>
                                <span class="facility-preset-pill" onclick="window.addPresetFacility('college', 'Medical Support & Ambulance')"><i class="fa fa-heartbeat"></i> + Medical Center</span>
                            </div>
                        </div>
                    </div>`;
        html = html.replace(match[0], replacement);
        console.log('✅ Injected SEO and Facilities into College Modal');
    } else {
        console.warn('⚠️ Could not match targetPattern for College Modal');
    }
}

// 2. University Modal Update (Add Meta Description, Tags, Keywords, Facilities)
if (!html.includes('univMetaDescInput')) {
    console.log('Injecting SEO and Facilities into University Modal...');
    const targetPatternUniv = /<input[^>]*id="univModesInput"[^>]*>[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/;
    const matchUniv = html.match(targetPatternUniv);
    if (matchUniv) {
        const replacementUniv = `<input type="text" id="univModesInput" class="form-control" placeholder="e.g. Online / Regular / Distance Learning">
                            </div>
                        </div>

                        <!-- 2. Meta Description (SEO Google Snippet) -->
                        <div class="form-group" style="margin-top:14px;">
                            <label><strong>2. Meta Description (SEO Google Snippet)</strong></label>
                            <textarea id="univMetaDescInput" class="form-control" rows="2" maxlength="200" placeholder="e.g. Swami Vivekanand Subharti University Admissions 2026. UGC-DEB approved degrees in MBA, BA, B.Com, MCA with transparent fees."></textarea>
                            <div class="meta-counter"><span id="univMetaCount">0 / 160 characters</span><span>Recommended: 120-160 characters for search rankings</span></div>
                        </div>

                        <!-- 3 & 4. Tags ++ and Keywords ++ -->
                        <div class="form-row">
                            <div class="form-group">
                                <label><strong>3. Tags (+ +)</strong></label>
                                <div class="chip-input-wrapper">
                                    <input type="text" id="univTagInput" class="form-control" placeholder="e.g. UGC-DEB University">
                                    <button type="button" class="btn btn-sm btn-outline" onclick="window.addChip('univ', 'tag')"><i class="fa fa-plus"></i></button>
                                </div>
                                <div class="chips-container" id="univTagsChips"></div>
                            </div>
                            <div class="form-group">
                                <label><strong>4. Keywords (+ +)</strong></label>
                                <div class="chip-input-wrapper">
                                    <input type="text" id="univKeywordInput" class="form-control" placeholder="e.g. Distance Degree Government Valid">
                                    <button type="button" class="btn btn-sm btn-outline" onclick="window.addChip('univ', 'kw')"><i class="fa fa-plus"></i></button>
                                </div>
                                <div class="chips-container" id="univKeywordsChips"></div>
                            </div>
                        </div>

                        <!-- 5. University Facilities (++ Chips & 1-Click Preset Toggles) -->
                        <div class="form-group" style="margin-top:12px;">
                            <label><strong>5. University Campus Facilities (+ +)</strong> <span style="font-weight:400; color:#64748b;">(Add custom or tap quick presets below)</span></label>
                            <div class="chip-input-wrapper">
                                <input type="text" id="univFacilityInput" class="form-control" placeholder="e.g. Student LMS Portal, Digital Evaluation, Smart Campus">
                                <button type="button" class="btn btn-sm btn-outline" onclick="window.addChip('univ', 'fac')"><i class="fa fa-plus"></i></button>
                            </div>
                            <div class="chips-container" id="univFacilitiesChips" style="margin-top:6px;"></div>

                            <!-- 1-Click Quick Facility Toggles -->
                            <div style="margin-top:8px; display:flex; flex-wrap:wrap; gap:6px;">
                                <span class="facility-preset-pill" onclick="window.addPresetFacility('univ', 'Online Student LMS Portal')"><i class="fa fa-laptop"></i> + Student LMS</span>
                                <span class="facility-preset-pill" onclick="window.addPresetFacility('univ', 'Wi-Fi Enabled Campus')"><i class="fa fa-wifi"></i> + Wi-Fi Campus</span>
                                <span class="facility-preset-pill" onclick="window.addPresetFacility('univ', 'E-Library & Study Portals')"><i class="fa fa-book"></i> + E-Library</span>
                                <span class="facility-preset-pill" onclick="window.addPresetFacility('univ', 'Hostel Accommodations')"><i class="fa fa-bed"></i> + Campus Hostels</span>
                                <span class="facility-preset-pill" onclick="window.addPresetFacility('univ', 'Central Placement Cell')"><i class="fa fa-briefcase"></i> + Placement Cell</span>
                                <span class="facility-preset-pill" onclick="window.addPresetFacility('univ', 'Medical & Healthcare Center')"><i class="fa fa-heartbeat"></i> + Medical Hospital</span>
                                <span class="facility-preset-pill" onclick="window.addPresetFacility('univ', 'Sports Complex & Stadium')"><i class="fa fa-trophy"></i> + Sports Stadium</span>
                                <span class="facility-preset-pill" onclick="window.addPresetFacility('univ', 'Global Alumni Network')"><i class="fa fa-globe"></i> + Alumni Cell</span>
                            </div>
                        </div>
                    </div>`;
        html = html.replace(matchUniv[0], replacementUniv);
        console.log('✅ Injected SEO and Facilities into University Modal');
    } else {
        console.warn('⚠️ Could not match targetPatternUniv for University Modal');
    }
}

// 3. Inject Section 6: Headers & Menu Tab (`#tab-headers`)
if (!html.includes('id="tab-headers"')) {
    console.log('Injecting Headers & Menu Tab (#tab-headers)...');
    const tabHeadersHtml = `
                <!-- ================= TAB 6: HEADERS & MENU ================= -->
                <section class="tab-pane" id="tab-headers">
                    <div class="section-header">
                        <div>
                            <h2>6. Website Headers &amp; Navigation Menu</h2>
                            <p>Manage the top announcement ribbon, navigation menu items, dropdowns, and sync changes across the entire website in real-time.</p>
                        </div>
                        <div style="display:flex; gap:10px;">
                            <button class="btn btn-outline" onclick="window.loadHeaders()" title="Reload navigation configuration">
                                <i class="fa fa-refresh"></i> Refresh
                            </button>
                            <button class="btn btn-primary" onclick="window.openHeaderModal()" style="background:#f59e0b; border-color:#f59e0b;">
                                <i class="fa fa-plus"></i> Add Custom Nav Link / Dropdown
                            </button>
                        </div>
                    </div>

                    <!-- CARD 1: TOP ANNOUNCEMENT BAR RIBBON -->
                    <div class="form-section-card" style="margin-bottom:24px;">
                        <div class="form-section-header">
                            <span class="form-section-title"><i class="fa fa-bullhorn" style="color:#f59e0b;"></i> Top Announcement Ribbon Bar</span>
                            <div style="display:flex; align-items:center; gap:8px;">
                                <input type="checkbox" id="headerAnnouncementEnabled" style="cursor:pointer; width:16px; height:16px;">
                                <label for="headerAnnouncementEnabled" style="margin:0; cursor:pointer; font-weight:700; font-size:13px; color:#1e293b;">Enable Ribbon on Website</label>
                            </div>
                        </div>
                        <p class="form-section-desc">Appears at the very top of all website pages. Perfect for urgent admission alerts, UGC session updates, and direct counseling phone numbers.</p>

                        <div class="form-group">
                            <label><strong>Ribbon Alert Message Text</strong></label>
                            <input type="text" id="headerAnnouncementText" class="form-control" placeholder="🎓 Admissions Open for Session 2024-25 | UGC-DEB Approved Degree Programs | Call for Free Counseling: +91 87504 77000">
                        </div>

                        <div class="form-row">
                            <div class="form-group">
                                <label><i class="fa fa-phone" style="color:#10b981;"></i> Helpline Phone</label>
                                <input type="text" id="headerAnnouncementPhone" class="form-control" placeholder="+91 87504 77000">
                            </div>
                            <div class="form-group">
                                <label><i class="fa fa-whatsapp" style="color:#25d366;"></i> WhatsApp Number</label>
                                <input type="text" id="headerAnnouncementWhatsapp" class="form-control" placeholder="918750477000">
                            </div>
                            <div class="form-group">
                                <label><i class="fa fa-envelope" style="color:#3b82f6;"></i> Support Email</label>
                                <input type="text" id="headerAnnouncementEmail" class="form-control" placeholder="info@educationistguru.com">
                            </div>
                        </div>

                        <div class="form-row">
                            <div class="form-group">
                                <label>Call to Action (CTA) Button Text</label>
                                <input type="text" id="headerAnnouncementCtaText" class="form-control" placeholder="Apply Now">
                            </div>
                            <div class="form-group">
                                <label>CTA Target URL / Link</label>
                                <input type="text" id="headerAnnouncementCtaLink" class="form-control" placeholder="contact.html">
                            </div>
                            <div class="form-group" style="display:flex; align-items:flex-end;">
                                <button type="button" class="btn btn-primary" onclick="window.saveAnnouncementBar()" style="width:100%; background:#10b981; border-color:#10b981;">
                                    <i class="fa fa-check"></i> Save Ribbon Bar
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- CARD 2: MAIN NAVIGATION MENU & DROPDOWN ITEMS -->
                    <div class="form-section-card">
                        <div class="form-section-header">
                            <span class="form-section-title"><i class="fa fa-bars" style="color:#f59e0b;"></i> Main Navigation Items &amp; Mega-Menu</span>
                            <span class="form-section-badge active" id="headerNavCountBadge">10 Active Items</span>
                        </div>
                        <p class="form-section-desc">All header navigation links and dropdown tiers. Reorder, edit URLs, customize badges (Popular, UGC Valid, etc.), or add custom board/university links.</p>

                        <div class="header-nav-items-list" id="headerNavItemsList" style="display:flex; flex-direction:column; gap:10px; margin-top:16px;">
                            <!-- Dynamically populated header items -->
                        </div>
                    </div>
                </section>
`;
    html = html.replace('<!-- ================= TAB 7: OVERVIEW ================= -->', `${tabHeadersHtml}\n                <!-- ================= TAB 7: OVERVIEW ================= -->`);
    console.log('✅ Injected #tab-headers section into edit/index.html');
}

// 4. Inject Custom Header Modal (`#headerModal`)
if (!html.includes('id="headerModal"')) {
    console.log('Injecting #headerModal dialog into edit/index.html...');
    const headerModalHtml = `
    <!-- ================= ADD / EDIT HEADER NAVIGATION MODAL ================= -->
    <div class="modal-overlay" id="headerModal">
        <div class="modal-dialog" style="max-width: 680px;">
            <div class="modal-header">
                <h3 id="headerModalTitle"><i class="fa fa-bars" style="color:#f59e0b;"></i> Add / Edit Navigation Link</h3>
                <button class="modal-close" onclick="window.closeHeaderModal()">&times;</button>
            </div>
            <form id="headerForm">
                <div class="modal-body">
                    <input type="hidden" id="headerItemId">
                    <div class="form-group">
                        <label><strong>Navigation Title (e.g. Boards &amp; Open Schooling, Subharti MBA)</strong> <span class="req">*</span></label>
                        <input type="text" id="headerItemTitle" class="form-control" placeholder="e.g. Open Schooling / NIOS" required>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label><strong>Target Link URL</strong></label>
                            <input type="text" id="headerItemUrl" class="form-control" placeholder="e.g. contact.html or # or blog-details.html?id=100">
                        </div>
                        <div class="form-group">
                            <label><strong>Navigation Type</strong></label>
                            <select id="headerItemType" class="form-control" onchange="window.toggleHeaderChildrenSection(this.value)">
                                <option value="link">Direct Page Link</option>
                                <option value="dropdown">Multi-Item Dropdown Menu</option>
                            </select>
                        </div>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label>Optional Badge Text (e.g. Popular, UGC Valid, New)</label>
                            <input type="text" id="headerItemBadge" class="form-control" placeholder="e.g. New 2026">
                        </div>
                        <div class="form-group">
                            <label>Display Order (Priority)</label>
                            <input type="number" id="headerItemOrder" class="form-control" value="10" min="1" max="99">
                        </div>
                    </div>

                    <!-- Dropdown Sub-Items Builder -->
                    <div id="headerChildrenSection" style="display:none; margin-top:14px; border-top:1px dashed #e2e8f0; padding-top:14px;">
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                            <label style="margin:0; font-weight:700; font-size:13.5px; color:#1e293b;"><i class="fa fa-level-down" style="color:#f59e0b;"></i> Dropdown Sub-Items (Children Links)</label>
                            <button type="button" class="btn btn-sm btn-outline" onclick="window.addHeaderChildRow()">
                                <i class="fa fa-plus"></i> Add Sub-Item
                            </button>
                        </div>
                        <div id="headerChildrenList" style="display:flex; flex-direction:column; gap:8px;"></div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-outline" onclick="window.closeHeaderModal()">Cancel</button>
                    <button type="submit" class="btn btn-primary" style="background:#f59e0b; border-color:#f59e0b;"><i class="fa fa-check"></i> Save Navigation Item</button>
                </div>
            </form>
        </div>
    </div>
`;
    html = html.replace('</body>', `${headerModalHtml}\n</body>`);
    console.log('✅ Injected #headerModal dialog into edit/index.html');
}

fs.writeFileSync(editHtmlPath, html, 'utf8');
fs.writeFileSync(rootEditHtmlPath, html, 'utf8');
console.log('✅ Synchronized edit/index.html and edit.html');

console.log('--- Step 2: Appending Required CSS Styles to edit/css/edit.css ---');
let css = fs.readFileSync(cssPath, 'utf8');
if (!css.includes('fullscreen-editor')) {
    const additionalCss = `
/* ================= FULLSCREEN SPACIOUS WRITING MODE ================= */
.visual-editor-container.fullscreen-editor {
    position: fixed !important;
    top: 0 !important;
    left: 0 !important;
    right: 0 !important;
    bottom: 0 !important;
    width: 100vw !important;
    height: 100vh !important;
    z-index: 999999 !important;
    border-radius: 0 !important;
    margin: 0 !important;
    display: flex !important;
    flex-direction: column !important;
    background: #0f172a !important;
    box-shadow: none !important;
}

.visual-editor-container.fullscreen-editor .visual-editor-canvas {
    flex: 1 !important;
    max-height: none !important;
    height: 100% !important;
    padding: 40px 15% !important;
    font-size: 16.5px !important;
    line-height: 1.85 !important;
}

.visual-editor-statusbar {
    background: #0f172a;
    color: #94a3b8;
    padding: 8px 18px;
    font-size: 12px;
    display: flex;
    align-items: center;
    gap: 16px;
    border-top: 1px solid #334155;
    user-select: none;
}

.statusbar-stat {
    display: inline-flex;
    align-items: center;
    gap: 6px;
}

/* ================= 1-CLICK FACILITY PRESET PILLS ================= */
.facility-preset-pill {
    background: #f1f5f9;
    border: 1px solid #cbd5e1;
    border-radius: 16px;
    padding: 4px 10px;
    font-size: 11.5px;
    font-weight: 600;
    color: #334155;
    cursor: pointer;
    transition: all 0.15s ease;
    display: inline-flex;
    align-items: center;
    gap: 5px;
    user-select: none;
}

.facility-preset-pill:hover {
    background: #e2e8f0;
    color: #0f172a;
    transform: translateY(-1px);
}

.facility-preset-pill i {
    color: #ff6b00;
    font-size: 11px;
}

/* ================= EDITORIAL TABLE & NOTICE STYLES ================= */
.visual-editor-canvas table.editorial-table {
    width: 100%;
    border-collapse: collapse;
    margin: 18px 0;
    font-size: 14px;
}

.visual-editor-canvas table.editorial-table th,
.visual-editor-canvas table.editorial-table td {
    border: 1px solid #cbd5e1;
    padding: 10px 14px;
    text-align: left;
}

.visual-editor-canvas table.editorial-table th {
    background: #f1f5f9;
    font-weight: 700;
    color: #0f172a;
}

.visual-editor-canvas .editorial-notice-box {
    background: #eff6ff;
    border-left: 4px solid #3b82f6;
    padding: 14px 18px;
    border-radius: 6px;
    margin: 16px 0;
    color: #1e40af;
    font-size: 14px;
}

.visual-editor-canvas .editorial-notice-box strong {
    color: #1d4ed8;
}

/* ================= HEADERS NAVIGATION ITEMS STYLING ================= */
.header-nav-card {
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 10px;
    padding: 14px 18px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    transition: all 0.18s ease;
}

.header-nav-card:hover {
    border-color: #cbd5e1;
    box-shadow: 0 4px 12px rgba(15, 23, 42, 0.05);
}

.header-nav-title {
    font-size: 14px;
    font-weight: 700;
    color: #0f172a;
    display: flex;
    align-items: center;
    gap: 8px;
}

.header-nav-url {
    font-size: 12px;
    color: #64748b;
    margin-top: 3px;
    font-family: monospace;
}

.header-nav-badge {
    font-size: 11px;
    font-weight: 700;
    padding: 2px 8px;
    border-radius: 12px;
    background: #fef3c7;
    color: #d97706;
}

.header-child-row {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 10px 12px;
    display: flex;
    gap: 8px;
    align-items: center;
}
`;
    fs.writeFileSync(cssPath, css + additionalCss, 'utf8');
    console.log('✅ Appended new styles to edit/css/edit.css');
} else {
    console.log('ℹ️ edit/css/edit.css already has required styles');
}

console.log('--- Step 3: Verifying and Updating server.js with /api/content/menu ---');
let serverCode = fs.readFileSync(serverPath, 'utf8');
if (!serverCode.includes('/api/content/menu')) {
    const menuRouteCode = `
    // ================= 8. CONTENT API: SITE MENU & HEADERS =================
    // GET /api/content/menu
    if (pathname === '/api/content/menu' && req.method === 'GET') {
        const menu = readDataFile('site_menu.json', { announcement: {}, navItems: [] });
        return sendJson(200, { success: true, menu, data: menu });
    }

    // POST / PUT /api/content/menu
    if (pathname === '/api/content/menu' && (req.method === 'POST' || req.method === 'PUT')) {
        try {
            const body = await readJsonBody();
            let currentMenu = readDataFile('site_menu.json', { announcement: {}, navItems: [] });

            // Merge announcement if provided
            if (body.announcement) {
                currentMenu.announcement = {
                    ...currentMenu.announcement,
                    ...body.announcement
                };
            }

            // Merge or update navItems if provided
            if (Array.isArray(body.navItems)) {
                currentMenu.navItems = body.navItems;
            } else if (body.navItem) {
                // Add or update single nav item
                if (!Array.isArray(currentMenu.navItems)) currentMenu.navItems = [];
                const item = body.navItem;
                const idx = currentMenu.navItems.findIndex(n => n.id === item.id);
                if (idx >= 0) {
                    currentMenu.navItems[idx] = { ...currentMenu.navItems[idx], ...item };
                } else {
                    currentMenu.navItems.push(item);
                }
            }

            currentMenu.config = {
                ...(currentMenu.config || {}),
                updatedAt: new Date().toISOString()
            };

            writeDataFile('site_menu.json', currentMenu);
            return sendJson(200, { success: true, menu: currentMenu, message: 'Website navigation and headers updated successfully!' });
        } catch (e) {
            return sendJson(500, { success: false, error: e.message });
        }
    }

    // DELETE /api/content/menu/items/:id
    const menuItemMatch = pathname.match(/^\\/api\\/content\\/menu\\/items\\/([^\\/]+)$/);
    if (menuItemMatch && req.method === 'DELETE') {
        try {
            const itemId = decodeURIComponent(menuItemMatch[1]);
            let currentMenu = readDataFile('site_menu.json', { announcement: {}, navItems: [] });
            if (Array.isArray(currentMenu.navItems)) {
                currentMenu.navItems = currentMenu.navItems.filter(n => n.id !== itemId);
                currentMenu.config = {
                    ...(currentMenu.config || {}),
                    updatedAt: new Date().toISOString()
                };
                writeDataFile('site_menu.json', currentMenu);
            }
            return sendJson(200, { success: true, message: 'Header item removed successfully' });
        } catch (e) {
            return sendJson(500, { success: false, error: e.message });
        }
    }
`;
    // Insert before YOUTUBE API
    serverCode = serverCode.replace('// ================= 7. YOUTUBE API =================', `${menuRouteCode}\n    // ================= 7. YOUTUBE API =================`);
    fs.writeFileSync(serverPath, serverCode, 'utf8');
    console.log('✅ Added /api/content/menu endpoints to server.js');
} else {
    console.log('ℹ️ server.js already has /api/content/menu');
}

console.log('--- Step 1-3 Completed Successfully! ---');
