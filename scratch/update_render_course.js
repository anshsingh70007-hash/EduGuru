const fs = require('fs');
let html = fs.readFileSync('courses-details.html', 'utf8');

// Normalize line endings for replacement or replace CRLF safely
const hasCRLF = html.includes('\r\n');
if (hasCRLF) html = html.replace(/\r\n/g, '\n');

const targetFunctionStart = '            // Populate DOM with course data\n            function renderCourse(c) {';
const targetFunctionEnd = '                // If user accessed via ?id=106, cleanly pushState to /courses/:slug';

const replacementFunction = `            // Populate DOM with course data
            function renderCourse(c) {
                if (!c) return;
                activeCourse = c;

                // Document Metadata (Point 1 & 2: Title & Meta Description & Keywords)
                document.title = \`\${c.name} | Admissions, Eligibility & Fee | EducationistGuru\`;
                const metaDesc = document.querySelector('meta[name="description"]');
                if (metaDesc) {
                    metaDesc.setAttribute('content', c.metaDescription || \`\${c.name} course details at EducationistGuru. Duration: \${c.duration}, Mode: \${c.mode || 'Online/Regular'}. Annual Fee: \${c.fee}. Get 100% free admission guidance.\`);
                }
                let metaKw = document.querySelector('meta[name="keywords"]');
                if (!metaKw) {
                    metaKw = document.createElement('meta');
                    metaKw.setAttribute('name', 'keywords');
                    document.head.appendChild(metaKw);
                }
                const kwContent = (Array.isArray(c.keywords) && c.keywords.length > 0) ? c.keywords.join(', ') : \`\${c.name}, admission, eligibility, syllabus\`;
                metaKw.setAttribute('content', kwContent);

                // Breadcrumbs & Titles (Point 1: Title)
                const bcTitle = document.getElementById('breadcrumbCourseTitle');
                if (bcTitle) bcTitle.textContent = c.name;

                const heroTitle = document.getElementById('heroCourseTitle');
                if (heroTitle) heroTitle.textContent = c.name;

                const heroFacBadge = document.getElementById('heroFacultyText');
                if (heroFacBadge) heroFacBadge.textContent = c.faculty || 'University Degree Program';

                // Render Multi-Tag & Category Chips (Point 3, 4, 5)
                const heroChipsRow = document.getElementById('heroChipsRow');
                if (heroChipsRow) {
                    let chipsHtml = '';
                    if (Array.isArray(c.categories) && c.categories.length > 0) {
                        chipsHtml += c.categories.map(cat => \`<span class="cd-chip-cat"><i class="fa fa-folder-open"></i> \${cat}</span>\`).join('');
                    }
                    if (Array.isArray(c.tags) && c.tags.length > 0) {
                        chipsHtml += c.tags.map(tag => \`<span class="cd-chip-tag"><i class="fa fa-tag"></i> \${tag}</span>\`).join('');
                    }
                    if (Array.isArray(c.keywords) && c.keywords.length > 0) {
                        chipsHtml += c.keywords.slice(0, 3).map(kw => \`<span class="cd-chip-kw"><i class="fa fa-search"></i> \${kw}</span>\`).join('');
                    }
                    heroChipsRow.innerHTML = chipsHtml;
                }

                const heroDuration = document.getElementById('heroDuration');
                if (heroDuration) heroDuration.textContent = c.duration || '3 Years';

                const heroMode = document.getElementById('heroMode');
                if (heroMode) heroMode.textContent = c.mode || 'Online / Regular / Distance';

                // Feature Image (Point 6)
                const imgEl = document.getElementById('cdCourseImage');
                if (imgEl) {
                    const imgSrc = (c.image || 'images/courses/1.jpg').replace(/^\\//, '');
                    imgEl.src = imgSrc;
                    imgEl.alt = c.name;
                }

                // Overview & Description (Supports H1-H6 Structured Headings - Point 7)
                const overviewEl = document.getElementById('cdOverviewText');
                if (overviewEl) {
                    const rawContent = c.overviewContent || c.description;
                    if (rawContent) {
                        if (/<[a-z][\\s\\S]*>/i.test(rawContent)) {
                            overviewEl.innerHTML = rawContent;
                        } else {
                            overviewEl.innerHTML = rawContent.split('\\n\\n').map(para => \`<p style="margin-bottom:14px;">\${para.replace(/\\n/g, '<br>')}</p>\`).join('');
                        }
                    } else {
                        overviewEl.innerHTML = \`<p>\${c.name} is engineered to provide students with foundational theory, domain competencies, and career-oriented skillsets recognized across leading employers in India.</p>\`;
                    }
                }

                // Campus & Media Gallery (Point 6)
                const galSection = document.getElementById('cdGallerySection');
                const galGrid = document.getElementById('cdGalleryGrid');
                if (galSection && galGrid) {
                    if (Array.isArray(c.galleryImages) && c.galleryImages.length > 0) {
                        galGrid.innerHTML = c.galleryImages.map((img, i) => \`
                            <div class="cd-gallery-thumb">
                                <img src="\${img.replace(/^\\//, '')}" alt="Campus Media \${i+1}" onerror="this.src='images/courses/1.jpg';">
                            </div>
                        \`).join('');
                        galSection.style.display = 'block';
                    } else {
                        galSection.style.display = 'none';
                    }
                }

                // Specializations
                const specBox = document.getElementById('cdSpecBox');
                const specTags = document.getElementById('cdSpecTags');
                if (c.specializations && specTags) {
                    const specs = c.specializations.split(',').map(s => s.trim()).filter(Boolean);
                    if (specs.length > 0) {
                        specTags.innerHTML = specs.map(s => \`<span class="cd-spec-tag"><i class="fa fa-check text-danger" style="margin-right:4px;"></i>\${s}</span>\`).join('');
                        if (specBox) specBox.style.display = 'block';
                    } else if (specBox) {
                        specBox.style.display = 'none';
                    }
                } else if (specBox) {
                    specBox.style.display = 'none';
                }

                // Curriculum
                const currList = document.getElementById('cdCurriculumList');
                if (currList) {
                    const mods = Array.isArray(c.curriculum) && c.curriculum.length > 0
                        ? c.curriculum
                        : ['Foundation Modules & Core Principles', 'Specialization Elective Subjects', 'Practical Projects & Laboratory Sessions', 'Industry Readiness & Placement Training'];
                    
                    currList.innerHTML = mods.map((mod, idx) => \`
                        <li class="cd-curriculum-item">
                            <div class="cd-curriculum-icon"><i class="fa fa-book"></i></div>
                            <span><strong>Module \${idx + 1}:</strong> \${mod}</span>
                        </li>
                    \`).join('');
                }

                // Eligibility
                const eligEl = document.getElementById('cdEligibilityText');
                if (eligEl) eligEl.textContent = c.eligibility || '10+2 from recognized board or bachelor degree';

                // Sidebar Stats
                const sideFee = document.getElementById('sidebarFee');
                if (sideFee) sideFee.textContent = c.fee || '₹40,000 / year';

                const sideDur = document.getElementById('sidebarDuration');
                if (sideDur) sideDur.textContent = c.duration || '3 Years';

                const sideMode = document.getElementById('sidebarMode');
                if (sideMode) sideMode.textContent = c.mode || 'Online / Regular / Distance';

                const sideElig = document.getElementById('sidebarEligibility');
                if (sideElig) sideElig.textContent = (c.eligibility && c.eligibility.length > 25) ? c.eligibility.slice(0, 23) + '...' : (c.eligibility || 'Recognized');
`;

if (html.includes(targetFunctionStart) && html.includes(targetFunctionEnd)) {
    const startIdx = html.indexOf(targetFunctionStart);
    const endIdx = html.indexOf(targetFunctionEnd);
    html = html.substring(0, startIdx) + replacementFunction + '\n' + html.substring(endIdx);
    if (hasCRLF) html = html.replace(/\n/g, '\r\n');
    fs.writeFileSync('courses-details.html', html, 'utf8');
    console.log('✅ renderCourse cleanly updated with 7-point rendering logic!');
} else {
    console.error('renderCourse target bounds still not found!');
}
