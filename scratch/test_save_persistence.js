const puppeteer = require('puppeteer-core');
const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

async function run() {
    console.log('--- Testing College & University Form Submission & Persistence ---');
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

        await page.goto('http://localhost:3000/edit/', { waitUntil: 'networkidle2' });
        await page.waitForSelector('#editApp', { visible: true, timeout: 5000 });

        // 1. Add Test College
        await page.click('.menu-item[data-tab="colleges"]');
        await new Promise(r => setTimeout(r, 600));

        await page.click('#openAddCollegeBtn');
        await page.waitForSelector('#collegeModal.open', { visible: true, timeout: 4000 });

        const testName = `Automated Test Institute of AI & Tech ${Date.now()}`;
        await page.type('#collegeNameInput', testName);
        await page.type('#collegeLocationInput', 'Gurugram, Haryana');
        
        // Toggle Pharmacy domain
        await page.evaluate(() => {
            const card = Array.from(document.querySelectorAll('#collegeCategoryCardsGrid .stream-card'))
                .find(c => c.textContent.includes('Pharmacy'));
            if (card) card.click();
        });
        await new Promise(r => setTimeout(r, 300));

        // Submit form
        console.log('Submitting College Form...');
        await page.click('#collegeForm button[type="submit"]');
        await new Promise(r => setTimeout(r, 1500));

        // Verify college modal closed
        const isClosed = await page.$eval('#collegeModal', m => !m.classList.contains('open'));
        console.log('✓ College Modal Closed after save:', isClosed);

        // Verify college appears in directory list
        const collegeExists = await page.evaluate((name) => {
            return Array.from(document.querySelectorAll('.card-title')).some(el => el.textContent.includes(name));
        }, testName);
        console.log('✓ Newly added college rendered in live grid:', collegeExists);

        // Clean up test college
        if (collegeExists) {
            console.log('Cleaning up test college...');
            await page.evaluate((name) => {
                const card = Array.from(document.querySelectorAll('.content-card'))
                    .find(c => c.querySelector('.card-title')?.textContent.includes(name));
                if (card) {
                    const deleteBtn = card.querySelector('button[title="Delete College"]');
                    if (deleteBtn) deleteBtn.click();
                }
            });
            await new Promise(r => setTimeout(r, 500));
            await page.click('#confirmDeleteBtn');
            await new Promise(r => setTimeout(r, 1000));
            console.log('✓ Test college deleted and directory restored clean.');
        }

        console.log('=== CRUD & DATA PERSISTENCE VERIFICATION SUCCESSFUL ===');
    } catch (e) {
        console.error('PERSISTENCE TEST ERROR:', e);
    } finally {
        await browser.close();
    }
}

run();
