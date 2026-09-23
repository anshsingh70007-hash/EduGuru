const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({
        executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
        headless: 'new'
    });
    const page = await browser.newPage();
    await page.goto('http://localhost:3000/courses.html', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 600));

    const html = await page.$eval('#eg-pagination-nav', el => el.innerHTML);
    console.log('PAGINATION NAV HTML:\n', html);

    const buttons = await page.$$eval('#eg-pagination-nav button', btns => 
        btns.map(b => ({ text: b.textContent.trim(), onclick: b.getAttribute('onclick'), disabled: b.disabled }))
    );
    console.log('BUTTONS:\n', JSON.stringify(buttons, null, 2));

    console.log('Calling window.gotoCoursePage(2) directly via evaluate...');
    await page.evaluate(() => window.gotoCoursePage(2));
    await new Promise(r => setTimeout(r, 600));

    const page2Count = await page.$eval('#eg-results-count-text', el => el.textContent.trim());
    console.log('Results count text after evaluate gotoCoursePage(2):', page2Count);

    await browser.close();
})();
