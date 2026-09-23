/* =========================================================
   EducationistGuru Content Management System (/edit)
   JavaScript Controller - Full 5-Entity CRUD Suite:
   1. Courses & Academic Programs
   2. Colleges Directory
   3. Partner Universities
   4. Blog Articles & Posts
   5. YouTube Channel Videos
   + Real-Time Telemetry & Public Page Sync
   ========================================================= */

(function() {
    'use strict';

    // Central Application State
    let courses = [];
    let colleges = [];
    let universities = [];
    let blogs = [];
    let videos = [];
    let siteMenu = {
        announcement: { enabled: true, text: '', phone: '', email: '', ctaText: 'Apply Now', ctaLink: 'contact.html' },
        navItems: [],
        config: { autoSyncCourses: true, autoSyncUniversities: true }
    };

    let currentTab = 'courses';
    let editingCourseId = null;
    let editingCollegeId = null;
    let editingUnivId = null;
    let editingBlogId = null;
    let editingVideoId = null;
    let pendingDelete = null; // { type, id, title }

    // Detect API Base URL dynamically
    function getApiBase() {
        if (window.location.protocol === 'file:' || 
            (window.location.hostname === 'localhost' && window.location.port !== '3000') ||
            (window.location.hostname === '127.0.0.1' && window.location.port !== '3000')) {
            return 'http://localhost:3000';
        }
        return '';
    }
    const API_BASE = getApiBase();

    // Dynamically resolve relative paths & clean extensionless page links
    function getRelativePath(target) {
        if (target.endsWith('.html')) {
            let clean = target.replace(/\.html$/, '');
            if (clean === 'index') return '/';
            return '/' + clean;
        }
        const path = window.location.pathname.toLowerCase();
        const isInEditFolder = path.includes('/edit/') || path.endsWith('/edit');
        return isInEditFolder ? `../${target}` : `./${target}`;
    }

    let isServerOnline = false;
    function updateServerStatusUI(online) {
        isServerOnline = online;
        let badge = document.getElementById('serverStatusBadge');
        if (!badge) {
            const targetContainer = document.querySelector('.header-actions') || document.querySelector('.topbar-actions');
            if (targetContainer) {
                badge = document.createElement('div');
                badge.id = 'serverStatusBadge';
                targetContainer.insertBefore(badge, targetContainer.firstChild);
            }
        }
        if (badge) {
            badge.className = `server-status-pill ${online ? 'online' : 'offline'}`;
            badge.innerHTML = online 
                ? `<span class="server-status-dot"></span> Server Connected` 
                : `<span class="server-status-dot"></span> Local Storage Mode`;
            badge.title = online 
                ? 'Connected to Node.js backend at http://localhost:3000. Changes are saved to JSON files on disk.' 
                : 'Server offline. Changes are saved to browser local storage. Run `node server.js` to persist to disk.';
        }
    }

    // Defensive HTML Escaper for XSS Prevention
    function escapeHtml(str) {
        if (str === null || str === undefined) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    // Slugify helper for SEO-friendly URLs
    function slugify(text) {
        if (!text) return '';
        return String(text)
            .toLowerCase()
            .trim()
            .replace(/&/g, 'and')
            .replace(/[\(\)\/,\.]+/g, ' ')
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/[\s-]+/g, '-')
            .replace(/^-+|-+$/g, '');
    }

    // Resolves /api/content/* and /api/crm/* to native Hostinger /api.php endpoints
    function buildPhpFallbackUrl(originalUrl, method) {
        try {
            const cleanUrl = originalUrl.replace(/^https?:\/\/[^\/]+/, '');
            const match = cleanUrl.match(/\/api\/(.+)$/);
            if (match) {
                const endpointPart = match[1];
                const [endpoint, existingQuery] = endpointPart.split('?');
                let phpUrl = `/api.php?endpoint=${endpoint}`;
                if (existingQuery) phpUrl += `&${existingQuery}`;
                if (method === 'PUT') phpUrl += '&_method=PUT&action=update';
                if (method === 'DELETE') phpUrl += '&_method=DELETE&action=delete';
                return phpUrl;
            }
        } catch (e) {
            console.warn('[CMS] buildPhpFallbackUrl error:', e);
        }
        return null;
    }
    // Fetch with resilient 8-second AbortController timeout
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
            const bustUrl = `${url}${sep}_t=${Date.now()}`;
            try {
                const res = await fetchWithTimeout(bustUrl, { ...options, headers, cache: 'no-cache' });
                if (res.ok) return res;
                // If 404/405/502/503 from Node API, try PHP fallback
                const phpUrl = buildPhpFallbackUrl(url, method);
                if (phpUrl) {
                    const phpRes = await fetchWithTimeout(`${phpUrl}&${sep === '?' ? '' : '&'}_t=${Date.now()}`, { ...options, headers, cache: 'no-cache' });
                    if (phpRes.ok) return phpRes;
                }
                return res;
            } catch (err) {
                // If network failed or timed out, try PHP fallback
                const phpUrl = buildPhpFallbackUrl(url, method);
                if (phpUrl) {
                    try {
                        const phpRes = await fetchWithTimeout(`${phpUrl}&_t=${Date.now()}`, { ...options, headers, cache: 'no-cache' });
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
                console.warn(`[CMS] Direct ${method} returned ${res.status}. Falling back to PHP / POST override.`);
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
                const fallbackUrl = `${url}${sep}_method=${method}&action=${method === 'DELETE' ? 'delete' : 'update'}`;
                return await fetchWithTimeout(fallbackUrl, {
                    method: 'POST',
                    headers: fallbackHeaders,
                    body: JSON.stringify(bodyObj)
                });
            }
            return res;
        } catch (err) {
            console.warn(`[CMS] ${method} fetch failed (${err.message}). Retrying via PHP fallback / POST override:`, err);
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
            const fallbackUrl = `${url}${sep}_method=${method}&action=${method === 'DELETE' ? 'delete' : 'update'}`;
            return await fetchWithTimeout(fallbackUrl, {
                method: 'POST',
                headers: fallbackHeaders,
                body: JSON.stringify(bodyObj)
            });
        }
    }

    // Canonical Entity Normalizers (Consultation Guidance from GPT-5.6 Luna)
    function normalizeCourse(raw = {}) {
        const id = raw.id !== undefined ? raw.id : Date.now();
        const name = String(raw.name || '').trim();
        let tags = [];
        if (Array.isArray(raw.tags)) tags = raw.tags.map(t => String(t).trim()).filter(Boolean);
        else if (raw.tags) tags = String(raw.tags).split(',').map(t => t.trim()).filter(Boolean);

        let categories = [];
        if (Array.isArray(raw.categories)) categories = raw.categories.map(c => String(c).trim()).filter(Boolean);
        else if (raw.categories) categories = String(raw.categories).split(',').map(c => c.trim()).filter(Boolean);
        else if (raw.faculty) categories = [String(raw.faculty).trim()];

        let keywords = [];
        if (Array.isArray(raw.keywords)) keywords = raw.keywords.map(k => String(k).trim()).filter(Boolean);
        else if (raw.keywords) keywords = String(raw.keywords).split(',').map(k => k.trim()).filter(Boolean);

        let galleryImages = [];
        if (Array.isArray(raw.galleryImages)) galleryImages = raw.galleryImages.map(g => String(g).trim()).filter(Boolean);
        else if (raw.galleryImages) galleryImages = [String(raw.galleryImages).trim()];

        const overviewContent = String(raw.overviewContent || raw.description || '').trim();

        return {
            id: id,
            slug: raw.slug || slugify(name) || `course-${id}`,
            name: name,
            faculty: String(raw.faculty || 'General').trim(),
            duration: String(raw.duration || '3 Years').trim(),
            eligibility: String(raw.eligibility || 'Recognized qualification').trim(),
            mode: String(raw.mode || 'Online / Regular / Distance').trim(),
            fee: String(raw.fee || 'Contact for fee schedule').trim(),
            image: raw.image || 'images/courses/1.jpg',
            metaDescription: String(raw.metaDescription || '').trim(),
            tags: tags,
            categories: categories,
            keywords: keywords,
            galleryImages: galleryImages,
            overviewContent: overviewContent,
            specializations: String(raw.specializations || '').trim(),
            description: overviewContent || String(raw.description || '').trim(),
            curriculum: Array.isArray(raw.curriculum) ? raw.curriculum : ["Foundation Modules", "Core Subject Competencies", "Practical Training", "Industry Readiness"],
            isInitial: raw.isInitial !== undefined ? raw.isInitial : false,
            dateAdded: raw.dateAdded || new Date().toISOString()
        };
    }

    function normalizeCollege(raw = {}) {
        const id = raw.id !== undefined ? raw.id : `college-${Date.now()}`;
        const name = String(raw.name || '').trim();

        let categories = [];
        if (Array.isArray(raw.categories) && raw.categories.length > 0) {
            categories = raw.categories.map(c => String(c).trim()).filter(Boolean);
        } else if (raw.category) {
            categories = String(raw.category).split(',').map(s => s.trim()).filter(Boolean);
        }
        if (categories.length === 0) categories = ['General'];
        const primaryCategory = categories.join(', ');

        let courses = [];
        if (Array.isArray(raw.courses)) {
            courses = raw.courses.map(c => String(c).trim()).filter(Boolean);
        } else if (raw.courses) {
            courses = String(raw.courses).split(',').map(s => s.trim()).filter(Boolean);
        }
        if (courses.length === 0) courses = ['Degree Programs'];

        return {
            id: id,
            slug: raw.slug || slugify(name) || `college-${id}`,
            name: name,
            category: primaryCategory,
            categories: categories,
            affiliation: String(raw.affiliation || '').trim(),
            location: String(raw.location || 'New Delhi, India').trim(),
            established: String(raw.established || '2010').trim(),
            accreditation: Array.isArray(raw.accreditation) ? raw.accreditation : (raw.accreditation ? String(raw.accreditation).split(',').map(s => s.trim()).filter(Boolean) : ['UGC', 'AICTE']),
            fee: String(raw.fee || '₹50,000 - ₹90,000 / year').trim(),
            image: raw.image || 'images/courses/1.jpg',
            rating: Number(raw.rating) || 4.8,
            courses: courses,
            description: String(raw.description || '').trim(),
            featured: Boolean(raw.featured || raw.isFeatured),
            isFeatured: Boolean(raw.featured || raw.isFeatured),
            status: raw.status || 'published',
            dateAdded: raw.dateAdded || new Date().toISOString()
        };
    }

    function normalizeUniversity(raw = {}) {
        const id = raw.id !== undefined ? raw.id : `univ-${Date.now()}`;
        const name = String(raw.name || '').trim();

        let streams = [];
        if (Array.isArray(raw.streams) && raw.streams.length > 0) {
            streams = raw.streams.map(s => String(s).trim()).filter(Boolean);
        } else if (raw.popularStreams) {
            streams = String(raw.popularStreams).split(',').map(s => s.trim()).filter(Boolean);
        } else if (raw.streams) {
            streams = String(raw.streams).split(',').map(s => s.trim()).filter(Boolean);
        }
        if (streams.length === 0) streams = ['Management', 'Science', 'Arts'];

        let courses = [];
        if (Array.isArray(raw.courses)) {
            courses = raw.courses.map(c => String(c).trim()).filter(Boolean);
        } else if (raw.courses) {
            courses = String(raw.courses).split(',').map(s => s.trim()).filter(Boolean);
        }

        return {
            id: id,
            slug: raw.slug || slugify(name) || `univ-${id}`,
            name: name,
            type: String(raw.type || 'State Private University').trim(),
            approvals: Array.isArray(raw.approvals) ? raw.approvals : (raw.approvals ? String(raw.approvals).split(',').map(s => s.trim()).filter(Boolean) : ['UGC', 'AIU']),
            location: String(raw.location || 'India').trim(),
            established: String(raw.established || '2015').trim(),
            naac: String(raw.naac || 'NAAC A Grade').trim(),
            modes: Array.isArray(raw.modes) ? raw.modes : (raw.modes ? String(raw.modes).split(',').map(s => s.trim()).filter(Boolean) : ['Online', 'Distance']),
            fee: String(raw.fee || 'Flexible Semester Installments').trim(),
            image: raw.image || 'images/slider/home1/slide1.jpg',
            streams: streams,
            popularStreams: streams.join(', '),
            courses: courses,
            highlights: String(raw.highlights || 'Valid for all Govt & Private Jobs').trim(),
            description: String(raw.description || '').trim(),
            featured: Boolean(raw.featured || raw.isFeatured),
            isFeatured: Boolean(raw.featured || raw.isFeatured),
            status: raw.status || 'published',
            dateAdded: raw.dateAdded || new Date().toISOString()
        };
    }

    function normalizeBlog(raw = {}) {
        return {
            id: raw.id !== undefined ? raw.id : Date.now(),
            title: String(raw.title || '').trim(),
            category: String(raw.category || 'General').trim(),
            author: String(raw.author || 'EducationistGuru').trim(),
            date: String(raw.date || new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })).trim(),
            image: raw.image || 'images/blog/1.jpg',
            excerpt: String(raw.excerpt || '').trim(),
            content: String(raw.content || '').trim(),
            commentsCount: Number(raw.commentsCount) || 0,
            isInitial: raw.isInitial !== undefined ? raw.isInitial : false
        };
    }

    function normalizeVideo(raw = {}) {
        return {
            id: raw.id !== undefined ? raw.id : Date.now(),
            videoId: String(raw.videoId || '').trim(),
            url: String(raw.url || '').trim(),
            title: String(raw.title || '').trim(),
            category: String(raw.category || 'Admissions 2025').trim(),
            duration: String(raw.duration || '4:15').trim(),
            thumbnail: raw.thumbnail || `https://img.youtube.com/vi/${raw.videoId}/hqdefault.jpg`,
            description: String(raw.description || '').trim(),
            featured: Boolean(raw.featured),
            dateAdded: raw.dateAdded || new Date().toISOString()
        };
    }

    // ================= CRM AUTHENTICATION =================
    const CRM_DEFAULT_ADMIN = {
        name: 'Jatinder Kaur',
        email: 'admin@educationistguru.com',
        password: 'EduGuru#Admin2026!',
        role: 'owner'
    };

    function checkAuth() {
        const loginView = document.getElementById('editLoginView');
        const appView = document.getElementById('editApp');

        let user = null;
        try {
            const editUser = localStorage.getItem('edit_user');
            if (editUser) user = JSON.parse(editUser);
        } catch(e) {}

        const isAuth = localStorage.getItem('edit_logged_in') === 'true' && !!user;

        if (isAuth && user) {
            if (loginView) loginView.style.display = 'none';
            if (appView) appView.style.display = 'flex';
            updateUserUI(user);
            return true;
        } else {
            if (loginView) loginView.style.display = 'flex';
            if (appView) appView.style.display = 'none';
            setTimeout(() => {
                const emailInp = document.getElementById('editEmailInput');
                if (emailInp) emailInp.focus();
            }, 100);
            return false;
        }
    }

    function updateUserUI(user) {
        const nameEl = document.getElementById('editUserName');
        const roleEl = document.getElementById('editUserRole');
        const avatarEl = document.getElementById('editUserAvatar');
        if (nameEl) nameEl.textContent = user.name || 'Administrator';
        if (roleEl) roleEl.textContent = user.role === 'owner' ? 'Super Admin' : (user.role ? (user.role.charAt(0).toUpperCase() + user.role.slice(1)) : 'Admin');
        if (avatarEl) {
            const initials = (user.name || 'AD').split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
            avatarEl.textContent = initials;
        }
    }

    function setupAuthListeners() {
        const form = document.getElementById('editLoginForm');
        if (form) {
            form.addEventListener('submit', async function(e) {
                e.preventDefault();
                const email = (document.getElementById('editEmailInput').value || '').trim();
                const password = (document.getElementById('editPassInput').value || '');
                const errorBox = document.getElementById('editLoginError');
                const errorMsg = document.getElementById('editLoginErrorMsg');
                const submitBtn = document.getElementById('editLoginBtn');

                if (errorBox) errorBox.style.display = 'none';

                let authenticatedUser = null;

                // 1. Check primary CRM admin credentials
                if (email.toLowerCase() === CRM_DEFAULT_ADMIN.email.toLowerCase() && password === CRM_DEFAULT_ADMIN.password) {
                    authenticatedUser = {
                        name: CRM_DEFAULT_ADMIN.name,
                        email: CRM_DEFAULT_ADMIN.email,
                        role: 'owner'
                    };
                }

                // 2. Check any users in crm_users or server /api/crm/users
                if (!authenticatedUser) {
                    try {
                        let users = JSON.parse(localStorage.getItem('crm_users') || '[]');
                        if (!users || users.length === 0) {
                            const res = await fetch('/api/crm/users');
                            if (res.ok) users = await res.json();
                        }
                        const found = users.find(u => 
                            u.email.toLowerCase() === email.toLowerCase() && 
                            u.password === password && 
                            u.status === 'active'
                        );
                        if (found) authenticatedUser = found;
                    } catch(err) {}
                }

                if (authenticatedUser) {
                    submitBtn.disabled = true;
                    submitBtn.innerHTML = '<i class="fa fa-spinner fa-spin"></i> Authenticating...';

                    localStorage.setItem('edit_logged_in', 'true');
                    localStorage.setItem('edit_user', JSON.stringify(authenticatedUser));
                    localStorage.setItem('crm_logged_in', 'true');
                    localStorage.setItem('crm_current_user', JSON.stringify(authenticatedUser));

                    setTimeout(async () => {
                        submitBtn.disabled = false;
                        submitBtn.innerHTML = '<i class="fa fa-sign-in"></i> Sign In to Content Studio';

                        checkAuth();
                        await loadData();
                        renderAll();
                        showToast(`Welcome, ${authenticatedUser.name}!`, 'success');
                    }, 350);
                } else {
                    if (errorBox) {
                        errorBox.style.display = 'flex';
                        if (errorMsg) errorMsg.textContent = 'Invalid email or password. Use your CRM admin credentials.';
                    }
                }
            });
        }

        // Password visibility toggle
        const toggleBtn = document.getElementById('editPassToggle');
        const passInp = document.getElementById('editPassInput');
        if (toggleBtn && passInp) {
            toggleBtn.addEventListener('click', function() {
                const isPass = passInp.type === 'password';
                passInp.type = isPass ? 'text' : 'password';
                toggleBtn.innerHTML = isPass ? '<i class="fa fa-eye-slash"></i>' : '<i class="fa fa-eye"></i>';
            });
        }

        // Sign Out
        window.handleEditSignOut = function(e) {
            if (e && e.preventDefault) e.preventDefault();
            if (e && e.stopPropagation) e.stopPropagation();

            localStorage.removeItem('edit_logged_in');
            localStorage.removeItem('edit_user');
            localStorage.removeItem('crm_logged_in');
            localStorage.removeItem('crm_current_user');

            const loginView = document.getElementById('editLoginView');
            const appView = document.getElementById('editApp');
            if (appView) appView.style.display = 'none';
            if (loginView) loginView.style.display = 'flex';

            const form = document.getElementById('editLoginForm');
            if (form) form.reset();

            showToast('Signed out successfully.', 'info');
            setTimeout(() => {
                const emailInp = document.getElementById('editEmailInput');
                if (emailInp) emailInp.focus();
            }, 100);
        };

        const signOutBtn = document.getElementById('editSignOutBtn');
        const topSignOutBtn = document.getElementById('editTopSignOutBtn');
        if (signOutBtn) signOutBtn.addEventListener('click', window.handleEditSignOut);
        if (topSignOutBtn) topSignOutBtn.addEventListener('click', window.handleEditSignOut);
    }

    // ================= DATA PERSISTENCE & LOADING =================
    async function loadData() {
        let loadedAll = false;
        try {
            const res = await cmsFetch(`${API_BASE}/api/content/all`);
            if (res.ok) {
                const json = await res.json();
                if (json && json.success && json.data) {
                    if (Array.isArray(json.data.courses)) courses = json.data.courses.map(normalizeCourse);
                    if (Array.isArray(json.data.colleges)) colleges = json.data.colleges.map(normalizeCollege);
                    if (Array.isArray(json.data.universities)) universities = json.data.universities.map(normalizeUniversity);
                    if (Array.isArray(json.data.blogs)) blogs = json.data.blogs.map(normalizeBlog);
                    if (Array.isArray(json.data.videos)) videos = json.data.videos.map(normalizeVideo);
                    if (json.data.menu) siteMenu = json.data.menu;
                    loadedAll = true;
                    updateServerStatusUI(true);
                }
            }
        } catch (e) {
            console.warn('[CMS] /api/content/all unavailable, trying individual loaders');
        }

        if (!loadedAll) {
            // Fallback to individual endpoints / files
            await loadCoursesData();
            await loadCollegesData();
            await loadUniversitiesData();
            await loadBlogsData();
            await loadVideosData();
            await loadMenuData();
        }

        syncToStorage();
    }

    async function loadCoursesData() {
        let loaded = false;
        try {
            const res = await cmsFetch(`${API_BASE}/api/content/courses`);
            if (res.ok) {
                const data = await res.json();
                if (data.courses && Array.isArray(data.courses)) {
                    courses = data.courses.map(normalizeCourse);
                    loaded = true;
                    updateServerStatusUI(true);
                }
            }
        } catch (e) {
            console.warn('[CMS] API unavailable for courses, trying fallbacks');
        }

        if (!loaded) {
            try {
                const coursePath = API_BASE ? `${API_BASE}/data/courses.json` : `${getRelativePath('data/courses.json')}`;
                const res = await cmsFetch(coursePath);
                if (res.ok) {
                    const data = await res.json();
                    if (Array.isArray(data) && data.length > 0) {
                        courses = data.map(normalizeCourse);
                        loaded = true;
                    }
                }
            } catch (e) {}
        }

        if (!loaded) {
            try {
                const local = localStorage.getItem('eg_cms_courses');
                if (local) {
                    const parsed = JSON.parse(local);
                    if (Array.isArray(parsed) && parsed.length > 0) {
                        courses = parsed.map(normalizeCourse);
                        loaded = true;
                    }
                }
            } catch (e) {}
        }
    }

    async function loadCollegesData() {
        let loaded = false;
        try {
            const res = await cmsFetch(`${API_BASE}/api/content/colleges`);
            if (res.ok) {
                const data = await res.json();
                const list = Array.isArray(data) ? data : (data.colleges || []);
                if (list.length > 0) {
                    colleges = list.map(normalizeCollege);
                    loaded = true;
                    updateServerStatusUI(true);
                }
            }
        } catch (e) {
            console.warn('[CMS] API unavailable for colleges, trying fallbacks');
        }

        if (!loaded) {
            try {
                const p = API_BASE ? `${API_BASE}/data/colleges.json` : `${getRelativePath('data/colleges.json')}`;
                const res = await cmsFetch(p);
                if (res.ok) {
                    const data = await res.json();
                    if (Array.isArray(data) && data.length > 0) {
                        colleges = data.map(normalizeCollege);
                        loaded = true;
                    }
                }
            } catch (e) {}
        }

        if (!loaded) {
            try {
                const local = localStorage.getItem('eg_cms_colleges');
                if (local) {
                    const parsed = JSON.parse(local);
                    if (Array.isArray(parsed) && parsed.length > 0) {
                        colleges = parsed.map(normalizeCollege);
                        loaded = true;
                    }
                }
            } catch (e) {}
        }
    }

    async function loadUniversitiesData() {
        let loaded = false;
        try {
            const res = await cmsFetch(`${API_BASE}/api/content/universities`);
            if (res.ok) {
                const data = await res.json();
                const list = Array.isArray(data) ? data : (data.universities || []);
                if (list.length > 0) {
                    universities = list.map(normalizeUniversity);
                    loaded = true;
                    updateServerStatusUI(true);
                }
            }
        } catch (e) {
            console.warn('[CMS] API unavailable for universities, trying fallbacks');
        }

        if (!loaded) {
            try {
                const p = API_BASE ? `${API_BASE}/data/universities.json` : `${getRelativePath('data/universities.json')}`;
                const res = await cmsFetch(p);
                if (res.ok) {
                    const data = await res.json();
                    if (Array.isArray(data) && data.length > 0) {
                        universities = data.map(normalizeUniversity);
                        loaded = true;
                    }
                }
            } catch (e) {}
        }

        if (!loaded) {
            try {
                const local = localStorage.getItem('eg_cms_universities');
                if (local) {
                    const parsed = JSON.parse(local);
                    if (Array.isArray(parsed) && parsed.length > 0) {
                        universities = parsed.map(normalizeUniversity);
                        loaded = true;
                    }
                }
            } catch (e) {}
        }
    }

    async function loadBlogsData() {
        let loaded = false;
        try {
            const res = await cmsFetch(`${API_BASE}/api/content/blogs`);
            if (res.ok) {
                const data = await res.json();
                if (data.blogs && Array.isArray(data.blogs)) {
                    blogs = data.blogs.map(normalizeBlog);
                    loaded = true;
                    updateServerStatusUI(true);
                }
            }
        } catch (e) {
            console.warn('[CMS] API unavailable for blogs, trying fallbacks');
        }

        if (!loaded) {
            try {
                const blogPath = API_BASE ? `${API_BASE}/data/blogs.json` : `${getRelativePath('data/blogs.json')}`;
                const res = await cmsFetch(blogPath);
                if (res.ok) {
                    const data = await res.json();
                    if (Array.isArray(data) && data.length > 0) {
                        blogs = data.map(normalizeBlog);
                        loaded = true;
                    }
                }
            } catch (e) {}
        }

        if (!loaded) {
            try {
                const local = localStorage.getItem('eg_cms_blogs');
                if (local) {
                    const parsed = JSON.parse(local);
                    if (Array.isArray(parsed) && parsed.length > 0) {
                        blogs = parsed.map(normalizeBlog);
                        loaded = true;
                    }
                }
            } catch (e) {}
        }
    }

    async function loadVideosData() {
        let loaded = false;
        try {
            const res = await cmsFetch(`${API_BASE}/api/youtube/videos`);
            if (res.ok) {
                const data = await res.json();
                const list = Array.isArray(data) ? data : (data.videos || []);
                if (list.length > 0) {
                    videos = list.map(normalizeVideo);
                    loaded = true;
                }
            }
        } catch (e) {
            console.warn('[CMS] API unavailable for youtube videos');
        }

        if (!loaded) {
            try {
                const local = localStorage.getItem('eg_cms_videos');
                if (local) {
                    const parsed = JSON.parse(local);
                    if (Array.isArray(parsed) && parsed.length > 0) {
                        videos = parsed.map(normalizeVideo);
                        loaded = true;
                    }
                }
            } catch (e) {}
        }

        if (!loaded) {
            // Seed videos from YouTube page
            videos = [
                {
                    id: 1,
                    videoId: 'M-habsWCGXY',
                    url: 'https://www.youtube.com/watch?v=M-habsWCGXY',
                    title: 'Pharmacy Course Details: D.Pharm vs B.Pharm Scope & Career',
                    category: 'Admissions 2025',
                    duration: '5:24',
                    thumbnail: 'https://img.youtube.com/vi/M-habsWCGXY/hqdefault.jpg',
                    description: 'Detailed breakdown of pharmacy degree admissions, eligibility, licensing, and PCI approvals in India.',
                    featured: true,
                    dateAdded: new Date().toISOString()
                },
                {
                    id: 2,
                    videoId: 'dQw4w9WgXcQ',
                    url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                    title: 'Top High-Paying Online & Distance Degrees Recognized by UGC-DEB',
                    category: 'University Reviews',
                    duration: '8:40',
                    thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
                    description: 'Explore approved universities offering legitimate UGC-DEB distance programs for working professionals.',
                    featured: true,
                    dateAdded: new Date().toISOString()
                }
            ].map(normalizeVideo);
        }
    }

    function syncToStorage() {
        try {
            localStorage.setItem('eg_cms_courses', JSON.stringify(courses));
            localStorage.setItem('eg_cms_colleges', JSON.stringify(colleges));
            localStorage.setItem('eg_cms_universities', JSON.stringify(universities));
            localStorage.setItem('eg_cms_blogs', JSON.stringify(blogs));
            localStorage.setItem('eg_cms_videos', JSON.stringify(videos));

            // Broadcast to other components / open windows
            window.dispatchEvent(new CustomEvent('cms:synced', {
                detail: { courses, colleges, universities, blogs, videos }
            }));
        } catch (e) {
            console.warn('[CMS] LocalStorage quota exceeded or disabled:', e);
        }
    }

    // ================= DYNAMIC FACULTY & STREAM CONTROLLERS (1800+ COURSES READY) =================
    let collegeCoursesList = [];
    let univCoursesList = [];
    let collegeActiveStreamFilter = 'all';
    let collegeProgramSearchQuery = '';
    let univActiveStreamFilter = 'all';
    let univProgramSearchQuery = '';

    // Dynamically aggregate faculties and degrees from live `courses` state (scales to 1800+ courses)
    function getLiveFacultyStreamMap() {
        const defaults = {
            'Engineering & Technology': {
                faculty: 'Faculty of Engineering & Technology',
                icon: 'fa-cogs',
                color: '#0284c7',
                bg: '#e0f2fe',
                courses: ['B.Tech Artificial Intelligence', 'B.Tech Computer Science', 'B.Tech Mechanical Engineering', 'B.Tech Civil Engineering', 'M.Tech Data Science', 'Polytechnic Diploma']
            },
            'Computer Applications & IT': {
                faculty: 'Faculty of Computer Applications & IT',
                icon: 'fa-laptop',
                color: '#6366f1',
                bg: '#e0e7ff',
                courses: ['BCA', 'MCA', 'B.Sc Computer Science', 'M.Sc Data Science & AI', 'PGDCA', 'B.Sc Information Technology']
            },
            'Commerce & Management': {
                faculty: 'Faculty of Commerce & Management',
                icon: 'fa-briefcase',
                color: '#059669',
                bg: '#d1fae5',
                courses: ['BBA', 'MBA', 'B.Com (Hons)', 'M.Com', 'Executive MBA', 'BBA Aviation & Airport Management']
            },
            'Medical & Allied Health Sciences': {
                faculty: 'Faculty of Medical & Allied Health Sciences',
                icon: 'fa-user-md',
                color: '#dc2626',
                bg: '#fee2e2',
                courses: ['MBBS', 'BDS', 'B.Sc Nursing', 'BPT Physiotherapy', 'BMLT Medical Lab Tech', 'B.Sc Radiology & Imaging']
            },
            'Pharmacy & Pharmaceutical Sciences': {
                faculty: 'Faculty of Pharmacy & Pharmaceutical Sciences',
                icon: 'fa-medkit',
                color: '#0d9488',
                bg: '#ccfbf1',
                courses: ['D.Pharm', 'B.Pharm', 'M.Pharm Pharmacology', 'M.Pharm Pharmaceutics', 'Pharm.D']
            },
            'Science & Research': {
                faculty: 'Faculty of Science & Research',
                icon: 'fa-flask',
                color: '#7c3aed',
                bg: '#ede9fe',
                courses: ['B.Sc Physics', 'B.Sc Chemistry', 'B.Sc Mathematics', 'M.Sc Biotechnology', 'B.Sc Microbiology']
            },
            'Arts, Humanities & Social Sciences': {
                faculty: 'Faculty of Arts, Humanities & Social Sciences',
                icon: 'fa-paint-brush',
                color: '#d97706',
                bg: '#fef3c7',
                courses: ['BA English (Hons)', 'BA Political Science', 'MA Psychology', 'BA History', 'Master of Social Work (MSW)']
            },
            'Law & Legal Studies': {
                faculty: 'Faculty of Law & Legal Studies',
                icon: 'fa-gavel',
                color: '#475569',
                bg: '#f1f5f9',
                courses: ['BA LLB (Hons)', 'BBA LLB', 'LLB (3-Year)', 'LLM Corporate Law', 'Cyber Law Diploma']
            },
            'Nursing & Healthcare': {
                faculty: 'Faculty of Nursing & Healthcare',
                icon: 'fa-heartbeat',
                color: '#e11d48',
                bg: '#ffe4e6',
                courses: ['ANM', 'GNM', 'B.Sc Nursing', 'Post Basic B.Sc Nursing', 'M.Sc Critical Care Nursing']
            },
            'Hotel Management & Hospitality': {
                faculty: 'Faculty of Hotel Management & Hospitality',
                icon: 'fa-cutlery',
                color: '#b45309',
                bg: '#fef3c7',
                courses: ['BHM Hotel Management', 'B.Sc Hospitality & Hotel Admin', 'DHMC Diploma', 'MBA Hospitality Management']
            },
            'Agriculture & Environmental Studies': {
                faculty: 'Faculty of Agriculture & Environmental Studies',
                icon: 'fa-leaf',
                color: '#16a34a',
                bg: '#dcfce7',
                courses: ['B.Sc (Hons) Agriculture', 'B.Sc Forestry', 'B.Sc Horticulture', 'M.Sc Agronomy', 'MBA Agri-Business']
            },
            'Education & Teaching': {
                faculty: 'Faculty of Education & Teaching',
                icon: 'fa-book',
                color: '#2563eb',
                bg: '#dbeafe',
                courses: ['B.Ed', 'M.Ed', 'B.El.Ed', 'D.El.Ed (BTC)', 'Integrated B.Sc B.Ed']
            },
            'Design, Animation & Fine Arts': {
                faculty: 'Faculty of Design, Animation & Fine Arts',
                icon: 'fa-pencil-square-o',
                color: '#ea580c',
                bg: '#ffedd5',
                courses: ['B.Des Fashion Design', 'B.Des Interior Design', 'B.Sc Animation & VFX', 'BFA Fine Arts', 'M.Des UX Design']
            },
            'Journalism & Mass Communication': {
                faculty: 'Faculty of Journalism & Mass Communication',
                icon: 'fa-bullhorn',
                color: '#9333ea',
                bg: '#f3e8ff',
                courses: ['BJMC', 'MJMC', 'B.Sc Media Studies', 'PG Diploma in PR & Advertising', 'Digital Filmmaking']
            },
            'Architecture & Planning': {
                faculty: 'Faculty of Architecture & Planning',
                icon: 'fa-building-o',
                color: '#334155',
                bg: '#f8fafc',
                courses: ['B.Arch', 'B.Plan', 'M.Arch Urban Design', 'Interior Architecture Diploma']
            },
            'Aviation, Marine & Defence': {
                faculty: 'Faculty of Aviation, Marine & Defence',
                icon: 'fa-plane',
                color: '#0284c7',
                bg: '#e0f2fe',
                courses: ['B.Sc Aviation', 'Commercial Pilot Training (CPL)', 'B.Tech Aeronautical Engg', 'B.Sc Nautical Science', 'AME Aircraft Maintenance']
            }
        };

        const dynamicMap = {};
        Object.keys(defaults).forEach(key => {
            dynamicMap[key] = {
                displayName: key,
                faculty: defaults[key].faculty,
                icon: defaults[key].icon,
                color: defaults[key].color,
                bg: defaults[key].bg,
                courses: new Set(defaults[key].courses)
            };
        });

        const paletteIcons = [
            { icon: 'fa-graduation-cap', color: '#0ea5e9', bg: '#e0f2fe' },
            { icon: 'fa-flask', color: '#8b5cf6', bg: '#ede9fe' },
            { icon: 'fa-lightbulb-o', color: '#eab308', bg: '#fef9c3' },
            { icon: 'fa-compass', color: '#14b8a6', bg: '#ccfbf1' },
            { icon: 'fa-certificate', color: '#f43f5e', bg: '#ffe4e6' },
            { icon: 'fa-star', color: '#6366f1', bg: '#e0e7ff' }
        ];
        let pIdx = 0;

        if (Array.isArray(courses)) {
            courses.forEach(c => {
                if (!c || !c.name) return;
                const rawFac = (c.faculty || 'General Studies').trim();
                let streamKey = rawFac.replace(/^faculty\s+of\s+/i, '').trim();
                if (!streamKey) streamKey = rawFac;

                let matchKey = Object.keys(dynamicMap).find(k => k.toLowerCase() === streamKey.toLowerCase());
                if (!matchKey) {
                    const pal = paletteIcons[pIdx % paletteIcons.length];
                    pIdx++;
                    dynamicMap[streamKey] = {
                        displayName: streamKey,
                        faculty: rawFac.toLowerCase().startsWith('faculty') ? rawFac : `Faculty of ${rawFac}`,
                        icon: pal.icon,
                        color: pal.color,
                        bg: pal.bg,
                        courses: new Set()
                    };
                    matchKey = streamKey;
                }
                dynamicMap[matchKey].courses.add(c.name.trim());
            });
        }

        const out = {};
        Object.keys(dynamicMap).forEach(key => {
            out[key] = {
                ...dynamicMap[key],
                courses: Array.from(dynamicMap[key].courses)
            };
        });
        return out;
    }

    function populateDynamicFilterDropdowns() {
        const streamMap = getLiveFacultyStreamMap();
        
        // 1. Course tab faculty filter
        const courseFilter = document.getElementById('courseFacultyFilter');
        if (courseFilter) {
            const curVal = courseFilter.value;
            const faculties = Object.values(streamMap).map(s => s.faculty).sort();
            courseFilter.innerHTML = `<option value="">All Faculties (${courses.length})</option>` +
                faculties.map(f => {
                    const count = courses.filter(c => c.faculty === f).length;
                    return `<option value="${escapeHtml(f)}" ${curVal === f ? 'selected' : ''}>${escapeHtml(f)} (${count})</option>`;
                }).join('');
        }

        // 2. College tab category filter
        const collegeFilter = document.getElementById('collegeCategoryFilter');
        if (collegeFilter) {
            const curVal = collegeFilter.value;
            const faculties = Object.values(streamMap).map(s => s.faculty).sort();
            collegeFilter.innerHTML = `<option value="">All Faculties / Categories</option>` +
                faculties.map(f => `<option value="${escapeHtml(f)}" ${curVal === f ? 'selected' : ''}>${escapeHtml(f)}</option>`).join('');
        }

        // 3. Course modal faculty datalist (#facultyList)
        const facList = document.getElementById('facultyList');
        if (facList) {
            const faculties = Object.values(streamMap).map(s => s.faculty).sort();
            facList.innerHTML = faculties.map(f => `<option value="${escapeHtml(f)}">`).join('');
        }
    }

    // --- COLLEGE SECTION CONTROLLERS ---
    function getSelectedCollegeCategories() {
        const input = document.getElementById('collegeCategoryInput');
        if (!input) return [];
        return input.value.split(',').map(s => s.trim()).filter(Boolean);
    }

    function renderCollegeCategoryCards() {
        const grid = document.getElementById('collegeCategoryCardsGrid');
        const countBadge = document.getElementById('collegeCategoryCountBadge');
        if (!grid) return;

        const streamMap = getLiveFacultyStreamMap();
        const selected = getSelectedCollegeCategories();
        const selectedLower = selected.map(s => s.toLowerCase());

        let selectedCount = 0;

        grid.innerHTML = Object.keys(streamMap).map(key => {
            const item = streamMap[key];
            const isMatch = selectedLower.some(s => 
                s === item.faculty.toLowerCase() || 
                s === item.displayName.toLowerCase() ||
                s.includes(item.displayName.toLowerCase()) ||
                item.displayName.toLowerCase().includes(s)
            );
            if (isMatch) selectedCount++;

            return `
                <div class="stream-card ${isMatch ? 'active' : ''}" onclick="window.toggleCollegeCategory(decodeURIComponent('${encodeURIComponent(key)}'), decodeURIComponent('${encodeURIComponent(item.faculty)}'))">
                    <div class="stream-card-left">
                        <div class="stream-card-icon" style="background:${item.bg}; color:${item.color};">
                            <i class="fa ${item.icon}"></i>
                        </div>
                        <div class="stream-card-text">
                            <span class="stream-card-name" title="${escapeHtml(item.displayName)}">${escapeHtml(item.displayName)}</span>
                            <span class="stream-card-meta">${item.courses.length} Degrees</span>
                        </div>
                    </div>
                    <div class="stream-card-check"><i class="fa fa-check"></i></div>
                </div>
            `;
        }).join('');

        if (countBadge) {
            countBadge.textContent = `${selectedCount} Domain${selectedCount === 1 ? '' : 's'} Selected`;
        }

        renderCollegeProgramTabs();
        renderCollegeCoursePills();
    }

    window.toggleCollegeCategory = function(streamKey, fullFaculty) {
        const input = document.getElementById('collegeCategoryInput');
        if (!input) return;
        let selected = getSelectedCollegeCategories();
        
        const matchIdx = selected.findIndex(s => 
            s.toLowerCase() === fullFaculty.toLowerCase() ||
            s.toLowerCase() === streamKey.toLowerCase() ||
            s.toLowerCase().includes(streamKey.toLowerCase())
        );

        if (matchIdx !== -1) {
            selected.splice(matchIdx, 1);
            if (collegeActiveStreamFilter === streamKey) {
                collegeActiveStreamFilter = 'all';
            }
        } else {
            selected.push(fullFaculty);
            collegeActiveStreamFilter = streamKey;
        }

        input.value = selected.join(', ');
        renderCollegeCategoryCards();
    };

    function renderCollegeProgramTabs() {
        const tabsBox = document.getElementById('collegeProgramStreamTabs');
        if (!tabsBox) return;

        const streamMap = getLiveFacultyStreamMap();
        const selected = getSelectedCollegeCategories();
        const selectedLower = selected.map(s => s.toLowerCase());

        // Active selected streams
        const activeStreams = Object.keys(streamMap).filter(key => {
            const item = streamMap[key];
            return selectedLower.some(s => 
                s === item.faculty.toLowerCase() || 
                s === item.displayName.toLowerCase() ||
                s.includes(item.displayName.toLowerCase()) ||
                item.displayName.toLowerCase().includes(s)
            );
        });

        const displayKeys = activeStreams.length > 0 ? activeStreams : Object.keys(streamMap).slice(0, 8);

        if (collegeActiveStreamFilter !== 'all' && !displayKeys.includes(collegeActiveStreamFilter)) {
            collegeActiveStreamFilter = 'all';
        }

        let tabsHtml = `
            <div class="program-stream-tab ${collegeActiveStreamFilter === 'all' ? 'active' : ''}" onclick="window.setCollegeStreamTab('all')">
                <i class="fa fa-th-list"></i> All Programs
            </div>
        `;

        tabsHtml += displayKeys.map(key => {
            const item = streamMap[key];
            const isActive = collegeActiveStreamFilter === key;
            return `
                <div class="program-stream-tab ${isActive ? 'active' : ''}" onclick="window.setCollegeStreamTab(decodeURIComponent('${encodeURIComponent(key)}'))">
                    <i class="fa ${item.icon}"></i> ${escapeHtml(item.displayName)}
                </div>
            `;
        }).join('');

        tabsBox.innerHTML = tabsHtml;
    }

    window.setCollegeStreamTab = function(streamKey) {
        collegeActiveStreamFilter = streamKey;
        renderCollegeProgramTabs();
        renderCollegeCoursePills();
    };

    function renderCollegeCoursePills() {
        const pillsGrid = document.getElementById('collegeProgramPillsGrid');
        if (!pillsGrid) return;

        const streamMap = getLiveFacultyStreamMap();
        const selected = getSelectedCollegeCategories();
        const selectedLower = selected.map(s => s.toLowerCase());

        let pool = [];
        if (collegeActiveStreamFilter !== 'all') {
            pool = streamMap[collegeActiveStreamFilter] ? streamMap[collegeActiveStreamFilter].courses : [];
        } else if (selected.length > 0) {
            Object.keys(streamMap).forEach(k => {
                const item = streamMap[k];
                if (selectedLower.some(s => s === item.faculty.toLowerCase() || s === item.displayName.toLowerCase() || s.includes(item.displayName.toLowerCase()))) {
                    pool.push(...item.courses);
                }
            });
            if (pool.length === 0) {
                Object.keys(streamMap).forEach(k => pool.push(...streamMap[k].courses));
            }
        } else {
            Object.keys(streamMap).forEach(k => pool.push(...streamMap[k].courses));
        }

        pool = Array.from(new Set(pool));

        const query = (collegeProgramSearchQuery || '').toLowerCase().trim();
        if (query) {
            pool = pool.filter(c => c.toLowerCase().includes(query));
        }

        if (pool.length === 0) {
            pillsGrid.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; padding: 20px 10px; color: #64748b; font-size: 13px;">
                    <i class="fa fa-info-circle text-primary" style="margin-right: 4px;"></i> No predefined degree found matching "${escapeHtml(collegeProgramSearchQuery)}".
                    <div style="margin-top: 8px;">
                        <button type="button" class="btn btn-sm btn-outline" onclick="window.addCollegeCourseTag('${escapeHtml(collegeProgramSearchQuery)}'); collegeProgramSearchQuery=''; document.getElementById('collegeProgramSearchInput').value=''; renderCollegeCoursePills();">
                            <i class="fa fa-plus"></i> Add "${escapeHtml(collegeProgramSearchQuery)}" as Custom Degree
                        </button>
                    </div>
                </div>
            `;
            return;
        }

        pillsGrid.innerHTML = pool.map(course => {
            const isAdded = collegeCoursesList.some(c => c.toLowerCase() === course.toLowerCase());
            return `
                <div class="program-pill ${isAdded ? 'active' : ''}" onclick="window.toggleCollegeCoursePill(decodeURIComponent('${encodeURIComponent(course)}'))">
                    <span class="pill-icon"><i class="fa ${isAdded ? 'fa-check' : 'fa-plus'}"></i></span>
                    <span class="pill-text">${escapeHtml(course)}</span>
                </div>
            `;
        }).join('');
    }

    window.toggleCollegeCoursePill = function(courseName) {
        const cleaned = String(courseName || '').trim();
        if (!cleaned) return;
        const existsIdx = collegeCoursesList.findIndex(c => c.toLowerCase() === cleaned.toLowerCase());
        if (existsIdx !== -1) {
            collegeCoursesList.splice(existsIdx, 1);
        } else {
            collegeCoursesList.push(cleaned);
        }
        renderCollegeCoursesTags();
        renderCollegeCoursePills();
    };

    function renderCollegeCoursesTags() {
        const box = document.getElementById('collegeCoursesTagsBox');
        const hiddenInput = document.getElementById('collegeCoursesInput');
        const countBadge = document.getElementById('collegeCoursesCountBadge');
        const countPill = document.getElementById('collegeSelectedCount');
        if (!box) return;

        if (collegeCoursesList.length === 0) {
            box.innerHTML = '<span class="selected-tags-empty"><i class="fa fa-lightbulb-o text-primary"></i> No courses selected yet. Click any degree pill below or search degrees.</span>';
        } else {
            box.innerHTML = collegeCoursesList.map((course, idx) => `
                <span class="selected-tag-item">
                    ${escapeHtml(course)}
                    <span class="selected-tag-remove" onclick="window.removeCollegeCourseTag(${idx})" title="Remove course">&times;</span>
                </span>
            `).join('');
        }

        if (hiddenInput) {
            hiddenInput.value = collegeCoursesList.join(', ');
        }
        if (countBadge) {
            countBadge.textContent = `${collegeCoursesList.length} Program${collegeCoursesList.length === 1 ? '' : 's'} Selected`;
        }
        if (countPill) {
            countPill.textContent = collegeCoursesList.length;
        }

        renderCollegeCoursePills();
    }

    window.removeCollegeCourseTag = function(index) {
        collegeCoursesList.splice(index, 1);
        renderCollegeCoursesTags();
    };

    window.addCollegeCourseTag = function(courseName) {
        const cleaned = String(courseName || '').trim();
        if (!cleaned) return;
        if (!collegeCoursesList.some(c => c.toLowerCase() === cleaned.toLowerCase())) {
            collegeCoursesList.push(cleaned);
            renderCollegeCoursesTags();
        }
    };

    // --- UNIVERSITY SECTION CONTROLLERS ---
    function getSelectedUnivStreams() {
        const input = document.getElementById('univStreamsInput');
        if (!input) return [];
        return input.value.split(',').map(s => s.trim()).filter(Boolean);
    }

    function renderUnivStreamCards() {
        const grid = document.getElementById('univStreamCardsGrid');
        const countBadge = document.getElementById('univStreamCountBadge');
        if (!grid) return;

        const streamMap = getLiveFacultyStreamMap();
        const selected = getSelectedUnivStreams();
        const selectedLower = selected.map(s => s.toLowerCase());

        let selectedCount = 0;

        grid.innerHTML = Object.keys(streamMap).map(key => {
            const item = streamMap[key];
            const isMatch = selectedLower.some(s => 
                s === item.displayName.toLowerCase() || 
                s === item.faculty.toLowerCase() ||
                s.includes(item.displayName.toLowerCase()) ||
                item.displayName.toLowerCase().includes(s)
            );
            if (isMatch) selectedCount++;

            return `
                <div class="stream-card univ-stream ${isMatch ? 'active' : ''}" onclick="window.toggleUnivStream(decodeURIComponent('${encodeURIComponent(key)}'))">
                    <div class="stream-card-left">
                        <div class="stream-card-icon" style="background:${item.bg}; color:${item.color};">
                            <i class="fa ${item.icon}"></i>
                        </div>
                        <div class="stream-card-text">
                            <span class="stream-card-name" title="${escapeHtml(item.displayName)}">${escapeHtml(item.displayName)}</span>
                            <span class="stream-card-meta">${item.courses.length} Degrees</span>
                        </div>
                    </div>
                    <div class="stream-card-check"><i class="fa fa-check"></i></div>
                </div>
            `;
        }).join('');

        if (countBadge) {
            countBadge.textContent = `${selectedCount} Stream${selectedCount === 1 ? '' : 's'} Selected`;
        }

        renderUnivProgramTabs();
        renderUnivCoursePills();
    }

    window.toggleUnivStream = function(streamKey) {
        const input = document.getElementById('univStreamsInput');
        if (!input) return;
        let selected = getSelectedUnivStreams();
        
        const matchIdx = selected.findIndex(s => 
            s.toLowerCase() === streamKey.toLowerCase() ||
            s.toLowerCase().includes(streamKey.toLowerCase()) ||
            streamKey.toLowerCase().includes(s.toLowerCase())
        );

        if (matchIdx !== -1) {
            selected.splice(matchIdx, 1);
            if (univActiveStreamFilter === streamKey) {
                univActiveStreamFilter = 'all';
            }
        } else {
            selected.push(streamKey);
            univActiveStreamFilter = streamKey;
        }

        input.value = selected.join(', ');
        renderUnivStreamCards();
    };

    function renderUnivProgramTabs() {
        const tabsBox = document.getElementById('univProgramStreamTabs');
        if (!tabsBox) return;

        const streamMap = getLiveFacultyStreamMap();
        const selected = getSelectedUnivStreams();
        const selectedLower = selected.map(s => s.toLowerCase());

        const activeStreams = Object.keys(streamMap).filter(key => {
            const item = streamMap[key];
            return selectedLower.some(s => 
                s === item.displayName.toLowerCase() || 
                s === item.faculty.toLowerCase() ||
                s.includes(item.displayName.toLowerCase()) ||
                item.displayName.toLowerCase().includes(s)
            );
        });

        const displayKeys = activeStreams.length > 0 ? activeStreams : Object.keys(streamMap).slice(0, 8);

        if (univActiveStreamFilter !== 'all' && !displayKeys.includes(univActiveStreamFilter)) {
            univActiveStreamFilter = 'all';
        }

        let tabsHtml = `
            <div class="program-stream-tab ${univActiveStreamFilter === 'all' ? 'active' : ''}" onclick="window.setUnivStreamTab('all')">
                <i class="fa fa-th-list"></i> All Degrees
            </div>
        `;

        tabsHtml += displayKeys.map(key => {
            const item = streamMap[key];
            const isActive = univActiveStreamFilter === key;
            return `
                <div class="program-stream-tab ${isActive ? 'active' : ''}" onclick="window.setUnivStreamTab(decodeURIComponent('${encodeURIComponent(key)}'))">
                    <i class="fa ${item.icon}"></i> ${escapeHtml(item.displayName)}
                </div>
            `;
        }).join('');

        tabsBox.innerHTML = tabsHtml;
    }

    window.setUnivStreamTab = function(streamKey) {
        univActiveStreamFilter = streamKey;
        renderUnivProgramTabs();
        renderUnivCoursePills();
    };

    function renderUnivCoursePills() {
        const pillsGrid = document.getElementById('univProgramPillsGrid');
        if (!pillsGrid) return;

        const streamMap = getLiveFacultyStreamMap();
        const selected = getSelectedUnivStreams();
        const selectedLower = selected.map(s => s.toLowerCase());

        let pool = [];
        if (univActiveStreamFilter !== 'all') {
            pool = streamMap[univActiveStreamFilter] ? streamMap[univActiveStreamFilter].courses : [];
        } else if (selected.length > 0) {
            Object.keys(streamMap).forEach(k => {
                const item = streamMap[k];
                if (selectedLower.some(s => s === item.displayName.toLowerCase() || s === item.faculty.toLowerCase() || s.includes(item.displayName.toLowerCase()))) {
                    pool.push(...item.courses);
                }
            });
            if (pool.length === 0) {
                Object.keys(streamMap).forEach(k => pool.push(...streamMap[k].courses));
            }
        } else {
            Object.keys(streamMap).forEach(k => pool.push(...streamMap[k].courses));
        }

        pool = Array.from(new Set(pool));

        const query = (univProgramSearchQuery || '').toLowerCase().trim();
        if (query) {
            pool = pool.filter(c => c.toLowerCase().includes(query));
        }

        if (pool.length === 0) {
            pillsGrid.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; padding: 20px 10px; color: #64748b; font-size: 13px;">
                    <i class="fa fa-info-circle text-primary" style="margin-right: 4px;"></i> No predefined degree found matching "${escapeHtml(univProgramSearchQuery)}".
                    <div style="margin-top: 8px;">
                        <button type="button" class="btn btn-sm btn-outline" onclick="window.addUnivCourseTag('${escapeHtml(univProgramSearchQuery)}'); univProgramSearchQuery=''; document.getElementById('univProgramSearchInput').value=''; renderUnivCoursePills();">
                            <i class="fa fa-plus"></i> Add "${escapeHtml(univProgramSearchQuery)}" as Custom Degree
                        </button>
                    </div>
                </div>
            `;
            return;
        }

        pillsGrid.innerHTML = pool.map(course => {
            const isAdded = univCoursesList.some(c => c.toLowerCase() === course.toLowerCase());
            return `
                <div class="program-pill ${isAdded ? 'active' : ''}" onclick="window.toggleUnivCoursePill(decodeURIComponent('${encodeURIComponent(course)}'))">
                    <span class="pill-icon"><i class="fa ${isAdded ? 'fa-check' : 'fa-plus'}"></i></span>
                    <span class="pill-text">${escapeHtml(course)}</span>
                </div>
            `;
        }).join('');
    }

    window.toggleUnivCoursePill = function(courseName) {
        const cleaned = String(courseName || '').trim();
        if (!cleaned) return;
        const existsIdx = univCoursesList.findIndex(c => c.toLowerCase() === cleaned.toLowerCase());
        if (existsIdx !== -1) {
            univCoursesList.splice(existsIdx, 1);
        } else {
            univCoursesList.push(cleaned);
        }
        renderUnivCoursesTags();
        renderUnivCoursePills();
    };

    function renderUnivCoursesTags() {
        const box = document.getElementById('univCoursesTagsBox');
        const hiddenInput = document.getElementById('univCoursesInput');
        const countBadge = document.getElementById('univCoursesCountBadge');
        const countPill = document.getElementById('univSelectedCount');
        if (!box) return;

        if (univCoursesList.length === 0) {
            box.innerHTML = '<span class="selected-tags-empty"><i class="fa fa-lightbulb-o text-primary"></i> No degrees selected yet. Click any degree pill below or search degrees.</span>';
        } else {
            box.innerHTML = univCoursesList.map((course, idx) => `
                <span class="selected-tag-item univ">
                    ${escapeHtml(course)}
                    <span class="selected-tag-remove" onclick="window.removeUnivCourseTag(${idx})" title="Remove degree">&times;</span>
                </span>
            `).join('');
        }

        if (hiddenInput) {
            hiddenInput.value = univCoursesList.join(', ');
        }
        if (countBadge) {
            countBadge.textContent = `${univCoursesList.length} Degree${univCoursesList.length === 1 ? '' : 's'} Selected`;
        }
        if (countPill) {
            countPill.textContent = univCoursesList.length;
        }

        renderUnivCoursePills();
    }

    window.removeUnivCourseTag = function(index) {
        univCoursesList.splice(index, 1);
        renderUnivCoursesTags();
    };

    window.addUnivCourseTag = function(courseName) {
        const cleaned = String(courseName || '').trim();
        if (!cleaned) return;
        if (!univCoursesList.some(c => c.toLowerCase() === cleaned.toLowerCase())) {
            univCoursesList.push(cleaned);
            renderUnivCoursesTags();
        }
    };

    // ================= EVENT LISTENERS =================
    function setupEventListeners() {
        // Tab switching
        document.querySelectorAll('[data-tab]').forEach(btn => {
            btn.addEventListener('click', () => {
                const tab = btn.dataset.tab;
                switchTab(tab);
            });
        });

        // Search and Filters
        const courseSearch = document.getElementById('courseSearch');
        if (courseSearch) courseSearch.addEventListener('input', renderCourses);
        const courseFacultyFilter = document.getElementById('courseFacultyFilter');
        if (courseFacultyFilter) courseFacultyFilter.addEventListener('change', renderCourses);

        const collegeSearch = document.getElementById('collegeSearch');
        if (collegeSearch) collegeSearch.addEventListener('input', renderColleges);
        const collegeCatFilter = document.getElementById('collegeCategoryFilter');
        if (collegeCatFilter) collegeCatFilter.addEventListener('change', renderColleges);

        const univSearch = document.getElementById('univSearch');
        if (univSearch) univSearch.addEventListener('input', renderUniversities);
        const univModeFilter = document.getElementById('univModeFilter');
        if (univModeFilter) univModeFilter.addEventListener('change', renderUniversities);

        const blogSearch = document.getElementById('blogSearch');
        if (blogSearch) blogSearch.addEventListener('input', renderBlogs);
        const blogCategoryFilter = document.getElementById('blogCategoryFilter');
        if (blogCategoryFilter) blogCategoryFilter.addEventListener('change', renderBlogs);

        const videoSearch = document.getElementById('videoSearch');
        if (videoSearch) videoSearch.addEventListener('input', renderVideos);
        const videoCategoryFilter = document.getElementById('videoCategoryFilter');
        if (videoCategoryFilter) videoCategoryFilter.addEventListener('change', renderVideos);

        // Modals Open Triggers
        const openCourseBtn = document.getElementById('openAddCourseBtn');
        if (openCourseBtn) openCourseBtn.addEventListener('click', () => window.openCourseModal());

        const openCollegeBtn = document.getElementById('openAddCollegeBtn');
        if (openCollegeBtn) openCollegeBtn.addEventListener('click', () => window.openCollegeModal());

        const openUnivBtn = document.getElementById('openAddUnivBtn');
        if (openUnivBtn) openUnivBtn.addEventListener('click', () => window.openUnivModal());

        const openBlogBtn = document.getElementById('openAddBlogBtn');
        if (openBlogBtn) openBlogBtn.addEventListener('click', () => window.openBlogModal());

        const openVideoBtn = document.getElementById('openAddVideoBtn');
        if (openVideoBtn) openVideoBtn.addEventListener('click', () => window.openVideoModal());

        // College Custom Domain / Category add
        const collegeCustomInp = document.getElementById('collegeCustomCategoryInput');
        const collegeAddCustomBtn = document.getElementById('collegeAddCustomCatBtn');
        if (collegeAddCustomBtn) {
            collegeAddCustomBtn.addEventListener('click', () => {
                const val = (collegeCustomInp ? collegeCustomInp.value : '').trim();
                if (val) {
                    const facName = val.toLowerCase().startsWith('faculty') ? val : `Faculty of ${val}`;
                    window.toggleCollegeCategory(val.replace(/^faculty\s+of\s+/i, ''), facName);
                    if (collegeCustomInp) collegeCustomInp.value = '';
                }
            });
        }
        if (collegeCustomInp) {
            collegeCustomInp.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    if (collegeAddCustomBtn) collegeAddCustomBtn.click();
                }
            });
        }

        // College Program live search
        const collegeProgSearch = document.getElementById('collegeProgramSearchInput');
        if (collegeProgSearch) {
            collegeProgSearch.addEventListener('input', () => {
                collegeProgramSearchQuery = collegeProgSearch.value;
                renderCollegeCoursePills();
            });
        }

        // College Clear all courses
        const collegeClearBtn = document.getElementById('collegeClearCoursesBtn');
        if (collegeClearBtn) {
            collegeClearBtn.addEventListener('click', () => {
                collegeCoursesList = [];
                renderCollegeCoursesTags();
            });
        }

        // College Course Manual / Custom Add
        const collegeNewInp = document.getElementById('collegeCourseNewInput');
        const collegeAddBtn = document.getElementById('collegeAddCourseBtn');
        if (collegeNewInp) {
            collegeNewInp.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    window.addCollegeCourseTag(collegeNewInp.value);
                    collegeNewInp.value = '';
                }
            });
        }
        if (collegeAddBtn) {
            collegeAddBtn.addEventListener('click', () => {
                if (collegeNewInp) {
                    window.addCollegeCourseTag(collegeNewInp.value);
                    collegeNewInp.value = '';
                }
            });
        }

        // University Custom Stream add
        const univCustomInp = document.getElementById('univCustomStreamInput');
        const univAddCustomBtn = document.getElementById('univAddCustomStreamBtn');
        if (univAddCustomBtn) {
            univAddCustomBtn.addEventListener('click', () => {
                const val = (univCustomInp ? univCustomInp.value : '').trim();
                if (val) {
                    window.toggleUnivStream(val);
                    if (univCustomInp) univCustomInp.value = '';
                }
            });
        }
        if (univCustomInp) {
            univCustomInp.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    if (univAddCustomBtn) univAddCustomBtn.click();
                }
            });
        }

        // University Program live search
        const univProgSearch = document.getElementById('univProgramSearchInput');
        if (univProgSearch) {
            univProgSearch.addEventListener('input', () => {
                univProgramSearchQuery = univProgSearch.value;
                renderUnivCoursePills();
            });
        }

        // University Clear all degrees
        const univClearBtn = document.getElementById('univClearCoursesBtn');
        if (univClearBtn) {
            univClearBtn.addEventListener('click', () => {
                univCoursesList = [];
                renderUnivCoursesTags();
            });
        }

        // University Course Manual / Custom Add
        const univNewInp = document.getElementById('univCourseNewInput');
        const univAddBtn = document.getElementById('univAddCourseBtn');
        if (univNewInp) {
            univNewInp.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    window.addUnivCourseTag(univNewInp.value);
                    univNewInp.value = '';
                }
            });
        }
        if (univAddBtn) {
            univAddBtn.addEventListener('click', () => {
                if (univNewInp) {
                    window.addUnivCourseTag(univNewInp.value);
                    univNewInp.value = '';
                }
            });
        }

        // Modal Form Submits
        const courseForm = document.getElementById('courseForm');
        if (courseForm) courseForm.addEventListener('submit', handleCourseSubmit);

        const collegeForm = document.getElementById('collegeForm');
        if (collegeForm) collegeForm.addEventListener('submit', handleCollegeSubmit);

        const univForm = document.getElementById('univForm');
        if (univForm) univForm.addEventListener('submit', handleUnivSubmit);

        const blogForm = document.getElementById('blogForm');
        if (blogForm) blogForm.addEventListener('submit', handleBlogSubmit);

        const videoForm = document.getElementById('videoForm');
        if (videoForm) videoForm.addEventListener('submit', handleVideoSubmit);

        // Video Auto-Fetch Button
        const fetchVideoBtn = document.getElementById('fetchVideoInfoBtn');
        if (fetchVideoBtn) fetchVideoBtn.addEventListener('click', handleFetchVideoInfo);

        // Confirm Delete Button
        const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
        if (confirmDeleteBtn) confirmDeleteBtn.addEventListener('click', window.executeDelete);

        // File Uploads & Image Preset Thumbnails
        setupFileUploadsAndThumbnails();
    }

    function switchTab(tabId) {
        currentTab = tabId;
        document.querySelectorAll('.menu-item').forEach(m => m.classList.remove('active'));
        const activeMenu = document.querySelector(`.menu-item[data-tab="${tabId}"]`);
        if (activeMenu) activeMenu.classList.add('active');

        document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
        const activePane = document.getElementById(`tab-${tabId}`);
        if (activePane) activePane.classList.add('active');

        if (tabId === 'headers') renderHeadersTab();
    }
    window.switchTab = switchTab;

    // ================= RENDER STATS =================
    function renderStats() {
        // Overview Cards
        const setTxt = (id, val) => {
            const el = document.getElementById(id);
            if (el) el.textContent = val;
        };

        setTxt('totalCoursesCount', courses.length);
        setTxt('totalCollegesCount', colleges.length);
        setTxt('totalUnivCount', universities.length);
        setTxt('totalBlogsCount', blogs.length);
        setTxt('totalVideosCount', videos.length);

        // Sidebar Badges
        setTxt('sidebarCourseCount', courses.length);
        setTxt('sidebarCollegeCount', colleges.length);
        setTxt('sidebarUnivCount', universities.length);
        setTxt('sidebarBlogCount', blogs.length);
        setTxt('sidebarVideoCount', videos.length);

        renderRecentActivity();
    }

    function renderRecentActivity() {
        const list = document.getElementById('recentActivityList');
        if (!list) return;

        try {
            const courseList = Array.isArray(courses) ? courses.filter(Boolean) : [];
            const collegeList = Array.isArray(colleges) ? colleges.filter(Boolean) : [];
            const univList = Array.isArray(universities) ? universities.filter(Boolean) : [];
            const blogList = Array.isArray(blogs) ? blogs.filter(Boolean) : [];
            const videoList = Array.isArray(videos) ? videos.filter(Boolean) : [];

            const recent = [
                ...courseList.map(c => ({ type: 'Course', color: '#0ea5e9', bg: '#e0f2fe', title: c.name || 'Untitled Course', date: c.dateAdded ? new Date(c.dateAdded).toLocaleDateString() : 'Catalog', link: `${getRelativePath('courses.html')}` })),
                ...collegeList.map(c => ({ type: 'College', color: '#10b981', bg: '#ecfdf5', title: c.name || 'Untitled College', date: c.dateAdded ? new Date(c.dateAdded).toLocaleDateString() : 'Active', link: `${getRelativePath('colleges.html')}` })),
                ...univList.map(u => ({ type: 'University', color: '#8b5cf6', bg: '#f5f3ff', title: u.name || 'Untitled University', date: u.dateAdded ? new Date(u.dateAdded).toLocaleDateString() : 'Partner', link: `${getRelativePath('universities.html')}` })),
                ...blogList.map(b => ({ type: 'Blog', color: '#ff3115', bg: '#fee2e2', title: b.title || 'Untitled Post', date: b.date || 'Recent', link: `${getRelativePath('blog.html')}` })),
                ...videoList.map(v => ({ type: 'YouTube', color: '#ef4444', bg: '#fef2f2', title: v.title || 'Untitled Video', date: v.dateAdded ? new Date(v.dateAdded).toLocaleDateString() : 'Channel', link: `${getRelativePath('youtube.html')}` }))
            ];

            list.innerHTML = recent.slice(0, 8).map(item => `
                <div style="display:flex; justify-content:space-between; align-items:center; padding:12px 16px; border-bottom:1px solid #f1f5f9; background:#fff; border-radius:6px; margin-bottom:8px;">
                    <div style="display:flex; align-items:center; gap:12px;">
                        <span style="background:${item.bg}; color:${item.color}; font-size:11px; font-weight:700; padding:3px 8px; border-radius:4px; text-transform:uppercase;">${item.type}</span>
                        <strong style="font-size:14px; color:#1e293b;">${escapeHtml(item.title)}</strong>
                    </div>
                    <div style="display:flex; align-items:center; gap:10px;">
                        <span style="font-size:12px; color:#64748b;">${escapeHtml(item.date)}</span>
                        <a href="${item.link}" target="_blank" class="btn btn-sm btn-outline"><i class="fa fa-external-link"></i> View</a>
                    </div>
                </div>
            `).join('');
        } catch(e) {
            console.error('[RenderRecentActivity] Error:', e);
        }
    }

    // ================= RENDER 1: COURSES =================
    function renderCourses() {
        const searchInput = document.getElementById('courseSearch');
        const filterSelect = document.getElementById('courseFacultyFilter');
        const grid = document.getElementById('coursesGrid');
        if (!grid) return;

        try {
            const query = (searchInput ? searchInput.value : '').toLowerCase().trim();
            const faculty = filterSelect ? filterSelect.value : '';

            const courseList = Array.isArray(courses) ? courses.filter(Boolean) : [];
            const filtered = courseList.filter(c => {
                const nameStr = String(c.name || '').toLowerCase();
                const facStr = String(c.faculty || '').toLowerCase();
                const eligStr = String(c.eligibility || '').toLowerCase();
                const matchesQuery = !query || nameStr.includes(query) || facStr.includes(query) || eligStr.includes(query);
                const matchesFaculty = !faculty || c.faculty === faculty;
                return matchesQuery && matchesFaculty;
            });

            if (filtered.length === 0) {
                grid.innerHTML = `
                    <div style="grid-column: 1/-1; text-align: center; padding: 60px 20px; background: #fff; border-radius: 12px; border: 1px dashed #cbd5e1;">
                        <i class="fa fa-graduation-cap" style="font-size: 38px; color: #94a3b8; margin-bottom: 12px; display: block;"></i>
                        <h3 style="font-size: 17px; color: #1e293b; margin-bottom: 6px;">No courses found</h3>
                        <p style="font-size: 13px; color: #64748b; margin-bottom: 18px;">Try adjusting your filter or add a new course.</p>
                        <button class="btn btn-primary" onclick="window.openCourseModal()"><i class="fa fa-plus"></i> Add New Course</button>
                    </div>
                `;
                return;
            }

            grid.innerHTML = filtered.map(c => {
                const cName = c.name || 'Untitled Course';
                const cFac = c.faculty || 'General';
                const cDur = c.duration || 'N/A';
                const cElig = c.eligibility ? String(c.eligibility).slice(0, 32) : 'Open';
                const cMode = c.mode || 'Online / Regular';
                const cDesc = c.description ? String(c.description).slice(0, 90) + '...' : '';
                return `
                <div class="content-card">
                    <div class="card-img">
                        <img src="${c.image || 'images/courses/1.jpg'}" alt="${escapeHtml(cName)}" onerror="this.src='${getRelativePath('images/courses/1.jpg')}'">
                        <span class="card-category">${escapeHtml(cFac)}</span>
                    </div>
                    <div class="card-body">
                        <h3 class="card-title">${escapeHtml(cName)}</h3>
                        <div class="card-specs">
                            <div><span>Duration:</span> <strong>${escapeHtml(cDur)}</strong></div>
                            <div><span>Eligibility:</span> <strong>${escapeHtml(cElig)}</strong></div>
                            <div><span>Mode:</span> <strong>${escapeHtml(cMode)}</strong></div>
                            ${c.fee ? `<div><span>Fee:</span> <strong style="color:#ff3115;">${escapeHtml(String(c.fee))}</strong></div>` : ''}
                        </div>
                        ${c.specializations ? `<p class="card-desc" style="font-size:12px; margin-bottom:12px;"><strong>Specializations:</strong> ${escapeHtml(String(c.specializations))}</p>` : `<p class="card-desc">${escapeHtml(cDesc)}</p>`}
                        <div class="card-footer">
                            <a href="/courses/${c.slug || c.id}" target="_blank" class="btn btn-sm btn-outline" title="Preview on Website">
                                <i class="fa fa-external-link"></i> Preview
                            </a>
                            <div style="display:flex; gap:6px;">
                                <button class="btn btn-sm btn-outline" onclick="window.editCourse('${c.id}')" title="Edit Course">
                                    <i class="fa fa-pencil" style="color:#0ea5e9;"></i> Edit
                                </button>
                                <button class="btn btn-sm btn-outline" onclick="window.deleteCourse('${c.id}')" title="Delete Course">
                                    <i class="fa fa-trash" style="color:#ef4444;"></i> Delete
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `}).join('');
        } catch(e) {
            console.error('[RenderCourses] Error:', e);
        }
    }

    // ================= RENDER 2: COLLEGES =================
    function renderColleges() {
        const searchInput = document.getElementById('collegeSearch');
        const filterSelect = document.getElementById('collegeCategoryFilter');
        const grid = document.getElementById('collegesGrid');
        if (!grid) return;

        try {
            const query = (searchInput ? searchInput.value : '').toLowerCase().trim();
            const category = filterSelect ? filterSelect.value : '';

            const collegeList = Array.isArray(colleges) ? colleges.filter(Boolean) : [];
            const filtered = collegeList.filter(c => {
                const nameStr = String(c.name || '').toLowerCase();
                const locStr = String(c.location || '').toLowerCase();
                const catStr = String(c.category || '').toLowerCase();
                const coursesStr = Array.isArray(c.courses) ? c.courses.join(' ').toLowerCase() : String(c.courses || '').toLowerCase();
                const matchesQuery = !query || nameStr.includes(query) || locStr.includes(query) || catStr.includes(query) || coursesStr.includes(query);
                let matchesCategory = !category;
                if (category) {
                    const catLower = category.toLowerCase();
                    const catsList = Array.isArray(c.categories) ? c.categories.map(s => String(s).toLowerCase()) : [String(c.category || '').toLowerCase()];
                    matchesCategory = catsList.some(s => s.includes(catLower) || catLower.includes(s));
                }
                return matchesQuery && matchesCategory;
            });

            if (filtered.length === 0) {
                grid.innerHTML = `
                    <div style="grid-column: 1/-1; text-align: center; padding: 60px 20px; background: #fff; border-radius: 12px; border: 1px dashed #cbd5e1;">
                        <i class="fa fa-building-o" style="font-size: 38px; color: #94a3b8; margin-bottom: 12px; display: block;"></i>
                        <h3 style="font-size: 17px; color: #1e293b; margin-bottom: 6px;">No colleges found</h3>
                        <p style="font-size: 13px; color: #64748b; margin-bottom: 18px;">Try adjusting your search criteria or add a new college.</p>
                        <button class="btn btn-primary" onclick="window.openCollegeModal()" style="background:#10b981; border-color:#10b981;"><i class="fa fa-plus"></i> Add New College</button>
                    </div>
                `;
                return;
            }

            grid.innerHTML = filtered.map(c => {
                const cName = c.name || 'Untitled College';
                const accreditations = Array.isArray(c.accreditation) ? c.accreditation.join(', ') : (c.accreditation || 'UGC Approved');
                const cats = Array.isArray(c.categories) && c.categories.length > 0 ? c.categories : [c.category || 'General'];
                const coursesList = Array.isArray(c.courses) ? c.courses : (c.courses ? String(c.courses).split(',').map(s => s.trim()) : ['Degree Programs']);
                const coursesSummary = coursesList.slice(0, 3).join(', ') + (coursesList.length > 3 ? ` +${coursesList.length - 3} more` : '');
                const cDesc = c.description ? String(c.description).slice(0, 95) + '...' : 'Premier institution offering state-of-the-art campus and placement assistance.';

                return `
                    <div class="content-card">
                        ${c.featured ? '<span class="card-badge-new" style="background:#10b981;"><i class="fa fa-star"></i> Featured</span>' : ''}
                        <div class="card-img">
                            <img src="${c.image || 'images/courses/1.jpg'}" alt="${escapeHtml(cName)}" onerror="this.src='${getRelativePath('images/courses/1.jpg')}'">
                            <span class="card-category" style="background:#10b981;">${escapeHtml(cats[0])}</span>
                        </div>
                        <div class="card-body">
                            <h3 class="card-title">${escapeHtml(cName)}</h3>
                            ${cats.length > 1 ? `
                                <div style="display:flex; flex-wrap:wrap; gap:4px; margin-bottom:8px;">
                                    ${cats.map(cat => `<span style="background:#ecfdf5; color:#065f46; font-size:10.5px; font-weight:700; padding:2px 7px; border-radius:4px; border:1px solid #a7f3d0;">${escapeHtml(cat)}</span>`).join('')}
                                </div>
                            ` : ''}
                            <div class="card-specs">
                                <div><span>Location:</span> <strong>${escapeHtml(c.location || 'India')}</strong></div>
                                <div><span>Approvals:</span> <strong>${escapeHtml(accreditations)}</strong></div>
                                <div><span>Rating:</span> <strong style="color:#f59e0b;"><i class="fa fa-star"></i> ${c.rating || 4.8} / 5.0</strong></div>
                                <div><span>Fee Est.:</span> <strong style="color:#10b981;">${escapeHtml(c.fee || 'Contact for fee')}</strong></div>
                                <div><span>Courses:</span> <strong style="color:#0f172a; font-size:11.5px;">${escapeHtml(coursesSummary)}</strong></div>
                            </div>
                            <p class="card-desc">${escapeHtml(cDesc)}</p>
                            <div class="card-footer">
                                <a href="${getRelativePath('colleges.html')}" target="_blank" class="btn btn-sm btn-outline" style="border-color:#10b981; color:#10b981;" title="Preview on Directory">
                                    <i class="fa fa-external-link"></i> View Directory
                                </a>
                                <div style="display:flex; gap:6px;">
                                    <button class="btn btn-sm btn-outline" onclick="window.editCollege('${c.id}')" title="Edit College">
                                        <i class="fa fa-pencil" style="color:#0ea5e9;"></i> Edit
                                    </button>
                                    <button class="btn btn-sm btn-outline" onclick="window.deleteCollege('${c.id}')" title="Delete College">
                                        <i class="fa fa-trash" style="color:#ef4444;"></i> Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
        } catch(e) {
            console.error('[RenderColleges] Error:', e);
        }
    }

    // ================= RENDER 3: UNIVERSITIES =================
    function renderUniversities() {
        const searchInput = document.getElementById('univSearch');
        const filterSelect = document.getElementById('univModeFilter');
        const grid = document.getElementById('universitiesGrid');
        if (!grid) return;

        try {
            const query = (searchInput ? searchInput.value : '').toLowerCase().trim();
            const mode = filterSelect ? filterSelect.value : '';

            const univList = Array.isArray(universities) ? universities.filter(Boolean) : [];
            const filtered = univList.filter(u => {
                const nameStr = String(u.name || '').toLowerCase();
                const locStr = String(u.location || '').toLowerCase();
                const typeStr = String(u.type || '').toLowerCase();
                const streamsStr = Array.isArray(u.streams) ? u.streams.join(' ').toLowerCase() : String(u.streams || '').toLowerCase();
                const matchesQuery = !query || nameStr.includes(query) || locStr.includes(query) || typeStr.includes(query) || streamsStr.includes(query);
                let matchesMode = true;
                if (mode) {
                    const modesStr = Array.isArray(u.modes) ? u.modes.join(' ') : String(u.modes || '');
                    matchesMode = modesStr.toLowerCase().includes(mode.toLowerCase()) || typeStr.includes(mode.toLowerCase());
                }
                return matchesQuery && matchesMode;
            });

            if (filtered.length === 0) {
                grid.innerHTML = `
                    <div style="grid-column: 1/-1; text-align: center; padding: 60px 20px; background: #fff; border-radius: 12px; border: 1px dashed #cbd5e1;">
                        <i class="fa fa-university" style="font-size: 38px; color: #94a3b8; margin-bottom: 12px; display: block;"></i>
                        <h3 style="font-size: 17px; color: #1e293b; margin-bottom: 6px;">No partner universities found</h3>
                        <p style="font-size: 13px; color: #64748b; margin-bottom: 18px;">Try adjusting your search criteria or add a new university.</p>
                        <button class="btn btn-primary" onclick="window.openUnivModal()" style="background:#8b5cf6; border-color:#8b5cf6;"><i class="fa fa-plus"></i> Add New University</button>
                    </div>
                `;
                return;
            }

            grid.innerHTML = filtered.map(u => {
                const uName = u.name || 'Untitled University';
                const approvalsStr = Array.isArray(u.approvals) ? u.approvals.join(', ') : (u.approvals || 'UGC / AICTE Approved');
                const modesStr = Array.isArray(u.modes) ? u.modes.join(' / ') : (u.modes || 'Online / Distance');
                const streamsList = Array.isArray(u.streams) ? u.streams : (u.popularStreams ? String(u.popularStreams).split(',').map(s => s.trim()) : ['Management', 'Arts']);
                const coursesList = Array.isArray(u.courses) ? u.courses : (u.courses ? String(u.courses).split(',').map(s => s.trim()) : []);
                const uDesc = u.description ? String(u.description).slice(0, 95) + '...' : 'Fully recognized university partner offering online and regular degree programs.';

                return `
                    <div class="content-card">
                        ${u.featured ? '<span class="card-badge-new" style="background:#8b5cf6;"><i class="fa fa-check-circle"></i> UGC Partner</span>' : ''}
                        <div class="card-img">
                            <img src="${u.image || 'images/slider/home1/slide1.jpg'}" alt="${escapeHtml(uName)}" onerror="this.src='${getRelativePath('images/slider/home1/slide1.jpg')}'">
                            <span class="card-category" style="background:#8b5cf6;">${escapeHtml(u.type || 'University')}</span>
                        </div>
                        <div class="card-body">
                            <h3 class="card-title">${escapeHtml(uName)}</h3>
                            ${streamsList.length > 0 ? `
                                <div style="display:flex; flex-wrap:wrap; gap:4px; margin-bottom:8px;">
                                    ${streamsList.slice(0, 4).map(st => `<span style="background:#f5f3ff; color:#6d28d9; font-size:10.5px; font-weight:700; padding:2px 7px; border-radius:4px; border:1px solid #ddd6fe;">${escapeHtml(st)}</span>`).join('')}
                                </div>
                            ` : ''}
                            <div class="card-specs">
                                <div><span>Approvals:</span> <strong>${escapeHtml(approvalsStr)}</strong></div>
                                <div><span>Learning Modes:</span> <strong>${escapeHtml(modesStr)}</strong></div>
                                <div><span>Accreditation:</span> <strong style="color:#8b5cf6;">${escapeHtml(u.naac || 'NAAC Accredited')}</strong></div>
                                <div><span>Location:</span> <strong>${escapeHtml(u.location || 'India')}</strong></div>
                                ${coursesList.length > 0 ? `<div><span>Degrees:</span> <strong style="color:#0f172a; font-size:11.5px;">${escapeHtml(coursesList.slice(0, 3).join(', ') + (coursesList.length > 3 ? ` +${coursesList.length - 3}` : ''))}</strong></div>` : ''}
                            </div>
                            <p class="card-desc">${escapeHtml(uDesc)}</p>
                            <div class="card-footer">
                                <a href="${getRelativePath('universities.html')}" target="_blank" class="btn btn-sm btn-outline" style="border-color:#8b5cf6; color:#8b5cf6;" title="Preview on Directory">
                                    <i class="fa fa-external-link"></i> View Directory
                                </a>
                                <div style="display:flex; gap:6px;">
                                    <button class="btn btn-sm btn-outline" onclick="window.editUniv('${u.id}')" title="Edit University">
                                        <i class="fa fa-pencil" style="color:#0ea5e9;"></i> Edit
                                    </button>
                                    <button class="btn btn-sm btn-outline" onclick="window.deleteUniv('${u.id}')" title="Delete University">
                                        <i class="fa fa-trash" style="color:#ef4444;"></i> Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
        } catch(e) {
            console.error('[RenderUniversities] Error:', e);
        }
    }

    // ================= RENDER 4: BLOGS =================
    function renderBlogs() {
        const searchInput = document.getElementById('blogSearch');
        const filterSelect = document.getElementById('blogCategoryFilter');
        const grid = document.getElementById('blogsGrid');
        if (!grid) return;

        try {
            const query = (searchInput ? searchInput.value : '').toLowerCase().trim();
            const category = filterSelect ? filterSelect.value : '';

            const blogList = Array.isArray(blogs) ? blogs.filter(Boolean) : [];
            const filtered = blogList.filter(b => {
                const titleStr = String(b.title || '').toLowerCase();
                const catStr = String(b.category || '').toLowerCase();
                const excerptStr = String(b.excerpt || '').toLowerCase();
                const matchesQuery = !query || titleStr.includes(query) || catStr.includes(query) || excerptStr.includes(query);
                const matchesCategory = !category || b.category === category;
                return matchesQuery && matchesCategory;
            });

            if (filtered.length === 0) {
                grid.innerHTML = `
                    <div style="grid-column: 1/-1; text-align: center; padding: 60px 20px; background: #fff; border-radius: 12px; border: 1px dashed #cbd5e1;">
                        <i class="fa fa-newspaper-o" style="font-size: 38px; color: #94a3b8; margin-bottom: 12px; display: block;"></i>
                        <h3 style="font-size: 17px; color: #1e293b; margin-bottom: 6px;">No blog posts found</h3>
                        <p style="font-size: 13px; color: #64748b; margin-bottom: 18px;">Try adjusting your search criteria or create a new blog post.</p>
                        <button class="btn btn-primary" onclick="window.openBlogModal()"><i class="fa fa-plus"></i> Add New Blog</button>
                    </div>
                `;
                return;
            }

            grid.innerHTML = filtered.map(b => {
                const bTitle = b.title || 'Untitled Blog';
                const bDesc = b.excerpt || (b.content ? String(b.content).replace(/<[^>]+>/g, '').slice(0, 110) + '...' : '');
                return `
                <div class="content-card">
                    <div class="card-img">
                        <img src="${b.image || 'images/blog/1.jpg'}" alt="${escapeHtml(bTitle)}" onerror="this.src='${getRelativePath('images/blog/1.jpg')}'">
                        <span class="card-category">${escapeHtml(b.category || 'General')}</span>
                    </div>
                    <div class="card-body">
                        <h3 class="card-title">${escapeHtml(bTitle)}</h3>
                        <div class="card-meta">
                            <span><i class="fa fa-user"></i> ${escapeHtml(b.author || 'EducationistGuru')}</span>
                            <span><i class="fa fa-calendar"></i> ${escapeHtml(b.date || 'Recent')}</span>
                            <span><i class="fa fa-comments"></i> ${b.commentsCount || 0}</span>
                        </div>
                        <p class="card-desc">${escapeHtml(bDesc)}</p>
                        <div class="card-footer">
                            <a href="${getRelativePath('blog-details.html')}?id=${b.id}" target="_blank" class="btn btn-sm btn-outline" title="Preview on Website">
                                <i class="fa fa-external-link"></i> Preview
                            </a>
                            <div style="display:flex; gap:6px;">
                                <button class="btn btn-sm btn-outline" onclick="window.editBlog('${b.id}')" title="Edit Blog">
                                    <i class="fa fa-pencil" style="color:#0ea5e9;"></i> Edit
                                </button>
                                <button class="btn btn-sm btn-outline" onclick="window.deleteBlog('${b.id}')" title="Delete Blog">
                                    <i class="fa fa-trash" style="color:#ef4444;"></i> Delete
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `}).join('');
        } catch(e) {
            console.error('[RenderBlogs] Error:', e);
        }
    }

    // ================= RENDER 5: YOUTUBE =================
    function renderVideos() {
        const searchInput = document.getElementById('videoSearch');
        const filterSelect = document.getElementById('videoCategoryFilter');
        const grid = document.getElementById('videosGrid');
        if (!grid) return;

        try {
            const query = (searchInput ? searchInput.value : '').toLowerCase().trim();
            const category = filterSelect ? filterSelect.value : '';

            const videoList = Array.isArray(videos) ? videos.filter(Boolean) : [];
            const filtered = videoList.filter(v => {
                const titleStr = String(v.title || '').toLowerCase();
                const catStr = String(v.category || '').toLowerCase();
                const descStr = String(v.description || '').toLowerCase();
                const matchesQuery = !query || titleStr.includes(query) || catStr.includes(query) || descStr.includes(query);
                const matchesCategory = !category || v.category === category;
                return matchesQuery && matchesCategory;
            });

            if (filtered.length === 0) {
                grid.innerHTML = `
                    <div style="grid-column: 1/-1; text-align: center; padding: 60px 20px; background: #fff; border-radius: 12px; border: 1px dashed #cbd5e1;">
                        <i class="fa fa-youtube-play" style="font-size: 38px; color: #ef4444; margin-bottom: 12px; display: block;"></i>
                        <h3 style="font-size: 17px; color: #1e293b; margin-bottom: 6px;">No YouTube videos found</h3>
                        <p style="font-size: 13px; color: #64748b; margin-bottom: 18px;">Add official channel videos or tutorials for students.</p>
                        <button class="btn btn-primary" onclick="window.openVideoModal()" style="background:#ef4444; border-color:#ef4444;"><i class="fa fa-plus"></i> Add YouTube Video</button>
                    </div>
                `;
                return;
            }

            grid.innerHTML = filtered.map(v => {
                const vTitle = v.title || 'Untitled Video';
                const vId = v.videoId || '';
                const vThumb = v.thumbnail || (vId ? `https://img.youtube.com/vi/${vId}/hqdefault.jpg` : 'images/courses/1.jpg');
                const vUrl = v.url || (vId ? `https://www.youtube.com/watch?v=${vId}` : '#');
                const vDesc = v.description ? String(v.description) : 'Watch the comprehensive video guide on our official YouTube channel.';

                return `
                <div class="content-card">
                    ${v.featured ? '<span class="card-badge-new" style="background:#ef4444;"><i class="fa fa-youtube-play"></i> Featured Video</span>' : ''}
                    <div class="card-img" style="position:relative;">
                        <img src="${vThumb}" alt="${escapeHtml(vTitle)}" onerror="this.src='https://img.youtube.com/vi/${vId}/hqdefault.jpg'">
                        <span class="card-category" style="background:#ef4444;">${escapeHtml(v.category || 'Video')}</span>
                        <span style="position:absolute; bottom:8px; right:8px; background:rgba(0,0,0,0.8); color:#fff; font-size:11px; font-weight:700; padding:2px 6px; border-radius:4px;"><i class="fa fa-clock-o"></i> ${escapeHtml(v.duration || 'Video')}</span>
                    </div>
                    <div class="card-body">
                        <h3 class="card-title">${escapeHtml(vTitle)}</h3>
                        <p class="card-desc">${escapeHtml(vDesc)}</p>
                        <div class="card-footer">
                            <a href="${vUrl}" target="_blank" class="btn btn-sm btn-outline" style="border-color:#ef4444; color:#ef4444;" title="Watch on YouTube">
                                <i class="fa fa-youtube-play"></i> Watch Video
                            </a>
                            <div style="display:flex; gap:6px;">
                                <button class="btn btn-sm btn-outline" onclick="window.deleteVideo('${v.id}')" title="Delete Video">
                                    <i class="fa fa-trash" style="color:#ef4444;"></i> Delete
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `}).join('');
        } catch(e) {
            console.error('[RenderVideos] Error:', e);
        }
    }

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

    // ================= MODALS & CRUD OPERATIONS =================

    // ================= 7-POINT STRUCTURED COURSE EDITOR CONTROLLER =================
    let courseTagsList = [];
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
    let univFacilitiesList = [];

    function renderCourseChips(containerId, list, type) {
        renderUniversalChips(containerId, list, 'course', type);
    }

    function renderUniversalChips(containerId, list, entity, type) {
        const container = document.getElementById(containerId);
        if (!container) return;
        if (!list || list.length === 0) {
            container.innerHTML = `<span style="font-size:11.5px; color:#94a3b8; font-style:italic;">No ${type} added yet. Type above and click +</span>`;
            return;
        }
        container.innerHTML = list.map((item, idx) => `
            <span class="chip-pill">
                ${escapeHtml(item)}
                <button type="button" class="chip-remove" onclick="window.removeChip('${entity}', '${type}', ${idx})" title="Remove">&times;</button>
            </span>
        `).join('');
    }

    window.addChip = function(entity, type) {
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
                showToast(`Added ${facilityName}`, 'info');
            } else {
                showToast(`${facilityName} already in list`, 'info');
            }
        }
    };

    // Gallery Row Repeater
    window.addGalleryRow = function(entity, initialSrc = '') {
        const container = document.getElementById(`${entity}GalleryRows`);
        if (!container) return;
        const rowId = 'gal_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4);
        const div = document.createElement('div');
        div.className = 'gallery-item-row';
        div.id = rowId;
        div.style.cssText = 'display:flex; align-items:center; gap:8px; background:#f8fafc; padding:8px 10px; border-radius:8px; border:1px solid #e2e8f0;';
        div.innerHTML = `
            <img src="${initialSrc || 'images/courses/1.jpg'}" alt="Preview" style="width:42px; height:42px; object-fit:cover; border-radius:6px; border:1px solid #cbd5e1; flex-shrink:0;" onerror="this.src='/images/courses/1.jpg'">
            <input type="text" class="form-control form-control-sm gallery-img-url" value="${escapeHtml(initialSrc)}" placeholder="images/courses/2.jpg or https://..." style="flex:1;" oninput="this.previousElementSibling.src = this.value || 'images/courses/1.jpg'">
            <button type="button" class="btn btn-sm btn-outline text-danger" onclick="document.getElementById('${rowId}').remove()" title="Delete Image" style="padding:2px 8px; font-weight:700;">&times;</button>
        `;
        container.appendChild(div);
    };

    function getGalleryImagesFromDOM(entity) {
        const container = document.getElementById(`${entity}GalleryRows`);
        if (!container) return [];
        const inputs = container.querySelectorAll('.gallery-img-url');
        return Array.from(inputs).map(inp => inp.value.trim()).filter(Boolean);
    }

    // ================= VISUAL WYSIWYG DOCUMENT ENGINE =================
    const savedSelections = {};

    function saveEditorSelection(editorId) {
        const sel = window.getSelection();
        if (sel && sel.rangeCount > 0) {
            const range = sel.getRangeAt(0);
            const editor = document.getElementById(editorId);
            if (editor && editor.contains(range.commonAncestorContainer)) {
                savedSelections[editorId] = range.cloneRange();
            }
        }
    }

    function restoreEditorSelection(editorId) {
        const editor = document.getElementById(editorId);
        if (!editor) return;
        editor.focus();
        const savedRange = savedSelections[editorId];
        if (savedRange) {
            const sel = window.getSelection();
            if (sel) {
                sel.removeAllRanges();
                sel.addRange(savedRange);
            }
        }
    }

    function initVisualEditorEvents(editorId) {
        const editor = document.getElementById(editorId);
        if (!editor || editor.dataset.initialized) return;
        editor.dataset.initialized = 'true';
        ['keyup', 'mouseup', 'touchend', 'input', 'focus'].forEach(evt => {
            editor.addEventListener(evt, () => saveEditorSelection(editorId));
        });
        editor.addEventListener('paste', (e) => {
            e.preventDefault();
            const text = (e.clipboardData || window.clipboardData).getData('text/plain');
            document.execCommand('insertText', false, text);
            saveEditorSelection(editorId);
        });
    }

    window.applyHeadingStyle = function(editorId, tag) {
        const editor = document.getElementById(editorId);
        if (!editor) return;
        initVisualEditorEvents(editorId);
        restoreEditorSelection(editorId);

        const sel = window.getSelection();
        const isCollapsed = !sel || sel.isCollapsed || sel.rangeCount === 0;

        // If editor is completely empty
        if (isCollapsed && (!editor.innerText.trim() || !editor.childNodes.length)) {
            const blockTag = tag.toLowerCase();
            const placeholder = blockTag === 'p' ? 'Start typing paragraph here...' : `Heading ${blockTag.replace('h', '')} Title`;
            editor.innerHTML = `<${blockTag}>${placeholder}</${blockTag}>`;
            const range = document.createRange();
            range.selectNodeContents(editor.firstChild);
            sel.removeAllRanges();
            sel.addRange(range);
            saveEditorSelection(editorId);
            return;
        }

        try {
            const formatted = document.execCommand('formatBlock', false, `<${tag}>`);
            if (!formatted) {
                document.execCommand('formatBlock', false, tag);
            }
        } catch (err) {
            console.warn('formatBlock error:', err);
        }
        saveEditorSelection(editorId);
    };

    window.execEditorCmd = function(editorId, cmd, val = null) {
        const editor = document.getElementById(editorId);
        if (!editor) return;
        initVisualEditorEvents(editorId);
        restoreEditorSelection(editorId);
        document.execCommand(cmd, false, val);
        saveEditorSelection(editorId);
    };

    window.insertVisualInquiryBox = function(editorId) {
        const editor = document.getElementById(editorId);
        if (!editor) return;
        initVisualEditorEvents(editorId);
        restoreEditorSelection(editorId);

        const boxHtml = `
            <div class="lead-inquiry-box" contenteditable="false" style="margin: 22px 0; padding: 18px 22px; background: #fff7ed; border: 1.5px solid #fed7aa; border-left: 5px solid #ff6b00; border-radius: 12px; box-shadow: 0 4px 15px rgba(255, 107, 0, 0.08);">
                <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                    <div>
                        <h4 style="margin: 0 0 6px; font-size: 17px; font-weight: 800; color: #9a3412;"><i class="fa fa-graduation-cap" style="margin-right:6px; color:#ea580c;"></i> Direct Admission Guidance &amp; Counseling</h4>
                        <p style="margin: 0 0 12px; font-size: 14px; color: #7c2d12; line-height: 1.5;">Connect directly with authorized counselors for Subharti University &amp; partner university admissions, eligibility verification, and fee structure guidance.</p>
                    </div>
                    <button type="button" onclick="this.closest('.lead-inquiry-box').remove()" style="background:none; border:none; color:#ea580c; font-size:20px; line-height:1; cursor:pointer; padding:0 4px;" title="Delete box">&times;</button>
                </div>
                <div style="display:flex; gap:10px; flex-wrap:wrap; align-items:center;">
                    <a href="contact.html" style="background:#ea580c; color:#ffffff !important; padding:8px 18px; border-radius:6px; font-weight:700; font-size:13px; text-decoration:none; display:inline-flex; align-items:center; gap:6px;"><i class="fa fa-phone"></i> Inquire Direct Admission</a>
                    <a href="https://wa.me/918750477000?text=Hello%20Educationist%20Guru%2C%20I%20want%20Subharti%20University%20Admission%20Details" target="_blank" style="background:#25d366; color:#ffffff !important; padding:8px 18px; border-radius:6px; font-weight:700; font-size:13px; text-decoration:none; display:inline-flex; align-items:center; gap:6px;"><i class="fa fa-whatsapp"></i> WhatsApp Advisor</a>
                </div>
            </div>
            <p><br></p>
        `;
        document.execCommand('insertHTML', false, boxHtml);
        saveEditorSelection(editorId);
    };

    window.clearEditorFormatting = function(editorId) {
        const editor = document.getElementById(editorId);
        if (!editor) return;
        initVisualEditorEvents(editorId);
        restoreEditorSelection(editorId);
        document.execCommand('removeFormat', false, null);
        document.execCommand('formatBlock', false, '<p>');
        saveEditorSelection(editorId);
    };

    // Backward compatibility shim
    window.insertEditorTag = function(targetId, tag) {
        const visualTarget = targetId === 'courseDescriptionInput' ? 'courseVisualEditor' : (targetId === 'blogContentInput' ? 'blogVisualEditor' : null);
        if (visualTarget && document.getElementById(visualTarget)) {
            if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p'].includes(tag)) {
                window.applyHeadingStyle(visualTarget, tag);
            } else if (['b', 'i', 'u'].includes(tag)) {
                const cmd = tag === 'b' ? 'bold' : (tag === 'i' ? 'italic' : 'underline');
                window.execEditorCmd(visualTarget, cmd);
            } else if (tag === 'ul') {
                window.execEditorCmd(visualTarget, 'insertUnorderedList');
            } else if (tag === 'lead-form') {
                window.insertVisualInquiryBox(visualTarget);
            }
        }
    };
    window.toggleEditorPreview = function() {};

    
    // Fullscreen, Table, Notice, Link, Highlights & Creative WYSIWYG Tools
    window.toggleEditorFullscreen = function(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        container.classList.toggle('fullscreen-editor');
        const isFull = container.classList.contains('fullscreen-editor');
        document.body.classList.toggle('has-fullscreen-editor', isFull);

        const modal = container.closest('.modal-overlay');
        if (modal) {
            modal.classList.toggle('fullscreen-modal-active', isFull);
        }

        const editorCard = container.closest('.form-section-card') || container.closest('.form-group');
        if (editorCard) {
            editorCard.classList.toggle('fullscreen-editor-card', isFull);
        }

        const btnId = containerId === 'courseEditorContainer' ? 'courseFullscreenBtn' : 'blogFullscreenBtn';
        const btn = document.getElementById(btnId) || container.querySelector('[id$="FullscreenBtn"]');
        if (btn) {
            btn.innerHTML = isFull ? '<i class="fa fa-compress"></i> 🗗 Minimize Fullscreen' : '<i class="fa fa-arrows-alt"></i> ⛶ Fullscreen';
            btn.style.background = isFull ? '#ef4444' : '#3b82f6';
            btn.style.borderColor = isFull ? '#dc2626' : '#2563eb';
        }
    };

    // Global listener to cleanly exit fullscreen on Escape key
    if (!window._editorEscapeListenerAttached) {
        window._editorEscapeListenerAttached = true;
        window.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && document.body.classList.contains('has-fullscreen-editor')) {
                const openFullContainer = document.querySelector('.visual-editor-container.fullscreen-editor');
                if (openFullContainer && openFullContainer.id) {
                    window.toggleEditorFullscreen(openFullContainer.id);
                }
            }
        });
    }

    window.insertEditorHighlight = function(editorId, color = 'yellow') {
        const editor = document.getElementById(editorId);
        if (!editor) return;
        initVisualEditorEvents(editorId);
        restoreEditorSelection(editorId);
        
        const sel = window.getSelection();
        const selectedText = sel && sel.toString() ? sel.toString() : 'highlighted key fact';
        const hlHtml = `<mark class="hl-${color}">${escapeHtml(selectedText)}</mark>`;
        document.execCommand('insertHTML', false, hlHtml);
        saveEditorSelection(editorId);
        if (window.updateEditorStats) window.updateEditorStats(editorId);
    };

    window.insertEditorKeyHighlights = function(editorId) {
        const editor = document.getElementById(editorId);
        if (!editor) return;
        initVisualEditorEvents(editorId);
        restoreEditorSelection(editorId);

        const gridHtml = `
            <div class="editorial-key-highlights" contenteditable="false" style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin:18px 0;">
                <div class="editorial-highlight-card blue" style="background:#eff6ff; border:1px solid #bfdbfe; border-radius:8px; padding:12px 14px;">
                    <div class="editorial-highlight-title" style="font-weight:700; font-size:13.5px; color:#1e40af;"><i class="fa fa-clock-o" style="color:#2563eb; margin-right:4px;"></i> Program Duration &amp; Mode</div>
                    <div class="editorial-highlight-desc" style="font-size:13px; color:#334155;">2 to 3 Years | 100% Online &amp; Distance Learning approved by UGC-DEB</div>
                </div>
                <div class="editorial-highlight-card emerald" style="background:#ecfdf5; border:1px solid #a7f3d0; border-radius:8px; padding:12px 14px;">
                    <div class="editorial-highlight-title" style="font-weight:700; font-size:13.5px; color:#065f46;"><i class="fa fa-shield" style="color:#059669; margin-right:4px;"></i> UGC-DEB &amp; NAAC Validated</div>
                    <div class="editorial-highlight-desc" style="font-size:13px; color:#334155;">Valid for Government Services, UPSC, Corporate MNCs &amp; Overseas Education</div>
                </div>
                <div class="editorial-highlight-card amber" style="background:#fffbeb; border:1px solid #fde68a; border-radius:8px; padding:12px 14px;">
                    <div class="editorial-highlight-title" style="font-weight:700; font-size:13.5px; color:#92400e;"><i class="fa fa-graduation-cap" style="color:#d97706; margin-right:4px;"></i> Eligibility Criteria</div>
                    <div class="editorial-highlight-desc" style="font-size:13px; color:#334155;">Graduation / 10+2 from recognized council or board with passing marks</div>
                </div>
                <div class="editorial-highlight-card" style="background:#fdf2f8; border:1px solid #fbcfe8; border-radius:8px; padding:12px 14px;">
                    <div class="editorial-highlight-title" style="font-weight:700; font-size:13.5px; color:#9d174d;"><i class="fa fa-briefcase" style="color:#db2777; margin-right:4px;"></i> Career &amp; Placement Scope</div>
                    <div class="editorial-highlight-desc" style="font-size:13px; color:#334155;">Managerial roles, Technical leads, and Executive promotion pathways</div>
                </div>
            </div>
            <p><br></p>
        `;
        document.execCommand('insertHTML', false, gridHtml);
        saveEditorSelection(editorId);
        if (window.updateEditorStats) window.updateEditorStats(editorId);
    };

    window.insertEditorFaq = function(editorId) {
        const editor = document.getElementById(editorId);
        if (!editor) return;
        initVisualEditorEvents(editorId);
        restoreEditorSelection(editorId);

        const faqHtml = `
            <div class="editorial-faq-box" style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px; padding:14px 18px; margin:16px 0;">
                <div class="editorial-faq-q" style="font-weight:800; color:#0f172a; font-size:15px; margin-bottom:6px; display:flex; align-items:center; gap:8px;">
                    <i class="fa fa-question-circle" style="color:#ff3115;"></i>
                    <span>Is this degree approved by UGC-DEB and valid for government employment?</span>
                </div>
                <p class="editorial-faq-a" style="color:#475569; font-size:14px; line-height:1.6; margin:0;">
                    Yes, degrees awarded by partner universities are recognized by the University Grants Commission (UGC) and the Distance Education Bureau (DEB). They hold equal standing to conventional campus degrees for UPSC, SSC, state civil services, and PSU promotions.
                </p>
            </div>
            <p><br></p>
        `;
        document.execCommand('insertHTML', false, faqHtml);
        saveEditorSelection(editorId);
        if (window.updateEditorStats) window.updateEditorStats(editorId);
    };

    window.insertEditorQuote = function(editorId) {
        const editor = document.getElementById(editorId);
        if (!editor) return;
        initVisualEditorEvents(editorId);
        restoreEditorSelection(editorId);

        const quoteHtml = `
            <div class="editorial-quote-box" style="border-left:4px solid #ff3115; background:#fff7ed; padding:14px 20px; margin:18px 0; border-radius:0 8px 8px 0; font-style:italic; color:#7c2d12;">
                <p style="margin:0; font-size:15px; line-height:1.6;">"Modern higher education enables professionals to continuously upgrade capabilities without interrupting their professional tenure or personal commitments."</p>
                <div class="editorial-quote-author" style="font-style:normal; font-weight:700; color:#9a3412; font-size:13px; margin-top:8px;">&mdash; EducationistGuru Academic Advisory Cell</div>
            </div>
            <p><br></p>
        `;
        document.execCommand('insertHTML', false, quoteHtml);
        saveEditorSelection(editorId);
        if (window.updateEditorStats) window.updateEditorStats(editorId);
    };

    window.insertEditorImage = function(editorId) {
        const editor = document.getElementById(editorId);
        if (!editor) return;
        initVisualEditorEvents(editorId);
        restoreEditorSelection(editorId);

        const url = prompt('Enter Image URL (or preset e.g. images/blog/1.jpg):', 'images/blog/1.jpg');
        if (!url) return;
        const caption = prompt('Enter descriptive image caption:', 'EducationistGuru Academic Campus & Guidance Center');

        const figureHtml = `
            <div class="editorial-figure" contenteditable="false" style="margin:20px 0; text-align:center;">
                <img src="${escapeHtml(url)}" alt="${escapeHtml(caption || 'Article illustration')}" style="max-width:100%; max-height:420px; border-radius:10px; box-shadow:0 6px 20px rgba(15,23,42,0.08);" onerror="this.src='images/blog/1.jpg'">
                ${caption ? `<div class="editorial-caption" style="font-size:12.5px; color:#64748b; font-style:italic; margin-top:8px;">${escapeHtml(caption)}</div>` : ''}
            </div>
            <p><br></p>
        `;
        document.execCommand('insertHTML', false, figureHtml);
        saveEditorSelection(editorId);
        if (window.updateEditorStats) window.updateEditorStats(editorId);
    };

    window.insertEditorDivider = function(editorId) {
        const editor = document.getElementById(editorId);
        if (!editor) return;
        initVisualEditorEvents(editorId);
        restoreEditorSelection(editorId);

        const dividerHtml = `<hr class="editorial-divider" style="border:none; height:1.5px; background:linear-gradient(90deg, transparent, #cbd5e1, transparent); margin:24px 0;"><p><br></p>`;
        document.execCommand('insertHTML', false, dividerHtml);
        saveEditorSelection(editorId);
        if (window.updateEditorStats) window.updateEditorStats(editorId);
    };

    window.insertEditorTemplate = function(editorId, type) {
        const editor = document.getElementById(editorId);
        if (!editor) return;
        initVisualEditorEvents(editorId);
        restoreEditorSelection(editorId);

        let templateHtml = '';

        if (type === 'course_guide') {
            templateHtml = `
                <h2>1. Comprehensive Program Overview &amp; Accreditations</h2>
                <p>Pursuing higher qualifications empowers aspiring scholars and working executives to achieve competitive advantages in today's evolving industrial ecosystem. This program provides foundational academic rigor coupled with real-world case simulations.</p>
                <div class="editorial-key-highlights" style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin:18px 0;">
                    <div class="editorial-highlight-card blue" style="background:#eff6ff; border:1px solid #bfdbfe; border-radius:8px; padding:12px 14px;">
                        <div class="editorial-highlight-title" style="font-weight:700; color:#1e40af;"><i class="fa fa-clock-o"></i> Program Duration</div>
                        <div class="editorial-highlight-desc">2 to 3 Years | Flexible Semester Cycles</div>
                    </div>
                    <div class="editorial-highlight-card emerald" style="background:#ecfdf5; border:1px solid #a7f3d0; border-radius:8px; padding:12px 14px;">
                        <div class="editorial-highlight-title" style="font-weight:700; color:#065f46;"><i class="fa fa-shield"></i> Government Approval</div>
                        <div class="editorial-highlight-desc">100% UGC-DEB &amp; AIU Recognized</div>
                    </div>
                </div>

                <h2>2. Detailed Curriculum &amp; Specialization Breakdown</h2>
                <p>The curriculum is designed under university board of studies guidance to deliver comprehensive mastery:</p>
                <table class="editorial-table" style="width:100%; border-collapse:collapse; margin:16px 0; border:1px solid #cbd5e1;">
                    <thead>
                        <tr style="background:#f1f5f9;">
                            <th style="border:1px solid #cbd5e1; padding:10px 14px; text-align:left;">Semester</th>
                            <th style="border:1px solid #cbd5e1; padding:10px 14px; text-align:left;">Subjects &amp; Electives</th>
                            <th style="border:1px solid #cbd5e1; padding:10px 14px; text-align:left;">Evaluation Mode</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td style="border:1px solid #cbd5e1; padding:10px 14px;">Semester 1</td>
                            <td style="border:1px solid #cbd5e1; padding:10px 14px;">Managerial Economics &amp; Corporate Ethics</td>
                            <td style="border:1px solid #cbd5e1; padding:10px 14px;">Assignments + Term Exam</td>
                        </tr>
                        <tr>
                            <td style="border:1px solid #cbd5e1; padding:10px 14px;">Semester 2</td>
                            <td style="border:1px solid #cbd5e1; padding:10px 14px;">Strategic Leadership &amp; Financial Analytics</td>
                            <td style="border:1px solid #cbd5e1; padding:10px 14px;">Project Dissertation</td>
                        </tr>
                    </tbody>
                </table>

                <h2>3. Important Admission Notice &amp; Eligibility</h2>
                <div class="editorial-notice-box" style="background:#eff6ff; border-left:4px solid #3b82f6; padding:14px 18px; border-radius:6px; margin:16px 0; color:#1e40af;">
                    <strong><i class="fa fa-info-circle"></i> Counselor Helpline:</strong> Candidates can confirm document eligibility and scholarship options directly before submitting payment.
                </div>

                <h2>4. Frequently Asked Questions</h2>
                <div class="editorial-faq-box" style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px; padding:14px 18px; margin:16px 0;">
                    <div class="editorial-faq-q" style="font-weight:800; color:#0f172a; margin-bottom:6px;"><i class="fa fa-question-circle" style="color:#ff3115;"></i> Can I study while continuing full-time employment?</div>
                    <p class="editorial-faq-a" style="color:#475569; margin:0;">Yes, learning management systems offer on-demand recorded video lectures, downloadable digital e-books, and weekend interactive doubt-clearing sessions.</p>
                </div>
            `;
        } else if (type === 'univ_review') {
            templateHtml = `
                <h2>1. University Accreditations &amp; Heritage</h2>
                <p>Recognized among India's progressive institutions, the university has pioneered accessible higher education for thousands of distance learners nationwide. Equipped with state-of-the-art LMS and expert faculty panels.</p>
                
                <div class="editorial-key-highlights" style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin:18px 0;">
                    <div class="editorial-highlight-card blue" style="background:#eff6ff; border:1px solid #bfdbfe; border-radius:8px; padding:12px 14px;">
                        <div class="editorial-highlight-title" style="font-weight:700; color:#1e40af;"><i class="fa fa-university"></i> Statutory Approvals</div>
                        <div class="editorial-highlight-desc">UGC, AIU, DEB &amp; NAAC Accredited</div>
                    </div>
                    <div class="editorial-highlight-card emerald" style="background:#ecfdf5; border:1px solid #a7f3d0; border-radius:8px; padding:12px 14px;">
                        <div class="editorial-highlight-title" style="font-weight:700; color:#065f46;"><i class="fa fa-wifi"></i> Campus Infrastructure</div>
                        <div class="editorial-highlight-desc">Modern Central Labs, E-Library &amp; LMS Portal</div>
                    </div>
                </div>

                <h2>2. Key Academic Streams &amp; Programs</h2>
                <p>Students can enroll across multiple recognized faculties with flexible semester installment options.</p>

                <h2>3. Dean's Academic Message</h2>
                <div class="editorial-quote-box" style="border-left:4px solid #ff3115; background:#fff7ed; padding:14px 20px; margin:18px 0; border-radius:0 8px 8px 0; font-style:italic; color:#7c2d12;">
                    "Our objective is to impart education that fosters critical thinking, technological adaptability, and leadership readiness across global domains."
                </div>
            `;
        } else if (type === 'admission_notice') {
            templateHtml = `
                <h2>1. Admissions Open for Current Academic Session</h2>
                <div class="editorial-notice-box" style="background:#eff6ff; border-left:4px solid #3b82f6; padding:14px 18px; border-radius:6px; margin:16px 0; color:#1e40af;">
                    <strong><i class="fa fa-bullhorn"></i> Important Announcement:</strong> University registration window is officially open. Direct seat allotments are processed on a first-cum-first-served basis.
                </div>

                <h2>2. Important Dates &amp; Deadlines Schedule</h2>
                <table class="editorial-table" style="width:100%; border-collapse:collapse; margin:16px 0; border:1px solid #cbd5e1;">
                    <thead>
                        <tr style="background:#f1f5f9;">
                            <th style="border:1px solid #cbd5e1; padding:10px 14px; text-align:left;">Admission Milestone</th>
                            <th style="border:1px solid #cbd5e1; padding:10px 14px; text-align:left;">Schedule / Date</th>
                            <th style="border:1px solid #cbd5e1; padding:10px 14px; text-align:left;">Counseling Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td style="border:1px solid #cbd5e1; padding:10px 14px;">Online Registration Begins</td>
                            <td style="border:1px solid #cbd5e1; padding:10px 14px;">1st of Current Month</td>
                            <td style="border:1px solid #cbd5e1; padding:10px 14px;"><span style="color:#16a34a; font-weight:700;">Open &bull; Active</span></td>
                        </tr>
                        <tr>
                            <td style="border:1px solid #cbd5e1; padding:10px 14px;">Document Verification &amp; Eligibility Check</td>
                            <td style="border:1px solid #cbd5e1; padding:10px 14px;">Instant (Within 24 Hours)</td>
                            <td style="border:1px solid #cbd5e1; padding:10px 14px;">Free Assessment</td>
                        </tr>
                    </tbody>
                </table>
            `;
        }

        if (templateHtml) {
            editor.innerHTML = templateHtml;
            saveEditorSelection(editorId);
            if (window.updateEditorStats) window.updateEditorStats(editorId);
        }
    };

    window.insertEditorTable = function(editorId) {
        const editor = document.getElementById(editorId);
        if (!editor) return;
        initVisualEditorEvents(editorId);
        restoreEditorSelection(editorId);

        const tableHtml = `
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
        `;
        document.execCommand('insertHTML', false, tableHtml);
        saveEditorSelection(editorId);
        if (window.updateEditorStats) window.updateEditorStats(editorId);
    };

    window.insertEditorNotice = function(editorId) {
        const editor = document.getElementById(editorId);
        if (!editor) return;
        initVisualEditorEvents(editorId);
        restoreEditorSelection(editorId);

        const noticeHtml = `
            <div class="editorial-notice-box" style="background:#eff6ff; border-left:4px solid #3b82f6; padding:14px 18px; border-radius:6px; margin:16px 0; color:#1e40af;">
                <p style="margin:0; font-size:14px; line-height:1.6;">
                    <strong style="color:#1d4ed8;"><i class="fa fa-info-circle"></i> Important Admission Notice:</strong> 
                    UGC-DEB approved admissions for current session are verified directly through university portals. Candidates can confirm equivalence before enrollment.
                </p>
            </div>
            <p><br></p>
        `;
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
        const words = text.trim() ? text.trim().split(/\s+/).length : 0;
        const chars = text.length;
        const readingTime = Math.max(1, Math.ceil(words / 200));

        const prefix = editorId === 'courseVisualEditor' ? 'course' : 'blog';
        const wEl = document.getElementById(`${prefix}WordCount`);
        const cEl = document.getElementById(`${prefix}CharCount`);
        const rEl = document.getElementById(`${prefix}ReadingTime`);
        if (wEl) wEl.textContent = `${words} words`;
        if (cEl) cEl.textContent = `${chars} characters`;
        if (rEl) rEl.textContent = `~${readingTime} min read`;
    };

    function updateFieldMetaCount(inputId, counterId) {
        const input = document.getElementById(inputId);
        const counter = document.getElementById(counterId);
        if (!input || !counter) return;
        const len = input.value.length;
        counter.textContent = `${len} / 160 characters`;
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

    // Live Meta Description Counter
    function updateCourseMetaCount() {
        const descInp = document.getElementById('courseMetaDescInput');
        const countEl = document.getElementById('courseMetaCount');
        if (descInp && countEl) {
            const len = descInp.value.length;
            countEl.textContent = `${len} / 160 characters`;
            if (len > 160) {
                countEl.style.color = '#ef4444';
            } else if (len >= 120) {
                countEl.style.color = '#10b981';
            } else {
                countEl.style.color = '#64748b';
            }
        }
    }

    // 1. COURSE MODAL
    window.openCourseModal = function(course = null) {
        editingCourseId = course ? course.id : null;
        const form = document.getElementById('courseForm');
        if (form && !course) form.reset();

        document.getElementById('courseModalTitle').textContent = course ? 'Edit Course' : 'Add New Course';
        document.getElementById('courseNameInput').value = course ? course.name : '';

        // 2. Meta Description
        const metaDescInp = document.getElementById('courseMetaDescInput');
        if (metaDescInp) {
            metaDescInp.value = course ? (course.metaDescription || '') : '';
            updateCourseMetaCount();
            metaDescInp.oninput = updateCourseMetaCount;
        }

        // 3, 4, 5. Tags, Categories, Keywords chips
        courseTagsList = course && Array.isArray(course.tags) ? [...course.tags] : (course && course.tags ? String(course.tags).split(',').map(s=>s.trim()).filter(Boolean) : []);
        renderCourseChips('courseTagsChips', courseTagsList, 'tag');

        courseCategoriesList = course && Array.isArray(course.categories) ? [...course.categories] : (course && course.faculty ? [course.faculty] : ['Management']);
        renderCourseChips('courseCategoriesChips', courseCategoriesList, 'cat');

        courseKeywordsList = course && Array.isArray(course.keywords) ? [...course.keywords] : (course && course.keywords ? String(course.keywords).split(',').map(s=>s.trim()).filter(Boolean) : []);
        renderCourseChips('courseKeywordsChips', courseKeywordsList, 'kw');

        // Setup Enter key on chip inputs
        const tagInput = document.getElementById('courseTagInput');
        if (tagInput) {
            tagInput.value = '';
            tagInput.onkeydown = (e) => { if (e.key === 'Enter') { e.preventDefault(); window.addChip('course', 'tag'); } };

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
            if (uMetaInp) uMetaInp.addEventListener('input', window.updateUnivMetaCount);
        }
        const catInput = document.getElementById('courseCategoryInput');
        if (catInput) {
            catInput.value = '';
            catInput.onkeydown = (e) => { if (e.key === 'Enter') { e.preventDefault(); window.addChip('course', 'cat'); } };
        }
        const kwInput = document.getElementById('courseKeywordInput');
        if (kwInput) {
            kwInput.value = '';
            kwInput.onkeydown = (e) => { if (e.key === 'Enter') { e.preventDefault(); window.addChip('course', 'kw'); } };
        }

        // Academic Metadata
        document.getElementById('courseFacultyInput').value = course ? course.faculty : (courseCategoriesList[0] || 'Faculty of Commerce & Management');
        document.getElementById('courseDurationInput').value = course ? course.duration : '3 Years';
        document.getElementById('courseEligibilityInput').value = course ? course.eligibility : '10+2 or equivalent in relevant stream';
        document.getElementById('courseModeInput').value = course ? course.mode : 'Online / Regular / Distance';
        document.getElementById('courseFeeInput').value = course ? course.fee : 'Contact for fee schedule';

        // 6. Feature Image & Gallery
        document.getElementById('courseImageInput').value = course ? course.image : 'images/courses/1.jpg';
        window.updateThumbPreview('courseImagePreview', 'courseImageInput', course ? course.image : 'images/courses/1.jpg');

        const galContainer = document.getElementById('courseGalleryRows');
        if (galContainer) {
            galContainer.innerHTML = '';
            if (course && Array.isArray(course.galleryImages) && course.galleryImages.length > 0) {
                course.galleryImages.forEach(img => window.addGalleryRow('course', img));
            }
        }

        // 7. Visual WYSIWYG Overview Editor
        const courseVisual = document.getElementById('courseVisualEditor');
        const courseContent = course ? (course.overviewContent || course.description || '') : '';
        if (courseVisual) {
            courseVisual.innerHTML = courseContent;
            initVisualEditorEvents('courseVisualEditor');
            courseVisual.oninput = () => { if (typeof window.updateEditorStats === 'function') window.updateEditorStats('courseVisualEditor'); };
            if (typeof window.updateEditorStats === 'function') window.updateEditorStats('courseVisualEditor');
        }
        const descInp = document.getElementById('courseDescriptionInput');
        if (descInp) descInp.value = courseContent;

        document.getElementById('courseSpecializationsInput').value = course ? (course.specializations || '') : '';
        document.getElementById('courseCurriculumInput').value = course && course.curriculum ? (Array.isArray(course.curriculum) ? course.curriculum.join('\n') : course.curriculum) : '';

        document.getElementById('courseModal').classList.add('open');
    };

    window.closeCourseModal = function() {
        if (document.body.classList.contains('has-fullscreen-editor')) {
            const openFull = document.querySelector('.visual-editor-container.fullscreen-editor');
            if (openFull && openFull.id) window.toggleEditorFullscreen(openFull.id);
        }
        const modal = document.getElementById('courseModal');
        if (modal) {
            modal.classList.remove('open');
            modal.classList.remove('fullscreen-modal-active');
        }
        editingCourseId = null;
        const form = document.getElementById('courseForm');
        if (form) form.reset();
    };

    window.editCourse = function(id) {
        const course = courses.find(c => String(c.id) === String(id));
        if (course) window.openCourseModal(course);
    };

    window.deleteCourse = function(id) {
        const course = courses.find(c => String(c.id) === String(id));
        const title = course ? course.name : 'this course';
        pendingDelete = { type: 'course', id: id, title: title };

        const titleEl = document.getElementById('deleteModalTitle');
        const msgEl = document.getElementById('deleteModalMessage');
        const modal = document.getElementById('deleteConfirmModal');

        if (titleEl) titleEl.textContent = 'Delete Course?';
        if (msgEl) msgEl.innerHTML = `Are you sure you want to delete <strong>"${escapeHtml(title)}"</strong>? This will permanently remove it from the catalog and server.`;
        if (modal) modal.classList.add('open');
    };
    async function handleCourseSubmit(e) {
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
            const curriculum = curriculumRaw ? curriculumRaw.split('\n').map(s => s.trim()).filter(Boolean) : [];

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
                description: overviewContent || `${name} is an approved program offering comprehensive training and career prospects across partner universities.`,
                overviewContent: overviewContent || `${name} is an approved program offering comprehensive training and career prospects across partner universities.`,
                metaDescription: metaDescription,
                tags,
                categories,
                keywords,
                curriculum: curriculum.length > 0 ? curriculum : ["Foundation & Overview Modules", "Core Subject Competencies", "Practical Training & Projects", "Industry Readiness"]
            };

            let savedToServer = false;

            if (editingCourseId) {
                try {
                    const res = await cmsFetch(`${API_BASE}/api/content/courses/${editingCourseId}`, {
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
                    const res = await cmsFetch(`${API_BASE}/api/content/courses`, {
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
    }

    // ================= 2. COLLEGE MODAL & CRUD =================
    window.openCollegeModal = function(college = null) {
        editingCollegeId = college ? college.id : null;
        const form = document.getElementById('collegeForm');
        if (form && !college) form.reset();

        const titleEl = document.getElementById('collegeModalTitle');
        if (titleEl) titleEl.innerHTML = college ? '<i class="fa fa-pencil text-primary"></i> Edit College' : '<i class="fa fa-university text-primary"></i> Add New College';
        
        const nameInp = document.getElementById('collegeNameInput');
        if (nameInp) nameInp.value = college ? college.name : '';

        // 5-Point SEO & Facilities
        const metaDescInp = document.getElementById('collegeMetaDescInput');
        if (metaDescInp) {
            metaDescInp.value = college ? (college.metaDescription || '') : '';
            if (typeof window.updateCollegeMetaCount === 'function') window.updateCollegeMetaCount();
        }

        collegeTagsList = college && Array.isArray(college.tags) ? [...college.tags] : (college && college.tags ? String(college.tags).split(',').map(s=>s.trim()).filter(Boolean) : ['Top College', 'Accredited']);
        renderUniversalChips('collegeTagsChips', collegeTagsList, 'college', 'tag');

        collegeKeywordsList = college && Array.isArray(college.keywords) ? [...college.keywords] : (college && college.keywords ? String(college.keywords).split(',').map(s=>s.trim()).filter(Boolean) : ['Pharmacy', 'Engineering Admissions']);
        renderUniversalChips('collegeKeywordsChips', collegeKeywordsList, 'college', 'kw');

        collegeFacilitiesList = college && Array.isArray(college.facilities) ? [...college.facilities] : (college && college.facilities ? String(college.facilities).split(',').map(s=>s.trim()).filter(Boolean) : ['Wi-Fi Campus', 'Modern Labs', 'Hostel', 'Central Library']);
        renderUniversalChips('collegeFacilitiesChips', collegeFacilitiesList, 'college', 'fac');

        let initialCategories = 'Faculty of Engineering & Technology, Faculty of Computer Applications & IT';
        if (college) {
            if (Array.isArray(college.categories) && college.categories.length > 0) {
                initialCategories = college.categories.join(', ');
            } else if (college.category) {
                initialCategories = college.category;
            }
        }
        const catInp = document.getElementById('collegeCategoryInput');
        if (catInp) catInp.value = initialCategories;

        const affInp = document.getElementById('collegeAffiliationInput');
        if (affInp) affInp.value = college ? (college.affiliation || '') : '';

        const locInp = document.getElementById('collegeLocationInput');
        if (locInp) locInp.value = college ? college.location : 'New Delhi, India';

        const estInp = document.getElementById('collegeEstablishedInput');
        if (estInp) estInp.value = college ? (college.established || '2010') : '2010';

        const accInp = document.getElementById('collegeAccreditationInput');
        if (accInp) accInp.value = college ? (Array.isArray(college.accreditation) ? college.accreditation.join(', ') : college.accreditation) : 'PCI Approved, AICTE, NAAC A+';

        const feeInp = document.getElementById('collegeFeeInput');
        if (feeInp) feeInp.value = college ? college.fee : '₹55,000 - ₹95,000 / year';

        const imgInp = document.getElementById('collegeImageInput');
        if (imgInp) imgInp.value = college ? college.image : 'images/courses/1.jpg';

        const ratingInp = document.getElementById('collegeRatingInput');
        if (ratingInp) ratingInp.value = college ? college.rating : '4.8';

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

        if (typeof renderCollegeCategoryCards === 'function') renderCollegeCategoryCards();
        if (typeof renderCollegeCoursesTags === 'function') renderCollegeCoursesTags();

        const currentImg = college ? college.image : 'images/courses/1.jpg';
        document.querySelectorAll('#collegeModal .preset-campus-card').forEach(card => {
            card.classList.toggle('active', card.dataset.src === currentImg);
        });

        const descInp = document.getElementById('collegeDescriptionInput');
        if (descInp) descInp.value = college ? (college.description || '') : '';

        const featInp = document.getElementById('collegeFeaturedInput');
        if (featInp) featInp.checked = college ? Boolean(college.featured || college.isFeatured) : true;

        if (typeof window.updateThumbPreview === 'function') {
            window.updateThumbPreview('collegeImagePreview', 'collegeImageInput', currentImg);
        }

        const modal = document.getElementById('collegeModal');
        if (modal) modal.classList.add('open');
    };

    window.closeCollegeModal = function() {
        const modal = document.getElementById('collegeModal');
        if (modal) modal.classList.remove('open');
        editingCollegeId = null;
        const form = document.getElementById('collegeForm');
        if (form) form.reset();
    };

    window.editCollege = function(id) {
        const college = colleges.find(c => String(c.id) === String(id));
        if (college) window.openCollegeModal(college);
    };

    window.deleteCollege = function(id) {
        const college = colleges.find(c => String(c.id) === String(id));
        const title = college ? college.name : 'this college';
        pendingDelete = { type: 'college', id: id, title: title };

        const titleEl = document.getElementById('deleteModalTitle');
        const msgEl = document.getElementById('deleteModalMessage');
        const modal = document.getElementById('deleteConfirmModal');

        if (titleEl) titleEl.textContent = 'Delete College?';
        if (msgEl) msgEl.innerHTML = `Are you sure you want to delete <strong>"${escapeHtml(title)}"</strong>? This will permanently remove it from the directory and server.`;
        if (modal) modal.classList.add('open');
    };
    async function handleCollegeSubmit(e) {
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
                description: description || `${name} offers accredited professional degree programs with distinguished faculty and placement guidance.`,
                isFeatured: featured,
                featured: featured
            };

            let savedToServer = false;

            if (editingCollegeId) {
                try {
                    const res = await cmsFetch(`${API_BASE}/api/content/colleges/${editingCollegeId}`, {
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
                    const res = await cmsFetch(`${API_BASE}/api/content/colleges`, {
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
                    const newId = `college-${Date.now()}`;
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
    }

    // ================= 3. UNIVERSITY MODAL & CRUD =================
    window.openUnivModal = function(univ = null) {
        editingUnivId = univ ? univ.id : null;
        const form = document.getElementById('univForm');
        if (form && !univ) form.reset();

        const titleEl = document.getElementById('univModalTitle');
        if (titleEl) titleEl.innerHTML = univ ? '<i class="fa fa-pencil text-primary"></i> Edit University' : '<i class="fa fa-graduation-cap text-primary"></i> Add New University';

        const nameInp = document.getElementById('univNameInput');
        if (nameInp) nameInp.value = univ ? univ.name : '';

        // 5-Point SEO & Facilities
        const metaDescInp = document.getElementById('univMetaDescInput');
        if (metaDescInp) {
            metaDescInp.value = univ ? (univ.metaDescription || '') : '';
            if (typeof window.updateUnivMetaCount === 'function') window.updateUnivMetaCount();
        }

        univTagsList = univ && Array.isArray(univ.tags) ? [...univ.tags] : (univ && univ.tags ? String(univ.tags).split(',').map(s=>s.trim()).filter(Boolean) : ['UGC-DEB University', 'Online Degrees']);
        renderUniversalChips('univTagsChips', univTagsList, 'univ', 'tag');

        univKeywordsList = univ && Array.isArray(univ.keywords) ? [...univ.keywords] : (univ && univ.keywords ? String(univ.keywords).split(',').map(s=>s.trim()).filter(Boolean) : ['Distance MBA', 'Degree Govt Valid']);
        renderUniversalChips('univKeywordsChips', univKeywordsList, 'univ', 'kw');

        univFacilitiesList = univ && Array.isArray(univ.facilities) ? [...univ.facilities] : (univ && univ.facilities ? String(univ.facilities).split(',').map(s=>s.trim()).filter(Boolean) : ['Student LMS Portal', 'Digital Evaluation', 'Placement Cell', 'Campus Hostels']);
        renderUniversalChips('univFacilitiesChips', univFacilitiesList, 'univ', 'fac');

        const typeInp = document.getElementById('univTypeInput');
        if (typeInp) typeInp.value = univ ? univ.type : 'State Private University';

        const appInp = document.getElementById('univApprovalsInput');
        if (appInp) appInp.value = univ ? (Array.isArray(univ.approvals) ? univ.approvals.join(', ') : univ.approvals) : 'UGC Recognized, AIU Member, AICTE Approved';

        const locInp = document.getElementById('univLocationInput');
        if (locInp) locInp.value = univ ? univ.location : 'India';

        const estInp = document.getElementById('univEstablishedInput');
        if (estInp) estInp.value = univ ? (univ.established || '2018') : '2018';

        const naacInp = document.getElementById('univNaacInput');
        if (naacInp) naacInp.value = univ ? (univ.naac || 'NAAC A Grade') : 'NAAC A Grade';

        const modesInp = document.getElementById('univModesInput');
        if (modesInp) modesInp.value = univ ? (Array.isArray(univ.modes) ? univ.modes.join(', ') : univ.modes) : 'Online / Regular / Distance Learning';

        const feeInp = document.getElementById('univFeeInput');
        if (feeInp) feeInp.value = univ ? univ.fee : 'Affordable Semester Installments';

        const imgInp = document.getElementById('univImageInput');
        if (imgInp) imgInp.value = univ ? univ.image : 'images/slider/home1/slide1.jpg';

        let streamsVal = 'Commerce & Management, Computer Applications & IT, Arts, Humanities & Social Sciences';
        if (univ) {
            if (Array.isArray(univ.streams) && univ.streams.length > 0) {
                streamsVal = univ.streams.join(', ');
            } else if (univ.popularStreams) {
                streamsVal = univ.popularStreams;
            }
        }
        const streamsInp = document.getElementById('univStreamsInput');
        if (streamsInp) streamsInp.value = streamsVal;

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

        if (typeof renderUnivStreamCards === 'function') renderUnivStreamCards();
        if (typeof renderUnivCoursesTags === 'function') renderUnivCoursesTags();

        const currentImg = univ ? univ.image : 'images/slider/home1/slide1.jpg';
        document.querySelectorAll('#univModal .preset-campus-card').forEach(card => {
            card.classList.toggle('active', card.dataset.src === currentImg);
        });

        const highInp = document.getElementById('univHighlightsInput');
        if (highInp) highInp.value = univ ? (univ.highlights || '') : 'Valid for all Govt Jobs, AIU Equivalence';

        const descInp = document.getElementById('univDescriptionInput');
        if (descInp) descInp.value = univ ? (univ.description || '') : '';

        const featInp = document.getElementById('univFeaturedInput');
        if (featInp) featInp.checked = univ ? Boolean(univ.featured || univ.isFeatured) : true;

        if (typeof window.updateThumbPreview === 'function') {
            window.updateThumbPreview('univImagePreview', 'univImageInput', currentImg);
        }

        const modal = document.getElementById('univModal');
        if (modal) modal.classList.add('open');
    };

    window.closeUnivModal = function() {
        const modal = document.getElementById('univModal');
        if (modal) modal.classList.remove('open');
        editingUnivId = null;
        const form = document.getElementById('univForm');
        if (form) form.reset();
    };

    window.editUniv = function(id) {
        const univ = universities.find(u => String(u.id) === String(id));
        if (univ) window.openUnivModal(univ);
    };

    window.deleteUniv = function(id) {
        const univ = universities.find(u => String(u.id) === String(id));
        const title = univ ? univ.name : 'this university';
        pendingDelete = { type: 'university', id: id, title: title };

        const titleEl = document.getElementById('deleteModalTitle');
        const msgEl = document.getElementById('deleteModalMessage');
        const modal = document.getElementById('deleteConfirmModal');

        if (titleEl) titleEl.textContent = 'Delete University?';
        if (msgEl) msgEl.innerHTML = `Are you sure you want to delete <strong>"${escapeHtml(title)}"</strong>? This will permanently remove it from the directory and server.`;
        if (modal) modal.classList.add('open');
    };
    async function handleUnivSubmit(e) {
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
                description: description || `${name} is a premier accredited university partner.`,
                isFeatured: featured,
                featured: featured
            };

            let savedToServer = false;

            if (editingUnivId) {
                try {
                    const res = await cmsFetch(`${API_BASE}/api/content/universities/${editingUnivId}`, {
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
                    const res = await cmsFetch(`${API_BASE}/api/content/universities`, {
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
                    const newId = `univ-${Date.now()}`;
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
    }

    // ================= 4. BLOG MODAL & CRUD =================
    window.openBlogModal = function(blog = null) {
        editingBlogId = blog ? blog.id : null;
        const form = document.getElementById('blogForm');
        if (form && !blog) form.reset();

        const titleEl = document.getElementById('blogModalTitle');
        if (titleEl) titleEl.innerHTML = blog ? '<i class="fa fa-pencil text-primary"></i> Edit Blog Post' : '<i class="fa fa-newspaper-o text-primary"></i> Add New Blog Post';

        const titleInp = document.getElementById('blogTitleInput');
        if (titleInp) titleInp.value = blog ? blog.title : '';

        // 5-Point SEO
        const metaDescInp = document.getElementById('blogMetaDescInput');
        if (metaDescInp) {
            metaDescInp.value = blog ? (blog.metaDescription || '') : '';
            if (typeof window.updateBlogMetaCount === 'function') window.updateBlogMetaCount();
        }

        blogTagsList = blog && Array.isArray(blog.tags) ? [...blog.tags] : (blog && blog.tags ? String(blog.tags).split(',').map(s=>s.trim()).filter(Boolean) : ['Career Guidance', 'Distance Education']);
        renderUniversalChips('blogTagsChips', blogTagsList, 'blog', 'tag');

        blogCategoriesList = blog && Array.isArray(blog.categories) ? [...blog.categories] : (blog && blog.categories ? String(blog.categories).split(',').map(s=>s.trim()).filter(Boolean) : ['University Admissions']);
        renderUniversalChips('blogCategoriesChips', blogCategoriesList, 'blog', 'cat');

        blogKeywordsList = blog && Array.isArray(blog.keywords) ? [...blog.keywords] : (blog && blog.keywords ? String(blog.keywords).split(',').map(s=>s.trim()).filter(Boolean) : ['Subharti Distance MBA', 'UGC DEB Validity']);
        renderUniversalChips('blogKeywordsChips', blogKeywordsList, 'blog', 'kw');

        const catInp = document.getElementById('blogCategoryInput');
        if (catInp) catInp.value = blog ? blog.category : (blogCategoriesList[0] || 'University Admissions');

        const authorInp = document.getElementById('blogAuthorInput');
        if (authorInp) authorInp.value = blog ? blog.author : 'Educationist Expert';

        const dateInp = document.getElementById('blogDateInput');
        if (dateInp) dateInp.value = blog ? blog.date : new Date().toISOString().split('T')[0];

        const imgInp = document.getElementById('blogImageInput');
        if (imgInp) imgInp.value = blog ? blog.image : 'images/blog/1.jpg';

        const excInp = document.getElementById('blogExcerptInput');
        if (excInp) excInp.value = blog ? (blog.excerpt || '') : '';

        const featInp = document.getElementById('blogFeaturedInput');
        if (featInp) featInp.checked = blog ? Boolean(blog.featured || blog.isFeatured) : false;

        // Visual WYSIWYG Editor Canvas
        const blogVisual = document.getElementById('blogVisualEditor') || document.getElementById('blogVisualEditorCanvas');
        const blogContent = blog ? (blog.content || '') : '';
        if (blogVisual) {
            blogVisual.innerHTML = blogContent;
            const edId = blogVisual.id;
            if (typeof initVisualEditorEvents === 'function') initVisualEditorEvents(edId);
            blogVisual.oninput = () => { if (typeof window.updateEditorStats === 'function') window.updateEditorStats(edId); };
            if (typeof window.updateEditorStats === 'function') window.updateEditorStats(edId);
        }
        const blogContentInp = document.getElementById('blogContentInput');
        if (blogContentInp) blogContentInp.value = blogContent;

        if (typeof window.updateThumbPreview === 'function') {
            window.updateThumbPreview('blogImagePreview', 'blogImageInput', blog ? blog.image : 'images/blog/1.jpg');
        }

        const modal = document.getElementById('blogModal');
        if (modal) modal.classList.add('open');
    };

    window.closeBlogModal = function() {
        if (document.body.classList.contains('has-fullscreen-editor')) {
            const openFull = document.querySelector('.visual-editor-container.fullscreen-editor');
            if (openFull && openFull.id) window.toggleEditorFullscreen(openFull.id);
        }
        const modal = document.getElementById('blogModal');
        if (modal) {
            modal.classList.remove('open');
            modal.classList.remove('fullscreen-modal-active');
        }
        editingBlogId = null;
        const form = document.getElementById('blogForm');
        if (form) form.reset();
    };

    window.editBlog = function(id) {
        const blog = blogs.find(b => String(b.id) === String(id));
        if (blog) window.openBlogModal(blog);
    };

    window.deleteBlog = function(id) {
        const blog = blogs.find(b => String(b.id) === String(id));
        const title = blog ? blog.title : 'this blog post';
        pendingDelete = { type: 'blog', id: id, title: title };

        const titleEl = document.getElementById('deleteModalTitle');
        const msgEl = document.getElementById('deleteModalMessage');
        const modal = document.getElementById('deleteConfirmModal');

        if (titleEl) titleEl.textContent = 'Delete Blog Post?';
        if (msgEl) msgEl.innerHTML = `Are you sure you want to delete <strong>"${escapeHtml(title)}"</strong>? This will permanently remove it from the website and server.`;
        if (modal) modal.classList.add('open');
    };
    async function handleBlogSubmit(e) {
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
                content: content || `<p>${title} is an insightful overview provided by EducationistGuru for academic guidance.</p>`
            };

            let savedToServer = false;

            if (editingBlogId) {
                try {
                    const res = await cmsFetch(`${API_BASE}/api/content/blogs/${editingBlogId}`, {
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
                    const res = await cmsFetch(`${API_BASE}/api/content/blogs`, {
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
    }

    // 5. YOUTUBE VIDEO MODAL & AUTO-FETCH
    function extractYouTubeId(urlOrId) {
        if (!urlOrId) return '';
        const cleaned = urlOrId.trim();
        // If already 11 chars
        if (/^[a-zA-Z0-9_-]{11}$/.test(cleaned)) return cleaned;
        // Standard full URL / watch / shorts / youtu.be
        const match = cleaned.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/))([\w-]{11})/);
        return match ? match[1] : '';
    }

    window.openVideoModal = function() {
        editingVideoId = null;
        const form = document.getElementById('videoForm');
        if (form) form.reset();

        const previewWrap = document.getElementById('videoPreviewWrap');
        if (previewWrap) previewWrap.style.display = 'none';

        const thumbPreview = document.getElementById('videoThumbnailPreview');
        if (thumbPreview) thumbPreview.style.display = 'none';

        document.getElementById('videoModal').classList.add('open');
    };

    window.closeVideoModal = function() {
        const modal = document.getElementById('videoModal');
        if (modal) modal.classList.remove('open');
        const form = document.getElementById('videoForm');
        if (form) form.reset();
    };

    window.deleteVideo = function(id) {
        const video = videos.find(v => String(v.id) === String(id));
        const title = video ? video.title : 'this YouTube video';
        pendingDelete = { type: 'video', id: id, title: title };

        const titleEl = document.getElementById('deleteModalTitle');
        const msgEl = document.getElementById('deleteModalMessage');
        const modal = document.getElementById('deleteConfirmModal');

        if (titleEl) titleEl.textContent = 'Delete YouTube Video?';
        if (msgEl) msgEl.innerHTML = `Are you sure you want to remove <strong>"${escapeHtml(title)}"</strong> from the YouTube channel list?`;
        if (modal) modal.classList.add('open');
    };

    async function handleFetchVideoInfo() {
        const btn = document.getElementById('fetchVideoInfoBtn');
        const origHtml = btn ? btn.innerHTML : '';
        const urlInput = document.getElementById('videoUrlInput');
        const rawUrl = urlInput ? urlInput.value.trim() : '';

        const videoId = extractYouTubeId(rawUrl);
        if (!videoId) {
            alert('Please enter a valid YouTube URL (e.g. https://www.youtube.com/watch?v=...) or an 11-character video ID.');
            return;
        }

        if (btn) {
            btn.disabled = true;
            btn.innerHTML = '<i class="fa fa-spinner fa-spin"></i> Fetching...';
        }

        // Set thumbnail preview immediately
        const thumbUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
        const thumbInput = document.getElementById('videoThumbnailInput');
        if (thumbInput) thumbInput.value = thumbUrl;
        window.updateThumbPreview('videoThumbnailPreview', 'videoThumbnailInput', thumbUrl);

        // Query server for auto-metadata
        try {
            const res = await fetch(`${API_BASE}/api/youtube/fetch-info?videoId=${videoId}`);
            if (res.ok) {
                const data = await res.json();
                if (data.title) {
                    const titleInput = document.getElementById('videoTitleInput');
                    if (titleInput && !titleInput.value) titleInput.value = data.title;
                }
                if (data.duration) {
                    const durInput = document.getElementById('videoDurationInput');
                    if (durInput) durInput.value = data.duration;
                }
                if (data.thumbnail) {
                    if (thumbInput) thumbInput.value = data.thumbnail;
                    window.updateThumbPreview('videoThumbnailPreview', 'videoThumbnailInput', data.thumbnail);
                }
                showToast('Video details retrieved successfully!', 'success');
            }
        } catch (e) {
            console.warn('[CMS] YouTube fetch-info API returned:', e);
            // Default title fallback
            const titleInput = document.getElementById('videoTitleInput');
            if (titleInput && !titleInput.value) {
                titleInput.value = `EducationistGuru Guide - Video (${videoId})`;
            }
        }

        if (btn) {
            btn.disabled = false;
            btn.innerHTML = origHtml;
        }
    }
    async function handleVideoSubmit(e) {
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
            const thumbnail = (document.getElementById('videoThumbnailInput')?.value || `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`).trim();
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
                    const res = await cmsFetch(`${API_BASE}/api/youtube/videos/${editingVideoId}`, {
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
                    const res = await cmsFetch(`${API_BASE}/api/youtube/videos`, {
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
    }

    // ================= UNIFIED DELETE CONTROLLER =================
    window.closeDeleteModal = function() {
        const modal = document.getElementById('deleteConfirmModal');
        if (modal) modal.classList.remove('open');
        pendingDelete = null;
    };
    window.executeDelete = async function() {
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
                if (type === 'course') endpoint = `${API_BASE}/api/content/courses/${id}`;
                else if (type === 'college') endpoint = `${API_BASE}/api/content/colleges/${id}`;
                else if (type === 'university') endpoint = `${API_BASE}/api/content/universities/${id}`;
                else if (type === 'blog') endpoint = `${API_BASE}/api/content/blogs/${id}`;
                else if (type === 'video') endpoint = `${API_BASE}/api/youtube/videos/${id}`;

                if (endpoint) {
                    const res = await cmsFetch(endpoint, { method: 'DELETE' });
                    if (res && res.ok) serverDeleted = true;
                }
            } catch (e) {
                console.warn(`[CMS] Server delete failed for ${type}:`, e);
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
    };

    // ================= LOCAL FILE UPLOADS & THUMBNAIL MANAGER =================
    window.resolveDisplaySrc = function(src) {
        if (!src) return '';
        if (src.startsWith('data:') || src.startsWith('http://') || src.startsWith('https://') || src.startsWith('/')) {
            return src;
        }
        const path = window.location.pathname.toLowerCase();
        const isInEditFolder = path.includes('/edit/') || path.endsWith('/edit');
        return isInEditFolder ? `../${src}` : `./${src}`;
    };

    window.updateThumbPreview = function(previewId, inputId, src) {
        const previewEl = document.getElementById(previewId);
        const inputEl = document.getElementById(inputId);
        if (!previewEl) return;

        if (src && src.trim()) {
            previewEl.style.display = 'block';
            const img = previewEl.querySelector('.thumb-preview-img');
            const nameEl = previewEl.querySelector('.thumb-name');
            const badgeEl = previewEl.querySelector('.thumb-badge');

            if (img) {
                img.src = window.resolveDisplaySrc(src);
                img.onerror = () => { img.src = window.resolveDisplaySrc('images/courses/1.jpg'); };
            }
            if (nameEl) {
                const parts = src.split('/');
                nameEl.textContent = parts[parts.length - 1] || 'Active Thumbnail';
            }
            if (badgeEl) {
                badgeEl.className = 'thumb-badge';
                badgeEl.innerHTML = '<i class="fa fa-check-circle"></i> Ready';
            }
            if (inputEl && !inputEl.value) {
                inputEl.value = src;
            }
        } else {
            previewEl.style.display = 'none';
        }
    };

    function setupFileUploadsAndThumbnails() {
        // 1. Preset thumbnail & curated campus card clicks
        document.querySelectorAll('.preset-thumb, .preset-campus-card').forEach(thumb => {
            thumb.addEventListener('click', () => {
                const targetInputId = thumb.dataset.target;
                const previewId = thumb.dataset.preview;
                const src = thumb.dataset.src;
                const input = document.getElementById(targetInputId);
                if (input) {
                    input.value = src;
                    const container = thumb.closest('.preset-thumbs-wrap') || thumb.closest('.preset-campus-grid') || thumb.parentElement;
                    if (container) {
                        container.querySelectorAll('.preset-thumb, .preset-campus-card').forEach(t => t.classList.remove('active'));
                    }
                    thumb.classList.add('active');
                    if (previewId) {
                        window.updateThumbPreview(previewId, targetInputId, src);
                    }
                }
            });
        });

        // 2. Clear thumbnail buttons
        document.querySelectorAll('.thumb-clear-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const targetInputId = btn.dataset.target;
                const previewId = btn.dataset.preview;
                const input = document.getElementById(targetInputId);
                if (input) input.value = '';
                const preview = document.getElementById(previewId);
                if (preview) preview.style.display = 'none';
            });
        });

        // 3. Drop zone click & file trigger
        document.querySelectorAll('.file-drop-zone').forEach(zone => {
            const fileInputId = zone.dataset.fileInput;
            const fileInput = document.getElementById(fileInputId);
            const browseBtn = zone.querySelector('.btn-browse-local');

            const openPicker = (e) => {
                if (e.target !== fileInput) {
                    if (fileInput) fileInput.click();
                }
            };

            zone.addEventListener('click', openPicker);
            if (browseBtn) {
                browseBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    if (fileInput) fileInput.click();
                });
            }

            // Drag & Drop
            ['dragenter', 'dragover'].forEach(eventName => {
                zone.addEventListener(eventName, (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    zone.classList.add('dragover');
                });
            });

            ['dragleave', 'drop'].forEach(eventName => {
                zone.addEventListener(eventName, (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    zone.classList.remove('dragover');
                });
            });

            zone.addEventListener('drop', (e) => {
                const files = e.dataTransfer.files;
                if (files && files.length > 0) {
                    handleLocalFileSelect(files[0], zone.dataset.target, zone.dataset.preview);
                }
            });
        });

        // 4. Local device file input change event
        document.querySelectorAll('.local-device-file').forEach(fileInput => {
            fileInput.addEventListener('change', (e) => {
                const zone = fileInput.closest('.upload-box-container')?.querySelector('.file-drop-zone') || fileInput.parentElement;
                if (zone && e.target.files && e.target.files.length > 0) {
                    handleLocalFileSelect(e.target.files[0], zone.dataset.target, zone.dataset.preview);
                }
            });
        });

        // 5. Input manual text typing live preview
        ['courseImageInput', 'collegeImageInput', 'univImageInput', 'blogImageInput', 'videoThumbnailInput'].forEach(id => {
            const input = document.getElementById(id);
            if (input) {
                const previewId = id.replace('Input', 'Preview');
                input.addEventListener('input', () => {
                    const val = input.value.trim();
                    window.updateThumbPreview(previewId, id, val);
                });
            }
        });
    }

    async function handleLocalFileSelect(file, targetInputId, previewId) {
        if (!file) return;
        if (!file.type.startsWith('image/')) {
            showToast('Please select a valid image file (PNG, JPG, WEBP, GIF, SVG).', 'error');
            return;
        }

        const previewEl = document.getElementById(previewId);
        const inputEl = document.getElementById(targetInputId);

        // Immediate visual preview using FileReader
        const reader = new FileReader();
        reader.onload = async (e) => {
            const dataUrl = e.target.result;
            if (previewEl) {
                previewEl.style.display = 'block';
                const img = previewEl.querySelector('.thumb-preview-img');
                const nameEl = previewEl.querySelector('.thumb-name');
                const badgeEl = previewEl.querySelector('.thumb-badge');

                if (img) img.src = dataUrl;
                if (nameEl) nameEl.textContent = file.name;
                if (badgeEl) {
                    badgeEl.className = 'thumb-badge uploading';
                    badgeEl.innerHTML = '<i class="fa fa-spinner fa-spin"></i> Uploading to server...';
                }
            }

            // Upload to server
            try {
                const res = await fetch('/api/upload', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        filename: file.name,
                        data: dataUrl
                    })
                });

                const json = await res.json();
                if (json.success && json.url) {
                    if (inputEl) inputEl.value = json.url;
                    if (previewEl) {
                        const badgeEl = previewEl.querySelector('.thumb-badge');
                        if (badgeEl) {
                            badgeEl.className = 'thumb-badge';
                            badgeEl.innerHTML = '<i class="fa fa-check-circle"></i> Uploaded & Saved';
                        }
                    }
                    showToast(`Image "${file.name}" uploaded successfully!`, 'success');
                } else {
                    // Fallback to dataUrl directly
                    if (inputEl) inputEl.value = dataUrl;
                    if (previewEl) {
                        const badgeEl = previewEl.querySelector('.thumb-badge');
                        if (badgeEl) {
                            badgeEl.className = 'thumb-badge';
                            badgeEl.innerHTML = '<i class="fa fa-check-circle"></i> Ready';
                        }
                    }
                    showToast(`Saved image locally: ${json.error || 'Server upload warning'}`, 'info');
                }
            } catch (err) {
                // Network error fallback
                if (inputEl) inputEl.value = dataUrl;
                if (previewEl) {
                    const badgeEl = previewEl.querySelector('.thumb-badge');
                    if (badgeEl) {
                        badgeEl.className = 'thumb-badge';
                        badgeEl.innerHTML = '<i class="fa fa-check-circle"></i> Ready';
                    }
                }
                showToast(`Using local image: ${err.message}`, 'info');
            }
        };

        reader.readAsDataURL(file);
    }

    // ================= TOAST NOTIFICATION =================
    function showToast(msg, type = 'success') {
        const container = document.getElementById('toastContainer') || createToastContainer();
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `<i class="fa fa-${type === 'success' ? 'check-circle' : 'info-circle'}" style="color:${type === 'success' ? '#10b981' : '#ff3115'}"></i> <span>${msg}</span>`;
        container.appendChild(toast);
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(10px)';
            setTimeout(() => toast.remove(), 300);
        }, 3200);
    }

    function createToastContainer() {
        const div = document.createElement('div');
        div.id = 'toastContainer';
        div.className = 'toast-container';
        document.body.appendChild(div);
        return div;
    }

    // ================= 7. HEADERS & MEGA-MENU CONTROLLER =================
    let currentEditingSubLinks = [];
    let currentEditingHeaderId = null;

    const DEFAULT_NAV_ITEMS = [
        { id: 'home', title: 'Home', url: 'index.html', type: 'link', order: 1 },
        { id: 'courses', title: 'Courses', url: 'courses.html', type: 'megamenu', badge: 'Popular', order: 2 },
        { id: 'universities', title: 'Universities', url: 'universities.html', type: 'dropdown', badge: 'UGC Valid', order: 3 },
        { id: 'colleges', title: 'Colleges', url: 'colleges.html', type: 'link', order: 4 },
        {
            id: 'boards',
            title: 'Boards & Open School',
            url: '#',
            type: 'dropdown',
            order: 5,
            children: [
                { id: 'nios-admission', title: 'NIOS 10th & 12th Admission', url: 'contact.html?subject=NIOS+Admission', desc: 'Direct enrollment in National Institute of Open Schooling' },
                { id: 'bbose-admission', title: 'BBOSE Open Schooling', url: 'contact.html?subject=BBOSE+Admission', desc: 'State open schooling board verification & enrollment' },
                { id: 'open-counseling', title: 'Free Document & Eligibility Assessment', url: 'contact.html?subject=Eligibility+Verification', desc: '100% verified educational counselor support' }
            ]
        },
        { id: 'about', title: 'About Us', url: 'about.html', type: 'link', order: 6 },
        { id: 'videos', title: 'Videos', url: 'youtube.html', type: 'link', icon: 'fa fa-youtube-play text-danger', order: 7 },
        { id: 'blog', title: 'Blog', url: 'blog.html', type: 'link', order: 8 },
        { id: 'contact', title: 'Contact', url: 'contact.html', type: 'link', order: 9 },
        {
            id: 'subharti-mba-hub',
            title: 'Subharti MBA',
            url: 'blog-details.html?id=100',
            type: 'dropdown',
            badge: 'New 2026',
            order: 10,
            children: [
                { id: 'subharti-mba-guide', title: 'MBA in Financial & Project Management', url: 'blog-details.html?id=100', desc: 'Subharti University dual specialization admission & syllabus guide' },
                { id: 'subharti-course-details', title: 'Course Syllabus & Fee Schedule', url: 'courses-details.html?id=107', desc: '2-Year program breakdown, modules & recognition details' },
                { id: 'subharti-counselor-helpline', title: 'Direct Admission Helpline', url: 'contact.html?subject=Subharti+University+MBA', desc: 'Connect with authorized counselors at 8750477000' }
            ]
        }
    ];

    async function loadMenuData() {
        try {
            const res = await cmsFetch(`${API_BASE}/api/content/menu`);
            if (res.ok) {
                const json = await res.json();
                const menuData = json && (json.data || json.menu || (json.navItems ? json : null));
                if (menuData && Array.isArray(menuData.navItems) && menuData.navItems.length > 0) {
                    siteMenu = menuData;
                    if (!siteMenu.announcement) siteMenu.announcement = {};
                    try { localStorage.setItem('eg_cms_menu', JSON.stringify(siteMenu)); } catch(e){}
                    return;
                }
            }
        } catch (e) {}

        // Fallback to static data files
        const candidateUrls = ['/data/site_menu.json', 'data/site_menu.json', '../data/site_menu.json'];
        for (const url of candidateUrls) {
            try {
                const staticRes = await fetch(url);
                if (staticRes.ok) {
                    const parsed = await staticRes.json();
                    if (parsed && Array.isArray(parsed.navItems) && parsed.navItems.length > 0) {
                        siteMenu = parsed;
                        if (!siteMenu.announcement) siteMenu.announcement = {};
                        try { localStorage.setItem('eg_cms_menu', JSON.stringify(siteMenu)); } catch(e){}
                        return;
                    }
                }
            } catch (e) {}
        }

        // LocalStorage fallback
        try {
            const localSaved = localStorage.getItem('eg_cms_menu');
            if (localSaved) {
                const parsed = JSON.parse(localSaved);
                if (parsed && Array.isArray(parsed.navItems) && parsed.navItems.length > 0) {
                    siteMenu = parsed;
                    return;
                }
            }
        } catch (e) {}

        // Ultimate pristine fallback
        if (!siteMenu.navItems || siteMenu.navItems.length === 0) {
            siteMenu.navItems = JSON.parse(JSON.stringify(DEFAULT_NAV_ITEMS));
        }
        if (!siteMenu.announcement || !siteMenu.announcement.text) {
            siteMenu.announcement = {
                enabled: true,
                text: '🎓 Admissions Open 2026-27 | Call EducationistGuru Helpline: +91 87504 77000',
                phone: '+91 87504 77000',
                email: 'info@educationistguru.com',
                whatsapp: '918750477000',
                ctaText: 'Apply Now',
                ctaLink: 'contact.html',
                link: 'contact.html'
            };
        }
        try { localStorage.setItem('eg_cms_menu', JSON.stringify(siteMenu)); } catch(e){}
    }

    function renderHeadersTab() {
        const ann = siteMenu.announcement || {};
        const textInput = document.getElementById('announcementTextInput');
        const ctaInput = document.getElementById('announcementCtaInput');
        const linkInput = document.getElementById('announcementLinkInput');
        const toggle = document.getElementById('announcementEnableToggle');
        const badge = document.getElementById('announcementStatusBadge');

        if (textInput) textInput.value = ann.text || '';
        if (ctaInput) ctaInput.value = ann.ctaText || 'Apply Now';
        if (linkInput) linkInput.value = ann.ctaLink || 'contact.html';
        if (toggle) toggle.checked = ann.enabled !== false;
        if (badge) {
            badge.className = `form-section-badge ${ann.enabled !== false ? 'active' : ''}`;
            badge.textContent = ann.enabled !== false ? 'Active on Site' : 'Disabled';
        }
        window.updateAnnouncementPreview();

        // 2. Render Courses Mega-Menu Auto-Sync Preview
        const coursesPreview = document.getElementById('coursesMegaMenuPreview');
        if (coursesPreview) {
            coursesPreview.innerHTML = `
                <div style="display:flex; justify-content:space-between; margin-bottom:8px; font-weight:700;">
                    <span>Total Synchronized Programs:</span>
                    <span style="color:#0ea5e9;">${courses.length} Degrees</span>
                </div>
                <div style="display:grid; grid-template-columns: 1fr 1fr; gap:6px; font-size:12px; color:#475569;">
                    <div>&bull; Management &amp; Commerce: <strong>MBA, BBA, B.Com, M.Com...</strong></div>
                    <div>&bull; Engineering &amp; IT: <strong>B.Tech, MCA, BCA, AI...</strong></div>
                    <div>&bull; Medical &amp; Pharmacy: <strong>D.Pharm, B.Pharm, MLT...</strong></div>
                    <div>&bull; Law, Arts &amp; Teaching: <strong>B.Ed, D.Ed, LLB, MA...</strong></div>
                </div>
                <div style="margin-top:10px; font-size:11.5px; color:#10b981;">
                    <i class="fa fa-check-circle"></i> Auto-Sync Active: Adding or editing any course in Content Studio instantly updates the Mega-Menu.
                </div>
            `;
        }

        // 3. Render Universities Auto-Sync Preview
        const univsPreview = document.getElementById('univsHeaderPreview');
        if (univsPreview) {
            univsPreview.innerHTML = `
                <div style="display:flex; justify-content:space-between; margin-bottom:8px; font-weight:700;">
                    <span>Active Partner Universities:</span>
                    <span style="color:#8b5cf6;">${universities.length} Institutions</span>
                </div>
                <div style="display:flex; flex-wrap:wrap; gap:6px; margin-bottom:8px;">
                    ${universities.map(u => {
                        const uName = String(u.name || u.title || 'University');
                        return `
                        <span style="background:#ffffff; border:1px solid #cbd5e1; border-radius:4px; padding:2px 8px; font-size:11px; font-weight:600;">
                            ${escapeHtml(uName.length > 25 ? uName.slice(0, 24) + '...' : uName)}
                        </span>
                    `;}).join('')}
                </div>
                <div style="font-size:11.5px; color:#10b981;">
                    <i class="fa fa-check-circle"></i> Auto-Sync Active: All universities appear with UGC &amp; NAAC badges in the header dropdown.
                </div>
            `;
        }

        // 4. Render All Interactive Navigation Headers
        renderAllNavHeaders();
    }

    window.updateAnnouncementPreview = function() {
        const textInput = document.getElementById('announcementTextInput');
        const ctaInput = document.getElementById('announcementCtaInput');
        const toggle = document.getElementById('announcementEnableToggle');
        const badge = document.getElementById('announcementStatusBadge');
        const previewContainer = document.getElementById('announcementLivePreviewContainer');
        const previewText = document.getElementById('announcementPreviewText');
        const previewCta = document.getElementById('announcementPreviewCta');

        const isEnabled = toggle ? toggle.checked : true;
        const text = (textInput ? textInput.value.trim() : '') || '🎓 Admissions Open 2026-27 | Call EducationistGuru Helpline: +91 87504 77000';
        const cta = (ctaInput ? ctaInput.value.trim() : '') || 'Apply Now';

        if (previewText) previewText.textContent = text;
        if (previewCta) previewCta.innerHTML = `${escapeHtml(cta)} &rarr;`;

        if (badge) {
            badge.className = `form-section-badge ${isEnabled ? 'active' : ''}`;
            badge.textContent = isEnabled ? 'Active on Website' : 'Disabled / Hidden';
        }

        if (previewContainer) {
            previewContainer.style.opacity = isEnabled ? '1' : '0.45';
            previewContainer.style.filter = isEnabled ? 'none' : 'grayscale(80%)';
        }
    };

    function renderAllNavHeaders() {
        const container = document.getElementById('allNavHeadersContainer') || document.getElementById('customHeadersList');
        if (!container) return;

        const items = siteMenu.navItems || [];
        if (items.length === 0) {
            container.innerHTML = `
                <div style="text-align:center; padding:30px; background:#f8fafc; border:1px dashed #cbd5e1; border-radius:8px;">
                    <i class="fa fa-bars" style="font-size:28px; color:#94a3b8; margin-bottom:8px;"></i>
                    <h5 style="margin-bottom:4px; font-size:15px; font-weight:700; color:#334155;">No Navigation Headers Configured</h5>
                    <p style="font-size:12.5px; color:#64748b; margin-bottom:14px;">Add your first navigation header to display in the main site navbar.</p>
                    <button type="button" class="btn btn-sm btn-primary" onclick="window.openHeaderModal()">
                        <i class="fa fa-plus-circle"></i> Add Navigation Header
                    </button>
                </div>
            `;
            return;
        }

        container.innerHTML = items.map((item, idx) => {
            const isActive = item.enabled !== false;
            const subLinks = item.children || [];
            const subCount = subLinks.length;
            const isCustom = !['home', 'courses', 'universities', 'colleges', 'about', 'videos', 'blog', 'contact'].includes(item.id);
            
            let badgeClass = 'badge-red';
            if (item.badgeColor === 'green' || item.badge === 'UGC Valid') badgeClass = 'badge-green';
            else if (item.badgeColor === 'blue') badgeClass = 'badge-blue';
            else if (item.badgeColor === 'amber') badgeClass = '';

            let typeBadge = 'Direct Link';
            if (item.type === 'megamenu') typeBadge = 'Mega-Menu';
            else if (item.type === 'dropdown' || subCount > 0) typeBadge = `Dropdown (${subCount})`;

            return `
                <div class="header-nav-card" style="opacity:${isActive ? '1' : '0.65'}; border-left:4px solid ${isActive ? '#10b981' : '#cbd5e1'}; background:#ffffff; border:1px solid #e2e8f0; border-radius:10px; padding:14px 18px; display:flex; align-items:center; justify-content:space-between; gap:14px; margin-bottom:10px; transition:all 0.18s ease;">
                    <div style="display:flex; align-items:center; gap:12px; flex:1; min-width:0;">
                        <div style="font-size:12px; font-weight:700; color:#64748b; background:#f1f5f9; width:28px; height:28px; border-radius:6px; display:flex; align-items:center; justify-content:center; flex-shrink:0;">
                            #${idx + 1}
                        </div>
                        <div style="min-width:0; flex:1;">
                            <div class="header-nav-title" style="display:flex; align-items:center; gap:8px; flex-wrap:wrap; margin-bottom:4px;">
                                <strong style="font-size:15px; color:#0f172a;">${escapeHtml(item.title)}</strong>
                                ${item.badge ? `<span class="header-nav-badge ${badgeClass}" style="font-size:11px; font-weight:700; padding:2px 8px; border-radius:12px;">${escapeHtml(item.badge)}</span>` : ''}
                                <span style="font-size:11px; font-weight:600; padding:2px 8px; border-radius:10px; background:#f1f5f9; color:#475569;">${typeBadge}</span>
                                ${isActive ? 
                                    '<span style="font-size:11px; font-weight:700; color:#059669; display:inline-flex; align-items:center; gap:4px;"><i class="fa fa-check-circle"></i> Live on Site</span>' : 
                                    '<span style="font-size:11px; font-weight:700; color:#ef4444; display:inline-flex; align-items:center; gap:4px;"><i class="fa fa-eye-slash"></i> Hidden</span>'
                                }
                            </div>
                            <div class="header-nav-url" style="font-size:12px; color:#64748b;">
                                <span>Target:</span> <code style="background:#f8fafc; padding:2px 6px; border-radius:4px; font-size:11.5px;">${escapeHtml(item.url || '#')}</code>
                                ${subCount > 0 ? ` &bull; <strong style="color:#3b82f6;">${subCount} Sub-Link${subCount > 1 ? 's' : ''}</strong>` : ''}
                            </div>
                        </div>
                    </div>

                    <div style="display:flex; align-items:center; gap:8px; flex-shrink:0;">
                        <!-- Manage Sub-links -->
                        <button type="button" class="btn btn-sm btn-outline" onclick="window.openSubLinksModal('${escapeHtml(item.id)}')" title="Manage Dropdown Sub-Links">
                            <i class="fa fa-list-ul" style="color:#3b82f6;"></i> Sub-Links (${subCount})
                        </button>
                        
                        <!-- Toggle Live Visibility -->
                        <button type="button" class="btn btn-sm ${isActive ? 'btn-outline' : 'btn-primary'}" onclick="window.toggleHeaderActive('${escapeHtml(item.id)}')" title="${isActive ? 'Hide from live website visitors' : 'Make visible on live website'}" style="${isActive ? 'color:#64748b;' : 'background:#10b981; border-color:#10b981;'}">
                            <i class="fa ${isActive ? 'fa-eye-slash' : 'fa-eye'}"></i> ${isActive ? 'Hide' : 'Show on Site'}
                        </button>

                        <!-- Edit Header -->
                        <button type="button" class="btn btn-sm btn-outline" onclick="window.openHeaderModal('${escapeHtml(item.id)}')" title="Edit Title, URL, or Badge">
                            <i class="fa fa-pencil" style="color:#0ea5e9;"></i> Edit
                        </button>

                        ${isCustom ? `
                            <button type="button" class="btn btn-sm btn-outline text-danger" onclick="window.deleteCustomHeader('${escapeHtml(item.id)}')" title="Delete Header">
                                <i class="fa fa-trash"></i>
                            </button>
                        ` : ''}
                    </div>
                </div>
            `;
        }).join('');
    }

    window.toggleHeaderActive = async function(headerId) {
        if (!siteMenu.navItems) return;
        const item = siteMenu.navItems.find(n => n.id === headerId);
        if (!item) return;

        const newState = item.enabled === false ? true : false;
        item.enabled = newState;
        await saveSiteMenuToBackend();
        showToast(`Header "${item.title}" is now ${newState ? 'visible on website navbar' : 'hidden from visitors'}.`, 'success');
        renderHeadersTab();
    };

    window.onHeaderTypeChange = function(type) {
        const urlInp = document.getElementById('headerUrlInput');
        if (!urlInp) return;
        if (type === 'dropdown' || type === 'megamenu') {
            if (!urlInp.value || urlInp.value === 'index.html' || urlInp.value === 'contact.html') {
                urlInp.value = '#';
            }
        } else if (urlInp.value === '#') {
            urlInp.value = 'courses.html';
        }
    };

    window.saveAnnouncementSettings = async function() {
        const text = (document.getElementById('announcementTextInput')?.value || '').trim();
        const ctaText = (document.getElementById('announcementCtaInput')?.value || '').trim();
        const ctaLink = (document.getElementById('announcementLinkInput')?.value || '').trim();
        const enabled = Boolean(document.getElementById('announcementEnableToggle')?.checked);

        if (!siteMenu.announcement) siteMenu.announcement = {};
        siteMenu.announcement.text = text;
        siteMenu.announcement.ctaText = ctaText;
        siteMenu.announcement.ctaLink = ctaLink;
        siteMenu.announcement.enabled = enabled;

        try {
            localStorage.setItem('eg_cms_menu', JSON.stringify(siteMenu));
            await cmsFetch(`${API_BASE}/api/content/menu`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    announcement: siteMenu.announcement,
                    navItems: (siteMenu.navItems && siteMenu.navItems.length > 0) ? siteMenu.navItems : undefined
                })
            });
            showToast('Top announcement ribbon saved & published live!', 'success');
        } catch (e) {
            console.error('Failed to save announcement:', e);
            showToast('Top announcement ribbon saved locally.', 'info');
        }
        renderHeadersTab();
    };

    window.openHeaderModal = function(headerId = null) {
        const modal = document.getElementById('headerModal');
        const form = document.getElementById('headerForm');
        if (!modal) return;
        if (form) form.reset();

        document.getElementById('editingHeaderId').value = headerId || '';

        if (headerId) {
            const item = (siteMenu.navItems || []).find(n => n.id === headerId);
            if (item) {
                const titleEl = document.getElementById('headerModalTitle');
                if (titleEl) titleEl.innerHTML = `<i class="fa fa-pencil text-primary"></i> Edit Navigation Header: "${escapeHtml(item.title)}"`;
                
                const titleInp = document.getElementById('headerTitleInput');
                if (titleInp) titleInp.value = item.title || '';

                const typeInp = document.getElementById('headerTypeInput');
                if (typeInp) typeInp.value = item.type || 'link';

                const urlInp = document.getElementById('headerUrlInput');
                if (urlInp) urlInp.value = item.url || '#';

                const badgeInp = document.getElementById('headerBadgeTextInput');
                if (badgeInp) badgeInp.value = item.badge || '';

                const badgeColorInp = document.getElementById('headerBadgeColorInput');
                if (badgeColorInp) badgeColorInp.value = item.badgeColor || (item.badge === 'UGC Valid' ? 'green' : 'red');

                const enableInp = document.getElementById('headerEnabledToggle');
                if (enableInp) enableInp.checked = item.enabled !== false;
            }
        } else {
            const titleEl = document.getElementById('headerModalTitle');
            if (titleEl) titleEl.innerHTML = '<i class="fa fa-bars text-primary"></i> Add Navigation Header';
            
            const urlInp = document.getElementById('headerUrlInput');
            if (urlInp) urlInp.value = '#';
            
            const enableInp = document.getElementById('headerEnabledToggle');
            if (enableInp) enableInp.checked = true;
        }

        modal.classList.add('open');
        modal.classList.add('show');
    };

    window.closeHeaderModal = function() {
        const modal = document.getElementById('headerModal');
        if (modal) {
            modal.classList.remove('open');
            modal.classList.remove('show');
        }
    };

    window.handleHeaderSubmit = async function(e) {
        if (e) e.preventDefault();

        const editingId = (document.getElementById('editingHeaderId')?.value || '').trim();
        const title = (document.getElementById('headerTitleInput')?.value || '').trim();
        const type = (document.getElementById('headerTypeInput')?.value || 'link').trim();
        const url = (document.getElementById('headerUrlInput')?.value || '').trim() || '#';
        const badge = (document.getElementById('headerBadgeTextInput')?.value || '').trim();
        const badgeColor = (document.getElementById('headerBadgeColorInput')?.value || 'red').trim();
        const enabled = Boolean(document.getElementById('headerEnabledToggle')?.checked);

        if (!title) {
            alert('Please enter a header navigation title');
            return;
        }

        if (!siteMenu.navItems) siteMenu.navItems = [];

        if (editingId) {
            const idx = siteMenu.navItems.findIndex(n => n.id === editingId);
            if (idx !== -1) {
                siteMenu.navItems[idx].title = title;
                siteMenu.navItems[idx].type = type;
                siteMenu.navItems[idx].url = url;
                siteMenu.navItems[idx].badge = badge || undefined;
                siteMenu.navItems[idx].badgeColor = badgeColor;
                siteMenu.navItems[idx].enabled = enabled;
            }
        } else {
            const newId = slugify(title) || `header-${Date.now()}`;
            siteMenu.navItems.push({
                id: newId,
                title: title,
                url: url,
                type: type,
                badge: badge || undefined,
                badgeColor: badgeColor,
                enabled: enabled,
                order: siteMenu.navItems.length + 1,
                children: []
            });
        }

        await saveSiteMenuToBackend();
        window.closeHeaderModal();
        showToast('Navigation Header saved and published live!', 'success');
        renderHeadersTab();
    };

    // Sub-Links Management Modal Controller
    window.openSubLinksModal = function(headerId) {
        const modal = document.getElementById('subLinksModal');
        if (!modal) return;

        currentEditingHeaderId = headerId;
        const item = (siteMenu.navItems || []).find(n => n.id === headerId);
        if (!item) return;

        currentEditingSubLinks = JSON.parse(JSON.stringify(item.children || []));

        const subHeaderId = document.getElementById('subLinksHeaderId');
        if (subHeaderId) subHeaderId.value = headerId;

        const modalTitle = document.getElementById('subLinksModalTitle');
        if (modalTitle) modalTitle.innerHTML = `<i class="fa fa-list-ul text-primary"></i> Sub-Links for: "${escapeHtml(item.title)}"`;

        const subTitle = document.getElementById('subLinksModalSubtitle');
        if (subTitle) subTitle.innerHTML = `Configure dropdown child links that open when users hover or click on <strong>"${escapeHtml(item.title)}"</strong>.`;

        // Clear add inputs
        const tInp = document.getElementById('newSubLinkTitle');
        if (tInp) tInp.value = '';
        const uInp = document.getElementById('newSubLinkUrl');
        if (uInp) uInp.value = '';
        const dInp = document.getElementById('newSubLinkDesc');
        if (dInp) dInp.value = '';

        renderSubLinksListRows();

        modal.classList.add('open');
        modal.classList.add('show');
    };

    window.closeSubLinksModal = function() {
        const modal = document.getElementById('subLinksModal');
        if (modal) {
            modal.classList.remove('open');
            modal.classList.remove('show');
        }
        currentEditingHeaderId = null;
        currentEditingSubLinks = [];
    };

    function renderSubLinksListRows() {
        const container = document.getElementById('subLinksListContainer');
        if (!container) return;

        if (currentEditingSubLinks.length === 0) {
            container.innerHTML = `
                <div style="text-align:center; padding:24px; background:#f8fafc; border:1px dashed #cbd5e1; border-radius:8px; color:#64748b; font-size:13px;">
                    <i class="fa fa-info-circle" style="color:#3b82f6; font-size:16px; margin-bottom:4px; display:block;"></i>
                    No sub-links in this dropdown yet. Use the form above to add child links.
                </div>
            `;
            return;
        }

        container.innerHTML = currentEditingSubLinks.map((link, idx) => `
            <div class="sublink-row-item" style="display:flex; align-items:center; gap:8px; background:#ffffff; border:1px solid #e2e8f0; border-radius:8px; padding:8px 12px; box-shadow:0 1px 3px rgba(0,0,0,0.02);">
                <div style="font-size:11px; font-weight:700; color:#64748b; background:#f1f5f9; width:22px; height:22px; border-radius:4px; display:flex; align-items:center; justify-content:center; flex-shrink:0;">
                    ${idx + 1}
                </div>
                <div style="flex:2;">
                    <input type="text" class="form-control form-control-sm" value="${escapeHtml(link.title)}" placeholder="Title" oninput="currentEditingSubLinks[${idx}].title = this.value">
                </div>
                <div style="flex:2;">
                    <input type="text" class="form-control form-control-sm" value="${escapeHtml(link.url || '#')}" placeholder="URL" oninput="currentEditingSubLinks[${idx}].url = this.value">
                </div>
                <div style="flex:3;">
                    <input type="text" class="form-control form-control-sm" value="${escapeHtml(link.desc || '')}" placeholder="Short preview hint" oninput="currentEditingSubLinks[${idx}].desc = this.value">
                </div>
                <button type="button" class="btn btn-sm btn-outline text-danger" onclick="window.removeSubLinkRow(${idx})" title="Remove link" style="padding:4px 8px; flex-shrink:0;">
                    <i class="fa fa-times"></i>
                </button>
            </div>
        `).join('');
    }

    window.addNewSubLinkRow = function() {
        const titleInp = document.getElementById('newSubLinkTitle');
        const urlInp = document.getElementById('newSubLinkUrl');
        const descInp = document.getElementById('newSubLinkDesc');

        const title = (titleInp ? titleInp.value.trim() : '');
        const url = (urlInp ? urlInp.value.trim() : '') || 'contact.html';
        const desc = (descInp ? descInp.value.trim() : '');

        if (!title) {
            alert('Please enter a Title for the new sub-link.');
            return;
        }

        currentEditingSubLinks.push({
            id: slugify(title) || `link-${Date.now()}`,
            title,
            url,
            desc
        });

        if (titleInp) titleInp.value = '';
        if (urlInp) urlInp.value = '';
        if (descInp) descInp.value = '';

        renderSubLinksListRows();
    };

    window.removeSubLinkRow = function(idx) {
        if (idx >= 0 && idx < currentEditingSubLinks.length) {
            currentEditingSubLinks.splice(idx, 1);
            renderSubLinksListRows();
        }
    };

    window.saveSubLinksChanges = async function() {
        if (!currentEditingHeaderId) {
            window.closeSubLinksModal();
            return;
        }

        const item = (siteMenu.navItems || []).find(n => n.id === currentEditingHeaderId);
        if (!item) {
            window.closeSubLinksModal();
            return;
        }

        item.children = currentEditingSubLinks;
        if (item.children.length > 0 && item.type === 'link') {
            item.type = 'dropdown';
        }

        await saveSiteMenuToBackend();
        showToast(`Sub-links for "${item.title}" saved and published live!`, 'success');
        window.closeSubLinksModal();
        renderHeadersTab();
    };

    window.deleteCustomHeader = async function(headerId) {
        const item = (siteMenu.navItems || []).find(n => n.id === headerId);
        const name = item ? item.title : 'this header';
        if (!confirm(`Are you sure you want to delete navigation header "${name}"?`)) return;

        siteMenu.navItems = (siteMenu.navItems || []).filter(n => n.id !== headerId);
        await saveSiteMenuToBackend();
        showToast(`Header "${name}" removed successfully.`, 'success');
        renderHeadersTab();
    };

    async function saveSiteMenuToBackend() {
        try {
            localStorage.setItem('eg_cms_menu', JSON.stringify(siteMenu));
            await cmsFetch(`${API_BASE}/api/content/menu`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(siteMenu)
            });
        } catch (e) {
            console.error('Failed to save menu to backend:', e);
        }
    }

    // ================= INITIALIZATION =================
    async function init() {
        setupAuthListeners();
        setupEventListeners();
        const isAuthenticated = checkAuth();
        if (isAuthenticated) {
            await loadData();
            renderAll();
        }
    }

    // Background polling (every 15s) so updates made from other devices/admins appear dynamically
    if (!window._editSyncTimer) {
        window._editSyncTimer = setInterval(async () => {
            if (!editingCourseId && !editingCollegeId && !editingUnivId && !editingBlogId && !editingVideoId) {
                try {
                    const res = await cmsFetch(`${API_BASE}/api/content/all`);
                    if (res.ok) {
                        const json = await res.json();
                        if (json && json.success && json.data) {
                            if (Array.isArray(json.data.courses)) courses = json.data.courses.map(normalizeCourse);
                            if (Array.isArray(json.data.colleges)) colleges = json.data.colleges.map(normalizeCollege);
                            if (Array.isArray(json.data.universities)) universities = json.data.universities.map(normalizeUniversity);
                            if (Array.isArray(json.data.blogs)) blogs = json.data.blogs.map(normalizeBlog);
                            if (Array.isArray(json.data.videos)) videos = json.data.videos.map(normalizeVideo);
                            if (json.data.menu && Array.isArray(json.data.menu.navItems) && json.data.menu.navItems.length > 0) {
                                siteMenu = json.data.menu;
                                try { localStorage.setItem('eg_cms_menu', JSON.stringify(siteMenu)); } catch(e){}
                            }
                            updateServerStatusUI(true);
                            renderAll();
                        }
                    }
                } catch (e) {}
            }
        }, 15000);
    }

    // Listen for cms:synced events from other components
    window.addEventListener('cms:synced', (e) => {
        if (!editingCourseId && !editingCollegeId && !editingUnivId && !editingBlogId && !editingVideoId) {
            if (e && e.detail) {
                if (Array.isArray(e.detail.courses)) courses = e.detail.courses.map(normalizeCourse);
                if (Array.isArray(e.detail.colleges)) colleges = e.detail.colleges.map(normalizeCollege);
                if (Array.isArray(e.detail.universities)) universities = e.detail.universities.map(normalizeUniversity);
                if (Array.isArray(e.detail.blogs)) blogs = e.detail.blogs.map(normalizeBlog);
                if (Array.isArray(e.detail.videos)) videos = e.detail.videos.map(normalizeVideo);
                renderAll();
            }
        }
    });

    // Auto-init on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
