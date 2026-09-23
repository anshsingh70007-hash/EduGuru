const puppeteer = require('puppeteer-core');
const path = require('path');

async function testEditorRedesign() {
    console.log('🚀 Starting Editor Redesign & Fullscreen Verification with Puppeteer...');

    const browser = await puppeteer.launch({
        executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,950']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 950 });

    page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));

    await page.goto('http://localhost:3000/edit/', { waitUntil: 'networkidle2' });

    // Step 1: Open Course Modal and inspect Course Visual Editor
    console.log('1. Opening Course Modal...');
    await page.evaluate(() => {
        window.openCourseModal();
        const modalBody = document.querySelector('#courseModal .modal-body');
        const courseCard = document.querySelector('#courseEditorContainer').closest('.form-section-card');
        if (courseCard && modalBody) {
            courseCard.scrollIntoView({ behavior: 'instant', block: 'center' });
        }
    });

    await new Promise(r => setTimeout(r, 600));

    // Verify Course Editor elements
    const courseStats = await page.evaluate(() => {
        const container = document.getElementById('courseEditorContainer');
        const card = container ? container.closest('.form-section-card') : null;
        const title = card ? card.querySelector('.form-section-title')?.textContent : null;
        const toolbar = container ? container.querySelector('.visual-editor-toolbar') : null;
        const rows = toolbar ? toolbar.children.length : 0;
        const selectH = toolbar ? toolbar.querySelector('.tool-select') : null;
        const selectTmpl = toolbar ? toolbar.querySelectorAll('.tool-select')[1] : null;
        const btnFullscreen = document.getElementById('courseFullscreenBtn');
        const canvas = document.getElementById('courseVisualEditor');
        const statusbar = document.getElementById('courseEditorStatusbar');
        const wCount = document.getElementById('courseWordCount')?.textContent;
        const cCount = document.getElementById('courseCharCount')?.textContent;
        const rTime = document.getElementById('courseReadingTime')?.textContent;

        return {
            hasContainer: !!container,
            hasCard: !!card,
            cardTitle: title,
            toolbarRows: rows,
            hasHeadingSelect: !!selectH,
            hasTemplateSelect: !!selectTmpl,
            hasFullscreenBtn: !!btnFullscreen,
            hasCanvas: !!canvas,
            hasStatusbar: !!statusbar,
            wordCount: wCount,
            charCount: cCount,
            readingTime: rTime
        };
    });

    console.log('Course Editor Inspection Results:', courseStats);

    const courseModalShot = path.join(__dirname, 'test_course_modal_redesign.png');
    await page.screenshot({ path: courseModalShot });
    console.log('📸 Saved course modal screenshot:', courseModalShot);

    // Step 2: Test Fullscreen on Course Editor
    console.log('2. Activating Fullscreen on Course Editor...');
    await page.evaluate(() => {
        const btn = document.getElementById('courseFullscreenBtn');
        if (btn) btn.click();
    });

    await new Promise(r => setTimeout(r, 600));

    const fullscreenStats = await page.evaluate(() => {
        const bodyHasClass = document.body.classList.contains('has-fullscreen-editor');
        const modal = document.getElementById('courseModal');
        const modalActive = modal.classList.contains('fullscreen-modal-active');
        const subLinksModal = document.getElementById('subLinksModal');
        const subLinksDisplay = subLinksModal ? window.getComputedStyle(subLinksModal).display : 'none';
        const container = document.getElementById('courseEditorContainer');
        const isContainerFull = container.classList.contains('fullscreen-editor');
        const containerRect = container.getBoundingClientRect();
        const canvas = document.getElementById('courseVisualEditor');
        const canvasRect = canvas.getBoundingClientRect();
        const btn = document.getElementById('courseFullscreenBtn');
        const btnText = btn ? btn.textContent.trim() : '';

        return {
            bodyHasClass,
            modalActive,
            subLinksDisplay,
            isContainerFull,
            containerWidth: containerRect.width,
            containerHeight: containerRect.height,
            canvasWidth: canvasRect.width,
            canvasHeight: canvasRect.height,
            btnText
        };
    });

    console.log('Course Fullscreen Verification:', fullscreenStats);

    const courseFullscreenShot = path.join(__dirname, 'test_course_fullscreen_active.png');
    await page.screenshot({ path: courseFullscreenShot });
    console.log('📸 Saved course fullscreen screenshot:', courseFullscreenShot);

    // Step 3: Test Template Insertion & Stats Update while in Fullscreen
    console.log('3. Testing Template insertion in Fullscreen...');
    await page.evaluate(() => {
        window.insertEditorTemplate('courseVisualEditor', 'course_guide');
    });

    await new Promise(r => setTimeout(r, 400));

    const afterTemplateStats = await page.evaluate(() => {
        const canvas = document.getElementById('courseVisualEditor');
        const wCount = document.getElementById('courseWordCount')?.textContent;
        const cCount = document.getElementById('courseCharCount')?.textContent;
        const rTime = document.getElementById('courseReadingTime')?.textContent;
        return {
            htmlLength: canvas.innerHTML.length,
            wordCount: wCount,
            charCount: cCount,
            readingTime: rTime
        };
    });

    console.log('Stats after template insertion:', afterTemplateStats);

    const templateFullscreenShot = path.join(__dirname, 'test_course_fullscreen_with_template.png');
    await page.screenshot({ path: templateFullscreenShot });
    console.log('📸 Saved course template in fullscreen screenshot:', templateFullscreenShot);

    // Step 4: Toggle out of Fullscreen
    console.log('4. Toggling out of Fullscreen...');
    await page.evaluate(() => {
        const btn = document.getElementById('courseFullscreenBtn');
        if (btn) btn.click();
    });

    await new Promise(r => setTimeout(r, 600));

    // Step 5: Close course modal and test Blog Modal Fullscreen
    console.log('5. Closing Course Modal and Testing Blog Modal Fullscreen...');
    await page.evaluate(() => {
        window.closeCourseModal();
        window.openBlogModal();
        const btn = document.getElementById('blogFullscreenBtn');
        if (btn) btn.click();
    });

    await new Promise(r => setTimeout(r, 600));

    const blogFullscreenShot = path.join(__dirname, 'test_blog_fullscreen_active.png');
    await page.screenshot({ path: blogFullscreenShot });
    console.log('📸 Saved blog fullscreen screenshot:', blogFullscreenShot);

    await browser.close();
    console.log('✅ Puppeteer verification completed successfully!');
}

testEditorRedesign().catch(err => {
    console.error('❌ Test failed with error:', err);
    process.exit(1);
});
