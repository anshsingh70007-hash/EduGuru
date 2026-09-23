/* =========================================================
   EducationistGuru - Smart Mega-Menu & Multi-Tier Navigation
   Dynamic Hydration Layer for Public Website
   Synchronizes Courses, Universities, and Custom Headers
   ========================================================= */

(function() {
    'use strict';

    // Helpers
    function slugify(text) {
        if (!text) return '';
        return String(text).toLowerCase().trim()
            .replace(/&/g, 'and')
            .replace(/[\(\)\/,\.]+/g, ' ')
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/[\s-]+/g, '-')
            .replace(/^-+|-+$/g, '');
    }

    function getApiBase() {
        if (window.location.protocol === 'file:' || 
            (window.location.hostname === 'localhost' && window.location.port !== '3000') ||
            (window.location.hostname === '127.0.0.1' && window.location.port !== '3000')) {
            return 'http://localhost:3000';
        }
        return '';
    }
    const API_BASE = getApiBase();

    async function fetchJson(endpoint, fallbackFile) {
        try {
            const res = await fetch(`${API_BASE}${endpoint}?_t=${Date.now()}`);
            if (res.ok) {
                const json = await res.json();
                if (json && json.data) return json.data;
                if (json && (json.courses || json.universities || json.menu)) return json;
                return json;
            }
        } catch (e) {
            // Fallback to static JSON file
        }
        try {
            const staticRes = await fetch(`${fallbackFile}?_t=${Date.now()}`);
            if (staticRes.ok) return await staticRes.json();
        } catch (e) {
            // Static file unreachable
        }
        return null;
    }

    // Main Hydration Function
    async function initMegaMenu() {
        const navMenus = document.querySelectorAll('.rs-menu .nav-menu');
        if (!navMenus.length) return;

        // Fetch menu config, courses, and universities in parallel
        const [menuData, coursesData, univsData] = await Promise.all([
            fetchJson('/api/content/menu', 'data/site_menu.json'),
            fetchJson('/api/content/courses', 'data/courses.json'),
            fetchJson('/api/content/universities', 'data/universities.json')
        ]);

        const menuConfig = menuData || {};
        const courses = Array.isArray(coursesData) ? coursesData : (coursesData && coursesData.courses ? coursesData.courses : []);
        const universities = Array.isArray(univsData) ? univsData : (univsData && univsData.universities ? univsData.universities : []);

        // 1. Render Top Announcement Ribbon if enabled
        renderAnnouncementRibbon(menuConfig.announcement);

        // 2. Organize Courses into Major Academic Domains
        const domainMap = {
            management: {
                title: 'Management & Commerce',
                icon: 'fa fa-briefcase',
                keywords: ['mba', 'bba', 'b.com', 'm.com', 'management', 'commerce', 'finance', 'marketing'],
                items: []
            },
            tech: {
                title: 'Engineering & IT',
                icon: 'fa fa-laptop',
                keywords: ['b.tech', 'm.tech', 'mca', 'bca', 'data science', 'artificial intelligence', 'computer', 'it', 'polytechnic'],
                items: []
            },
            medical: {
                title: 'Medical & Pharmacy',
                icon: 'fa fa-medkit',
                keywords: ['pharm', 'mbbs', 'bams', 'bhms', 'mlt', 'physiotherapy', 'nursing', 'radiology', 'paramedical'],
                items: []
            },
            professional: {
                title: 'Law, Arts & Teaching',
                icon: 'fa fa-graduation-cap',
                keywords: ['b.ed', 'd.ed', 'm.ed', 'llb', 'law', 'ba', 'ma', 'education', 'humanities', 'arts'],
                items: []
            }
        };

        // Categorize active courses
        courses.forEach(c => {
            const nameLower = (c.name || '').toLowerCase();
            const facLower = (c.faculty || '').toLowerCase();
            const combined = `${nameLower} ${facLower}`;

            let matched = false;
            for (const key of ['management', 'tech', 'medical', 'professional']) {
                if (domainMap[key].keywords.some(kw => combined.includes(kw))) {
                    if (domainMap[key].items.length < 6) {
                        domainMap[key].items.push(c);
                    }
                    matched = true;
                    break;
                }
            }
            if (!matched && domainMap.professional.items.length < 6) {
                domainMap.professional.items.push(c);
            }
        });

        // 3. Render Modern Multi-Tier Mega-Menu for each menu instance
        navMenus.forEach(navMenu => {
            renderNavItems(navMenu, menuConfig, domainMap, universities);
        });
    }

    // Render Top Announcement Ribbon
    function renderAnnouncementRibbon(announcement) {
        if (!announcement || !announcement.enabled || !announcement.text) return;
        if (document.querySelector('.eg-announcement-bar')) return;

        const ribbon = document.createElement('div');
        ribbon.className = 'eg-announcement-bar';
        ribbon.innerHTML = `
            <div class="container" style="display:flex;align-items:center;justify-content:space-between;width:100%;">
                <div class="announcement-text">
                    <span class="pulse-live-dot"></span>
                    <span>${announcement.text}</span>
                </div>
                ${announcement.ctaText ? `
                    <a href="${announcement.ctaLink || 'contact.html'}" class="announcement-cta">
                        <i class="fa fa-phone"></i> ${announcement.ctaText}
                    </a>
                ` : ''}
            </div>
        `;

        const fullHeader = document.querySelector('.full-width-header');
        if (fullHeader) {
            fullHeader.insertBefore(ribbon, fullHeader.firstChild);
        } else {
            document.body.insertBefore(ribbon, document.body.firstChild);
        }
    }

    // Render Navigation Items
    function renderNavItems(navMenu, menuConfig, domainMap, universities) {
        const activePath = window.location.pathname.toLowerCase();

        // Default navigation fallback if config not yet available
        const defaultNavItems = [
            { id: 'home', title: 'Home', url: 'index.html', type: 'link' },
            { id: 'courses', title: 'Courses', url: 'courses.html', type: 'megamenu', badge: 'Popular' },
            { id: 'universities', title: 'Universities', url: 'universities.html', type: 'dropdown', badge: 'UGC Valid' },
            { id: 'colleges', title: 'Colleges', url: 'colleges.html', type: 'link' },
            { id: 'boards', title: 'Boards & Open School', url: '#', type: 'dropdown', children: [
                { id: 'nios', title: 'NIOS 10th & 12th Admission', url: 'contact.html?subject=NIOS+Admission', desc: 'Direct enrollment in National Institute of Open Schooling' },
                { id: 'bbose', title: 'BBOSE Open Schooling', url: 'contact.html?subject=BBOSE+Admission', desc: 'State open schooling board verification & enrollment' },
                { id: 'open-counseling', title: 'Free Eligibility Assessment', url: 'contact.html?subject=Eligibility+Verification', desc: '100% verified educational counselor support' }
            ]},
            { id: 'about', title: 'About Us', url: 'about.html', type: 'link' },
            { id: 'videos', title: 'Videos', url: 'youtube.html', type: 'link', icon: 'fa fa-youtube-play text-danger' },
            { id: 'blog', title: 'Blog', url: 'blog.html', type: 'link' },
            { id: 'contact', title: 'Contact', url: 'contact.html', type: 'link' },
            { id: 'subharti-mba-hub', title: 'Subharti MBA', url: 'blog-details.html?id=100', type: 'dropdown', badge: 'New 2026', children: [
                { id: 'subharti-guide', title: 'MBA in Financial & Project Management', url: 'blog-details.html?id=100', desc: 'Dual specialization syllabus & admission guide' },
                { id: 'subharti-details', title: 'Course Curriculum & Approvals', url: 'courses-details.html?id=107', desc: 'UGC-DEB approved 2-year program details' },
                { id: 'subharti-help', title: 'Direct Admission Helpline', url: 'contact.html?subject=Subharti+University+MBA', desc: 'Authorized counseling at +91 87504 77000' }
            ]}
        ];

        const navItems = (menuConfig.navItems && Array.isArray(menuConfig.navItems) && menuConfig.navItems.length > 0)
            ? menuConfig.navItems
            : defaultNavItems;

        let html = '';

        navItems.forEach(item => {
            // Respect active / hidden toggle from Content Studio
            if (item.enabled === false) return;

            // Generate badge HTML if item has a badge
            let badgeHtml = '';
            if (item.badge) {
                let badgeClass = 'eg-menu-badge';
                if (item.badgeColor === 'green' || item.badge === 'UGC Valid') badgeClass += ' badge-green';
                else if (item.badgeColor === 'blue') badgeClass += ' badge-blue';
                else if (item.badgeColor === 'amber') badgeClass += ' badge-amber';
                badgeHtml = `<span class="${badgeClass}">${item.badge}</span>`;
            }

            // 1. Home
            if (item.id === 'home') {
                const isHome = activePath.endsWith('/') || activePath.endsWith('index.html') || activePath === '';
                html += `<li class="${isHome ? 'current-menu-item' : ''}"><a href="${item.url || 'index.html'}">${item.title || 'Home'} ${badgeHtml}</a></li>`;
            }
            // 2. Courses (Mega-Menu)
            else if (item.id === 'courses' || item.type === 'megamenu') {
                const isCourses = activePath.includes('courses');
                html += `
                    <li class="has-megamenu ${isCourses ? 'current-menu-item' : ''}">
                        <a href="${item.url || 'courses.html'}">
                            ${item.title || 'Courses'} ${badgeHtml} <i class="fa fa-chevron-down eg-menu-arrow"></i>
                        </a>
                        <div class="eg-megamenu-panel">
                            <div class="eg-megamenu-grid">
                                
                                <!-- Column 1: Top Partner Universities -->
                                <div class="eg-megamenu-col">
                                    <div class="eg-megamenu-heading">
                                        <i class="fa fa-university"></i> Partner Universities
                                    </div>
                                    <ul class="eg-megamenu-list">
                                        ${universities.slice(0, 6).map(u => `
                                            <li>
                                                <a href="universities.html?id=${encodeURIComponent(u.id)}" title="${u.name}">
                                                    <span>${u.name.length > 25 ? u.name.slice(0, 24) + '...' : u.name}</span>
                                                    <span class="item-mode">${u.naac ? u.naac.split(' ')[0] : 'UGC'}</span>
                                                </a>
                                            </li>
                                        `).join('')}
                                        <li>
                                            <a href="universities.html" style="color:#ff3115;font-weight:700;margin-top:4px;">
                                                <span>View All Universities &rarr;</span>
                                            </a>
                                        </li>
                                    </ul>
                                </div>

                                <!-- Column 2: Management & Commerce -->
                                <div class="eg-megamenu-col">
                                    <div class="eg-megamenu-heading">
                                        <i class="${domainMap.management.icon}"></i> ${domainMap.management.title}
                                    </div>
                                    <ul class="eg-megamenu-list">
                                        ${domainMap.management.items.map(c => `
                                            <li>
                                                <a href="courses-details.html?id=${c.id}" title="${c.name}">
                                                    <span>${c.name.length > 24 ? c.name.slice(0, 23) + '...' : c.name}</span>
                                                    <span class="item-mode">${c.duration ? c.duration.split(' ')[0] : 'Deg'}</span>
                                                </a>
                                            </li>
                                        `).join('')}
                                    </ul>
                                </div>

                                <!-- Column 3: Engineering & IT -->
                                <div class="eg-megamenu-col">
                                    <div class="eg-megamenu-heading">
                                        <i class="${domainMap.tech.icon}"></i> ${domainMap.tech.title}
                                    </div>
                                    <ul class="eg-megamenu-list">
                                        ${domainMap.tech.items.map(c => `
                                            <li>
                                                <a href="courses-details.html?id=${c.id}" title="${c.name}">
                                                    <span>${c.name.length > 24 ? c.name.slice(0, 23) + '...' : c.name}</span>
                                                    <span class="item-mode">${c.duration ? c.duration.split(' ')[0] : 'Deg'}</span>
                                                </a>
                                            </li>
                                        `).join('')}
                                    </ul>
                                </div>

                                <!-- Column 4: Medical, Pharmacy & Law -->
                                <div class="eg-megamenu-col">
                                    <div class="eg-megamenu-heading">
                                        <i class="${domainMap.medical.icon}"></i> ${domainMap.medical.title}
                                    </div>
                                    <ul class="eg-megamenu-list">
                                        ${domainMap.medical.items.map(c => `
                                            <li>
                                                <a href="courses-details.html?id=${c.id}" title="${c.name}">
                                                    <span>${c.name.length > 24 ? c.name.slice(0, 23) + '...' : c.name}</span>
                                                    <span class="item-mode">${c.duration ? c.duration.split(' ')[0] : 'Deg'}</span>
                                                </a>
                                            </li>
                                        `).join('')}
                                    </ul>
                                </div>

                                <!-- Column 5: Counselor & Guidance Promo Card -->
                                <div class="eg-megamenu-col">
                                    <div class="eg-megamenu-promo">
                                        <div>
                                            <span style="display:inline-block;padding:3px 10px;background:rgba(255,49,21,0.2);color:#ff7663;border-radius:20px;font-size:11px;font-weight:700;margin-bottom:8px;">100% FREE</span>
                                            <h5>Admission Guidance</h5>
                                            <p>Confused between Online, Regular, or Distance learning? Speak directly with expert educational counselors.</p>
                                        </div>
                                        <a href="contact.html" class="btn-promo-call">
                                            <i class="fa fa-phone"></i> Request Counseling
                                        </a>
                                    </div>
                                </div>

                            </div>
                        </div>
                    </li>
                `;
            }
            // 3. Universities (Dropdown)
            else if (item.id === 'universities') {
                const isUniv = activePath.includes('universities');
                html += `
                    <li class="has-dropdown ${isUniv ? 'current-menu-item' : ''}">
                        <a href="${item.url || 'universities.html'}">
                            ${item.title || 'Universities'} ${badgeHtml} <i class="fa fa-chevron-down eg-menu-arrow"></i>
                        </a>
                        <ul class="eg-dropdown-menu">
                            ${universities.slice(0, 8).map(u => `
                                <li>
                                    <a href="universities.html?id=${encodeURIComponent(u.id)}">
                                        ${u.name}
                                        <span class="dropdown-desc">${u.type || 'Approved'} &bull; ${u.location || 'India'}</span>
                                    </a>
                                </li>
                            `).join('')}
                            <li style="border-top:1px solid #f1f5f9;margin-top:6px;padding-top:6px;">
                                <a href="universities.html" style="color:#ff3115;font-weight:700;">
                                    <i class="fa fa-list"></i> Explore All Universities &rarr;
                                </a>
                            </li>
                        </ul>
                    </li>
                `;
            }
            // 4. Dropdowns (Boards, Subharti MBA Hub, or Custom Dropdown Headers)
            else if (item.children && item.children.length > 0) {
                const isCurrent = item.url && item.url !== '#' && activePath.includes(item.url.toLowerCase());
                html += `
                    <li class="has-dropdown ${isCurrent ? 'current-menu-item' : ''}">
                        <a href="${item.url || '#'}">
                            ${item.title} ${badgeHtml} <i class="fa fa-chevron-down eg-menu-arrow"></i>
                        </a>
                        <ul class="eg-dropdown-menu">
                            ${item.children.map(child => `
                                <li>
                                    <a href="${child.url || 'contact.html'}">
                                        ${child.title}
                                        ${child.desc ? `<span class="dropdown-desc">${child.desc}</span>` : ''}
                                    </a>
                                </li>
                            `).join('')}
                        </ul>
                    </li>
                `;
            }
            // 5. Standard Direct Links (Colleges, About Us, Videos, Blog, Contact, or Custom Direct Links)
            else {
                let iconHtml = '';
                if (item.icon) {
                    iconHtml = `<i class="${item.icon}" style="margin-right:4px;"></i>`;
                } else if (item.id === 'videos') {
                    iconHtml = '<i class="fa fa-youtube-play text-danger" style="margin-right:4px;"></i>';
                }

                let isCurrent = false;
                if (item.url && item.url !== '#') {
                    const cleanUrl = item.url.replace(/^\//, '').toLowerCase();
                    isCurrent = activePath.includes(cleanUrl);
                }

                html += `<li class="${isCurrent ? 'current-menu-item' : ''}"><a href="${item.url || '#'}">${iconHtml}${item.title} ${badgeHtml}</a></li>`;
            }
        });

        // Apply to navigation bar
        navMenu.innerHTML = html;

        // Attach Mobile Toggle Handler for Accordions
        attachMobileMenuHandlers();
    }

    function attachMobileMenuHandlers() {
        if (window.innerWidth >= 992) return;

        // Convert desktop hover dropdowns into click-toggle accordions on mobile
        document.querySelectorAll('.rs-menu ul.nav-menu > li.has-megamenu > a, .rs-menu ul.nav-menu > li.has-dropdown > a').forEach(a => {
            a.addEventListener('click', function(e) {
                if (window.innerWidth < 992) {
                    e.preventDefault();
                    const parent = this.parentElement;
                    const panel = parent.querySelector('.eg-megamenu-panel, .eg-dropdown-menu');
                    if (panel) {
                        panel.classList.toggle('mobile-open');
                    }
                }
            });
        });
    }

    // Auto-run when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initMegaMenu);
    } else {
        initMegaMenu();
    }
})();
