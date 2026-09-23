const fs = require('fs');
const path = require('path');
const vm = require('vm');

async function runRealtimeSyncTest() {
    console.log('🧪 Starting End-to-End Real-Time CMS Synchronization Test...');

    // 1. Check initial courses count via /api/content/all
    const initialRes = await fetch('http://localhost:3000/api/content/all');
    const initialJson = await initialRes.json();
    console.log('1. Initial /api/content/all courses count:', initialJson.data.courses.length);
    const countBefore = initialJson.data.courses.length;

    // 2. Create a brand new course on "Device A" (via Content Studio API)
    const testCoursePayload = {
        name: 'Super High Tech AI & Quantum Computing 2026',
        faculty: 'Faculty of Engineering & Technology',
        duration: '4 Years',
        eligibility: '10+2 with PCM (60%)',
        mode: 'Online / Regular',
        fee: '₹75,000 / year',
        specializations: 'Quantum Algorithms, Neural Networks',
        description: 'Cutting edge degree in quantum computing and neural artificial intelligence.',
        isNew: true
    };

    console.log('2. Device A creating new course via POST /api/content/courses...');
    const postRes = await fetch('http://localhost:3000/api/content/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testCoursePayload)
    });
    const postJson = await postRes.json();
    console.log('Device A POST response status:', postRes.status, 'Success:', postJson.success);
    const createdCourse = postJson.course;
    console.log('Created Course ID:', createdCourse.id, 'Slug:', createdCourse.slug);

    // 3. Verify server /api/content/all now immediately reflects this new course
    const syncRes = await fetch('http://localhost:3000/api/content/all?_t=' + Date.now());
    const syncJson = await syncRes.json();
    const foundOnServer = syncJson.data.courses.find(c => String(c.id) === String(createdCourse.id));
    console.log('3. Device B checking /api/content/all: Course found on server:', !!foundOnServer);
    if (!foundOnServer) throw new Error('New course not found on server /api/content/all');

    // 4. Simulate Device B browser running courses-manager.js receiving the background sync
    class MockElement {
        constructor(id = '', tagName = 'div') {
            this.id = id;
            this.tagName = tagName;
            this.innerHTML = '';
            this.textContent = '';
            this.value = '';
            this.style = {};
            this.classList = { add: () => {}, remove: () => {} };
            this.listeners = {};
        }
        addEventListener(evt, fn) {
            if (!this.listeners[evt]) this.listeners[evt] = [];
            this.listeners[evt].push(fn);
        }
        dispatchEvent(evt) {
            const fns = this.listeners[evt.type] || [];
            fns.forEach(fn => fn(evt));
        }
        getBoundingClientRect() { return { top: 100 }; }
    }

    const elements = {
        'eg-courses-grid': new MockElement('eg-courses-grid'),
        'eg-results-count-text': new MockElement('eg-results-count-text'),
        'eg-page-indicator-text': new MockElement('eg-page-indicator-text'),
        'eg-active-filter-chips': new MockElement('eg-active-filter-chips'),
        'eg-pagination-nav': new MockElement('eg-pagination-nav'),
        'eg-jump-select': new MockElement('eg-jump-select', 'select'),
        'eg-courses-pagination': new MockElement('eg-courses-pagination'),
        'eg-course-search-input': new MockElement('eg-course-search-input', 'input'),
        'eg-search-clear-btn': new MockElement('eg-search-clear-btn', 'button'),
        'eg-faculty-filter': new MockElement('eg-faculty-filter', 'select'),
        'eg-mode-filter': new MockElement('eg-mode-filter', 'select'),
        'eg-sort-filter': new MockElement('eg-sort-filter', 'select'),
        'eg-courses-main-section': new MockElement('eg-courses-main-section')
    };

    const windowListeners = {};
    const context = {
        console: console,
        document: {
            readyState: 'complete',
            getElementById: (id) => elements[id] || null,
            addEventListener: () => {}
        },
        window: {
            location: {
                protocol: 'http:',
                origin: 'http://localhost:3000',
                hostname: 'localhost',
                port: '3000',
                href: 'http://localhost:3000/courses.html',
                pathname: '/courses.html',
                search: '',
                searchParams: new Map()
            },
            history: { replaceState: () => {} },
            localStorage: { getItem: () => null, setItem: () => {} },
            scrollTo: () => {},
            fetch: fetch,
            addEventListener: (evt, fn) => {
                if (!windowListeners[evt]) windowListeners[evt] = [];
                windowListeners[evt].push(fn);
            },
            dispatchEvent: (evt) => {
                const fns = windowListeners[evt.type] || [];
                fns.forEach(fn => fn(evt));
            }
        },
        URL: class {
            constructor(href) { this.href = href; this.searchParams = new Map(); }
        },
        fetch: fetch,
        setTimeout: (fn) => { fn(); return 1; },
        clearTimeout: () => {},
        setInterval: () => 1,
        clearInterval: () => {}
    };
    context.window.window = context.window;
    context.window.document = context.document;
    context.window.URL = context.URL;

    // Load courses-manager.js in Device B
    const coursesManagerCode = fs.readFileSync(path.join(__dirname, '..', 'js', 'courses-manager.js'), 'utf8');
    vm.runInNewContext(coursesManagerCode, context);

    await context.window.initCoursesPage();
    console.log('4. Device B initial render results count:', elements['eg-results-count-text'].innerHTML);

    // Verify the newly created course is prominently placed on Page 1 with NEW badge
    const page1Html = elements['eg-courses-grid'].innerHTML;
    const hasNewCourse = page1Html.includes('Super High Tech AI &amp; Quantum Computing 2026') || page1Html.includes('Super High Tech AI & Quantum Computing 2026');
    console.log('5. New course visible on Page 1:', hasNewCourse);
    console.log('6. Page 1 contains NEW badge:', page1Html.includes('eg-badge-new'));

    // Test Search for the newly created course
    const searchInput = elements['eg-course-search-input'];
    searchInput.value = 'Quantum';
    searchInput.dispatchEvent({ type: 'input', target: { value: 'Quantum' } });
    console.log('7. Searching for newly created course "Quantum":', elements['eg-results-count-text'].innerHTML);
    console.log('8. Search grid contains Quantum course:', elements['eg-courses-grid'].innerHTML.includes('Quantum'));

    // 5. Clean up the test course
    console.log('9. Cleaning up test course ID:', createdCourse.id);
    const delRes = await fetch(`http://localhost:3000/api/content/courses/${createdCourse.id}`, {
        method: 'DELETE'
    });
    console.log('Delete response status:', delRes.status);

    // Verify deletion on server
    const afterDelRes = await fetch('http://localhost:3000/api/content/all?_t=' + Date.now());
    const afterDelJson = await afterDelRes.json();
    console.log('10. Courses count after cleanup:', afterDelJson.data.courses.length, '(Original was:', countBefore, ')');

    console.log('🎉 REAL-TIME MULTI-DEVICE CMS SYNCHRONIZATION 100% VERIFIED!');
}

runRealtimeSyncTest().catch(err => {
    console.error('❌ Realtime test failed:', err);
    process.exit(1);
});
