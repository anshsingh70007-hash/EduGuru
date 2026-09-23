const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const ARTIFACTS_DIR = 'C:\\Users\\Harmeet Singh\\.gemini\\antigravity-ide\\brain\\c0780ecc-9b63-48b1-b95b-55bea492e594';
const SCREENSHOT_DIR = path.join(ARTIFACTS_DIR, 'student_audit_screenshots');
if (!fs.existsSync(SCREENSHOT_DIR)) fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

async function runStudentAudit() {
    console.log('====================================================');
    console.log('🧑‍🎓 DEEP AUDIT: SMART STUDENT, CONTENT STUDIO & CRM');
    console.log('====================================================\n');

    const browser = await puppeteer.launch({
        executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900'],
        defaultViewport: { width: 1440, height: 900 }
    });

    const page = await browser.newPage();

    const auditFindings = {
        consoleErrors: [],
        brokenRequests: [],
        uxObservations: [],
        featureStatus: {}
    };

    page.on('console', msg => {
        if (msg.type() === 'error') {
            auditFindings.consoleErrors.push({ url: page.url(), text: msg.text() });
        }
    });

    page.on('requestfailed', req => {
        auditFindings.brokenRequests.push({
            url: req.url(),
            failure: req.failure() ? req.failure().errorText : 'Unknown failure',
            page: page.url()
        });
    });

    try {
        // ==========================================
        // 1. PUBLIC WEBSITE - HOMEPAGE JOURNEY
        // ==========================================
        console.log('>>> [PHASE 1] Student visits Homepage (http://localhost:3000/)...');
        await page.goto('http://localhost:3000/', { waitUntil: 'networkidle2' });
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, '01_homepage_hero.png') });

        // Check Top CTA button "Request Callback"
        console.log('    Testing "Request Callback" top button...');
        const callbackBtn = await page.$('.callback-btn');
        if (callbackBtn) {
            await callbackBtn.click();
            await new Promise(r => setTimeout(r, 600));
            const cbOverlayActive = await page.$eval('#egCbOverlay', el => el.classList.contains('active')).catch(() => false);
            auditFindings.featureStatus.callbackModalOpened = cbOverlayActive;
            console.log(`    Callback modal active: ${cbOverlayActive}`);
            if (cbOverlayActive) {
                await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02_callback_modal_opened.png') });
                // Check form inputs
                await page.type('#egCbName', 'Aarav Sharma');
                await page.type('#egCbPhone', '9876543210');
                await page.select('#egCbCourse', 'MBA / PGDM');
                await page.screenshot({ path: path.join(SCREENSHOT_DIR, '03_callback_modal_filled.png') });
                // Submit form
                await page.click('#egCbFormWrap button[type="submit"]');
                await new Promise(r => setTimeout(r, 1000));
                const successActive = await page.$eval('#egCbSuccess', el => el.classList.contains('active')).catch(() => false);
                console.log(`    Callback modal submitted success: ${successActive}`);
                auditFindings.featureStatus.callbackSubmittedSuccess = successActive;
                await page.screenshot({ path: path.join(SCREENSHOT_DIR, '04_callback_modal_success.png') });
                // Close modal
                if (successActive) {
                    const doneBtn = await page.$('#egCbDoneBtn');
                    if (doneBtn) await doneBtn.click();
                } else {
                    const closeBtn = await page.$('#egCbClose');
                    if (closeBtn) await closeBtn.click();
                }
                await new Promise(r => setTimeout(r, 400));
            }
        }

        // ==========================================
        // 2. PUBLIC WEBSITE - COURSES DIRECTORY
        // ==========================================
        console.log('\n>>> [PHASE 2] Student navigates to Courses directory (/courses)...');
        await page.goto('http://localhost:3000/courses', { waitUntil: 'networkidle2' });
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, '05_courses_directory.png') });

        // Search for MBA
        console.log('    Searching for "MBA"...');
        await page.type('#eg-course-search-input', 'MBA');
        await new Promise(r => setTimeout(r, 600));
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, '06_courses_search_mba.png') });

        // Check Course Card and Apply Button
        const courseCards = await page.$$('.eg-course-card');
        console.log(`    Found ${courseCards.length} courses matching "MBA".`);
        if (courseCards.length > 0) {
            const enrollBtn = await page.$('.eg-course-card .btn-eg-primary');
            if (enrollBtn) {
                console.log('    Clicking "Apply Now" on first course card...');
                await enrollBtn.click();
                await new Promise(r => setTimeout(r, 600));
                const enrollActive = await page.$eval('#egEnrollOverlay', el => el.classList.contains('active')).catch(() => false);
                console.log(`    Enrollment modal active: ${enrollActive}`);
                auditFindings.featureStatus.courseEnrollModalOpened = enrollActive;
                await page.screenshot({ path: path.join(SCREENSHOT_DIR, '07_course_enroll_modal.png') });
                if (enrollActive) {
                    await page.click('#egEnrollClose');
                    await new Promise(r => setTimeout(r, 400));
                }
            }
        }

        // ==========================================
        // 3. PUBLIC WEBSITE - COLLEGES DIRECTORY
        // ==========================================
        console.log('\n>>> [PHASE 3] Student navigates to Colleges directory (/colleges)...');
        await page.goto('http://localhost:3000/colleges', { waitUntil: 'networkidle2' });
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, '08_colleges_page.png') });

        // Check Apply button
        const collegeApplyBtn = await page.$('#eg-colleges-grid .btn-primary, #eg-colleges-grid a[onclick*="applyForInstitution"]');
        if (collegeApplyBtn) {
            console.log('    Clicking "Apply Now" on first college...');
            await collegeApplyBtn.click();
            await new Promise(r => setTimeout(r, 600));
            const cbOverlayActive = await page.$eval('#egCbOverlay', el => el.classList.contains('active')).catch(() => false);
            console.log(`    College apply modal opened: ${cbOverlayActive}`);
            auditFindings.featureStatus.collegeApplyOpened = cbOverlayActive;
            await page.screenshot({ path: path.join(SCREENSHOT_DIR, '09_college_apply_modal.png') });
            if (cbOverlayActive) {
                await page.click('#egCbClose');
                await new Promise(r => setTimeout(r, 400));
            }
        }

        // Check College Details Modal
        const collegeDetailBtn = await page.$('#eg-colleges-grid a[onclick*="showCollegeDetails"]');
        if (collegeDetailBtn) {
            console.log('    Clicking "Details" on first college...');
            await collegeDetailBtn.click();
            await new Promise(r => setTimeout(r, 600));
            await page.screenshot({ path: path.join(SCREENSHOT_DIR, '10_college_detail_modal.png') });
            await page.keyboard.press('Escape');
            await new Promise(r => setTimeout(r, 400));
        }

        // ==========================================
        // 4. PUBLIC WEBSITE - UNIVERSITIES DIRECTORY
        // ==========================================
        console.log('\n>>> [PHASE 4] Student navigates to Universities directory (/universities)...');
        await page.goto('http://localhost:3000/universities', { waitUntil: 'networkidle2' });
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, '11_universities_page.png') });

        // Click University Detail
        const univDetailBtn = await page.$('#eg-universities-grid a[onclick*="showUnivDetails"]');
        if (univDetailBtn) {
            console.log('    Clicking "Details" on first university...');
            await univDetailBtn.click();
            await new Promise(r => setTimeout(r, 600));
            await page.screenshot({ path: path.join(SCREENSHOT_DIR, '12_univ_detail_modal.png') });
            await page.keyboard.press('Escape');
            await new Promise(r => setTimeout(r, 400));
        }

        // ==========================================
        // 5. PUBLIC WEBSITE - CONTACT PAGE & FORM
        // ==========================================
        console.log('\n>>> [PHASE 5] Student visits Contact Page (/contact)...');
        await page.goto('http://localhost:3000/contact', { waitUntil: 'networkidle2' });
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, '13_contact_page.png') });

        // Inspect Contact Form inputs
        const contactFormInputs = await page.evaluate(() => {
            const form = document.querySelector('.contact-form form');
            if (!form) return null;
            const inputs = Array.from(form.querySelectorAll('input, textarea, button'));
            return inputs.map(i => ({
                tag: i.tagName,
                type: i.type || null,
                placeholder: i.placeholder || null,
                name: i.name || null,
                id: i.id || null
            }));
        });
        console.log('    Contact form input fields structure:', JSON.stringify(contactFormInputs));
        auditFindings.uxObservations.push(`Contact form inputs lack 'name' or explicit 'id' bindings: ${JSON.stringify(contactFormInputs)}`);

        // ==========================================
        // 6. CRM PORTAL - VERIFY LEAD INTAKE & WORKFLOW
        // ==========================================
        console.log('\n>>> [PHASE 6] Counselor logs into CRM (/CRM/)...');
        await page.goto('http://localhost:3000/CRM/index.html', { waitUntil: 'domcontentloaded' });
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, '14_crm_login_page.png') });
        
        // Log in using actual IDs: #loginEmail, #loginPassword
        await page.type('#loginEmail', 'admin@educationistguru.com');
        await page.type('#loginPassword', 'EduGuru#Admin2026!');
        await page.click('button[type="submit"]');
        await new Promise(r => setTimeout(r, 1200));
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, '15_crm_dashboard.png') });

        // Leads Page
        console.log('    Navigating to CRM Leads (/CRM/leads.html)...');
        await page.goto('http://localhost:3000/CRM/leads.html', { waitUntil: 'networkidle2' });
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, '16_crm_leads_table.png') });

        // Applications Page
        console.log('    Navigating to CRM Applications (/CRM/applications.html)...');
        await page.goto('http://localhost:3000/CRM/applications.html', { waitUntil: 'networkidle2' });
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, '17_crm_applications_table.png') });

        // Enrollments Page
        console.log('    Navigating to CRM Enrollments (/CRM/enrollments.html)...');
        await page.goto('http://localhost:3000/CRM/enrollments.html', { waitUntil: 'networkidle2' });
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, '18_crm_enrollments_table.png') });

        // Inquiries Page
        console.log('    Navigating to CRM Inquiries (/CRM/inquiries.html)...');
        await page.goto('http://localhost:3000/CRM/inquiries.html', { waitUntil: 'networkidle2' });
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, '19_crm_inquiries_table.png') });

        // Subscribers Page
        console.log('    Navigating to CRM Subscribers (/CRM/subscribers.html)...');
        await page.goto('http://localhost:3000/CRM/subscribers.html', { waitUntil: 'networkidle2' });
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, '20_crm_subscribers_table.png') });

        // Settings Page
        console.log('    Navigating to CRM Settings (/CRM/settings.html)...');
        await page.goto('http://localhost:3000/CRM/settings.html', { waitUntil: 'networkidle2' });
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, '21_crm_settings_page.png') });

        // ==========================================
        // 7. CONTENT STUDIO - TEST CREATION SUITE
        // ==========================================
        console.log('\n>>> [PHASE 7] Admin visits Content Studio (/edit)...');
        await page.goto('http://localhost:3000/edit', { waitUntil: 'domcontentloaded' });
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, '22_content_studio_login.png') });

        // Check if login is needed or already logged in
        const studioPassInput = await page.$('#editPassInput, #adminPass, input[type="password"]');
        if (studioPassInput) {
            console.log('    Logging into Content Studio...');
            const emailInp = await page.$('#editEmailInput, #adminEmail');
            if (emailInp) await emailInp.type('admin@educationistguru.com');
            await studioPassInput.type('EduGuru#Admin2026!');
            const loginBtn = await page.$('#editLoginBtn, button[type="submit"]');
            if (loginBtn) await loginBtn.click();
            await new Promise(r => setTimeout(r, 1200));
        }

        await page.screenshot({ path: path.join(SCREENSHOT_DIR, '23_content_studio_courses.png') });

        // Check tabs in Content Studio
        const studioTabs = ['colleges', 'universities', 'blogs', 'youtube', 'courses'];
        for (const tab of studioTabs) {
            console.log(`    Testing Studio tab: "${tab}"...`);
            const tabBtn = await page.$(`[data-tab="${tab}"], button[onclick*="${tab}"]`);
            if (tabBtn) {
                await tabBtn.click();
                await new Promise(r => setTimeout(r, 500));
                await page.screenshot({ path: path.join(SCREENSHOT_DIR, `24_studio_${tab}.png`) });
            }
        }

        // Test "Add Course" or "Add College" modal trigger
        console.log('    Testing "Add College" modal button...');
        const addBtn = await page.$('button[onclick*="openAdd"], button[onclick*="openModal"], .btn-primary');
        if (addBtn) {
            await addBtn.click();
            await new Promise(r => setTimeout(r, 600));
            await page.screenshot({ path: path.join(SCREENSHOT_DIR, '25_studio_add_modal.png') });
            await page.keyboard.press('Escape');
            await new Promise(r => setTimeout(r, 400));
        }

    } catch (err) {
        console.error('Audit encountered error:', err);
    } finally {
        await browser.close();
        console.log('\n====================================================');
        console.log('✅ AUDIT RUNNER FINISHED SUCCESSFULLY');
        console.log(`   Console Errors: ${auditFindings.consoleErrors.length}`);
        console.log(`   Broken Requests: ${auditFindings.brokenRequests.length}`);
        console.log(`   UX Observations: ${auditFindings.uxObservations.length}`);
        console.log('====================================================');
        
        fs.writeFileSync(
            path.join(ARTIFACTS_DIR, 'student_audit_raw_results.json'),
            JSON.stringify(auditFindings, null, 2),
            'utf8'
        );
    }
}

runStudentAudit();
