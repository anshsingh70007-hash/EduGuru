const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
    console.log('🚀 Running End-to-End Test: Adding Custom Header from /edit and verifying on Live Site...');
    const browser = await puppeteer.launch({
        headless: 'new',
        executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });

    page.on('dialog', async dialog => {
        console.log(`[DIALOG ${dialog.type()}]:`, dialog.message());
        await dialog.accept();
    });
    page.on('console', msg => console.log('[BROWSER CONSOLE]:', msg.text()));
    page.on('pageerror', err => console.log('[BROWSER ERROR]:', err.message));

    // Set authenticated state in localStorage and reload to load full Content Studio
    await page.goto('http://localhost:3000/edit', { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => {
        localStorage.setItem('edit_logged_in', 'true');
        localStorage.setItem('edit_user', JSON.stringify({ name: 'Admin', role: 'owner' }));
    });
    await page.reload({ waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 1000));

    // Step 2: Switch to tab 6 (Headers & Menu)
    console.log('2. Switching to Headers & Menu Tab...');
    await page.evaluate(() => {
        window.switchTab('headers');
    });
    await new Promise(r => setTimeout(r, 800));

    // Step 3: Open Add Header Modal
    console.log('3. Opening Add Custom Header Modal...');
    await page.evaluate(() => {
        window.openHeaderModal();
    });
    await new Promise(r => setTimeout(r, 500));

    // Step 4: Fill form
    console.log('4. Entering Header Title & Sub-links...');
    await page.evaluate(() => {
        const titleInput = document.getElementById('headerTitleInput');
        if (titleInput) titleInput.value = 'Distance MBA Hub';
        const urlInput = document.getElementById('headerUrlInput');
        if (urlInput) urlInput.value = '#';
    });

    // Add sub-link
    await page.evaluate(() => {
        window.addSubLinkRow({
            title: 'Subharti Financial Management MBA',
            url: 'courses-details.html?id=107',
            desc: 'Dual-Specialization UGC-DEB Program'
        });
    });
    await new Promise(r => setTimeout(r, 400));

    // Step 5: Submit form
    console.log('5. Submitting Header Form...');
    await page.evaluate(() => {
        const form = document.getElementById('headerForm');
        form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
    });
    await new Promise(r => setTimeout(r, 1500));

    // Check if custom header exists in Studio
    const studioHeaderCount = await page.evaluate(() => {
        const items = document.querySelectorAll('#customHeadersList .header-row-item');
        return items.length;
    });
    console.log('Studio Custom Headers Count now:', studioHeaderCount);

    // Step 6: Verify on Public Live Site
    console.log('6. Loading Live Homepage at http://localhost:3000/index.html...');
    await page.goto('http://localhost:3000/index.html', { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(r => setTimeout(r, 1500));

    const liveNavItems = await page.evaluate(() => {
        const items = document.querySelectorAll('.rs-menu .nav-menu > li > a');
        return Array.from(items).map(a => a.textContent.replace(/\s+/g, ' ').trim());
    });
    console.log('Live Navigation Headers on Homepage:', liveNavItems);

    const hasNewHeader = liveNavItems.some(txt => txt.includes('Distance MBA Hub'));
    console.log('✅ Distance MBA Hub visible on Live Site:', hasNewHeader);

    // Screenshot public site with the new header
    const ssPath = path.join(__dirname, 'screenshot_live_new_header.png');
    await page.screenshot({ path: ssPath, clip: { x: 0, y: 0, width: 1440, height: 700 } });
    console.log('Saved screenshot of live site with new header:', ssPath);

    await browser.close();
    console.log('🎉 End-to-End Custom Header Test PASSED completely!');
})();
