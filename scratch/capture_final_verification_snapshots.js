const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const ARTIFACTS_DIR = 'C:\\Users\\Harmeet Singh\\.gemini\\antigravity-ide\\brain\\c0780ecc-9b63-48b1-b95b-55bea492e594';
const SNAP_DIR = path.join(ARTIFACTS_DIR, 'snapshots');

(async () => {
    const browser = await puppeteer.launch({
        executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        headless: 'new',
        args: ['--no-sandbox', '--window-size=1440,960'],
        defaultViewport: { width: 1440, height: 960 }
    });
    const page = await browser.newPage();

    // 1. Home - Hero
    await page.goto('http://localhost:3000/', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 600));
    await page.screenshot({ path: path.join(SNAP_DIR, 'final_home_hero.png') });
    console.log('Saved final_home_hero.png');

    // 2. Home - Services & About
    await page.evaluate(() => {
        const el = document.querySelector('.rs-services-style1');
        if (el) el.scrollIntoView({ behavior: 'instant', block: 'start' });
    });
    await new Promise(r => setTimeout(r, 400));
    await page.screenshot({ path: path.join(SNAP_DIR, 'final_home_services_about.png') });
    console.log('Saved final_home_services_about.png');

    // 3. Home - Courses
    await page.evaluate(() => {
        const el = document.getElementById('rs-courses-3') || document.querySelector('.cource-item');
        if (el) el.scrollIntoView({ behavior: 'instant', block: 'start' });
    });
    await new Promise(r => setTimeout(r, 400));
    await page.screenshot({ path: path.join(SNAP_DIR, 'final_home_courses.png') });
    console.log('Saved final_home_courses.png');

    // 4. Courses Page
    await page.goto('http://localhost:3000/courses.html', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 600));
    await page.screenshot({ path: path.join(SNAP_DIR, 'final_courses_page.png') });
    console.log('Saved final_courses_page.png');

    // 5. CRM Dashboard
    await page.goto('http://localhost:3000/crm/', { waitUntil: 'networkidle2' });
    await page.evaluate(() => {
        if (typeof fillAdminCredentials === 'function') fillAdminCredentials();
    });
    await new Promise(r => setTimeout(r, 200));
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle2' }).catch(() => {});
    await new Promise(r => setTimeout(r, 800));
    await page.screenshot({ path: path.join(SNAP_DIR, 'final_crm_dashboard.png') });
    console.log('Saved final_crm_dashboard.png');

    // 6. CRM Leads Table
    await page.goto('http://localhost:3000/crm/leads.html', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 800));
    await page.screenshot({ path: path.join(SNAP_DIR, 'final_crm_leads.png') });
    console.log('Saved final_crm_leads.png');

    // 7. Edit CMS
    await page.goto('http://localhost:3000/edit.html', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 800));
    await page.screenshot({ path: path.join(SNAP_DIR, 'final_edit_cms.png') });
    console.log('Saved final_edit_cms.png');

    await browser.close();
    console.log('All final verification snapshots captured!');
})().catch(err => {
    console.error('Snapshot capture error:', err);
    process.exit(1);
});
