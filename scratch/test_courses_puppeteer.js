const puppeteer = require('puppeteer');

(async () => {
    console.log('🚀 Launching Headless Edge to test courses.html...');
    const browser = await puppeteer.launch({
        executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
        headless: 'new'
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 900 });

    const consoleErrors = [];
    page.on('console', msg => {
        if (msg.type() === 'error') {
            console.error('Browser console error:', msg.text());
            consoleErrors.push(msg.text());
        }
    });
    page.on('pageerror', err => {
        console.error('Browser uncaught page error:', err.message);
        consoleErrors.push(err.message);
    });

    console.log('1. Navigating to http://localhost:3000/courses.html...');
    await page.goto('http://localhost:3000/courses.html', { waitUntil: 'networkidle0' });

    // Wait a short moment for courses-manager.js initialization
    await new Promise(r => setTimeout(r, 600));

    // Check course cards rendered
    const cardCount = await page.$$eval('#eg-courses-grid .eg-course-card', els => els.length);
    console.log('2. Number of course cards on Page 1:', cardCount);
    if (cardCount !== 6) throw new Error(`Expected 6 cards on Page 1, but found ${cardCount}`);

    // Check telemetry text
    const telemetryText = await page.$eval('#eg-results-count-text', el => el.textContent.trim());
    const pageText = await page.$eval('#eg-page-indicator-text', el => el.textContent.trim());
    console.log('3. Telemetry count:', telemetryText);
    console.log('4. Page indicator:', pageText);
    if (!telemetryText.includes('Showing 1–6 of 106 courses')) {
        throw new Error(`Unexpected telemetry: ${telemetryText}`);
    }

    // Test Pagination: Click "Next"
    console.log('5. Clicking "Next" pagination button...');
    await page.evaluate(() => {
        const btn = document.querySelector('button[aria-label="Next Page"]');
        if (btn) btn.click();
    });
    await new Promise(r => setTimeout(r, 600));

    const page2Telemetry = await page.$eval('#eg-results-count-text', el => el.textContent.trim());
    const page2Indicator = await page.$eval('#eg-page-indicator-text', el => el.textContent.trim());
    console.log('6. Page 2 Telemetry:', page2Telemetry);
    console.log('7. Page 2 Indicator:', page2Indicator);
    if (!page2Telemetry.includes('Showing 7–12 of 106 courses')) {
        throw new Error(`Expected page 2 telemetry (7–12), but got: ${page2Telemetry}`);
    }

    // Wait for smooth scroll to finish
    await new Promise(r => setTimeout(r, 1000));

    // Click "Prev" button to return to Page 1
    console.log('8. Clicking "Prev" pagination button...');
    const navHtml = await page.$eval('#eg-pagination-nav', el => el.innerHTML);
    console.log('Nav HTML on Page 2:', navHtml);

    // Click using page.evaluate to directly click the Prev button
    await page.evaluate(() => {
        const prev = document.querySelector('#eg-pagination-nav .eg-page-arrow');
        console.log('Prev button disabled?', prev ? prev.disabled : 'not found');
        if (prev) prev.click();
    });
    await new Promise(r => setTimeout(r, 600));

    const page1ReturnTelemetry = await page.$eval('#eg-results-count-text', el => el.textContent.trim());
    console.log('9. Returned to Page 1:', page1ReturnTelemetry);
    if (!page1ReturnTelemetry.includes('Showing 1–6 of 106 courses')) {
        throw new Error(`Expected page 1 return telemetry, but got: ${page1ReturnTelemetry}`);
    }

    // Test Live Search Bar: Type "MBA"
    console.log('10. Testing Live Search: Typing "MBA" in #eg-course-search-input...');
    await page.click('#eg-course-search-input');
    await page.type('#eg-course-search-input', 'MBA');
    await new Promise(r => setTimeout(r, 500));

    const searchTelemetry = await page.$eval('#eg-results-count-text', el => el.textContent.trim());
    console.log('11. Search results telemetry:', searchTelemetry);
    const searchCards = await page.$$eval('#eg-courses-grid .eg-course-card', els => els.map(e => e.textContent));
    const allContainMba = searchCards.every(t => t.includes('MBA') || t.includes('Management') || t.includes('Master of Business Administration'));
    console.log('12. All search cards relevant to MBA:', allContainMba);

    // Test Clear Search Button
    console.log('13. Testing Clear Search button...');
    await page.click('#eg-search-clear-btn');
    await new Promise(r => setTimeout(r, 500));
    const clearedTelemetry = await page.$eval('#eg-results-count-text', el => el.textContent.trim());
    console.log('14. Cleared telemetry:', clearedTelemetry);
    if (!clearedTelemetry.includes('Showing 1–6 of 106 courses')) {
        throw new Error(`Expected 106 courses after clear, got: ${clearedTelemetry}`);
    }

    // Test Faculty Dropdown Filter
    console.log('15. Testing Faculty dropdown filter: "Faculty of Law"...');
    await page.select('#eg-faculty-filter', 'Faculty of Law');
    await new Promise(r => setTimeout(r, 500));
    const lawTelemetry = await page.$eval('#eg-results-count-text', el => el.textContent.trim());
    console.log('16. Law faculty results:', lawTelemetry);

    // Test Reset All Button
    console.log('17. Testing Reset All Filters button...');
    await page.click('.eg-reset-btn');
    await new Promise(r => setTimeout(r, 500));
    const resetTelemetry = await page.$eval('#eg-results-count-text', el => el.textContent.trim());
    console.log('18. Reset All telemetry:', resetTelemetry);
    if (!resetTelemetry.includes('Showing 1–6 of 106 courses')) {
        throw new Error(`Expected reset to 106 courses, got: ${resetTelemetry}`);
    }

    console.log('19. Total browser console errors:', consoleErrors.length);
    if (consoleErrors.length > 0) {
        console.error('Console errors:', consoleErrors);
        throw new Error('Uncaught browser console errors detected!');
    }

    await browser.close();
    console.log('🏆 ALL REAL BROWSER (EDGE) PUPPETEER TESTS PASSED WITH 100% SUCCESS!');
})().catch(err => {
    console.error('❌ Puppeteer test failed:', err);
    process.exit(1);
});
