const fs = require('fs');
const path = 'data/courses.json';

const courses = JSON.parse(fs.readFileSync(path, 'utf8'));
const idx = courses.findIndex(c => c.id === 107 || c.id === '107');

const overviewContent = `<h1 class="overview-h1">MBA in Financial Management &amp; Project Management from Subharti University Meerut</h1>
<p>The Master of Business Administration (MBA) with dual specialization in <strong>Financial Management and Project Management</strong> from Swami Vivekanand Subharti University (SVSU Meerut) is designed to provide comprehensive managerial knowledge, capital analytics skills, and project lifecycle leadership.</p>

<h2 class="overview-h2">Program Highlights &amp; Dual Specialization Advantage</h2>
<p>This dual degree equips working professionals and aspiring leaders with competitive acumen across corporate finance, investment banking, capital budgeting, and agile project delivery frameworks.</p>
<ul>
  <li>UGC-DEB recognized degree valid across private, public, and international sectors.</li>
  <li>Comprehensive curriculum covering financial risk models, capital planning, and project procurement.</li>
  <li>Flexible weekend e-learning portals, digital study materials, and faculty mentor support.</li>
  <li>Industry capstone dissertations aligned with PMP standards and global financial guidelines.</li>
</ul>

<h3 class="overview-h3">Core Focus Area 1: Financial Management</h3>
<p>Candidates master strategic financial decision-making, corporate taxation, portfolio analytics, mergers &amp; acquisitions, and international financial markets.</p>

<h3 class="overview-h3">Core Focus Area 2: Project Management</h3>
<p>Covers project formulation, agile methodologies, PERT/CPM scheduling, procurement management, and stakeholder risk mitigation throughout complex project lifecycles.</p>

<h4 class="overview-h4">Accreditation &amp; University Approvals</h4>
<p>Swami Vivekanand Subharti University is a premier university established under the Subharti University Act and recognized by UGC, AICTE, AIU, NAAC, and the Distance Education Bureau (DEB).</p>

<div class="lead-inquiry-box">
  <h4><i class="fa fa-graduation-cap"></i> Need Direct Admission Guidance for Subharti University?</h4>
  <p>Our authorized counselors provide 100% free enrollment guidance, semester fee installment assistance, and curriculum breakdown.</p>
  <a href="contact.html" class="btn btn-sm btn-primary">Request Free Counseling</a>
</div>

<h5 class="overview-h5">Eligibility &amp; Admission Guidelines</h5>
<p>Candidates must possess a Bachelor's Degree in any discipline from a recognized university with a minimum aggregate of 45%-50%. Working executives receive special timetable allowances.</p>

<h6 class="overview-h6">Career Scope &amp; Corporate Recruiters</h6>
<p>Graduates secure positions as Senior Financial Analysts, Portfolio Managers, Agile Project Leads, Operations Controllers, and Capital Planning Consultants.</p>`;

const updatedRecord = {
  id: 107,
  name: "MBA in Financial Management & Project Management",
  slug: "m-b-a-in-financial-management-project-management-from-subharti-university",
  faculty: "Faculty of Commerce & Management",
  duration: "2 Years (4 Semesters)",
  eligibility: "Graduation in any discipline (min 45% - 50%) from recognized university",
  mode: "Distance / Online (UGC-DEB Approved)",
  fee: "₹32,000 / year",
  image: "images/courses/3.jpg",
  metaDescription: "Admissions Open for MBA in Financial Management & Project Management from Swami Vivekanand Subharti University Meerut. UGC-DEB approved distance degree program with syllabus, eligibility & fee structure.",
  tags: ["Subharti University", "Distance MBA", "UGC-DEB Approved", "Dual Specialization", "Project Management", "Financial Management"],
  categories: ["Faculty of Commerce & Management", "Post Graduate Programs", "Distance Education"],
  keywords: ["MBA Subharti University", "MBA Financial Management", "Distance MBA Admission", "Project Management MBA Course", "Subharti University Meerut MBA"],
  galleryImages: ["images/courses/3.jpg", "images/courses/1.jpg", "images/courses/2.jpg", "images/courses/4.jpg"],
  specializations: "Financial Management, Project Management, Capital Budgeting, Risk Analysis, Corporate Governance",
  description: overviewContent,
  overviewContent: overviewContent,
  curriculum: [
    "Semester 1: Management Concepts, Financial Accounting & Organizational Dynamics",
    "Semester 2: Corporate Finance, Marketing Strategy & Research Methodologies",
    "Semester 3: Advanced Financial Management, Security Analysis & Portfolio Management",
    "Semester 4: Project Formulation & Appraisal, Agile Project Execution & Capstone Dissertation"
  ],
  isInitial: false,
  isNew: true,
  dateAdded: "2026-09-22T00:00:00.000Z",
  updatedAt: new Date().toISOString()
};

if (idx !== -1) {
  courses[idx] = updatedRecord;
} else {
  courses.push(updatedRecord);
}

fs.writeFileSync(path, JSON.stringify(courses, null, 2), 'utf8');
console.log('✅ Course #107 Subharti MBA enriched with 7-point structured architecture in data/courses.json!');
