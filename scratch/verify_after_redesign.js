const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const ARTIFACTS_DIR = 'C:\\Users\\Harmeet Singh\\.gemini\\antigravity-ide\\brain\\c0780ecc-9b63-48b1-b95b-55bea492e594';
const SCREENSHOT_DIR = path.join(ARTIFACTS_DIR, 'redesign_screenshots');
if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function run() {
    let executablePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
    if (!fs.existsSync(executablePath)) {
        executablePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
    }

    console.log('Launching browser with:', executablePath);
    const browser = await puppeteer.launch({
        executablePath,
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,960'],
        defaultViewport: { width: 1440, height: 960 }
    });

    const page = await browser.newPage();
    const consoleErrors = [];
    page.on('console', msg => {
        if (msg.type() === 'error') {
            consoleErrors.push(msg.text());
        }
    });

    console.log('\n--- 1. Testing Courses Hero Text Visibility ---');
    await page.goto('http://localhost:3000/courses.html', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 400));
    const coursesTitleColor = await page.evaluate(() => {
        const title = document.querySelector('.eg-courses-hero .eg-hero-title');
        return title ? window.getComputedStyle(title).color : null;
    });
    console.log('Courses hero title computed color:', coursesTitleColor);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'after_01_courses_contrast_fixed.png'), fullPage: false });
    console.log('Captured after_01_courses_contrast_fixed.png');

    console.log('\n--- 2. Testing Colleges Page Modern UI/UX ---');
    await page.goto('http://localhost:3000/colleges.html', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 600));

    // Check elements
    const collegeElements = await page.evaluate(() => {
        return {
            hasHero: Boolean(document.querySelector('.eg-dir-hero')),
            hasSearchInput: Boolean(document.getElementById('collegeSearchInput')),
            hasCatSelect: Boolean(document.getElementById('collegeCategorySelect')),
            hasLocSelect: Boolean(document.getElementById('collegeLocationSelect')),
            hasSortSelect: Boolean(document.getElementById('collegeSortSelect')),
            hasResetBtn: Boolean(document.getElementById('collegeResetBtn')),
            hasTelemetry: Boolean(document.getElementById('collegeTelemetryBar')),
            cardCount: document.querySelectorAll('#eg-colleges-grid .eg-dir-card').length,
            resultsText: document.getElementById('collegeResultsCountText')?.textContent?.trim(),
            pageIndicator: document.getElementById('collegePageIndicatorText')?.textContent?.trim(),
            paginationBtns: document.querySelectorAll('#collegePaginationSection .eg-page-btn').length
        };
    });
    console.log('Colleges Page Elements:', JSON.stringify(collegeElements, null, 2));
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'after_02_colleges_hero_search.png'), fullPage: false });
    console.log('Captured after_02_colleges_hero_search.png');

    // Scroll to grid & pagination
    await page.evaluate(() => {
        const grid = document.getElementById('eg-colleges-grid');
        if (grid) grid.scrollIntoView({ behavior: 'instant', block: 'start' });
    });
    await new Promise(r => setTimeout(r, 300));
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'after_03_colleges_grid_and_pagination.png'), fullPage: false });
    console.log('Captured after_03_colleges_grid_and_pagination.png');

    // Test Search Input for "Zenith"
    console.log('\nTesting Colleges Search with "Zenith"...');
    await page.evaluate(() => {
        window.scrollTo(0, 0);
    });
    await new Promise(r => setTimeout(r, 200));
    await page.type('#collegeSearchInput', 'Zenith', { delay: 50 });
    await new Promise(r => setTimeout(r, 350));
    const searchStats = await page.evaluate(() => {
        return {
            cardCount: document.querySelectorAll('#eg-colleges-grid .eg-dir-card').length,
            firstTitle: document.querySelector('#eg-colleges-grid .eg-dir-title')?.textContent?.trim(),
            clearBtnVisible: document.getElementById('collegeSearchClearBtn')?.style?.display !== 'none',
            chipText: document.getElementById('collegeActiveFilterChips')?.textContent?.trim()
        };
    });
    console.log('Search "Zenith" stats:', searchStats);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'after_04_colleges_search_zenith.png'), fullPage: false });
    console.log('Captured after_04_colleges_search_zenith.png');

    // Clear search
    await page.click('#collegeSearchClearBtn');
    await new Promise(r => setTimeout(r, 300));

    // Test Category select "Pharmacy"
    console.log('\nTesting Colleges Category Select "Pharmacy"...');
    await page.select('#collegeCategorySelect', 'Faculty of Pharmacy');
    await new Promise(r => setTimeout(r, 300));
    const catStats = await page.evaluate(() => {
        return {
            cardCount: document.querySelectorAll('#eg-colleges-grid .eg-dir-card').length,
            firstTitle: document.querySelector('#eg-colleges-grid .eg-dir-title')?.textContent?.trim(),
            chipText: document.getElementById('collegeActiveFilterChips')?.textContent?.trim()
        };
    });
    console.log('Category filter stats:', catStats);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'after_05_colleges_category_pharmacy.png'), fullPage: false });
    console.log('Captured after_05_colleges_category_pharmacy.png');

    // Reset filters
    await page.click('#collegeResetBtn');
    await new Promise(r => setTimeout(r, 300));

    // Test Pagination: Click page 2
    console.log('\nTesting Colleges Page 2 Navigation...');
    const hasPage2 = await page.evaluate(() => {
        const btn2 = Array.from(document.querySelectorAll('#collegePaginationSection .eg-page-btn')).find(b => b.textContent.trim() === '2');
        if (btn2) {
            btn2.click();
            return true;
        }
        return false;
    });
    if (hasPage2) {
        await new Promise(r => setTimeout(r, 400));
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'after_06_colleges_page2.png'), fullPage: false });
        console.log('Captured after_06_colleges_page2.png');
        // Back to page 1
        await page.evaluate(() => window.gotoCollegePage(1));
        await new Promise(r => setTimeout(r, 300));
    }

    // Test College Details Modal
    console.log('\nTesting College Details Modal...');
    await page.evaluate(() => {
        const firstDetailsBtn = document.querySelector('#eg-colleges-grid .eg-btn-dir-details');
        if (firstDetailsBtn) firstDetailsBtn.click();
    });
    await new Promise(r => setTimeout(r, 500));
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'after_07_colleges_modal_details.png'), fullPage: false });
    console.log('Captured after_07_colleges_modal_details.png');
    await page.evaluate(() => $('#collegeDetailModal').modal('hide'));
    await new Promise(r => setTimeout(r, 300));


    console.log('\n--- 3. Testing Universities Page Modern UI/UX ---');
    await page.goto('http://localhost:3000/universities.html', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 600));

    const univElements = await page.evaluate(() => {
        return {
            hasHero: Boolean(document.querySelector('.eg-dir-hero')),
            hasSearchInput: Boolean(document.getElementById('univSearchInput')),
            hasTypeSelect: Boolean(document.getElementById('univTypeSelect')),
            hasModeSelect: Boolean(document.getElementById('univModeSelect')),
            hasSortSelect: Boolean(document.getElementById('univSortSelect')),
            hasResetBtn: Boolean(document.getElementById('univResetBtn')),
            hasTelemetry: Boolean(document.getElementById('univTelemetryBar')),
            cardCount: document.querySelectorAll('#eg-universities-grid .eg-dir-card').length,
            resultsText: document.getElementById('univResultsCountText')?.textContent?.trim(),
            pageIndicator: document.getElementById('univPageIndicatorText')?.textContent?.trim(),
            paginationBtns: document.querySelectorAll('#univPaginationSection .eg-page-btn').length
        };
    });
    console.log('Universities Page Elements:', JSON.stringify(univElements, null, 2));
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'after_08_universities_hero_search.png'), fullPage: false });
    console.log('Captured after_08_universities_hero_search.png');

    // Scroll to grid & pagination
    await page.evaluate(() => {
        const grid = document.getElementById('eg-universities-grid');
        if (grid) grid.scrollIntoView({ behavior: 'instant', block: 'start' });
    });
    await new Promise(r => setTimeout(r, 300));
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'after_09_universities_grid_and_pagination.png'), fullPage: false });
    console.log('Captured after_09_universities_grid_and_pagination.png');

    // Test Search "Subharti"
    console.log('\nTesting Universities Search with "Subharti"...');
    await page.evaluate(() => {
        window.scrollTo(0, 0);
    });
    await new Promise(r => setTimeout(r, 200));
    await page.type('#univSearchInput', 'Subharti', { delay: 50 });
    await new Promise(r => setTimeout(r, 350));
    const univSearchStats = await page.evaluate(() => {
        return {
            cardCount: document.querySelectorAll('#eg-universities-grid .eg-dir-card').length,
            firstTitle: document.querySelector('#eg-universities-grid .eg-dir-title')?.textContent?.trim(),
            clearBtnVisible: document.getElementById('univSearchClearBtn')?.style?.display !== 'none',
            chipText: document.getElementById('univActiveFilterChips')?.textContent?.trim()
        };
    });
    console.log('Search "Subharti" stats:', univSearchStats);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'after_10_universities_search_subharti.png'), fullPage: false });
    console.log('Captured after_10_universities_search_subharti.png');

    // Clear search
    await page.click('#univSearchClearBtn');
    await new Promise(r => setTimeout(r, 300));

    // Test Mode Filter "distance"
    console.log('\nTesting Universities Mode Filter "distance"...');
    await page.select('#univModeSelect', 'distance');
    await new Promise(r => setTimeout(r, 300));
    const modeStats = await page.evaluate(() => {
        return {
            cardCount: document.querySelectorAll('#eg-universities-grid .eg-dir-card').length,
            firstTitle: document.querySelector('#eg-universities-grid .eg-dir-title')?.textContent?.trim(),
            chipText: document.getElementById('univActiveFilterChips')?.textContent?.trim()
        };
    });
    console.log('Mode "distance" stats:', modeStats);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'after_11_universities_mode_distance.png'), fullPage: false });
    console.log('Captured after_11_universities_mode_distance.png');

    // Reset filters
    await page.click('#univResetBtn');
    await new Promise(r => setTimeout(r, 300));

    // Test University Details Modal
    console.log('\nTesting University Details Modal...');
    await page.evaluate(() => {
        const firstDetailsBtn = document.querySelector('#eg-universities-grid .eg-btn-dir-details');
        if (firstDetailsBtn) firstDetailsBtn.click();
    });
    await new Promise(r => setTimeout(r, 500));
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'after_12_universities_modal_details.png'), fullPage: false });
    console.log('Captured after_12_universities_modal_details.png');
    await page.evaluate(() => $('#univDetailModal').modal('hide'));
    await new Promise(r => setTimeout(r, 300));

    console.log('\n--- Console Errors Check ---');
    console.log('Console Errors count:', consoleErrors.length);
    if (consoleErrors.length > 0) {
        console.warn('Console Errors:', consoleErrors);
    }

    await browser.close();
    console.log('\nAll tests completed and screenshots captured successfully!');
}

run().catch(err => {
    console.error('Fatal Verification Error:', err);
    process.exit(1);
});
