const fs = require('fs');
const path = require('path');

const jsPath = path.join(__dirname, '..', 'edit', 'js', 'edit.js');
let code = fs.readFileSync(jsPath, 'utf8');

console.log('--- Patching edit/js/edit.js for Universal SEO, Facilities, Spacious Editor, and Headers ---');

// 1. Declare chip state variables if not declared
if (!code.includes('let blogTagsList')) {
    const marker = 'let courseTagsList = [];';
    const newVars = `let courseTagsList = [];
    let courseCategoriesList = [];
    let courseKeywordsList = [];

    // Blog SEO Lists
    let blogTagsList = [];
    let blogCategoriesList = [];
    let blogKeywordsList = [];

    // College SEO & Facilities Lists
    let collegeTagsList = [];
    let collegeKeywordsList = [];
    let collegeFacilitiesList = [];

    // University SEO & Facilities Lists
    let univTagsList = [];
    let univKeywordsList = [];
    let univFacilitiesList = [];`;

    code = code.replace(marker, newVars);
    console.log('✅ Added chip state arrays for Blog, College, and University');
}

// 2. Upgrade renderCourseChips to Universal renderChips
if (!code.includes('function renderUniversalChips')) {
    const oldRenderChipsRegex = /function renderCourseChips\([\s\S]*?\n    \}/;
    const newRenderChips = `function renderCourseChips(containerId, list, type) {
        renderUniversalChips(containerId, list, 'course', type);
    }

    function renderUniversalChips(containerId, list, entity, type) {
        const container = document.getElementById(containerId);
        if (!container) return;
        if (!list || list.length === 0) {
            container.innerHTML = \`<span style="font-size:11.5px; color:#94a3b8; font-style:italic;">No \${type} added yet. Type above and click +</span>\`;
            return;
        }
        container.innerHTML = list.map((item, idx) => \`
            <span class="chip-pill">
                \${escapeHtml(item)}
                <button type="button" class="chip-remove" onclick="window.removeChip('\${entity}', '\${type}', \${idx})" title="Remove">&times;</button>
            </span>
        \`).join('');
    }`;

    code = code.replace(oldRenderChipsRegex, newRenderChips);
    console.log('✅ Replaced renderCourseChips with universal renderer');
}

// 3. Upgrade window.addChip and window.removeChip to support all entities and add window.addPresetFacility
const oldAddChipRegex = /window\.addChip = function[\s\S]*?window\.removeChip = function[\s\S]*?\n    \};/;
const newChipHandlers = `window.addChip = function(entity, type) {
        let inputId, list, containerId;
        if (entity === 'course') {
            if (type === 'tag') { inputId = 'courseTagInput'; list = courseTagsList; containerId = 'courseTagsChips'; }
            else if (type === 'cat') { inputId = 'courseCategoryInput'; list = courseCategoriesList; containerId = 'courseCategoriesChips'; }
            else if (type === 'kw') { inputId = 'courseKeywordInput'; list = courseKeywordsList; containerId = 'courseKeywordsChips'; }
        } else if (entity === 'blog') {
            if (type === 'tag') { inputId = 'blogTagInput'; list = blogTagsList; containerId = 'blogTagsChips'; }
            else if (type === 'cat') { inputId = 'blogCategoryInput'; list = blogCategoriesList; containerId = 'blogCategoriesChips'; }
            else if (type === 'kw') { inputId = 'blogKeywordInput'; list = blogKeywordsList; containerId = 'blogKeywordsChips'; }
        } else if (entity === 'college') {
            if (type === 'tag') { inputId = 'collegeTagInput'; list = collegeTagsList; containerId = 'collegeTagsChips'; }
            else if (type === 'kw') { inputId = 'collegeKeywordInput'; list = collegeKeywordsList; containerId = 'collegeKeywordsChips'; }
            else if (type === 'fac') { inputId = 'collegeFacilityInput'; list = collegeFacilitiesList; containerId = 'collegeFacilitiesChips'; }
        } else if (entity === 'univ') {
            if (type === 'tag') { inputId = 'univTagInput'; list = univTagsList; containerId = 'univTagsChips'; }
            else if (type === 'kw') { inputId = 'univKeywordInput'; list = univKeywordsList; containerId = 'univKeywordsChips'; }
            else if (type === 'fac') { inputId = 'univFacilityInput'; list = univFacilitiesList; containerId = 'univFacilitiesChips'; }
        }

        if (inputId && list && containerId) {
            const input = document.getElementById(inputId);
            const val = input ? input.value.trim() : '';
            if (val && !list.includes(val)) {
                list.push(val);
                renderUniversalChips(containerId, list, entity, type);
                if (input) input.value = '';
            }
        }
    };

    window.removeChip = function(entity, type, idx) {
        let list, containerId;
        if (entity === 'course') {
            if (type === 'tag') { list = courseTagsList; containerId = 'courseTagsChips'; }
            else if (type === 'cat') { list = courseCategoriesList; containerId = 'courseCategoriesChips'; }
            else if (type === 'kw') { list = courseKeywordsList; containerId = 'courseKeywordsChips'; }
        } else if (entity === 'blog') {
            if (type === 'tag') { list = blogTagsList; containerId = 'blogTagsChips'; }
            else if (type === 'cat') { list = blogCategoriesList; containerId = 'blogCategoriesChips'; }
            else if (type === 'kw') { list = blogKeywordsList; containerId = 'blogKeywordsChips'; }
        } else if (entity === 'college') {
            if (type === 'tag') { list = collegeTagsList; containerId = 'collegeTagsChips'; }
            else if (type === 'kw') { list = collegeKeywordsList; containerId = 'collegeKeywordsChips'; }
            else if (type === 'fac') { list = collegeFacilitiesList; containerId = 'collegeFacilitiesChips'; }
        } else if (entity === 'univ') {
            if (type === 'tag') { list = univTagsList; containerId = 'univTagsChips'; }
            else if (type === 'kw') { list = univKeywordsList; containerId = 'univKeywordsChips'; }
            else if (type === 'fac') { list = univFacilitiesList; containerId = 'univFacilitiesChips'; }
        }

        if (list && containerId && list[idx] !== undefined) {
            list.splice(idx, 1);
            renderUniversalChips(containerId, list, entity, type);
        }
    };

    window.addPresetFacility = function(entity, facilityName) {
        let list, containerId;
        if (entity === 'college') {
            list = collegeFacilitiesList;
            containerId = 'collegeFacilitiesChips';
        } else if (entity === 'univ') {
            list = univFacilitiesList;
            containerId = 'univFacilitiesChips';
        }

        if (list && containerId) {
            if (!list.includes(facilityName)) {
                list.push(facilityName);
                renderUniversalChips(containerId, list, entity, 'fac');
                showToast(\`Added \${facilityName}\`, 'info');
            } else {
                showToast(\`\${facilityName} already in list\`, 'info');
            }
        }
    };`;

code = code.replace(oldAddChipRegex, newChipHandlers);
console.log('✅ Updated addChip and removeChip and added addPresetFacility');

// 4. Add WYSIWYG helper functions if not present
if (!code.includes('window.toggleEditorFullscreen')) {
    const editorExt = `
    // Fullscreen, Table, Notice, Link & Stats WYSIWYG Tools
    window.toggleEditorFullscreen = function(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;
        container.classList.toggle('fullscreen-editor');
        const isFull = container.classList.contains('fullscreen-editor');
        const btn = document.getElementById('blogFullscreenBtn');
        if (btn) {
            btn.innerHTML = isFull ? '<i class="fa fa-compress"></i> 🗗 Minimize' : '<i class="fa fa-arrows-alt"></i> ⛶ Fullscreen';
            btn.style.background = isFull ? '#ef4444' : '#3b82f6';
            btn.style.borderColor = isFull ? '#dc2626' : '#2563eb';
        }
    };

    window.insertEditorTable = function(editorId) {
        const editor = document.getElementById(editorId);
        if (!editor) return;
        initVisualEditorEvents(editorId);
        restoreEditorSelection(editorId);

        const tableHtml = \`
            <table class="editorial-table" style="width:100%; border-collapse:collapse; margin:18px 0; border:1px solid #cbd5e1;">
                <thead>
                    <tr style="background:#f1f5f9;">
                        <th style="border:1px solid #cbd5e1; padding:10px 14px; text-align:left; font-weight:700;">Semester / Phase</th>
                        <th style="border:1px solid #cbd5e1; padding:10px 14px; text-align:left; font-weight:700;">Core Subjects &amp; Specialization</th>
                        <th style="border:1px solid #cbd5e1; padding:10px 14px; text-align:left; font-weight:700;">Credits / Mode</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td style="border:1px solid #cbd5e1; padding:10px 14px;">Semester 1</td>
                        <td style="border:1px solid #cbd5e1; padding:10px 14px;">Financial Management &amp; Quantitative Analytics</td>
                        <td style="border:1px solid #cbd5e1; padding:10px 14px;">24 Credits (Online/Distance)</td>
                    </tr>
                    <tr>
                        <td style="border:1px solid #cbd5e1; padding:10px 14px;">Semester 2</td>
                        <td style="border:1px solid #cbd5e1; padding:10px 14px;">Project Planning, Risk Valuation &amp; Cost Control</td>
                        <td style="border:1px solid #cbd5e1; padding:10px 14px;">24 Credits (Online/Distance)</td>
                    </tr>
                </tbody>
            </table>
            <p><br></p>
        \`;
        document.execCommand('insertHTML', false, tableHtml);
        saveEditorSelection(editorId);
        if (window.updateEditorStats) window.updateEditorStats(editorId);
    };

    window.insertEditorNotice = function(editorId) {
        const editor = document.getElementById(editorId);
        if (!editor) return;
        initVisualEditorEvents(editorId);
        restoreEditorSelection(editorId);

        const noticeHtml = \`
            <div class="editorial-notice-box" style="background:#eff6ff; border-left:4px solid #3b82f6; padding:14px 18px; border-radius:6px; margin:16px 0; color:#1e40af;">
                <p style="margin:0; font-size:14px; line-height:1.6;">
                    <strong style="color:#1d4ed8;"><i class="fa fa-info-circle"></i> Important Admission Notice:</strong> 
                    UGC-DEB approved admissions for current session are verified directly through university portals. Candidates can confirm equivalence before enrollment.
                </p>
            </div>
            <p><br></p>
        \`;
        document.execCommand('insertHTML', false, noticeHtml);
        saveEditorSelection(editorId);
        if (window.updateEditorStats) window.updateEditorStats(editorId);
    };

    window.insertEditorLink = function(editorId) {
        const editor = document.getElementById(editorId);
        if (!editor) return;
        initVisualEditorEvents(editorId);
        restoreEditorSelection(editorId);

        const url = prompt('Enter the link URL (e.g. contact.html or https://...):', 'https://');
        if (url && url !== 'https://') {
            document.execCommand('createLink', false, url);
            saveEditorSelection(editorId);
        }
    };

    window.updateEditorStats = function(editorId) {
        const editor = document.getElementById(editorId);
        if (!editor) return;
        const text = editor.innerText || '';
        const words = text.trim() ? text.trim().split(/\\s+/).length : 0;
        const chars = text.length;
        const readingTime = Math.max(1, Math.ceil(words / 200));

        const wEl = document.getElementById('blogWordCount');
        const cEl = document.getElementById('blogCharCount');
        const rEl = document.getElementById('blogReadingTime');
        if (wEl) wEl.textContent = \`\${words} words\`;
        if (cEl) cEl.textContent = \`\${chars} characters\`;
        if (rEl) rEl.textContent = \`~\${readingTime} min read\`;
    };

    function updateFieldMetaCount(inputId, counterId) {
        const input = document.getElementById(inputId);
        const counter = document.getElementById(counterId);
        if (!input || !counter) return;
        const len = input.value.length;
        counter.textContent = \`\${len} / 160 characters\`;
        if (len > 160) {
            counter.style.color = '#ef4444';
            counter.style.fontWeight = '700';
        } else if (len >= 120) {
            counter.style.color = '#10b981';
            counter.style.fontWeight = '700';
        } else {
            counter.style.color = '#64748b';
            counter.style.fontWeight = 'normal';
        }
    }
    window.updateCourseMetaCount = () => updateFieldMetaCount('courseMetaDescInput', 'courseMetaCount');
    window.updateBlogMetaCount = () => updateFieldMetaCount('blogMetaDescInput', 'blogMetaCount');
    window.updateCollegeMetaCount = () => updateFieldMetaCount('collegeMetaDescInput', 'collegeMetaCount');
    window.updateUnivMetaCount = () => updateFieldMetaCount('univMetaDescInput', 'univMetaCount');
`;
    code = code.replace('// Live Meta Description Counter', `${editorExt}\n    // Live Meta Description Counter`);
    console.log('✅ Injected WYSIWYG tools and meta counters');
}

// 5. Update openBlogModal and handleBlogSubmit
const oldOpenBlogRegex = /window\.openBlogModal = function[\s\S]*?document\.getElementById\('blogModal'\)\.classList\.add\('open'\);\s*\};/;
const newOpenBlog = `window.openBlogModal = function(blog = null) {
        editingBlogId = blog ? blog.id : null;
        const form = document.getElementById('blogForm');
        if (form && !blog) form.reset();

        document.getElementById('blogModalTitle').innerHTML = blog ? '<i class="fa fa-newspaper-o text-primary"></i> Edit Blog Post' : '<i class="fa fa-newspaper-o text-primary"></i> Add New Blog Post';
        document.getElementById('blogTitleInput').value = blog ? blog.title : '';

        // 2. Meta Description
        const metaDescInp = document.getElementById('blogMetaDescInput');
        if (metaDescInp) {
            metaDescInp.value = blog ? (blog.metaDescription || blog.excerpt || '') : '';
            window.updateBlogMetaCount();
        }

        // 3, 4, 5. Tags, Categories, Keywords
        blogTagsList = blog && Array.isArray(blog.tags) ? [...blog.tags] : (blog && blog.tags ? String(blog.tags).split(',').map(s=>s.trim()).filter(Boolean) : ['University Guide', 'Admissions 2026']);
        renderUniversalChips('blogTagsChips', blogTagsList, 'blog', 'tag');

        blogCategoriesList = blog && Array.isArray(blog.categories) ? [...blog.categories] : (blog && blog.category ? String(blog.category).split(',').map(s=>s.trim()).filter(Boolean) : ['University Admissions']);
        renderUniversalChips('blogCategoriesChips', blogCategoriesList, 'blog', 'cat');

        blogKeywordsList = blog && Array.isArray(blog.keywords) ? [...blog.keywords] : (blog && blog.keywords ? String(blog.keywords).split(',').map(s=>s.trim()).filter(Boolean) : ['UGC Approved', 'Distance MBA']);
        renderUniversalChips('blogKeywordsChips', blogKeywordsList, 'blog', 'kw');

        document.getElementById('blogCategoryInput').value = blog ? (blog.category || 'University Admissions') : 'University Admissions';
        document.getElementById('blogAuthorInput').value = blog ? blog.author : 'Educationist Guru Academic Advisory';
        document.getElementById('blogDateInput').value = blog ? blog.date : new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
        document.getElementById('blogImageInput').value = blog ? blog.image : 'images/blog/1.jpg';
        document.getElementById('blogExcerptInput').value = blog ? (blog.excerpt || '') : '';

        const featCheck = document.getElementById('blogFeaturedInput');
        if (featCheck) featCheck.checked = blog ? Boolean(blog.featured) : false;
        
        // Visual WYSIWYG Blog Body Editor
        const blogVisual = document.getElementById('blogVisualEditor');
        const blogContent = blog ? (blog.content || '') : '';
        if (blogVisual) {
            blogVisual.innerHTML = blogContent;
            initVisualEditorEvents('blogVisualEditor');
            blogVisual.addEventListener('input', () => window.updateEditorStats('blogVisualEditor'));
            window.updateEditorStats('blogVisualEditor');
        }
        const blogContentInp = document.getElementById('blogContentInput');
        if (blogContentInp) blogContentInp.value = blogContent;

        window.updateThumbPreview('blogImagePreview', 'blogImageInput', blog ? blog.image : 'images/blog/1.jpg');

        document.getElementById('blogModal').classList.add('open');
    };`;

code = code.replace(oldOpenBlogRegex, newOpenBlog);
console.log('✅ Updated openBlogModal with SEO fields and stats');

// Update handleBlogSubmit payload
const oldBlogPayloadRegex = /const payload = \{[\s\S]*?content: content \|\| `[\s\S]*?`\s*\};/;
const newBlogPayload = `const metaDescription = document.getElementById('blogMetaDescInput') ? document.getElementById('blogMetaDescInput').value.trim() : '';
        const isFeatured = Boolean(document.getElementById('blogFeaturedInput')?.checked);

        const payload = {
            title,
            metaDescription,
            tags: [...blogTagsList],
            categories: blogCategoriesList.length > 0 ? [...blogCategoriesList] : [category],
            keywords: [...blogKeywordsList],
            category,
            author,
            date,
            image,
            featured: isFeatured,
            isFeatured: isFeatured,
            excerpt: excerpt || metaDescription || title,
            content: content || \`<p>\${title} is an insightful overview provided by EducationistGuru for academic guidance.</p>\`
        };`;

code = code.replace(oldBlogPayloadRegex, newBlogPayload);
console.log('✅ Updated handleBlogSubmit payload with SEO fields');

// 6. Update openCollegeModal with Meta Description, Tags, Keywords, Facilities
const oldOpenCollegeRegex = /window\.openCollegeModal = function[\s\S]*?document\.getElementById\('collegeModal'\)\.classList\.add\('open'\);\s*\};/;
const newOpenCollege = `window.openCollegeModal = function(college = null) {
        editingCollegeId = college ? college.id : null;
        const form = document.getElementById('collegeForm');
        if (form && !college) form.reset();

        document.getElementById('collegeModalTitle').innerHTML = college ? '<i class="fa fa-pencil text-primary"></i> Edit College' : '<i class="fa fa-university text-primary"></i> Add New College';
        document.getElementById('collegeNameInput').value = college ? college.name : '';

        // 2. Meta Description
        const metaDescInp = document.getElementById('collegeMetaDescInput');
        if (metaDescInp) {
            metaDescInp.value = college ? (college.metaDescription || '') : '';
            window.updateCollegeMetaCount();
        }

        // 3, 4, 5. Tags, Keywords, Facilities
        collegeTagsList = college && Array.isArray(college.tags) ? [...college.tags] : (college && college.tags ? String(college.tags).split(',').map(s=>s.trim()).filter(Boolean) : ['Top College', 'Accredited']);
        renderUniversalChips('collegeTagsChips', collegeTagsList, 'college', 'tag');

        collegeKeywordsList = college && Array.isArray(college.keywords) ? [...college.keywords] : (college && college.keywords ? String(college.keywords).split(',').map(s=>s.trim()).filter(Boolean) : ['Pharmacy', 'Engineering Admissions']);
        renderUniversalChips('collegeKeywordsChips', collegeKeywordsList, 'college', 'kw');

        collegeFacilitiesList = college && Array.isArray(college.facilities) ? [...college.facilities] : (college && college.facilities ? String(college.facilities).split(',').map(s=>s.trim()).filter(Boolean) : ['Wi-Fi Campus', 'Modern Labs', 'Hostel']);
        renderUniversalChips('collegeFacilitiesChips', collegeFacilitiesList, 'college', 'fac');

        let initialCategories = 'Faculty of Engineering & Technology, Faculty of Computer Applications & IT';
        if (college) {
            if (Array.isArray(college.categories) && college.categories.length > 0) {
                initialCategories = college.categories.join(', ');
            } else if (college.category) {
                initialCategories = college.category;
            }
        }
        document.getElementById('collegeCategoryInput').value = initialCategories;

        document.getElementById('collegeAffiliationInput').value = college ? (college.affiliation || '') : '';
        document.getElementById('collegeLocationInput').value = college ? college.location : 'New Delhi, India';
        document.getElementById('collegeEstablishedInput').value = college ? (college.established || '2010') : '2010';
        document.getElementById('collegeAccreditationInput').value = college ? (Array.isArray(college.accreditation) ? college.accreditation.join(', ') : college.accreditation) : 'PCI Approved, AICTE, NAAC A+';
        document.getElementById('collegeFeeInput').value = college ? college.fee : '₹55,000 - ₹95,000 / year';
        document.getElementById('collegeImageInput').value = college ? college.image : 'images/courses/1.jpg';
        document.getElementById('collegeRatingInput').value = college ? college.rating : '4.8';

        // Populate course tag manager
        if (college) {
            if (Array.isArray(college.courses)) {
                collegeCoursesList = college.courses.slice();
            } else if (college.courses) {
                collegeCoursesList = String(college.courses).split(',').map(s => s.trim()).filter(Boolean);
            } else {
                collegeCoursesList = ['Degree Programs'];
            }
        } else {
            collegeCoursesList = ['B.Tech Artificial Intelligence', 'B.Tech Computer Science', 'MCA', 'BCA'];
        }

        collegeActiveStreamFilter = 'all';
        collegeProgramSearchQuery = '';
        const searchInp = document.getElementById('collegeProgramSearchInput');
        if (searchInp) searchInp.value = '';

        renderCollegeCategoryCards();
        renderCollegeCoursesTags();

        const currentImg = college ? college.image : 'images/courses/1.jpg';
        document.querySelectorAll('#collegeModal .preset-campus-card').forEach(card => {
            card.classList.toggle('active', card.dataset.src === currentImg);
        });

        document.getElementById('collegeDescriptionInput').value = college ? (college.description || '') : '';
        document.getElementById('collegeFeaturedInput').checked = college ? Boolean(college.featured || college.isFeatured) : true;

        window.updateThumbPreview('collegeImagePreview', 'collegeImageInput', currentImg);

        document.getElementById('collegeModal').classList.add('open');
    };`;

code = code.replace(oldOpenCollegeRegex, newOpenCollege);
console.log('✅ Updated openCollegeModal with SEO and Facilities');

// Update handleCollegeSubmit payload
const oldCollegePayloadRegex = /const payload = \{[\s\S]*?featured: featured\s*\};/;
const newCollegePayload = `const metaDescription = document.getElementById('collegeMetaDescInput') ? document.getElementById('collegeMetaDescInput').value.trim() : '';

        const payload = {
            name,
            metaDescription,
            tags: [...collegeTagsList],
            keywords: [...collegeKeywordsList],
            facilities: [...collegeFacilitiesList],
            category: categories.join(', '),
            categories: categories,
            affiliation,
            location,
            established,
            accreditation: Array.isArray(accreditation) ? accreditation.join(', ') : accreditation,
            fee,
            image,
            rating,
            courses: courses,
            description: description || \`\${name} offers accredited professional degree programs with distinguished faculty and placement guidance.\`,
            isFeatured: featured,
            featured: featured
        };`;

code = code.replace(oldCollegePayloadRegex, newCollegePayload);
console.log('✅ Updated handleCollegeSubmit payload with SEO and Facilities');

// 7. Update openUnivModal with Meta Description, Tags, Keywords, Facilities
const oldOpenUnivRegex = /window\.openUnivModal = function[\s\S]*?document\.getElementById\('univModal'\)\.classList\.add\('open'\);\s*\};/;
const newOpenUniv = `window.openUnivModal = function(univ = null) {
        editingUnivId = univ ? univ.id : null;
        const form = document.getElementById('univForm');
        if (form && !univ) form.reset();

        document.getElementById('univModalTitle').innerHTML = univ ? '<i class="fa fa-pencil text-primary"></i> Edit University' : '<i class="fa fa-graduation-cap text-primary"></i> Add New University';
        document.getElementById('univNameInput').value = univ ? univ.name : '';

        // 2. Meta Description
        const metaDescInp = document.getElementById('univMetaDescInput');
        if (metaDescInp) {
            metaDescInp.value = univ ? (univ.metaDescription || '') : '';
            window.updateUnivMetaCount();
        }

        // 3, 4, 5. Tags, Keywords, Facilities
        univTagsList = univ && Array.isArray(univ.tags) ? [...univ.tags] : (univ && univ.tags ? String(univ.tags).split(',').map(s=>s.trim()).filter(Boolean) : ['UGC-DEB University', 'Online Degrees']);
        renderUniversalChips('univTagsChips', univTagsList, 'univ', 'tag');

        univKeywordsList = univ && Array.isArray(univ.keywords) ? [...univ.keywords] : (univ && univ.keywords ? String(univ.keywords).split(',').map(s=>s.trim()).filter(Boolean) : ['Distance MBA', 'Degree Govt Valid']);
        renderUniversalChips('univKeywordsChips', univKeywordsList, 'univ', 'kw');

        univFacilitiesList = univ && Array.isArray(univ.facilities) ? [...univ.facilities] : (univ && univ.facilities ? String(univ.facilities).split(',').map(s=>s.trim()).filter(Boolean) : ['Student LMS Portal', 'Digital Evaluation', 'Placement Cell']);
        renderUniversalChips('univFacilitiesChips', univFacilitiesList, 'univ', 'fac');

        document.getElementById('univTypeInput').value = univ ? univ.type : 'State Private University';
        document.getElementById('univApprovalsInput').value = univ ? (Array.isArray(univ.approvals) ? univ.approvals.join(', ') : univ.approvals) : 'UGC Recognized, AIU Member, AICTE Approved';
        document.getElementById('univLocationInput').value = univ ? univ.location : 'India';
        document.getElementById('univEstablishedInput').value = univ ? (univ.established || '2018') : '2018';
        document.getElementById('univNaacInput').value = univ ? (univ.naac || 'NAAC A Grade') : 'NAAC A Grade';
        document.getElementById('univModesInput').value = univ ? (Array.isArray(univ.modes) ? univ.modes.join(', ') : univ.modes) : 'Online / Regular / Distance Learning';
        document.getElementById('univFeeInput').value = univ ? univ.fee : 'Affordable Semester Installments';
        document.getElementById('univImageInput').value = univ ? univ.image : 'images/slider/home1/slide1.jpg';

        let streamsVal = 'Commerce & Management, Computer Applications & IT, Arts, Humanities & Social Sciences';
        if (univ) {
            if (Array.isArray(univ.streams) && univ.streams.length > 0) {
                streamsVal = univ.streams.join(', ');
            } else if (univ.popularStreams) {
                streamsVal = univ.popularStreams;
            }
        }
        document.getElementById('univStreamsInput').value = streamsVal;

        if (univ) {
            if (Array.isArray(univ.courses)) {
                univCoursesList = univ.courses.slice();
            } else if (univ.courses) {
                univCoursesList = String(univ.courses).split(',').map(s => s.trim()).filter(Boolean);
            } else {
                univCoursesList = ['MBA (Online/Distance)', 'MCA', 'BBA', 'BCA'];
            }
        } else {
            univCoursesList = ['MBA (Online/Distance)', 'MCA', 'BBA', 'BCA'];
        }

        univActiveStreamFilter = 'all';
        univProgramSearchQuery = '';
        const searchInp = document.getElementById('univProgramSearchInput');
        if (searchInp) searchInp.value = '';

        renderUnivStreamCards();
        renderUnivCoursesTags();

        const currentImg = univ ? univ.image : 'images/slider/home1/slide1.jpg';
        document.querySelectorAll('#univModal .preset-campus-card').forEach(card => {
            card.classList.toggle('active', card.dataset.src === currentImg);
        });

        document.getElementById('univHighlightsInput').value = univ ? (univ.highlights || '') : 'Valid for all Govt Jobs, AIU Equivalence';
        document.getElementById('univDescriptionInput').value = univ ? (univ.description || '') : '';
        document.getElementById('univFeaturedInput').checked = univ ? Boolean(univ.featured || univ.isFeatured) : true;

        window.updateThumbPreview('univImagePreview', 'univImageInput', currentImg);

        document.getElementById('univModal').classList.add('open');
    };`;

code = code.replace(oldOpenUnivRegex, newOpenUniv);
console.log('✅ Updated openUnivModal with SEO and Facilities');

// Update handleUnivSubmit payload
const oldUnivPayloadRegex = /const payload = \{[\s\S]*?featured: featured\s*\};/;
const newUnivPayload = `const metaDescription = document.getElementById('univMetaDescInput') ? document.getElementById('univMetaDescInput').value.trim() : '';

        const payload = {
            name,
            metaDescription,
            tags: [...univTagsList],
            keywords: [...univKeywordsList],
            facilities: [...univFacilitiesList],
            type,
            approvals: Array.isArray(approvals) ? approvals.join(', ') : approvals,
            location,
            established,
            naac,
            modes: Array.isArray(modes) ? modes.join(', ') : modes,
            fee,
            image,
            popularStreams: streams.join(', '),
            streams: streams,
            highlights,
            courses: courses,
            description: description || \`\${name} is a premier accredited university partner.\`,
            isFeatured: featured,
            featured: featured
        };`;

code = code.replace(oldUnivPayloadRegex, newUnivPayload);
console.log('✅ Updated handleUnivSubmit payload with SEO and Facilities');

// 8. Event listener bindings for enter keys on new inputs & meta counters
if (!code.includes('blogTagInput.onkeydown')) {
    const bindMarker = 'tagInput.onkeydown = (e) => { if (e.key === \'Enter\') { e.preventDefault(); window.addChip(\'course\', \'tag\'); } };';
    const newBindings = `tagInput.onkeydown = (e) => { if (e.key === 'Enter') { e.preventDefault(); window.addChip('course', 'tag'); } };

            // Blog chip enter key triggers
            const bTagInp = document.getElementById('blogTagInput');
            if (bTagInp) bTagInp.onkeydown = (e) => { if (e.key === 'Enter') { e.preventDefault(); window.addChip('blog', 'tag'); } };
            const bCatInp = document.getElementById('blogCategoryInput');
            if (bCatInp) bCatInp.onkeydown = (e) => { if (e.key === 'Enter') { e.preventDefault(); window.addChip('blog', 'cat'); } };
            const bKwInp = document.getElementById('blogKeywordInput');
            if (bKwInp) bKwInp.onkeydown = (e) => { if (e.key === 'Enter') { e.preventDefault(); window.addChip('blog', 'kw'); } };

            // College chip enter key triggers
            const cTagInp = document.getElementById('collegeTagInput');
            if (cTagInp) cTagInp.onkeydown = (e) => { if (e.key === 'Enter') { e.preventDefault(); window.addChip('college', 'tag'); } };
            const cKwInp = document.getElementById('collegeKeywordInput');
            if (cKwInp) cKwInp.onkeydown = (e) => { if (e.key === 'Enter') { e.preventDefault(); window.addChip('college', 'kw'); } };
            const cFacInp = document.getElementById('collegeFacilityInput');
            if (cFacInp) cFacInp.onkeydown = (e) => { if (e.key === 'Enter') { e.preventDefault(); window.addChip('college', 'fac'); } };

            // University chip enter key triggers
            const uTagInp = document.getElementById('univTagInput');
            if (uTagInp) uTagInp.onkeydown = (e) => { if (e.key === 'Enter') { e.preventDefault(); window.addChip('univ', 'tag'); } };
            const uKwInp = document.getElementById('univKeywordInput');
            if (uKwInp) uKwInp.onkeydown = (e) => { if (e.key === 'Enter') { e.preventDefault(); window.addChip('univ', 'kw'); } };
            const uFacInp = document.getElementById('univFacilityInput');
            if (uFacInp) uFacInp.onkeydown = (e) => { if (e.key === 'Enter') { e.preventDefault(); window.addChip('univ', 'fac'); } };

            // Meta description live counters
            const bMetaInp = document.getElementById('blogMetaDescInput');
            if (bMetaInp) bMetaInp.addEventListener('input', window.updateBlogMetaCount);
            const cMetaInp = document.getElementById('collegeMetaDescInput');
            if (cMetaInp) cMetaInp.addEventListener('input', window.updateCollegeMetaCount);
            const uMetaInp = document.getElementById('univMetaDescInput');
            if (uMetaInp) uMetaInp.addEventListener('input', window.updateUnivMetaCount);`;

    code = code.replace(bindMarker, newBindings);
    console.log('✅ Added Enter key and counter listeners');
}

fs.writeFileSync(jsPath, code, 'utf8');
console.log('✅ Successfully wrote updated edit/js/edit.js');
