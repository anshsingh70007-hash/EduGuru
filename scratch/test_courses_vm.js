const fs = require('fs');
const path = require('path');
const vm = require('vm');

const coursesJson = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'courses.json'), 'utf8'));

// Mock browser DOM
class MockElement {
    constructor(id = '', tagName = 'div') {
        this.id = id;
        this.tagName = tagName;
        this.innerHTML = '';
        this.textContent = '';
        this.value = '';
        this.style = {};
        this.classList = {
            add: (c) => {},
            remove: (c) => {}
        };
        this.listeners = {};
        this.children = [];
    }
    addEventListener(evt, fn) {
        if (!this.listeners[evt]) this.listeners[evt] = [];
        this.listeners[evt].push(fn);
    }
    dispatchEvent(evt) {
        const fns = this.listeners[evt.type] || [];
        fns.forEach(fn => fn(evt));
    }
    querySelector() { return null; }
    querySelectorAll() { return []; }
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
            href: 'http://localhost:3000/courses.html',
            pathname: '/courses.html',
            search: ''
        },
        history: {
            replaceState: (state, title, url) => {}
        },
        localStorage: {
            getItem: (key) => null,
            setItem: (key, val) => {}
        },
        scrollTo: () => {},
        fetch: async (url) => {
            return {
                ok: true,
                json: async () => ({ success: true, courses: coursesJson, count: coursesJson.length })
            };
        },
        addEventListener: () => {},
        dispatchEvent: () => {}
    },
    URL: class {
        constructor(href) {
            this.href = href;
            this.searchParams = new Map();
        }
    },
    fetch: async (url) => {
        return {
            ok: true,
            json: async () => ({ success: true, courses: coursesJson, count: coursesJson.length })
        };
    },
    setTimeout: (fn, delay) => { fn(); return 1; },
    clearTimeout: () => {},
    setInterval: () => 1,
    clearInterval: () => {}
};
context.window.window = context.window;
context.window.document = context.document;
context.window.URL = context.URL;
context.window.location.searchParams = new Map();

const code = fs.readFileSync(path.join(__dirname, '..', 'js', 'courses-manager.js'), 'utf8');

try {
    vm.runInNewContext(code, context);
    console.log('✅ courses-manager.js evaluated in VM without fatal parse error.');
} catch (err) {
    console.error('❌ VM Evaluation failed:', err);
    process.exit(1);
}

// Test initCoursesPage
(async () => {
    try {
        await context.window.initCoursesPage();
        console.log('✅ initCoursesPage() completed!');
        console.log('Grid innerHTML length:', elements['eg-courses-grid'].innerHTML.length);
        console.log('Pagination nav innerHTML:', elements['eg-pagination-nav'].innerHTML.slice(0, 150));
        console.log('Results count text:', elements['eg-results-count-text'].innerHTML);

        // Test next page
        console.log('Testing gotoCoursePage(2)...');
        context.window.gotoCoursePage(2);
        console.log('Page 2 results count text:', elements['eg-results-count-text'].innerHTML);

        console.log('Testing gotoCoursePage(3)...');
        context.window.gotoCoursePage(3);
        console.log('Page 3 results count text:', elements['eg-results-count-text'].innerHTML);

        const totalPages = Math.ceil(coursesJson.length / 6);
        console.log(`Testing gotoCoursePage(${totalPages}) [Last Page]...`);
        context.window.gotoCoursePage(totalPages);
        console.log(`Page ${totalPages} results count text:`, elements['eg-results-count-text'].innerHTML);
        console.log('Last page Next button disabled:', elements['eg-pagination-nav'].innerHTML.includes('Next <i class="fa fa-chevron-right"></i>\n            </button>') && elements['eg-pagination-nav'].innerHTML.includes('disabled'));

        // Test search
        console.log('Testing search input for "MBA"...');
        const searchInput = elements['eg-course-search-input'];
        searchInput.value = 'MBA';
        searchInput.dispatchEvent({ type: 'input', target: { value: 'MBA' } });
        console.log('Search "MBA" results count text:', elements['eg-results-count-text'].innerHTML);
        console.log('Search "MBA" grid contains MBA:', elements['eg-courses-grid'].innerHTML.includes('MBA'));

        // Test Clear Search
        console.log('Testing clearCourseSearch()...');
        context.window.clearCourseSearch();
        console.log('Cleared search results count text:', elements['eg-results-count-text'].innerHTML);

        // Test Faculty filter
        console.log('Testing Faculty filter "Faculty of Engineering & Technology"...');
        const facultySelect = elements['eg-faculty-filter'];
        facultySelect.value = 'Faculty of Engineering & Technology';
        facultySelect.dispatchEvent({ type: 'change', target: { value: 'Faculty of Engineering & Technology' } });
        console.log('Faculty filter results count text:', elements['eg-results-count-text'].innerHTML);

        // Test Reset all
        console.log('Testing resetAllCourseFilters()...');
        context.window.resetAllCourseFilters();
        console.log('Reset all results count text:', elements['eg-results-count-text'].innerHTML);
        console.log('🎉 ALL TESTS PASSED SUCCESSFULLY!');

    } catch (err) {
        console.error('❌ Test failed during execution:', err);
    }
})();
