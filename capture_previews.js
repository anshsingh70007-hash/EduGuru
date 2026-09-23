const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    headless: 'new'
  });

  try {
    // 1. Splash Screen
    const pageSplash = await browser.newPage();
    await pageSplash.setViewport({ width: 430, height: 932, isMobile: true });
    await pageSplash.goto('http://localhost:3000/app/', { waitUntil: 'domcontentloaded' });
    await new Promise(r => setTimeout(r, 450));
    await pageSplash.screenshot({ path: 'app_splash_preview.png' });
    console.log('1. Splash screen captured to app_splash_preview.png');
    await pageSplash.close();

    // 2. Mobile Home View with Trust & Eligibility Strip
    const page = await browser.newPage();
    await page.setViewport({ width: 430, height: 932, isMobile: true });
    await page.goto('http://localhost:3000/app/', { waitUntil: 'networkidle0' });
    await page.evaluate(() => {
      const s = document.getElementById('splashScreen');
      if (s) {
        s.classList.add('splash-hidden');
        s.style.display = 'none';
      }
    });
    await new Promise(r => setTimeout(r, 400));
    await page.screenshot({ path: 'app_mobile_preview.png' });
    console.log('2. Mobile home view with trust strip captured to app_mobile_preview.png');

    // 2b. Open Eligibility Checker Modal
    await page.evaluate(() => window.openEligibilityModal());
    await new Promise(r => setTimeout(r, 500));
    await page.screenshot({ path: 'app_eligibility_modal.png' });
    console.log('2b. Eligibility modal captured to app_eligibility_modal.png');

    // Close Eligibility Modal & Open Course Details Modal
    await page.evaluate(() => {
      window.closeEligibilityModal();
      window.openCourseDetails(101);
    });
    await new Promise(r => setTimeout(r, 500));
    await page.screenshot({ path: 'app_course_details_modal.png' });
    console.log('2c. Course details modal captured to app_course_details_modal.png');

    // Open Enrollment Modal
    await page.evaluate(() => window.openEnrollModal(101));
    await new Promise(r => setTimeout(r, 500));
    await page.screenshot({ path: 'app_enrollment_modal.png' });
    console.log('3. Enrollment modal captured to app_enrollment_modal.png');

    // Close Modal & Scroll to Leadership
    await page.evaluate(() => {
      window.closeEnrollModal();
      const leader = document.querySelector('.leadership-spotlight-section');
      if (leader) leader.scrollIntoView();
    });
    await new Promise(r => setTimeout(r, 600));
    await page.screenshot({ path: 'app_leadership_preview.png' });
    console.log('4. Leadership section captured to app_leadership_preview.png');
    await page.close();

    // 5. Desktop Expanded View
    const pageDesktop = await browser.newPage();
    await pageDesktop.setViewport({ width: 1280, height: 900 });
    await pageDesktop.goto('http://localhost:3000/app/', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 2200));
    await pageDesktop.evaluate(() => {
      const btn = document.querySelector('[data-mode="expanded"]');
      if (btn) btn.click();
    });
    await new Promise(r => setTimeout(r, 600));
    await pageDesktop.screenshot({ path: 'app_desktop_expanded.png' });
    console.log('5. Desktop expanded view captured to app_desktop_expanded.png');
    await pageDesktop.close();

    console.log('All previews captured successfully!');
  } catch (err) {
    console.error('Error during capture:', err);
  } finally {
    await browser.close();
  }
})();
