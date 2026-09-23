const fs = require('fs');
let html = fs.readFileSync('courses-details.html', 'utf8');

const markerBefore = '    <!-- Main Course Detail Container -->';
const markerAfter = '                                        <li class="cd-curriculum-item">';

const insertion = `    <!-- Main Course Detail Container -->
    <main class="course-detail-page">
        <div class="container">
            
            <!-- Breadcrumbs -->
            <nav aria-label="breadcrumb" style="margin-bottom: 20px;">
                <ol class="breadcrumb" style="background: transparent; padding: 0; font-size: 13.5px; font-weight: 600;">
                    <li class="breadcrumb-item"><a href="index.html" style="color:#ff3115;"><i class="fa fa-home"></i> Home</a></li>
                    <li class="breadcrumb-item"><a href="courses.html" style="color:#ff3115;">Courses</a></li>
                    <li class="breadcrumb-item active text-muted" aria-current="page" id="breadcrumbCourseTitle">Course Details</li>
                </ol>
            </nav>

            <!-- Hero Banner -->
            <div class="cd-hero-banner" id="cdHeroBanner">
                <span class="cd-faculty-pill" id="heroFacultyBadge">
                    <i class="fa fa-graduation-cap"></i> <span id="heroFacultyText">Higher Education Degree</span>
                </span>
                <h1 class="cd-course-title" id="heroCourseTitle">Loading Course Details...</h1>
                
                <!-- Structured Multi-Tag & Category Chips (Point 3, 4, 5) -->
                <div class="cd-chips-row" id="heroChipsRow"></div>

                <div class="cd-hero-meta">
                    <div class="cd-hero-meta-item">
                        <i class="fa fa-clock-o"></i> <span>Duration: <strong id="heroDuration">3 Years</strong></span>
                    </div>
                    <div class="cd-hero-meta-item">
                        <i class="fa fa-graduation-cap"></i> <span>Mode: <strong id="heroMode">Online / Regular</strong></span>
                    </div>
                    <div class="cd-hero-meta-item">
                        <i class="fa fa-shield"></i> <span>Approval: <strong>UGC / AIU / NAAC Approved</strong></span>
                    </div>
                    <div class="cd-hero-meta-item">
                        <i class="fa fa-check-circle" style="color:#10b981;"></i> <span style="color:#10b981;"><strong>Admissions Open 2025-26</strong></span>
                    </div>
                </div>
            </div>

            <!-- Two-Column Content Layout -->
            <div class="row">
                
                <!-- Left Column: Details & Tabs -->
                <div class="col-lg-8">
                    <article class="cd-main-card">
                        
                        <!-- High Quality Course Banner Image -->
                        <div class="cd-image-wrapper">
                            <img id="cdCourseImage" src="images/courses/1.jpg" alt="Course Image" onerror="this.onerror=null;this.src='images/courses/1.jpg';">
                        </div>

                        <div class="cd-content-padding">
                            
                            <!-- Tab Navigation -->
                            <ul class="nav cd-nav-tabs" role="tablist">
                                <li class="nav-item">
                                    <a class="nav-link active" data-toggle="tab" href="#tab-overview">Overview & Highlights</a>
                                </li>
                                <li class="nav-item">
                                    <a class="nav-link" data-toggle="tab" href="#tab-curriculum">Curriculum & Syllabus</a>
                                </li>
                                <li class="nav-item">
                                    <a class="nav-link" data-toggle="tab" href="#tab-eligibility">Eligibility & Roadmap</a>
                                </li>
                                <li class="nav-item">
                                    <a class="nav-link" data-toggle="tab" href="#tab-why-eg">Why EducationistGuru</a>
                                </li>
                            </ul>

                            <!-- Tab Contents -->
                            <div class="tab-content">
                                
                                <!-- Tab 1: Overview (Supports H1-H6 Structured Headings) -->
                                <div class="tab-pane fade show active" id="tab-overview" role="tabpanel">
                                    <div class="cd-body-text" id="cdOverviewText">
                                        This degree program is tailored to equip students with comprehensive theoretical foundations and practical competencies demanded by modern industries. Delivered in collaboration with leading UGC and AIU recognized universities.
                                    </div>

                                    <!-- Specializations / Streams Box -->
                                    <div class="cd-spec-box" id="cdSpecBox">
                                        <h5><i class="fa fa-star"></i> In-Demand Specializations & Tracks</h5>
                                        <div class="cd-spec-tags" id="cdSpecTags">
                                            <!-- Dynamically populated tags -->
                                            <span class="cd-spec-tag">Core Specialization</span>
                                        </div>
                                    </div>

                                    <!-- Campus & Media Gallery (Point 6) -->
                                    <div id="cdGallerySection" style="display:none; margin-top:30px; padding-top:24px; border-top:1px solid #e2e8f0;">
                                        <h4 class="cd-section-heading" style="font-size:19px; display:flex; align-items:center; gap:8px;">
                                            <i class="fa fa-picture-o text-danger"></i> Campus & Academic Media Gallery
                                        </h4>
                                        <div class="cd-gallery-grid" id="cdGalleryGrid"></div>
                                    </div>

                                    <h4 class="cd-section-heading" style="font-size:18px;margin-top:25px;">Key Career Prospects</h4>
                                    <p class="cd-body-text">
                                        Graduates of this program gain qualifications valid for all central, state government, and private corporate recruitments, competitive examinations, and international master's degree pathways.
                                    </p>
                                </div>

                                <!-- Tab 2: Curriculum -->
                                <div class="tab-pane fade" id="tab-curriculum" role="tabpanel">
                                    <h3 class="cd-section-heading">Curriculum & Syllabus Breakdown</h3>
                                    <p class="cd-body-text">
                                        The curriculum adheres strictly to UGC Model Curricula, combining fundamental theory, domain specializations, laboratory simulations, and industry capstone projects:
                                    </p>
                                    <ul class="cd-curriculum-list" id="cdCurriculumList">
`;

if (html.includes(markerBefore) && html.includes(markerAfter)) {
    const idxBefore = html.indexOf(markerBefore);
    const idxAfter = html.indexOf(markerAfter);
    html = html.substring(0, idxBefore) + insertion + html.substring(idxAfter);
    fs.writeFileSync('courses-details.html', html, 'utf8');
    console.log('✅ courses-details.html HTML structure cleanly restored!');
} else {
    console.error('Markers not found!');
}
