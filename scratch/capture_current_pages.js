const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const ARTIFACTS_DIR = 'C:\\Users\\Harmeet Singh\\.gemini\\antigravity-ide\\brain\\c0780ecc-9b63-48b1-b95b-55bea492e594';
const SCREENSHOT_DIR = path.join(ARTIFACTS_DIR, 'redesign_screenshots');
if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function run() {
    let executablePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
    if (!fs.existsSync(executablePath)) {
        executablePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
    }

    console.log('Launching browser using:', executablePath);
    const browser = await puppeteer.launch({
        executablePath,
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,960'],
        defaultViewport: { width: 1440, height: 960 }
    });

    const page = await browser.newPage();

    // 1. Reference Courses Page (Benchmark)
    await page.goto('http://localhost:3000/courses.html', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 600));
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '01_courses_benchmark.png'), fullPage: false });
    console.log('Captured 01_courses_benchmark.png');

    // 2. Colleges Before
    await page.goto('http://localhost:3000/colleges.html', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 600));
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02_colleges_before_hero_search.png'), fullPage: false });
    console.log('Captured 02_colleges_before_hero_search.png');

    await page.evaluate(() => {
        const grid = document.getElementById('eg-colleges-grid');
        if (grid) grid.scrollIntoView({ behavior: 'instant', block: 'start' });
    });
    await new Promise(r => setTimeout(r, 400));
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '03_colleges_before_cards_grid.png'), fullPage: false });
    console.log('Captured 03_colleges_before_cards_grid.png');

    // 3. Universities Before
    await page.goto('http://localhost:3000/universities.html', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 600));
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '04_universities_before_hero_search.png'), fullPage: false });
    console.log('Captured 04_universities_before_hero_search.png');

    await page.evaluate(() => {
        const grid = document.getElementById('eg-universities-grid');
        if (grid) grid.scrollIntoView({ behavior: 'instant', block: 'start' });
    });
    await new Promise(r => setTimeout(r, 400));
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '05_universities_before_cards_grid.png'), fullPage: false });
    console.log('Captured 05_universities_before_cards_grid.png');

    await browser.close();
    console.log('All before screenshots captured successfully.');
}

run().catch(err => {
    console.error('Error:', err);
    process.exit(1);
});
