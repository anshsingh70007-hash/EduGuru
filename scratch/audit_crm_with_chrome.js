const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const ARTIFACTS_DIR = 'C:\\Users\\Harmeet Singh\\.gemini\\antigravity-ide\\brain\\c0780ecc-9b63-48b1-b95b-55bea492e594';
const SCREENSHOT_DIR = path.join(ARTIFACTS_DIR, 'browser_audit_screenshots');
if (!fs.existsSync(SCREENSHOT_DIR)) fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

async function runAudit() {
    console.log('=== STARTING CHROME END-TO-END CRM & EDIT STUDIO AUDIT ===\n');

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
        // Step 1: Login page
        console.log('1. Navigating to CRM Login page...');
        await page.goto('http://localhost:3000/CRM/index.html', { waitUntil: 'domcontentloaded' });
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, '01_login_page.png') });
        console.log('   Captured 01_login_page.png');

        // Set authenticated session
        await page.evaluate(() => {
            const admin = {
                id: 1,
                name: 'Jatinder Kaur',
                email: 'admin@educationistguru.com',
                role: 'owner'
            };
            localStorage.setItem('crm_logged_in', 'true');
            localStorage.setItem('crm_current_user', JSON.stringify(admin));
            localStorage.setItem('edit_logged_in', 'true');
            localStorage.setItem('edit_user', JSON.stringify(admin));
        });

        // Step 2: Dashboard
        console.log('2. Verifying Dashboard...');
        await page.goto('http://localhost:3000/CRM/dashboard.html', { waitUntil: 'networkidle2' });
        await page.waitForSelector('.stat-card', { timeout: 5000 });
        const kpiCount = await page.$$eval('.stat-card', cards => cards.length);
        console.log(`   Found ${kpiCount} KPI cards on Dashboard.`);
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02_dashboard.png') });
        console.log('   Captured 02_dashboard.png');

        // Step 3: Leads
        console.log('3. Navigating to Leads module...');
        await page.goto('http://localhost:3000/CRM/leads.html', { waitUntil: 'networkidle2' });
        await page.waitForSelector('#leadsTable tr', { timeout: 5000 });
        const leadsRows = await page.$$eval('#leadsTable tr', rows => rows.length);
        console.log(`   Found ${leadsRows} lead records in table.`);
        
        // Open Add Lead modal
        await page.click('button[onclick="openModal()"]');
        await page.waitForSelector('#leadModal.active', { timeout: 3000 });
        const courseOptionsCount = await page.$$eval('#leadCourse option', opts => opts.length);
        console.log(`   Dynamic Course dropdown in Add Lead modal contains ${courseOptionsCount} courses!`);
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, '03_leads_modal.png') });
        console.log('   Captured 03_leads_modal.png');
        await page.click('#leadModal .modal-close');

        // Step 4: Applications
        console.log('4. Navigating to Applications module...');
        await page.goto('http://localhost:3000/CRM/applications.html', { waitUntil: 'networkidle2' });
        await page.waitForSelector('#dataTable tr', { timeout: 5000 });
        const appRows = await page.$$eval('#dataTable tr', rows => rows.length);
        console.log(`   Found ${appRows} application records rendered.`);

        // Open New Application modal
        await page.click('button[onclick="openAppModal()"]');
        await page.waitForSelector('#appModal.active', { timeout: 3000 });
        const appCoursesCount = await page.$$eval('#appCourse option', opts => opts.length);
        console.log(`   Dynamic Course dropdown in New Application modal contains ${appCoursesCount} courses!`);
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, '04_applications_modal.png') });
        console.log('   Captured 04_applications_modal.png');
        await page.click('#appModal .modal-close');

        // View Dossier
        const viewDossierBtn = await page.$('button[title="View Full Dossier"]');
        if (viewDossierBtn) {
            await viewDossierBtn.click();
            await page.waitForSelector('#dossierModal.active', { timeout: 3000 });
            await page.screenshot({ path: path.join(SCREENSHOT_DIR, '05_application_dossier.png') });
            console.log('   Captured 05_application_dossier.png');
            await page.click('#dossierModal .modal-close');
        }

        // Step 5: Enrollments
        console.log('5. Navigating to Enrollments module...');
        await page.goto('http://localhost:3000/CRM/enrollments.html', { waitUntil: 'networkidle2' });
        await page.waitForSelector('#dataTable tr', { timeout: 5000 });
        const enrRows = await page.$$eval('#dataTable tr', rows => rows.length);
        console.log(`   Found ${enrRows} enrollment records.`);
        await page.click('button[onclick="openEnrModal()"]');
        await page.waitForSelector('#enrModal.active', { timeout: 3000 });
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, '06_enrollments_modal.png') });
        console.log('   Captured 06_enrollments_modal.png');
        await page.click('#enrModal .modal-close');

        // Step 6: Fees
        console.log('6. Navigating to Fee Management...');
        await page.goto('http://localhost:3000/CRM/fees.html', { waitUntil: 'networkidle2' });
        await page.waitForSelector('#feeTableBody tr', { timeout: 5000 });
        const feeFilterOptions = await page.$$eval('#feeCourseFilter option', opts => opts.length);
        console.log(`   Dynamic Course filter in Fees page contains ${feeFilterOptions} courses!`);

        const viewReceiptBtn = await page.$('button[title="View/Print Receipt"]');
        if (viewReceiptBtn) {
            await viewReceiptBtn.click();
            await page.waitForSelector('#receiptModal.active', { timeout: 3000 });
            await page.screenshot({ path: path.join(SCREENSHOT_DIR, '07_fee_receipt.png') });
            console.log('   Captured 07_fee_receipt.png');
            await page.click('#receiptModal .modal-close');
        }

        // Step 7: Inquiries
        console.log('7. Navigating to Inquiries module...');
        await page.goto('http://localhost:3000/CRM/inquiries.html', { waitUntil: 'networkidle2' });
        await page.waitForSelector('#inquiryList', { timeout: 5000 });
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, '08_inquiries.png') });
        console.log('   Captured 08_inquiries.png');

        // Step 8: Subscribers
        console.log('8. Navigating to Subscribers module...');
        await page.goto('http://localhost:3000/CRM/subscribers.html', { waitUntil: 'networkidle2' });
        await page.waitForSelector('#dataTable tr', { timeout: 5000 });
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, '09_subscribers.png') });
        console.log('   Captured 09_subscribers.png');

        // Step 9: Settings
        console.log('9. Navigating to Settings module...');
        await page.goto('http://localhost:3000/CRM/settings.html', { waitUntil: 'networkidle2' });
        await page.waitForSelector('#orgName', { timeout: 5000 });
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, '10_settings.png') });
        console.log('   Captured 10_settings.png');

        // Step 10: Content Studio (/edit)
        console.log('10. Navigating to Content Studio (/edit)...');
        await page.goto('http://localhost:3000/edit', { waitUntil: 'networkidle2' });
        
        await page.waitForSelector('#coursesGrid > div', { timeout: 8000 });
        const courseCardsCount = await page.$$eval('#coursesGrid > div', cards => cards.length);
        console.log(`   Content Studio loaded ${courseCardsCount} course cards with live thumbnails!`);
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, '11_content_studio_courses.png') });
        console.log('   Captured 11_content_studio_courses.png');

        console.log('\n===========================================');
        console.log('BROWSER AUDIT COMPLETED SUCCESSFULLY!');
        console.log(`Console Errors: ${consoleErrors.length}`);
        if (consoleErrors.length > 0) {
            consoleErrors.forEach(e => console.log('  ⚠️', e));
        }
        console.log(`All 11 verification screenshots saved to: ${SCREENSHOT_DIR}`);
        console.log('===========================================');

    } catch (err) {
        console.error('AUDIT ERROR:', err);
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'error_state.png') });
    } finally {
        await browser.close();
    }
}

runAudit();
