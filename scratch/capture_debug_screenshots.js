const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
    const browser = await puppeteer.launch({
        headless: 'new',
        executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1366, height: 800 });

    const errors = [];
    page.on('console', msg => {
        if (msg.type() === 'error') {
            errors.push(msg.text());
        }
    });
    page.on('pageerror', err => {
        errors.push(err.toString());
    });

    console.log('Navigating to http://localhost:3000 ...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
    await page.screenshot({ path: path.join(__dirname, 'screenshot_home.png') });

    console.log('Home page errors:', errors);

    console.log('Navigating to http://localhost:3000/edit/ ...');
    const editErrors = [];
    page.on('console', msg => {
        if (msg.type() === 'error') editErrors.push(msg.text());
    });
    page.on('pageerror', err => editErrors.push(err.toString()));

    await page.goto('http://localhost:3000/edit/', { waitUntil: 'networkidle0' });
    await page.screenshot({ path: path.join(__dirname, 'screenshot_edit.png') });

    console.log('Edit page errors:', editErrors);

    // Let's click Tab 6 on Edit page
    console.log('Clicking Tab 6 (Headers) in /edit ...');
    const tab6Btn = await page.$('.tab-btn[data-tab="tab-headers"]');
    if (tab6Btn) {
        await tab6Btn.click();
        await new Promise(r => setTimeout(r, 600));
        await page.screenshot({ path: path.join(__dirname, 'screenshot_edit_tab6.png') });
    } else {
        console.log('Tab 6 button not found!');
    }

    // Let's test opening Blog Modal
    console.log('Testing Blog Modal in /edit ...');
    const tabBlogBtn = await page.$('.tab-btn[data-tab="tab-blogs"]');
    if (tabBlogBtn) {
        await tabBlogBtn.click();
        await new Promise(r => setTimeout(r, 400));
        await page.evaluate(() => {
            if (window.openBlogModal) window.openBlogModal();
        });
        await new Promise(r => setTimeout(r, 500));
        await page.screenshot({ path: path.join(__dirname, 'screenshot_blog_modal.png') });

        // Click Fullscreen
        console.log('Clicking Fullscreen button...');
        await page.evaluate(() => {
            const btn = document.getElementById('blogFullscreenBtn');
            if (btn) btn.click();
        });
        await new Promise(r => setTimeout(r, 500));
        await page.screenshot({ path: path.join(__dirname, 'screenshot_blog_fullscreen.png') });
    }

    // Check universities page clicking
    console.log('Navigating to http://localhost:3000/universities ...');
    await page.goto('http://localhost:3000/universities', { waitUntil: 'networkidle0' });
    await page.screenshot({ path: path.join(__dirname, 'screenshot_universities.png') });

    // Click on a university
    console.log('Clicking on first university card or details button...');
    const clicked = await page.evaluate(() => {
        const btn = document.querySelector('.univ-card, .btn-view-details, [onclick*="showUnivDetails"]');
        if (btn) {
            btn.click();
            return true;
        }
        return false;
    });
    console.log('Clicked university card:', clicked);
    await new Promise(r => setTimeout(r, 800));
    await page.screenshot({ path: path.join(__dirname, 'screenshot_univ_modal_opened.png') });

    await browser.close();
    console.log('Done capturing screenshots and inspecting state.');
})();
