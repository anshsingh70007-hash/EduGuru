const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({
        headless: 'new',
        executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1400, height: 900 });

    const consoleMessages = [];
    page.on('console', msg => consoleMessages.push(`[${msg.type()}] ${msg.text()}`));
    page.on('pageerror', err => consoleMessages.push(`[PAGE_ERROR] ${err.toString()}`));

    console.log('1. Going to /edit ...');
    await page.goto('http://localhost:3000/edit/', { waitUntil: 'networkidle0' });

    // Login via evaluate
    console.log('2. Logging in...');
    await page.evaluate(() => {
        localStorage.setItem('edit_logged_in', 'true');
        localStorage.setItem('edit_user', JSON.stringify({ name: 'Admin', role: 'owner', email: 'admin@educationistguru.com' }));
        location.reload();
    });

    await page.waitForNavigation({ waitUntil: 'networkidle0' });
    console.log('3. Logged in. Checking app view...');

    const appVisible = await page.evaluate(() => {
        const app = document.getElementById('editApp');
        return app && app.style.display !== 'none';
    });
    console.log('App visible:', appVisible);

    // Switch to Tab 6 (headers)
    console.log('4. Switching to tab "headers"...');
    await page.evaluate(() => {
        const item = document.querySelector('.menu-item[data-tab="headers"]');
        if (item) item.click();
        else if (window.switchTab) window.switchTab('headers');
    });

    await new Promise(r => setTimeout(r, 600));

    // Check if Tab 6 is active
    const tab6Active = await page.evaluate(() => {
        const pane = document.getElementById('tab-headers');
        return pane ? pane.classList.contains('active') : false;
    });
    console.log('Tab 6 pane active:', tab6Active);

    // Check headers container content
    const headersContent = await page.evaluate(() => {
        const c = document.getElementById('allNavHeadersContainer');
        return {
            cardsCount: c ? c.querySelectorAll('.header-nav-card').length : 0,
            innerHtmlSnippet: c ? c.innerHTML.slice(0, 300) : 'null'
        };
    });
    console.log('Tab 6 headers content:', headersContent);

    // Test clicking "Add Navigation Header" button
    console.log('5. Clicking "Add Navigation Header" (#openAddHeaderBtn)...');
    await page.evaluate(() => {
        const btn = document.getElementById('openAddHeaderBtn');
        if (btn) btn.click();
    });
    await new Promise(r => setTimeout(r, 300));
    const headerModalOpen = await page.evaluate(() => {
        const m = document.getElementById('headerModal');
        return m ? m.classList.contains('open') : false;
    });
    console.log('Header Modal Open after click:', headerModalOpen);

    // Close it
    await page.evaluate(() => {
        if (window.closeHeaderModal) window.closeHeaderModal();
    });

    // Test clicking "Save Announcement" button
    console.log('6. Clicking "Save Announcement" (#saveAnnouncementBtn)...');
    await page.evaluate(() => {
        const btn = document.getElementById('saveAnnouncementBtn');
        if (btn) btn.click();
    });
    await new Promise(r => setTimeout(r, 400));

    // Test clicking "Sub-Links" button on first card
    console.log('7. Clicking "Sub-Links" on first card with dropdown...');
    await page.evaluate(() => {
        const subLinksBtns = Array.from(document.querySelectorAll('.header-nav-card button')).filter(b => b.textContent.includes('Sub-Links'));
        if (subLinksBtns.length > 0) subLinksBtns[0].click();
    });
    await new Promise(r => setTimeout(r, 400));

    const subLinksModalOpen = await page.evaluate(() => {
        const m = document.getElementById('subLinksModal');
        return m ? m.classList.contains('open') : false;
    });
    console.log('Sub-Links Modal Open after click:', subLinksModalOpen);

    // Check all console messages
    console.log('\n--- BROWSER CONSOLE LOGS ---');
    consoleMessages.forEach(m => console.log(m));

    await browser.close();
})();
