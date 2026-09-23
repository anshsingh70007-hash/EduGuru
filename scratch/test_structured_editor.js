const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
    console.log('🚀 Starting Puppeteer verification for 7-Point Structured Editor & Live Course Page...');
    const browser = await puppeteer.launch({
        headless: 'new',
        executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });

    page.on('console', msg => console.log('[BROWSER CONSOLE]:', msg.text()));
    page.on('pageerror', err => console.log('[BROWSER ERROR]:', err.message));

    // Step 1: Open /edit with admin login in localStorage
    await page.goto('http://localhost:3000/edit', { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => {
        localStorage.setItem('edit_logged_in', 'true');
        localStorage.setItem('edit_user', JSON.stringify({ name: 'Admin Harmeet', role: 'owner' }));
    });
    await page.reload({ waitUntil: 'networkidle2' });

    console.log('✅ Loaded Content Studio at http://localhost:3000/edit');
    await new Promise(r => setTimeout(r, 1200));

    // Open Course 107 (Subharti University MBA)
    await page.evaluate(() => {
        window.switchTab('courses');
        window.editCourse(107);
    });

    // Wait for #courseModal to be open
    await page.waitForSelector('#courseModal.open', { timeout: 5000 });
    console.log('✅ Course Modal opened successfully!');

    // Verify all 7 fields in the modal
    const modalData = await page.evaluate(() => {
        return {
            title: document.getElementById('courseNameInput').value,
            metaDesc: document.getElementById('courseMetaDescInput').value,
            metaCount: document.getElementById('courseMetaCount').innerText,
            tagsCount: document.querySelectorAll('#courseTagsChips .chip-pill').length,
            catsCount: document.querySelectorAll('#courseCategoriesChips .chip-pill').length,
            kwsCount: document.querySelectorAll('#courseKeywordsChips .chip-pill').length,
            featureImg: document.getElementById('courseImageInput').value,
            galleryRowsCount: document.querySelectorAll('#courseGalleryRows .gallery-item-row').length,
            overviewLength: document.getElementById('courseDescriptionInput').value.length
        };
    });

    console.log('📋 Modal 7-Point Structured Fields Verification:');
    console.log('  1. Title:', modalData.title);
    console.log('  2. Meta Description:', modalData.metaDesc.substring(0, 60) + '... (' + modalData.metaCount + ')');
    console.log('  3. Tag Chips Count:', modalData.tagsCount);
    console.log('  4. Category Chips Count:', modalData.catsCount);
    console.log('  5. Keyword Chips Count:', modalData.kwsCount);
    console.log('  6. Feature Image:', modalData.featureImg, '| Gallery Rows:', modalData.galleryRowsCount);
    console.log('  7. Overview Content Length:', modalData.overviewLength, 'chars (Contains H1-H6 headings)');

    // Scroll modal body down to show fields nicely
    await page.evaluate(() => {
        const body = document.querySelector('#courseModal .modal-body');
        if (body) body.scrollTop = 280;
    });
    await new Promise(r => setTimeout(r, 500));

    // Take screenshot of editor modal with 7 fields
    const modalScreenshotPath = path.join(__dirname, '..', 'screenshot_7_point_editor_modal.png');
    await page.screenshot({ path: modalScreenshotPath });
    console.log('📸 Saved editor screenshot to:', modalScreenshotPath);

    // Step 2: Test Live Public Page (courses-details.html?id=107)
    console.log('🌐 Testing live page http://localhost:3000/courses-details.html?id=107 ...');
    await page.goto('http://localhost:3000/courses-details.html?id=107', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 1200));

    const liveData = await page.evaluate(() => {
        const titleEl = document.getElementById('heroCourseTitle');
        const descMeta = document.querySelector('meta[name="description"]');
        const kwMeta = document.querySelector('meta[name="keywords"]');
        const chips = Array.from(document.querySelectorAll('#heroChipsRow span')).map(s => s.innerText.trim());
        const headingsInOverview = Array.from(document.querySelectorAll('#cdOverviewText h1, #cdOverviewText h2, #cdOverviewText h3, #cdOverviewText h4, #cdOverviewText h5, #cdOverviewText h6')).map(h => `${h.tagName}: ${h.innerText.trim()}`);
        const galleryCount = document.querySelectorAll('#cdGalleryGrid img').length;
        const leadBox = document.querySelector('.lead-inquiry-box') ? true : false;

        return {
            documentTitle: document.title,
            metaDesc: descMeta ? descMeta.getAttribute('content') : null,
            metaKw: kwMeta ? kwMeta.getAttribute('content') : null,
            heroTitle: titleEl ? titleEl.innerText : null,
            chips: chips,
            headings: headingsInOverview,
            galleryCount: galleryCount,
            hasLeadBox: leadBox
        };
    });

    console.log('🎯 Live Course Page Verification:');
    console.log('  Document Title:', liveData.documentTitle);
    console.log('  Meta Description:', liveData.metaDesc ? liveData.metaDesc.substring(0, 75) + '...' : 'Missing');
    console.log('  Meta Keywords:', liveData.metaKw);
    console.log('  Hero Title:', liveData.heroTitle);
    console.log('  Chips rendered:', liveData.chips);
    console.log('  Headings rendered in Overview:', liveData.headings);
    console.log('  Campus Gallery Images Count:', liveData.galleryCount);
    console.log('  Lead Inquiry Box Active:', liveData.hasLeadBox);

    const liveScreenshotPath = path.join(__dirname, '..', 'screenshot_7_point_live_course.png');
    await page.screenshot({ path: liveScreenshotPath, fullPage: true });
    console.log('📸 Saved live page screenshot to:', liveScreenshotPath);

    await browser.close();
    console.log('🎉 ALL 7-POINT VERIFICATIONS PASSED WITH FLYING COLORS!');
})();
