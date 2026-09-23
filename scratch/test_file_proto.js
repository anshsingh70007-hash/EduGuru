const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
    console.log('Testing file:/// protocol in Microsoft Edge...');
    const browser = await puppeteer.launch({
        executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
        headless: 'new'
    });

    const page = await browser.newPage();
    const consoleLogs = [];
    const consoleErrors = [];

    page.on('console', msg => {
        const text = msg.text();
        consoleLogs.push(`[${msg.type()}] ${text}`);
        if (msg.type() === 'error') consoleErrors.push(text);
    });
    page.on('pageerror', err => {
        consoleErrors.push(err.message);
    });

    const filePath = 'file:///' + path.resolve(__dirname, '..', 'courses.html').replace(/\\/g, '/');
    console.log('Opening:', filePath);

    await page.goto(filePath, { waitUntil: 'load' });
    await new Promise(r => setTimeout(r, 2000));

    console.log('Console Logs:\n', consoleLogs.join('\n'));
    console.log('Console Errors:\n', consoleErrors.join('\n'));

    const navHtml = await page.$eval('#eg-pagination-nav', el => el.innerHTML);
    console.log('Pagination Nav HTML length:', navHtml.trim().length);
    console.log('Pagination Nav HTML:', navHtml.trim());

    const resultsCount = await page.$eval('#eg-results-count-text', el => el.textContent.trim());
    console.log('Results count text:', resultsCount);

    await browser.close();
})();
