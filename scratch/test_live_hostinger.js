const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({
        executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
        headless: 'new'
    });
    const page = await browser.newPage();
    const errors = [];
    const logs = [];
    page.on('console', msg => {
        logs.push(`[${msg.type()}] ${msg.text()}`);
        if (msg.type() === 'error') errors.push(msg.text());
    });
    page.on('pageerror', err => errors.push(err.message));

    console.log('Navigating to live https://educationistguru.com/courses.html...');
    try {
        await page.goto('https://educationistguru.com/courses.html', { waitUntil: 'networkidle2', timeout: 30000 });
        await new Promise(r => setTimeout(r, 2000));

        console.log('Browser Console Logs (first 20):\n', logs.slice(0, 20).join('\n'));
        console.log('Browser Errors on live site:\n', errors.join('\n'));

        const navHtml = await page.$eval('#eg-pagination-nav', el => el.innerHTML);
        console.log('Live Pagination Nav length:', navHtml.trim().length);
        console.log('Live Pagination Nav:', navHtml.trim().slice(0, 300));

        const count = await page.$eval('#eg-results-count-text', el => el.textContent.trim());
        console.log('Live results count:', count);

        // Test search on live site
        console.log('Testing live search typing MBA...');
        await page.type('#eg-course-search-input', 'MBA');
        await new Promise(r => setTimeout(r, 500));
        const countAfterSearch = await page.$eval('#eg-results-count-text', el => el.textContent.trim());
        console.log('Live results count after search:', countAfterSearch);

    } catch (e) {
        console.error('Test error:', e.message);
    } finally {
        await browser.close();
    }
})();
