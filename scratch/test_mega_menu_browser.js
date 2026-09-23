const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

(async () => {
    console.log('Launching browser to test Mega-Menu & Content Studio...');
    const browser = await puppeteer.launch({
        headless: 'new',
        executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });

    // 1. Test Homepage Mega-Menu
    console.log('Navigating to http://localhost:3000/index.html...');
    await page.goto('http://localhost:3000/index.html', { waitUntil: 'networkidle2', timeout: 30000 });

    // Wait a brief moment for site-menu.js to hydrate
    await new Promise(r => setTimeout(r, 1200));

    // Check announcement bar
    const announcementExists = await page.evaluate(() => {
        const bar = document.querySelector('.eg-announcement-bar');
        return bar ? bar.textContent.trim() : null;
    });
    console.log('Announcement Bar Text:', announcementExists ? announcementExists.slice(0, 80) + '...' : 'NOT FOUND');

    // Check Mega-Menu items under Courses
    const coursesColHeadings = await page.evaluate(() => {
        const headings = document.querySelectorAll('.eg-megamenu-heading');
        return Array.from(headings).map(h => h.textContent.trim());
    });
    console.log('Mega-Menu Column Headings:', coursesColHeadings);

    // Check management items inside Courses Mega-Menu
    const mgmtCourses = await page.evaluate(() => {
        const list = document.querySelectorAll('.eg-megamenu-col:nth-child(2) .eg-megamenu-list li a');
        return Array.from(list).map(a => a.textContent.replace(/\s+/g, ' ').trim());
    });
    console.log('Management Courses in Mega-Menu:', mgmtCourses);

    // Check custom headers (e.g. Boards & Open School)
    const customHeaders = await page.evaluate(() => {
        const items = document.querySelectorAll('.rs-menu .nav-menu > li');
        return Array.from(items).map(li => li.querySelector('a')?.textContent.replace(/\s+/g, ' ').trim());
    });
    console.log('Nav Items on Live Site:', customHeaders);

    // Hover over Courses to trigger mega-menu CSS visibility
    await page.hover('.has-megamenu > a');
    await new Promise(r => setTimeout(r, 600));

    const screenshotHome = path.join(__dirname, 'screenshot_megamenu_hover.png');
    await page.screenshot({ path: screenshotHome, clip: { x: 0, y: 0, width: 1440, height: 750 } });
    console.log('Saved screenshot:', screenshotHome);

    // 2. Test Content Studio Headers Tab
    console.log('Navigating to http://localhost:3000/edit...');
    await page.goto('http://localhost:3000/edit', { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(r => setTimeout(r, 1000));

    // Switch to tab 6 (headers)
    await page.evaluate(() => {
        if (window.switchTab) window.switchTab('headers');
    });
    await new Promise(r => setTimeout(r, 800));

    const headerTabTitle = await page.evaluate(() => {
        const el = document.querySelector('#tab-headers h2');
        return el ? el.textContent.trim() : null;
    });
    console.log('Headers Tab Title in Studio:', headerTabTitle);

    const customHeadersInStudio = await page.evaluate(() => {
        const rows = document.querySelectorAll('#customHeadersList .header-row-item');
        return rows.length;
    });
    console.log('Custom Headers rendered in Studio:', customHeadersInStudio);

    const screenshotStudio = path.join(__dirname, 'screenshot_studio_headers.png');
    await page.screenshot({ path: screenshotStudio, fullPage: false });
    console.log('Saved screenshot:', screenshotStudio);

    // 3. Test Course Details for Subharti MBA
    console.log('Navigating to http://localhost:3000/courses-details.html?id=107...');
    await page.goto('http://localhost:3000/courses-details.html?id=107', { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(r => setTimeout(r, 1200));

    const courseTitle = await page.evaluate(() => {
        const el = document.getElementById('heroCourseTitle');
        return el ? el.textContent.trim() : null;
    });
    console.log('Subharti Course Details Title:', courseTitle);

    const screenshotCourse = path.join(__dirname, 'screenshot_subharti_mba.png');
    await page.screenshot({ path: screenshotCourse, clip: { x: 0, y: 0, width: 1440, height: 900 } });
    console.log('Saved screenshot:', screenshotCourse);

    await browser.close();
    console.log('🎉 Browser test completed successfully!');
})();
