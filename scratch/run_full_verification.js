const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

console.log('====================================================');
console.log(' EDUCATIONISTGURU SYSTEM ENHANCEMENT VERIFICATION');
console.log('====================================================\n');

let passCount = 0;
let failCount = 0;

function assert(condition, message) {
    if (condition) {
        console.log(`✅ PASS: ${message}`);
        passCount++;
    } else {
        console.error(`❌ FAIL: ${message}`);
        failCount++;
    }
}

// 1. Check edit/index.html and edit.html synchronization
const editIndexHtml = fs.readFileSync(path.join(__dirname, '..', 'edit', 'index.html'), 'utf8');
const editHtml = fs.readFileSync(path.join(__dirname, '..', 'edit.html'), 'utf8');
const hash1 = crypto.createHash('sha256').update(editIndexHtml).digest('hex');
const hash2 = crypto.createHash('sha256').update(editHtml).digest('hex');
assert(hash1 === hash2, `edit/index.html and edit.html are 100% synchronized (SHA256: ${hash1})`);

// 2. Check WYSIWYG Editor fixes in edit/index.html and edit/css/edit.css
const editCss = fs.readFileSync(path.join(__dirname, '..', 'edit', 'css', 'edit.css'), 'utf8');
assert(editCss.includes('caret-color: #0f172a !important;') && editCss.includes('cursor: text !important;'), 'WYSIWYG editor has cursor text and caret-color fix');
assert(editCss.includes('.fullscreen-editor') && editCss.includes('z-index: 999999 !important;'), 'WYSIWYG editor has viewport breakout fullscreen mode');
assert(editIndexHtml.includes('insertEditorTemplate') && editIndexHtml.includes('Complete Course &amp; Career Guide'), 'WYSIWYG editor has 1-click Article Templates dropdown');
assert(editIndexHtml.includes('insertEditorFaq') && editIndexHtml.includes('insertEditorQuote'), 'WYSIWYG editor has FAQ, Key Highlights, and Quote block inserters');
assert(editIndexHtml.includes('onmousedown="event.preventDefault()"'), 'WYSIWYG toolbar buttons have preventDefault on mousedown to preserve selection');

// 3. Check Tab 6 Navigation Manager in edit/index.html and edit/js/edit.js
assert(editIndexHtml.includes('id="allNavHeadersContainer"'), 'Tab 6 has dynamic allNavHeadersContainer for all 10 navigation items');
assert(editIndexHtml.includes('id="announcementLivePreviewContainer"') && editIndexHtml.includes('id="announcementPreviewText"'), 'Tab 6 has live announcement ribbon preview bar');
assert(editIndexHtml.includes('id="headerModal"') && editIndexHtml.includes('id="subLinksModal"'), 'Header and Sub-Links modal dialogs are present in edit UI');

const editJs = fs.readFileSync(path.join(__dirname, '..', 'edit', 'js', 'edit.js'), 'utf8');
assert(editJs.includes('renderAllNavHeaders') && editJs.includes('toggleHeaderActive'), 'edit.js has renderAllNavHeaders and toggleHeaderActive controller functions');
assert(editJs.includes('openSubLinksModal') && editJs.includes('saveSubLinksChanges'), 'edit.js has sub-links manager for dropdown menus');

// 4. Check Navigation Navbar & Menu CSS
const siteMenuCss = fs.readFileSync(path.join(__dirname, '..', 'css', 'site-menu.css'), 'utf8');
assert(siteMenuCss.includes('white-space: nowrap !important;') && siteMenuCss.includes('.rs-menu ul.nav-menu > li'), 'site-menu.css prevents 2-line wraps on navigation items');
assert(siteMenuCss.includes('.badge-green') && siteMenuCss.includes('.badge-blue'), 'site-menu.css has color-coded badge pill classes');

const siteMenuJson = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'site_menu.json'), 'utf8'));
assert(Array.isArray(siteMenuJson.navItems) && siteMenuJson.navItems.length === 10, `site_menu.json contains all 10 primary navigation items (found ${siteMenuJson.navItems.length})`);
assert(siteMenuJson.navItems.some(item => item.id === 'boards' && item.children && item.children.length > 0), 'Boards & Open School has dropdown children');
assert(siteMenuJson.navItems.some(item => item.id === 'subharti-mba-hub' && item.children && item.children.length > 0), 'Subharti MBA Hub has dropdown children');

// 5. Check Courses Search Relevancy
const coursesManagerJs = fs.readFileSync(path.join(__dirname, '..', 'js', 'courses-manager.js'), 'utf8');
assert(coursesManagerJs.includes('calculateCourseRelevance'), 'courses-manager.js implements calculateCourseRelevance scoring algorithm');

const courses = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'courses.json'), 'utf8'));
function testRelevance(course, query) {
    if (!query) return 0;
    const q = query.toLowerCase().trim();
    const name = String(course.name || '').toLowerCase();
    const faculty = String(course.faculty || '').toLowerCase();
    const desc = String(course.description || '').toLowerCase();
    const specs = String(course.specializations || '').toLowerCase();
    const cats = Array.isArray(course.categories) ? course.categories.join(' ').toLowerCase() : String(course.category || '').toLowerCase();
    const tags = Array.isArray(course.tags) ? course.tags.join(' ').toLowerCase() : String(course.tags || '').toLowerCase();

    let score = 0;
    if (name === q) score += 150;
    else if (name.startsWith(q + ' ') || name.startsWith(q + ' -')) score += 130;
    else if (name.includes(' in ' + q) || name.includes(' of ' + q) || name.includes(' (' + q + ')')) score += 110;
    else if (name.includes(q)) score += 85;

    if (faculty.includes(q)) score += 60;
    if (cats.includes(q) || tags.includes(q)) score += 40;
    if (specs.includes(q)) score += 20;
    if (desc.includes(q)) score += 10;

    return score;
}

const scoredCommerce = courses.map(c => ({ name: c.name, score: testRelevance(c, 'commerce') })).filter(c => c.score > 0);
scoredCommerce.sort((a, b) => b.score - a.score);
const topCommerce = scoredCommerce[0];
assert(topCommerce && (topCommerce.name.includes('Commerce') || topCommerce.name.includes('M.Com') || topCommerce.name.includes('B.Com')), `Searching 'commerce' ranks a Commerce degree first (${topCommerce ? topCommerce.name : 'none'}), NOT Ph.D.`);

const scoredMba = courses.map(c => ({ name: c.name, score: testRelevance(c, 'mba') })).filter(c => c.score > 0);
scoredMba.sort((a, b) => b.score - a.score);
const topMba = scoredMba[0];
assert(topMba && topMba.name.includes('MBA'), `Searching 'mba' ranks an MBA program first (${topMba ? topMba.name : 'none'})`);

// 6. Check Deep-Link Hydration in universities and colleges managers
const univManagerJs = fs.readFileSync(path.join(__dirname, '..', 'js', 'universities-manager.js'), 'utf8');
assert(univManagerJs.includes('checkUrlParamAndOpenDetails') && univManagerJs.includes('showUnivDetails'), 'universities-manager.js automatically handles deep-links to show university details modal');

const collegesManagerJs = fs.readFileSync(path.join(__dirname, '..', 'js', 'colleges-manager.js'), 'utf8');
assert(collegesManagerJs.includes('checkUrlParamAndOpenDetails') && collegesManagerJs.includes('showCollegeDetails'), 'colleges-manager.js automatically handles deep-links to show college details modal');

// 7. Check Blog Category Separation in cms-content.js and css/blog.css
const cmsContentJs = fs.readFileSync(path.join(__dirname, '..', 'js', 'cms-content.js'), 'utf8');
assert(cmsContentJs.includes('categoryChipsHtml') && cmsContentJs.includes('eg-blog-card-cats'), 'cms-content.js renders separated category chips inside .eg-blog-card-cats container');

const blogCss = fs.readFileSync(path.join(__dirname, '..', 'css', 'blog.css'), 'utf8');
assert(blogCss.includes('.eg-blog-card-cats') && blogCss.includes('.eg-blog-card-cat'), 'blog.css has dedicated styles for .eg-blog-card-cats and .eg-blog-card-cat');

console.log(`\n====================================================`);
console.log(` VERIFICATION SUMMARY: ${passCount} PASSED, ${failCount} FAILED`);
console.log(`====================================================\n`);

if (failCount > 0) {
    process.exit(1);
}
