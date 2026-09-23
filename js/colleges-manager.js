/**
 * EducationistGuru - Dynamic Colleges Directory Manager
 * Features:
 * - 6 Colleges per page with dynamic 1..N pagination
 * - Real-time debounced search across name, categories, courses, location, affiliation
 * - Multi-criteria filters: Category dropdown, State/Location dropdown, Sort dropdown
 * - Clear button & Reset button with active filter chips
 * - Telemetry results counter & page indicator
 * - Seamless integration with window.showCollegeDetails and window.applyForInstitution
 * - Backward-compatible data loading via window.EG_CMS.getColleges()
 */

(function () {
    'use strict';

    const PAGE_SIZE = 6;
    let allColleges = [];
    let filteredColleges = [];
    let currentPage = 1;
    let activeCategory = 'all';
    let activeLocation = 'all';
    let activeSort = 'featured';
    let searchQuery = '';
    let debounceTimer = null;

    // Helper: Normalize list of categories
    function getCategories(c) {
        if (Array.isArray(c.categories) && c.categories.length > 0) {
            return c.categories;
        }
        if (c.category) {
            return String(c.category).split(',').map(s => s.trim()).filter(Boolean);
        }
        return ['Collegiate Programs'];
    }

    // Helper: Normalize list of courses
    function getCourses(c) {
        if (Array.isArray(c.courses) && c.courses.length > 0) {
            return c.courses;
        }
        if (c.courses) {
            return String(c.courses).split(',').map(s => s.trim()).filter(Boolean);
        }
        return ['UG & PG Degrees'];
    }

    // Helper: Primary accreditation badge
    function getPrimaryAccreditation(c) {
        if (Array.isArray(c.accreditation) && c.accreditation.length > 0) {
            return c.accreditation[0];
        }
        const str = String(c.accreditation || 'AICTE / UGC Approved');
        return str.split(',')[0].trim();
    }

    // Fetch colleges data
    async function initColleges() {
        try {
            if (window.EG_CMS && typeof window.EG_CMS.getColleges === 'function') {
                allColleges = await window.EG_CMS.getColleges();
            } else {
                const res = await fetch(`/api/content/colleges?_t=${Date.now()}`);
                if (res.ok) {
                    const data = await res.json();
                    allColleges = data.colleges || data || [];
                }
            }
        } catch (e) {
            console.warn('[CollegesManager] API fetch failed, checking localStorage:', e);
            try {
                const local = localStorage.getItem('eg_cms_colleges');
                if (local) allColleges = JSON.parse(local);
            } catch (_) {}
        }

        populateFilterDropdowns();
        setupEventListeners();
        applyFiltersAndRender();
        checkUrlParamAndOpenDetails();
    }

    // Auto-open college modal if ?id=... or ?college=... or hash is present in URL
    function checkUrlParamAndOpenDetails() {
        try {
            const params = new URLSearchParams(window.location.search);
            const idParam = params.get('id') || params.get('college');
            const hash = window.location.hash ? window.location.hash.replace('#', '').trim() : '';
            const targetId = idParam || hash;
            if (!targetId) return;

            const match = allColleges.find(c => 
                String(c.id).toLowerCase() === targetId.toLowerCase() ||
                (c.slug && c.slug.toLowerCase() === targetId.toLowerCase()) ||
                (c.name && c.name.toLowerCase().includes(targetId.toLowerCase()))
            );

            if (match && typeof window.showCollegeDetails === 'function') {
                setTimeout(() => {
                    window.showCollegeDetails(match.id, false);
                }, 350);
            }
        } catch (err) {
            console.warn('URL param hydration error:', err);
        }
    }

    // Populate Category and Location dropdowns dynamically
    function populateFilterDropdowns() {
        const catSelect = document.getElementById('collegeCategorySelect');
        const locSelect = document.getElementById('collegeLocationSelect');

        if (catSelect) {
            const categoriesSet = new Set();
            allColleges.forEach(c => {
                getCategories(c).forEach(cat => categoriesSet.add(cat));
            });
            const sortedCats = Array.from(categoriesSet).sort();

            let optionsHtml = '<option value="all">All Categories / Streams</option>';
            sortedCats.forEach(cat => {
                const cleanName = cat.replace(/^Faculty of\s+/i, '');
                optionsHtml += `<option value="${cat}">${cleanName}</option>`;
            });
            catSelect.innerHTML = optionsHtml;
        }

        if (locSelect) {
            const locSet = new Set();
            allColleges.forEach(c => {
                if (c.location) {
                    const parts = c.location.split(',');
                    const stateOrCity = (parts[parts.length - 1] || parts[0]).trim();
                    if (stateOrCity) locSet.add(stateOrCity);
                }
            });
            const sortedLocs = Array.from(locSet).sort();

            let optionsHtml = '<option value="all">All Locations / States</option>';
            sortedLocs.forEach(loc => {
                optionsHtml += `<option value="${loc}">${loc}</option>`;
            });
            locSelect.innerHTML = optionsHtml;
        }
    }

    // Setup DOM Listeners
    function setupEventListeners() {
        const searchInput = document.getElementById('collegeSearchInput');
        const searchClearBtn = document.getElementById('collegeSearchClearBtn');
        const catSelect = document.getElementById('collegeCategorySelect');
        const locSelect = document.getElementById('collegeLocationSelect');
        const sortSelect = document.getElementById('collegeSortSelect');
        const resetBtn = document.getElementById('collegeResetBtn');

        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                searchQuery = (e.target.value || '').trim();
                if (searchClearBtn) {
                    searchClearBtn.style.display = searchQuery ? 'inline-flex' : 'none';
                }
                clearTimeout(debounceTimer);
                debounceTimer = setTimeout(() => {
                    currentPage = 1;
                    applyFiltersAndRender();
                }, 120);
            });
        }

        if (searchClearBtn) {
            searchClearBtn.addEventListener('click', () => {
                if (searchInput) {
                    searchInput.value = '';
                    searchInput.focus();
                }
                searchQuery = '';
                searchClearBtn.style.display = 'none';
                currentPage = 1;
                applyFiltersAndRender();
            });
        }

        if (catSelect) {
            catSelect.addEventListener('change', (e) => {
                activeCategory = e.target.value;
                currentPage = 1;
                applyFiltersAndRender();
            });
        }

        if (locSelect) {
            locSelect.addEventListener('change', (e) => {
                activeLocation = e.target.value;
                currentPage = 1;
                applyFiltersAndRender();
            });
        }

        if (sortSelect) {
            sortSelect.addEventListener('change', (e) => {
                activeSort = e.target.value;
                currentPage = 1;
                applyFiltersAndRender();
            });
        }

        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                window.resetAllCollegeFilters();
            });
        }
    }

    // Global Reset Filters
    window.resetAllCollegeFilters = function () {
        searchQuery = '';
        activeCategory = 'all';
        activeLocation = 'all';
        activeSort = 'featured';
        currentPage = 1;

        const searchInput = document.getElementById('collegeSearchInput');
        const searchClearBtn = document.getElementById('collegeSearchClearBtn');
        const catSelect = document.getElementById('collegeCategorySelect');
        const locSelect = document.getElementById('collegeLocationSelect');
        const sortSelect = document.getElementById('collegeSortSelect');

        if (searchInput) searchInput.value = '';
        if (searchClearBtn) searchClearBtn.style.display = 'none';
        if (catSelect) catSelect.value = 'all';
        if (locSelect) locSelect.value = 'all';
        if (sortSelect) sortSelect.value = 'featured';

        applyFiltersAndRender();
    };

    // Filter, Sort, and Paginate
    function applyFiltersAndRender() {
        let results = allColleges.slice();

        // 1. Text Search Filter
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            results = results.filter(c => {
                const name = String(c.name || '').toLowerCase();
                const loc = String(c.location || '').toLowerCase();
                const aff = String(c.affiliation || '').toLowerCase();
                const cats = getCategories(c).join(' ').toLowerCase();
                const courses = getCourses(c).join(' ').toLowerCase();
                const acc = Array.isArray(c.accreditation) ? c.accreditation.join(' ').toLowerCase() : String(c.accreditation || '').toLowerCase();
                return name.includes(q) || loc.includes(q) || aff.includes(q) || cats.includes(q) || courses.includes(q) || acc.includes(q);
            });
        }

        // 2. Category Filter
        if (activeCategory !== 'all') {
            const catLower = activeCategory.toLowerCase();
            results = results.filter(c => {
                const cats = getCategories(c).map(s => s.toLowerCase());
                const courses = getCourses(c).map(s => s.toLowerCase()).join(' ');
                return cats.some(cat => cat.includes(catLower)) || courses.includes(catLower);
            });
        }

        // 3. Location Filter
        if (activeLocation !== 'all') {
            const locLower = activeLocation.toLowerCase();
            results = results.filter(c => {
                const loc = String(c.location || '').toLowerCase();
                return loc.includes(locLower);
            });
        }

        // 4. Sorting & Relevance
        results.sort((a, b) => {
            if (searchQuery) {
                const q = searchQuery.toLowerCase();
                const aName = (a.name || '').toLowerCase();
                const bName = (b.name || '').toLowerCase();
                const aScore = aName.startsWith(q) ? 100 : (aName.includes(q) ? 75 : 0);
                const bScore = bName.startsWith(q) ? 100 : (bName.includes(q) ? 75 : 0);
                if (aScore !== bScore) return bScore - aScore;
            }

            if (activeSort === 'featured') {
                const aFeat = Boolean(a.isFeatured || a.featured);
                const bFeat = Boolean(b.isFeatured || b.featured);
                if (aFeat && !bFeat) return -1;
                if (!aFeat && bFeat) return 1;
                const aRating = parseFloat(a.rating) || 4.5;
                const bRating = parseFloat(b.rating) || 4.5;
                return bRating - aRating;
            }
            if (activeSort === 'name_asc') {
                return String(a.name || '').localeCompare(String(b.name || ''));
            }
            if (activeSort === 'name_desc') {
                return String(b.name || '').localeCompare(String(a.name || ''));
            }
            if (activeSort === 'rating_desc') {
                const rA = parseFloat(a.rating) || 0;
                const rB = parseFloat(b.rating) || 0;
                return rB - rA;
            }
            return 0;
        });

        filteredColleges = results;

        // Ensure current page is valid
        const totalPages = Math.ceil(filteredColleges.length / PAGE_SIZE) || 1;
        if (currentPage > totalPages) currentPage = totalPages;
        if (currentPage < 1) currentPage = 1;

        renderTelemetry(totalPages);
        renderGrid();
        renderPagination(totalPages);
    }

    // Render Telemetry & Active Filter Chips
    function renderTelemetry(totalPages) {
        const countText = document.getElementById('collegeResultsCountText');
        const chipsContainer = document.getElementById('collegeActiveFilterChips');
        const pageIndicator = document.getElementById('collegePageIndicatorText');

        const total = filteredColleges.length;
        const start = total === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
        const end = Math.min(currentPage * PAGE_SIZE, total);

        if (countText) {
            countText.innerHTML = `Showing <strong>${start}–${end}</strong> of <strong>${total}</strong> colleges`;
        }

        if (pageIndicator) {
            pageIndicator.textContent = `Page ${currentPage} of ${totalPages}`;
        }

        if (chipsContainer) {
            let chipsHtml = '';
            if (searchQuery) {
                chipsHtml += `
                    <span class="eg-filter-chip">
                        "${searchQuery}" <i class="fa fa-times" onclick="window.removeCollegeFilter('search')" title="Remove search term"></i>
                    </span>
                `;
            }
            if (activeCategory !== 'all') {
                chipsHtml += `
                    <span class="eg-filter-chip">
                        Category: ${activeCategory.replace(/^Faculty of\s+/i, '')} <i class="fa fa-times" onclick="window.removeCollegeFilter('category')" title="Remove category filter"></i>
                    </span>
                `;
            }
            if (activeLocation !== 'all') {
                chipsHtml += `
                    <span class="eg-filter-chip">
                        State: ${activeLocation} <i class="fa fa-times" onclick="window.removeCollegeFilter('location')" title="Remove location filter"></i>
                    </span>
                `;
            }
            chipsContainer.innerHTML = chipsHtml;
        }
    }

    // Individual chip removal
    window.removeCollegeFilter = function (type) {
        if (type === 'search') {
            searchQuery = '';
            const input = document.getElementById('collegeSearchInput');
            const clearBtn = document.getElementById('collegeSearchClearBtn');
            if (input) input.value = '';
            if (clearBtn) clearBtn.style.display = 'none';
        } else if (type === 'category') {
            activeCategory = 'all';
            const catSelect = document.getElementById('collegeCategorySelect');
            if (catSelect) catSelect.value = 'all';
        } else if (type === 'location') {
            activeLocation = 'all';
            const locSelect = document.getElementById('collegeLocationSelect');
            if (locSelect) locSelect.value = 'all';
        }
        currentPage = 1;
        applyFiltersAndRender();
    };

    // Render 6-Cards Grid
    function renderGrid() {
        const grid = document.getElementById('eg-colleges-grid');
        if (!grid) return;

        if (filteredColleges.length === 0) {
            grid.innerHTML = `
                <div class="col-12 py-5">
                    <div class="eg-empty-state-box">
                        <i class="fa fa-graduation-cap empty-icon"></i>
                        <h4>No Colleges Found Matching Your Search</h4>
                        <p>Try clearing filters, using broader keywords, or exploring all educational faculties.</p>
                        <button type="button" class="btn btn-primary" onclick="window.resetAllCollegeFilters()" style="background:#ff6b00;border-color:#ff6b00;font-weight:700;padding:10px 24px;border-radius:8px;">
                            <i class="fa fa-undo" style="margin-right:6px;"></i> Reset All Filters
                        </button>
                    </div>
                </div>
            `;
            return;
        }

        const startIndex = (currentPage - 1) * PAGE_SIZE;
        const pageItems = filteredColleges.slice(startIndex, startIndex + PAGE_SIZE);

        grid.innerHTML = pageItems.map(c => {
            const isFeatured = Boolean(c.isFeatured || c.featured);
            const primaryAcc = getPrimaryAccreditation(c);
            const cats = getCategories(c);
            const courses = getCourses(c);

            // Category pills: show up to 2 pills + remainder count
            const catPillsHtml = cats.slice(0, 2).map(cat => 
                `<span class="eg-dir-cat-pill">${cat.replace(/^Faculty of\s+/i, '')}</span>`
            ).join('') + (cats.length > 2 ? `<span class="eg-dir-cat-pill secondary">+${cats.length - 2} more</span>` : '');

            // Courses text summary
            const coursesDisplay = courses.slice(0, 3).join(', ') + (courses.length > 3 ? ` + ${courses.length - 3} more` : '');

            const feeGuide = c.fee || 'Affordable Installments';
            const rating = c.rating || '4.8';
            const safeName = (c.name || '').replace(/'/g, "\\'");

            const facList = Array.isArray(c.facilities) && c.facilities.length > 0 
                ? c.facilities 
                : (typeof c.facilities === 'string' && c.facilities.trim() 
                    ? c.facilities.split(',').map(s=>s.trim()).filter(Boolean) 
                    : ['Wi-Fi Campus', 'Hostel', 'Modern Labs', 'Central Library']);
            
            const facilitiesPillsHtml = `
                <div class="eg-dir-facilities-row" style="display:flex; flex-wrap:wrap; gap:5px; margin: 8px 0 10px 0;">
                    ${facList.slice(0, 3).map(f => `<span class="facility-pill" style="font-size:11px; padding:2px 8px; border-radius:12px; background:#eff6ff; color:#1d4ed8; font-weight:600; display:inline-flex; align-items:center; gap:4px; border:1px solid #bfdbfe;"><i class="fa fa-check-circle" style="font-size:10px; color:#2563eb;"></i>${f}</span>`).join('')}
                    ${facList.length > 3 ? `<span class="facility-pill more" style="font-size:11px; padding:2px 6px; border-radius:12px; background:#f1f5f9; color:#64748b; font-weight:600; border:1px solid #e2e8f0;">+${facList.length - 3}</span>` : ''}
                </div>
            `;

            return `
            <div class="col-lg-4 col-md-6 col-12 mb-4">
                <article class="eg-dir-card">
                    <div class="eg-dir-card-media">
                        <img src="${c.image || 'images/courses/1.jpg'}" alt="${c.name}" loading="lazy" onerror="this.src='images/courses/1.jpg'">
                        <div class="eg-dir-media-overlay"></div>
                        <span class="eg-dir-badge-acc"><i class="fa fa-shield"></i> ${primaryAcc}</span>
                        ${isFeatured ? '<span class="eg-dir-badge-featured"><i class="fa fa-star"></i> Top Choice</span>' : ''}
                    </div>
                    <div class="eg-dir-card-body">
                        <div class="eg-dir-meta-row">
                            <div class="eg-dir-cat-pills">
                                ${catPillsHtml}
                            </div>
                            <span class="eg-dir-rating"><i class="fa fa-star"></i> ${rating}</span>
                        </div>
                        <h3 class="eg-dir-title">
                            <a href="javascript:void(0)" onclick="window.showCollegeDetails('${c.id}')">${c.name}</a>
                        </h3>
                        <div class="eg-dir-specs-grid">
                            <div class="eg-dir-spec-item" title="Location"><i class="fa fa-map-marker" style="color:#ff6b00;"></i><span>${c.location || 'India'}</span></div>
                            <div class="eg-dir-spec-item" title="Affiliation"><i class="fa fa-university" style="color:#2563eb;"></i><span>${c.affiliation || 'Approved Campuses'}</span></div>
                            <div class="eg-dir-spec-item" title="Courses Offered"><i class="fa fa-graduation-cap" style="color:#059669;"></i><span><strong>${courses.length}</strong> Programs</span></div>
                            <div class="eg-dir-spec-item" title="Admission Status"><i class="fa fa-check-circle" style="color:#10b981;"></i><span style="color:#10b981;font-weight:700;">Admissions Open</span></div>
                        </div>
                        ${facilitiesPillsHtml}
                        <div class="eg-dir-fee-banner">
                            <span class="eg-dir-fee-label"><i class="fa fa-inr"></i> Fee Structure</span>
                            <span class="eg-dir-fee-amount">${feeGuide}</span>
                        </div>
                        <div class="eg-dir-desc">${c.description ? c.description.slice(0, 110) + '...' : 'Complete admission guidance, seat verification, and installment scholarship assistance.'}</div>
                    </div>
                    <div class="eg-dir-card-footer">
                        <button type="button" class="eg-btn-dir-details" onclick="window.showCollegeDetails('${c.id}')">
                            <i class="fa fa-info-circle"></i> View Details
                        </button>
                        <button type="button" class="eg-btn-dir-apply" onclick="window.applyForInstitution('${safeName}', 'College')">
                            <i class="fa fa-phone"></i> Apply Now
                        </button>
                    </div>
                </article>
            </div>
            `;
        }).join('');
    }

    // Render Pagination Controls
    function renderPagination(totalPages) {
        const container = document.getElementById('collegePaginationSection');
        if (!container) return;

        if (totalPages <= 1) {
            container.innerHTML = '';
            return;
        }

        let navHtml = `
            <nav class="eg-pagination-nav" aria-label="Colleges pagination">
                <button type="button" class="eg-page-btn eg-page-arrow" ${currentPage === 1 ? 'disabled' : ''} onclick="window.gotoCollegePage(${currentPage - 1})" aria-label="Previous Page">
                    <i class="fa fa-chevron-left"></i> Prev
                </button>
        `;

        const maxVisible = 5;
        let startPage = Math.max(1, currentPage - 2);
        let endPage = Math.min(totalPages, startPage + maxVisible - 1);
        if (endPage - startPage < maxVisible - 1) {
            startPage = Math.max(1, endPage - maxVisible + 1);
        }

        if (startPage > 1) {
            navHtml += `<button type="button" class="eg-page-btn" onclick="window.gotoCollegePage(1)">1</button>`;
            if (startPage > 2) navHtml += `<span class="eg-page-ellipsis">&hellip;</span>`;
        }

        for (let p = startPage; p <= endPage; p++) {
            navHtml += `<button type="button" class="eg-page-btn ${p === currentPage ? 'active' : ''}" onclick="window.gotoCollegePage(${p})">${p}</button>`;
        }

        if (endPage < totalPages) {
            if (endPage < totalPages - 1) navHtml += `<span class="eg-page-ellipsis">&hellip;</span>`;
            navHtml += `<button type="button" class="eg-page-btn" onclick="window.gotoCollegePage(${totalPages})">${totalPages}</button>`;
        }

        navHtml += `
                <button type="button" class="eg-page-btn eg-page-arrow" ${currentPage === totalPages ? 'disabled' : ''} onclick="window.gotoCollegePage(${currentPage + 1})" aria-label="Next Page">
                    Next <i class="fa fa-chevron-right"></i>
                </button>
            </nav>
        `;

        let selectOptions = '';
        for (let i = 1; i <= totalPages; i++) {
            selectOptions += `<option value="${i}" ${i === currentPage ? 'selected' : ''}>Page ${i}</option>`;
        }

        const summaryHtml = `
            <div class="eg-pagination-summary">
                <span>Showing 6 colleges per page</span>
                <span style="color:#cbd5e1;">&bull;</span>
                <div class="eg-jump-wrap">
                    <label for="collegeJumpSelect" style="margin:0; font-size:13px; color:#64748b;">Jump to:</label>
                    <select id="collegeJumpSelect" class="eg-jump-select" aria-label="Jump to page" onchange="window.gotoCollegePage(parseInt(this.value))">
                        ${selectOptions}
                    </select>
                </div>
            </div>
        `;

        container.innerHTML = navHtml + summaryHtml;
    }

    // Go to specific page
    window.gotoCollegePage = function (page) {
        currentPage = page;
        applyFiltersAndRender();
        const target = document.getElementById('collegeDirectorySection') || document.getElementById('eg-colleges-grid');
        if (target) {
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    // Auto-init
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initColleges);
    } else {
        initColleges();
    }

    // Re-sync on storage or CMS sync
    window.addEventListener('storage', (e) => {
        if (e.key === 'eg_cms_colleges') initColleges();
    });
    window.addEventListener('cms:synced', initColleges);

    window.EG_CollegesManager = {
        init: initColleges,
        refresh: applyFiltersAndRender
    };

})();
