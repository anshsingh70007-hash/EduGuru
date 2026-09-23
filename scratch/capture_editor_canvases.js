const puppeteer = require('puppeteer-core');
const path = require('path');

async function captureEditors() {
    const browser = await puppeteer.launch({
        executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 950 });

    await page.goto('http://localhost:3000/edit/', { waitUntil: 'networkidle2' });

    // Open blog modal and scroll to visual editor
    await page.evaluate(() => {
        window.openBlogModal();
        const editor = document.getElementById('blogVisualEditor');
        editor.innerHTML = `
            <h2>1. Program Overview &amp; Industry Scope</h2>
            <p>Subharti University offers recognized management degrees with specialized career tracks.</p>
            <h3>Key Benefits for Working Executives:</h3>
            <ul>
                <li>Flexible online &amp; distance examination schedules</li>
                <li>UGC-DEB approved degree validity for PSU &amp; MNC jobs</li>
            </ul>
        `;
        const modalBody = document.querySelector('#blogModal .modal-body');
        if (modalBody) modalBody.scrollTop = modalBody.scrollHeight;
    });
    await new Promise(r => setTimeout(r, 600));

    const blogCanvasShot = path.join(__dirname, 'screenshot_blog_wysiwyg_canvas.png');
    await page.screenshot({ path: blogCanvasShot });
    console.log('Saved blog visual editor canvas screenshot:', blogCanvasShot);

    // Close blog modal, open course modal and scroll to visual editor
    await page.evaluate(() => {
        window.closeBlogModal();
        window.openCourseModal();
        const editor = document.getElementById('courseVisualEditor');
        editor.innerHTML = `
            <h2>Course Structure &amp; Specialization Tracks</h2>
            <p>Comprehensive MBA program designed for tomorrow's business leaders.</p>
        `;
        window.insertVisualInquiryBox('courseVisualEditor');
        const modalBody = document.querySelector('#courseModal .modal-body');
        if (modalBody) modalBody.scrollTop = modalBody.scrollHeight;
    });
    await new Promise(r => setTimeout(r, 600));

    const courseCanvasShot = path.join(__dirname, 'screenshot_course_wysiwyg_canvas.png');
    await page.screenshot({ path: courseCanvasShot });
    console.log('Saved course visual editor canvas screenshot:', courseCanvasShot);

    await browser.close();
}

captureEditors().catch(err => {
    console.error(err);
    process.exit(1);
});
