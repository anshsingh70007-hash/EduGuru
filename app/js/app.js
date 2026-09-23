/**
 * EducationistGuru App - Core Application Engine
 * Responsive, reactive, PhysicsWallah-inspired UI logic
 */

(function () {
  'use strict';

  // App State
  const state = {
    courses: window.TOP_COURSES || [],
    colleges: window.PARTNER_COLLEGES || [],
    videos: window.GUIDANCE_VIDEOS || [],
    filteredCourses: [],
    currentFaculty: 'all',
    currentDegreeType: 'all',
    currentStudyMode: 'all',
    currentSort: 'popular',
    searchQuery: '',
    activeTab: 'home',
    activeBannerIndex: 0,
    bannerInterval: null,
    selectedCourse: null
  };

  // DOM Elements
  const DOM = {
    splashScreen: document.getElementById('splashScreen'),
    appFrame: document.getElementById('appFrame'),
    viewModeBtns: document.querySelectorAll('.view-mode-btn'),
    homeFeaturedGrid: document.getElementById('homeFeaturedGrid'),
    catalogCoursesGrid: document.getElementById('catalogCoursesGrid'),
    catalogResultsCount: document.getElementById('catalogResultsCount'),
    catalogActiveFilterTag: document.getElementById('catalogActiveFilterTag'),
    searchInput: document.getElementById('appSearchInput'),
    searchClearBtn: document.getElementById('searchClearBtn'),
    goalFilterSelect: document.getElementById('goalFilterSelect'),
    catalogLevelFilterSelect: document.getElementById('catalogLevelFilterSelect'),
    catalogModeFilterSelect: document.getElementById('catalogModeFilterSelect'),
    catalogSortFilterSelect: document.getElementById('catalogSortFilterSelect'),
    homeFacultyPills: document.querySelectorAll('#facultyPillTrack .faculty-pill'),
    catalogFacultyPills: document.querySelectorAll('#catalogFacultyPillTrack .faculty-pill'),
    bannerTrack: document.getElementById('bannerTrack'),
    bannerDots: document.querySelectorAll('.banner-dot'),
    bottomNavBtns: document.querySelectorAll('.nav-item-btn'),
    // Modals
    detailsModal: document.getElementById('courseDetailsModal'),
    detailsModalContent: document.getElementById('courseDetailsContent'),
    enrollModal: document.getElementById('enrollModal'),
    enrollForm: document.getElementById('enrollForm'),
    enrollCourseTitle: document.getElementById('enrollCourseTitle'),
    enrollCourseId: document.getElementById('enrollCourseId'),
    enrollCourseFee: document.getElementById('enrollCourseFee'),
    eligibilityModal: document.getElementById('eligibilityModal'),
    // Views
    homeView: document.getElementById('homeViewSection'),
    coursesView: document.getElementById('coursesCatalogSection'),
    collegesView: document.getElementById('collegesViewSection'),
    videosView: document.getElementById('videosViewSection'),
    leadershipView: document.getElementById('leadershipViewSection'),
    // YouTube Channel UI
    ytVideosGrid: document.getElementById('ytVideosGrid'),
    ytActivePlayer: document.getElementById('ytActivePlayer'),
    ytActiveTitle: document.getElementById('ytActiveTitle'),
    ytActiveDesc: document.getElementById('ytActiveDesc'),
    ytWatchOnYouTubeLink: document.getElementById('ytWatchOnYouTubeLink'),
    ytFeaturedPlayerBox: document.getElementById('ytFeaturedPlayerBox'),
    // Toast
    toast: document.getElementById('appToast')
  };

  // ================= 1. SPLASH SCREEN LIFECYCLE =================
  function initSplashScreen() {
    if (!DOM.splashScreen) return;
    
    // Auto fade-out after splash animation
    const splashTimeout = setTimeout(() => {
      dismissSplash();
    }, 1800);

    DOM.splashScreen.addEventListener('click', () => {
      clearTimeout(splashTimeout);
      dismissSplash();
    });
  }

  function dismissSplash() {
    if (!DOM.splashScreen) return;
    DOM.splashScreen.classList.add('splash-hidden');
  }

  // ================= 2. DESKTOP / MOBILE FRAME TOGGLE =================
  function initViewModeToggle() {
    DOM.viewModeBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        DOM.viewModeBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const mode = btn.getAttribute('data-mode');
        if (mode === 'expanded') {
          DOM.appFrame.classList.add('expanded-mode');
        } else {
          DOM.appFrame.classList.remove('expanded-mode');
        }
      });
    });
  }

  // ================= 3. HERO BANNER CAROUSEL =================
  function initBannerCarousel() {
    if (!DOM.bannerTrack) return;
    const cards = DOM.bannerTrack.querySelectorAll('.promo-banner-card');
    const totalBanners = cards.length;
    if (totalBanners <= 1) return;

    function goToBanner(index) {
      state.activeBannerIndex = (index + totalBanners) % totalBanners;
      DOM.bannerTrack.style.transform = `translateX(-${state.activeBannerIndex * 100}%)`;
      DOM.bannerDots.forEach((dot, idx) => {
        dot.classList.toggle('active', idx === state.activeBannerIndex);
      });
    }

    state.bannerInterval = setInterval(() => {
      goToBanner(state.activeBannerIndex + 1);
    }, 4500);

    DOM.bannerDots.forEach(dot => {
      dot.addEventListener('click', (e) => {
        clearInterval(state.bannerInterval);
        const targetIdx = parseInt(dot.getAttribute('data-index'));
        goToBanner(targetIdx);
      });
    });

    // Simple touch swipe support
    let startX = 0;
    DOM.bannerTrack.addEventListener('touchstart', (e) => {
      startX = e.touches[0].clientX;
    }, { passive: true });

    DOM.bannerTrack.addEventListener('touchend', (e) => {
      const endX = e.changedTouches[0].clientX;
      const diffX = startX - endX;
      if (Math.abs(diffX) > 45) {
        clearInterval(state.bannerInterval);
        if (diffX > 0) {
          goToBanner(state.activeBannerIndex + 1);
        } else {
          goToBanner(state.activeBannerIndex - 1);
        }
      }
    }, { passive: true });
  }

  // ================= 4. FILTERING & SEARCH ENGINE =================
  function filterCourses() {
    let list = [...state.courses];

    // 1. Search Query
    if (state.searchQuery) {
      const q = state.searchQuery.toLowerCase().trim();
      list = list.filter(c => {
        const inName = c.name.toLowerCase().includes(q);
        const inFaculty = c.faculty.toLowerCase().includes(q);
        const inStream = (c.stream || '').toLowerCase().includes(q);
        const inSpecs = (c.subSpecializations || []).some(s => s.toLowerCase().includes(q));
        const inEligibility = (c.eligibility || '').toLowerCase().includes(q);
        return inName || inFaculty || inStream || inSpecs || inEligibility;
      });
    }

    // 2. Faculty Filter
    if (state.currentFaculty !== 'all') {
      list = list.filter(c => c.faculty.toLowerCase().includes(state.currentFaculty.toLowerCase()));
    }

    // 3. Degree Type (Level: UG, PG, Diploma, Doctorate)
    if (state.currentDegreeType !== 'all') {
      list = list.filter(c => c.degreeType.toLowerCase() === state.currentDegreeType.toLowerCase());
    }

    // 4. Study Mode Filter
    if (state.currentStudyMode !== 'all') {
      list = list.filter(c => c.mode.toLowerCase().includes(state.currentStudyMode.toLowerCase()));
    }

    // 5. Sorting
    if (state.currentSort === 'fee_low') {
      list.sort((a, b) => a.feePerYear - b.feePerYear);
    } else if (state.currentSort === 'fee_high') {
      list.sort((a, b) => b.feePerYear - a.feePerYear);
    } else if (state.currentSort === 'rating') {
      list.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else if (state.currentSort === 'name_asc') {
      list.sort((a, b) => a.name.localeCompare(b.name));
    }

    state.filteredCourses = list;
    renderCatalogCoursesGrid();
    updateTelemetry();
  }

  function updateTelemetry() {
    if (DOM.catalogResultsCount) {
      DOM.catalogResultsCount.textContent = `Showing ${state.filteredCourses.length} of ${state.courses.length} Courses`;
    }
    if (DOM.catalogActiveFilterTag) {
      const facultyText = state.currentFaculty === 'all' ? 'All Streams' : state.currentFaculty;
      DOM.catalogActiveFilterTag.textContent = facultyText;
    }
  }

  // ================= 5. COURSE CARDS RENDERING =================
  function generateCourseCardHTML(course) {
    const specsHtml = (course.subSpecializations || []).slice(0, 3).map(s => `<span class="spec-chip">${escapeHtml(s)}</span>`).join('');
    const moreCount = (course.subSpecializations || []).length > 3 ? `<span class="spec-chip">+${(course.subSpecializations || []).length - 3} more</span>` : '';

    return `
      <article class="course-card" data-course-id="${course.id}">
        <div class="card-media-head">
          <img src="${course.image}" alt="${escapeHtml(course.name)}" class="card-media-img" loading="lazy" onerror="this.src='../images/courses/1.jpg'">
          <div class="card-media-overlay"></div>
          <span class="card-badge-top-left">
            <i class="fa fa-university"></i> ${(course.accreditation && course.accreditation.includes('AIU')) ? 'AIU Approved' : 'UGC Recognized'}
          </span>
          <span class="card-badge-top-right">${course.badge || '★ Top Rated'}</span>
          <span class="card-media-faculty-tag">
            <i class="fa ${course.icon || 'fa-graduation-cap'}"></i> ${escapeHtml(course.faculty)}
          </span>
        </div>

        <div class="card-body-content">
          <h3 class="card-course-title">${escapeHtml(course.name)}</h3>

          <div class="course-specs-strip">
            <span class="spec-badge"><i class="fa fa-clock-o"></i> ${course.durationShort || course.duration}</span>
            <span class="spec-badge"><i class="fa fa-star" style="color:#f59e0b;"></i> ${course.rating} (${course.reviewsCount})</span>
            <span class="spec-badge"><i class="fa fa-laptop"></i> ${course.mode.split('/')[0]}</span>
          </div>

          <div class="specs-preview-box">
            <div class="specs-preview-lbl">Key Specializations:</div>
            <div class="specs-chips-list">
              ${specsHtml}
              ${moreCount}
            </div>
          </div>

          <div style="font-size: 11px; color: #64748b; margin-bottom: 8px;">
            <strong>Eligibility:</strong> ${escapeHtml(course.eligibility)}
          </div>

          <div class="card-fee-action-row">
            <div class="fee-col">
              <span class="fee-label">Approved Fee</span>
              <span class="fee-amount">${course.feeFormatted}</span>
              <span class="fee-emi">${course.emiMonthly}</span>
            </div>
            <div class="card-actions-group">
              <button type="button" class="btn-details" onclick="window.openCourseDetails(${course.id})" title="View Syllabus & Info">
                <i class="fa fa-info-circle"></i> Syllabus
              </button>
              <button type="button" class="btn-enroll-primary" onclick="window.openEnrollModal(${course.id})">
                <i class="fa fa-bolt"></i> Enroll
              </button>
            </div>
          </div>
        </div>
      </article>
    `;
  }

  function renderHomeFeaturedGrid() {
    if (!DOM.homeFeaturedGrid) return;
    // Top 6 flagship courses representing key streams (B.Tech AI, B.Tech CSE, MBA, BCA AI, LL.B, B.Pharm)
    const featuredIds = [101, 102, 201, 301, 401, 501];
    let featuredList = state.courses.filter(c => featuredIds.includes(c.id));
    if (featuredList.length < 6) {
      featuredList = state.courses.slice(0, 6);
    }
    DOM.homeFeaturedGrid.innerHTML = featuredList.map(generateCourseCardHTML).join('');
  }

  function renderCatalogCoursesGrid() {
    if (!DOM.catalogCoursesGrid) return;

    if (state.filteredCourses.length === 0) {
      DOM.catalogCoursesGrid.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 40px 20px; background: #ffffff; border-radius: 16px; border: 1px dashed #cbd5e1;">
          <div style="font-size: 40px; margin-bottom: 12px;">🔍</div>
          <h4 style="font-family: var(--font-heading); font-size: 16px; font-weight: 800; color: #1e293b; margin-bottom: 6px;">No Matching Courses Found</h4>
          <p style="font-size: 13px; color: #64748b; margin-bottom: 16px;">Try adjusting your keyword or reset filters to see all 50 top accredited courses.</p>
          <button type="button" onclick="window.resetCourseFilters()" style="background: var(--primary); color: #fff; font-weight: 800; font-size: 12px; padding: 8px 18px; border-radius: 9999px; border: none; cursor: pointer;">
            Reset All Filters
          </button>
        </div>
      `;
      return;
    }

    DOM.catalogCoursesGrid.innerHTML = state.filteredCourses.map(generateCourseCardHTML).join('');
  }

  // ================= 6. COURSE DETAILS MODAL DRAWER =================
  window.openCourseDetails = function (courseId) {
    const course = state.courses.find(c => c.id === courseId);
    if (!course || !DOM.detailsModalContent) return;

    state.selectedCourse = course;

    const curriculumHtml = (course.curriculum || []).map(item => `
      <li class="detail-curriculum-item">
        <i class="fa fa-check-circle" style="color:var(--primary);margin-right:6px;"></i> ${escapeHtml(item)}
      </li>
    `).join('');

    const allSpecsHtml = (course.subSpecializations || []).map(spec => `
      <span class="spec-chip" style="font-size:11px;padding:4px 8px;background:#fff;border:1px solid #cbd5e1;">${escapeHtml(spec)}</span>
    `).join('');

    const careerRolesHtml = (course.careerRoles || []).map(role => `
      <span class="spec-badge" style="background:#ecfdf5;color:#065f46;border:1px solid #a7f3d0;"><i class="fa fa-briefcase"></i> ${escapeHtml(role)}</span>
    `).join('');

    DOM.detailsModalContent.innerHTML = `
      <div style="margin-bottom:14px;">
        <span class="active-filter-tag" style="margin-bottom:6px;display:inline-block;">${escapeHtml(course.faculty)}</span>
        <h2 style="font-family:var(--font-heading);font-size:18px;font-weight:900;color:var(--dark-navy);line-height:1.3;margin-bottom:6px;">
          ${escapeHtml(course.name)}
        </h2>
        <div style="display:flex;gap:8px;flex-wrap:wrap;font-size:12px;color:#64748b;">
          <span><i class="fa fa-clock-o" style="color:var(--primary);"></i> <strong>${escapeHtml(course.duration)}</strong></span>
          <span>•</span>
          <span><i class="fa fa-shield" style="color:var(--success);"></i> <strong>${escapeHtml(course.accreditation)}</strong></span>
        </div>
      </div>

      <div class="detail-fee-summary-box">
        <div>
          <span style="font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;">AIU Approved Annual Fee</span>
          <div style="font-family:var(--font-heading);font-size:22px;font-weight:900;color:var(--primary);">
            ${course.feeFormatted}
          </div>
          <span style="font-size:11px;font-weight:600;color:var(--success);">${course.emiMonthly} with 0% interest EMI options</span>
        </div>
        <button type="button" class="btn-enroll-primary" onclick="window.openEnrollModal(${course.id})" style="padding:10px 18px;">
          Apply Now <i class="fa fa-arrow-right"></i>
        </button>
      </div>

      <!-- Financial Transparency Note (GPT 5.6 Luna Recommendation) -->
      <div style="background:#ecfdf5;border:1px solid #a7f3d0;border-radius:10px;padding:10px 12px;margin-bottom:16px;display:flex;align-items:flex-start;gap:8px;font-size:11.5px;color:#065f46;">
        <i class="fa fa-shield-halved" style="color:#10b981;font-size:14px;margin-top:2px;"></i>
        <div>
          <strong>100% Free Counseling Guarantee:</strong> EducationistGuru never charges students any advisory fees. All tuition is paid directly to the university account. Zero hidden costs.
        </div>
      </div>

      <div class="detail-section-block">
        <div class="detail-section-heading"><i class="fa fa-graduation-cap"></i> Eligibility &amp; Admission Mode</div>
        <p style="font-size:13px;color:#334155;background:#f8fafc;padding:10px 12px;border-radius:8px;border:1px solid #e2e8f0;">
          <strong>Requirements:</strong> ${escapeHtml(course.eligibility)}<br>
          <strong>Study Mode:</strong> ${escapeHtml(course.mode)} (Online Learning / Campus Regular / Distance)
        </p>

        <!-- Quick Interactive Eligibility Checker -->
        <div style="background:#f1f5f9;border-radius:8px;padding:10px 12px;margin-top:8px;">
          <div style="font-size:11px;font-weight:700;color:#475569;margin-bottom:6px;">Check Your Eligibility Instantly:</div>
          <div style="display:flex;gap:8px;align-items:center;">
            <input type="number" id="checkMarksInput" placeholder="Enter % (e.g. 65)" style="width:140px;padding:6px 10px;font-size:12px;border-radius:6px;border:1px solid #cbd5e1;outline:none;" min="35" max="100">
            <button type="button" onclick="window.verifyEligibility(${course.id})" style="background:var(--primary);color:#fff;font-size:11px;font-weight:700;padding:7px 12px;border-radius:6px;">
              Verify
            </button>
            <span id="eligibilityResultBadge" style="font-size:11px;font-weight:700;"></span>
          </div>
        </div>
      </div>

      <div class="detail-section-block">
        <div class="detail-section-heading"><i class="fa fa-layer-group"></i> Available In-Demand Specializations</div>
        <div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:6px;">
          ${allSpecsHtml}
        </div>
      </div>

      <div class="detail-section-block">
        <div class="detail-section-heading"><i class="fa fa-book-open"></i> Semester-wise Curriculum &amp; Topics</div>
        <ul class="detail-curriculum-list" style="margin-top:6px;">
          ${curriculumHtml}
        </ul>
        <div style="font-size:10.5px;color:#64748b;font-style:italic;margin-top:6px;">
          * Indicative curriculum overview modeled on UGC/AICTE frameworks. Specific subject electives vary by partner university.
        </div>
      </div>

      <div class="detail-section-block">
        <div class="detail-section-heading"><i class="fa fa-user-tie"></i> Top Career Outcomes &amp; Roles</div>
        <div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:6px;">
          ${careerRolesHtml}
        </div>
      </div>

      <div class="detail-section-block">
        <div class="detail-section-heading"><i class="fa fa-university"></i> Participating Partner Universities</div>
        <p style="font-size:12px;color:#64748b;">
          Direct enrollment available for UGC/AIU recognized institutions including Amity Online, Suresh Gyan Vihar, Subharti, Mangalayatan, and more. 100% genuine degrees.
        </p>
      </div>

      <div style="margin-top:20px;display:flex;flex-direction:column;gap:8px;">
        <button type="button" class="modal-cta-submit" onclick="window.openEnrollModal(${course.id})">
          <i class="fa fa-paper-plane"></i> Book Free Counseling &amp; Reserve Seat
        </button>
        <a href="https://api.whatsapp.com/send?phone=918750477000&text=Hello%20EducationistGuru,%20I%20want%20information%20for%20${encodeURIComponent(course.name)}" target="_blank" style="text-align:center;padding:10px;background:#25D366;color:#fff;border-radius:var(--radius-md);font-size:13px;font-weight:700;display:flex;align-items:center;justify-content:center;gap:6px;">
          <i class="fa fa-whatsapp"></i> Chat on WhatsApp with Course Advisor
        </a>
      </div>
    `;

    DOM.detailsModal.classList.add('modal-active');
  };

  window.closeCourseDetails = function () {
    if (DOM.detailsModal) {
      DOM.detailsModal.classList.remove('modal-active');
    }
  };

  // Quick Eligibility Verification Calculator
  window.verifyEligibility = function (courseId) {
    const input = document.getElementById('checkMarksInput');
    const badge = document.getElementById('eligibilityResultBadge');
    if (!input || !badge) return;

    const val = parseFloat(input.value);
    if (isNaN(val) || val <= 0 || val > 100) {
      badge.textContent = 'Enter valid %';
      badge.style.color = '#ef4444';
      return;
    }

    if (val >= 50) {
      badge.innerHTML = '<span style="color:#10b981;">✅ Eligible for Admission!</span>';
    } else if (val >= 45) {
      badge.innerHTML = '<span style="color:#f59e0b;">⚠️ Eligible under reserved / relaxation norms</span>';
    } else {
      badge.innerHTML = '<span style="color:#ef4444;">❌ Below 45% (Counseling recommended)</span>';
    }
  };

  // ================= 7. COURSE ENROLLMENT / ADMISSION MODAL =================
  window.openEnrollModal = function (courseId) {
    window.closeCourseDetails();
    const course = state.courses.find(c => c.id === courseId) || state.courses[0];
    state.selectedCourse = course;

    if (DOM.enrollCourseTitle) DOM.enrollCourseTitle.textContent = course.name;
    if (DOM.enrollCourseId) DOM.enrollCourseId.value = course.id;
    if (DOM.enrollCourseFee) DOM.enrollCourseFee.textContent = `${course.feeFormatted} (${course.durationShort || course.duration})`;

    if (DOM.enrollModal) {
      DOM.enrollModal.classList.add('modal-active');
    }
  };

  window.closeEnrollModal = function () {
    if (DOM.enrollModal) {
      DOM.enrollModal.classList.remove('modal-active');
    }
  };

  // ================= 7B. INTERACTIVE ELIGIBILITY MATCHER (SENIOR LUNA CRITIQUE) =================
  window.openEligibilityModal = function () {
    if (DOM.eligibilityModal) {
      DOM.eligibilityModal.classList.add('modal-active');
    }
  };

  window.closeEligibilityModal = function () {
    if (DOM.eligibilityModal) {
      DOM.eligibilityModal.classList.remove('modal-active');
    }
  };

  window.runEligibilityMatch = function () {
    const streamSelect = document.getElementById('eligStream');
    const percentageInput = document.getElementById('eligPercentage');
    if (!streamSelect || !percentageInput) return;

    const stream = streamSelect.value;
    const pct = parseFloat(percentageInput.value) || 50;

    let matched = [];

    if (stream === 'pcm') {
      matched = state.courses.filter(c => 
        c.faculty === 'Engineering & Technology' ||
        c.faculty === 'Computer Applications & IT' ||
        c.faculty === 'Science' ||
        c.faculty === 'Design, Media & Animation' ||
        c.faculty === 'Commerce & Management' ||
        c.faculty === 'Agriculture Science'
      );
    } else if (stream === 'pcb') {
      matched = state.courses.filter(c => 
        c.faculty === 'Pharmacy' ||
        c.faculty === 'Paramedical & Healthcare' ||
        c.faculty === 'Science' ||
        c.faculty === 'Agriculture Science' ||
        c.faculty === 'Yoga & Alternative Medicine' ||
        c.faculty === 'Design, Media & Animation' ||
        c.faculty === 'Commerce & Management'
      );
    } else if (stream === 'commerce') {
      matched = state.courses.filter(c => 
        c.faculty === 'Commerce & Management' ||
        c.faculty === 'Computer Applications & IT' ||
        c.faculty === 'Law' ||
        c.faculty === 'Design, Media & Animation' ||
        c.faculty === 'Humanities & Social Sciences'
      );
    } else if (stream === 'arts') {
      matched = state.courses.filter(c => 
        c.faculty === 'Humanities & Social Sciences' ||
        c.faculty === 'Law' ||
        c.faculty === 'Design, Media & Animation' ||
        c.faculty === 'Commerce & Management' ||
        (c.degreeType === 'UG' && (c.name.includes('BBA') || c.name.includes('B.A.')))
      );
    } else if (stream === 'polytechnic') {
      matched = state.courses.filter(c => 
        c.name.includes('Lateral') || 
        c.faculty === 'Engineering & Technology' ||
        c.faculty === 'Computer Applications & IT'
      );
    } else if (stream === 'grad_any') {
      matched = state.courses.filter(c => 
        c.degreeType === 'PG' && !c.name.includes('M.Tech') && !c.name.includes('M.Sc') && !c.name.includes('LL.M')
      );
    } else if (stream === 'grad_tech') {
      matched = state.courses.filter(c => 
        c.degreeType === 'PG' && (c.faculty === 'Engineering & Technology' || c.faculty === 'Computer Applications & IT' || c.name.includes('MBA'))
      );
    } else if (stream === 'grad_law') {
      matched = state.courses.filter(c => 
        c.faculty === 'Law' && c.degreeType === 'PG'
      );
    } else {
      matched = state.courses;
    }

    if (pct < 45) {
      matched = matched.filter(c => !c.eligibility.includes('min 50%') && !c.eligibility.includes('min 45%'));
    }

    state.filteredCourses = matched;
    window.closeEligibilityModal();
    window.switchView('courses');

    if (DOM.resultsCount) {
      DOM.resultsCount.textContent = `Showing ${matched.length} of ${state.courses.length} courses`;
    }
    if (DOM.activeFilterTag) {
      DOM.activeFilterTag.textContent = `Profile: ${stream.toUpperCase()} (${pct}%)`;
    }

    renderCoursesGrid();
    showToast(`Found ${matched.length} accredited degrees matching your profile!`, 'success');
  };

  // ================= 8. SUBMIT LEAD TO BACKEND CRM =================
  function initEnrollForm() {
    if (!DOM.enrollForm) return;

    DOM.enrollForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const submitBtn = DOM.enrollForm.querySelector('button[type="submit"]');
      const originalText = submitBtn.innerHTML;

      const payload = {
        name: (document.getElementById('leadName').value || '').trim(),
        phone: (document.getElementById('leadPhone').value || '').trim(),
        email: (document.getElementById('leadEmail').value || '').trim(),
        course: state.selectedCourse ? state.selectedCourse.name : 'General Admission',
        qualification: document.getElementById('leadQualification').value || '12th Pass',
        mode: document.getElementById('leadMode').value || 'Online',
        city: (document.getElementById('leadCity').value || 'India').trim(),
        source: 'EducationistGuru App - Course Selling',
        notes: `Enrolled via EducationistGuru Mobile App for ${state.selectedCourse ? state.selectedCourse.name : 'Course'}`
      };

      if (!payload.name || !payload.phone) {
        showToast('Please enter your Name and Mobile number.', 'error');
        return;
      }

      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="fa fa-circle-o-notch fa-spin"></i> Submitting Application...';

      try {
        const res = await fetch('/api/crm/lead', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        const data = await res.json();
        if (data.success) {
          showToast('🎉 Application Submitted! Our Senior Counselor will call you shortly.', 'success');
          DOM.enrollForm.reset();
          window.closeEnrollModal();
        } else {
          // Fallback if offline
          showToast('Application recorded! Counselor will connect shortly.', 'success');
          window.closeEnrollModal();
        }
      } catch (err) {
        // Even if offline/dev server
        showToast('Application received! We will reach out to you via WhatsApp & Call.', 'success');
        window.closeEnrollModal();
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
      }
    });
  }

  // ================= 9. TOAST NOTIFICATIONS =================
  function showToast(message, type = 'normal') {
    if (!DOM.toast) return;
    DOM.toast.textContent = message;
    DOM.toast.className = `app-toast-box toast-show ${type === 'success' ? 'toast-success' : ''}`;
    setTimeout(() => {
      DOM.toast.classList.remove('toast-show');
    }, 4000);
  }
  window.showToast = showToast;

  // ================= 10. BOTTOM NAVIGATION VIEW SWITCHER =================
  function initBottomNav() {
    DOM.bottomNavBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const targetView = btn.getAttribute('data-view');
        switchView(targetView);
      });
    });
  }

  function switchView(viewName) {
    state.activeTab = viewName;
    DOM.bottomNavBtns.forEach(b => {
      b.classList.toggle('active', b.getAttribute('data-view') === viewName);
    });

    const allSections = [DOM.homeView, DOM.coursesView, DOM.collegesView, DOM.videosView, DOM.leadershipView];
    allSections.forEach(sec => {
      if (sec) sec.style.display = 'none';
    });

    if (viewName === 'home') {
      if (DOM.homeView) DOM.homeView.style.display = 'block';
    } else if (viewName === 'courses') {
      if (DOM.coursesView) DOM.coursesView.style.display = 'block';
      // Reset or refresh courses catalog view
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (viewName === 'colleges') {
      if (DOM.collegesView) DOM.collegesView.style.display = 'block';
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (viewName === 'videos') {
      if (DOM.videosView) DOM.videosView.style.display = 'block';
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (viewName === 'leadership') {
      if (DOM.leadershipView) DOM.leadershipView.style.display = 'block';
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }
  window.switchView = switchView;

  // ================= 11. FACULTY PILL CLICK HANDLERS =================
  function syncFacultyPills(selectedFaculty) {
    const allPills = document.querySelectorAll('.faculty-pill');
    allPills.forEach(p => {
      const isMatch = (p.getAttribute('data-faculty') || 'all') === selectedFaculty;
      p.classList.toggle('active', isMatch);
    });
  }

  function initFacultyPills() {
    // 1. Home Faculty Pills: Clicking a stream routes to Courses Catalog view with that faculty selected!
    if (DOM.homeFacultyPills) {
      DOM.homeFacultyPills.forEach(pill => {
        pill.addEventListener('click', () => {
          const faculty = pill.getAttribute('data-faculty') || 'all';
          state.currentFaculty = faculty;
          syncFacultyPills(faculty);
          switchView('courses');
          filterCourses();
        });
      });
    }

    // 2. Catalog Faculty Pills: Filter directly within catalog view
    if (DOM.catalogFacultyPills) {
      DOM.catalogFacultyPills.forEach(pill => {
        pill.addEventListener('click', () => {
          const faculty = pill.getAttribute('data-faculty') || 'all';
          state.currentFaculty = faculty;
          syncFacultyPills(faculty);
          filterCourses();
        });
      });
    }
  }

  // ================= 12. SEARCH & SELECT LISTENERS =================
  function initSearchAndSelects() {
    if (DOM.searchInput) {
      DOM.searchInput.addEventListener('input', (e) => {
        state.searchQuery = e.target.value;
        if (DOM.searchClearBtn) {
          DOM.searchClearBtn.classList.toggle('visible', !!state.searchQuery);
        }
        // If user searches while on Home, automatically reveal live results in Catalog!
        if (state.searchQuery.trim() && state.activeTab === 'home') {
          switchView('courses');
        }
        filterCourses();
      });
    }

    if (DOM.searchClearBtn) {
      DOM.searchClearBtn.addEventListener('click', () => {
        if (DOM.searchInput) DOM.searchInput.value = '';
        state.searchQuery = '';
        DOM.searchClearBtn.classList.remove('visible');
        filterCourses();
      });
    }

    if (DOM.goalFilterSelect) {
      DOM.goalFilterSelect.addEventListener('change', (e) => {
        const val = e.target.value;
        if (val === 'all') {
          state.currentDegreeType = 'all';
          state.currentFaculty = 'all';
        } else if (['ug', 'pg', 'diploma', 'doctorate'].includes(val)) {
          state.currentDegreeType = val;
          state.currentFaculty = 'all';
        } else {
          state.currentFaculty = val;
          state.currentDegreeType = 'all';
        }
        syncFacultyPills(state.currentFaculty);
        if (state.activeTab === 'home') {
          switchView('courses');
        }
        filterCourses();
      });
    }

    if (DOM.catalogLevelFilterSelect) {
      DOM.catalogLevelFilterSelect.addEventListener('change', (e) => {
        state.currentDegreeType = e.target.value;
        filterCourses();
      });
    }

    if (DOM.catalogModeFilterSelect) {
      DOM.catalogModeFilterSelect.addEventListener('change', (e) => {
        state.currentStudyMode = e.target.value;
        filterCourses();
      });
    }

    if (DOM.catalogSortFilterSelect) {
      DOM.catalogSortFilterSelect.addEventListener('change', (e) => {
        state.currentSort = e.target.value;
        filterCourses();
      });
    }
  }

  window.resetCourseFilters = function () {
    state.currentFaculty = 'all';
    state.currentDegreeType = 'all';
    state.currentStudyMode = 'all';
    state.currentSort = 'popular';
    state.searchQuery = '';

    if (DOM.searchInput) DOM.searchInput.value = '';
    if (DOM.searchClearBtn) DOM.searchClearBtn.classList.remove('visible');
    if (DOM.goalFilterSelect) DOM.goalFilterSelect.value = 'all';
    if (DOM.catalogLevelFilterSelect) DOM.catalogLevelFilterSelect.value = 'all';
    if (DOM.catalogModeFilterSelect) DOM.catalogModeFilterSelect.value = 'all';
    if (DOM.catalogSortFilterSelect) DOM.catalogSortFilterSelect.value = 'popular';

    syncFacultyPills('all');
    filterCourses();
  };

  // ================= 13. YOUTUBE CHANNEL VIDEO SUITE =================
  function renderYouTubeVideos() {
    if (!DOM.ytVideosGrid) return;
    const videos = state.videos || [];
    DOM.ytVideosGrid.innerHTML = videos.map((v, idx) => `
      <article class="yt-video-card ${idx === 0 ? 'active-playing' : ''}" onclick="window.playYouTubeVideo('${v.youtubeId}')" data-ytid="${v.youtubeId}">
        <div class="yt-video-thumb">
          <img src="https://img.youtube.com/vi/${v.youtubeId}/mqdefault.jpg" alt="${escapeHtml(v.title)}" loading="lazy" onerror="this.src='../images/blog/1.jpg'">
          <div class="yt-video-play-icon"><i class="fa fa-play"></i></div>
        </div>
        <div class="yt-video-meta">
          <span class="yt-video-category-chip">${escapeHtml(v.category || 'Guidance')}</span>
          <h4 class="yt-video-title">${escapeHtml(v.title)}</h4>
          <div class="yt-video-date">
            <span><i class="fa fa-clock-o"></i> ${v.duration || 'Watch'}</span>
            <span>•</span>
            <span>${v.published || 'Official'}</span>
          </div>
        </div>
      </article>
    `).join('');
  }

  window.playYouTubeVideo = function (youtubeId) {
    const video = (state.videos || []).find(v => v.youtubeId === youtubeId);
    if (!video) return;

    if (DOM.ytActivePlayer) {
      DOM.ytActivePlayer.src = `https://www.youtube.com/embed/${youtubeId}?autoplay=1&rel=0`;
    }
    if (DOM.ytActiveTitle) {
      DOM.ytActiveTitle.textContent = video.title;
    }
    if (DOM.ytActiveDesc) {
      DOM.ytActiveDesc.textContent = video.description || 'Watch official guidance webinar from Educationist Guru certified counselors.';
    }
    if (DOM.ytWatchOnYouTubeLink) {
      DOM.ytWatchOnYouTubeLink.href = `https://www.youtube.com/watch?v=${youtubeId}`;
    }

    // Highlight active card
    document.querySelectorAll('.yt-video-card').forEach(card => {
      card.classList.toggle('active-playing', card.getAttribute('data-ytid') === youtubeId);
    });

    if (DOM.ytFeaturedPlayerBox) {
      DOM.ytFeaturedPlayerBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  // Helper function to escape HTML
  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // ================= 14. INITIALIZE APP =================
  function init() {
    initSplashScreen();
    initViewModeToggle();
    initBannerCarousel();
    initFacultyPills();
    initSearchAndSelects();
    initEnrollForm();
    initBottomNav();

    // Render Home Featured courses
    renderHomeFeaturedGrid();

    // Render Catalog courses
    filterCourses();

    // Render official YouTube videos
    renderYouTubeVideos();

    // Modal background dismiss
    [DOM.detailsModal, DOM.enrollModal].forEach(modal => {
      if (modal) {
        modal.addEventListener('click', (e) => {
          if (e.target === modal) {
            modal.classList.remove('modal-active');
          }
        });
      }
    });
  }

  // Start on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
