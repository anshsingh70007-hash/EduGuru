const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

(async () => {
    const browser = await puppeteer.launch({
        headless: 'new',
        executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });

    console.log('=== TEST 1: HOME PAGE TOP BAR INSPECTION ===');
    await page.goto('http://localhost:3000/index.html', { waitUntil: 'networkidle0' });
    await page.screenshot({ path: 'scratch/test_home_topbar.png', clip: { x: 0, y: 0, width: 1440, height: 260 } });
    console.log('Saved scratch/test_home_topbar.png');

    const navOverlapCheck = await page.evaluate(() => {
        const lastItem = document.querySelector('.rs-menu ul.nav-menu > li:last-child');
        const rightBar = document.querySelector('.right-bar-icon');
        const searchBtn = document.querySelector('.rs-search');
        if (!lastItem || !rightBar) return { error: 'elements not found' };
        const lastRect = lastItem.getBoundingClientRect();
        const rightRect = rightBar.getBoundingClientRect();
        const searchRect = searchBtn ? searchBtn.getBoundingClientRect() : null;
        return {
            lastItemText: lastItem.textContent.trim().replace(/\s+/g, ' '),
            lastItemRect: { left: lastRect.left, right: lastRect.right, top: lastRect.top, width: lastRect.width },
            rightBarRect: { left: rightRect.left, right: rightRect.right, top: rightRect.top, width: rightRect.width },
            searchRect: searchRect ? { left: searchRect.left, right: searchRect.right } : null,
            collides: lastRect.right > rightRect.left
        };
    });
    console.log('Nav overlap analysis:', navOverlapCheck);

    console.log('\n=== TEST 2: UNIVERSITIES CLICK & MODAL OPENING ===');
    await page.goto('http://localhost:3000/universities.html', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 600));

    // Test clicking card 1 (image or title)
    console.log('Clicking first university card title...');
    const cardTitleFound = await page.evaluate(() => {
        const titleLink = document.querySelector('.eg-dir-title a');
        if (titleLink) {
            titleLink.click();
            return true;
        }
        return false;
    });
    console.log('Clicked card title link:', cardTitleFound);
    await new Promise(r => setTimeout(r, 600));

    const modalStateAfterClick = await page.evaluate(() => {
        const modal = document.getElementById('univDetailModal');
        if (!modal) return { exists: false };
        return {
            exists: true,
            hasClassShow: modal.classList.contains('show'),
            display: window.getComputedStyle(modal).display,
            title: modal.querySelector('.modal-title') ? modal.querySelector('.modal-title').textContent.trim() : 'no title'
        };
    });
    console.log('Modal state after title click:', modalStateAfterClick);

    // Test deep link with slug
    console.log('\nTesting deep-link with slug: /universities.html?id=asian-international-university ...');
    await page.goto('http://localhost:3000/universities.html?id=asian-international-university', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 800));

    const deepLinkState = await page.evaluate(() => {
        const modal = document.getElementById('univDetailModal');
        if (!modal) return { exists: false };
        return {
            exists: true,
            hasClassShow: modal.classList.contains('show'),
            display: window.getComputedStyle(modal).display,
            title: modal.querySelector('.modal-title') ? modal.querySelector('.modal-title').textContent.trim() : 'no title'
        };
    });
    console.log('Deep-link modal state (asian-international-university):', deepLinkState);

    console.log('\n=== TEST 3: EDIT WYSIWYG FULLSCREEN ===');
    await page.goto('http://localhost:3000/edit/', { waitUntil: 'networkidle0' });
    await page.evaluate(() => {
        localStorage.setItem('edit_logged_in', 'true');
        localStorage.setItem('edit_user', JSON.stringify({ name: 'Admin', role: 'owner', email: 'admin@educationistguru.com' }));
        location.reload();
    });
    await page.waitForNavigation({ waitUntil: 'networkidle0' });

    // Open blog modal
    console.log('Opening blog modal in edit...');
    await page.evaluate(() => {
        if (window.openBlogModal) window.openBlogModal();
    });
    await new Promise(r => setTimeout(r, 400));

    // Click fullscreen
    console.log('Clicking fullscreen button (#blogFullscreenBtn)...');
    await page.evaluate(() => {
        const btn = document.getElementById('blogFullscreenBtn');
        if (btn) btn.click();
    });
    await new Promise(r => setTimeout(r, 400));

    const fullscreenMetrics = await page.evaluate(() => {
        const editor = document.getElementById('blogEditorContainer');
        const modalDialog = document.querySelector('#blogModal .modal-dialog');
        const modalOverlay = document.getElementById('blogModal');
        return {
            editorRect: editor ? editor.getBoundingClientRect() : null,
            modalDialogRect: modalDialog ? modalDialog.getBoundingClientRect() : null,
            modalOverlayRect: modalOverlay ? modalOverlay.getBoundingClientRect() : null,
            windowSize: { width: window.innerWidth, height: window.innerHeight },
            hasFullscreenClass: editor ? editor.classList.contains('fullscreen-editor') : false
        };
    });
    console.log('Fullscreen metrics:', fullscreenMetrics);
    await page.screenshot({ path: 'scratch/test_editor_fullscreen.png' });
    console.log('Saved scratch/test_editor_fullscreen.png');

    await browser.close();
    console.log('\nAll diagnostic probes complete!');
})();
