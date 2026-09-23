const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

async function testVisualEditor() {
    const browser = await puppeteer.launch({
        executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 950 });

    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    page.on('pageerror', err => console.log('PAGE ERROR:', err.toString()));

    console.log('Navigating to http://localhost:3000/edit/ ...');
    await page.goto('http://localhost:3000/edit/', { waitUntil: 'networkidle2' });

    const checks = await page.evaluate(() => {
        return {
            hasOpenBlogModal: typeof window.openBlogModal,
            hasApplyHeadingStyle: typeof window.applyHeadingStyle,
            hasExecEditorCmd: typeof window.execEditorCmd,
            scripts: Array.from(document.querySelectorAll('script')).map(s => s.src)
        };
    });
    console.log('Checks:', checks);

    await browser.close();
}

testVisualEditor();
