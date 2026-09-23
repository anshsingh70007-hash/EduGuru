const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({
        executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
        headless: 'new'
    });
    const page = await browser.newPage();
    page.on('response', res => {
        if (res.status() >= 400) {
            console.log('FAILED RESPONSE:', res.status(), res.url());
        }
    });
    await page.goto('https://educationistguru.com/courses.html', { waitUntil: 'domcontentloaded' });
    console.log('Final URL:', page.url());
    console.log('Title:', await page.title());
    const hasNav = (await page.$('#eg-pagination-nav')) !== null;
    console.log('Has #eg-pagination-nav:', hasNav);
    const content = await page.content();
    console.log('Body length:', content.length);
    if (!hasNav) {
        console.log('Page HTML snippet:\n', content.slice(0, 1000));
    }
    await browser.close();
})();
