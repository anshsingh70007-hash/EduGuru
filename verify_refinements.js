const puppeteer = require('puppeteer');
const path = require('path');

const ARTIFACTS_DIR = 'C:\\Users\\Harmeet Singh\\.gemini\\antigravity-ide\\brain\\84895c8e-1671-446a-8892-a698aa80aa0a';

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    headless: 'new'
  });

  // Test on standard Android mobile viewport: 360x780 (device scale factor 3.0)
  const page = await browser.newPage();
  await page.setViewport({ width: 360, height: 780, deviceScaleFactor: 2 });

  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('pageerror', err => consoleErrors.push(err.message));

  console.log('Navigating to http://localhost:3000/app/ ...');
  await page.goto('http://localhost:3000/app/', { waitUntil: 'networkidle0' });

  // Wait for splash screen to dismiss
  await new Promise(r => setTimeout(r, 2200));

  // 1. Verify Top Header layout and no overflow
  const headerLayout = await page.evaluate(() => {
    const header = document.querySelector('.app-header');
    const brand = document.querySelector('.header-left');
    const actions = document.querySelector('.header-right');
    const callBtn = document.querySelector('.counselor-call-btn');
    const hRect = header.getBoundingClientRect();
    const callRect = callBtn.getBoundingClientRect();
    return {
      headerWidth: hRect.width,
      callBtnRight: callRect.right,
      isClipped: callRect.right > hRect.right,
      callBtnText: callBtn.innerText.trim()
    };
  });
  console.log('Header Layout Verification:', headerLayout);

  // Capture Home View
  await page.screenshot({
    path: path.join(ARTIFACTS_DIR, 'preview_home_refined.png'),
    fullPage: false
  });
  console.log('Captured preview_home_refined.png');

  // Scroll Home down to show Featured Courses and Banner
  await page.evaluate(() => {
    window.scrollTo({ top: 460, behavior: 'instant' });
  });
  await new Promise(r => setTimeout(r, 400));
  await page.screenshot({
    path: path.join(ARTIFACTS_DIR, 'preview_home_featured_scrolled.png'),
    fullPage: false
  });
  console.log('Captured preview_home_featured_scrolled.png');

  // 2. Switch to Courses Catalog View
  console.log('Switching to Courses tab...');
  await page.click('button[data-view="courses"]');
  await new Promise(r => setTimeout(r, 600));

  const catalogStats = await page.evaluate(() => {
    const section = document.getElementById('coursesCatalogSection');
    const isVisible = section && section.style.display !== 'none';
    const grid = document.getElementById('catalogCoursesGrid');
    const cardsCount = grid ? grid.querySelectorAll('.course-card').length : 0;
    const telemetry = document.getElementById('catalogResultsCount') ? document.getElementById('catalogResultsCount').textContent : '';
    return { isVisible, cardsCount, telemetry };
  });
  console.log('Courses Catalog Verification:', catalogStats);

  await page.screenshot({
    path: path.join(ARTIFACTS_DIR, 'preview_courses_refined.png'),
    fullPage: false
  });
  console.log('Captured preview_courses_refined.png');

  // 3. Switch to Videos View (Official YouTube Channel Integration)
  console.log('Switching to Videos tab...');
  await page.click('button[data-view="videos"]');
  await new Promise(r => setTimeout(r, 600));

  const videoStats = await page.evaluate(() => {
    const section = document.getElementById('videosViewSection');
    const isVisible = section && section.style.display !== 'none';
    const player = document.getElementById('ytActivePlayer');
    const playerSrc = player ? player.src : '';
    const activeTitle = document.getElementById('ytActiveTitle') ? document.getElementById('ytActiveTitle').textContent : '';
    const grid = document.getElementById('ytVideosGrid');
    const videoCards = grid ? grid.querySelectorAll('.yt-video-card').length : 0;
    return { isVisible, playerSrc, activeTitle, videoCards };
  });
  console.log('Videos View Verification:', videoStats);

  await page.screenshot({
    path: path.join(ARTIFACTS_DIR, 'preview_videos_refined.png'),
    fullPage: false
  });
  console.log('Captured preview_videos_refined.png');

  // Scroll Videos down to show Library Cards
  await page.evaluate(() => {
    window.scrollTo({ top: 480, behavior: 'instant' });
  });
  await new Promise(r => setTimeout(r, 400));
  await page.screenshot({
    path: path.join(ARTIFACTS_DIR, 'preview_videos_library_scrolled.png'),
    fullPage: false
  });
  console.log('Captured preview_videos_library_scrolled.png');

  // 4. Test clicking a video from the library to test active player swap
  console.log('Testing video selection in library...');
  await page.evaluate(() => {
    window.playYouTubeVideo('LnOJbBwsyeU');
  });
  await new Promise(r => setTimeout(r, 400));

  const updatedVideo = await page.evaluate(() => {
    return {
      src: document.getElementById('ytActivePlayer').src,
      title: document.getElementById('ytActiveTitle').textContent
    };
  });
  console.log('Updated Active Video Player:', updatedVideo);

  console.log('Console Errors:', consoleErrors);
  await browser.close();
  console.log('Verification completed successfully!');
})();
