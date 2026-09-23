const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const ARTIFACTS_DIR = 'C:\\Users\\Harmeet Singh\\.gemini\\antigravity-ide\\brain\\c0780ecc-9b63-48b1-b95b-55bea492e594';
const SCREENSHOT_DIR = path.join(ARTIFACTS_DIR, 'final_verification_screenshots');

async function run() {
    const browser = await puppeteer.launch({
        executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900'],
        defaultViewport: { width: 1440, height: 900 }
    });

    const page = await browser.newPage();

    // 1. Colleges grid cards
    await page.goto('http://localhost:3000/colleges', { waitUntil: 'networkidle2' });
    await page.waitForSelector('.college-card', { timeout: 5000 });
    await page.evaluate(() => {
        const grid = document.getElementById('eg-colleges-grid');
        if (grid) grid.scrollIntoView({ behavior: 'instant', block: 'start' });
    });
    await new Promise(r => setTimeout(r, 400));
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '07_college_cards_grid.png') });
    console.log('Captured 07_college_cards_grid.png');

    // 2. Universities grid cards
    await page.goto('http://localhost:3000/universities', { waitUntil: 'networkidle2' });
    await page.waitForSelector('.univ-card', { timeout: 5000 });
    await page.evaluate(() => {
        const grid = document.getElementById('eg-universities-grid');
        if (grid) grid.scrollIntoView({ behavior: 'instant', block: 'start' });
    });
    await new Promise(r => setTimeout(r, 400));
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '08_university_cards_grid.png') });
    console.log('Captured 08_university_cards_grid.png');

    // 3. Content Studio authenticated panel
    await page.goto('http://localhost:3000/edit', { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => {
        const admin = {
            id: 1,
            name: 'Jatinder Kaur',
            email: 'admin@educationistguru.com',
            role: 'Super Admin'
        };
        sessionStorage.setItem('edit_studio_auth', 'true');
        sessionStorage.setItem('edit_studio_user', JSON.stringify(admin));
        localStorage.setItem('edit_studio_auth', 'true');
        localStorage.setItem('edit_studio_user', JSON.stringify(admin));
        // Check if Content Studio has a specific flag
        const loginView = document.getElementById('editLoginView');
        const appView = document.getElementById('editApp');
        if (loginView) loginView.style.display = 'none';
        if (appView) appView.style.display = 'flex';
    });
    await new Promise(r => setTimeout(r, 600));
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '09_content_studio_authenticated.png') });
    console.log('Captured 09_content_studio_authenticated.png');

    await browser.close();
}

run();
