const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const ARTIFACTS_DIR = 'C:\\Users\\Harmeet Singh\\.gemini\\antigravity-ide\\brain\\c0780ecc-9b63-48b1-b95b-55bea492e594';
const SCREENSHOT_DIR = path.join(ARTIFACTS_DIR, 'final_verification_screenshots');
if (!fs.existsSync(SCREENSHOT_DIR)) fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

async function runAudit() {
    console.log('=== STARTING FINAL FINISHING TOUCHES VISUAL AUDIT ===\n');

    const browser = await puppeteer.launch({
        executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900'],
        defaultViewport: { width: 1440, height: 900 }
    });

    const page = await browser.newPage();
    const consoleErrors = [];
    page.on('console', msg => {
        if (msg.type() === 'error') {
            consoleErrors.push(`[${page.url()}] ${msg.text()}`);
        }
    });

    try {
        // 1. Colleges Directory Page
        console.log('1. Navigating to http://localhost:3000/colleges...');
        await page.goto('http://localhost:3000/colleges', { waitUntil: 'networkidle2' });
        await page.waitForSelector('.college-card', { timeout: 5000 });
        const collegeCardsCount = await page.$$eval('.college-card', cards => cards.length);
        console.log(`   Found ${collegeCardsCount} college cards rendered.`);
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, '01_colleges_directory.png') });
        console.log('   Captured 01_colleges_directory.png');

        // Test Category Filter click on Colleges
        console.log('2. Testing Category Filter on Colleges page...');
        await page.click('[data-college-filter="Pharmacy"]');
        await new Promise(r => setTimeout(r, 400));
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02_colleges_filtered_pharmacy.png') });
        console.log('   Captured 02_colleges_filtered_pharmacy.png');

        // Reset filter & open modal
        await page.click('[data-college-filter="all"]');
        await new Promise(r => setTimeout(r, 400));
        console.log('3. Opening College Details modal via showCollegeDetails...');
        await page.evaluate(() => {
            if (window.showCollegeDetails) {
                window.showCollegeDetails(1);
            }
        });
        await page.waitForSelector('#collegeDetailModal', { visible: true, timeout: 5000 });
        await new Promise(r => setTimeout(r, 500));
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, '03_college_detail_modal.png') });
        console.log('   Captured 03_college_detail_modal.png');
        await page.evaluate(() => {
            if (window.$) $('#collegeDetailModal').modal('hide');
        });
        await new Promise(r => setTimeout(r, 500));

        // 4. Universities Directory Page
        console.log('4. Navigating to http://localhost:3000/universities...');
        await page.goto('http://localhost:3000/universities', { waitUntil: 'networkidle2' });
        await page.waitForSelector('.univ-card', { timeout: 5000 });
        const univCardsCount = await page.$$eval('.univ-card', cards => cards.length);
        console.log(`   Found ${univCardsCount} university cards rendered.`);
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, '04_universities_directory.png') });
        console.log('   Captured 04_universities_directory.png');

        // 5. CRM Settings with Disaster Recovery & External Vault
        console.log('5. Navigating to CRM Settings with Vault UI...');
        await page.goto('http://localhost:3000/CRM/settings.html', { waitUntil: 'domcontentloaded' });
        await page.evaluate(() => {
            const admin = {
                id: 1,
                name: 'Jatinder Kaur',
                email: 'admin@educationistguru.com',
                role: 'owner'
            };
            localStorage.setItem('crm_logged_in', 'true');
            localStorage.setItem('crm_current_user', JSON.stringify(admin));
            localStorage.setItem('edit_admin_logged_in', 'true');
            localStorage.setItem('edit_admin_user', JSON.stringify(admin));
        });
        await page.goto('http://localhost:3000/CRM/settings.html', { waitUntil: 'networkidle2' });
        await page.waitForSelector('#vaultPathText', { timeout: 5000 });
        await new Promise(r => setTimeout(r, 600));
        
        // Scroll down to the Disaster Recovery Card
        await page.evaluate(() => {
            const el = document.getElementById('vaultPathText');
            if (el) el.scrollIntoView({ behavior: 'instant', block: 'center' });
        });
        await new Promise(r => setTimeout(r, 400));
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, '05_crm_disaster_recovery_vault.png') });
        console.log('   Captured 05_crm_disaster_recovery_vault.png');

        // 6. Content Studio (/edit)
        console.log('6. Navigating to Content Studio (/edit)...');
        await page.goto('http://localhost:3000/edit', { waitUntil: 'networkidle2' });
        await new Promise(r => setTimeout(r, 600));
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, '06_content_studio.png') });
        console.log('   Captured 06_content_studio.png');

        console.log('\n=== VISUAL AUDIT COMPLETE ===');
        console.log(`Total Console Errors: ${consoleErrors.length}`);
        if (consoleErrors.length > 0) {
            console.log('Console Errors encountered:');
            consoleErrors.forEach(err => console.log('  - ' + err));
        }
    } catch (err) {
        console.error('Audit failed with error:', err);
    } finally {
        await browser.close();
    }
}

runAudit();
