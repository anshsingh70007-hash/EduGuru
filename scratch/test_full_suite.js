const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({
        headless: 'new',
        executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
        const page = await browser.newPage();
        await page.setViewport({ width: 1400, height: 900 });

        const errors = [];
        page.on('console', msg => {
            if (msg.type() === 'error') errors.push(msg.text());
        });
        page.on('pageerror', err => errors.push('PAGE_ERROR: ' + err.message));

        console.log('=== TEST 1: /edit HEADERS & MENU TAB ===');
        await page.goto('http://localhost:3000/edit/', { waitUntil: 'networkidle2' });
        await page.evaluate(() => {
            localStorage.setItem('edit_logged_in', 'true');
            localStorage.setItem('edit_user', JSON.stringify({ name: 'Admin', role: 'owner' }));
        });
        await page.reload({ waitUntil: 'networkidle2' });
        await new Promise(r => setTimeout(r, 600));

        // Switch to Headers tab
        await page.evaluate(() => {
            document.querySelector('.menu-item[data-tab="headers"]').click();
        });
        await new Promise(r => setTimeout(r, 600));

        const headersState = await page.evaluate(() => {
            const container = document.getElementById('allNavHeadersContainer');
            const cards = container ? container.querySelectorAll('.header-nav-card') : [];
            const titles = Array.from(cards).map(c => c.querySelector('.header-nav-title strong')?.textContent?.trim());
            return {
                cardCount: cards.length,
                titles: titles
            };
        });
        console.log('Headers Count:', headersState.cardCount, '\nTitles:', headersState.titles);

        // Click Add Navigation Header
        const addHeaderModalOpen = await page.evaluate(() => {
            document.getElementById('openAddHeaderBtn').click();
            const m = document.getElementById('headerModal');
            return m && m.classList.contains('open') && window.getComputedStyle(m).display === 'flex';
        });
        console.log('Add Header Modal Opened:', addHeaderModalOpen);
        await page.evaluate(() => window.closeHeaderModal());

        // Test Sub-Links modal on item with sub-links (Subharti MBA or Boards)
        const subLinksModalOpen = await page.evaluate(() => {
            const subLinksBtn = Array.from(document.querySelectorAll('.header-nav-card button')).find(b => b.textContent.includes('Sub-Links'));
            if (subLinksBtn) subLinksBtn.click();
            const m = document.getElementById('subLinksModal');
            const rows = m ? m.querySelectorAll('.sublink-row-item').length : 0;
            return {
                opened: m && m.classList.contains('open') && window.getComputedStyle(m).display === 'flex',
                sublinkRows: rows
            };
        });
        console.log('Sub-Links Modal Opened:', subLinksModalOpen.opened, 'Row Count:', subLinksModalOpen.sublinkRows);
        await page.evaluate(() => window.closeSubLinksModal());

        // Save Announcement Button
        const saveAnnouncementRes = await page.evaluate(async () => {
            const btn = document.getElementById('saveAnnouncementBtn');
            btn.click();
            await new Promise(r => setTimeout(r, 500));
            const toast = document.querySelector('.toast');
            return {
                toastText: toast ? toast.textContent : null
            };
        });
        console.log('Save Announcement Result:', saveAnnouncementRes.toastText);

        console.log('\n=== TEST 2: COURSE VISUAL EDITOR FULLSCREEN ===');
        await page.evaluate(() => window.openCourseModal());
        await new Promise(r => setTimeout(r, 400));

        const courseFullState = await page.evaluate(() => {
            const fsBtn = document.getElementById('courseFullscreenBtn');
            if (fsBtn) fsBtn.click();
            const modal = document.getElementById('courseModal');
            const container = document.getElementById('courseEditorContainer');
            const canvas = document.getElementById('courseVisualEditor');
            const formCard = container.closest('.form-group') || container.closest('.form-section-card');

            const mStyle = window.getComputedStyle(modal);
            const cStyle = window.getComputedStyle(container);
            const canStyle = window.getComputedStyle(canvas);

            return {
                hasModalActive: modal.classList.contains('fullscreen-modal-active'),
                hasEditorCard: formCard ? formCard.classList.contains('fullscreen-editor-card') : false,
                bodyHasClass: document.body.classList.contains('has-fullscreen-editor'),
                btnText: fsBtn.textContent.trim(),
                modalWidth: mStyle.width,
                modalHeight: mStyle.height,
                containerWidth: cStyle.width,
                containerHeight: cStyle.height,
                canvasPadding: canStyle.padding
            };
        });
        console.log('Course Editor Fullscreen State:', courseFullState);

        await page.screenshot({ path: 'scratch/test_course_fullscreen.png' });
        console.log('Saved scratch/test_course_fullscreen.png');

        // Test Escape key to exit fullscreen
        await page.keyboard.press('Escape');
        await new Promise(r => setTimeout(r, 300));
        const afterEscCourse = await page.evaluate(() => ({
            bodyHasClass: document.body.classList.contains('has-fullscreen-editor'),
            btnText: document.getElementById('courseFullscreenBtn').textContent.trim()
        }));
        console.log('Course Editor After Escape:', afterEscCourse);
        await page.evaluate(() => window.closeCourseModal());

        console.log('\n=== TEST 3: BLOG VISUAL EDITOR FULLSCREEN ===');
        await page.evaluate(() => window.openBlogModal());
        await new Promise(r => setTimeout(r, 400));

        const blogFullState = await page.evaluate(() => {
            const fsBtn = document.getElementById('blogFullscreenBtn');
            if (fsBtn) fsBtn.click();
            const modal = document.getElementById('blogModal');
            const container = document.getElementById('blogEditorContainer');
            const formCard = container.closest('.form-section-card');

            const mStyle = window.getComputedStyle(modal);
            const cStyle = window.getComputedStyle(container);

            return {
                hasModalActive: modal.classList.contains('fullscreen-modal-active'),
                hasEditorCard: formCard ? formCard.classList.contains('fullscreen-editor-card') : false,
                bodyHasClass: document.body.classList.contains('has-fullscreen-editor'),
                btnText: fsBtn.textContent.trim(),
                modalWidth: mStyle.width,
                modalHeight: mStyle.height,
                containerWidth: cStyle.width,
                containerHeight: cStyle.height
            };
        });
        console.log('Blog Editor Fullscreen State:', blogFullState);

        await page.screenshot({ path: 'scratch/test_blog_fullscreen.png' });
        console.log('Saved scratch/test_blog_fullscreen.png');

        await page.evaluate(() => {
            document.getElementById('blogFullscreenBtn').click();
        });
        await new Promise(r => setTimeout(r, 300));
        const afterBtnBlog = await page.evaluate(() => ({
            bodyHasClass: document.body.classList.contains('has-fullscreen-editor'),
            btnText: document.getElementById('blogFullscreenBtn').textContent.trim()
        }));
        console.log('Blog Editor After Toggle Back:', afterBtnBlog);
        await page.evaluate(() => window.closeBlogModal());

        console.log('\n=== TEST 4: UNIVERSITY MODAL CLICK & DIRECT LINK ===');
        await page.goto('http://localhost:3000/universities.html?id=asian-international-university', { waitUntil: 'networkidle2' });
        await new Promise(r => setTimeout(r, 1000));

        const univModalCheck = await page.evaluate(() => {
            const m = document.getElementById('univDetailModal');
            return {
                modalFound: !!m,
                modalOpen: m ? m.classList.contains('show') : false,
                display: m ? window.getComputedStyle(m).display : null,
                title: document.getElementById('univDetailModalTitle')?.textContent?.trim() || m?.querySelector('.modal-title')?.textContent?.trim()
            };
        });
        console.log('University Deep-Link Modal Check:', univModalCheck);

        // Also test clicking a university card directly
        await page.evaluate(() => {
            $('#univDetailModal').modal('hide');
        });
        await new Promise(r => setTimeout(r, 600));

        const clickCardTest = await page.evaluate(() => {
            const firstCard = document.querySelector('.eg-dir-card-media, .eg-dir-card-body');
            if (firstCard) firstCard.click();
            const m = document.getElementById('univDetailModal');
            return {
                firstCardFound: !!firstCard,
                modalOpenAfterClick: m ? m.classList.contains('show') : false
            };
        });
        console.log('University Direct Card Click Check:', clickCardTest);

        console.log('\n=== TEST 5: HOMEPAGE TOPBAR & MENU SPACING ===');
        await page.goto('http://localhost:3000/', { waitUntil: 'networkidle2' });
        await new Promise(r => setTimeout(r, 600));

        const homeCheck = await page.evaluate(() => {
            const topBar = document.querySelector('.rs-header-top');
            const navItems = document.querySelectorAll('.rs-menu .nav-menu > li');
            const searchIcon = document.querySelector('.right-bar-icon');

            const lastItem = navItems[navItems.length - 1];
            const lastItemRect = lastItem ? lastItem.getBoundingClientRect() : null;
            const searchRect = searchIcon ? searchIcon.getBoundingClientRect() : null;

            return {
                topBarPadding: topBar ? window.getComputedStyle(topBar).padding : null,
                navItemsCount: navItems.length,
                lastItemTitle: lastItem ? lastItem.textContent.trim().split('\n')[0] : null,
                lastItemRight: lastItemRect ? Math.round(lastItemRect.right) : null,
                searchLeft: searchRect ? Math.round(searchRect.left) : null,
                availableGapPx: (lastItemRect && searchRect) ? Math.round(searchRect.left - lastItemRect.right) : null,
                collides: (lastItemRect && searchRect) ? (lastItemRect.right > searchRect.left) : false
            };
        });
        console.log('Homepage Header Layout:', homeCheck);

        console.log('\nAll JS Errors Caught During Session:');
        console.log(errors.length === 0 ? 'None (Clean Console!)' : errors);

        await browser.close();
    } catch (err) {
        console.error('Test Suite Failed:', err);
        await browser.close();
        process.exit(1);
    }
})();
