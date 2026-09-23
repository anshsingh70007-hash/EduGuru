const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const ARTIFACTS_DIR = 'C:\\Users\\Harmeet Singh\\.gemini\\antigravity-ide\\brain\\c0780ecc-9b63-48b1-b95b-55bea492e594';
const SNAP_DIR = path.join(ARTIFACTS_DIR, 'snapshots');
if (!fs.existsSync(SNAP_DIR)) {
    fs.mkdirSync(SNAP_DIR, { recursive: true });
}

async function run() {
    const executablePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
    console.log('Launching Chrome from:', executablePath);

    const browser = await puppeteer.launch({
        executablePath,
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,960'],
        defaultViewport: { width: 1440, height: 960 }
    });

    const page = await browser.newPage();

    // 1. Home page Hero & Toolbar
    await page.goto('http://localhost:3000/', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 800));
    await page.screenshot({ path: path.join(SNAP_DIR, 'before_home_hero.png') });
    console.log('Saved before_home_hero.png');

    // 2. Home page Services
    await page.evaluate(() => {
        const el = document.querySelector('.rs-services-style1') || document.getElementById('rs-services');
        if (el) el.scrollIntoView({ behavior: 'instant', block: 'start' });
    });
    await new Promise(r => setTimeout(r, 500));
    await page.screenshot({ path: path.join(SNAP_DIR, 'before_home_services.png') });
    console.log('Saved before_home_services.png');

    // 3. Home page Courses
    await page.evaluate(() => {
        const el = document.getElementById('rs-courses-3') || document.querySelector('.cource-item');
        if (el) el.scrollIntoView({ behavior: 'instant', block: 'start' });
    });
    await new Promise(r => setTimeout(r, 500));
    await page.screenshot({ path: path.join(SNAP_DIR, 'before_home_courses.png') });
    console.log('Saved before_home_courses.png');

    // 4. CRM Dashboard
    await page.goto('http://localhost:3000/CRM/dashboard.html', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 800));
    await page.screenshot({ path: path.join(SNAP_DIR, 'before_crm_dashboard.png') });
    console.log('Saved before_crm_dashboard.png');

    // 5. Edit CMS
    await page.goto('http://localhost:3000/edit.html', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 800));
    await page.screenshot({ path: path.join(SNAP_DIR, 'before_edit_cms.png') });
    console.log('Saved before_edit_cms.png');

    await browser.close();
    console.log('All before snapshots captured successfully!');
}

run().catch(err => {
    console.error('Snapshot error:', err);
    process.exit(1);
});
