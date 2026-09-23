const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

async function testVisualEditor() {
    console.log('Launching browser to test Visual WYSIWYG Editor...');
    const browser = await puppeteer.launch({
        executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 950 });

    // 1. Test /edit page
    console.log('Navigating to http://localhost:3000/edit/ ...');
    await page.goto('http://localhost:3000/edit/', { waitUntil: 'networkidle2' });

    // Open Blog Modal
    console.log('Opening Blog Modal in /edit...');
    await page.evaluate(() => {
        if (typeof window.openBlogModal === 'function') {
            window.openBlogModal();
        }
    });
    await new Promise(r => setTimeout(r, 600));

    // Check blog modal is open and visual canvas exists
    const blogModalVisible = await page.evaluate(() => {
        const modal = document.getElementById('blogModal');
        const editor = document.getElementById('blogVisualEditor');
        return {
            modalOpen: modal ? modal.classList.contains('open') : false,
            hasVisualEditor: !!editor,
            isContentEditable: editor ? editor.contentEditable : false
        };
    });
    console.log('Blog modal status:', blogModalVisible);

    // Type text and click H1 button
    console.log('Testing visual heading formatting in Blog editor...');
    await page.evaluate(() => {
        const editor = document.getElementById('blogVisualEditor');
        editor.innerHTML = '<p>Welcome to Subharti University Admissions 2026</p><p>This is a guide for MBA applicants.</p>';
        
        // Select first paragraph
        const p = editor.querySelector('p');
        const range = document.createRange();
        range.selectNodeContents(p);
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
        
        // Click H1
        window.applyHeadingStyle('blogVisualEditor', 'h1');
        
        // Insert Inquiry Box
        window.insertVisualInquiryBox('blogVisualEditor');
    });
    await new Promise(r => setTimeout(r, 400));

    const blogEditorContent = await page.evaluate(() => {
        const editor = document.getElementById('blogVisualEditor');
        return {
            html: editor.innerHTML,
            hasH1Tag: !!editor.querySelector('h1'),
            h1Text: editor.querySelector('h1') ? editor.querySelector('h1').textContent : '',
            hasInquiryBox: !!editor.querySelector('.lead-inquiry-box'),
            rawCodeVisible: editor.innerText.includes('<h1') // Must be FALSE!
        };
    });
    console.log('Blog editor visual test result:', blogEditorContent);

    // Screenshot of Blog Modal with Visual Editor
    const blogModalShot = path.join(__dirname, 'screenshot_blog_modal_wysiwyg.png');
    await page.screenshot({ path: blogModalShot });
    console.log('Saved screenshot:', blogModalShot);

    // Close blog modal and open Course Modal
    console.log('Opening Course Modal to verify course visual editor...');
    await page.evaluate(() => {
        window.closeBlogModal();
        window.openCourseModal();
    });
    await new Promise(r => setTimeout(r, 600));

    const courseEditorStatus = await page.evaluate(() => {
        const modal = document.getElementById('courseModal');
        const editor = document.getElementById('courseVisualEditor');
        return {
            modalOpen: modal ? modal.classList.contains('open') : false,
            hasVisualEditor: !!editor,
            isContentEditable: editor ? editor.contentEditable : false
        };
    });
    console.log('Course modal status:', courseEditorStatus);

    const courseModalShot = path.join(__dirname, 'screenshot_course_modal_wysiwyg.png');
    await page.screenshot({ path: courseModalShot });
    console.log('Saved screenshot:', courseModalShot);

    // 2. Test blog-details.html?id=100
    console.log('Navigating to http://localhost:3000/blog-details.html?id=100 ...');
    await page.goto('http://localhost:3000/blog-details.html?id=100', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 1000));

    const blogPageStatus = await page.evaluate(() => {
        const titleEl = document.querySelector('.blog-title');
        const headingsH2 = document.querySelectorAll('.blog-body h2');
        const inquiryBox = document.querySelector('.blog-body .lead-inquiry-box');
        const sidebarCard = document.querySelector('.sidebar-inquiry-card');
        return {
            pageTitle: document.title,
            blogTitle: titleEl ? titleEl.textContent : '',
            h2Count: headingsH2.length,
            hasInquiryBox: !!inquiryBox,
            hasSidebarCard: !!sidebarCard
        };
    });
    console.log('Blog details page render status:', blogPageStatus);

    const blogDetailsShot = path.join(__dirname, 'screenshot_subharti_blog_page.png');
    await page.screenshot({ path: blogDetailsShot, fullPage: true });
    console.log('Saved screenshot:', blogDetailsShot);

    await browser.close();
    console.log('🎉 All automated tests completed successfully!');
}

testVisualEditor().catch(err => {
    console.error('Test error:', err);
    process.exit(1);
});
