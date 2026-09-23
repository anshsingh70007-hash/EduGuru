const fs = require('fs');

let code = fs.readFileSync('edit/js/edit.js', 'utf8');

// 1. Bulletproof cmsFetch with 8-second AbortController timeout
const oldCmsFetchStart = '    // Unified HTTP Method Override Fetch Client (Hostinger / Apache / LiteSpeed Compatible)\n    async function cmsFetch(url, options = {}) {';

const newCmsFetchCode = `    // Fetch with resilient 8-second AbortController timeout
    function fetchWithTimeout(fetchUrl, fetchOptions = {}, timeoutMs = 8000) {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), timeoutMs);
        return fetch(fetchUrl, { ...fetchOptions, signal: controller.signal })
            .finally(() => clearTimeout(timer));
    }

    // Unified HTTP Method Override Fetch Client (Hostinger / Apache / LiteSpeed Compatible)
    async function cmsFetch(url, options = {}) {
        const method = (options.method || 'GET').toUpperCase();
        const headers = Object.assign({}, options.headers || {});

        // Cache-buster for GET requests
        if (method === 'GET') {
            const sep = url.includes('?') ? '&' : '?';
            const bustUrl = \`\${url}\${sep}_t=\${Date.now()}\`;
            try {
                const res = await fetchWithTimeout(bustUrl, { ...options, headers, cache: 'no-cache' });
                if (res.ok) return res;
                // If 404/405/502/503 from Node API, try PHP fallback
                const phpUrl = buildPhpFallbackUrl(url, method);
                if (phpUrl) {
                    const phpRes = await fetchWithTimeout(\`\${phpUrl}&\${sep === '?' ? '' : '&'}_t=\${Date.now()}\`, { ...options, headers, cache: 'no-cache' });
                    if (phpRes.ok) return phpRes;
                }
                return res;
            } catch (err) {
                // If network failed or timed out, try PHP fallback
                const phpUrl = buildPhpFallbackUrl(url, method);
                if (phpUrl) {
                    try {
                        const phpRes = await fetchWithTimeout(\`\${phpUrl}&_t=\${Date.now()}\`, { ...options, headers, cache: 'no-cache' });
                        if (phpRes.ok) return phpRes;
                    } catch (e2) {}
                }
                throw err;
            }
        }

        // Shared hosting often blocks raw PUT and DELETE. Set method override header.
        if (method === 'PUT' || method === 'DELETE') {
            headers['X-HTTP-Method-Override'] = method;
        }

        try {
            let res = await fetchWithTimeout(url, { ...options, method, headers });
            if (res.ok) return res;

            // If server rejects method with 403 Forbidden, 404, or 405 Method Not Allowed, fallback to POST with override
            if (res.status === 403 || res.status === 405 || res.status === 404) {
                console.warn(\`[CMS] Direct \${method} returned \${res.status}. Falling back to PHP / POST override.\`);
                const fallbackHeaders = { ...headers, 'Content-Type': 'application/json', 'X-HTTP-Method-Override': method };

                let bodyObj = {};
                if (options.body) {
                    try {
                        bodyObj = typeof options.body === 'string' ? JSON.parse(options.body) : options.body;
                    } catch (e) {
                        bodyObj = {};
                    }
                }
                bodyObj._method = method;
                if (method === 'DELETE') bodyObj.action = 'delete';

                const phpUrl = buildPhpFallbackUrl(url, method);
                if (phpUrl) {
                    try {
                        const phpRes = await fetchWithTimeout(phpUrl, {
                            method: 'POST',
                            headers: fallbackHeaders,
                            body: JSON.stringify(bodyObj)
                        });
                        if (phpRes.ok) return phpRes;
                    } catch (e3) {}
                }

                const sep = url.includes('?') ? '&' : '?';
                const fallbackUrl = \`\${url}\${sep}_method=\${method}&action=\${method === 'DELETE' ? 'delete' : 'update'}\`;
                return await fetchWithTimeout(fallbackUrl, {
                    method: 'POST',
                    headers: fallbackHeaders,
                    body: JSON.stringify(bodyObj)
                });
            }
            return res;
        } catch (err) {
            console.warn(\`[CMS] \${method} fetch failed (\${err.message}). Retrying via PHP fallback / POST override:\`, err);
            const fallbackHeaders = { ...headers, 'Content-Type': 'application/json', 'X-HTTP-Method-Override': method };
            let bodyObj = {};
            if (options.body) {
                try { bodyObj = typeof options.body === 'string' ? JSON.parse(options.body) : options.body; } catch(e){}
            }
            bodyObj._method = method;
            if (method === 'DELETE') bodyObj.action = 'delete';

            const phpUrl = buildPhpFallbackUrl(url, method);
            if (phpUrl) {
                try {
                    const phpRes = await fetchWithTimeout(phpUrl, {
                        method: 'POST',
                        headers: fallbackHeaders,
                        body: JSON.stringify(bodyObj)
                    });
                    if (phpRes.ok) return phpRes;
                } catch (e4) {}
            }

            const sep = url.includes('?') ? '&' : '?';
            const fallbackUrl = \`\${url}\${sep}_method=\${method}&action=\${method === 'DELETE' ? 'delete' : 'update'}\`;
            return await fetchWithTimeout(fallbackUrl, {
                method: 'POST',
                headers: fallbackHeaders,
                body: JSON.stringify(bodyObj)
            });
        }
    }`;

// Replace cmsFetch
const cmsFetchRegex = /\s*\/\/ Unified HTTP Method Override Fetch Client[\s\S]*?return await fetch\(fallbackUrl, \{\s*method: 'POST',\s*headers: fallbackHeaders,\s*body: JSON\.stringify\(bodyObj\)\s*\}\);\s*\}\s*\}/;

if (cmsFetchRegex.test(code)) {
    code = code.replace(cmsFetchRegex, '\n' + newCmsFetchCode);
    console.log('Replaced cmsFetch successfully.');
} else {
    console.warn('cmsFetchRegex did not match.');
}

// 2. Replace handleCourseSubmit
const newHandleCourseSubmit = `    async function handleCourseSubmit(e) {
        e.preventDefault();
        const submitBtn = e.target.querySelector('button[type="submit"]');
        const origBtnHtml = submitBtn ? submitBtn.innerHTML : '<i class="fa fa-check"></i> Save &amp; Publish Course';

        try {
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<i class="fa fa-spinner fa-spin"></i> Saving...';
            }

            const name = (document.getElementById('courseNameInput')?.value || '').trim();
            if (!name) {
                alert('Please enter a course title');
                return;
            }

            const metaDescription = (document.getElementById('courseMetaDescInput')?.value || '').trim();
            const tags = Array.isArray(courseTagsList) ? [...courseTagsList] : [];
            const categories = Array.isArray(courseCategoriesList) ? [...courseCategoriesList] : [];
            const keywords = Array.isArray(courseKeywordsList) ? [...courseKeywordsList] : [];
            const faculty = categories[0] || (document.getElementById('courseFacultyInput')?.value || '').trim() || 'Faculty of Commerce & Management';
            const duration = (document.getElementById('courseDurationInput')?.value || '').trim() || '3 Years';
            const eligibility = (document.getElementById('courseEligibilityInput')?.value || '').trim() || 'Recognized qualification';
            const mode = (document.getElementById('courseModeInput')?.value || '').trim() || 'Online / Regular / Distance';
            const fee = (document.getElementById('courseFeeInput')?.value || '').trim() || 'Contact for fee schedule';
            const image = (document.getElementById('courseImageInput')?.value || '').trim() || 'images/courses/1.jpg';
            const galleryImages = typeof getGalleryImagesFromDOM === 'function' ? getGalleryImagesFromDOM('course') : [];
            const specializations = (document.getElementById('courseSpecializationsInput')?.value || '').trim();
            const courseVisual = document.getElementById('courseVisualEditor');
            const overviewContent = courseVisual ? courseVisual.innerHTML.trim() : ((document.getElementById('courseDescriptionInput')?.value || '').trim());
            if (document.getElementById('courseDescriptionInput')) {
                document.getElementById('courseDescriptionInput').value = overviewContent;
            }
            const curriculumRaw = (document.getElementById('courseCurriculumInput')?.value || '').trim();
            const curriculum = curriculumRaw ? curriculumRaw.split('\\n').map(s => s.trim()).filter(Boolean) : [];

            const payload = {
                name,
                faculty,
                duration,
                eligibility,
                mode,
                fee,
                image,
                galleryImages,
                specializations,
                description: overviewContent || \`\${name} is an approved program offering comprehensive training and career prospects across partner universities.\`,
                overviewContent: overviewContent || \`\${name} is an approved program offering comprehensive training and career prospects across partner universities.\`,
                metaDescription: metaDescription,
                tags,
                categories,
                keywords,
                curriculum: curriculum.length > 0 ? curriculum : ["Foundation & Overview Modules", "Core Subject Competencies", "Practical Training & Projects", "Industry Readiness"]
            };

            let savedToServer = false;

            if (editingCourseId) {
                try {
                    const res = await cmsFetch(\`\${API_BASE}/api/content/courses/\${editingCourseId}\`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload)
                    });
                    if (res && res.ok) {
                        const data = await res.json();
                        const idx = courses.findIndex(c => String(c.id) === String(editingCourseId));
                        if (idx !== -1) courses[idx] = normalizeCourse(data.course || { ...courses[idx], ...payload });
                        savedToServer = true;
                    }
                } catch (e) {
                    console.warn('[CMS] Server course PUT failed:', e);
                }
                if (!savedToServer) {
                    const idx = courses.findIndex(c => String(c.id) === String(editingCourseId));
                    if (idx !== -1) courses[idx] = normalizeCourse({ ...courses[idx], ...payload });
                }
                showToast(savedToServer ? 'Course updated and saved to server!' : 'Course updated locally (Server offline warning)', savedToServer ? 'success' : 'info');
            } else {
                try {
                    const res = await cmsFetch(\`\${API_BASE}/api/content/courses\`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload)
                    });
                    if (res && res.ok) {
                        const data = await res.json();
                        if (data.course) {
                            courses.unshift(normalizeCourse(data.course));
                            savedToServer = true;
                        }
                    }
                } catch (e) {
                    console.warn('[CMS] Server course POST failed:', e);
                }
                if (!savedToServer) {
                    const newId = courses.length > 0 ? Math.max(...courses.map(c => Number(c.id) || 0)) + 1 : 1;
                    courses.unshift(normalizeCourse({ ...payload, id: newId }));
                }
                showToast(savedToServer ? 'New course created and saved to server!' : 'New course created locally (Server offline warning)', savedToServer ? 'success' : 'info');
            }

            syncToStorage();
            window.closeCourseModal();
            renderAll();
        } catch (err) {
            console.error('[CMS] handleCourseSubmit error:', err);
            showToast('Failed to save course: ' + (err.message || 'Unknown error'), 'error');
        } finally {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = origBtnHtml;
            }
        }
    }`;

const courseSubmitRegex = /\s*async function handleCourseSubmit\(e\)[\s\S]*?renderAll\(\);\s*\}/;
if (courseSubmitRegex.test(code)) {
    code = code.replace(courseSubmitRegex, '\n' + newHandleCourseSubmit);
    console.log('Replaced handleCourseSubmit successfully.');
} else {
    console.warn('courseSubmitRegex did not match.');
}

// 3. Replace handleCollegeSubmit
const newHandleCollegeSubmit = `    async function handleCollegeSubmit(e) {
        e.preventDefault();
        const submitBtn = e.target.querySelector('button[type="submit"]');
        const origBtnHtml = submitBtn ? submitBtn.innerHTML : '<i class="fa fa-check"></i> Save &amp; Publish College';

        try {
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<i class="fa fa-spinner fa-spin"></i> Saving...';
            }

            const name = (document.getElementById('collegeNameInput')?.value || '').trim();
            if (!name) {
                alert('Please enter a college name');
                return;
            }

            const metaDescription = (document.getElementById('collegeMetaDescInput')?.value || '').trim();
            const tags = Array.isArray(collegeTagsList) ? [...collegeTagsList] : [];
            const keywords = Array.isArray(collegeKeywordsList) ? [...collegeKeywordsList] : [];
            const facilities = Array.isArray(collegeFacilitiesList) ? [...collegeFacilitiesList] : [];

            const catRaw = (document.getElementById('collegeCategoryInput')?.value || 'General').trim();
            const categories = catRaw.split(',').map(s => s.trim()).filter(Boolean);
            const category = categories[0] || 'General';

            const affiliation = (document.getElementById('collegeAffiliationInput')?.value || '').trim();
            const location = (document.getElementById('collegeLocationInput')?.value || 'New Delhi, India').trim();
            const established = (document.getElementById('collegeEstablishedInput')?.value || '2010').trim();
            const accreditationRaw = (document.getElementById('collegeAccreditationInput')?.value || '').trim();
            const accreditation = accreditationRaw ? accreditationRaw.split(',').map(s => s.trim()).filter(Boolean) : ['UGC', 'AICTE'];
            const fee = (document.getElementById('collegeFeeInput')?.value || 'Contact for fee schedule').trim();
            const image = (document.getElementById('collegeImageInput')?.value || 'images/courses/1.jpg').trim();
            const rating = parseFloat(document.getElementById('collegeRatingInput')?.value) || 4.8;
            const courses = (typeof collegeCoursesList !== 'undefined' && collegeCoursesList.length > 0) ? collegeCoursesList : ['Degree Programs'];
            const description = (document.getElementById('collegeDescriptionInput')?.value || '').trim();
            const featured = Boolean(document.getElementById('collegeFeaturedInput')?.checked);

            const payload = {
                name,
                metaDescription,
                tags,
                keywords,
                facilities,
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
            };

            let savedToServer = false;

            if (editingCollegeId) {
                try {
                    const res = await cmsFetch(\`\${API_BASE}/api/content/colleges/\${editingCollegeId}\`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload)
                    });
                    if (res && res.ok) {
                        const data = await res.json();
                        const idx = colleges.findIndex(c => String(c.id) === String(editingCollegeId));
                        if (idx !== -1) colleges[idx] = normalizeCollege(data.college || { ...colleges[idx], ...payload });
                        savedToServer = true;
                    }
                } catch (e) {
                    console.warn('[CMS] Server college PUT failed, saving locally:', e);
                }
                if (!savedToServer) {
                    const idx = colleges.findIndex(c => String(c.id) === String(editingCollegeId));
                    if (idx !== -1) colleges[idx] = normalizeCollege({ ...colleges[idx], ...payload });
                }
                showToast(savedToServer ? 'College updated and saved to server!' : 'College updated (saved locally in browser)', 'success');
            } else {
                try {
                    const res = await cmsFetch(\`\${API_BASE}/api/content/colleges\`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload)
                    });
                    if (res && res.ok) {
                        const data = await res.json();
                        if (data.college) {
                            colleges.unshift(normalizeCollege(data.college));
                            savedToServer = true;
                        }
                    }
                } catch (e) {
                    console.warn('[CMS] Server college POST failed, saving locally:', e);
                }
                if (!savedToServer) {
                    const newId = \`college-\${Date.now()}\`;
                    colleges.unshift(normalizeCollege({ ...payload, id: newId }));
                }
                showToast(savedToServer ? 'New college added and saved to server!' : 'New college added (saved locally in browser)', 'success');
            }

            syncToStorage();
            window.closeCollegeModal();
            renderAll();
        } catch (err) {
            console.error('[CMS] handleCollegeSubmit error:', err);
            showToast('Failed to save college: ' + (err.message || 'Unknown error'), 'error');
        } finally {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = origBtnHtml;
            }
        }
    }`;

const collegeSubmitRegex = /\s*async function handleCollegeSubmit\(e\)[\s\S]*?renderAll\(\);\s*\}/;
if (collegeSubmitRegex.test(code)) {
    code = code.replace(collegeSubmitRegex, '\n' + newHandleCollegeSubmit);
    console.log('Replaced handleCollegeSubmit successfully.');
} else {
    console.warn('collegeSubmitRegex did not match.');
}

// 4. Replace handleUnivSubmit
const newHandleUnivSubmit = `    async function handleUnivSubmit(e) {
        e.preventDefault();
        const submitBtn = e.target.querySelector('button[type="submit"]');
        const origBtnHtml = submitBtn ? submitBtn.innerHTML : '<i class="fa fa-check"></i> Save &amp; Publish University';

        try {
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<i class="fa fa-spinner fa-spin"></i> Saving...';
            }

            const name = (document.getElementById('univNameInput')?.value || '').trim();
            if (!name) {
                alert('Please enter a university name');
                return;
            }

            const metaDescription = (document.getElementById('univMetaDescInput')?.value || '').trim();
            const tags = Array.isArray(univTagsList) ? [...univTagsList] : [];
            const keywords = Array.isArray(univKeywordsList) ? [...univKeywordsList] : [];
            const facilities = Array.isArray(univFacilitiesList) ? [...univFacilitiesList] : [];

            const type = (document.getElementById('univTypeInput')?.value || 'State Private University').trim();
            const approvalsRaw = (document.getElementById('univApprovalsInput')?.value || '').trim();
            const approvals = approvalsRaw ? approvalsRaw.split(',').map(s => s.trim()).filter(Boolean) : ['UGC Recognized'];
            const location = (document.getElementById('univLocationInput')?.value || 'India').trim();
            const established = (document.getElementById('univEstablishedInput')?.value || '2018').trim();
            const naac = (document.getElementById('univNaacInput')?.value || 'NAAC A Grade').trim();
            const modesRaw = (document.getElementById('univModesInput')?.value || '').trim();
            const modes = modesRaw ? modesRaw.split(',').map(s => s.trim()).filter(Boolean) : ['Online / Distance'];
            const fee = (document.getElementById('univFeeInput')?.value || 'Affordable Semester Installments').trim();
            const image = (document.getElementById('univImageInput')?.value || 'images/slider/home1/slide1.jpg').trim();

            const streamsRaw = (document.getElementById('univStreamsInput')?.value || '').trim();
            const streams = streamsRaw ? streamsRaw.split(',').map(s => s.trim()).filter(Boolean) : ['Management', 'Computer Applications'];
            const highlights = (document.getElementById('univHighlightsInput')?.value || 'Valid for all Govt Jobs, AIU Equivalence').trim();
            const courses = (typeof univCoursesList !== 'undefined' && univCoursesList.length > 0) ? univCoursesList : ['MBA (Online/Distance)', 'MCA', 'BBA', 'BCA'];
            const description = (document.getElementById('univDescriptionInput')?.value || '').trim();
            const featured = Boolean(document.getElementById('univFeaturedInput')?.checked);

            const payload = {
                name,
                metaDescription,
                tags,
                keywords,
                facilities,
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
            };

            let savedToServer = false;

            if (editingUnivId) {
                try {
                    const res = await cmsFetch(\`\${API_BASE}/api/content/universities/\${editingUnivId}\`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload)
                    });
                    if (res && res.ok) {
                        const data = await res.json();
                        const idx = universities.findIndex(u => String(u.id) === String(editingUnivId));
                        if (idx !== -1) universities[idx] = normalizeUniversity(data.university || { ...universities[idx], ...payload });
                        savedToServer = true;
                    }
                } catch (e) {
                    console.warn('[CMS] Server university PUT failed, saving locally:', e);
                }
                if (!savedToServer) {
                    const idx = universities.findIndex(u => String(u.id) === String(editingUnivId));
                    if (idx !== -1) universities[idx] = normalizeUniversity({ ...universities[idx], ...payload });
                }
                showToast(savedToServer ? 'University updated and saved to server!' : 'University updated (saved locally in browser)', 'success');
            } else {
                try {
                    const res = await cmsFetch(\`\${API_BASE}/api/content/universities\`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload)
                    });
                    if (res && res.ok) {
                        const data = await res.json();
                        if (data.university) {
                            universities.unshift(normalizeUniversity(data.university));
                            savedToServer = true;
                        }
                    }
                } catch (e) {
                    console.warn('[CMS] Server university POST failed, saving locally:', e);
                }
                if (!savedToServer) {
                    const newId = \`univ-\${Date.now()}\`;
                    universities.unshift(normalizeUniversity({ ...payload, id: newId }));
                }
                showToast(savedToServer ? 'New university added and saved to server!' : 'New university added (saved locally in browser)', 'success');
            }

            syncToStorage();
            window.closeUnivModal();
            renderAll();
        } catch (err) {
            console.error('[CMS] handleUnivSubmit error:', err);
            showToast('Failed to save university: ' + (err.message || 'Unknown error'), 'error');
        } finally {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = origBtnHtml;
            }
        }
    }`;

const univSubmitRegex = /\s*async function handleUnivSubmit\(e\)[\s\S]*?renderAll\(\);\s*\}/;
if (univSubmitRegex.test(code)) {
    code = code.replace(univSubmitRegex, '\n' + newHandleUnivSubmit);
    console.log('Replaced handleUnivSubmit successfully.');
} else {
    console.warn('univSubmitRegex did not match.');
}

// 5. Replace handleBlogSubmit
const newHandleBlogSubmit = `    async function handleBlogSubmit(e) {
        e.preventDefault();
        const submitBtn = e.target.querySelector('button[type="submit"]');
        const origBtnHtml = submitBtn ? submitBtn.innerHTML : '<i class="fa fa-check"></i> Save &amp; Publish Post';

        try {
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<i class="fa fa-spinner fa-spin"></i> Saving...';
            }

            const title = (document.getElementById('blogTitleInput')?.value || '').trim();
            if (!title) {
                alert('Please enter a blog title');
                return;
            }

            const category = (document.getElementById('blogCategoryInput')?.value || 'Education').trim();
            const author = (document.getElementById('blogAuthorInput')?.value || 'Educationist Expert').trim();
            const date = (document.getElementById('blogDateInput')?.value || new Date().toISOString().split('T')[0]).trim();
            const image = (document.getElementById('blogImageInput')?.value || 'images/blog/1.jpg').trim();
            const excerpt = (document.getElementById('blogExcerptInput')?.value || '').trim();
            
            // Support Visual WYSIWYG editor canvas
            const visualEditor = document.getElementById('blogVisualEditor') || document.getElementById('blogVisualEditorCanvas');
            const content = visualEditor ? visualEditor.innerHTML.trim() : ((document.getElementById('blogContentInput')?.value || '').trim());
            if (document.getElementById('blogContentInput')) {
                document.getElementById('blogContentInput').value = content;
            }

            const metaDescription = (document.getElementById('blogMetaDescInput')?.value || '').trim();
            const isFeatured = Boolean(document.getElementById('blogFeaturedInput')?.checked);

            const payload = {
                title,
                metaDescription,
                tags: Array.isArray(blogTagsList) ? [...blogTagsList] : [],
                categories: (blogCategoriesList && blogCategoriesList.length > 0) ? [...blogCategoriesList] : [category],
                keywords: Array.isArray(blogKeywordsList) ? [...blogKeywordsList] : [],
                category,
                author,
                date,
                image,
                featured: isFeatured,
                isFeatured: isFeatured,
                excerpt: excerpt || metaDescription || title,
                content: content || \`<p>\${title} is an insightful overview provided by EducationistGuru for academic guidance.</p>\`
            };

            let savedToServer = false;

            if (editingBlogId) {
                try {
                    const res = await cmsFetch(\`\${API_BASE}/api/content/blogs/\${editingBlogId}\`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload)
                    });
                    if (res && res.ok) {
                        const data = await res.json();
                        const idx = blogs.findIndex(b => String(b.id) === String(editingBlogId));
                        if (idx !== -1) blogs[idx] = normalizeBlog(data.blog || { ...blogs[idx], ...payload });
                        savedToServer = true;
                    }
                } catch (e) {
                    console.warn('[CMS] Server blog PUT failed:', e);
                }
                if (!savedToServer) {
                    const idx = blogs.findIndex(b => String(b.id) === String(editingBlogId));
                    if (idx !== -1) blogs[idx] = normalizeBlog({ ...blogs[idx], ...payload });
                }
                showToast(savedToServer ? 'Blog post updated and saved to server!' : 'Blog post updated locally (Server offline warning)', savedToServer ? 'success' : 'info');
            } else {
                try {
                    const res = await cmsFetch(\`\${API_BASE}/api/content/blogs\`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload)
                    });
                    if (res && res.ok) {
                        const data = await res.json();
                        if (data.blog) {
                            blogs.unshift(normalizeBlog(data.blog));
                            savedToServer = true;
                        }
                    }
                } catch (e) {
                    console.warn('[CMS] Server blog POST failed:', e);
                }
                if (!savedToServer) {
                    const newId = blogs.length > 0 ? Math.max(...blogs.map(b => Number(b.id) || 0)) + 1 : 1;
                    blogs.unshift(normalizeBlog({ ...payload, id: newId, isInitial: false }));
                }
                showToast(savedToServer ? 'New blog post published and saved to server!' : 'New blog post published locally (Server offline warning)', savedToServer ? 'success' : 'info');
            }

            syncToStorage();
            window.closeBlogModal();
            renderAll();
        } catch (err) {
            console.error('[CMS] handleBlogSubmit error:', err);
            showToast('Failed to save blog post: ' + (err.message || 'Unknown error'), 'error');
        } finally {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = origBtnHtml;
            }
        }
    }`;

const blogSubmitRegex = /\s*async function handleBlogSubmit\(e\)[\s\S]*?renderAll\(\);\s*\}/;
if (blogSubmitRegex.test(code)) {
    code = code.replace(blogSubmitRegex, '\n' + newHandleBlogSubmit);
    console.log('Replaced handleBlogSubmit successfully.');
} else {
    console.warn('blogSubmitRegex did not match.');
}

// 6. Replace handleVideoSubmit
const newHandleVideoSubmit = `    async function handleVideoSubmit(e) {
        e.preventDefault();
        const submitBtn = e.target.querySelector('button[type="submit"]');
        const origBtnHtml = submitBtn ? submitBtn.innerHTML : '<i class="fa fa-check"></i> Add Video to Channel';

        try {
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<i class="fa fa-spinner fa-spin"></i> Saving...';
            }

            const urlOrId = (document.getElementById('videoUrlInput')?.value || '').trim();
            const youtubeId = extractYouTubeId(urlOrId);
            const title = (document.getElementById('videoTitleInput')?.value || '').trim();

            if (!urlOrId || !youtubeId) {
                alert('Please enter a valid YouTube URL or 11-character Video ID');
                return;
            }
            if (!title) {
                alert('Please enter a video title');
                return;
            }

            const category = (document.getElementById('videoCategoryInput')?.value || 'Admissions 2025').trim();
            const duration = (document.getElementById('videoDurationInput')?.value || '5:00').trim();
            const thumbnail = (document.getElementById('videoThumbnailInput')?.value || \`https://img.youtube.com/vi/\${youtubeId}/hqdefault.jpg\`).trim();
            const description = (document.getElementById('videoDescInput')?.value || '').trim();
            const isFeatured = Boolean(document.getElementById('videoFeaturedInput')?.checked);

            const payload = {
                youtubeId,
                title,
                category,
                duration,
                thumbnail,
                description,
                featured: isFeatured,
                isFeatured: isFeatured,
                publishedDate: new Date().toISOString()
            };

            let savedToServer = false;

            if (editingVideoId) {
                try {
                    const res = await cmsFetch(\`\${API_BASE}/api/youtube/videos/\${editingVideoId}\`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload)
                    });
                    if (res && res.ok) {
                        const data = await res.json();
                        const idx = videos.findIndex(v => String(v.id) === String(editingVideoId));
                        if (idx !== -1) videos[idx] = normalizeVideo(data.video || { ...videos[idx], ...payload });
                        savedToServer = true;
                    }
                } catch (e) {
                    console.warn('[CMS] Server video PUT failed:', e);
                }
                if (!savedToServer) {
                    const idx = videos.findIndex(v => String(v.id) === String(editingVideoId));
                    if (idx !== -1) videos[idx] = normalizeVideo({ ...videos[idx], ...payload });
                }
                showToast(savedToServer ? 'Video updated and saved to server!' : 'Video updated locally (Server offline warning)', savedToServer ? 'success' : 'info');
            } else {
                try {
                    const res = await cmsFetch(\`\${API_BASE}/api/youtube/videos\`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload)
                    });
                    if (res && res.ok) {
                        const data = await res.json();
                        if (data.video) {
                            videos.unshift(normalizeVideo(data.video));
                            savedToServer = true;
                        }
                    }
                } catch (e) {
                    console.warn('[CMS] Server video POST failed:', e);
                }
                if (!savedToServer) {
                    const newId = videos.length > 0 ? Math.max(...videos.map(v => Number(v.id) || 0)) + 1 : 1;
                    videos.unshift(normalizeVideo({ ...payload, id: newId }));
                }
                showToast(savedToServer ? 'New video added to channel and saved to server!' : 'New video added locally (Server offline warning)', savedToServer ? 'success' : 'info');
            }

            syncToStorage();
            window.closeVideoModal();
            renderAll();
        } catch (err) {
            console.error('[CMS] handleVideoSubmit error:', err);
            showToast('Failed to save video: ' + (err.message || 'Unknown error'), 'error');
        } finally {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = origBtnHtml;
            }
        }
    }`;

const videoSubmitRegex = /\s*async function handleVideoSubmit\(e\)[\s\S]*?renderAll\(\);\s*\}/;
if (videoSubmitRegex.test(code)) {
    code = code.replace(videoSubmitRegex, '\n' + newHandleVideoSubmit);
    console.log('Replaced handleVideoSubmit successfully.');
} else {
    console.warn('videoSubmitRegex did not match.');
}

// 7. Replace executeDelete
const newExecuteDelete = `    window.executeDelete = async function() {
        if (!pendingDelete || !pendingDelete.type || pendingDelete.id === undefined) {
            window.closeDeleteModal();
            return;
        }

        const { type, id } = pendingDelete;
        const btn = document.getElementById('confirmDeleteBtn');
        const origHtml = btn ? btn.innerHTML : '<i class="fa fa-trash"></i> Delete';

        try {
            if (btn) {
                btn.disabled = true;
                btn.innerHTML = '<i class="fa fa-spinner fa-spin"></i> Deleting...';
            }

            let serverDeleted = false;

            try {
                let endpoint = '';
                if (type === 'course') endpoint = \`\${API_BASE}/api/content/courses/\${id}\`;
                else if (type === 'college') endpoint = \`\${API_BASE}/api/content/colleges/\${id}\`;
                else if (type === 'university') endpoint = \`\${API_BASE}/api/content/universities/\${id}\`;
                else if (type === 'blog') endpoint = \`\${API_BASE}/api/content/blogs/\${id}\`;
                else if (type === 'video') endpoint = \`\${API_BASE}/api/youtube/videos/\${id}\`;

                if (endpoint) {
                    const res = await cmsFetch(endpoint, { method: 'DELETE' });
                    if (res && res.ok) serverDeleted = true;
                }
            } catch (e) {
                console.warn(\`[CMS] Server delete failed for \${type}:\`, e);
            }

            if (type === 'course') {
                courses = courses.filter(c => String(c.id) !== String(id));
                showToast(serverDeleted ? 'Course removed from server and website.' : 'Course removed locally.', 'success');
            } else if (type === 'college') {
                colleges = colleges.filter(c => String(c.id) !== String(id));
                showToast(serverDeleted ? 'College removed from server and website.' : 'College removed locally.', 'success');
            } else if (type === 'university') {
                universities = universities.filter(u => String(u.id) !== String(id));
                showToast(serverDeleted ? 'University removed from server and website.' : 'University removed locally.', 'success');
            } else if (type === 'blog') {
                blogs = blogs.filter(b => String(b.id) !== String(id));
                showToast(serverDeleted ? 'Blog post removed from server and website.' : 'Blog post removed locally.', 'success');
            } else if (type === 'video') {
                videos = videos.filter(v => String(v.id) !== String(id));
                showToast(serverDeleted ? 'Video removed from channel list.' : 'Video removed locally.', 'success');
            }

            syncToStorage();
            renderAll();
        } catch (err) {
            console.error('[CMS] executeDelete error:', err);
            showToast('Delete error: ' + (err.message || 'Unknown error'), 'error');
        } finally {
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = origHtml;
            }
            window.closeDeleteModal();
        }
    };`;

const executeDeleteRegex = /\s*window\.executeDelete = async function\(\)[\s\S]*?window\.closeDeleteModal\(\);\s*\};/;
if (executeDeleteRegex.test(code)) {
    code = code.replace(executeDeleteRegex, '\n' + newExecuteDelete);
    console.log('Replaced executeDelete successfully.');
} else {
    console.warn('executeDeleteRegex did not match.');
}

fs.writeFileSync('edit/js/edit.js', code, 'utf8');
console.log('Saved edit/js/edit.js successfully.');
