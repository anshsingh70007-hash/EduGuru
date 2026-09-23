const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const serverPath = path.join(rootDir, 'server.js');
const cmsPath = path.join(rootDir, 'js', 'cms-content.js');

console.log('--- Step 1: Upgrading server.js for SEO, Facilities & Robust Menu Synchronization ---');
let serverCode = fs.readFileSync(serverPath, 'utf8');

// 1. Upgrade /api/content/menu in server.js to merge cleanly and handle DELETE
const oldMenuEndpoint = `    // POST /api/content/menu
    if (pathname === '/api/content/menu' && req.method === 'POST') {
        try {
            const body = await readJsonBody();
            if (!body.config) body.config = {};
            body.config.updatedAt = new Date().toISOString();
            writeDataFile('site_menu.json', body);
            return sendJson(200, { success: true, data: body, message: 'Navigation menu updated successfully' });
        } catch (err) {
            return sendJson(400, { success: false, error: err.message || 'Failed to update menu' });
        }
    }`;

const newMenuEndpoint = `    // POST / PUT /api/content/menu
    if (pathname === '/api/content/menu' && (req.method === 'POST' || req.method === 'PUT')) {
        try {
            const body = await readJsonBody();
            let current = readDataFile('site_menu.json', { announcement: {}, navItems: [] });

            // Merge announcement
            if (body.announcement) {
                current.announcement = { ...current.announcement, ...body.announcement };
            }

            // Merge or replace navItems
            if (Array.isArray(body.navItems)) {
                current.navItems = body.navItems;
            } else if (body.navItem) {
                if (!Array.isArray(current.navItems)) current.navItems = [];
                const idx = current.navItems.findIndex(n => n.id === body.navItem.id);
                if (idx >= 0) {
                    current.navItems[idx] = { ...current.navItems[idx], ...body.navItem };
                } else {
                    current.navItems.push(body.navItem);
                }
            }

            if (body.config) {
                current.config = { ...current.config, ...body.config };
            }
            if (!current.config) current.config = {};
            current.config.updatedAt = new Date().toISOString();

            writeDataFile('site_menu.json', current);
            return sendJson(200, { success: true, data: current, menu: current, message: 'Website navigation and headers updated successfully' });
        } catch (err) {
            return sendJson(400, { success: false, error: err.message || 'Failed to update menu' });
        }
    }

    // DELETE /api/content/menu/items/:id
    const menuItemMatch = pathname.match(/^\\/api\\/content\\/menu\\/items\\/([^\\/]+)$/);
    if (menuItemMatch && req.method === 'DELETE') {
        try {
            const itemId = decodeURIComponent(menuItemMatch[1]);
            let current = readDataFile('site_menu.json', { announcement: {}, navItems: [] });
            if (Array.isArray(current.navItems)) {
                current.navItems = current.navItems.filter(n => n.id !== itemId);
                if (!current.config) current.config = {};
                current.config.updatedAt = new Date().toISOString();
                writeDataFile('site_menu.json', current);
            }
            return sendJson(200, { success: true, message: 'Navigation header item removed successfully' });
        } catch (err) {
            return sendJson(500, { success: false, error: err.message });
        }
    }`;

if (serverCode.includes('// POST /api/content/menu')) {
    serverCode = serverCode.replace(oldMenuEndpoint, newMenuEndpoint);
    console.log('✅ Upgraded /api/content/menu endpoint in server.js');
}

// 2. Ensure newCollege preserves metaDescription, tags, keywords, facilities
const oldNewCollege = `            const newCollege = {
                id: newId,
                slug: candidateSlug,
                name: body.name.trim(),
                category: categoryStr,
                categories: categoriesArr,
                affiliation: body.affiliation || 'Approved by State University / AICTE',
                location: body.location || 'New Delhi, India',
                established: body.established || '2008',
                accreditation: accreditationStr,
                fee: body.fee || '₹50,000 - ₹95,000 / year',
                image: body.image || 'images/courses/1.jpg',
                rating: Number(body.rating) || 4.8,
                courses: coursesStr,
                coursesList: coursesArr,
                description: body.description || \`\${body.name} offers premier accredited higher education programs.\`,
                isFeatured: isFeaturedBool,
                featured: isFeaturedBool,
                dateAdded: new Date().toISOString()
            };`;

const updatedNewCollege = `            const newCollege = {
                id: newId,
                slug: candidateSlug,
                name: body.name.trim(),
                metaDescription: body.metaDescription || '',
                tags: Array.isArray(body.tags) ? body.tags : (body.tags ? String(body.tags).split(',').map(s=>s.trim()).filter(Boolean) : []),
                keywords: Array.isArray(body.keywords) ? body.keywords : (body.keywords ? String(body.keywords).split(',').map(s=>s.trim()).filter(Boolean) : []),
                facilities: Array.isArray(body.facilities) ? body.facilities : (body.facilities ? String(body.facilities).split(',').map(s=>s.trim()).filter(Boolean) : []),
                category: categoryStr,
                categories: categoriesArr,
                affiliation: body.affiliation || 'Approved by State University / AICTE',
                location: body.location || 'New Delhi, India',
                established: body.established || '2008',
                accreditation: accreditationStr,
                fee: body.fee || '₹50,000 - ₹95,000 / year',
                image: body.image || 'images/courses/1.jpg',
                rating: Number(body.rating) || 4.8,
                courses: coursesStr,
                coursesList: coursesArr,
                description: body.description || \`\${body.name} offers premier accredited higher education programs.\`,
                isFeatured: isFeaturedBool,
                featured: isFeaturedBool,
                dateAdded: new Date().toISOString()
            };`;

if (serverCode.includes(oldNewCollege)) {
    serverCode = serverCode.replace(oldNewCollege, updatedNewCollege);
    console.log('✅ Added metaDescription, tags, keywords, facilities to POST /api/content/colleges');
}

// 3. Ensure newUniv preserves metaDescription, tags, keywords, facilities
const oldNewUniv = `            const newUniv = {
                id: newId,
                slug: candidateSlug,
                name: body.name.trim(),
                shortName: body.shortName || body.name.trim().split(' ').map(w => w[0]).join('').substring(0, 5),
                type: body.type || 'State Private University',
                state: body.state || 'India',
                location: body.location || body.state || 'India',
                established: body.established || '2018',
                naac: body.naac || 'NAAC A Grade',
                approvals: approvalsStr,
                modes: modesStr,
                popularStreams: streamsStr,
                streams: streamsArr,
                courses: coursesStr,
                coursesList: coursesArr,
                totalCourses: Number(body.totalCourses) || 30,
                rating: Number(body.rating) || 4.9,
                logo: body.logo || 'images/logo.png',
                image: body.image || 'images/slider/home1/slide1.jpg',
                website: body.website || 'https://educationistguru.com',
                highlights: body.highlights || 'Valid for all Govt & Private Jobs, AIU Equivalence',
                description: body.description || \`\${body.name} is a premier accredited university partner.\`,
                isFeatured: isFeaturedBool,
                featured: isFeaturedBool,
                dateAdded: new Date().toISOString()
            };`;

const updatedNewUniv = `            const newUniv = {
                id: newId,
                slug: candidateSlug,
                name: body.name.trim(),
                metaDescription: body.metaDescription || '',
                tags: Array.isArray(body.tags) ? body.tags : (body.tags ? String(body.tags).split(',').map(s=>s.trim()).filter(Boolean) : []),
                keywords: Array.isArray(body.keywords) ? body.keywords : (body.keywords ? String(body.keywords).split(',').map(s=>s.trim()).filter(Boolean) : []),
                facilities: Array.isArray(body.facilities) ? body.facilities : (body.facilities ? String(body.facilities).split(',').map(s=>s.trim()).filter(Boolean) : []),
                shortName: body.shortName || body.name.trim().split(' ').map(w => w[0]).join('').substring(0, 5),
                type: body.type || 'State Private University',
                state: body.state || 'India',
                location: body.location || body.state || 'India',
                established: body.established || '2018',
                naac: body.naac || 'NAAC A Grade',
                approvals: approvalsStr,
                modes: modesStr,
                popularStreams: streamsStr,
                streams: streamsArr,
                courses: coursesStr,
                coursesList: coursesArr,
                totalCourses: Number(body.totalCourses) || 30,
                rating: Number(body.rating) || 4.9,
                logo: body.logo || 'images/logo.png',
                image: body.image || 'images/slider/home1/slide1.jpg',
                website: body.website || 'https://educationistguru.com',
                highlights: body.highlights || 'Valid for all Govt & Private Jobs, AIU Equivalence',
                description: body.description || \`\${body.name} is a premier accredited university partner.\`,
                isFeatured: isFeaturedBool,
                featured: isFeaturedBool,
                dateAdded: new Date().toISOString()
            };`;

if (serverCode.includes(oldNewUniv)) {
    serverCode = serverCode.replace(oldNewUniv, updatedNewUniv);
    console.log('✅ Added metaDescription, tags, keywords, facilities to POST /api/content/universities');
}

// 4. Ensure newBlog preserves metaDescription, tags, categories, keywords
const oldNewBlog = `            const newBlog = {
                id: newId,
                slug: slugify(body.title) || \`blog-\${newId}\`,
                title: body.title.trim(),
                category: body.category || 'General',
                author: body.author || 'EducationistGuru',
                date: body.date || new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
                image: body.image || 'images/blog/1.jpg',
                excerpt: body.excerpt || (body.content ? body.content.replace(/<[^>]+>/g, '').slice(0, 160) + '...' : ''),
                content: body.content || '',
                commentsCount: body.commentsCount || 0,
                featured: !!body.featured,
                dateAdded: new Date().toISOString()
            };`;

const updatedNewBlog = `            const newBlog = {
                id: newId,
                slug: slugify(body.title) || \`blog-\${newId}\`,
                title: body.title.trim(),
                metaDescription: body.metaDescription || '',
                tags: Array.isArray(body.tags) ? body.tags : (body.tags ? String(body.tags).split(',').map(s=>s.trim()).filter(Boolean) : []),
                categories: Array.isArray(body.categories) ? body.categories : (body.category ? [body.category] : ['University Admissions']),
                keywords: Array.isArray(body.keywords) ? body.keywords : (body.keywords ? String(body.keywords).split(',').map(s=>s.trim()).filter(Boolean) : []),
                category: body.category || 'General',
                author: body.author || 'EducationistGuru',
                date: body.date || new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
                image: body.image || 'images/blog/1.jpg',
                excerpt: body.excerpt || body.metaDescription || (body.content ? body.content.replace(/<[^>]+>/g, '').slice(0, 160) + '...' : ''),
                content: body.content || '',
                commentsCount: body.commentsCount || 0,
                featured: !!body.featured,
                dateAdded: new Date().toISOString()
            };`;

if (serverCode.includes(oldNewBlog)) {
    serverCode = serverCode.replace(oldNewBlog, updatedNewBlog);
    console.log('✅ Added metaDescription, tags, categories, keywords to POST /api/content/blogs');
}

fs.writeFileSync(serverPath, serverCode, 'utf8');
console.log('✅ Successfully updated server.js');

console.log('--- Step 2: Upgrading js/cms-content.js to display facilities and tags ---');
let cmsCode = fs.readFileSync(cmsPath, 'utf8');

// Render facilities on college cards
const oldCollegeCardBody = `<div class="card-info-item"><i class="fa fa-inr text-warning"></i> <span><strong>Fee Guide:</strong> \${c.fee || 'Contact for details'}</span></div>
                            <p class="card-desc">\${c.description ? c.description.slice(0, 110) + '...' : 'Complete admission guidance, fee installment options, and seat booking assistance via Educationist Guru.'}</p>`;

const newCollegeCardBody = `<div class="card-info-item"><i class="fa fa-inr text-warning"></i> <span><strong>Fee Guide:</strong> \${c.fee || 'Contact for details'}</span></div>
                            \${c.facilities && (Array.isArray(c.facilities) ? c.facilities.length > 0 : c.facilities) ? \`
                                <div style="display:flex; flex-wrap:wrap; gap:4px; margin: 6px 0 8px;">
                                    \${(Array.isArray(c.facilities) ? c.facilities : String(c.facilities).split(',')).slice(0, 3).map(f => \`<span style="background:#f1f5f9; color:#475569; font-size:11px; padding:2px 7px; border-radius:4px; font-weight:600;"><i class="fa fa-check" style="color:#10b981; font-size:9px; margin-right:3px;"></i>\${f.trim()}</span>\`).join('')}
                                </div>
                            \` : ''}
                            <p class="card-desc">\${c.description ? c.description.slice(0, 110) + '...' : 'Complete admission guidance, fee installment options, and seat booking assistance via Educationist Guru.'}</p>`;

if (cmsCode.includes(oldCollegeCardBody)) {
    cmsCode = cmsCode.replace(oldCollegeCardBody, newCollegeCardBody);
    console.log('✅ Injected facilities into College Cards in js/cms-content.js');
}

// Render facilities in showCollegeDetails modal
const oldCollegeModalDetails = `<h5 style="font-size:15px;font-weight:700;color:#0f172a;margin:18px 0 10px;display:flex;align-items:center;gap:6px;"><i class="fa fa-list-ul" style="color:#ff6b00;"></i> Programs &amp; Courses Offered:</h5>`;

const newCollegeModalDetails = `\${college.facilities && (Array.isArray(college.facilities) ? college.facilities.length > 0 : college.facilities.trim()) ? \`
                                        <h5 style="font-size:15px;font-weight:700;color:#0f172a;margin:16px 0 8px;display:flex;align-items:center;gap:6px;"><i class="fa fa-wifi" style="color:#ff6b00;"></i> Campus Facilities &amp; Amenities:</h5>
                                        <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:12px;">
                                            \${(Array.isArray(college.facilities) ? college.facilities : String(college.facilities).split(',')).map(f => \`<span style="background:#f1f5f9;border:1px solid #cbd5e1;padding:4px 10px;border-radius:20px;font-size:12px;font-weight:600;color:#334155;display:inline-flex;align-items:center;gap:5px;"><i class="fa fa-check-circle" style="color:#10b981;"></i>\${f.trim()}</span>\`).join('')}
                                        </div>
                                    \` : ''}
                                    <h5 style="font-size:15px;font-weight:700;color:#0f172a;margin:18px 0 10px;display:flex;align-items:center;gap:6px;"><i class="fa fa-list-ul" style="color:#ff6b00;"></i> Programs &amp; Courses Offered:</h5>`;

if (cmsCode.includes(oldCollegeModalDetails)) {
    cmsCode = cmsCode.replace(oldCollegeModalDetails, newCollegeModalDetails);
    console.log('✅ Injected facilities into College Detail Modal in js/cms-content.js');
}

// Render facilities on Univ Cards
const oldUnivCardHighlight = `<div class="card-highlight-box"><i class="fa fa-check-circle" style="color:#10b981;margin-right:4px;"></i> \${u.highlights ? u.highlights.slice(0, 90) + '...' : 'Recognized for Govt Jobs & Abroad'}</div>`;

const newUnivCardHighlight = `<div class="card-highlight-box"><i class="fa fa-check-circle" style="color:#10b981;margin-right:4px;"></i> \${u.highlights ? u.highlights.slice(0, 90) + '...' : 'Recognized for Govt Jobs & Abroad'}</div>
                            \${u.facilities && (Array.isArray(u.facilities) ? u.facilities.length > 0 : u.facilities) ? \`
                                <div style="display:flex; flex-wrap:wrap; gap:4px; margin: 6px 0 8px;">
                                    \${(Array.isArray(u.facilities) ? u.facilities : String(u.facilities).split(',')).slice(0, 3).map(f => \`<span style="background:#f5f3ff; color:#6d28d9; border:1px solid #ddd6fe; font-size:11px; padding:2px 7px; border-radius:4px; font-weight:600;"><i class="fa fa-check" style="color:#8b5cf6; font-size:9px; margin-right:3px;"></i>\${f.trim()}</span>\`).join('')}
                                </div>
                            \` : ''}`;

if (cmsCode.includes(oldUnivCardHighlight)) {
    cmsCode = cmsCode.replace(oldUnivCardHighlight, newUnivCardHighlight);
    console.log('✅ Injected facilities into University Cards in js/cms-content.js');
}

fs.writeFileSync(cmsPath, cmsCode, 'utf8');
console.log('✅ Successfully updated js/cms-content.js');
