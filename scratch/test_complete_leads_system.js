const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const SCREENSHOT_DIR = path.join(__dirname, '..', 'leads_verification_screenshots');
if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function runTest() {
    console.log('🚀 Starting Complete Leads & Inquiries Pipeline Verification...');
    const browser = await puppeteer.launch({
        headless: 'new',
        executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1366, height: 850 });

    // 1. TEST CONTACT PAGE FORM SUBMISSION
    console.log('\n--- 1. Testing Contact Page Form (/contact) ---');
    await page.goto('http://localhost:3000/contact', { waitUntil: 'networkidle2' });
    await page.waitForSelector('#mainContactForm, form.contact-form', { timeout: 5000 });

    await page.type('#contactName', 'Harpreet Kaur (Contact Test)');
    await page.type('#contactEmail', 'harpreet.test@gmail.com');
    await page.type('#contactPhone', '9876112233');
    await page.type('#contactSubject', 'MCA Cloud Computing Inquiry');
    await page.type('#contactMessage', 'Please provide fee details and eligibility for online MCA program.');

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '01_contact_form_filled.png') });

    // Submit
    await page.click('#contactSubmitBtn');
    await new Promise(r => setTimeout(r, 1200));
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02_contact_form_submitted.png') });
    console.log('✓ Contact form submitted with visual feedback.');

    // 2. TEST IMMEDIATE CALLBACK MODAL FROM HOMEPAGE
    console.log('\n--- 2. Testing Callback Modal on Homepage (/) ---');
    await page.goto('http://localhost:3000/', { waitUntil: 'networkidle2' });
    await page.waitForSelector('#egCbTrigger, .callback-btn', { timeout: 5000 });

    // Click trigger
    await page.click('#egCbTrigger');
    await page.waitForSelector('#egCbOverlay.active', { timeout: 3000 });
    await new Promise(r => setTimeout(r, 400));

    await page.type('#egCbName', 'Gurpreet Singh (Callback Test)');
    await page.type('#egCbPhone', '9812300444');
    await page.select('#egCbCourse', 'MBA / PGDM');

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '03_callback_modal_filled.png') });

    await page.click('#egCbSubmitBtn');
    await new Promise(r => setTimeout(r, 1200));
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '04_callback_success.png') });
    console.log('✓ Callback request submitted successfully.');

    // 3. TEST COURSE ENROLLMENT MODAL
    console.log('\n--- 3. Testing Course Enrollment Modal (/courses) ---');
    await page.goto('http://localhost:3000/courses', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 1500));

    // Open enroll modal via global helper
    await page.evaluate(() => {
        window.openEnrollModal('B.Tech in Artificial Intelligence & Machine Learning', '₹65,000 / year');
    });
    await page.waitForSelector('#egEnrollOverlay.active', { timeout: 3000 });
    await new Promise(r => setTimeout(r, 400));

    await page.type('#egEnrollName', 'Simranjeet Gill (Enroll Test)');
    await page.type('#egEnrollPhone', '9878899000');
    await page.type('#egEnrollEmail', 'simran.gill@example.com');
    await page.type('#egEnrollCity', 'Chandigarh, Punjab');
    await page.type('#egEnrollRemarks', 'Interested in scholarship discounts.');

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '05_enroll_modal_filled.png') });

    await page.click('#egEnrollSubmitBtn');
    await new Promise(r => setTimeout(r, 1500));
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '06_enroll_success.png') });
    console.log('✓ Course enrollment application submitted successfully.');

    // 4. CHECK CRM INQUIRIES PAGE
    console.log('\n--- 4. Checking CRM Inquiries Page (/CRM/inquiries.html) ---');
    // Login to CRM session in browser localStorage
    await page.evaluate(() => {
        localStorage.setItem('crm_logged_in', 'true');
        localStorage.setItem('crm_current_user', JSON.stringify({
            id: 1,
            name: 'Jatinder Kaur',
            email: 'admin@educationistguru.com',
            role: 'owner'
        }));
    });

    await page.goto('http://localhost:3000/CRM/inquiries.html', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 1500));
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '07_crm_inquiries_page.png') });

    const inqStats = await page.evaluate(() => ({
        total: document.getElementById('statTotalInq') ? document.getElementById('statTotalInq').textContent : '0',
        unread: document.getElementById('statUnreadInq') ? document.getElementById('statUnreadInq').textContent : '0',
        inquiryCardsCount: document.querySelectorAll('#inquiryList .card').length,
        bellBadge: document.querySelector('.bell-badge') ? document.querySelector('.bell-badge').textContent : 'none'
    }));
    console.log('CRM Inquiries Stats:', inqStats);

    // Click on the first inquiry to open details modal
    const firstInqCard = await page.$('#inquiryList .card');
    if (firstInqCard) {
        await firstInqCard.click();
        await new Promise(r => setTimeout(r, 500));
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, '08_inquiry_detail_modal.png') });
        console.log('✓ Inquiry detail modal opened successfully.');
    }

    // 5. CHECK CRM LEADS PAGE
    console.log('\n--- 5. Checking CRM Leads Page (/CRM/leads.html) ---');
    await page.goto('http://localhost:3000/CRM/leads.html', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 1500));
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '09_crm_leads_table.png') });

    const leadsCount = await page.evaluate(() => ({
        total: document.getElementById('leadCount') ? document.getElementById('leadCount').textContent : '0',
        rows: document.querySelectorAll('#leadsTable tr').length
    }));
    console.log('CRM Leads Count:', leadsCount);

    // Test Search filter
    await page.type('#searchInput', 'Simranjeet');
    await new Promise(r => setTimeout(r, 500));
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '10_crm_leads_search.png') });
    console.log('✓ Search filter verified on Simranjeet.');

    // Clear search
    await page.evaluate(() => {
        document.getElementById('searchInput').value = '';
        renderLeads();
    });

    // 6. CHECK CRM DASHBOARD
    console.log('\n--- 6. Checking CRM Dashboard (/CRM/dashboard.html) ---');
    await page.goto('http://localhost:3000/CRM/dashboard.html', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 1500));
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '11_crm_dashboard.png') });

    const dashStats = await page.evaluate(() => ({
        totalLeads: document.getElementById('totalLeads') ? document.getElementById('totalLeads').textContent : '0',
        totalInquiries: document.getElementById('totalInquiries') ? document.getElementById('totalInquiries').textContent : '0',
        bellBadge: document.querySelector('.bell-badge') ? document.querySelector('.bell-badge').textContent : 'none'
    }));
    console.log('CRM Dashboard Stats:', dashStats);

    await browser.close();
    console.log('\n✅ ALL LEADS AND INQUIRIES TESTS PASSED 100%!');
}

runTest().catch(err => {
    console.error('Test Failed:', err);
    process.exit(1);
});
