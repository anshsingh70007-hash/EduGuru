const puppeteer = require('puppeteer');

(async () => {
    try {
        const browser = await puppeteer.launch({
            headless: 'new',
            executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = await browser.newPage();
        const consoleLogs = [];
        page.on('console', msg => consoleLogs.push(msg.text()));
        page.on('pageerror', err => consoleLogs.push('PAGE_ERROR: ' + err.message));

        // Bypass auth in localStorage
        await page.goto('http://localhost:3000/edit/', { waitUntil: 'networkidle2' });
        await page.evaluate(() => {
            localStorage.setItem('eg_cms_auth', 'true');
            localStorage.setItem('eg_cms_user', JSON.stringify({ name: 'Admin', role: 'Super Admin' }));
        });
        await page.reload({ waitUntil: 'networkidle2' });

        console.log('--- ALL CONSOLE LOGS ON LOAD ---');
        consoleLogs.forEach(l => console.log(l));

        // Switch to tab headers
        const tabClicked = await page.evaluate(() => {
            const tab = document.querySelector('.menu-item[data-tab="headers"]');
            if (tab) {
                tab.click();
                return true;
            }
            return false;
        });
        console.log('\nHeaders tab clicked:', tabClicked);

        await new Promise(r => setTimeout(r, 600));

        // Check state of siteMenu and headers container
        const tabState = await page.evaluate(() => {
            const container = document.getElementById('allNavHeadersContainer');
            return {
                containerExists: !!container,
                hasHeaderCards: container ? container.querySelectorAll('.header-nav-card').length : 0,
                htmlPreview: container ? container.innerHTML.slice(0, 300) : ''
            };
        });
        console.log('Tab State:', tabState);

        // Test clicking Add Navigation Header button
        const addHeaderTest = await page.evaluate(() => {
            const btn = document.getElementById('openAddHeaderBtn');
            if (btn) btn.click();
            const modal = document.getElementById('headerModal');
            return {
                btnFound: !!btn,
                modalFound: !!modal,
                modalClasses: modal ? modal.className : null,
                modalVisible: modal ? window.getComputedStyle(modal).display : null,
                modalTitle: modal ? document.getElementById('headerModalTitle')?.textContent : null
            };
        });
        console.log('Add Header Modal Check:', addHeaderTest);

        // Test closing modal
        await page.evaluate(() => {
            if (window.closeHeaderModal) window.closeHeaderModal();
        });

        // Test clicking first Sub-Links button
        const subLinksTest = await page.evaluate(() => {
            const firstSubLinkBtn = document.querySelector('.header-nav-card button[onclick*="openSubLinksModal"]');
            if (firstSubLinkBtn) firstSubLinkBtn.click();
            const modal = document.getElementById('subLinksModal');
            return {
                firstSubLinkBtnFound: !!firstSubLinkBtn,
                modalFound: !!modal,
                modalClasses: modal ? modal.className : null,
                modalVisible: modal ? window.getComputedStyle(modal).display : null,
                subLinksListHtml: document.getElementById('subLinksListContainer')?.innerHTML?.slice(0, 200)
            };
        });
        console.log('Sub-Links Modal Check:', subLinksTest);

        // Test clicking Save Announcement
        const saveAnnounceTest = await page.evaluate(async () => {
            const btn = document.getElementById('saveAnnouncementBtn');
            if (btn) btn.click();
            return {
                btnFound: !!btn
            };
        });
        console.log('Save Announcement Button Check:', saveAnnounceTest);

        await new Promise(r => setTimeout(r, 500));
        console.log('\n--- CONSOLE LOGS AFTER ACTIONS ---');
        consoleLogs.forEach(l => console.log(l));

        await browser.close();
    } catch (e) {
        console.error('Test failed:', e);
        process.exit(1);
    }
})();
