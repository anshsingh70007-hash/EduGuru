const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

const pagesToTest = [
    'index.html',
    'about.html',
    'courses.html',
    'courses-details.html',
    'colleges.html',
    'universities.html',
    'blog.html',
    'blog-details.html',
    'contact.html',
    'youtube.html',
    'gallery.html',
    'events.html',
    'teachers.html',
    'CRM/index.html'
];

(async () => {
    console.log('🧪 Running Comprehensive Local File Verification Across All Pages...');
    const browser = await puppeteer.launch({
        headless: 'new',
        executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
    });
    const page = await browser.newPage();

    let allPassed = true;

    for (const relPath of pagesToTest) {
        const fullPath = path.resolve(__dirname, '..', relPath);
        const fileUrl = 'file:///' + fullPath.replace(/\\/g, '/');

        const failedReqs = [];
        const pageErrors = [];

        const onReqFailed = req => failedReqs.push(req.url());
        const onPageErr = err => pageErrors.push(err.message);

        page.on('requestfailed', onReqFailed);
        page.on('pageerror', onPageErr);

        try {
            await page.goto(fileUrl, { waitUntil: 'load', timeout: 10000 });
            const title = await page.title();

            // Check navigation links
            const links = await page.$$eval('a[href]', els => els.map(e => e.getAttribute('href')));
            const brokenRootLinks = links.filter(h => h && h.startsWith('/') && !h.startsWith('//') && !h.startsWith('/api/'));

            console.log(`\n📄 [${relPath}]`);
            console.log(`   Title: "${title}"`);
            console.log(`   Failed Assets: ${failedReqs.length}`);
            if (failedReqs.length > 0) {
                console.log(`   ⚠️ Failed URLs:`, failedReqs);
                allPassed = false;
            }
            console.log(`   Root-relative broken links: ${brokenRootLinks.length}`);
            if (brokenRootLinks.length > 0) {
                console.log(`   ⚠️ Broken Links:`, brokenRootLinks);
                allPassed = false;
            }
            console.log(`   Status: ${failedReqs.length === 0 && brokenRootLinks.length === 0 ? '✅ PASSED' : '❌ FAILED'}`);
        } catch (e) {
            console.error(`❌ Error loading [${relPath}]:`, e.message);
            allPassed = false;
        } finally {
            page.off('requestfailed', onReqFailed);
            page.off('pageerror', onPageErr);
        }
    }

    await browser.close();

    console.log('\n=============================================');
    if (allPassed) {
        console.log('🎉 ALL PAGES PASSED! Zero failed assets, zero broken links.');
    } else {
        console.log('⚠️ Some pages had issues.');
    }
    console.log('=============================================');
})();
