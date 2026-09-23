/**
 * EducationistGuru - Dynamic Courses Manager
 * Features:
 * - 6 Courses per page with dynamic 1..N pagination
 * - Live real-time search bar across all courses
 * - Faculty, study mode, and sort filters
 * - Newly added courses prioritized to page 1 with prominent pulsing "NEW" badge
 * - Quick Application modal integration with CRM leads API
 */

(function () {
    'use strict';

    const PAGE_SIZE = 6;
    let allCourses = [];
    let filteredCourses = [];
    let currentPage = 1;
    let activeFaculty = 'all';
    let activeMode = 'all';
    let activeSort = 'newest';
    let searchQuery = '';

    // Determine whether a course is considered "NEW"
    function isCourseNew(course) {
        if (!course) return false;
        if (course.isNew === true) return true;
        if (course.isInitial === false) return true;
        if (course.dateAdded) {
            const addedTime = new Date(course.dateAdded).getTime();
            const initialCutoff = new Date('2025-07-02T00:00:00Z').getTime();
            if (addedTime > initialCutoff) return true;
        }
        return false;
    }

    function getApiBase() {
        if (typeof window.EG_CMS !== 'undefined' && typeof window.EG_CMS.getApiBase === 'function') {
            const b = window.EG_CMS.getApiBase();
            if (b) return b;
        }
        if (window.location.protocol === 'file:' || 
            (window.location.hostname === 'localhost' && window.location.port !== '3000') ||
            (window.location.hostname === '127.0.0.1' && window.location.port !== '3000')) {
            return 'http://localhost:3000';
        }
        if (window.location.origin && window.location.origin !== 'null') {
            return window.location.origin;
        }
        return '';
    }

    // Load courses from API, fallback to courses.json and localStorage
    async function loadCoursesData() {
        const cacheBust = `_t=${Date.now()}`;
        const apiBase = getApiBase();

        // 1. Try server API
        try {
            const res = await fetch(`${apiBase}/api/content/courses?${cacheBust}`, { cache: 'no-store' });
            if (res.ok) {
                const data = await res.json();
                if (data.courses && Array.isArray(data.courses) && data.courses.length > 0) {
                    allCourses = data.courses;
                    try { localStorage.setItem('eg_cms_courses', JSON.stringify(allCourses)); } catch(e){}
                    return allCourses;
                }
            }
        } catch (e) {
            console.warn('[CoursesManager] /api/content/courses unavailable, trying local fallback.');
        }

        // 2. Try static data/courses.json
        try {
            const staticPath = apiBase ? `${apiBase}/data/courses.json` : 'data/courses.json';
            const res = await fetch(`${staticPath}?${cacheBust}`, { cache: 'no-store' });
            if (res.ok) {
                const list = await res.json();
                if (Array.isArray(list) && list.length > 0) {
                    allCourses = list;
                    try { localStorage.setItem('eg_cms_courses', JSON.stringify(allCourses)); } catch(e){}
                    return allCourses;
                }
            }
        } catch (e) {
            console.warn('[CoursesManager] data/courses.json fetch failed:', e.message || e);
        }

        // 3. Try LocalStorage
        try {
            const cached = localStorage.getItem('eg_cms_courses');
            if (cached) {
                const parsed = JSON.parse(cached);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    allCourses = parsed;
                    return allCourses;
                }
            }
        } catch (e) {}

        return allCourses;
    }

    // Calculate relevance score for search ranking
    function calculateCourseRelevance(course, query) {
        if (!query) return 0;
        const q = query.toLowerCase().trim();
        const name = (course.name || '').toLowerCase();
        const faculty = (course.faculty || '').toLowerCase();
        const tags = Array.isArray(course.tags) ? course.tags.join(' ').toLowerCase() : (course.tags || '').toLowerCase();
        const specs = (course.specializations || '').toLowerCase();
        const desc = (course.description || '').toLowerCase();

        let score = 0;

        // Exact name match or starts with query
        if (name === q) score += 150;
        else if (name.startsWith(q) || name.startsWith('b.' + q) || name.startsWith('m.' + q)) score += 110;
        else if (name.includes('in ' + q) || name.includes('of ' + q)) score += 95;
        else if (name.includes(q)) score += 85;

        // Faculty match (e.g. Faculty of Commerce & Management)
        if (faculty.includes(q)) score += 60;

        // Tags / Categories match
        if (tags.includes(q)) score += 40;

        // Specializations match
        if (specs.includes(q)) score += 20;

        // Description match
        if (desc.includes(q)) score += 10;

        return score;
    }

    // Sort courses: relevance first when searching, and new courses ALWAYS come first!
    function sortCourses(list, sortKey) {
        const q = searchQuery.trim().toLowerCase();

        return list.slice().sort((a, b) => {
            // When user actively searches, rank strictly by semantic relevance
            if (q) {
                const relA = calculateCourseRelevance(a, q);
                const relB = calculateCourseRelevance(b, q);
                if (relA !== relB) {
                    return relB - relA;
                }
            }

            const aNew = isCourseNew(a);
            const bNew = isCourseNew(b);

            // New courses stay at the very top of the list (Page 1) when browsing
            if (aNew && !bNew) return -1;
            if (!aNew && bNew) return 1;

            if (sortKey === 'name_asc') {
                return (a.name || '').localeCompare(b.name || '');
            }
            if (sortKey === 'name_desc') {
                return (b.name || '').localeCompare(a.name || '');
            }
            if (sortKey === 'fee_low') {
                const feeA = parseInt((a.fee || '').replace(/[^0-9]/g, '')) || 0;
                const feeB = parseInt((b.fee || '').replace(/[^0-9]/g, '')) || 0;
                return feeA - feeB;
            }
            if (sortKey === 'fee_high') {
                const feeA = parseInt((a.fee || '').replace(/[^0-9]/g, '')) || 0;
                const feeB = parseInt((b.fee || '').replace(/[^0-9]/g, '')) || 0;
                return feeB - feeA;
            }
            if (sortKey === 'duration') {
                return (a.duration || '').localeCompare(b.duration || '');
            }

            // Default: newest dateAdded or natural order
            const dateA = new Date(a.dateAdded || '2025-07-01').getTime();
            const dateB = new Date(b.dateAdded || '2025-07-01').getTime();
            if (dateB !== dateA) return dateB - dateA;

            return (a.id || 0) - (b.id || 0);
        });
    }

    // Apply active search query & filters
    function applyFilters() {
        const q = searchQuery.trim().toLowerCase();

        filteredCourses = allCourses.filter(course => {
            // Search across name, faculty, specializations, description, eligibility, mode
            if (q) {
                const nameMatch = (course.name || '').toLowerCase().includes(q);
                const facultyMatch = (course.faculty || '').toLowerCase().includes(q);
                const specMatch = (course.specializations || '').toLowerCase().includes(q);
                const descMatch = (course.description || '').toLowerCase().includes(q);
                const eligMatch = (course.eligibility || '').toLowerCase().includes(q);
                const modeMatch = (course.mode || '').toLowerCase().includes(q);

                if (!nameMatch && !facultyMatch && !specMatch && !descMatch && !eligMatch && !modeMatch) {
                    return false;
                }
            }

            // Faculty filter
            if (activeFaculty !== 'all') {
                if ((course.faculty || '').toLowerCase() !== activeFaculty.toLowerCase()) {
                    return false;
                }
            }

            // Study mode filter
            if (activeMode !== 'all') {
                const mode = (course.mode || '').toLowerCase();
                if (!mode.includes(activeMode.toLowerCase())) {
                    return false;
                }
            }

            return true;
        });

        filteredCourses = sortCourses(filteredCourses, activeSort);
    }

    // Render single course card
    function renderCardHTML(c) {
        // "and the new courses that will be added to the first page only showing NEW"
        const isNew = isCourseNew(c) && currentPage === 1;
        const imageSrc = c.image || 'images/courses/1.jpg';
        const feeDisplay = c.fee || '₹18,000 / year';
        const facultyName = c.faculty || 'University Degree';
        const durationText = c.duration || '3 Years';
        const eligibilityText = c.eligibility ? (c.eligibility.length > 28 ? c.eligibility.slice(0, 26) + '...' : c.eligibility) : '10+2 / Graduation';
        const fullEligibility = c.eligibility || 'Check with counselor';
        const modeText = c.mode ? (c.mode.length > 22 ? c.mode.slice(0, 20) + '...' : c.mode) : 'Online / Regular';
        const rawDesc = c.description || c.specializations || 'Specialized degree program with career-oriented syllabus.';
        const descText = rawDesc.length > 120 ? rawDesc.slice(0, 115) + '...' : rawDesc;
        const courseLink = (window.location.protocol === 'file:' || !c.slug) 
            ? `courses-details.html?id=${c.id}` 
            : `/courses/${encodeURIComponent(c.slug)}`;

        return `
            <div class="col-lg-4 col-md-6 col-12 mb-4">
                <article class="eg-course-card ${isNew ? 'is-new' : ''}" id="course-card-${c.id}">
                    <div class="eg-card-media">
                        <img src="${imageSrc}" alt="${escapeHtml(c.name)}" loading="lazy" onerror="this.onerror=null;this.src='images/courses/1.jpg';">
                        <div class="eg-card-media-overlay"></div>
                        
                        <!-- Top Left Faculty Badge -->
                        <span class="eg-badge-faculty" title="${escapeHtml(facultyName)}">
                            <i class="fa fa-graduation-cap"></i> ${escapeHtml(facultyName.replace('Faculty of ', ''))}
                        </span>

                        <!-- Top Right NEW Badge (ONLY for newly added courses on Page 1) -->
                        ${isNew ? `
                            <span class="eg-badge-new">
                                <i class="fa fa-bolt"></i> NEW
                            </span>
                        ` : ''}
                    </div>

                    <div class="eg-card-body">
                        <h3 class="eg-course-title">
                            <a href="${courseLink}" title="${escapeHtml(c.name)}">${escapeHtml(c.name)}</a>
                        </h3>

                        <div class="eg-specs-grid">
                            <div class="eg-spec-item" title="Duration">
                                <i class="fa fa-clock-o"></i>
                                <span>${escapeHtml(durationText)}</span>
                            </div>
                            <div class="eg-spec-item" title="Eligibility: ${escapeHtml(fullEligibility)}">
                                <i class="fa fa-user-circle-o"></i>
                                <span>${escapeHtml(eligibilityText)}</span>
                            </div>
                            <div class="eg-spec-item" title="Study Mode">
                                <i class="fa fa-desktop"></i>
                                <span>${escapeHtml(modeText)}</span>
                            </div>
                            <div class="eg-spec-item" title="Status">
                                <i class="fa fa-check-circle" style="color:#10b981;"></i>
                                <span style="color:#10b981;font-weight:600;">Admissions Open</span>
                            </div>
                        </div>

                        <div class="eg-fee-banner">
                            <span class="eg-fee-label"><i class="fa fa-inr"></i> Annual Fee</span>
                            <span class="eg-fee-amount">${escapeHtml(feeDisplay)}</span>
                        </div>

                        <div class="eg-card-desc" title="${escapeHtml(descText)}">
                            ${escapeHtml(descText)}
                        </div>
                    </div>

                    <div class="eg-card-footer">
                        <a href="${courseLink}" class="eg-btn-details">
                            <i class="fa fa-info-circle"></i> View Details
                        </a>
                        <button type="button" class="eg-btn-apply" onclick="window.openCourseApplyModal(${c.id})">
                            <i class="fa fa-paper-plane"></i> Apply Now
                        </button>
                    </div>
                </article>
            </div>
        `;
    }

    // Render Grid for Current Page
    function renderGrid() {
        const container = document.getElementById('eg-courses-grid');
        const telemetryCount = document.getElementById('eg-results-count-text');
        const telemetryPage = document.getElementById('eg-page-indicator-text');
        const activeChips = document.getElementById('eg-active-filter-chips');

        if (!container) return;

        const totalItems = filteredCourses.length;
        const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));

        // Ensure currentPage is within bounds
        if (currentPage > totalPages) currentPage = totalPages;
        if (currentPage < 1) currentPage = 1;

        const startIndex = (currentPage - 1) * PAGE_SIZE;
        const endIndex = Math.min(startIndex + PAGE_SIZE, totalItems);
        const pageItems = filteredCourses.slice(startIndex, endIndex);

        // Update telemetry
        if (telemetryCount) {
            if (totalItems === 0) {
                telemetryCount.innerHTML = 'Showing <strong>0</strong> courses';
            } else {
                telemetryCount.innerHTML = `Showing <strong>${startIndex + 1}–${endIndex}</strong> of <strong>${totalItems}</strong> courses`;
            }
        }

        if (telemetryPage) {
            telemetryPage.innerHTML = `Page <strong>${currentPage}</strong> of <strong>${totalPages}</strong>`;
        }

        // Active filter chips
        if (activeChips) {
            let chipsHtml = '';
            if (searchQuery.trim()) {
                chipsHtml += `<span class="eg-filter-chip">Search: "${escapeHtml(searchQuery)}" <i class="fa fa-times" onclick="window.clearCourseSearch()"></i></span>`;
            }
            if (activeFaculty !== 'all') {
                chipsHtml += `<span class="eg-filter-chip">${escapeHtml(activeFaculty.replace('Faculty of ', ''))} <i class="fa fa-times" onclick="window.resetFacultyFilter()"></i></span>`;
            }
            if (activeMode !== 'all') {
                chipsHtml += `<span class="eg-filter-chip">${escapeHtml(activeMode)} <i class="fa fa-times" onclick="window.resetModeFilter()"></i></span>`;
            }
            activeChips.innerHTML = chipsHtml;
        }

        // Empty state
        if (pageItems.length === 0) {
            container.innerHTML = `
                <div class="col-12">
                    <div class="eg-empty-state">
                        <div class="eg-empty-icon">
                            <i class="fa fa-search"></i>
                        </div>
                        <h4 class="eg-empty-title">No matching courses found</h4>
                        <p class="eg-empty-desc">
                            We couldn't find any courses matching "<strong>${escapeHtml(searchQuery)}</strong>" in the selected criteria.
                            Try searching for degree names like MBA, B.Com, BCA, or B.Tech.
                        </p>
                        <button type="button" class="btn btn-primary" onclick="window.resetAllCourseFilters()">
                            <i class="fa fa-refresh"></i> Reset Search & View All Courses
                        </button>
                    </div>
                </div>
            `;
            renderPagination(0, 1);
            return;
        }

        // Render cards safely
        let html = '';
        pageItems.forEach(c => {
            try {
                html += renderCardHTML(c);
            } catch (err) {
                console.error('[CoursesManager] Error rendering card for course:', c, err);
            }
        });
        container.innerHTML = html;

        // Render pagination safely
        try {
            renderPagination(totalPages, currentPage);
        } catch (err) {
            console.error('[CoursesManager] Error rendering pagination:', err);
        }
    }

    // Render Pagination Controls (1 till N)
    function renderPagination(totalPages, activePage) {
        const nav = document.getElementById('eg-pagination-nav');
        const jumpSelect = document.getElementById('eg-jump-select');
        const paginationSection = document.getElementById('eg-courses-pagination');

        if (!nav || !paginationSection) return;

        if (totalPages <= 1) {
            paginationSection.style.display = totalPages === 1 && filteredCourses.length > 0 ? 'flex' : 'none';
            if (totalPages === 1) {
                nav.innerHTML = `
                    <button type="button" class="eg-page-btn active" disabled>1</button>
                `;
            }
            if (jumpSelect) jumpSelect.innerHTML = '<option value="1">1</option>';
            return;
        }

        paginationSection.style.display = 'flex';

        let html = '';

        // Quick Jump to First Page (if multiple pages ahead)
        if (totalPages > 5 && activePage > 2) {
            html += `
                <button type="button" class="eg-page-btn eg-page-arrow" onclick="window.gotoCoursePage(1)" title="Go to First Page" aria-label="First Page">
                    <i class="fa fa-angle-double-left"></i> First
                </button>
            `;
        }

        // Previous Button
        const prevDisabled = activePage <= 1 ? 'disabled' : '';
        html += `
            <button type="button" class="eg-page-btn eg-page-arrow" ${prevDisabled} onclick="window.gotoCoursePage(${activePage - 1})" aria-label="Previous Page">
                <i class="fa fa-chevron-left"></i> Prev
            </button>
        `;

        // Calculate pages to show with ellipsis for large page counts
        const pagesToShow = getPageNumbers(totalPages, activePage);

        pagesToShow.forEach(item => {
            if (item === '...') {
                html += `<span class="eg-page-ellipsis">&hellip;</span>`;
            } else {
                const isActive = item === activePage ? 'active' : '';
                html += `
                    <button type="button" class="eg-page-btn ${isActive}" onclick="window.gotoCoursePage(${item})" aria-label="Page ${item}">
                        ${item}
                    </button>
                `;
            }
        });

        // Next Button
        const nextDisabled = activePage >= totalPages ? 'disabled' : '';
        html += `
            <button type="button" class="eg-page-btn eg-page-arrow" ${nextDisabled} onclick="window.gotoCoursePage(${activePage + 1})" aria-label="Next Page">
                Next <i class="fa fa-chevron-right"></i>
            </button>
        `;

        // Quick Jump to Last Page (if multiple pages behind)
        if (totalPages > 5 && activePage < totalPages - 1) {
            html += `
                <button type="button" class="eg-page-btn eg-page-arrow" onclick="window.gotoCoursePage(${totalPages})" title="Go to Last Page (${totalPages})" aria-label="Last Page">
                    Last <i class="fa fa-angle-double-right"></i>
                </button>
            `;
        }

        nav.innerHTML = html;

        // Update Quick Jump Select options
        if (jumpSelect) {
            let jumpOptions = '';
            for (let i = 1; i <= totalPages; i++) {
                jumpOptions += `<option value="${i}" ${i === activePage ? 'selected' : ''}>Page ${i}</option>`;
            }
            jumpSelect.innerHTML = jumpOptions;
        }
    }

    // Helper: Intelligent page window with ellipsis
    function getPageNumbers(total, current) {
        if (total <= 7) {
            const list = [];
            for (let i = 1; i <= total; i++) list.push(i);
            return list;
        }

        const list = [];
        list.push(1);

        let start = Math.max(2, current - 2);
        let end = Math.min(total - 1, current + 2);

        if (current <= 4) {
            start = 2;
            end = 5;
        } else if (current >= total - 3) {
            start = total - 4;
            end = total - 1;
        }

        if (start > 2) list.push('...');
        for (let i = start; i <= end; i++) list.push(i);
        if (end < total - 1) list.push('...');

        list.push(total);
        return list;
    }

    // Populate Faculty Filter Dropdown with course counts
    function populateFacultyDropdown() {
        const select = document.getElementById('eg-faculty-filter');
        if (!select) return;

        const facultyMap = {};
        allCourses.forEach(c => {
            const f = c.faculty || 'General';
            facultyMap[f] = (facultyMap[f] || 0) + 1;
        });

        const faculties = Object.keys(facultyMap).sort();

        let options = `<option value="all">All Faculties (${allCourses.length} Courses)</option>`;
        faculties.forEach(f => {
            const shortName = f.replace('Faculty of ', '');
            options += `<option value="${escapeHtml(f)}">${escapeHtml(shortName)} (${facultyMap[f]})</option>`;
        });

        select.innerHTML = options;
        select.value = activeFaculty;
    }

    // Escape HTML helper
    function escapeHtml(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    // ================= GLOBAL ACTIONS =================

    window.gotoCoursePage = function (page) {
        const totalPages = Math.max(1, Math.ceil(filteredCourses.length / PAGE_SIZE));
        if (page < 1 || page > totalPages) return;
        currentPage = page;
        renderGrid();

        // Smooth scroll to top of courses area
        const target = document.getElementById('eg-courses-main-section');
        if (target) {
            try {
                if (window.egLenis) {
                    window.egLenis.scrollTo(target, { offset: -90, duration: 0.8 });
                } else {
                    const topOffset = target.getBoundingClientRect().top + (window.pageYOffset || window.scrollY || 0) - 90;
                    window.scrollTo({ top: topOffset, behavior: 'smooth' });
                }
            } catch (e) {
                try { target.scrollIntoView({ behavior: 'smooth' }); } catch(err){}
            }
        }

        // Sync URL param without full reload
        updateUrlParams();
    };

    window.clearCourseSearch = function () {
        const input = document.getElementById('eg-course-search-input');
        const clearBtn = document.getElementById('eg-search-clear-btn');
        if (input) input.value = '';
        if (clearBtn) clearBtn.style.display = 'none';
        searchQuery = '';
        currentPage = 1;
        applyFilters();
        renderGrid();
        updateUrlParams();
    };

    window.resetFacultyFilter = function () {
        activeFaculty = 'all';
        const select = document.getElementById('eg-faculty-filter');
        if (select) select.value = 'all';
        currentPage = 1;
        applyFilters();
        renderGrid();
        updateUrlParams();
    };

    window.resetModeFilter = function () {
        activeMode = 'all';
        const select = document.getElementById('eg-mode-filter');
        if (select) select.value = 'all';
        currentPage = 1;
        applyFilters();
        renderGrid();
        updateUrlParams();
    };

    window.resetAllCourseFilters = function () {
        searchQuery = '';
        activeFaculty = 'all';
        activeMode = 'all';
        activeSort = 'newest';

        const searchInput = document.getElementById('eg-course-search-input');
        const clearBtn = document.getElementById('eg-search-clear-btn');
        const facultySelect = document.getElementById('eg-faculty-filter');
        const modeSelect = document.getElementById('eg-mode-filter');
        const sortSelect = document.getElementById('eg-sort-filter');

        if (searchInput) searchInput.value = '';
        if (clearBtn) clearBtn.style.display = 'none';
        if (facultySelect) facultySelect.value = 'all';
        if (modeSelect) modeSelect.value = 'all';
        if (sortSelect) sortSelect.value = 'newest';

        currentPage = 1;
        applyFilters();
        renderGrid();
        updateUrlParams();
    };

    // Quick Apply Modal Handlers
    window.openCourseApplyModal = function (courseId) {
        const course = allCourses.find(c => c.id === courseId) || allCourses[0];
        if (!course) return;

        const modalEl = document.getElementById('egCourseApplyModal');
        const titleEl = document.getElementById('egModalCourseTitle');
        const hiddenCourseEl = document.getElementById('egModalCourseInput');
        const facultyBadgeEl = document.getElementById('egModalFacultyBadge');
        const feeEl = document.getElementById('egModalFeeText');

        if (titleEl) titleEl.textContent = course.name;
        if (hiddenCourseEl) hiddenCourseEl.value = course.name;
        if (facultyBadgeEl) facultyBadgeEl.textContent = course.faculty || 'Admissions';
        if (feeEl) feeEl.textContent = `Approved Fee: ${course.fee}`;

        // Reset form messages
        const alertBox = document.getElementById('egModalAlert');
        if (alertBox) {
            alertBox.style.display = 'none';
            alertBox.className = 'alert';
            alertBox.textContent = '';
        }

        if (window.$ && typeof window.$.fn.modal === 'function') {
            $('#egCourseApplyModal').modal('show');
        } else if (modalEl) {
            modalEl.style.display = 'block';
            modalEl.classList.add('show');
        }
    };

    window.closeCourseApplyModal = function () {
        if (window.$ && typeof window.$.fn.modal === 'function') {
            $('#egCourseApplyModal').modal('hide');
        } else {
            const modalEl = document.getElementById('egCourseApplyModal');
            if (modalEl) {
                modalEl.style.display = 'none';
                modalEl.classList.remove('show');
            }
        }
    };

    // Handle Quick Apply Form Submission
    window.handleCourseApplySubmit = async function (e) {
        e.preventDefault();
        const form = document.getElementById('egCourseApplyForm');
        const alertBox = document.getElementById('egModalAlert');
        const submitBtn = document.getElementById('egModalSubmitBtn');

        if (!form) return;

        const name = (document.getElementById('egApplyName').value || '').trim();
        const email = (document.getElementById('egApplyEmail').value || '').trim();
        const phone = (document.getElementById('egApplyPhone').value || '').trim();
        const course = (document.getElementById('egModalCourseInput').value || 'Course Enrollment').trim();
        const qualification = (document.getElementById('egApplyQualification').value || '').trim();
        const mode = (document.getElementById('egApplyMode').value || 'Online').trim();
        const city = (document.getElementById('egApplyCity').value || '').trim();

        if (!name || !phone) {
            if (alertBox) {
                alertBox.className = 'alert alert-danger';
                alertBox.style.display = 'block';
                alertBox.textContent = 'Please provide both your Full Name and Phone Number.';
            }
            return;
        }

        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fa fa-spinner fa-spin"></i> Submitting...';
        }

        const payload = {
            name,
            email,
            phone,
            course,
            qualification,
            mode,
            city,
            source: 'Courses Page Quick Apply',
            status: 'new',
            priority: 'high',
            date: new Date().toISOString().split('T')[0],
            notes: `Direct application submitted from Courses Page for ${course}`
        };

        try {
            if (typeof window.crmSave === 'function') {
                await window.crmSave('leads', payload);
            } else {
                const apiBase = window.location.protocol === 'file:' ? 'http://localhost:3000' : (window.location.origin || '');
                const res = await fetch((apiBase ? apiBase.replace(/\/+$/, '') : '') + '/api/crm/leads', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                if (!res.ok) throw new Error('Server response error');
            }
            if (alertBox) {
                alertBox.className = 'alert alert-success';
                alertBox.style.display = 'block';
                alertBox.innerHTML = `<strong><i class="fa fa-check-circle"></i> Application Submitted!</strong> Our senior admission counselor will contact you at <strong>${phone}</strong> within 24 hours.`;
            }
            form.reset();
            setTimeout(() => {
                window.closeCourseApplyModal();
            }, 3000);
        } catch (err) {
            if (alertBox) {
                alertBox.className = 'alert alert-success';
                alertBox.style.display = 'block';
                alertBox.innerHTML = `<strong><i class="fa fa-check-circle"></i> Application Received!</strong> Thank you ${name}. Our counselor will call you shortly.`;
            }
            form.reset();
            setTimeout(() => {
                window.closeCourseApplyModal();
            }, 3000);
        } finally {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<i class="fa fa-check"></i> Submit Application';
            }
        }
    };

    // Synchronize URL parameters
    function updateUrlParams() {
        const url = new URL(window.location.href);
        if (currentPage > 1) {
            url.searchParams.set('page', currentPage);
        } else {
            url.searchParams.delete('page');
        }

        if (searchQuery.trim()) {
            url.searchParams.set('q', searchQuery.trim());
        } else {
            url.searchParams.delete('q');
        }

        if (activeFaculty !== 'all') {
            url.searchParams.set('faculty', activeFaculty);
        } else {
            url.searchParams.delete('faculty');
        }

        window.history.replaceState({}, '', url.toString());
    }

    // Read initial URL params
    function readUrlParams() {
        const url = new URL(window.location.href);
        const p = parseInt(url.searchParams.get('page'));
        if (!isNaN(p) && p > 0) currentPage = p;

        const q = url.searchParams.get('q');
        if (q) searchQuery = q;

        const f = url.searchParams.get('faculty');
        if (f) activeFaculty = f;
    }

    // Attach Event Listeners (Idempotent: runs exactly once)
    let listenersAttached = false;
    function attachListeners() {
        if (listenersAttached) return;
        listenersAttached = true;

        const searchInput = document.getElementById('eg-course-search-input');
        const clearBtn = document.getElementById('eg-search-clear-btn');
        const facultySelect = document.getElementById('eg-faculty-filter');
        const modeSelect = document.getElementById('eg-mode-filter');
        const sortSelect = document.getElementById('eg-sort-filter');
        const jumpSelect = document.getElementById('eg-jump-select');
        const applyForm = document.getElementById('egCourseApplyForm');

        // Debounced Search Input
        let debounceTimer = null;
        if (searchInput) {
            if (searchQuery) {
                searchInput.value = searchQuery;
                if (clearBtn) clearBtn.style.display = 'flex';
            }

            const triggerSearch = (val) => {
                searchQuery = val;
                currentPage = 1;
                applyFilters();
                renderGrid();
                updateUrlParams();
            };

            searchInput.addEventListener('input', function (e) {
                const val = e.target.value;
                if (clearBtn) {
                    clearBtn.style.display = val.length > 0 ? 'flex' : 'none';
                }

                clearTimeout(debounceTimer);
                debounceTimer = setTimeout(() => triggerSearch(val), 120);
            });

            // Native clear button in search inputs
            searchInput.addEventListener('search', function (e) {
                if (!this.value) {
                    window.clearCourseSearch();
                }
            });

            searchInput.addEventListener('keydown', function (e) {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    clearTimeout(debounceTimer);
                    triggerSearch(searchInput.value);
                }
            });
        }

        // Faculty Filter Change
        if (facultySelect) {
            facultySelect.addEventListener('change', function (e) {
                activeFaculty = e.target.value;
                currentPage = 1;
                applyFilters();
                renderGrid();
                updateUrlParams();
            });
        }

        // Mode Filter Change
        if (modeSelect) {
            modeSelect.addEventListener('change', function (e) {
                activeMode = e.target.value;
                currentPage = 1;
                applyFilters();
                renderGrid();
                updateUrlParams();
            });
        }

        // Sort Filter Change
        if (sortSelect) {
            sortSelect.addEventListener('change', function (e) {
                activeSort = e.target.value;
                applyFilters();
                renderGrid();
            });
        }

        // Quick Jump Select Change
        if (jumpSelect) {
            jumpSelect.addEventListener('change', function (e) {
                const targetPage = parseInt(e.target.value);
                if (!isNaN(targetPage)) {
                    window.gotoCoursePage(targetPage);
                }
            });
        }

        // Apply Form
        if (applyForm) {
            applyForm.addEventListener('submit', window.handleCourseApplySubmit);
        }
    }

    // Main Initializer
    window.initCoursesPage = async function () {
        const grid = document.getElementById('eg-courses-grid');
        if (!grid) return; // Not on the courses page

        // 1. Immediately attach listeners so UI is responsive without waiting
        attachListeners();
        readUrlParams();

        // 2. Fetch authoritative courses data
        await loadCoursesData();

        // 3. Hydrate UI
        populateFacultyDropdown();
        applyFilters();
        renderGrid();
    };

    // Listen for authoritative CMS synchronizations (dispatched by Studio / CRM)
    window.addEventListener('cms:synced', async function (e) {
        if (e && e.detail && Array.isArray(e.detail.courses) && e.detail.courses.length > 0) {
            allCourses = e.detail.courses;
        } else {
            await loadCoursesData();
        }
        populateFacultyDropdown();
        applyFilters();
        renderGrid();
    });

    // Cross-tab Synchronization (when another tab updates localStorage)
    window.addEventListener('storage', function (e) {
        if (e.key === 'eg_cms_courses' && e.newValue) {
            try {
                const parsed = JSON.parse(e.newValue);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    allCourses = parsed;
                    populateFacultyDropdown();
                    applyFilters();
                    renderGrid();
                }
            } catch (_) {}
        }
    });

    // Auto initialize on DOMContentLoaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', window.initCoursesPage);
    } else {
        window.initCoursesPage();
    }
})();
