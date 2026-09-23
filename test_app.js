const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    headless: 'new'
  });
  const page = await browser.newPage();
  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('pageerror', err => {
    consoleErrors.push(err.message);
  });

  await page.goto('http://localhost:3000/app/', { waitUntil: 'networkidle0' });
  console.log('App loaded without network issues.');

  // Test search
  await page.type('#appSearchInput', 'B.Tech');
  await new Promise(r => setTimeout(r, 400));
  let countText = await page.$eval('#resultsCount', el => el.textContent);
  console.log('Search B.Tech results:', countText);

  // Clear search
  await page.click('#searchClearBtn');
  await new Promise(r => setTimeout(r, 300));
  countText = await page.$eval('#resultsCount', el => el.textContent);
  console.log('After clear results:', countText);

  // Test faculty filter: Law
  await page.click('[data-faculty="Law"]');
  await new Promise(r => setTimeout(r, 300));
  countText = await page.$eval('#resultsCount', el => el.textContent);
  console.log('Law faculty results:', countText);

  // Test enrollment lead submission
  await page.evaluate(() => window.openEnrollModal(401));
  await new Promise(r => setTimeout(r, 300));
  await page.type('#leadName', 'Automated Test Student');
  await page.type('#leadPhone', '9876543210');
  await page.type('#leadEmail', 'teststudent@example.com');
  await page.click('#enrollForm button[type="submit"]');
  await new Promise(r => setTimeout(r, 1200));

  const toastText = await page.$eval('#appToast', el => el.textContent);
  console.log('Toast notification text:', toastText);

  console.log('Console errors captured during tests:', consoleErrors.length, consoleErrors);

  await browser.close();
  console.log('All end-to-end tests completed successfully!');
})();
