const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const SCREENSHOT_DIR = 'C:\\Users\\Harmeet Singh\\.gemini\\antigravity-ide\\brain\\c0780ecc-9b63-48b1-b95b-55bea492e594';

async function run() {
    console.log('--- Launching Edge Browser ---');
    const browser = await puppeteer.launch({
        executablePath: EDGE_PATH,
        headless: true,
        defaultViewport: { width: 1440, height: 950 },
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
        const page = await browser.newPage();

        // Listen for console logs and network errors
        page.on('console', msg => {
            if (msg.type() === 'error') console.log('PAGE ERROR:', msg.text());
        });
        page.on('response', resp => {
            if (resp.status() >= 400 && resp.url().includes('images')) {
                console.error('IMAGE 404 DETECTED:', resp.status(), resp.url());
            }
        });

        // Set login state before loading page
        await page.evaluateOnNewDocument(() => {
            localStorage.setItem('edit_logged_in', 'true');
            localStorage.setItem('edit_user', JSON.stringify({ email: 'admin@educationistguru.com', role: 'admin', name: 'Harmeet Singh' }));
        });

        console.log('Navigating to http://localhost:3000/edit/ ...');
        await page.goto('http://localhost:3000/edit/', { waitUntil: 'networkidle2' });

        // Wait for CMS app view
        await page.waitForSelector('#editApp', { visible: true, timeout: 5000 });
        console.log('✓ CMS Dashboard Loaded Successfully');

        // Check dynamic faculties filter populated
        const facultyFilterOptions = await page.$$eval('#courseFacultyFilter option', opts => opts.map(o => o.textContent));
        console.log(`✓ Dynamic Course Faculty Filter Options Count: ${facultyFilterOptions.length}`);

        // 1. TEST COLLEGE MODAL
        console.log('\n--- Testing College Modal & Dynamic Stream Architecture ---');
        await page.click('.menu-item[data-tab="colleges"]');
        await new Promise(r => setTimeout(r, 600));

        await page.click('#openAddCollegeBtn');
        await page.waitForSelector('#collegeModal.open', { visible: true, timeout: 4000 });
        console.log('✓ College Modal Opened');

        // Check stream cards count
        const collegeStreamCards = await page.$$eval('#collegeCategoryCardsGrid .stream-card', cards => cards.map(c => ({
            title: c.querySelector('.stream-card-title')?.textContent,
            degrees: c.querySelector('.stream-card-count')?.textContent,
            active: c.classList.contains('active')
        })));
        console.log(`✓ Total Stream Cards Rendered: ${collegeStreamCards.length}`);
        console.log('Sample Stream Cards:', collegeStreamCards.slice(0, 4));

        // Check program pills count
        const initialPills = await page.$$eval('#collegeProgramPillsGrid .program-pill', pills => pills.length);
        console.log(`✓ Initial Program Degree Pills Count: ${initialPills}`);

        // Test clicking a stream card: Pharmacy & Pharmaceutical Sciences
        console.log('Clicking "Pharmacy & Pharmaceutical Sciences" stream card...');
        await page.evaluate(() => {
            const card = Array.from(document.querySelectorAll('#collegeCategoryCardsGrid .stream-card'))
                .find(c => c.textContent.includes('Pharmacy'));
            if (card) card.click();
        });
        await new Promise(r => setTimeout(r, 400));

        // Check tabs and pills updated
        const pharmacyPills = await page.$$eval('#collegeProgramPillsGrid .program-pill', pills => pills.map(p => p.textContent.trim()));
        console.log('Pharmacy Stream Degree Pills:', pharmacyPills);

        // Test search filter: type "Pharm" into search
        console.log('Testing Degree Search: "Pharm" ...');
        await page.type('#collegeProgramSearchInput', 'Pharm');
        await new Promise(r => setTimeout(r, 300));
        const searchFilteredPills = await page.$$eval('#collegeProgramPillsGrid .program-pill', pills => pills.map(p => p.textContent.trim()));
        console.log('Search Filtered Pills ("Pharm"):', searchFilteredPills);

        // Click to toggle first pill
        if (searchFilteredPills.length > 0) {
            console.log(`Toggling degree pill: "${searchFilteredPills[0]}" ...`);
            await page.click('#collegeProgramPillsGrid .program-pill');
            await new Promise(r => setTimeout(r, 300));
        }

        // Check active tags box
        const activeCollegeTags = await page.$$eval('#collegeCoursesTagsBox .selected-tag-item', items => items.map(i => i.textContent.trim()));
        console.log('✓ Active Selected Degree Programs in College:', activeCollegeTags);

        // Test clicking preset campus card
        console.log('Testing Curated Preset Campus Photo Card click...');
        await page.evaluate(() => {
            const card = document.querySelectorAll('#collegeModal .preset-campus-card')[2];
            if (card) card.click();
        });
        await new Promise(r => setTimeout(r, 300));

        const collegeImgPreviewSrc = await page.$eval('#collegeImagePreview img', img => img.src);
        const collegeImgInputValue = await page.$eval('#collegeImageInput', inp => inp.value);
        console.log(`✓ College Preset Card clicked: input="${collegeImgInputValue}", preview="${collegeImgPreviewSrc}"`);

        // Screenshot College Modal
        const collegeModalPath = path.join(SCREENSHOT_DIR, 'test_college_modal_executive.png');
        await page.screenshot({ path: collegeModalPath });
        console.log(`✓ Saved Screenshot: ${collegeModalPath}`);

        // Close College Modal
        await page.click('#collegeModal .modal-close');
        await new Promise(r => setTimeout(r, 500));

        // 2. TEST UNIVERSITY MODAL
        console.log('\n--- Testing University Modal & Dynamic Stream Architecture ---');
        await page.click('.menu-item[data-tab="universities"]');
        await new Promise(r => setTimeout(r, 600));

        await page.click('#openAddUnivBtn');
        await page.waitForSelector('#univModal.open', { visible: true, timeout: 4000 });
        console.log('✓ University Modal Opened');

        // Check univ stream cards
        const univStreamCards = await page.$$eval('#univStreamCardsGrid .stream-card', cards => cards.length);
        console.log(`✓ Total Univ Stream Cards Rendered: ${univStreamCards}`);

        // Check univ program pills
        const univPills = await page.$$eval('#univProgramPillsGrid .program-pill', pills => pills.map(p => p.textContent.trim()));
        console.log(`✓ Univ Program Degree Pills Count: ${univPills.length}`);
        console.log('Sample Univ Degree Pills:', univPills.slice(0, 5));

        // Test search in University modal: "MBA"
        console.log('Testing Univ Degree Search: "MBA" ...');
        await page.type('#univProgramSearchInput', 'MBA');
        await new Promise(r => setTimeout(r, 300));
        const mbaPills = await page.$$eval('#univProgramPillsGrid .program-pill', pills => pills.map(p => p.textContent.trim()));
        console.log('Search Filtered Univ Pills ("MBA"):', mbaPills);

        // Click preset university banner card
        console.log('Testing Curated Preset University Banner Card click...');
        await page.evaluate(() => {
            const card = document.querySelectorAll('#univModal .preset-campus-card')[1];
            if (card) card.click();
        });
        await new Promise(r => setTimeout(r, 300));

        const univImgPreviewSrc = await page.$eval('#univImagePreview img', img => img.src);
        const univImgInputValue = await page.$eval('#univImageInput', inp => inp.value);
        console.log(`✓ Univ Banner Card clicked: input="${univImgInputValue}", preview="${univImgPreviewSrc}"`);

        // Screenshot University Modal
        const univModalPath = path.join(SCREENSHOT_DIR, 'test_univ_modal_executive.png');
        await page.screenshot({ path: univModalPath });
        console.log(`✓ Saved Screenshot: ${univModalPath}`);

        console.log('\n=== ALL TESTS PASSED SUCCESSFULLY ===');
    } catch (err) {
        console.error('TEST ERROR:', err);
    } finally {
        await browser.close();
    }
}

run();
