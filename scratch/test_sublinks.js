const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({
        headless: 'new',
        executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.goto('http://localhost:3000/edit/', { waitUntil: 'networkidle2' });
    await page.evaluate(() => {
        localStorage.setItem('edit_logged_in', 'true');
        localStorage.setItem('edit_user', JSON.stringify({ name: 'Admin', role: 'owner' }));
    });
    await page.reload({ waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 600));

    // Click headers tab
    await page.evaluate(() => {
        document.querySelector('.menu-item[data-tab="headers"]').click();
    });
    await new Promise(r => setTimeout(r, 600));

    // Open Sub-Links for Subharti MBA
    const subLinksCheck = await page.evaluate(() => {
        window.openSubLinksModal('subharti-mba-hub');
        const m = document.getElementById('subLinksModal');
        const rows = m ? m.querySelectorAll('.sublink-row-item') : [];
        const titles = Array.from(rows).map(r => r.querySelector('input[placeholder="Title"]')?.value);
        return {
            modalOpen: m && m.classList.contains('open'),
            titleCount: titles.length,
            titles: titles
        };
    });
    console.log('Subharti MBA Sub-Links Check:', subLinksCheck);

    // Open Sub-Links for Boards & Open School
    const boardsCheck = await page.evaluate(() => {
        window.openSubLinksModal('boards');
        const m = document.getElementById('subLinksModal');
        const rows = m ? m.querySelectorAll('.sublink-row-item') : [];
        const titles = Array.from(rows).map(r => r.querySelector('input[placeholder="Title"]')?.value);
        return {
            modalOpen: m && m.classList.contains('open'),
            titleCount: titles.length,
            titles: titles
        };
    });
    console.log('Boards Sub-Links Check:', boardsCheck);

    await browser.close();
})();
