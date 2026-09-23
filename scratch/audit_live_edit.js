const puppeteer = require('puppeteer-core');
const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

async function run() {
    console.log('--- Auditing Live https://educationistguru.com/edit/ ---');
    const browser = await puppeteer.launch({
        executablePath: EDGE_PATH,
        headless: true,
        defaultViewport: { width: 1440, height: 950 },
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
        const page = await browser.newPage();
        
        page.on('console', msg => {
            console.log(`[PAGE ${msg.type().toUpperCase()}]:`, msg.text());
        });
        page.on('pageerror', err => {
            console.log('[PAGE ERROR]:', err.message);
        });

        // Login as admin
        await page.evaluateOnNewDocument(() => {
            localStorage.setItem('edit_logged_in', 'true');
            localStorage.setItem('edit_user', JSON.stringify({ email: 'admin@educationistguru.com', role: 'admin', name: 'Harmeet Singh' }));
        });

        console.log('Navigating to https://educationistguru.com/edit/ ...');
        const resp = await page.goto('https://educationistguru.com/edit/', { waitUntil: 'networkidle2', timeout: 25000 });
        console.log('HTTP Status:', resp.status());

        // Inspect linked CSS files
        const links = await page.$$eval('link[rel="stylesheet"]', els => els.map(e => e.href));
        console.log('Linked stylesheets:', links);

        // Inspect linked JS files
        const scripts = await page.$$eval('script[src]', els => els.map(e => e.src));
        console.log('Linked scripts:', scripts);

        // Open College Modal
        console.log('Opening College Modal on live site...');
        await page.evaluate(() => {
            if (typeof window.openCollegeModal === 'function') {
                window.openCollegeModal();
            } else {
                console.error('window.openCollegeModal is NOT defined!');
            }
        });

        await new Promise(r => setTimeout(r, 1000));

        // Check computed style of modal dialog
        const modalBg = await page.evaluate(() => {
            const el = document.querySelector('#collegeModal .modal-dialog');
            return el ? window.getComputedStyle(el).backgroundColor : null;
        });
        console.log('Computed background of #collegeModal .modal-dialog:', modalBg);

        // Check computed style of form-section-card
        const cardBg = await page.evaluate(() => {
            const el = document.querySelector('.form-section-card');
            return el ? {
                bg: window.getComputedStyle(el).backgroundColor,
                border: window.getComputedStyle(el).border,
                padding: window.getComputedStyle(el).padding
            } : 'NOT_FOUND';
        });
        console.log('Computed styles of .form-section-card:', cardBg);

        // Check stream cards count
        const streamCardsCount = await page.$$eval('#collegeCategoryCardsGrid .stream-card', els => els.length);
        console.log('Rendered stream cards in live College Modal:', streamCardsCount);

        // Check innerHTML of collegeCategoryCardsGrid
        const gridHtml = await page.$eval('#collegeCategoryCardsGrid', el => el.innerHTML);
        console.log('collegeCategoryCardsGrid innerHTML length:', gridHtml.length);
        if (gridHtml.length < 200) {
            console.log('Grid HTML Content:', gridHtml);
        }

    } catch (e) {
        console.error('AUDIT ERROR:', e);
    } finally {
        await browser.close();
    }
}

run();
