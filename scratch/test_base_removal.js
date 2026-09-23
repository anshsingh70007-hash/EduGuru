const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

let content = fs.readFileSync(path.join(__dirname, '../universities.html'), 'utf8');
content = content.replace(/<base href="\/">/i, '');
const testPath = path.join(__dirname, '../test_univ.html');
fs.writeFileSync(testPath, content, 'utf8');

(async () => {
    const browser = await puppeteer.launch({
        headless: 'new',
        executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
    });
    const page = await browser.newPage();
    const failedUrls = [];
    page.on('requestfailed', req => failedUrls.push(req.url()));

    const p = 'file:///' + testPath.replace(/\\/g, '/');
    await page.goto(p, { waitUntil: 'load', timeout: 10000 });
    console.log('Title:', await page.title());
    console.log('Failed URLs without base tag count:', failedUrls.length);
    console.log('Failed URLs:', failedUrls);
    await browser.close();
    fs.unlinkSync(testPath);
})();
