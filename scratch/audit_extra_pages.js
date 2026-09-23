const puppeteer = require('puppeteer');
const path = require('path');

const ARTIFACTS_DIR = 'C:\\Users\\Harmeet Singh\\.gemini\\antigravity-ide\\brain\\c0780ecc-9b63-48b1-b95b-55bea492e594';
const SCREENSHOT_DIR = path.join(ARTIFACTS_DIR, 'student_audit_screenshots');

async function auditRemainingPages() {
    const browser = await puppeteer.launch({
        executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900']
    });
    const page = await browser.newPage();

    // 1. Blog Page
    await page.goto('http://localhost:3000/blog', { waitUntil: 'networkidle2' });
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '26_blog_page.png') });

    // 2. YouTube / Videos Page
    await page.goto('http://localhost:3000/youtube', { waitUntil: 'networkidle2' });
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '27_youtube_page.png') });

    // 3. About Us Page
    await page.goto('http://localhost:3000/about', { waitUntil: 'networkidle2' });
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '28_about_page.png') });

    await browser.close();
    console.log('Additional screenshots saved.');
}

auditRemainingPages();
