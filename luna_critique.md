# Executive assessment

The direction is strong: the app has a clear commercial purpose, a recognizable brand system, course-led navigation, and the right emphasis on mobile conversion. However, it is not yet “bulletproof” for an admissions business. The largest risks are not visual—they are **regulatory accuracy, trust, data integrity, and lead-capture reliability**.

A polished interface cannot compensate for a student seeing:

- “AIU / UGC / AICTE Recognized” without institution- and program-level proof.
- “Regular / Online Hybrid” for a B.Tech program without clear regulatory eligibility.
- “₹70,000/year” without university, fee inclusions, taxes, examination fees, or refund policy.
- A semester curriculum that appears authoritative but is actually generic or inferred.
- A lead form that silently fails or exposes personal data.

For EducationistGuru, incorrect academic claims create reputational and potentially legal risk. Treat course data as regulated content, not marketing copy.

---

# 1. Architectural review

## What is strong

### Clear initial product scope

The requirements correctly exclude Mega, Events, CRM, and edit pages from the student-facing app. That prevents the common mistake of turning an admissions funnel into an overloaded portal.

The likely core journey is appropriately focused:

1. Discover course.
2. Understand eligibility, duration, fees, and outcomes.
3. Compare or shortlist.
4. Request counseling.
5. Submit lead.
6. Receive confirmation and follow-up.

That is the correct commercial architecture.

### Course model is richer than a basic catalog

The course object includes:

- Degree type.
- Faculty and stream.
- Duration.
- Eligibility.
- Mode.
- Fees and EMI.
- Specializations.
- Curriculum.
- Career roles.
- Accreditation metadata.

That is a good foundation for course detail pages and filtering. The explicit naming—such as “B.Tech in Artificial Intelligence & Data Science” rather than only “B.Tech”—directly addresses an important student clarity problem.

### Good mobile-first visual foundation

The design system has:

- Strong contrast between primary orange and navy.
- Consistent spacing and radius tokens.
- A coherent shadow system.
- Defined typography.
- A bottom navigation concept.
- A full-screen splash treatment.

The visual language is commercially appropriate for an education product and should perform well with younger applicants.

### Course cards have useful decision data

Duration, fee, ratings, demand badges, and career outcomes can improve scanning and conversion. However, ratings and reviews must be real and attributable. Fabricated or editorially invented ratings are unacceptable in an admissions context.

---

## Architectural and content risks

### 1. Accreditation claims are too broad

This field is dangerous:

```javascript
accreditation: "AIU / UGC / AICTE Recognized"
```

AIU, UGC, and AICTE do not mean the same thing:

- **UGC** recognition generally applies to the university or institution.
- **AICTE** approval may apply to specific technical programs or institutions and is not universally required in every delivery mode.
- **AIU equivalence** is usually relevant to foreign qualifications, not a blanket “course accreditation” label.
- Online and distance programs have separate regulatory requirements and entitlement conditions.

The app should never present these as a generic course-level endorsement unless verified for the exact:

- University.
- Program.
- Academic year.
- Delivery mode.
- Campus or study center.
- Intake.

Use structured verification instead:

```javascript
recognition: {
  university: "Verified university name",
  ugcStatus: "Recognized",
  aicteStatus: "Applicable / Approved / Not applicable",
  aiuStatus: "Equivalence information available where applicable",
  mode: "Regular",
  academicYear: "2025-26",
  sourceUrls: [
    "https://official-source.example"
  ],
  verifiedAt: "2025-04-15"
}
```

Display plain-language explanations beside the badges. Do not use a single “AIU / UGC / AICTE Recognized” badge.

### 2. “Regular / Online Hybrid” is a major red flag

This label should not be used casually:

```javascript
mode: "Regular / Online Hybrid"
```

A student needs to know exactly what they are buying:

- Fully online?
- Distance learning?
- On-campus regular?
- Hybrid with mandatory physical attendance?
- University-approved study center?
- Which components are online?
- Are examinations online or physical?
- Is the degree valid for the intended career or government eligibility?

“Online Hybrid” can sound attractive while concealing important delivery and compliance details. Make mode an enum, not free text:

```javascript
mode: "regular" // regular | online | distance | hybrid
attendanceRequirement: "Mandatory physical attendance on campus",
examMode: "Physical university examination",
studyLocation: "University campus, city",
```

If a course cannot be legally and operationally classified, it should not be published.

### 3. The source claim is not sufficiently auditable

The comment says:

```javascript
Sourced directly from official AIU Fee Structure 2025 & EducationistGuru Catalog
```

That is not enough. Store:

- Source document title.
- Source URL or document ID.
- Page number.
- University.
- Date retrieved.
- Date verified.
- Internal reviewer.
- Program-specific fee breakdown.

Also, “AIU Fee Structure 2025” may not be the correct authority for every course. Verify that the referenced source is actually official, current, and applicable to the specific program.

### 4. Generic curriculum content may mislead applicants

This:

```javascript
"Sem 1-2: Engineering Mathematics, Python Foundations, Data Structures & Algorithms"
```

is useful as a high-level overview, but it must not be presented as the university’s official semester curriculum unless it has been copied from an official syllabus.

Use separate fields:

```javascript
curriculumType: "official" // official | indicative
curriculum: [
  {
    semester: 1,
    subjects: ["..."],
    source: "Official university syllabus, page 4"
  }
]
```

If it is indicative, label it clearly: **“Typical curriculum overview. Exact subjects may vary by university.”**

### 5. Fee data is incomplete for a purchase decision

`feePerYear` and `emiMonthly` are insufficient. Include:

- Total program fee.
- Semester fee.
- Registration fee.
- Examination fee.
- University fee.
- Technology or LMS fee.
- One-time charges.
- Taxes, if applicable.
- Refund/cancellation policy.
- Whether EMI is actual financing or simple arithmetic.

Do not show `₹5,833 / mo` as an EMI unless an actual financing provider offers that repayment schedule. Otherwise label it **“Approx. monthly equivalent”**, not EMI.

### 6. Course IDs and assets should be stable and production-safe

Numeric IDs are acceptable internally, but production routing should use stable slugs:

```javascript
slug: "btech-artificial-intelligence-data-science"
```

Relative image paths such as:

```javascript
image: "../images/courses/1.jpg"
```

are fragile across routes and deployment environments. Use root-relative or asset-managed URLs:

```javascript
image: "/images/courses/btech-ai-data-science.webp"
```

Also provide:

- Explicit image dimensions.
- WebP/AVIF variants.
- Lazy loading below the fold.
- Meaningful alt text.
- A fallback asset rather than broken-image behavior.

---

# 2. UX and conversion review

## Strongest UX points

### Course specificity

The naming approach is much better than generic cards such as “B.Tech” or “MBA.” A student can immediately understand the specialization.

### High-intent metadata

Duration, eligibility, fees, and career roles are exactly the information students seek before requesting counseling.

### Strong primary brand color

The orange primary color can perform well for calls to action, provided it is used selectively. It should identify actions, not decorate every surface.

### Splash screen supports branding

The logo animation can make the app feel intentional and premium, especially for an installed PWA or mobile-first web experience.

### View-mode switcher is useful during development

The mobile/expanded switcher is useful for review and QA, but it should not appear in production. It also risks making the student experience feel like a prototype if accidentally shipped.

---

## Conversion improvements needed

### 1. The first screen should sell the outcome, not the catalog

The app currently appears to lead with branding and course browsing. The home screen should quickly answer:

- What can I study?
- Is it recognized?
- How much does it cost?
- Can someone guide me?
- Can I check eligibility quickly?

A stronger above-the-fold structure would be:

> **Find the right university course for your career**  
> Explore verified Online, Regular and Distance programs with free counseling.

Then:

- Search by course or career.
- Popular category chips.
- “Check eligibility” CTA.
- “Talk to a counselor” CTA.
- Trust strip with evidence-backed claims.

Avoid unsupported phrases such as