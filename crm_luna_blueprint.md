# EducationistGuru CRM — Production Audit & Refinement Blueprint

## Executive Position

EducationistGuru’s CRM should be treated as a complete admissions operating system, not only as a lead tracker.

The primary architectural risks to eliminate are:

1. Hardcoded course lists and dropdown options.
2. UI elements that do not trigger real backend actions.
3. Data being updated only in browser state but not in server storage.
4. Lead, application, and enrollment records being duplicated without shared IDs.
5. Inconsistent statuses, dates, ownership, and audit history.
6. Content Studio records whose slugs, images, and relationships become out of sync.
7. Destructive actions without confirmation, rollback, or audit logs.
8. JSON files being directly mutated from multiple screens without an abstraction layer.

The CRM should use a **single source of truth**, preferably a relational database. If the current implementation must continue using files such as `leads.json`, `applications.json`, and `courses.json`, all modules must access them through a storage service rather than reading and writing files directly from UI components.

---

# 1. Recommended System Architecture

## 1.1 Domain entities

The core entities should be:

```text
Lead
  └── Applications
        └── Enrollment
              └── Fee Transactions
```

Additional entities:

```text
University
College
Course
Blog
Video
Inquiry
Subscriber
User
FollowUp
Communication
ActivityLog
Document
Notification
```

## 1.2 Required shared identifiers

Every record must contain a stable ID.

```json
{
  "id": "lead_01J...",
  "createdAt": "2025-01-15T10:30:00Z",
  "updatedAt": "2025-01-15T10:45:00Z",
  "createdBy": "user_123",
  "updatedBy": "user_123",
  "status": "new",
  "isDeleted": false
}
```

Do not use:

- Array index as record ID.
- Student name as an identifier.
- Phone number as an identifier.
- Slug as the primary key.
- Client-generated random IDs without collision protection.

## 1.3 Storage abstraction

The UI should never directly manipulate `leads.json`.

Use a repository/service layer:

```text
LeadRepository
  getAll()
  getById(id)
  create(payload)
  update(id, payload)
  delete(id)
  bulkUpdate(ids, patch)
  convertToApplication(id)
```

Example API layer:

```text
GET    /api/leads
POST   /api/leads
GET    /api/leads/:id
PATCH  /api/leads/:id
DELETE /api/leads/:id
POST   /api/leads/:id/convert
POST   /api/leads/:id/follow-ups
```

If JSON storage is temporarily retained:

- Use atomic write: write temporary file, then rename.
- Validate records against a schema before writing.
- Add file locking or a single server-side write queue.
- Maintain backups.
- Add a migration version.
- Never allow browser code to write arbitrary JSON.
- Avoid simultaneous writes from multiple browser tabs.
- Return the saved server record after every mutation.

Recommended file structure:

```text
/data
  leads.json
  applications.json
  enrollments.json
  inquiries.json
  subscribers.json
  fees.json
  users.json
  settings.json
  courses.json
  universities.json
  colleges.json
  blogs.json
  videos.json
  followups.json
  activities.json
  schema-version.json
```

---

# 2. Global UI/UX Audit Standard

Every screen should be audited against the following checklist.

## 2.1 Every visible control must have a real purpose

For each button, icon, card, tab, dropdown, and metric:

- Does it trigger a real action?
- Does it navigate somewhere valid?
- Does it reflect live server data?
- Does it have a loading state?
- Does it show success or failure feedback?
- Does it work after refresh?
- Does it work for the current user role?
- Does it have an empty state?
- Does it have a mobile layout?
- Does it have keyboard and screen-reader support?

Remove or hide:

- Decorative KPI cards with no drill-down.
- Buttons showing “Coming Soon” without a roadmap.
- Filters that do not affect the table.
- Search boxes that only search the current page unintentionally.
- Export buttons that export stale or incomplete data.
- Dead tabs and unused menu items.
- Icons without tooltips or accessible labels.

## 2.2 Standard page structure

Every management screen should have:

```text
Page title
Page description
Primary action
Search
Filters
Saved filter/view option, if required
Summary metrics
Data table or card view
Pagination
Bulk actions
Empty state
Loading state
Error state
```

## 2.3 Standard table requirements

Tables should include:

- Server-side pagination.
- Search with debounce.
- Filter persistence.
- Sortable columns.
- Column visibility control.
- Bulk selection.
- Bulk status update.
- Export only filtered records.
- Responsive mobile card view.
- Clear row actions.
- No horizontal overflow on mobile unless unavoidable.
- Confirmation for destructive actions.

## 2.4 Standard mutation behaviour

On create/update/delete:

1. Disable duplicate submission.
2. Show a loading state.
3. Validate client-side.
4. Validate again server-side.
5. Save to server.
6. Replace local state with the server response.
7. Show success toast.
8. Update counts and table rows.
9. Write an activity log.
10. Handle failure without silently losing user input.

---

# 3. Dashboard Audit and Refinement

## 3.1 Dashboard purpose

The dashboard should help management answer:

- How many new leads arrived today?
- Which counselors need attention?
- How many follow-ups are overdue?
- How many applications are pending?
- How many enrollments were completed?
- What fees are outstanding?
- Which sources and courses are converting?
- Which university/course pipeline is strongest?

## 3.2 Recommended dashboard widgets

### Admissions funnel

```text
New Leads
Contacted
Qualified
Application Started
Application Submitted
Enrollment Confirmed
```

Each number must be clickable and open the corresponding filtered module.

### Follow-up performance

- Today’s follow-ups.
- Overdue follow-ups.
- Unassigned leads.
- Leads without a next follow-up date.
- Counselor-wise pending follow-ups.

### Application pipeline

- Draft applications.
- Documents pending.
- Submitted applications.
- University verification pending.
- Offer/admission letter pending.
- Rejected/withdrawn applications.

### Enrollment and fee summary

- Enrollments this month.
- Total collected.
- Pending fees.
- Overdue fees.
- Upcoming due dates.

### Source performance

Examples:

```text
Website
Google Ads
Meta Ads
WhatsApp
Phone
Referral
Walk-in
University referral
Organic search
```

Show:

- Lead count.
- Qualified count.
- Application count.
- Enrollment count.
- Conversion rate.
- Cost per enrollment where campaign data exists.

## 3.3 Dashboard defects to prevent

Do not display:

- Hardcoded statistics.
- Counts calculated only from currently loaded table rows.
- Fake percentage changes.
- Date ranges that do not affect all widgets.
- Cards without drill-down links.
- A “revenue” card if fee data is incomplete.
- Enrollment numbers sourced from leads without conversion logic.

## 3.4 Dashboard technical requirement

Use one dashboard endpoint:

```text
GET /api/dashboard/summary?from=YYYY-MM-DD&to=YYYY-MM-DD
```

The API should return all dashboard metrics using the same date range and timezone. Store dates in UTC and display them in Indian Standard Time where appropriate.

---

# 4. Leads Management — Priority Module

## 4.1 Lead lifecycle

Use a controlled status dictionary:

```text
New
Attempted Contact
Contacted
Qualified
Counselling Scheduled
Interested
Application Started
Application Submitted
Converted
Not Interested
Not Eligible
Duplicate
Invalid
Lost
```

Do not let users create arbitrary statuses from the lead form.

Separate these concepts:

- **Lead status**: where the lead is in the funnel.
- **Lead temperature**: Hot, Warm, Cold.
- **Contact status**: Not contacted, Contacted, Unreachable, Wrong number.
- **Application status**: separate application workflow.
- **Enrollment status**: separate enrollment workflow.

## 4.2 Add/Edit Lead — required fields

### A. Identity

Required:

- First name.
- Last name, optional where not available.
- Mobile number.
- WhatsApp number, with “same as mobile” option.
- Email address, optional but strongly recommended.
- Preferred contact channel:
  - Phone
  - WhatsApp
  - Email
  - SMS

Validation:

- Indian mobile number format.
- Country code support.
- Duplicate detection based on normalized mobile, WhatsApp, and email.
- Do not reject valid numbers merely because they are not currently on WhatsApp.

### B. Location

Required or recommended:

- City.
- State.
- Country, default India.
- Pincode, optional.
- Current location versus permanent location if required by business operations.

Use controlled State and City data, not free-text wherever possible.

Recommended fields:

```text
State
City
Pincode
Preferred study location
```

### C. Academic profile

Required:

- Highest qualification.
- Qualification status:
  - Completed
  - Appearing
  - Result awaited
- Year of completion.
- Percentage or CGPA, optional.
- Relevant specialization or stream.
- Work experience, optional.
- Current occupation, optional.

Suggested qualification values:

```text
Class 10
Class 12
Diploma
ITI
Bachelor’s Degree
Master’s Degree
Doctorate
Professional Certification
Other
```

### D. Admission intent

Required:

- Preferred program/course.
- Preferred mode:
  - Online
  - Distance
  - Regular
- Admission intake/session.
- Desired university, optional.
- Desired college, optional.
- Career objective, optional.
- Budget range, optional.
- Need for education loan, optional.
- Need for hostel, optional for regular programs.

### E. Dynamic course selection

This is a critical correction.

Do not use a hardcoded list of nine courses. The selector must load active courses from Content Studio or the course API.

```text
GET /api/courses?status=published&admissionOpen=true
```

The selector should support:

- Search by course name.
- Filter by mode.
- Filter by university.
- Filter by duration.
- Filter by level.
- Filter by specialization.
- Multiple preferred courses.
- Primary preference and secondary preference.
- Course availability validation.
- Inactive course prevention.
- Server-side validation that the selected course exists.

Recommended structure:

```json
{
  "preferredCourses": [
    {
      "courseId": "course_123",
      "preferenceRank": 1,
      "mode": "online"
    }
  ]
}
```

Do not copy the entire course object into the lead. Store the course ID