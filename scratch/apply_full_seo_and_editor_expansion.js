const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const editHtmlPath = path.join(rootDir, 'edit', 'index.html');
let html = fs.readFileSync(editHtmlPath, 'utf8');

// 1. UPDATE BLOG MODAL IN edit/index.html
console.log('1. Updating Blog Modal with 5-point SEO Architecture + Spacious Refined WYSIWYG Editor...');

const oldBlogModalBodyRegex = /<!-- ================= ADD \/ EDIT BLOG MODAL ================= -->[\s\S]*?<div class="modal-dialog">[\s\S]*?<form id="blogForm">[\s\S]*?<div class="modal-body">[\s\S]*?<\/div>\s*<div class="modal-footer">/;

const newBlogModalContent = `<!-- ================= ADD / EDIT BLOG MODAL ================= -->
    <div class="modal-overlay" id="blogModal">
        <div class="modal-dialog" style="max-width: 940px;">
            <div class="modal-header">
                <h3 id="blogModalTitle"><i class="fa fa-newspaper-o text-primary"></i> Add New Blog Post</h3>
                <button class="modal-close" onclick="window.closeBlogModal()">&times;</button>
            </div>
            <form id="blogForm">
                <div class="modal-body">
                    <!-- SECTION 1: TITLE & SEO METADATA -->
                    <div class="form-section-card">
                        <div class="form-section-header">
                            <span class="form-section-title"><i class="fa fa-search text-primary"></i> 1. SEO &amp; Article Metadata</span>
                            <span class="form-section-badge active">Google Search Ranking Ready</span>
                        </div>

                        <!-- 1. Title -->
                        <div class="form-group">
                            <label><strong>1. Blog Post Title</strong> <span class="req">*</span></label>
                            <input type="text" id="blogTitleInput" class="form-control" placeholder="e.g. MBA in Financial &amp; Project Management - Subharti University Complete Guide" required>
                        </div>

                        <!-- 2. Meta Description -->
                        <div class="form-group">
                            <label><strong>2. Meta Description (SEO Google Snippet)</strong></label>
                            <textarea id="blogMetaDescInput" class="form-control" rows="2" maxlength="200" placeholder="e.g. Complete admissions guide for MBA in Financial &amp; Project Management at Subharti University: UGC-DEB approvals, fee structure, eligibility, syllabus breakdown, and counselor helpline."></textarea>
                            <div class="meta-counter"><span id="blogMetaCount">0 / 160 characters</span><span>Recommended: 120-160 characters for search rankings</span></div>
                        </div>

                        <!-- 3, 4, 5. Tags ++, Categories ++, Keywords ++ -->
                        <div class="form-row">
                            <div class="form-group">
                                <label><strong>3. Tags (+ +)</strong></label>
                                <div class="chip-input-wrapper">
                                    <input type="text" id="blogTagInput" class="form-control" placeholder="e.g. Subharti MBA">
                                    <button type="button" class="btn btn-sm btn-outline" onclick="window.addChip('blog', 'tag')"><i class="fa fa-plus"></i></button>
                                </div>
                                <div class="chips-container" id="blogTagsChips"></div>
                            </div>
                            <div class="form-group">
                                <label><strong>4. Categories (+ +)</strong></label>
                                <div class="chip-input-wrapper">
                                    <input type="text" id="blogCategoryInput" class="form-control" placeholder="e.g. University Admissions" list="catList">
                                    <button type="button" class="btn btn-sm btn-outline" onclick="window.addChip('blog', 'cat')"><i class="fa fa-plus"></i></button>
                                </div>
                                <div class="chips-container" id="blogCategoriesChips"></div>
                            </div>
                            <div class="form-group">
                                <label><strong>5. Keywords (+ +)</strong></label>
                                <div class="chip-input-wrapper">
                                    <input type="text" id="blogKeywordInput" class="form-control" placeholder="e.g. Distance MBA Admission">
                                    <button type="button" class="btn btn-sm btn-outline" onclick="window.addChip('blog', 'kw')"><i class="fa fa-plus"></i></button>
                                </div>
                                <div class="chips-container" id="blogKeywordsChips"></div>
                            </div>
                        </div>

                        <!-- Author, Date, Featured Toggle -->
                        <div class="form-row" style="margin-top:10px;">
                            <div class="form-group">
                                <label>Author</label>
                                <input type="text" id="blogAuthorInput" class="form-control" placeholder="Educationist Guru Academic Advisory">
                            </div>
                            <div class="form-group">
                                <label><i class="fa fa-calendar text-primary"></i> Publication Date</label>
                                <input type="text" id="blogDateInput" class="form-control" placeholder="e.g. September 22, 2026">
                            </div>
                            <div class="form-group" style="display:flex; align-items:flex-end; padding-bottom:10px;">
                                <label style="display:flex; align-items:center; gap:8px; margin:0; cursor:pointer; font-weight:700; color:#1e293b; font-size:13.5px;">
                                    <input type="checkbox" id="blogFeaturedInput" style="cursor:pointer; width:18px; height:18px;">
                                    <span>Mark as Featured Article</span>
                                </label>
                            </div>
                        </div>
                    </div>

                    <!-- SECTION 2: ARTICLE THUMBNAIL & MEDIA -->
                    <div class="form-section-card">
                        <div class="form-section-header">
                            <span class="form-section-title"><i class="fa fa-picture-o text-primary"></i> 2. Article Featured Image &amp; Banner</span>
                        </div>
                        <div class="form-group upload-box-container">
                            <div class="file-drop-zone" id="blogDropZone" data-target="blogImageInput" data-preview="blogImagePreview" data-file-input="blogFileInput">
                                <input type="file" id="blogFileInput" class="local-device-file" accept="image/*" style="display:none;">
                                <div class="drop-zone-content">
                                    <div class="drop-zone-icon"><i class="fa fa-cloud-upload"></i></div>
                                    <div class="drop-zone-text">
                                        <span class="drop-title"><strong>Upload Article Image from Device</strong> or drag &amp; drop</span>
                                        <span class="drop-hint">PNG, JPG, WEBP (Saved directly to server)</span>
                                    </div>
                                    <button type="button" class="btn btn-outline btn-sm btn-browse-local" style="margin-left:auto; flex-shrink:0;">
                                        <i class="fa fa-folder-open"></i> Browse Device
                                    </button>
                                </div>
                            </div>
                            <input type="hidden" id="blogImageInput" value="images/blog/1.jpg">

                            <!-- Active Preview Card -->
                            <div id="blogImagePreview" class="active-thumb-preview" style="display:none; margin-top:10px;">
                                <div class="thumb-card">
                                    <img src="" alt="Thumbnail preview" class="thumb-preview-img">
                                    <div class="thumb-meta">
                                        <span class="thumb-name">Active Thumbnail</span>
                                        <span class="thumb-badge"><i class="fa fa-check-circle"></i> Ready</span>
                                    </div>
                                    <button type="button" class="thumb-clear-btn" data-target="blogImageInput" data-preview="blogImagePreview" title="Clear image">&times;</button>
                                </div>
                            </div>

                            <!-- Preset Images Gallery -->
                            <div style="margin-top:12px;">
                                <span style="font-size:11.5px; font-weight:600; color:#64748b; text-transform:uppercase; letter-spacing:0.5px; display:block; margin-bottom:6px;">Or select a preset blog image:</span>
                                <div class="preset-images">
                                    <div class="preset-thumb active" data-target="blogImageInput" data-preview="blogImagePreview" data-src="images/blog/1.jpg"><img src="images/blog/1.jpg" alt="1"></div>
                                    <div class="preset-thumb" data-target="blogImageInput" data-preview="blogImagePreview" data-src="images/blog/2.jpg"><img src="images/blog/2.jpg" alt="2"></div>
                                    <div class="preset-thumb" data-target="blogImageInput" data-preview="blogImagePreview" data-src="images/blog/3.jpg"><img src="images/blog/3.jpg" alt="3"></div>
                                    <div class="preset-thumb" data-target="blogImageInput" data-preview="blogImagePreview" data-src="images/blog/4.jpg"><img src="images/blog/4.jpg" alt="4"></div>
                                </div>
                            </div>
                        </div>

                        <div class="form-group" style="margin-top:12px;">
                            <label>Short Excerpt (Summary for Cards &amp; Listings)</label>
                            <textarea id="blogExcerptInput" class="form-control" rows="2" placeholder="Brief 1-2 sentence preview to display on blog listings and social shares..."></textarea>
                        </div>
                    </div>

                    <!-- SECTION 3: REFINED & SPACIOUS VISUAL WYSIWYG DOCUMENT EDITOR -->
                    <div class="form-section-card" style="padding: 12px 14px; background:#f8fafc;">
                        <div class="form-section-header" style="margin-bottom:8px;">
                            <span class="form-section-title"><i class="fa fa-edit text-primary"></i> 3. Full Blog Article Content (Spacious Document Canvas)</span>
                            <span style="font-size:12px; color:#64748b;">Highlight text &amp; format directly. Click <strong>⛶ Expand</strong> for full-screen writing.</span>
                        </div>

                        <div class="visual-editor-container" id="blogEditorContainer">
                            <!-- Multi-tier Visual Toolbar -->
                            <div class="visual-editor-toolbar">
                                <!-- Group 1: Structure & Headings -->
                                <div class="toolbar-group">
                                    <select class="tool-select" onchange="window.applyHeadingStyle('blogVisualEditor', this.value); this.value='';">
                                        <option value="" disabled selected>Style / Heading</option>
                                        <option value="p">Paragraph (Normal Text)</option>
                                        <option value="h1">Heading 1 (Main Title)</option>
                                        <option value="h2">Heading 2 (Major Section)</option>
                                        <option value="h3">Heading 3 (Sub Section)</option>
                                        <option value="h4">Heading 4 (Topic Header)</option>
                                        <option value="h5">Heading 5 (Small Heading)</option>
                                        <option value="h6">Heading 6 (Minor Title)</option>
                                        <option value="blockquote">Blockquote (Quote)</option>
                                    </select>
                                </div>
                                <div class="toolbar-divider"></div>
                                <div class="toolbar-group" style="gap:4px;">
                                    <button type="button" class="btn-visual-tool btn-tool-h" onclick="window.applyHeadingStyle('blogVisualEditor', 'h1')" title="Heading 1">H1</button>
                                    <button type="button" class="btn-visual-tool btn-tool-h" onclick="window.applyHeadingStyle('blogVisualEditor', 'h2')" title="Heading 2">H2</button>
                                    <button type="button" class="btn-visual-tool btn-tool-h" onclick="window.applyHeadingStyle('blogVisualEditor', 'h3')" title="Heading 3">H3</button>
                                    <button type="button" class="btn-visual-tool btn-tool-h" onclick="window.applyHeadingStyle('blogVisualEditor', 'h4')" title="Heading 4">H4</button>
                                    <button type="button" class="btn-visual-tool btn-tool-h" onclick="window.applyHeadingStyle('blogVisualEditor', 'h5')" title="Heading 5">H5</button>
                                    <button type="button" class="btn-visual-tool btn-tool-h" onclick="window.applyHeadingStyle('blogVisualEditor', 'h6')" title="Heading 6">H6</button>
                                </div>
                                <div class="toolbar-divider"></div>
                                <!-- Group 2: Inline Typography -->
                                <div class="toolbar-group" style="gap:4px;">
                                    <button type="button" class="btn-visual-tool" onclick="window.execEditorCmd('blogVisualEditor', 'bold')" title="Bold" style="font-weight:900;"><b>B</b></button>
                                    <button type="button" class="btn-visual-tool" onclick="window.execEditorCmd('blogVisualEditor', 'italic')" title="Italic" style="font-style:italic; font-family:serif;"><i>I</i></button>
                                    <button type="button" class="btn-visual-tool" onclick="window.execEditorCmd('blogVisualEditor', 'underline')" title="Underline"><u>U</u></button>
                                    <button type="button" class="btn-visual-tool" onclick="window.execEditorCmd('blogVisualEditor', 'strikeThrough')" title="Strikethrough"><s>S</s></button>
                                </div>
                                <div class="toolbar-divider"></div>
                                <!-- Group 3: Lists & Alignment -->
                                <div class="toolbar-group" style="gap:4px;">
                                    <button type="button" class="btn-visual-tool" onclick="window.execEditorCmd('blogVisualEditor', 'insertUnorderedList')" title="Bullet List">• Bullet</button>
                                    <button type="button" class="btn-visual-tool" onclick="window.execEditorCmd('blogVisualEditor', 'insertOrderedList')" title="Numbered List">1. List</button>
                                    <button type="button" class="btn-visual-tool" onclick="window.execEditorCmd('blogVisualEditor', 'justifyLeft')" title="Align Left"><i class="fa fa-align-left"></i></button>
                                    <button type="button" class="btn-visual-tool" onclick="window.execEditorCmd('blogVisualEditor', 'justifyCenter')" title="Align Center"><i class="fa fa-align-center"></i></button>
                                    <button type="button" class="btn-visual-tool" onclick="window.execEditorCmd('blogVisualEditor', 'justifyRight')" title="Align Right"><i class="fa fa-align-right"></i></button>
                                </div>
                                <div class="toolbar-divider"></div>
                                <!-- Group 4: Rich Inserts -->
                                <div class="toolbar-group" style="gap:4px;">
                                    <button type="button" class="btn-visual-tool btn-tool-lead" onclick="window.insertVisualInquiryBox('blogVisualEditor')" title="Insert Admission Inquiry Callout Box"><i class="fa fa-paper-plane"></i> + Inquiry Box</button>
                                    <button type="button" class="btn-visual-tool" onclick="window.insertEditorTable('blogVisualEditor')" title="Insert Curriculum / Fee Table"><i class="fa fa-table"></i> + Table</button>
                                    <button type="button" class="btn-visual-tool" onclick="window.insertEditorNotice('blogVisualEditor')" title="Insert Important Notice Box"><i class="fa fa-info-circle"></i> + Notice</button>
                                    <button type="button" class="btn-visual-tool" onclick="window.insertEditorLink('blogVisualEditor')" title="Insert Link"><i class="fa fa-link"></i> Link</button>
                                    <button type="button" class="btn-visual-tool btn-tool-clear" onclick="window.clearEditorFormatting('blogVisualEditor')" title="Clear Formatting"><i class="fa fa-eraser"></i> Clear</button>
                                    <button type="button" class="btn-visual-tool" id="blogFullscreenBtn" onclick="window.toggleEditorFullscreen('blogEditorContainer')" title="Toggle Fullscreen Writing Mode" style="background:#3b82f6; border-color:#2563eb; color:#fff;"><i class="fa fa-arrows-alt"></i> ⛶ Fullscreen</button>
                                </div>
                            </div>

                            <!-- Spacious Visual Document Canvas -->
                            <div id="blogVisualEditor" class="visual-editor-canvas" contenteditable="true" spellcheck="true" placeholder="Start writing comprehensive blog article here... Highlight text and click H1, H2, or Bold to format directly!"></div>
                            <input type="hidden" id="blogContentInput">

                            <!-- Live Document Statistics Bar -->
                            <div class="visual-editor-statusbar" id="blogEditorStatusbar">
                                <span class="statusbar-stat"><i class="fa fa-file-text-o"></i> <span id="blogWordCount">0 words</span></span>
                                <span class="statusbar-stat"><i class="fa fa-font"></i> <span id="blogCharCount">0 characters</span></span>
                                <span class="statusbar-stat"><i class="fa fa-clock-o"></i> <span id="blogReadingTime">~1 min read</span></span>
                                <span class="statusbar-stat" style="margin-left:auto; color:#10b981;"><i class="fa fa-check-circle"></i> Visual Canvas Ready</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">`;

html = html.replace(oldBlogModalBodyRegex, newBlogModalContent);
console.log('✅ Updated Blog Modal in edit/index.html');

// 2. UPDATE COLLEGE MODAL WITH META DESCRIPTION, TAGS, KEYWORDS & FACILITIES
console.log('2. Updating College Modal with SEO Meta Description, Tags, Keywords & Facilities...');

const oldCollegeProfileEnd = `<div class="form-row">
                            <div class="form-group">
                                <label>Established Year</label>
                                <input type="text" id="collegeEstablishedInput" class="form-control" placeholder="e.g. 2008">
                            </div>
                            <div class="form-group">
                                <label>Accreditation / Recognitions</label>
                                <input type="text" id="collegeAccreditationInput" class="form-control" placeholder="e.g. PCI Approved, AICTE, NAAC A+">
                            </div>
                        </div>
                    </div>`;

const newCollegeProfileEnd = `<div class="form-row">
                            <div class="form-group">
                                <label>Established Year</label>
                                <input type="text" id="collegeEstablishedInput" class="form-control" placeholder="e.g. 2008">
                            </div>
                            <div class="form-group">
                                <label>Accreditation / Recognitions</label>
                                <input type="text" id="collegeAccreditationInput" class="form-control" placeholder="e.g. PCI Approved, AICTE, NAAC A+">
                            </div>
                        </div>

                        <!-- 2. Meta Description (SEO Google Snippet) -->
                        <div class="form-group" style="margin-top:12px;">
                            <label><strong>2. Meta Description (SEO Google Snippet)</strong></label>
                            <textarea id="collegeMetaDescInput" class="form-control" rows="2" maxlength="200" placeholder="e.g. Admissions Open at Metro Institute of Pharmaceutical Sciences. Approved by PCI &amp; AICTE with 100% placement support."></textarea>
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
                                <span class="facility-preset-pill" onclick="window.addPresetFacility('college', 'Boys &amp; Girls Hostel')"><i class="fa fa-bed"></i> + Hostel</span>
                                <span class="facility-preset-pill" onclick="window.addPresetFacility('college', 'Advanced Research Labs')"><i class="fa fa-flask"></i> + Modern Labs</span>
                                <span class="facility-preset-pill" onclick="window.addPresetFacility('college', 'Digital Library &amp; E-Books')"><i class="fa fa-book"></i> + Central Library</span>
                                <span class="facility-preset-pill" onclick="window.addPresetFacility('college', 'Sports Complex &amp; Gym')"><i class="fa fa-futbol-o"></i> + Sports Complex</span>
                                <span class="facility-preset-pill" onclick="window.addPresetFacility('college', 'Cafeteria &amp; Mess')"><i class="fa fa-cutlery"></i> + Cafeteria</span>
                                <span class="facility-preset-pill" onclick="window.addPresetFacility('college', 'Placement Cell &amp; Tie-ups')"><i class="fa fa-briefcase"></i> + Placement Cell</span>
                                <span class="facility-preset-pill" onclick="window.addPresetFacility('college', 'Auditorium &amp; Seminars')"><i class="fa fa-users"></i> + Auditorium</span>
                                <span class="facility-preset-pill" onclick="window.addPresetFacility('college', 'Medical Support &amp; Ambulance')"><i class="fa fa-heartbeat"></i> + Medical Center</span>
                            </div>
                        </div>
                    </div>`;

if (html.includes(oldCollegeProfileEnd)) {
    html = html.replace(oldCollegeProfileEnd, newCollegeProfileEnd);
    console.log('✅ Updated College Modal in edit/index.html');
} else {
    console.warn('⚠️ Could not match oldCollegeProfileEnd');
}

// 3. UPDATE UNIVERSITY MODAL WITH META DESCRIPTION, TAGS, KEYWORDS & FACILITIES
console.log('3. Updating University Modal with SEO Meta Description, Tags, Keywords & Facilities...');

const oldUnivProfileEnd = `<div class="form-row">
                            <div class="form-group">
                                <label>NAAC Grade / UGC Section</label>
                                <input type="text" id="univNaacInput" class="form-control" placeholder="e.g. NAAC A+ Grade / UGC 2(f)">
                            </div>
                            <div class="form-group">
                                <label>Learning Modes</label>
                                <input type="text" id="univModesInput" class="form-control" placeholder="e.g. Online / Regular / Distance Learning">
                            </div>
                        </div>
                    </div>`;

const newUnivProfileEnd = `<div class="form-row">
                            <div class="form-group">
                                <label>NAAC Grade / UGC Section</label>
                                <input type="text" id="univNaacInput" class="form-control" placeholder="e.g. NAAC A+ Grade / UGC 2(f)">
                            </div>
                            <div class="form-group">
                                <label>Learning Modes</label>
                                <input type="text" id="univModesInput" class="form-control" placeholder="e.g. Online / Regular / Distance Learning">
                            </div>
                        </div>

                        <!-- 2. Meta Description (SEO Google Snippet) -->
                        <div class="form-group" style="margin-top:12px;">
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
                                <span class="facility-preset-pill" onclick="window.addPresetFacility('univ', 'E-Library &amp; Study Portals')"><i class="fa fa-book"></i> + E-Library</span>
                                <span class="facility-preset-pill" onclick="window.addPresetFacility('univ', 'Hostel Accommodations')"><i class="fa fa-bed"></i> + Campus Hostels</span>
                                <span class="facility-preset-pill" onclick="window.addPresetFacility('univ', 'Central Placement Cell')"><i class="fa fa-briefcase"></i> + Placement Cell</span>
                                <span class="facility-preset-pill" onclick="window.addPresetFacility('univ', 'Medical &amp; Healthcare Center')"><i class="fa fa-heartbeat"></i> + Medical Hospital</span>
                                <span class="facility-preset-pill" onclick="window.addPresetFacility('univ', 'Sports Complex &amp; Stadium')"><i class="fa fa-trophy"></i> + Sports Stadium</span>
                                <span class="facility-preset-pill" onclick="window.addPresetFacility('univ', 'Global Alumni Network')"><i class="fa fa-globe"></i> + Alumni Cell</span>
                            </div>
                        </div>
                    </div>`;

if (html.includes(oldUnivProfileEnd)) {
    html = html.replace(oldUnivProfileEnd, newUnivProfileEnd);
    console.log('✅ Updated University Modal in edit/index.html');
} else {
    console.warn('⚠️ Could not match oldUnivProfileEnd');
}

fs.writeFileSync(editHtmlPath, html, 'utf8');
fs.writeFileSync(path.join(rootDir, 'edit.html'), html, 'utf8');
console.log('✅ Synchronized edit/index.html and root edit.html successfully!');
