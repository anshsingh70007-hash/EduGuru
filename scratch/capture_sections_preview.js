const puppeteer = require('puppeteer-core');
const path = require('path');
const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const SCREENSHOT_DIR = 'C:\\Users\\Harmeet Singh\\.gemini\\antigravity-ide\\brain\\c0780ecc-9b63-48b1-b95b-55bea492e594';

async function run() {
    const browser = await puppeteer.launch({
        executablePath: EDGE_PATH,
        headless: true,
        defaultViewport: { width: 1440, height: 950 },
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
        const page = await browser.newPage();
        await page.evaluateOnNewDocument(() => {
            localStorage.setItem('edit_logged_in', 'true');
            localStorage.setItem('edit_user', JSON.stringify({ email: 'admin@educationistguru.com', role: 'admin', name: 'Harmeet Singh' }));
        });

        await page.goto('http://localhost:3000/edit/', { waitUntil: 'domcontentloaded' });
        await page.waitForSelector('#editApp', { visible: true, timeout: 5000 });

        await page.click('.menu-item[data-tab="colleges"]');
        await new Promise(r => setTimeout(r, 600));

        await page.click('#openAddCollegeBtn');
        await page.waitForSelector('#collegeModal.open', { visible: true, timeout: 4000 });

        // Scroll to top of modal body to view Sections 1 & 2
        await page.evaluate(() => {
            const body = document.querySelector('#collegeModal .modal-body');
            if (body) body.scrollTop = 0;
        });
        await new Promise(r => setTimeout(r, 400));
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'college_modal_section1_2.png') });

        // Scroll to bottom of modal body to view Sections 5 & 6
        await page.evaluate(() => {
            const body = document.querySelector('#collegeModal .modal-body');
            if (body) body.scrollTop = body.scrollHeight;
        });
        await new Promise(r => setTimeout(r, 400));
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'college_modal_section5_6.png') });

        // Close College modal and test University modal
        await page.click('#collegeModal .modal-close');
        await new Promise(r => setTimeout(r, 400));

        await page.click('.menu-item[data-tab="universities"]');
        await new Promise(r => setTimeout(r, 600));

        await page.click('#openAddUnivBtn');
        await page.waitForSelector('#univModal.open', { visible: true, timeout: 4000 });

        // Scroll to top of modal body to view Sections 1 & 2
        await page.evaluate(() => {
            const body = document.querySelector('#univModal .modal-body');
            if (body) body.scrollTop = 0;
        });
        await new Promise(r => setTimeout(r, 400));
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'univ_modal_section1_2.png') });

        console.log('✓ Section screenshots captured successfully');
    } catch (e) {
        console.error(e);
    } finally {
        await browser.close();
    }
}

run();
