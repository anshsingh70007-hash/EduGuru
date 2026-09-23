/* =========================================================
   EducationistGuru - Dynamic CMS Content Hydration Layer
   Seamlessly syncs & displays newly added blogs & courses
   across all public website pages.
   ========================================================= */

(function() {
    'use strict';

    const CMS_DEFAULT_BLOGS = [
        {
            id: 1,
            title: "How to Choose the Right University for Your Career",
            category: "University Admissions",
            author: "EducationistGuru",
            date: "July 15, 2025",
            image: "images/blog/1.jpg",
            excerpt: "Choosing the right university is one of the most important decisions a student makes. At Educationist Guru, we help students navigate this process by offering transparent counseling across online, regular, and distance learning programs.",
            content: "<p>Choosing the right university is one of the most critical decisions in a student's life. With thousands of universities across India offering a wide variety of programs, the process can feel overwhelming. At Educationist Guru, we have been helping students navigate this journey since July 2023.</p><p>Here are the key factors every student should consider:</p><h4 style=\"margin:20px 0 10px;\">1. Accreditation and Recognition</h4><p>Always check if the university is recognized by UGC and has proper NAAC accreditation. An AIU-recognized degree ensures your qualification is valid across India and abroad. All programs listed on Educationist Guru are from recognized universities.</p><h4 style=\"margin:20px 0 10px;\">2. Course Relevance to Career Goals</h4><p>Choose a program that aligns with your career aspirations. Whether you want to pursue MBA, B.Tech, Law, or Paramedical courses, make sure the specialization is in demand. Our counselors can help you match your interests to the right programs across 15 faculties and 80+ courses.</p><h4 style=\"margin:20px 0 10px;\">3. Mode of Study</h4><p>Consider whether regular, distance, or online learning suits your lifestyle. Working professionals often benefit from distance learning, while fresh graduates may prefer on-campus experiences.</p><h4 style=\"margin:20px 0 10px;\">4. Fee Structure and Affordability</h4><p>Compare fee structures across universities. Don't just look at the lowest cost — consider the value you're getting in terms of faculty quality, placement support, and campus facilities.</p><h4 style=\"margin:20px 0 10px;\">5. Placement and Career Support</h4><p>Research the university's placement record. Strong industry connections and dedicated placement cells make a significant difference in your career trajectory after graduation.</p>",
            commentsCount: 12,
            isInitial: true
        },
        {
            id: 2,
            title: "Benefits of Distance Learning in 2025",
            category: "Distance Learning",
            author: "EducationistGuru",
            date: "June 28, 2025",
            image: "images/blog/2.jpg",
            excerpt: "Distance learning has transformed education in India, making quality degrees accessible to working professionals and students in remote areas. Learn how Educationist Guru helps students find the best distance learning programs.",
            content: "<p>Distance learning has transformed education in India, making quality degrees accessible to working professionals and students in remote areas. With university-approved programs and flexible schedules, distance education offers the same recognized qualifications without the need to relocate.</p><p>With UGC and DEB recognized universities, students can now pursue degrees in Management, Arts, IT, and Commerce with full government validity.</p>",
            commentsCount: 8,
            isInitial: true
        },
        {
            id: 3,
            title: "Top In-Demand Courses for Students in India",
            category: "Career Guidance",
            author: "EducationistGuru",
            date: "June 10, 2025",
            image: "images/blog/3.jpg",
            excerpt: "From MBA and B.Tech to emerging fields like AI, Data Science, and Cyber Security, the demand for specialized education continues to grow across 15 faculties.",
            content: "<p>From MBA and B.Tech to emerging fields like AI, Data Science, and Cyber Security, the demand for specialized education continues to grow. Our comprehensive list covers 15 faculties and 80+ programs to help you find the course that matches your career aspirations.</p><p>Explore which programs are trending and why students are enrolling in them with career guidance from Educationist Guru counselors.</p>",
            commentsCount: 15,
            isInitial: true
        }
    ];

    const CMS_DEFAULT_COURSES = [
        {
            id: 1,
            name: "MBA",
            faculty: "Faculty of Commerce & Management",
            duration: "2 Years (4 Sem)",
            eligibility: "Bachelor Degree",
            mode: "Online / Regular / Distance",
            image: "images/courses/4.jpg",
            specializations: "Marketing, Finance, HR, International Business, Digital Marketing, Supply Chain, Operations, IT",
            description: "The MBA program is engineered to build corporate leaders and entrepreneurs. Covers financial analysis, strategic marketing, human capital management, and digital transformation.",
            curriculum: ["Managerial Economics & Org Behavior", "Financial Management & Strategy", "Marketing & Consumer Insights", "Specialization Electives & Capstone"],
            fee: "Contact for fee schedule",
            isInitial: true
        },
        {
            id: 2,
            name: "B.Com (Honors)",
            faculty: "Faculty of Commerce & Management",
            duration: "4 Years (8 Sem)",
            eligibility: "XII from recognized board",
            mode: "Regular / Distance",
            image: "images/courses/2.jpg",
            specializations: "Accounting, Finance, Taxation, Banking",
            description: "Comprehensive undergraduate program covering financial accounting, corporate law, business statistics, and auditing practices.",
            curriculum: ["Financial Accounting & Microeconomics", "Corporate Laws & Mathematics", "Income Tax & Cost Accounting", "Auditing & Financial Management"],
            fee: "Contact for fee schedule",
            isInitial: true
        },
        {
            id: 3,
            name: "B.Tech Computer Science",
            faculty: "Faculty of Engineering & Technology",
            duration: "4 Years (8 Sem)",
            eligibility: "10+2 with PCM (min 50%)",
            mode: "Regular",
            image: "images/courses/1.jpg",
            specializations: "AI & ML, Cyber Security, Cloud Computing, Full Stack",
            description: "State-of-the-art curriculum blending core computing principles, algorithms, modern software architecture, and artificial intelligence.",
            curriculum: ["Data Structures & Algorithms", "Operating Systems & DBMS", "Artificial Intelligence & ML", "Full Stack Development & Cloud"],
            fee: "Contact for fee schedule",
            isInitial: true
        },
        {
            id: 4,
            name: "LL.B. (Bachelor of Laws)",
            faculty: "Faculty of Law",
            duration: "3 Years (6 Sem)",
            eligibility: "Graduation in any discipline",
            mode: "Regular",
            image: "images/courses/5.jpg",
            specializations: "Constitutional Law, Corporate Law, Criminal Law",
            description: "Premier professional law degree accredited by Bar Council of India standards, focusing on moot courts, jurisprudence, and legal advocacy.",
            curriculum: ["Constitutional Law & Jurisprudence", "Law of Torts & Consumer Protection", "Criminal Law & Evidence", "Civil Procedure & Moot Court"],
            fee: "Contact for fee schedule",
            isInitial: true
        },
        {
            id: 5,
            name: "B.Sc. Medical Lab Technology (BMLT)",
            faculty: "Faculty of Paramedical Sciences",
            duration: "3 Years + 6 Months Internship",
            eligibility: "10+2 with PCB",
            mode: "Regular",
            image: "images/courses/6.jpg",
            specializations: "Pathology, Microbiology, Hematology, Biochemistry",
            description: "Hands-on diagnostic sciences program training medical laboratory technicians in pathology, biochemical assays, and diagnostic equipment.",
            curriculum: ["Human Anatomy & Pathology", "Diagnostic Microbiology", "Clinical Biochemistry", "Hospital Internship"],
            fee: "Contact for fee schedule",
            isInitial: true
        },
        {
            id: 6,
            name: "Diploma in Yoga & Naturopathy",
            faculty: "Faculty of Yoga Science",
            duration: "1 Year (2 Sem)",
            eligibility: "10+2 in any stream",
            mode: "Online / Distance / Regular",
            image: "images/courses/3.jpg",
            specializations: "Therapeutic Yoga, Pranayama, Dietetics",
            description: "Empowers students with traditional yogic therapy, asanas, naturopathic lifestyle management, and holistic wellness consulting.",
            curriculum: ["Foundations of Yoga", "Principles of Naturopathy", "Asanas & Kriyas Practicum", "Therapeutic Yoga"],
            fee: "Contact for fee schedule",
            isInitial: true
        }
    ];

    const getCmsApiBase = () => {
        if (window.location.protocol === 'file:' || 
            (window.location.hostname === 'localhost' && window.location.port !== '3000') ||
            (window.location.hostname === '127.0.0.1' && window.location.port !== '3000')) {
            return 'http://localhost:3000';
        }
        return '';
    };
    const CMS_API_BASE = getCmsApiBase();

    window.EG_CMS = {
        _syncInProgress: false,

        getApiBase() {
            return CMS_API_BASE;
        },

        // Single-roundtrip authoritative server synchronization (mirrors CRM.syncWithServer)
        async syncWithServer() {
            if (this._syncInProgress) return null;
            this._syncInProgress = true;
            try {
                const bustUrl = `${CMS_API_BASE}/api/content/all?_t=${Date.now()}`;
                const res = await fetch(bustUrl, { cache: 'no-store' });
                if (res.ok) {
                    const json = await res.json();
                    if (json && json.success && json.data) {
                        const { courses, colleges, universities, blogs, videos } = json.data;
                        if (Array.isArray(courses)) localStorage.setItem('eg_cms_courses', JSON.stringify(courses));
                        if (Array.isArray(colleges)) localStorage.setItem('eg_cms_colleges', JSON.stringify(colleges));
                        if (Array.isArray(universities)) localStorage.setItem('eg_cms_universities', JSON.stringify(universities));
                        if (Array.isArray(blogs)) localStorage.setItem('eg_cms_blogs', JSON.stringify(blogs));
                        if (Array.isArray(videos)) localStorage.setItem('eg_cms_videos', JSON.stringify(videos));

                        window.dispatchEvent(new CustomEvent('cms:synced', { detail: json.data }));
                        return json.data;
                    }
                }
            } catch (e) {
                console.warn('[EG_CMS] Server sync offline, operating in local cache mode:', e.message);
            } finally {
                this._syncInProgress = false;
            }
            return null;
        },

        async getBlogs() {
            const cacheBust = `_t=${Date.now()}`;
            // 1. Try server API
            try {
                const res = await fetch(`${CMS_API_BASE}/api/content/blogs?${cacheBust}`, { cache: 'no-store' });
                if (res.ok) {
                    const data = await res.json();
                    if (data.blogs && data.blogs.length > 0) {
                        localStorage.setItem('eg_cms_blogs', JSON.stringify(data.blogs));
                        return data.blogs;
                    }
                }
            } catch (e) {}

            // 2. Try static data/blogs.json
            try {
                const res = await fetch(`data/blogs.json?${cacheBust}`, { cache: 'no-store' });
                if (res.ok) {
                    const data = await res.json();
                    if (Array.isArray(data) && data.length > 0) {
                        localStorage.setItem('eg_cms_blogs', JSON.stringify(data));
                        return data;
                    }
                }
            } catch (e) {}

            // 3. Try LocalStorage
            try {
                const local = localStorage.getItem('eg_cms_blogs');
                if (local) {
                    const parsed = JSON.parse(local);
                    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
                }
            } catch (e) {}

            localStorage.setItem('eg_cms_blogs', JSON.stringify(CMS_DEFAULT_BLOGS));
            return CMS_DEFAULT_BLOGS;
        },

        async getCourses() {
            const cacheBust = `_t=${Date.now()}`;
            // 1. Try server API
            try {
                const res = await fetch(`${CMS_API_BASE}/api/content/courses?${cacheBust}`, { cache: 'no-store' });
                if (res.ok) {
                    const data = await res.json();
                    if (data.courses && data.courses.length > 0) {
                        localStorage.setItem('eg_cms_courses', JSON.stringify(data.courses));
                        return data.courses;
                    }
                }
            } catch (e) {}

            // 2. Try static data/courses.json
            try {
                const res = await fetch(`data/courses.json?${cacheBust}`, { cache: 'no-store' });
                if (res.ok) {
                    const data = await res.json();
                    if (Array.isArray(data) && data.length > 0) {
                        localStorage.setItem('eg_cms_courses', JSON.stringify(data));
                        return data;
                    }
                }
            } catch (e) {}

            // 3. Try LocalStorage
            try {
                const local = localStorage.getItem('eg_cms_courses');
                if (local) {
                    const parsed = JSON.parse(local);
                    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
                }
            } catch (e) {}

            localStorage.setItem('eg_cms_courses', JSON.stringify(CMS_DEFAULT_COURSES));
            return CMS_DEFAULT_COURSES;
        },

        async getBlogById(id) {
            const blogs = await this.getBlogs();
            return blogs.find(b => String(b.id) === String(id)) || blogs[0];
        },

        async getCourseById(id) {
            const courses = await this.getCourses();
            return courses.find(c => String(c.id) === String(id)) || courses[0];
        },

        async getCourseBySlug(slug) {
            const courses = await this.getCourses();
            return courses.find(c => c.slug === slug || (c.name && c.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') === slug)) || null;
        },

        async getColleges() {
            const cacheBust = `_t=${Date.now()}`;
            // 1. Try server API
            try {
                const res = await fetch(`${CMS_API_BASE}/api/content/colleges?${cacheBust}`, { cache: 'no-store' });
                if (res.ok) {
                    const data = await res.json();
                    const list = Array.isArray(data) ? data : (data.colleges || []);
                    if (list.length > 0) {
                        localStorage.setItem('eg_cms_colleges', JSON.stringify(list));
                        return list;
                    }
                }
            } catch (e) {}

            // 2. Try static data/colleges.json
            try {
                const res = await fetch(`data/colleges.json?${cacheBust}`, { cache: 'no-store' });
                if (res.ok) {
                    const data = await res.json();
                    if (Array.isArray(data) && data.length > 0) {
                        localStorage.setItem('eg_cms_colleges', JSON.stringify(data));
                        return data;
                    }
                }
            } catch (e) {}

            // 3. Try LocalStorage
            try {
                const local = localStorage.getItem('eg_cms_colleges');
                if (local) {
                    const parsed = JSON.parse(local);
                    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
                }
            } catch (e) {}

            return [];
        },

        async getCollegeById(id) {
            const colleges = await this.getColleges();
            return colleges.find(c => String(c.id) === String(id)) || colleges[0];
        },

        async getUniversities() {
            const cacheBust = `_t=${Date.now()}`;
            // 1. Try server API
            try {
                const res = await fetch(`${CMS_API_BASE}/api/content/universities?${cacheBust}`, { cache: 'no-store' });
                if (res.ok) {
                    const data = await res.json();
                    const list = Array.isArray(data) ? data : (data.universities || []);
                    if (list.length > 0) {
                        localStorage.setItem('eg_cms_universities', JSON.stringify(list));
                        return list;
                    }
                }
            } catch (e) {}

            // 2. Try static data/universities.json
            try {
                const res = await fetch(`data/universities.json?${cacheBust}`, { cache: 'no-store' });
                if (res.ok) {
                    const data = await res.json();
                    if (Array.isArray(data) && data.length > 0) {
                        localStorage.setItem('eg_cms_universities', JSON.stringify(data));
                        return data;
                    }
                }
            } catch (e) {}

            // 3. Try LocalStorage
            try {
                const local = localStorage.getItem('eg_cms_universities');
                if (local) {
                    const parsed = JSON.parse(local);
                    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
                }
            } catch (e) {}

            return [];
        },

        async getUniversityById(id) {
            const universities = await this.getUniversities();
            return universities.find(u => String(u.id) === String(id)) || universities[0];
        },

        async getVideos() {
            const cacheBust = `_t=${Date.now()}`;
            // 1. Try server API
            try {
                const res = await fetch(`${CMS_API_BASE}/api/youtube/videos?${cacheBust}`, { cache: 'no-store' });
                if (res.ok) {
                    const data = await res.json();
                    const list = Array.isArray(data) ? data : (data.videos || []);
                    if (list.length > 0) {
                        localStorage.setItem('eg_youtube_videos', JSON.stringify(list));
                        return list;
                    }
                }
            } catch (e) {}

            // 2. Try static data/videos.json
            try {
                const res = await fetch(`data/videos.json?${cacheBust}`, { cache: 'no-store' });
                if (res.ok) {
                    const data = await res.json();
                    if (Array.isArray(data) && data.length > 0) {
                        localStorage.setItem('eg_youtube_videos', JSON.stringify(data));
                        return data;
                    }
                }
            } catch (e) {}

            // 3. Try LocalStorage
            try {
                const local = localStorage.getItem('eg_youtube_videos');
                if (local) {
                    const parsed = JSON.parse(local);
                    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
                }
            } catch (e) {}

            return [];
        }
    };

    // ================= PAGE HYDRATION =================
    async function hydratePage() {
        const path = window.location.pathname.toLowerCase();

        // 1. BLOG DETAILS PAGE (must be checked before blog.html)
        if (path.endsWith('blog-details.html') || path.includes('blog-details')) {
            await hydrateBlogDetailsPage();
        }
        // 2. BLOG LIST PAGE (blog.html)
        else if (path.endsWith('blog.html') || path.endsWith('/blog') || path.endsWith('/blog/')) {
            await hydrateBlogPage();
        }

        // 3. COURSE DETAILS PAGE (must be checked before courses.html)
        const isCourseDetails = path.endsWith('courses-details.html') || 
                               path.endsWith('courses-details2.html') || 
                               path.includes('courses-details') ||
                               (/^\/courses\/[^\/]+$/.test(path) && path !== '/courses' && path !== '/courses/');

        if (isCourseDetails) {
            await hydrateCourseDetailsPage();
        }
        // 4. COURSES PAGE (courses.html, courses2.html, /courses)
        else if (path.endsWith('courses.html') || path.endsWith('courses2.html') || path === '/courses' || path === '/courses/') {
            await hydrateCoursesPage();
        }

        // 5. COLLEGES PAGE (colleges.html, /colleges, /colleges/:slug)
        if (path.endsWith('colleges.html') || path.includes('/colleges')) {
            await hydrateCollegesPage();
        }

        // 6. UNIVERSITIES PAGE (universities.html, /universities, /universities/:slug)
        if (path.endsWith('universities.html') || path.includes('/universities')) {
            await hydrateUniversitiesPage();
        }

        // 7. HOMEPAGE (index.html or root /)
        if (path.endsWith('index.html') || path === '/' || path === '') {
            await hydrateHomePage();
        }

        // Always update any recent post widgets across all footers & sidebars
        await updateGlobalRecentPosts();
    }

    // ================= 1. BLOG.HTML =================
    async function hydrateBlogPage() {
        const grid = document.getElementById('egBlogGrid');
        if (!grid) return;

        const blogs = await window.EG_CMS.getBlogs();
        const searchInput = document.getElementById('egBlogSearchInput');
        const clearBtn = document.getElementById('egBlogSearchClear');
        const filterPills = document.querySelectorAll('#egBlogCategoryPills [data-category]');
        const sidebarRecent = document.getElementById('egBlogSidebarRecent');

        let activeCategory = 'all';
        let searchQuery = '';

        function renderArticles(items) {
            if (items.length === 0) {
                grid.innerHTML = `
                    <div class="col-12 text-center py-5">
                        <div class="eg-blog-empty" style="background:#fff;border-radius:16px;padding:45px 20px;border:1.5px dashed #cbd5e1;">
                            <i class="fa fa-search" style="font-size:42px;color:#cbd5e1;margin-bottom:14px;display:block;"></i>
                            <h4 style="font-weight:700;color:#1e293b;margin-bottom:8px;">No Articles Found</h4>
                            <p style="color:#64748b;font-size:14px;margin-bottom:18px;">No admission guides match "${searchQuery}". Try a different keyword or view all categories.</p>
                            <button type="button" class="btn btn-sm btn-primary" onclick="if(window.clearBlogFilters)window.clearBlogFilters();" style="background:#ff3115;border-color:#ff3115;padding:8px 20px;border-radius:20px;font-weight:600;">Show All Articles</button>
                        </div>
                    </div>
                `;
                return;
            }

            grid.innerHTML = items.map(b => {
                const isNew = !b.isInitial;
                const readTime = b.readTime || '4 min read';
                const dateDisplay = b.date || 'July 2025';
                const cleanExcerpt = (b.excerpt || (b.content ? b.content.replace(/<[^>]+>/g, '').slice(0, 160) + '...' : 'Complete admission analysis, eligibility criteria, and fee guidelines from Educationist Guru counselors.')).trim();

                // Extract and normalize category list into distinct chips
                let rawCats = [];
                if (Array.isArray(b.categories) && b.categories.length > 0) {
                    rawCats = b.categories;
                } else if (typeof b.category === 'string' && b.category.trim()) {
                    let catStr = b.category.trim();
                    if (catStr.includes(',')) {
                        rawCats = catStr.split(',').map(s => s.trim()).filter(Boolean);
                    } else if (catStr === 'University AdmissionsCareer Guidance') {
                        rawCats = ['University Admissions', 'Career Guidance'];
                    } else {
                        rawCats = [catStr];
                    }
                }
                if (rawCats.length === 0) rawCats = ['Admissions'];

                const categoryChipsHtml = rawCats.slice(0, 2).map(catItem => `
                    <span class="eg-blog-card-cat">${catItem}</span>
                `).join('');

                return `
                    <div class="col-lg-6 col-md-6 col-12 mb-4">
                        <article class="eg-blog-card ${isNew ? 'is-new' : ''}">
                            <div class="eg-blog-card-media">
                                <img src="${b.image || 'images/blog/1.jpg'}" alt="${b.title}" onerror="this.src='images/blog/1.jpg'">
                                <div class="eg-blog-card-cats">
                                    ${categoryChipsHtml}
                                </div>
                                ${isNew ? '<span class="eg-blog-card-badge"><i class="fa fa-bolt"></i> Latest</span>' : ''}
                            </div>
                            <div class="eg-blog-card-body">
                                <div class="eg-blog-card-meta">
                                    <span><i class="fa fa-calendar-o"></i> ${dateDisplay}</span>
                                    <span><i class="fa fa-clock-o"></i> ${readTime}</span>
                                </div>
                                <h3 class="eg-blog-card-title">
                                    <a href="blog-details.html?id=${b.id}">${b.title}</a>
                                </h3>
                                <p class="eg-blog-card-desc">${cleanExcerpt}</p>
                                <div class="eg-blog-card-footer">
                                    <div class="eg-blog-card-author">
                                        <div class="eg-blog-author-avatar"><i class="fa fa-user"></i></div>
                                        <span>${b.author || 'Admissions Desk'}</span>
                                    </div>
                                    <a href="blog-details.html?id=${b.id}" class="eg-blog-card-read">
                                        Read <i class="fa fa-arrow-right"></i>
                                    </a>
                                </div>
                            </div>
                        </article>
                    </div>
                `;
            }).join('');
        }

        // Render sidebar trending posts
        if (sidebarRecent) {
            sidebarRecent.innerHTML = blogs.slice(0, 4).map(b => {
                const parts = (b.date || 'July 15').split(' ');
                const day = parts[1] ? parts[1].replace(',', '') : '15';
                const month = parts[0] || 'July';
                return `
                    <div class="post-item" style="margin-bottom:14px;display:flex;align-items:center;">
                        <div class="post-date" style="margin-right:12px;text-align:center;min-width:44px;background:#f8fafc;border:1px solid #e2e8f0;padding:6px;border-radius:8px;">
                            <span style="display:block;font-size:16px;font-weight:800;color:#ff3115;line-height:1;">${day}</span>
                            <span style="font-size:10px;text-transform:uppercase;color:#64748b;font-weight:600;">${month}</span>
                        </div>
                        <div class="post-desc" style="flex:1;">
                            <h5 class="post-title" style="font-size:13.5px;font-weight:700;line-height:1.4;margin:0 0 3px;">
                                <a href="blog-details.html?id=${b.id}" style="color:#1e293b;">${b.title}</a>
                            </h5>
                            <span style="font-size:11.5px;color:#94a3b8;"><i class="fa fa-folder-o"></i> ${b.category || 'Admissions'}</span>
                        </div>
                    </div>
                `;
            }).join('');
        }

        function filterAndRender() {
            let filtered = blogs;
            if (activeCategory !== 'all') {
                const catQuery = activeCategory.toLowerCase();
                filtered = filtered.filter(b => {
                    const allCatStr = ((Array.isArray(b.categories) ? b.categories.join(' ') : '') + ' ' + (b.category || '')).toLowerCase();
                    return allCatStr.includes(catQuery);
                });
            }
            if (searchQuery) {
                const q = searchQuery.toLowerCase();
                filtered = filtered.filter(b => 
                    (b.title || '').toLowerCase().includes(q) ||
                    (b.excerpt || '').toLowerCase().includes(q) ||
                    (b.category || '').toLowerCase().includes(q) ||
                    (Array.isArray(b.categories) && b.categories.some(c => c.toLowerCase().includes(q))) ||
                    (Array.isArray(b.tags) && b.tags.some(t => t.toLowerCase().includes(q))) ||
                    (b.content || '').toLowerCase().includes(q)
                );
            }
            renderArticles(filtered);
        }

        // Debounced search input
        let debounceTimer;
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                searchQuery = e.target.value.trim();
                if (clearBtn) clearBtn.style.display = searchQuery ? 'block' : 'none';
                clearTimeout(debounceTimer);
                debounceTimer = setTimeout(filterAndRender, 200);
            });
        }

        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                searchInput.value = '';
                searchQuery = '';
                clearBtn.style.display = 'none';
                filterAndRender();
            });
        }

        // Category pills switcher
        filterPills.forEach(pill => {
            pill.addEventListener('click', function() {
                filterPills.forEach(p => p.classList.remove('active'));
                this.classList.add('active');
                activeCategory = this.getAttribute('data-category') || 'all';
                filterAndRender();
            });
        });

        window.clearBlogFilters = function() {
            if (searchInput) searchInput.value = '';
            searchQuery = '';
            if (clearBtn) clearBtn.style.display = 'none';
            activeCategory = 'all';
            filterPills.forEach(p => {
                if (p.getAttribute('data-category') === 'all') p.classList.add('active');
                else p.classList.remove('active');
            });
            filterAndRender();
        };

        // Initial render
        renderArticles(blogs);
    }

    // ================= 2. BLOG-DETAILS.HTML =================
    async function hydrateBlogDetailsPage() {
        const urlParams = new URLSearchParams(window.location.search);
        const blogId = urlParams.get('id');
        if (!blogId) return; // Keep default content if no query param

        const blog = await window.EG_CMS.getBlogById(blogId);
        if (!blog) return;

        // Update page title & breadcrumbs
        document.title = `${blog.title} | EducationistGuru`;
        const breadcrumbTitle = document.querySelector('.page-title');
        if (breadcrumbTitle) breadcrumbTitle.textContent = blog.title;

        const detailsItem = document.querySelector('.blog-details-item');
        if (!detailsItem) return;

        const isNew = !blog.isInitial;
        detailsItem.innerHTML = `
            ${isNew ? '<div style="display:inline-block; background: #ff3115; color: #fff; padding: 4px 14px; font-weight: 700; font-size: 11px; text-transform: uppercase; border-radius: 20px; margin-bottom: 12px;"><i class="fa fa-bolt" style="margin-right:4px;"></i>Newly Added Post</div>' : ''}
            <div class="blog-img" style="margin-bottom: 25px; border-radius: 8px; overflow: hidden;">
                <img src="${blog.image || 'images/blog/1.jpg'}" alt="${blog.title}" style="width:100%; max-height:480px; object-fit:cover;" onerror="this.src='images/blog/1.jpg'">
            </div>
            <div class="blog-meta" style="display: flex; flex-wrap: wrap; gap: 15px; margin-bottom: 15px; font-size: 14px; color: #666;">
                <span><i class="fa fa-user" style="color:#ff3115; margin-right:5px;"></i>${blog.author || 'EducationistGuru'}</span>
                <span><i class="fa fa-calendar" style="color:#ff3115; margin-right:5px;"></i>${blog.date || 'Recent'}</span>
                <span><i class="fa fa-folder" style="color:#ff3115; margin-right:5px;"></i>${blog.category || 'Admissions'}</span>
                <span><i class="fa fa-comments" style="color:#ff3115; margin-right:5px;"></i>${blog.commentsCount || 0} Comments</span>
            </div>
            <h2 class="blog-title" style="font-size: 28px; line-height: 1.35; margin-bottom: 20px; color:#111;">${blog.title}</h2>
            <div class="blog-body" style="font-size: 16px; line-height: 1.8; color: #444;">
                ${blog.content.includes('<p>') ? blog.content : blog.content.split('\n\n').map(p => `<p>${p}</p>`).join('')}
            </div>
            <div style="margin-top: 35px; padding: 20px; background: #fff5f3; border-left: 4px solid #ff3115; border-radius: 4px;">
                <h4 style="margin: 0 0 8px; font-size: 18px; color: #111;">Need guidance on this course or university?</h4>
                <p style="margin: 0 0 12px; font-size: 14px; color: #555;">Call Educationist Guru counselors directly at <strong>8750477000</strong> or <strong>9738707000</strong> for free personalized admissions support.</p>
                <a href="contact.html" style="display:inline-block; background:#ff3115; color:#fff; padding:8px 18px; border-radius:4px; font-weight:600; text-decoration:none; font-size:13px;">Request Free Counseling</a>
            </div>
            <div class="blog-share" style="margin-top:30px;padding:15px;background:#f8f9fa;border-radius:5px;display:flex;align-items:center;">
                <span style="font-weight:bold;margin-right:15px;">Share This:</span>
                <a href="https://www.facebook.com/educationistguruEg/" target="_blank" style="margin-right:12px;color:#3b5998;font-size:18px;"><i class="fa fa-facebook"></i></a>
                <a href="https://www.instagram.com/educationistguru/" target="_blank" style="margin-right:12px;color:#e1306c;font-size:18px;"><i class="fa fa-instagram"></i></a>
                <a href="https://www.youtube.com/@Educationistguru" target="_blank" style="color:#c4302b;font-size:18px;"><i class="fa fa-youtube-play"></i></a>
            </div>
        `;
    }

    // ================= 3. COURSES.HTML =================
    async function hydrateCoursesPage() {
        if (document.getElementById('eg-courses-grid')) {
            // Managed exclusively and reactively by js/courses-manager.js
            return;
        }

        const courses = await window.EG_CMS.getCourses();
        const newCourses = courses.filter(c => !c.isInitial);

        // Find the main courses row container
        const coursesContainer = document.querySelector('.rs-courses .row') || document.querySelector('#rs-courses .row');
        if (!coursesContainer) return;

        // If there are newly added courses, add a "Newly Added Programs" top highlight section!
        if (newCourses.length > 0) {
            let existingBanner = document.getElementById('eg-new-courses-banner');
            if (!existingBanner) {
                const bannerDiv = document.createElement('div');
                bannerDiv.id = 'eg-new-courses-banner';
                bannerDiv.className = 'col-12 mb-40';
                bannerDiv.innerHTML = `
                    <div style="background: linear-gradient(135deg, #111 0%, #1f2937 100%); border-left: 6px solid #ff3115; padding: 25px 30px; border-radius: 8px; margin-bottom: 25px; box-shadow: 0 10px 25px rgba(0,0,0,0.15);">
                        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:15px;">
                            <div>
                                <span style="background:#ff3115; color:#fff; font-size:11px; font-weight:800; padding:4px 10px; border-radius:20px; text-transform:uppercase; letter-spacing:0.5px;"><i class="fa fa-bolt"></i> Fresh Additions</span>
                                <h3 style="color:#fff; margin:10px 0 5px; font-size:24px;">Newly Added Programs & Degrees</h3>
                                <p style="color:#cbd5e1; margin:0; font-size:14px;">Browse the latest courses newly made available through EducationistGuru partner universities.</p>
                            </div>
                            <span style="background:rgba(255,49,21,0.2); color:#ff6b57; padding:8px 16px; border-radius:30px; font-weight:700; font-size:13px; border:1px solid rgba(255,49,21,0.3);">${newCourses.length} New Course${newCourses.length > 1 ? 's' : ''} Added</span>
                        </div>
                    </div>
                    <div class="row" id="eg-new-courses-grid"></div>
                `;
                coursesContainer.prepend(bannerDiv);

                const grid = bannerDiv.querySelector('#eg-new-courses-grid');
                newCourses.forEach(c => {
                    grid.innerHTML += renderCourseCard(c, true);
                });
            }
        }

        // Enrich existing course cards with AIU Fees and direct detail links
        const existingCards = document.querySelectorAll('.cource-item');
        existingCards.forEach(card => {
            const titleEl = card.querySelector('.course-title a');
            if (titleEl) {
                const titleText = titleEl.textContent.trim();
                const matched = courses.find(c =>
                    c.name.toLowerCase() === titleText.toLowerCase() ||
                    c.name.toLowerCase().startsWith(titleText.toLowerCase()) ||
                    titleText.toLowerCase().startsWith(c.name.toLowerCase())
                );
                if (matched) {
                    const cUrl = matched.slug ? `/courses/${matched.slug}` : `courses-details.html?id=${matched.id}`;
                    titleEl.href = cUrl;
                    const imgLink = card.querySelector('.image-link');
                    if (imgLink) imgLink.href = cUrl;

                    if (!card.querySelector('.aiu-fee-badge')) {
                        const feeDiv = document.createElement('div');
                        feeDiv.className = 'aiu-fee-badge';
                        feeDiv.style.cssText = 'margin-top:8px;font-size:12px;font-weight:700;color:#ff3115;background:#fff1ef;padding:3px 8px;border-radius:4px;display:inline-flex;align-items:center;gap:4px;';
                        feeDiv.innerHTML = `<i class="fa fa-inr"></i> Annual Fee: ${matched.fee}`;
                        const courseDesc = card.querySelector('.course-desc');
                        if (courseDesc) {
                            courseDesc.appendChild(feeDiv);
                        } else {
                            const body = card.querySelector('.course-body');
                            if (body) body.appendChild(feeDiv);
                        }
                    }
                }
            }
        });
    }

    function renderCourseCard(c, isNew = false, customId = '') {
        return `
            <div class="col-lg-4 col-md-6 mb-30" ${customId ? `id="${customId}"` : ''}>
                <div class="cource-item" style="${isNew ? 'border: 2px solid #ff3115; border-radius: 8px; position: relative; overflow: hidden; box-shadow: 0 6px 20px rgba(255,49,21,0.12);' : ''}">
                    ${isNew ? '<div style="position: absolute; top: 12px; right: 12px; background: #ff3115; color: #fff; padding: 3px 10px; font-weight: 800; font-size: 10px; text-transform: uppercase; border-radius: 20px; z-index: 10; letter-spacing: 0.5px; box-shadow: 0 2px 6px rgba(0,0,0,0.3);"><i class="fa fa-bolt" style="margin-right:3px;"></i>NEW</div>' : ''}
                    <div class="cource-img" style="height: 200px; overflow: hidden;">
                        <img src="${c.image || 'images/courses/1.jpg'}" alt="${c.name}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.src='images/courses/1.jpg'">
                        <a class="image-link" href="${c.slug ? '/courses/' + c.slug : 'courses-details.html?id=' + c.id}"><i class="fa fa-link"></i></a>
                    </div>
                    <div class="course-body" style="padding: 20px;">
                        <a href="${c.slug ? '/courses/' + c.slug : 'courses-details.html?id=' + c.id}" class="course-category" style="color: #ff3115; font-size: 12px; font-weight: 700; text-transform: uppercase;">${c.faculty}</a>
                        <h4 class="course-title" style="margin: 8px 0 10px; font-size: 18px;">
                            <a href="${c.slug ? '/courses/' + c.slug : 'courses-details.html?id=' + c.id}">${c.name}</a>
                        </h4>
                        <div class="aiu-fee-badge" style="margin-bottom:8px;font-size:12px;font-weight:700;color:#ff3115;background:#fff1ef;padding:3px 8px;border-radius:4px;display:inline-flex;align-items:center;gap:4px;">
                            <i class="fa fa-inr"></i> Annual Fee: ${c.fee}
                        </div>
                        <div class="course-desc" style="font-size: 13px; color: #666; margin-bottom: 12px; min-height: 38px;">
                            ${c.specializations ? `<p style="font-size:12px; color:#555; margin:0;"><strong>Highlights:</strong> ${c.specializations.slice(0, 95)}...</p>` : `<p style="font-size:12px; color:#555; margin:0;">${c.description ? c.description.slice(0, 80) + '...' : 'Recognized university curriculum.'}</p>`}
                        </div>
                    </div>
                    <div class="course-footer" style="padding: 12px 20px; background: #fdfdfd; border-top: 1px solid #f0f0f0; display:flex; justify-content:space-between; font-size: 12px;">
                        <div class="course-time"><span class="label" style="color:#888; display:block;">Duration</span><span class="desc" style="font-weight:700; color:#111;">${c.duration}</span></div>
                        <div class="course-student"><span class="label" style="color:#888; display:block;">Eligibility</span><span class="desc" style="font-weight:700; color:#111; font-size:11px;">${c.eligibility.slice(0, 24)}...</span></div>
                    </div>
                </div>
            </div>
        `;
    }

    // ================= 4. COURSES-DETAILS.HTML =================
    async function hydrateCourseDetailsPage() {
        if (document.getElementById('cdHeroBanner')) {
            // Modern dedicated hydration engine in courses-details.html is active
            return;
        }
        const urlParams = new URLSearchParams(window.location.search);
        let courseId = urlParams.get('id');
        const courses = await window.EG_CMS.getCourses();

        // If no ID in URL, default to first course or matching name query
        let course;
        if (courseId) {
            course = courses.find(c => String(c.id) === String(courseId));
        } else if (urlParams.get('name')) {
            const nameQ = urlParams.get('name').toLowerCase();
            course = courses.find(c => c.name.toLowerCase().includes(nameQ));
        }

        if (!course && courses.length > 0) {
            course = courses[0]; // Default to first course
        }
        if (!course) return;

        // Update page title & breadcrumbs
        document.title = `${course.name} | EducationistGuru`;
        const breadcrumbTitle = document.querySelector('.page-title');
        if (breadcrumbTitle) breadcrumbTitle.textContent = course.name;

        // Update course details
        const overviewContainer = document.querySelector('.course-overview');
        if (overviewContainer) {
            const isNew = !course.isInitial;
            const curriculumHtml = Array.isArray(course.curriculum) && course.curriculum.length > 0
                ? course.curriculum.map(mod => `<li style="padding:10px 0;border-bottom:1px solid #eee;display:flex;align-items:center;"><i class="fa fa-check-circle" style="color:#ff3115;margin-right:12px;font-size:16px;"></i>${mod}</li>`).join('')
                : '<li style="padding:10px 0;">Curriculum details available during counseling session.</li>';

            overviewContainer.innerHTML = `
                ${isNew ? '<div style="display:inline-block; background: #ff3115; color: #fff; padding: 5px 15px; font-weight: 700; font-size: 11px; text-transform: uppercase; border-radius: 20px; margin-bottom: 15px;"><i class="fa fa-bolt" style="margin-right:5px;"></i>Newly Added Program</div>' : ''}
                <img src="${course.image || 'images/courses/1.jpg'}" alt="${course.name}" style="width:100%;height:380px;object-fit:cover;border-radius:8px;margin-bottom:25px;" onerror="this.src='images/courses/1.jpg'">
                <div style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:10px; margin-bottom:10px;">
                    <div style="font-size:13px;font-weight:700;color:#ff3115;text-transform:uppercase;">${course.faculty}</div>
                    <div style="background:#fff1ef; color:#ff3115; font-weight:800; font-size:15px; padding:6px 14px; border-radius:20px; border:1px solid #fed7d2;">
                        <i class="fa fa-inr" style="margin-right:4px;"></i>Annual Fee: ${course.fee}
                    </div>
                </div>
                <h2 style="font-size:30px;color:#111;margin-bottom:15px;">${course.name}</h2>
                <div class="course-details-tabs">
                    <ul class="nav nav-tabs" role="tablist">
                        <li class="nav-item"><a class="nav-link active" data-toggle="tab" href="#overview">Overview & Highlights</a></li>
                        <li class="nav-item"><a class="nav-link" data-toggle="tab" href="#curriculum">Syllabus & Modules</a></li>
                        <li class="nav-item"><a class="nav-link" data-toggle="tab" href="#eligibility">Eligibility & Fee Structure</a></li>
                    </ul>
                    <div class="tab-content" style="margin-top:25px;">
                        <div class="tab-pane active" id="overview">
                            <p style="font-size:16px;line-height:1.8;color:#444;">${course.description || 'This course is tailored to equip students with deep theoretical insight and career-ready practical competencies.'}</p>
                            ${course.specializations ? `<div style="background:#f8f9fa;padding:18px;border-radius:6px;margin:20px 0;border-left:4px solid #ff3115;"><strong>Available Specializations / Streams:</strong><p style="margin:6px 0 0;color:#555;font-size:14px;line-height:1.6;">${course.specializations}</p></div>` : ''}
                            <p style="font-size:15px;color:#555;">Approved across partner universities recognized by AIU, UGC, NAAC, and state government education departments.</p>
                        </div>
                        <div class="tab-pane" id="curriculum">
                            <ul style="padding-left:0;list-style:none;">${curriculumHtml}</ul>
                        </div>
                        <div class="tab-pane" id="eligibility">
                            <div style="padding:15px 0;">
                                <h5 style="margin-bottom:8px;">Approved Fee Structure</h5>
                                <div style="font-size:22px;font-weight:800;color:#ff3115;margin-bottom:15px;"><i class="fa fa-inr"></i> ${course.fee}</div>
                                <h5 style="margin-bottom:8px;">Eligibility Criteria</h5>
                                <p style="font-size:15px;color:#444;margin-bottom:15px;">${course.eligibility}</p>
                                <h5 style="margin-bottom:8px;">Learning Mode Options</h5>
                                <p style="font-size:15px;color:#444;">${course.mode || 'Online, Regular, or Distance'}</p>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }

        // Update sidebar course features
        const featuresList = document.querySelector('.course-features');
        if (featuresList) {
            featuresList.innerHTML = `
                <li><i class="fa fa-clock-o"></i>Duration <span>${course.duration}</span></li>
                <li><i class="fa fa-inr"></i>Annual Fee <span>${course.fee}</span></li>
                <li><i class="fa fa-graduation-cap"></i>Mode <span>${course.mode || 'Regular / Online'}</span></li>
                <li><i class="fa fa-check-square-o"></i>Eligibility <span>${course.eligibility.slice(0, 22)}...</span></li>
                <li><i class="fa fa-language"></i>Language <span>English / Hindi</span></li>
            `;
        }
    }

    // ================= 5. INDEX.HTML (HOMEPAGE) =================
    async function hydrateHomePage() {
        const blogs = await window.EG_CMS.getBlogs();
        const courses = await window.EG_CMS.getCourses();

        // Update Latest News section if present
        const newsNormal = document.querySelector('.news-normal-block');
        const newsList = document.querySelector('.news-list-block');
        if (newsNormal && newsList && blogs.length > 0) {
            const topBlog = blogs[0];
            const isNew = !topBlog.isInitial;
            newsNormal.innerHTML = `
                <div class="news-img" style="position:relative;">
                    ${isNew ? '<span style="position:absolute;top:12px;left:12px;background:#ff3115;color:#fff;font-size:10px;font-weight:800;padding:3px 8px;border-radius:4px;z-index:5;"><i class="fa fa-bolt"></i> NEW</span>' : ''}
                    <a href="blog-details.html?id=${topBlog.id}"><img src="${topBlog.image || 'images/blog/1.jpg'}" alt="${topBlog.title}" style="height:280px;width:100%;object-fit:cover;" onerror="this.src='images/blog/1.jpg'"></a>
                </div>
                <div class="news-date"><i class="fa fa-calendar-check-o"></i><span>${topBlog.date}</span></div>
                <h4 class="news-title"><a href="blog-details.html?id=${topBlog.id}">${topBlog.title}</a></h4>
                <div class="news-desc"><p>${topBlog.excerpt || (topBlog.content ? topBlog.content.replace(/<[^>]+>/g, '').slice(0, 140) + '...' : '')}</p></div>
                <div class="news-btn"><a href="blog-details.html?id=${topBlog.id}">Read More</a></div>
            `;

            let otherBlogsHtml = '';
            blogs.slice(1, 4).forEach(b => {
                const isBNew = !b.isInitial;
                otherBlogsHtml += `
                    <div class="news-list-item" style="position:relative;">
                        <div class="news-img" style="position:relative;">
                            ${isBNew ? '<span style="position:absolute;top:4px;left:4px;background:#ff3115;color:#fff;font-size:9px;font-weight:800;padding:2px 5px;border-radius:3px;z-index:5;">NEW</span>' : ''}
                            <a href="blog-details.html?id=${b.id}"><img src="${b.image || 'images/blog/2.jpg'}" alt="${b.title}" style="width:100px;height:75px;object-fit:cover;" onerror="this.src='images/blog/2.jpg'"></a>
                        </div>
                        <div class="news-content">
                            <h5 class="news-title"><a href="blog-details.html?id=${b.id}">${b.title}</a></h5>
                            <div class="news-date"><i class="fa fa-calendar-check-o"></i><span>${b.date}</span></div>
                            <div class="news-desc"><p>${b.excerpt ? b.excerpt.slice(0, 90) + '...' : 'Latest education and admission guidance from EducationistGuru.'}</p></div>
                        </div>
                    </div>
                `;
            });
            newsList.innerHTML = otherBlogsHtml;
        }

        // Check if there are newly added courses and display a quick highlight banner above popular courses
        const newCourses = courses.filter(c => !c.isInitial);
        if (newCourses.length > 0) {
            const coursesSec = document.getElementById('rs-courses');
            if (coursesSec && !document.getElementById('home-new-courses-banner')) {
                const banner = document.createElement('div');
                banner.id = 'home-new-courses-banner';
                banner.className = 'container mb-30';
                banner.innerHTML = `
                    <div style="background:#fff;border-left:5px solid #ff3115;padding:16px 20px;border-radius:6px;box-shadow:0 4px 15px rgba(0,0,0,0.06);display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;">
                        <div>
                            <strong style="color:#ff3115;font-size:12px;text-transform:uppercase;"><i class="fa fa-bolt"></i> Newly Added Programs Available:</strong>
                            <span style="color:#333;margin-left:8px;font-size:14px;font-weight:600;">${newCourses.map(c => c.name).slice(0, 3).join(', ')}${newCourses.length > 3 ? ` + ${newCourses.length - 3} more` : ''}</span>
                        </div>
                        <a href="courses.html" style="background:#ff3115;color:#fff;padding:6px 16px;border-radius:4px;font-size:12px;font-weight:700;text-decoration:none;">View All Courses <i class="fa fa-arrow-right" style="margin-left:4px;"></i></a>
                    </div>
                `;
                const container = coursesSec.querySelector('.container');
                if (container) container.parentNode.insertBefore(banner, container);
            }
        }
    }

    // ================= COLLEGES PAGE HYDRATION =================
    async function hydrateCollegesPage() {
        const grid = document.getElementById('eg-colleges-grid') || document.getElementById('collegesGrid');
        if (!grid) return;

        const colleges = await window.EG_CMS.getColleges();
        const searchInput = document.getElementById('collegeSearchInput');
        const filterPills = document.querySelectorAll('[data-college-filter]');
        const isModernDirectory = Boolean(document.getElementById('collegeCategorySelect'));
        let currentFilter = 'all';

        function render(items) {
            if (items.length === 0) {
                grid.innerHTML = `
                    <div class="col-12 text-center py-5">
                        <div style="background:#fff;border-radius:12px;padding:50px 20px;border:1px dashed #cbd5e1;">
                            <i class="fa fa-graduation-cap" style="font-size:48px;color:#cbd5e1;margin-bottom:16px;"></i>
                            <h4 style="color:#1e293b;font-weight:700;margin-bottom:8px;">No Colleges Found</h4>
                            <p style="color:#64748b;font-size:14px;max-width:480px;margin:0 auto 20px;">Try adjusting your search terms or selecting a different category filter.</p>
                            <button class="btn btn-primary" onclick="if(window.resetCollegeFilters)window.resetCollegeFilters();" style="background:#ff3115;border-color:#ff3115;">Clear Filters</button>
                        </div>
                    </div>
                `;
                return;
            }

            grid.innerHTML = items.map(c => {
                const accStr = Array.isArray(c.accreditation) ? c.accreditation.join(', ') : String(c.accreditation || 'UGC Recognized');
                const primaryAcc = accStr.split(',')[0].trim();

                // Multi-category badge rendering
                const catList = Array.isArray(c.categories) && c.categories.length > 0
                    ? c.categories
                    : (c.category ? c.category.split(',').map(s => s.trim()).filter(Boolean) : ['Collegiate']);
                const catPillsHtml = catList.slice(0, 2).map(cat => `<span class="card-category-pill" style="margin-right:4px;">${cat.replace(/^Faculty of\s+/i, '')}</span>`).join('') + (catList.length > 2 ? `<span class="card-category-pill" style="background:#f1f5f9;color:#475569;">+${catList.length - 2}</span>` : '');

                // Multi-course summary rendering
                const courseList = Array.isArray(c.courses)
                    ? c.courses
                    : (c.courses ? String(c.courses).split(',').map(s => s.trim()).filter(Boolean) : ['UG & PG Degrees']);
                const coursesDisplay = courseList.slice(0, 3).join(', ') + (courseList.length > 3 ? ` + ${courseList.length - 3} more` : '');
                const isFeatured = Boolean(c.isFeatured || c.featured);

                return `
                <div class="col-lg-4 col-md-6 col-12 mb-4">
                    <div class="eg-card college-card">
                        <div class="card-img-wrap">
                            <img src="${c.image || 'images/courses/1.jpg'}" alt="${c.name}" onerror="this.src='images/courses/1.jpg'">
                            <span class="card-badge-top"><i class="fa fa-shield"></i> ${primaryAcc}</span>
                            ${isFeatured ? '<span class="card-featured-star"><i class="fa fa-star"></i> Top Choice</span>' : ''}
                        </div>
                        <div class="card-body">
                            <div class="card-meta-row" style="flex-wrap:wrap;gap:4px;">
                                <div style="display:flex;flex-wrap:wrap;gap:4px;flex:1;">
                                    ${catPillsHtml}
                                </div>
                                <span class="card-rating"><i class="fa fa-star text-warning"></i> ${c.rating || '4.8'}</span>
                            </div>
                            <h3 class="card-title">${c.name}</h3>
                            <div class="card-info-item"><i class="fa fa-map-marker text-danger"></i> <span>${c.location || 'India'}</span></div>
                            <div class="card-info-item"><i class="fa fa-university text-primary"></i> <span>${c.affiliation || 'Approved by State University / AICTE'}</span></div>
                            <div class="card-info-item"><i class="fa fa-book text-success"></i> <span><strong>Courses:</strong> ${coursesDisplay}</span></div>
                            <div class="card-info-item"><i class="fa fa-inr text-warning"></i> <span><strong>Fee Guide:</strong> ${c.fee || 'Contact for details'}</span></div>
                            ${c.facilities && (Array.isArray(c.facilities) ? c.facilities.length > 0 : c.facilities) ? `
                                <div style="display:flex; flex-wrap:wrap; gap:4px; margin: 6px 0 8px;">
                                    ${(Array.isArray(c.facilities) ? c.facilities : String(c.facilities).split(',')).slice(0, 3).map(f => `<span style="background:#f1f5f9; color:#475569; font-size:11px; padding:2px 7px; border-radius:4px; font-weight:600;"><i class="fa fa-check" style="color:#10b981; font-size:9px; margin-right:3px;"></i>${f.trim()}</span>`).join('')}
                                </div>
                            ` : ''}
                            <p class="card-desc">${c.description ? c.description.slice(0, 110) + '...' : 'Complete admission guidance, fee installment options, and seat booking assistance via Educationist Guru.'}</p>
                            <div class="card-actions">
                                <button class="btn btn-outline-secondary btn-sm flex-fill" onclick="window.showCollegeDetails('${c.id}')"><i class="fa fa-info-circle"></i> Details</button>
                                <button class="btn btn-primary btn-sm flex-fill" onclick="window.applyForInstitution('${c.name.replace(/'/g, "\\'")}', 'College')"><i class="fa fa-phone"></i> Apply Now</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            }).join('');
        }

        function filterAndRender() {
            const query = searchInput ? searchInput.value.toLowerCase().trim() : '';
            let filtered = colleges;

            if (currentFilter !== 'all') {
                filtered = filtered.filter(c => {
                    const catStr = (Array.isArray(c.categories) ? c.categories.join(' ') : String(c.category || '')).toLowerCase();
                    const coursesStr = (Array.isArray(c.courses) ? c.courses.join(' ') : String(c.courses || '')).toLowerCase();
                    const f = currentFilter.toLowerCase();
                    if (f === 'pharmacy') return catStr.includes('pharmacy') || coursesStr.includes('pharm') || coursesStr.includes('d.pharm') || coursesStr.includes('b.pharm');
                    if (f === 'engineering') return catStr.includes('engineering') || catStr.includes('tech') || coursesStr.includes('b.tech') || coursesStr.includes('m.tech') || coursesStr.includes('engineer');
                    if (f === 'management') return catStr.includes('management') || catStr.includes('commerce') || coursesStr.includes('mba') || coursesStr.includes('bba') || coursesStr.includes('b.com');
                    if (f.includes('computer') || f.includes('it')) return catStr.includes('computer') || catStr.includes('it') || coursesStr.includes('bca') || coursesStr.includes('mca') || coursesStr.includes('cs') || coursesStr.includes('artificial') || coursesStr.includes('ai');
                    if (f === 'law') return catStr.includes('law') || coursesStr.includes('llb') || coursesStr.includes('ll.b');
                    if (f === 'paramedical') return catStr.includes('paramedical') || catStr.includes('medical') || coursesStr.includes('bmlt') || coursesStr.includes('dmlt');
                    if (f.includes('education') || f.includes('sports')) return catStr.includes('education') || catStr.includes('sports') || catStr.includes('b.ed');
                    return catStr.includes(f) || coursesStr.includes(f);
                });
            }

            if (query) {
                filtered = filtered.filter(c => {
                    const nameStr = String(c.name || '').toLowerCase();
                    const locStr = String(c.location || '').toLowerCase();
                    const catStr = (Array.isArray(c.categories) ? c.categories.join(' ') : String(c.category || '')).toLowerCase();
                    const coursesStr = (Array.isArray(c.courses) ? c.courses.join(' ') : String(c.courses || '')).toLowerCase();
                    const affStr = String(c.affiliation || '').toLowerCase();
                    return nameStr.includes(query) || locStr.includes(query) || catStr.includes(query) || coursesStr.includes(query) || affStr.includes(query);
                });
            }

            render(filtered);
        }

        if (!isModernDirectory) {
            if (searchInput) searchInput.addEventListener('input', filterAndRender);

            filterPills.forEach(pill => {
                pill.addEventListener('click', (e) => {
                    e.preventDefault();
                    filterPills.forEach(p => p.classList.remove('active'));
                    pill.classList.add('active');
                    currentFilter = pill.dataset.collegeFilter || 'all';
                    filterAndRender();
                });
            });

            window.resetCollegeFilters = () => {
                if (searchInput) searchInput.value = '';
                currentFilter = 'all';
                filterPills.forEach(p => p.classList.toggle('active', p.dataset.collegeFilter === 'all'));
                render(colleges);
            };
        }

        function generateSlug(text) {
            if (!text) return '';
            return text.toString().toLowerCase().trim()
                .replace(/[^\w\s-]/g, '')
                .replace(/[\s_-]+/g, '-')
                .replace(/^-+|-+$/g, '');
        }

        window.showCollegeDetails = (idOrSlug, updateUrl = true) => {
            const college = colleges.find(c => 
                String(c.id) === String(idOrSlug) || 
                (c.slug && c.slug === idOrSlug) || 
                generateSlug(c.name) === idOrSlug
            );
            if (!college) return;
            const slug = college.slug || generateSlug(college.name);

            if (updateUrl && window.history && window.history.pushState) {
                window.history.pushState({ type: 'college', id: college.id, slug }, college.name, '/colleges/' + slug);
                document.title = `${college.name} | Admissions & Counseling | EducationistGuru`;
            }

            const catList = Array.isArray(college.categories) && college.categories.length > 0 
                ? college.categories 
                : (college.category ? college.category.split(',').map(s => s.trim()).filter(Boolean) : ['Faculty of Engineering & Technology']);
            const courseList = Array.isArray(college.courses) 
                ? college.courses 
                : (college.courses ? String(college.courses).split(',').map(s => s.trim()).filter(Boolean) : ['Degree Programs']);

            let modal = document.getElementById('collegeDetailModal');
            if (!modal) {
                modal = document.createElement('div');
                modal.id = 'collegeDetailModal';
                modal.className = 'modal fade';
                modal.tabIndex = -1;
                document.body.appendChild(modal);
            }
            modal.innerHTML = `
                <div class="modal-dialog modal-dialog-centered modal-lg">
                    <div class="modal-content" style="border-radius:20px;overflow:hidden;border:1px solid #e2e8f0;box-shadow:0 25px 60px rgba(15,23,42,0.18);">
                        <div class="modal-header" style="background:#ffffff;border-bottom:1px solid #e2e8f0;padding:20px 26px;">
                            <h5 class="modal-title" style="color:#0f172a;font-weight:800;font-size:20px;display:flex;align-items:center;gap:10px;">
                                <span style="display:grid;place-items:center;width:38px;height:38px;border-radius:12px;background:#fff0e6;color:#ff6b00;font-size:18px;"><i class="fa fa-graduation-cap"></i></span>
                                ${college.name}
                            </h5>
                            <button type="button" class="close" data-dismiss="modal" style="font-size:28px;color:#64748b;opacity:0.7;outline:none;">&times;</button>
                        </div>
                        <div class="modal-body" style="padding:28px;">
                            <div class="row">
                                <div class="col-md-5 mb-3">
                                    <img src="${college.image || 'images/courses/1.jpg'}" alt="${college.name}" style="width:100%;height:210px;object-fit:cover;border-radius:16px;box-shadow:0 8px 24px rgba(15,23,42,0.08);">
                                    <div style="margin-top:16px;background:#fffbf7;padding:16px;border-radius:14px;border:1px solid rgba(255,107,0,0.12);">
                                        <div style="font-size:13px;color:#475569;margin-bottom:6px;"><strong style="color:#0f172a;">Location:</strong> ${college.location}</div>
                                        ${college.affiliation ? `<div style="font-size:13px;color:#475569;margin-bottom:6px;"><strong style="color:#0f172a;">Affiliation:</strong> ${college.affiliation}</div>` : ''}
                                        <div style="font-size:13px;color:#475569;margin-bottom:6px;"><strong style="color:#0f172a;">Established:</strong> ${college.established || 'N/A'}</div>
                                        <div style="font-size:13px;color:#475569;margin-bottom:6px;"><strong style="color:#0f172a;">Accreditation:</strong> <span class="tag tag--orange" style="font-size:11px;">${college.accreditation || 'Recognized'}</span></div>
                                        <div style="font-size:13px;color:#475569;"><strong style="color:#0f172a;">Estimated Fee:</strong> <span style="color:#ff6b00;font-weight:800;">${college.fee}</span></div>
                                    </div>
                                </div>
                                <div class="col-md-7">
                                    <div style="margin-bottom:14px;display:flex;flex-wrap:wrap;gap:6px;">
                                        ${catList.map(cat => `<span class="tag tag--orange" style="font-size:11px;padding:4px 10px;display:inline-flex;align-items:center;border-radius:20px;font-weight:600;"><i class="fa fa-folder-open-o" style="margin-right:4px;"></i>${cat}</span>`).join('')}
                                    </div>
                                    <h4 style="font-size:19px;font-weight:800;color:#0f172a;margin-bottom:10px;">About the Institution</h4>
                                    <p style="font-size:14px;color:#475569;line-height:1.65;">${college.description || 'Recognized institution offering accredited career programs with flexible counseling support.'}</p>
                                    
                                    ${college.facilities && (Array.isArray(college.facilities) ? college.facilities.length > 0 : college.facilities.trim()) ? `
                                        <h5 style="font-size:15px;font-weight:700;color:#0f172a;margin:16px 0 8px;display:flex;align-items:center;gap:6px;"><i class="fa fa-wifi" style="color:#ff6b00;"></i> Campus Facilities &amp; Amenities:</h5>
                                        <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:12px;">
                                            ${(Array.isArray(college.facilities) ? college.facilities : String(college.facilities).split(',')).map(f => `<span style="background:#f1f5f9;border:1px solid #cbd5e1;padding:4px 10px;border-radius:20px;font-size:12px;font-weight:600;color:#334155;display:inline-flex;align-items:center;gap:5px;"><i class="fa fa-check-circle" style="color:#10b981;"></i>${f.trim()}</span>`).join('')}
                                        </div>
                                    ` : ''}
                                    <h5 style="font-size:15px;font-weight:700;color:#0f172a;margin:18px 0 10px;display:flex;align-items:center;gap:6px;"><i class="fa fa-list-ul" style="color:#ff6b00;"></i> Programs &amp; Courses Offered:</h5>
                                    <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:12px 14px;display:flex;flex-wrap:wrap;gap:8px;">
                                        ${courseList.map(cr => `<span style="background:#ffffff;border:1px solid #cbd5e1;padding:4px 10px;border-radius:8px;font-size:13px;font-weight:600;color:#1e293b;display:inline-flex;align-items:center;"><i class="fa fa-graduation-cap" style="color:#ff6b00;margin-right:6px;"></i>${cr}</span>`).join('')}
                                    </div>
                                    <div style="margin-top:16px;background:#ecfdf3;border:1px solid #bbf7d0;border-radius:12px;padding:12px 16px;color:#15803d;font-size:13px;line-height:1.5;">
                                        <i class="fa fa-check-circle" style="color:#16a34a;margin-right:6px;"></i> <strong>100% Free Counseling:</strong> Get expert guidance on document verification, eligibility, and scholarship installments from Educationist Guru counselors.
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer" style="background:#f8fafc;padding:16px 28px;border-top:1px solid #e2e8f0;">
                            <button type="button" class="btn-eg-secondary" data-dismiss="modal" style="min-height:42px;padding:0 18px;">Close</button>
                            <button type="button" class="btn-eg-primary" style="min-height:42px;padding:0 22px;" onclick="window.applyForInstitution('${college.name.replace(/'/g, "\\'")}', 'College'); $('#collegeDetailModal').modal('hide');"><i class="fa fa-phone"></i> Get Free Admission Counseling</button>
                        </div>
                    </div>
                </div>
            `;
            $('#collegeDetailModal').modal('show');
            $('#collegeDetailModal').off('hidden.bs.modal').on('hidden.bs.modal', function() {
                if (window.history && window.history.pushState && window.location.pathname.startsWith('/colleges/')) {
                    window.history.pushState({}, 'Colleges', '/colleges');
                    document.title = 'Top Colleges in India | Admissions & Counseling | EducationistGuru';
                }
            });
        };

        if (!isModernDirectory) {
            render(colleges);
        }

        // Auto-hydrate college from URL deep link if /colleges/:slug
        if (window.location.pathname.startsWith('/colleges/')) {
            const rawSlug = window.location.pathname.replace(/^\/colleges\/?/, '').replace(/\/$/, '').trim();
            if (rawSlug) {
                const match = colleges.find(c => 
                    (c.slug && c.slug === rawSlug) || 
                    generateSlug(c.name) === rawSlug || 
                    String(c.id) === rawSlug
                );
                if (match) {
                    setTimeout(() => window.showCollegeDetails(match.id, false), 120);
                }
            }
        }
    }

    // ================= UNIVERSITIES PAGE HYDRATION =================
    async function hydrateUniversitiesPage() {
        const grid = document.getElementById('eg-universities-grid') || document.getElementById('universitiesGrid');
        if (!grid) return;

        const universities = await window.EG_CMS.getUniversities();
        const searchInput = document.getElementById('univSearchInput');
        const filterPills = document.querySelectorAll('[data-univ-filter]');
        const isModernDirectory = Boolean(document.getElementById('univTypeSelect'));
        let currentFilter = 'all';

        function generateSlug(text) {
            if (!text) return '';
            return text.toString().toLowerCase().trim()
                .replace(/[^\w\s-]/g, '')
                .replace(/[\s_-]+/g, '-')
                .replace(/^-+|-+$/g, '');
        }

        function render(items) {
            if (items.length === 0) {
                grid.innerHTML = `
                    <div class="col-12 text-center py-5">
                        <div style="background:#fff;border-radius:16px;padding:50px 20px;border:1px dashed #cbd5e1;box-shadow:0 4px 20px rgba(15,23,42,0.03);">
                            <i class="fa fa-university" style="font-size:48px;color:#ff9a55;margin-bottom:16px;"></i>
                            <h4 style="color:#0f172a;font-weight:800;margin-bottom:8px;">No Universities Found</h4>
                            <p style="color:#64748b;font-size:14px;max-width:480px;margin:0 auto 20px;">Try adjusting your search criteria or selecting another filter pill.</p>
                            <button class="btn-eg-primary" onclick="if(window.resetUnivFilters)window.resetUnivFilters();">Clear Filters</button>
                        </div>
                    </div>
                `;
                return;
            }

            grid.innerHTML = items.map(u => {
                const approvalsDisplay = Array.isArray(u.approvals) ? u.approvals.join(', ') : String(u.approvals || 'UGC / AIU / AICTE Recognized');
                const modesDisplay = Array.isArray(u.modes) ? u.modes.join(', ') : String(u.modes || 'Online / Distance / Regular');
                const isFeatured = Boolean(u.isFeatured || u.featured);

                return `
                <div class="col-lg-4 col-md-6 col-12 mb-4">
                    <div class="eg-card univ-card">
                        <div class="card-img-wrap">
                            <img src="${u.image || 'images/slider/home1/slide1.jpg'}" alt="${u.name}" onerror="this.src='images/slider/home1/slide1.jpg'">
                            <span class="card-badge-top"><i class="fa fa-certificate"></i> ${u.naac || 'UGC Approved'}</span>
                            ${isFeatured ? '<span class="card-featured-star"><i class="fa fa-star"></i> Featured Partner</span>' : ''}
                        </div>
                        <div class="card-body">
                            <div class="card-meta-row">
                                <span class="card-category-pill" style="background:#fff0e6;color:#ff6b00;">${u.type || 'State Private University'}</span>
                                <span class="card-rating"><i class="fa fa-star text-warning"></i> ${u.rating || '4.9'}</span>
                            </div>
                            <h3 class="card-title">${u.name}</h3>
                            <div class="card-info-item"><i class="fa fa-map-marker" style="color:#ff6b00;"></i> <span>${u.location || 'India'}</span></div>
                            <div class="card-info-item"><i class="fa fa-shield" style="color:#2563eb;"></i> <span>${approvalsDisplay}</span></div>
                            <div class="card-info-item"><i class="fa fa-laptop" style="color:#0ea5e9;"></i> <span><strong>Modes:</strong> ${modesDisplay}</span></div>
                            <div class="card-info-item"><i class="fa fa-inr" style="color:#d97706;"></i> <span><strong>Fee Guide:</strong> ${u.fee || 'Affordable Semester Installments'}</span></div>
                            <div class="card-highlight-box"><i class="fa fa-check-circle" style="color:#10b981;margin-right:4px;"></i> ${u.highlights ? u.highlights.slice(0, 90) + '...' : 'Recognized for Govt Jobs & Abroad'}</div>
                            ${u.facilities && (Array.isArray(u.facilities) ? u.facilities.length > 0 : u.facilities) ? `
                                <div style="display:flex; flex-wrap:wrap; gap:4px; margin: 6px 0 8px;">
                                    ${(Array.isArray(u.facilities) ? u.facilities : String(u.facilities).split(',')).slice(0, 3).map(f => `<span style="background:#f5f3ff; color:#6d28d9; border:1px solid #ddd6fe; font-size:11px; padding:2px 7px; border-radius:4px; font-weight:600;"><i class="fa fa-check" style="color:#8b5cf6; font-size:9px; margin-right:3px;"></i>${f.trim()}</span>`).join('')}
                                </div>
                            ` : ''}
                            <div class="card-actions">
                                <button class="btn btn-outline-secondary btn-sm flex-fill" onclick="window.showUnivDetails('${u.id}')"><i class="fa fa-info-circle"></i> Details</button>
                                <button class="btn btn-primary btn-sm flex-fill" style="background:#ff6b00;border-color:#ff6b00;" onclick="window.applyForInstitution('${u.name.replace(/'/g, "\\'")}', 'University')"><i class="fa fa-phone"></i> Explore Admissions</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            }).join('');
        }

        function filterAndRender() {
            const query = searchInput ? searchInput.value.toLowerCase().trim() : '';
            let filtered = universities;

            if (currentFilter !== 'all') {
                filtered = filtered.filter(u => {
                    const modesStr = Array.isArray(u.modes) ? u.modes.join(' ').toLowerCase() : String(u.modes || '').toLowerCase();
                    const typeStr = String(u.type || '').toLowerCase();
                    const approvalsStr = Array.isArray(u.approvals) ? u.approvals.join(' ').toLowerCase() : String(u.approvals || '').toLowerCase();
                    const naacStr = String(u.naac || '').toLowerCase();
                    const f = currentFilter.toLowerCase();
                    return modesStr.includes(f) || typeStr.includes(f) || approvalsStr.includes(f) || naacStr.includes(f);
                });
            }

            if (query) {
                filtered = filtered.filter(u => {
                    const nameStr = String(u.name || '').toLowerCase();
                    const locStr = String(u.location || '').toLowerCase();
                    const streamsStr = Array.isArray(u.popularStreams || u.streams) ? (u.popularStreams || u.streams).join(' ').toLowerCase() : String(u.popularStreams || u.streams || '').toLowerCase();
                    const approvalsStr = Array.isArray(u.approvals) ? u.approvals.join(' ').toLowerCase() : String(u.approvals || '').toLowerCase();
                    return nameStr.includes(query) || locStr.includes(query) || streamsStr.includes(query) || approvalsStr.includes(query);
                });
            }

            render(filtered);
        }

        if (!isModernDirectory) {
            if (searchInput) searchInput.addEventListener('input', filterAndRender);

            filterPills.forEach(pill => {
                pill.addEventListener('click', (e) => {
                    e.preventDefault();
                    filterPills.forEach(p => p.classList.remove('active'));
                    pill.classList.add('active');
                    currentFilter = pill.dataset.univFilter || 'all';
                    filterAndRender();
                });
            });

            window.resetUnivFilters = () => {
                if (searchInput) searchInput.value = '';
                currentFilter = 'all';
                filterPills.forEach(p => p.classList.toggle('active', p.dataset.univFilter === 'all'));
                render(universities);
            };
        }

        function findMatchingUniversity(idOrSlug, list) {
            if (!idOrSlug || !list || !list.length) return null;
            const target = String(idOrSlug).trim().toLowerCase();
            const targetClean = target.replace(/[^a-z0-9]/g, '');

            // 1. Direct ID match
            let match = list.find(u => String(u.id).toLowerCase() === target);
            if (match) return match;

            // 2. Exact slug match
            match = list.find(u => u.slug && u.slug.toLowerCase() === target);
            if (match) return match;

            // 3. Name slug match
            match = list.find(u => generateSlug(u.name) === target);
            if (match) return match;

            // 4. Normalized clean match (e.g. "asianinternationaluniversity" matches "asianinternationaluniversityaiu")
            match = list.find(u => {
                const uSlugClean = (u.slug || '').toLowerCase().replace(/[^a-z0-9]/g, '');
                const uNameClean = (u.name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
                return (uSlugClean && (uSlugClean === targetClean || uSlugClean.includes(targetClean) || targetClean.includes(uSlugClean))) ||
                       (uNameClean && (uNameClean === targetClean || uNameClean.includes(targetClean) || targetClean.includes(uNameClean)));
            });
            if (match) return match;

            // 5. Keyword search (e.g. "subharti", "aiu", "sgvu", "mangalayatan", "osgu", "kalinga")
            const tokens = target.split(/[-_\s]+/).filter(t => t.length >= 2);
            if (tokens.length > 0) {
                match = list.find(u => {
                    const combined = ((u.name || '') + ' ' + (u.slug || '') + ' ' + (u.type || '')).toLowerCase();
                    return tokens.some(tok => combined.includes(tok));
                });
            }
            return match || null;
        }

        window.showUnivDetails = async (idOrSlug, updateUrl = true) => {
            let univList = universities;
            if (!univList || !univList.length) {
                if (window.EG_CMS && typeof window.EG_CMS.getUniversities === 'function') {
                    try { univList = await window.EG_CMS.getUniversities(); } catch (_) {}
                }
            }
            if (!univList || !univList.length) {
                try {
                    const res = await fetch('/api/content/universities');
                    if (res.ok) {
                        const json = await res.json();
                        univList = Array.isArray(json) ? json : (json.data || json.universities || []);
                    }
                } catch (_) {}
            }

            const univ = findMatchingUniversity(idOrSlug, univList);
            if (!univ) {
                console.warn('[Universities] No matching university found for:', idOrSlug);
                return;
            }
            const slug = univ.slug || generateSlug(univ.name);

            if (updateUrl && window.history && window.history.pushState) {
                window.history.pushState({ type: 'university', id: univ.id, slug }, univ.name, '/universities/' + slug);
                document.title = `${univ.name} | Degrees & Counseling | EducationistGuru`;
            }

            const streamsList = Array.isArray(univ.streams) && univ.streams.length > 0 
                ? univ.streams 
                : (univ.popularStreams ? univ.popularStreams.split(',').map(s => s.trim()).filter(Boolean) : ['Management', 'Computer Applications', 'Engineering', 'Arts', 'Science']);
            const courseList = Array.isArray(univ.courses) && univ.courses.length > 0
                ? univ.courses
                : (univ.courses ? String(univ.courses).split(',').map(s => s.trim()).filter(Boolean) : []);

            let modal = document.getElementById('univDetailModal');
            if (!modal) {
                modal = document.createElement('div');
                modal.id = 'univDetailModal';
                modal.className = 'modal fade';
                modal.tabIndex = -1;
                document.body.appendChild(modal);
            }
            modal.innerHTML = `
                <div class="modal-dialog modal-dialog-centered modal-lg">
                    <div class="modal-content" style="border-radius:20px;overflow:hidden;border:1px solid #e2e8f0;box-shadow:0 25px 60px rgba(15,23,42,0.18);">
                        <div class="modal-header" style="background:#ffffff;border-bottom:1px solid #e2e8f0;padding:20px 26px;">
                            <h5 class="modal-title" style="color:#0f172a;font-weight:800;font-size:20px;display:flex;align-items:center;gap:10px;">
                                <span style="display:grid;place-items:center;width:38px;height:38px;border-radius:12px;background:#fff0e6;color:#ff6b00;font-size:18px;"><i class="fa fa-university"></i></span>
                                ${univ.name}
                            </h5>
                            <button type="button" class="close" data-dismiss="modal" style="font-size:28px;color:#64748b;opacity:0.7;outline:none;">&times;</button>
                        </div>
                        <div class="modal-body" style="padding:28px;">
                            <div class="row">
                                <div class="col-md-5 mb-3">
                                    <img src="${univ.image || 'images/slider/home1/slide1.jpg'}" alt="${univ.name}" style="width:100%;height:210px;object-fit:cover;border-radius:16px;box-shadow:0 8px 24px rgba(15,23,42,0.08);">
                                    <div style="margin-top:16px;background:#fffbf7;padding:16px;border-radius:14px;border:1px solid rgba(255,107,0,0.12);">
                                        <div style="font-size:13px;color:#475569;margin-bottom:6px;"><strong style="color:#0f172a;">Location:</strong> ${univ.location}</div>
                                        <div style="font-size:13px;color:#475569;margin-bottom:6px;"><strong style="color:#0f172a;">Established:</strong> ${univ.established || 'N/A'}</div>
                                        <div style="font-size:13px;color:#475569;margin-bottom:6px;"><strong style="color:#0f172a;">Accreditation:</strong> <span class="tag tag--orange" style="font-size:11px;">${univ.naac || 'UGC Approved'}</span></div>
                                        <div style="font-size:13px;color:#475569;${univ.fee ? 'margin-bottom:6px;' : ''}"><strong style="color:#0f172a;">Learning Modes:</strong> <span style="color:#ff6b00;font-weight:800;">${univ.modes}</span></div>
                                        ${univ.fee ? `<div style="font-size:13px;color:#475569;"><strong style="color:#0f172a;">Fee Guidance:</strong> <span style="color:#ff6b00;font-weight:800;">${univ.fee}</span></div>` : ''}
                                    </div>
                                </div>
                                <div class="col-md-7">
                                    <div style="margin-bottom:12px;">
                                        <span class="tag tag--orange" style="font-size:12px;padding:4px 12px;">${univ.type}</span>
                                    </div>
                                    <h4 style="font-size:19px;font-weight:800;color:#0f172a;margin-bottom:10px;">University Overview</h4>
                                    <p style="font-size:14px;color:#475569;line-height:1.65;">${univ.description || 'Prestigious university recognized for academic quality and student-centric support.'}</p>
                                    ${univ.highlights ? `<div style="margin-top:10px;background:#fff8eb;border:1px solid #fed7aa;border-radius:10px;padding:10px 14px;color:#9a3412;font-size:13px;line-height:1.5;"><i class="fa fa-star" style="color:#ea580c;margin-right:6px;"></i><strong>Key Highlights:</strong> ${univ.highlights}</div>` : ''}
                                    
                                    ${univ.facilities && (Array.isArray(univ.facilities) ? univ.facilities.length > 0 : String(univ.facilities).trim()) ? `
                                        <h5 style="font-size:15px;font-weight:700;color:#0f172a;margin:16px 0 8px;display:flex;align-items:center;gap:6px;"><i class="fa fa-wifi" style="color:#ff6b00;"></i> University Facilities &amp; Amenities:</h5>
                                        <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:12px;">
                                            ${(Array.isArray(univ.facilities) ? univ.facilities : String(univ.facilities).split(',')).map(f => `<span style="background:#f1f5f9;border:1px solid #cbd5e1;padding:4px 10px;border-radius:20px;font-size:12px;font-weight:600;color:#334155;display:inline-flex;align-items:center;gap:5px;"><i class="fa fa-check-circle" style="color:#10b981;"></i>${f.trim()}</span>`).join('')}
                                        </div>
                                    ` : ''}

                                    <h5 style="font-size:15px;font-weight:700;color:#0f172a;margin:18px 0 10px;display:flex;align-items:center;gap:6px;"><i class="fa fa-graduation-cap" style="color:#ff6b00;"></i> Academic Streams Offered:</h5>
                                    <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:12px 14px;display:flex;flex-wrap:wrap;gap:6px;">
                                        ${streamsList.map(s => `<span style="background:#ffffff;border:1px solid #cbd5e1;padding:3px 10px;border-radius:6px;font-size:12.5px;font-weight:600;color:#334155;">${s}</span>`).join('')}
                                    </div>

                                    ${courseList.length > 0 ? `
                                    <h5 style="font-size:15px;font-weight:700;color:#0f172a;margin:16px 0 10px;display:flex;align-items:center;gap:6px;"><i class="fa fa-book" style="color:#ff6b00;"></i> Featured Programs &amp; Degrees:</h5>
                                    <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:12px 14px;display:flex;flex-wrap:wrap;gap:6px;">
                                        ${courseList.map(cr => `<span style="background:#fff0e6;border:1px solid rgba(255,107,0,0.2);color:#ff6b00;padding:3px 10px;border-radius:6px;font-size:12.5px;font-weight:600;"><i class="fa fa-check-circle" style="margin-right:4px;"></i>${cr}</span>`).join('')}
                                    </div>` : ''}

                                    <div style="margin-top:16px;background:#ecfdf3;border:1px solid #bbf7d0;border-radius:12px;padding:12px 16px;color:#15803d;font-size:13px;line-height:1.5;">
                                        <i class="fa fa-certificate" style="color:#16a34a;margin-right:6px;"></i> <strong>Government Approvals:</strong> ${univ.approvals}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer" style="background:#f8fafc;padding:16px 28px;border-top:1px solid #e2e8f0;">
                            <button type="button" class="btn-eg-secondary" data-dismiss="modal" style="min-height:42px;padding:0 18px;">Close</button>
                            <button type="button" class="btn-eg-primary" style="min-height:42px;padding:0 22px;" onclick="window.applyForInstitution('${univ.name.replace(/'/g, "\\'")}', 'University'); $('#univDetailModal').modal('hide');"><i class="fa fa-phone"></i> Request University Admission Counseling</button>
                        </div>
                    </div>
                </div>
            `;
            $('#univDetailModal').modal('show');
            $('#univDetailModal').off('hidden.bs.modal').on('hidden.bs.modal', function() {
                if (window.history && window.history.pushState && window.location.pathname.startsWith('/universities/')) {
                    window.history.pushState({}, 'Universities', '/universities');
                    document.title = 'Top Universities in India | Distance & Online Degrees | EducationistGuru';
                }
            });
        };

        if (!isModernDirectory) {
            render(universities);
        }

        // Auto-hydrate university from URL deep link if /universities/:slug
        if (window.location.pathname.startsWith('/universities/')) {
            const rawSlug = window.location.pathname.replace(/^\/universities\/?/, '').replace(/\/$/, '').trim();
            if (rawSlug) {
                const match = findMatchingUniversity(rawSlug, universities);
                if (match) {
                    setTimeout(() => window.showUnivDetails(match.id, false), 120);
                }
            }
        }
    }

    // Global PopState Listener for Browser Back/Forward navigation
    window.addEventListener('popstate', (e) => {
        if (window.location.pathname === '/colleges' || window.location.pathname === '/colleges/') {
            $('#collegeDetailModal').modal('hide');
        } else if (window.location.pathname.startsWith('/colleges/')) {
            const slug = window.location.pathname.replace(/^\/colleges\/?/, '').replace(/\/$/, '').trim();
            if (typeof window.showCollegeDetails === 'function') window.showCollegeDetails(slug, false);
        }

        if (window.location.pathname === '/universities' || window.location.pathname === '/universities/') {
            $('#univDetailModal').modal('hide');
        } else if (window.location.pathname.startsWith('/universities/')) {
            const slug = window.location.pathname.replace(/^\/universities\/?/, '').replace(/\/$/, '').trim();
            if (typeof window.showUnivDetails === 'function') window.showUnivDetails(slug, false);
        }
    });

    // Helper: connect Apply button to callback modal
    window.applyForInstitution = function(name, type) {
        if (typeof window.openCallbackModal === 'function') {
            window.openCallbackModal({ course: `${type} Admission: ${name}`, source: `${type} Directory` });
        } else {
            const contactTarget = `contact.html?subject=${encodeURIComponent(type + ' Admission: ' + name)}`;
            window.location.href = contactTarget;
        }
    };

    // ================= GLOBAL FOOTER / SIDEBAR RECENT POSTS =================
    async function updateGlobalRecentPosts() {
        const blogs = await window.EG_CMS.getBlogs();
        const recentWidgets = document.querySelectorAll('.recent-post-widget');
        if (recentWidgets.length === 0 || blogs.length === 0) return;

        recentWidgets.forEach(w => {
            let html = '';
            blogs.slice(0, 3).forEach(b => {
                const parts = (b.date || 'July 15').split(' ');
                const day = parts[1] ? parts[1].replace(',', '') : '15';
                const month = parts[0] || 'July';
                html += `
                    <div class="post-item" style="margin-bottom:12px;display:flex;align-items:center;">
                        <div class="post-date" style="margin-right:12px;text-align:center;min-width:42px;background:#f5f5f5;padding:4px 6px;border-radius:4px;">
                            <span style="display:block;font-weight:800;color:#ff3115;font-size:14px;">${day}</span>
                            <span style="display:block;font-size:10px;text-transform:uppercase;color:#666;">${month.slice(0,3)}</span>
                        </div>
                        <div class="post-desc">
                            <h5 class="post-title" style="margin:0;font-size:13px;line-height:1.3;">
                                <a href="blog-details.html?id=${b.id}">${b.title}</a>
                            </h5>
                            <span class="post-category" style="font-size:11px;color:#888;">${b.category}</span>
                        </div>
                    </div>
                `;
            });
            w.innerHTML = html;
        });
    }

    // Auto-init on DOMContentLoaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', hydratePage);
    } else {
        hydratePage();
    }

    // Listen for storage events (updates in /edit immediately reflect in same-browser tabs)
    window.addEventListener('storage', (e) => {
        if (e.key === 'eg_cms_blogs' || e.key === 'eg_cms_courses' || e.key === 'eg_cms_colleges' || e.key === 'eg_cms_universities' || e.key === 'eg_cms_videos') {
            hydratePage();
        }
    });

    // Listen for authoritative server sync events (multi-device live updates)
    window.addEventListener('cms:synced', async () => {
        try {
            await hydratePage();
        } catch (e) {
            console.warn('[EG_CMS] Live re-hydration error:', e);
        }
    });

    // Background periodic sync (every 15s) mirroring CRM architecture
    if (!window._egCmsSyncTimer) {
        window._egCmsSyncTimer = setInterval(() => {
            if (window.EG_CMS && typeof window.EG_CMS.syncWithServer === 'function') {
                window.EG_CMS.syncWithServer().catch(() => {});
            }
        }, 15000);
    }

    // Trigger initial background sync once DOM is ready
    if (window.EG_CMS && typeof window.EG_CMS.syncWithServer === 'function') {
        setTimeout(() => {
            window.EG_CMS.syncWithServer().catch(() => {});
        }, 500);
    }

})();

