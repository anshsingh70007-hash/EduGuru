const puppeteer = require('puppeteer-core');
const path = require('path');

(async () => {
    const browser = await puppeteer.launch({
        executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        headless: 'new',
        args: ['--no-sandbox', '--window-size=1440,960'],
        defaultViewport: { width: 1440, height: 960 }
    });
    const page = await browser.newPage();
    await page.goto('http://localhost:3000/crm/', { waitUntil: 'networkidle2' });
    await page.evaluate(() => {
        if (typeof fillAdminCredentials === 'function') fillAdminCredentials();
    });
    await new Promise(r => setTimeout(r, 200));
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle2' }).catch(() => {});
    await new Promise(r => setTimeout(r, 1000));

    const dir = 'C:\\Users\\Harmeet Singh\\.gemini\\antigravity-ide\\brain\\c0780ecc-9b63-48b1-b95b-55bea492e594\\snapshots';
    await page.screenshot({ path: path.join(dir, 'phase3_crm_dashboard.png') });
    console.log('CRM dashboard snapshot saved');

    await page.goto('http://localhost:3000/crm/leads.html', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 800));
    await page.screenshot({ path: path.join(dir, 'phase3_crm_leads.png') });
    console.log('CRM leads snapshot saved');

    await browser.close();
})().catch(err => {
    console.error('Error in snapshot_crm:', err);
    process.exit(1);
});
