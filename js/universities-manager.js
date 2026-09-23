/**
 * EducationistGuru - Dynamic Universities Directory Manager
 * Features:
 * - 6 Universities per page with dynamic 1..N pagination
 * - Real-time debounced search across name, state/location, degrees, approvals, modes
 * - Multi-criteria filters: University Type / NAAC dropdown, Learning Mode dropdown, Sort dropdown
 * - Clear button & Reset button with active filter chips
 * - Telemetry results counter & page indicator
 * - Seamless integration with window.showUnivDetails and window.applyForInstitution
 * - Backward-compatible data loading via window.EG_CMS.getUniversities()
 */

(function () {
    'use strict';

    const PAGE_SIZE = 6;
    let allUniversities = [];
    let filteredUniversities = [];
    let currentPage = 1;
    let activeType = 'all';
    let activeMode = 'all';
    let activeSort = 'featured';
    let searchQuery = '';
    let debounceTimer = null;

    // Helper: Normalize list of streams
    function getStreams(u) {
        if (Array.isArray(u.streams) && u.streams.length > 0) {
            return u.streams;
        }
        if (Array.isArray(u.popularStreams) && u.popularStreams.length > 0) {
            return u.popularStreams;
        }
        if (u.popularStreams) {
            return String(u.popularStreams).split(',').map(s => s.trim()).filter(Boolean);
        }
        return ['Management', 'Computer Applications', 'Engineering', 'Science'];
    }

    // Helper: Normalize approvals string
    function getApprovals(u) {
        if (Array.isArray(u.approvals)) {
            return u.approvals.join(', ');
        }
        return String(u.approvals || 'UGC / AIU / DEB Recognized');
    }

    // Helper: Normalize modes string
    function getModes(u) {
        if (Array.isArray(u.modes)) {
            return u.modes.join(' / ');
        }
        return String(u.modes || 'Online / Distance / Regular');
    }

    // Fetch universities data
    async function initUniversities() {
        try {
            if (window.EG_CMS && typeof window.EG_CMS.getUniversities === 'function') {
                allUniversities = await window.EG_CMS.getUniversities();
            } else {
                const res = await fetch(`/api/content/universities?_t=${Date.now()}`);
                if (res.ok) {
                    const data = await res.json();
                    allUniversities = data.universities || data || [];
                }
            }
        } catch (e) {
            console.warn('[UniversitiesManager] API fetch failed, checking localStorage:', e);
            try {
                const local = localStorage.getItem('eg_cms_universities');
                if (local) allUniversities = JSON.parse(local);
            } catch (_) {}
        }

        populateFilterDropdowns();
        setupEventListeners();
        applyFiltersAndRender();
        checkUrlParamAndOpenDetails();
    }

    // Auto-open university modal if ?id=... or ?univ=... or hash is present in URL
    function checkUrlParamAndOpenDetails() {
        try {
            const params = new URLSearchParams(window.location.search);
            const idParam = params.get('id') || params.get('univ') || params.get('university');
            const hash = window.location.hash ? window.location.hash.replace('#', '').trim() : '';
            const targetId = idParam || hash;
            if (!targetId) return;

            let attempts = 0;
            const openModal = () => {
                attempts++;
                if (typeof window.showUnivDetails === 'function') {
                    window.showUnivDetails(targetId, false);
                } else if (attempts < 20) {
                    setTimeout(openModal, 100);
                }
            };
            setTimeout(openModal, 150);
        } catch (err) {
            console.warn('URL param hydration error:', err);
        }
    }

    // Populate Type and Mode dropdowns dynamically
    function populateFilterDropdowns() {
        const typeSelect = document.getElementById('univTypeSelect');
        const modeSelect = document.getElementById('univModeSelect');

        if (typeSelect) {
            const typesSet = new Set();
            allUniversities.forEach(u => {
                if (u.type) typesSet.add(u.type);
                if (u.naac && u.naac.includes('NAAC')) typesSet.add(u.naac);
            });
            const sortedTypes = Array.from(typesSet).sort();

            let optionsHtml = '<option value="all">All University Types / Accreditations</option>';
            sortedTypes.forEach(t => {
                optionsHtml += `<option value="${t}">${t}</option>`;
            });
            typeSelect.innerHTML = optionsHtml;
        }

        if (modeSelect) {
            const modesList = [
                { value: 'all', label: 'All Learning Modes' },
                { value: 'online', label: 'Online Mode' },
                { value: 'distance', label: 'Distance (UGC-DEB)' },
                { value: 'regular', label: 'Regular On-Campus' }
            ];
            let optionsHtml = '';
            modesList.forEach(m => {
                optionsHtml += `<option value="${m.value}">${m.label}</option>`;
            });
            modeSelect.innerHTML = optionsHtml;
        }
    }

    // Setup DOM Listeners
    function setupEventListeners() {
        const searchInput = document.getElementById('univSearchInput');
        const searchClearBtn = document.getElementById('univSearchClearBtn');
        const typeSelect = document.getElementById('univTypeSelect');
        const modeSelect = document.getElementById('univModeSelect');
        const sortSelect = document.getElementById('univSortSelect');
        const resetBtn = document.getElementById('univResetBtn');

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

        if (typeSelect) {
            typeSelect.addEventListener('change', (e) => {
                activeType = e.target.value;
                currentPage = 1;
                applyFiltersAndRender();
            });
        }

        if (modeSelect) {
            modeSelect.addEventListener('change', (e) => {
                activeMode = e.target.value;
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
                window.resetAllUnivFilters();
            });
        }
    }

    // Global Reset Filters
    window.resetAllUnivFilters = function () {
        searchQuery = '';
        activeType = 'all';
        activeMode = 'all';
        activeSort = 'featured';
        currentPage = 1;

        const searchInput = document.getElementById('univSearchInput');
        const searchClearBtn = document.getElementById('univSearchClearBtn');
        const typeSelect = document.getElementById('univTypeSelect');
        const modeSelect = document.getElementById('univModeSelect');
        const sortSelect = document.getElementById('univSortSelect');

        if (searchInput) searchInput.value = '';
        if (searchClearBtn) searchClearBtn.style.display = 'none';
        if (typeSelect) typeSelect.value = 'all';
        if (modeSelect) modeSelect.value = 'all';
        if (sortSelect) sortSelect.value = 'featured';

        applyFiltersAndRender();
    };

    // Filter, Sort, and Paginate
    function applyFiltersAndRender() {
        let results = allUniversities.slice();

        // 1. Text Search Filter
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            results = results.filter(u => {
                const name = String(u.name || '').toLowerCase();
                const loc = String(u.location || '').toLowerCase();
                const type = String(u.type || '').toLowerCase();
                const naac = String(u.naac || '').toLowerCase();
                const approvals = getApprovals(u).toLowerCase();
                const modes = getModes(u).toLowerCase();
                const streams = getStreams(u).join(' ').toLowerCase();
                return name.includes(q) || loc.includes(q) || type.includes(q) || naac.includes(q) || approvals.includes(q) || modes.includes(q) || streams.includes(q);
            });
        }

        // 2. Type / NAAC Filter
        if (activeType !== 'all') {
            const typeLower = activeType.toLowerCase();
            results = results.filter(u => {
                const typeStr = String(u.type || '').toLowerCase();
                const naacStr = String(u.naac || '').toLowerCase();
                return typeStr.includes(typeLower) || naacStr.includes(typeLower);
            });
        }

        // 3. Learning Mode Filter
        if (activeMode !== 'all') {
            const modeLower = activeMode.toLowerCase();
            results = results.filter(u => {
                const modesStr = getModes(u).toLowerCase();
                return modesStr.includes(modeLower);
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
                const aRating = parseFloat(a.rating) || 4.8;
                const bRating = parseFloat(b.rating) || 4.8;
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

        filteredUniversities = results;

        // Ensure current page is valid
        const totalPages = Math.ceil(filteredUniversities.length / PAGE_SIZE) || 1;
        if (currentPage > totalPages) currentPage = totalPages;
        if (currentPage < 1) currentPage = 1;

        renderTelemetry(totalPages);
        renderGrid();
        renderPagination(totalPages);
    }

    // Render Telemetry & Active Filter Chips
    function renderTelemetry(totalPages) {
        const countText = document.getElementById('univResultsCountText');
        const chipsContainer = document.getElementById('univActiveFilterChips');
        const pageIndicator = document.getElementById('univPageIndicatorText');

        const total = filteredUniversities.length;
        const start = total === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
        const end = Math.min(currentPage * PAGE_SIZE, total);

        if (countText) {
            countText.innerHTML = `Showing <strong>${start}–${end}</strong> of <strong>${total}</strong> universities`;
        }

        if (pageIndicator) {
            pageIndicator.textContent = `Page ${currentPage} of ${totalPages}`;
        }

        if (chipsContainer) {
            let chipsHtml = '';
            if (searchQuery) {
                chipsHtml += `
                    <span class="eg-filter-chip">
                        "${searchQuery}" <i class="fa fa-times" onclick="window.removeUnivFilter('search')" title="Remove search term"></i>
                    </span>
                `;
            }
            if (activeType !== 'all') {
                chipsHtml += `
                    <span class="eg-filter-chip">
                        Type: ${activeType} <i class="fa fa-times" onclick="window.removeUnivFilter('type')" title="Remove type filter"></i>
                    </span>
                `;
            }
            if (activeMode !== 'all') {
                const modeLabel = activeMode === 'online' ? 'Online Mode' : (activeMode === 'distance' ? 'Distance (UGC-DEB)' : 'Regular');
                chipsHtml += `
                    <span class="eg-filter-chip">
                        Mode: ${modeLabel} <i class="fa fa-times" onclick="window.removeUnivFilter('mode')" title="Remove mode filter"></i>
                    </span>
                `;
            }
            chipsContainer.innerHTML = chipsHtml;
        }
    }

    // Individual chip removal
    window.removeUnivFilter = function (type) {
        if (type === 'search') {
            searchQuery = '';
            const input = document.getElementById('univSearchInput');
            const clearBtn = document.getElementById('univSearchClearBtn');
            if (input) input.value = '';
            if (clearBtn) clearBtn.style.display = 'none';
        } else if (type === 'type') {
            activeType = 'all';
            const typeSelect = document.getElementById('univTypeSelect');
            if (typeSelect) typeSelect.value = 'all';
        } else if (type === 'mode') {
            activeMode = 'all';
            const modeSelect = document.getElementById('univModeSelect');
            if (modeSelect) modeSelect.value = 'all';
        }
        currentPage = 1;
        applyFiltersAndRender();
    };

    // Render 6-Cards Grid
    function renderGrid() {
        const grid = document.getElementById('eg-universities-grid');
        if (!grid) return;

        if (filteredUniversities.length === 0) {
            grid.innerHTML = `
                <div class="col-12 py-5">
                    <div class="eg-empty-state-box">
                        <i class="fa fa-university empty-icon"></i>
                        <h4>No Universities Found Matching Your Search</h4>
                        <p>Try clearing your active filters, checking for spelling variations, or exploring all recognition modes.</p>
                        <button type="button" class="btn btn-primary" onclick="window.resetAllUnivFilters()" style="background:#ff6b00;border-color:#ff6b00;font-weight:700;padding:10px 24px;border-radius:8px;">
                            <i class="fa fa-undo" style="margin-right:6px;"></i> Reset All Filters
                        </button>
                    </div>
                </div>
            `;
            return;
        }

        const startIndex = (currentPage - 1) * PAGE_SIZE;
        const pageItems = filteredUniversities.slice(startIndex, startIndex + PAGE_SIZE);

        grid.innerHTML = pageItems.map(u => {
            const isFeatured = Boolean(u.isFeatured || u.featured);
            const naacBadge = u.naac || 'UGC Approved';
            const typePill = u.type || 'State Private University';
            const approvals = getApprovals(u);
            const modes = getModes(u);
            const feeGuide = u.fee || 'Affordable Semester Installments';
            const rating = u.rating || '4.9';
            const safeName = (u.name || '').replace(/'/g, "\\'");

            const facList = Array.isArray(u.facilities) && u.facilities.length > 0 
                ? u.facilities 
                : (typeof u.facilities === 'string' && u.facilities.trim() 
                    ? u.facilities.split(',').map(s=>s.trim()).filter(Boolean) 
                    : ['Student LMS', 'Wi-Fi Campus', 'E-Library', 'Campus Hostels']);
            
            const facilitiesPillsHtml = `
                <div class="eg-dir-facilities-row" style="display:flex; flex-wrap:wrap; gap:5px; margin: 8px 0 10px 0;">
                    ${facList.slice(0, 3).map(f => `<span class="facility-pill" style="font-size:11px; padding:2px 8px; border-radius:12px; background:#eff6ff; color:#1d4ed8; font-weight:600; display:inline-flex; align-items:center; gap:4px; border:1px solid #bfdbfe;"><i class="fa fa-check-circle" style="font-size:10px; color:#2563eb;"></i>${f}</span>`).join('')}
                    ${facList.length > 3 ? `<span class="facility-pill more" style="font-size:11px; padding:2px 6px; border-radius:12px; background:#f1f5f9; color:#64748b; font-weight:600; border:1px solid #e2e8f0;">+${facList.length - 3}</span>` : ''}
                </div>
            `;

            return `
            <div class="col-lg-4 col-md-6 col-12 mb-4">
                <article class="eg-dir-card">
                    <div class="eg-dir-card-media" onclick="window.showUnivDetails('${u.id}')" style="cursor:pointer;" title="Click to view details of ${safeName}">
                        <img src="${u.image || 'images/slider/home1/slide1.jpg'}" alt="${u.name}" loading="lazy" onerror="this.src='images/slider/home1/slide1.jpg'">
                        <div class="eg-dir-media-overlay"></div>
                        <span class="eg-dir-badge-acc"><i class="fa fa-certificate"></i> ${naacBadge}</span>
                        ${isFeatured ? '<span class="eg-dir-badge-featured"><i class="fa fa-star"></i> Featured Partner</span>' : ''}
                    </div>
                    <div class="eg-dir-card-body" onclick="if(!event.target.closest('a') && !event.target.closest('button')) window.showUnivDetails('${u.id}');" style="cursor:pointer;">
                        <div class="eg-dir-meta-row">
                            <div class="eg-dir-cat-pills">
                                <span class="eg-dir-cat-pill">${typePill}</span>
                            </div>
                            <span class="eg-dir-rating"><i class="fa fa-star"></i> ${rating}</span>
                        </div>
                        <h3 class="eg-dir-title">
                            <a href="javascript:void(0)" onclick="window.showUnivDetails('${u.id}')">${u.name}</a>
                        </h3>
                        <div class="eg-dir-specs-grid">
                            <div class="eg-dir-spec-item" title="Location"><i class="fa fa-map-marker" style="color:#ff6b00;"></i><span>${u.location || 'India'}</span></div>
                            <div class="eg-dir-spec-item" title="Approvals"><i class="fa fa-shield" style="color:#2563eb;"></i><span>${approvals.split(',')[0]}</span></div>
                            <div class="eg-dir-spec-item" title="Learning Modes"><i class="fa fa-laptop" style="color:#0ea5e9;"></i><span>${modes}</span></div>
                            <div class="eg-dir-spec-item" title="Recognition"><i class="fa fa-check-circle" style="color:#10b981;"></i><span style="color:#10b981;font-weight:700;">UGC-DEB Valid</span></div>
                        </div>
                        ${facilitiesPillsHtml}
                        <div class="eg-dir-fee-banner">
                            <span class="eg-dir-fee-label"><i class="fa fa-inr"></i> Fee Structure</span>
                            <span class="eg-dir-fee-amount">${feeGuide}</span>
                        </div>
                        <div class="eg-dir-desc">${u.highlights || u.description || 'Recognized for government examinations, corporate career advancement, and international credentials.'}</div>
                    </div>
                    <div class="eg-dir-card-footer">
                        <button type="button" class="eg-btn-dir-details" onclick="window.showUnivDetails('${u.id}')">
                            <i class="fa fa-info-circle"></i> View Details
                        </button>
                        <button type="button" class="eg-btn-dir-apply" onclick="window.applyForInstitution('${safeName}', 'University')">
                            <i class="fa fa-phone"></i> Explore Admissions
                        </button>
                    </div>
                </article>
            </div>
            `;
        }).join('');
    }

    // Render Pagination Controls
    function renderPagination(totalPages) {
        const container = document.getElementById('univPaginationSection');
        if (!container) return;

        if (totalPages <= 1) {
            container.innerHTML = '';
            return;
        }

        let navHtml = `
            <nav class="eg-pagination-nav" aria-label="Universities pagination">
                <button type="button" class="eg-page-btn eg-page-arrow" ${currentPage === 1 ? 'disabled' : ''} onclick="window.gotoUnivPage(${currentPage - 1})" aria-label="Previous Page">
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
            navHtml += `<button type="button" class="eg-page-btn" onclick="window.gotoUnivPage(1)">1</button>`;
            if (startPage > 2) navHtml += `<span class="eg-page-ellipsis">&hellip;</span>`;
        }

        for (let p = startPage; p <= endPage; p++) {
            navHtml += `<button type="button" class="eg-page-btn ${p === currentPage ? 'active' : ''}" onclick="window.gotoUnivPage(${p})">${p}</button>`;
        }

        if (endPage < totalPages) {
            if (endPage < totalPages - 1) navHtml += `<span class="eg-page-ellipsis">&hellip;</span>`;
            navHtml += `<button type="button" class="eg-page-btn" onclick="window.gotoUnivPage(${totalPages})">${totalPages}</button>`;
        }

        navHtml += `
                <button type="button" class="eg-page-btn eg-page-arrow" ${currentPage === totalPages ? 'disabled' : ''} onclick="window.gotoUnivPage(${currentPage + 1})" aria-label="Next Page">
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
                <span>Showing 6 universities per page</span>
                <span style="color:#cbd5e1;">&bull;</span>
                <div class="eg-jump-wrap">
                    <label for="univJumpSelect" style="margin:0; font-size:13px; color:#64748b;">Jump to:</label>
                    <select id="univJumpSelect" class="eg-jump-select" aria-label="Jump to page" onchange="window.gotoUnivPage(parseInt(this.value))">
                        ${selectOptions}
                    </select>
                </div>
            </div>
        `;

        container.innerHTML = navHtml + summaryHtml;
    }

    // Go to specific page
    window.gotoUnivPage = function (page) {
        currentPage = page;
        applyFiltersAndRender();
        const target = document.getElementById('univDirectorySection') || document.getElementById('eg-universities-grid');
        if (target) {
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    // Auto-init
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initUniversities);
    } else {
        initUniversities();
    }

    // Re-sync on storage or CMS sync
    window.addEventListener('storage', (e) => {
        if (e.key === 'eg_cms_universities') initUniversities();
    });
    window.addEventListener('cms:synced', initUniversities);

    window.EG_UniversitiesManager = {
        init: initUniversities,
        refresh: applyFiltersAndRender
    };

})();
