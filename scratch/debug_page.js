const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({
        headless: 'new',
        executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    const logs = [];
    page.on('console', msg => logs.push(msg.text()));
    page.on('pageerror', err => logs.push('ERROR: ' + err.message));

    await page.goto('http://localhost:3000/edit/', { waitUntil: 'networkidle2' });
    await page.evaluate(() => {
        localStorage.setItem('edit_logged_in', 'true');
        localStorage.setItem('edit_user', JSON.stringify({ name: 'Admin', role: 'owner' }));
    });
    await page.reload({ waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 600));

    // Click headers tab
    await page.evaluate(() => {
        const item = document.querySelector('.menu-item[data-tab="headers"]');
        if (item) item.click();
    });
    await new Promise(r => setTimeout(r, 600));

    const html = await page.evaluate(() => {
        const container = document.getElementById('allNavHeadersContainer');
        const cards = container ? container.querySelectorAll('.header-nav-card') : [];
        const titles = Array.from(cards).map(c => c.querySelector('.header-nav-title strong')?.textContent?.trim());
        return {
            containerExists: !!container,
            cardCount: cards.length,
            titles: titles
        };
    });
    console.log('Result with proper auth:', html);

    await browser.close();
})();
