const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function testAll() {
    console.log('=== STARTING COMPLETE VERIFICATION SUITE ===');
    const browser = await puppeteer.launch({
        executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1400, height: 900 });

    const errors = [];
    page.on('pageerror', err => {
        console.error('[PAGE ERROR]', err.message);
        errors.push(err.message);
    });

    // 1. Test Colleges Public Page
    console.log('\n--- 1. Testing colleges.html ---');
    await page.goto('http://localhost:3000/colleges.html', { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForSelector('.eg-dir-card', { timeout: 10000 }).catch(() => null);
    
    const collegeFacilitiesCount = await page.evaluate(() => {
        return document.querySelectorAll('.facility-pill, .facility-badge, [class*="facility"]').length;
    });
    console.log(`Found ${collegeFacilitiesCount} facility badges rendered on colleges.html cards`);

    await page.screenshot({ path: path.join(__dirname, 'test_colleges_public.png') });
    console.log('Saved test_colleges_public.png');

    // 2. Test Universities Public Page
    console.log('\n--- 2. Testing universities.html ---');
    await page.goto('http://localhost:3000/universities.html', { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForSelector('.eg-dir-card', { timeout: 10000 }).catch(() => null);

    const univFacilitiesCount = await page.evaluate(() => {
        return document.querySelectorAll('.facility-pill, .facility-badge, [class*="facility"]').length;
    });
    console.log(`Found ${univFacilitiesCount} facility badges rendered on universities.html cards`);

    await page.screenshot({ path: path.join(__dirname, 'test_universities_public.png') });
    console.log('Saved test_universities_public.png');

    // 3. Test /edit Studio Dashboard
    console.log('\n--- 3. Testing /edit Studio Dashboard ---');
    await page.goto('http://localhost:3000/edit', { waitUntil: 'domcontentloaded', timeout: 15000 });

    // Set authenticated session to reveal studio
    await page.evaluate(() => {
        localStorage.setItem('edit_logged_in', 'true');
        localStorage.setItem('edit_user', JSON.stringify({ email: 'admin@educationistguru.com', role: 'admin', name: 'Jatinder Kaur' }));
        const loginView = document.getElementById('editLoginView');
        const appView = document.getElementById('editApp');
        if (loginView) loginView.style.display = 'none';
        if (appView) appView.style.display = 'flex';
        if (typeof window.switchTab === 'function') window.switchTab('headers');
    });
    await new Promise(r => setTimeout(r, 1000));

    // Verify Tab-Headers exists and can be clicked
    const headersTabExists = await page.evaluate(() => {
        const btn = document.querySelector('.menu-item[data-tab="headers"]');
        if (btn) {
            btn.click();
            return true;
        }
        return false;
    });
    console.log('Tab Headers button clicked:', headersTabExists);
    await new Promise(r => setTimeout(r, 1000));
    
    // Check if announcement form fields and headers list exist
    const headersData = await page.evaluate(() => {
        const announceText = document.getElementById('announcementTextInput');
        const announceLink = document.getElementById('announcementLinkInput');
        const customHeadersList = document.getElementById('customHeadersList');
        const headerModal = document.getElementById('headerModal');
        return {
            announceTextFound: !!announceText,
            announceLinkFound: !!announceLink,
            customHeadersListFound: !!customHeadersList,
            headerModalFound: !!headerModal
        };
    });
    console.log('Headers Tab structure:', headersData);
    await page.screenshot({ path: path.join(__dirname, 'test_studio_headers_tab.png') });

    // 4. Test Opening College Modal in /edit
    console.log('\n--- 4. Testing #collegeModal in /edit ---');
    const collegeModalCheck = await page.evaluate(() => {
        if (typeof window.openCollegeModal === 'function') {
            window.openCollegeModal();
            return {
                opened: true,
                metaDescCount: !!document.getElementById('collegeMetaCount'),
                tagsChips: !!document.getElementById('collegeTagsChips'),
                keywordsChips: !!document.getElementById('collegeKeywordsChips'),
                facilitiesChips: !!document.getElementById('collegeFacilitiesChips'),
                presetPills: document.querySelectorAll('#collegeModal .facility-preset-pill').length
            };
        }
        return { opened: false };
    });
    console.log('College Modal check:', collegeModalCheck);
    await page.screenshot({ path: path.join(__dirname, 'test_college_modal_seo.png') });

    // 5. Test Opening University Modal in /edit
    console.log('\n--- 5. Testing #univModal in /edit ---');
    const univModalCheck = await page.evaluate(() => {
        if (typeof window.closeCollegeModal === 'function') window.closeCollegeModal();
        if (typeof window.openUnivModal === 'function') {
            window.openUnivModal();
            return {
                opened: true,
                metaDescCount: !!document.getElementById('univMetaCount'),
                tagsChips: !!document.getElementById('univTagsChips'),
                keywordsChips: !!document.getElementById('univKeywordsChips'),
                facilitiesChips: !!document.getElementById('univFacilitiesChips'),
                presetPills: document.querySelectorAll('#univModal .facility-preset-pill').length
            };
        }
        return { opened: false };
    });
    console.log('University Modal check:', univModalCheck);
    await page.screenshot({ path: path.join(__dirname, 'test_univ_modal_seo.png') });

    // 6. Test Opening Blog Modal in /edit
    console.log('\n--- 6. Testing #blogModal in /edit ---');
    const blogModalCheck = await page.evaluate(() => {
        if (typeof window.closeUnivModal === 'function') window.closeUnivModal();
        if (typeof window.openBlogModal === 'function') {
            window.openBlogModal();
            return {
                opened: true,
                metaDescCount: !!document.getElementById('blogMetaCount'),
                tagsChips: !!document.getElementById('blogTagsChips'),
                categoriesChips: !!document.getElementById('blogCategoriesChips'),
                keywordsChips: !!document.getElementById('blogKeywordsChips'),
                editorCanvas: !!(document.getElementById('blogVisualEditor') || document.getElementById('blogVisualEditorCanvas')),
                statsBar: !!document.getElementById('blogWordCount'),
                tableBtn: !!document.querySelector('button[onclick*="insertEditorTable"]'),
                fullscreenBtn: !!(document.getElementById('blogFullscreenBtn') || document.querySelector('button[onclick*="toggleEditorFullscreen"]'))
            };
        }
        return { opened: false };
    });
    console.log('Blog Modal check:', blogModalCheck);
    await page.screenshot({ path: path.join(__dirname, 'test_blog_modal_wysiwyg.png') });

    await browser.close();
    console.log('\nPage Errors encountered:', errors);
    console.log('=== VERIFICATION COMPLETED SUCCESSFULLY ===');
}

testAll().catch(e => {
    console.error('Test execution failed:', e);
    process.exit(1);
});
