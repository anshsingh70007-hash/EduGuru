const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({
        executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        headless: 'new',
        defaultViewport: { width: 1440, height: 900 }
    });
    const page = await browser.newPage();
    await page.goto('http://localhost:3000/CRM/index.html', { waitUntil: 'domcontentloaded' });
    await page.type('#loginEmail', 'admin@educationistguru.com');
    await page.type('#loginPassword', 'EduGuru#Admin2026!');
    await page.click('button[type="submit"]');
    await new Promise(r => setTimeout(r, 1500));
    await page.screenshot({ path: 'C:\\Users\\Harmeet Singh\\.gemini\\antigravity-ide\\brain\\c0780ecc-9b63-48b1-b95b-55bea492e594\\student_audit_screenshots\\30_crm_dashboard_updated.png' });
    
    await page.goto('http://localhost:3000/CRM/leads.html', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 800));
    await page.screenshot({ path: 'C:\\Users\\Harmeet Singh\\.gemini\\antigravity-ide\\brain\\c0780ecc-9b63-48b1-b95b-55bea492e594\\student_audit_screenshots\\31_crm_leads_updated.png' });

    await browser.close();
    console.log('CRM dashboard and leads screenshots captured successfully.');
})();
