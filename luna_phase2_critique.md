# Recommended Product and Technical Direction

The APK should be structured around **four clearly separated experiences**:

1. **Home** — admissions, discovery, trust, and personalized recommendations.
2. **Courses** — complete searchable course catalog.
3. **Videos** — official EducationistGuru YouTube content.
4. **Profile/More** — user information, support, settings, etc.

The main principle is:

> Home should help users decide what to explore. Courses should help users find and select a specific course.

---

# 1. Issue 1: Responsive Header and Full-Screen Layout

## Root Cause

The header is probably using one or more of the following:

- Fixed horizontal padding.
- Fixed button width.
- Non-wrapping text.
- A parent container without `min-width: 0`.
- Logo, title, and action button competing for the same width.
- Emoji/icon and text rendered as one rigid element.
- Missing viewport and safe-area handling.

A design that fits at 412px can easily clip at 360px.

## Required viewport configuration

For a web-based APK, PWA, Capacitor, or WebView application:

```html
<meta
  name="viewport"
  content="width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover"
/>
```

Do not design against a fixed 412px canvas. The layout must adapt from approximately 320px upward.

## Recommended responsive header

### HTML

```html
<header class="app-header">
  <div class="header-brand">
    <img
      src="/assets/logo.png"
      class="brand-logo"
      alt="EducationistGuru"
    />

    <div class="brand-copy">
      <span class="brand-name">EducationistGuru</span>
      <span class="brand-subtitle">Learn. Grow. Succeed.</span>
    </div>
  </div>

  <div class="header-actions">
    <a href="tel:+91XXXXXXXXXX" class="counselling-button">
      <span class="button-icon" aria-hidden="true">☎</span>
      <span class="button-label">Counselling</span>
    </a>
  </div>
</header>
```

### CSS

```css
:root {
  --page-padding: clamp(12px, 4vw, 24px);
  --header-gap: clamp(8px, 2vw, 16px);
  --brand-color: #123c7a;
  --accent-color: #e83d4f;
}

*,
*::before,
*::after {
  box-sizing: border-box;
}

html,
body {
  width: 100%;
  min-width: 0;
  margin: 0;
  overflow-x: hidden;
}

body {
  padding-top: env(safe-area-inset-top);
  padding-bottom: env(safe-area-inset-bottom);
}

.app-header {
  width: 100%;
  min-width: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--header-gap);
  padding: 12px var(--page-padding);
  background: #ffffff;
  border-bottom: 1px solid #edf0f5;
}

.header-brand {
  min-width: 0;
  flex: 1 1 auto;
  display: flex;
  align-items: center;
  gap: 10px;
}

.brand-logo {
  width: clamp(34px, 10vw, 48px);
  height: clamp(34px, 10vw, 48px);
  flex: 0 0 auto;
  object-fit: contain;
}

.brand-copy {
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.brand-name {
  min-width: 0;
  color: var(--brand-color);
  font-size: clamp(14px, 4vw, 20px);
  font-weight: 700;
  line-height: 1.15;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.brand-subtitle {
  color: #6d7480;
  font-size: clamp(10px, 2.8vw, 13px);
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.header-actions {
  flex: 0 0 auto;
  min-width: 0;
}

.counselling-button {
  min-height: 40px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 9px clamp(8px, 2.5vw, 14px);
  color: #ffffff;
  background: var(--accent-color);
  border-radius: 999px;
  font-size: clamp(11px, 3.1vw, 14px);
  font-weight: 700;
  line-height: 1;
  text-decoration: none;
  white-space: nowrap;
}

.button-icon {
  flex: 0 0 auto;
}

/* Compact layout for 360px and narrower screens */
@media (max-width: 370px) {
  .app-header {
    padding-left: 12px;
    padding-right: 12px;
  }

  .brand-subtitle {
    display: none;
  }

  .counselling-button {
    width: 42px;
    padding: 0;
    border-radius: 50%;
  }

  .button-label {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
  }
}
```

This ensures that on narrow screens the counselling action becomes an icon button rather than displaying a clipped `"Couns..."` label.

## Important layout rule

Every flex child containing text should usually have:

```css
min-width: 0;
```

Without this, a long brand name or button can force its parent wider than the viewport.

## Additional responsive rules

Avoid:

```css
width: 412px;
margin-left: 24px;
padding-left: 40px;
white-space: nowrap;
```

Prefer:

```css
width: 100%;
max-width: 100%;
padding-inline: clamp(12px, 4vw, 24px);
font-size: clamp(12px, 3.5vw, 16px);
```

The UI should be tested at:

- 320px
- 360px
- 375px
- 390px
- 412px
- Android system font scale at 100%, 125%, and 150%
- Portrait and landscape
- Devices with display cutouts

---

# 2. Issue 2: Courses Tab Blank Screen

## Root Cause

The course rendering logic is tied to the Home DOM:

```javascript
document.querySelector("#coursesGrid")
```

When the user switches to Courses, the Courses screen either:

- Does not contain a `#coursesGrid`, or
- Contains a different container that the renderer never targets.

## Recommended fix: Separate containers

Do not make both tabs depend on one shared DOM element.

### HTML

```html
<section id="homeView" class="view-panel">
  <div id="featuredCoursesGrid" class="course-grid"></div>
</section>

<section id="coursesView" class="view-panel" hidden>
  <div class="catalog-toolbar">
    <input
      id="courseSearch"
      type="search"
      placeholder="Search courses"
      aria-label="Search courses"
    />

    <select id="courseSort" aria-label="Sort courses">
      <option value="popular">Most Popular</option>
      <option value="newest">Newest</option>
      <option value="price-low">Price: Low to High</option>
      <option value="price-high">Price: High to Low</option>
    </select>
  </div>

  <div id="courseFilters" class="stream-pills"></div>
  <div id="catalogCoursesGrid" class="course-grid"></div>

  <button id="loadMoreCourses" type="button">
    Load More
  </button>
</section>
```

## Use one reusable card renderer

```javascript
function createCourseCard(course) {
  const card = document.createElement("article");
  card.className = "course-card";

  card.innerHTML = `
    <img
      class="course-card-image"
      src="${escapeHtml(course.image)}"
      alt="${escapeHtml(course.title)}"
      loading="lazy"
    />

    <div class="course-card-body">
      <span class="course-card-stream">
        ${escapeHtml(course.stream)}
      </span>

      <h3>${escapeHtml(course.title)}</h3>

      <p>${escapeHtml(course.shortDescription || "")}</p>

      <button
        class="course-card-button"
        data-course-id="${escapeHtml(course.id)}"
      >
        View Details
      </button>
    </div>
  `;

  return card;
}

function renderCourses(courses, containerSelector) {
  const container = document.querySelector(containerSelector);

  if (!container) {
    console.error(`Course container not found: ${containerSelector}`);
    return;
  }

  container.replaceChildren();

  if (!courses.length) {
    container.innerHTML = `
      <div class="empty-state">
        No courses found for the selected filters.
      </div>
    `;
    return;
  }

  const fragment = document.createDocumentFragment();

  courses.forEach(course => {
    fragment.appendChild(createCourseCard(course));
  });

  container.appendChild(fragment);
}
```

Do not inject user or API content without escaping it. A production implementation should use a framework’s standard escaping or a dedicated `escapeHtml()` utility.

## Render Home and Catalog separately

```javascript
const allCourses = [
  // Course data from API or local JSON
];

const featuredCourses = allCourses
  .filter(course => course.featured || course.trending)
  .slice(0, 6);

function renderHome() {
  renderCourses(featuredCourses, "#featuredCoursesGrid");
}

function renderCatalog() {
  const filters = getCatalogFilters();
  const filteredCourses = filterAndSortCourses(allCourses, filters);

  renderCourses(filteredCourses, "#catalogCoursesGrid");
}
```

## Tab switching

```javascript
const views = {
  home: document.querySelector("#homeView"),
  courses: document.querySelector("#coursesView"),
  videos: document.querySelector("#videosView")
};

function switchView(viewName) {
  Object.entries(views).forEach(([name, element]) => {
    const active = name === viewName;

    element.hidden = !active;
    element.classList.toggle("is-active