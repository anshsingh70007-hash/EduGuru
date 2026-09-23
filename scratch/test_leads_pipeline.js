const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function testLeadsPipeline() {
    console.log('Testing Leads & Inquiries Pipeline End-to-End...');
    const browser = await puppeteer.launch({
        executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();

    // 1. Visit Contact page and submit form
    console.log('1. Submitting Contact form on /contact...');
    await page.goto('http://localhost:3000/contact', { waitUntil: 'networkidle2' });
    await page.type('#contactName', 'Priya Sharma (Student)');
    await page.type('#contactEmail', 'priya.sharma@example.com');
    await page.type('#contactPhone', '9876543210');
    await page.type('#contactSubject', 'Online MBA Eligibility');
    await page.type('#contactMessage', 'I am working in IT and want to pursue Online MBA. Please call me.');
    await page.click('#contactSubmitBtn');
    await new Promise(r => setTimeout(r, 1200));

    // 2. Visit Homepage and submit Callback modal
    console.log('2. Submitting Callback modal on /...');
    await page.goto('http://localhost:3000/', { waitUntil: 'networkidle2' });
    await page.click('.callback-btn');
    await new Promise(r => setTimeout(r, 600));
    await page.type('#egCbName', 'Vikram Malhotra');
    await page.type('#egCbPhone', '9812345678');
    await page.select('#egCbCourse', 'MBA / PGDM');
    await page.click('#egCallbackForm button[type="submit"]');
    await new Promise(r => setTimeout(r, 1200));

    await browser.close();

    // 3. Inspect server data files
    const leadsRaw = fs.readFileSync('data/leads.json', 'utf8');
    const inquiriesRaw = fs.readFileSync('data/inquiries.json', 'utf8');
    const leads = JSON.parse(leadsRaw || '[]');
    const inquiries = JSON.parse(inquiriesRaw || '[]');

    console.log(`\nServer leads count: ${leads.length}`);
    console.log(`Server inquiries count: ${inquiries.length}`);

    const foundContactLead = leads.find(l => l.name === 'Priya Sharma (Student)');
    const foundContactInquiry = inquiries.find(i => i.name === 'Priya Sharma (Student)');
    const foundCallbackLead = leads.find(l => l.name === 'Vikram Malhotra');

    console.log('Contact Lead in data/leads.json:', foundContactLead ? '✅ YES' : '❌ NO');
    console.log('Contact Inquiry in data/inquiries.json:', foundContactInquiry ? '✅ YES' : '❌ NO');
    console.log('Callback Lead in data/leads.json:', foundCallbackLead ? '✅ YES' : '❌ NO');

    if (foundContactLead && foundContactInquiry && foundCallbackLead) {
        console.log('\n🎉 SUCCESS: All public website leads and inquiries are now recording directly into server database!');
    } else {
        console.error('\n⚠️ Pipeline verification failed for some entries');
    }
}

testLeadsPipeline();
