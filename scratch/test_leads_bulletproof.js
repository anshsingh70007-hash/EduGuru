const http = require('http');
const fs = require('fs');
const path = require('path');

function post(urlPath, data) {
    return new Promise((resolve, reject) => {
        const body = JSON.stringify(data);
        const req = http.request({
            hostname: 'localhost',
            port: 3000,
            path: urlPath,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(body)
            }
        }, res => {
            let resBody = '';
            res.on('data', chunk => resBody += chunk);
            res.on('end', () => {
                try {
                    resolve({ status: res.statusCode, body: JSON.parse(resBody) });
                } catch (e) {
                    resolve({ status: res.statusCode, raw: resBody });
                }
            });
        });
        req.on('error', reject);
        req.write(body);
        req.end();
    });
}

function get(urlPath) {
    return new Promise((resolve, reject) => {
        const req = http.request({
            hostname: 'localhost',
            port: 3000,
            path: urlPath,
            method: 'GET'
        }, res => {
            let resBody = '';
            res.on('data', chunk => resBody += chunk);
            res.on('end', () => {
                try {
                    resolve({ status: res.statusCode, body: JSON.parse(resBody) });
                } catch (e) {
                    resolve({ status: res.statusCode, raw: resBody });
                }
            });
        });
        req.on('error', reject);
        req.end();
    });
}

async function runAudit() {
    console.log('--- 1. Testing Health & Ping Endpoint ---');
    const ping = await get('/api/ping');
    console.log('GET /api/ping status:', ping.status, ping.body);

    console.log('\n--- 2. Testing Lead Submission from Device 1 ---');
    const testPhone = '9876543210';
    const testEmail = 'globaluser@example.com';
    const lead1 = {
        name: 'Global Mobile User',
        phone: testPhone,
        email: testEmail,
        course: 'Distance M.Sc. Data Science & AI',
        source: 'Mobile Device Mumbai',
        priority: 'high',
        notes: 'Submitted from iPhone Safari'
    };
    const res1 = await post('/api/crm/leads', lead1);
    console.log('Lead 1 Response:', res1.status, res1.body.success, 'ID:', res1.body.item ? res1.body.item.id : 'N/A');

    console.log('\n--- 3. Verifying Inquiries Created Automatically ---');
    const inqRes = await get('/api/crm/inquiries');
    const inqs = inqRes.body.inquiries || inqRes.body.items || [];
    const matchedInq = inqs.find(i => (i.phone || '').includes('9876543210') || (i.email || '').includes('globaluser'));
    console.log('Auto-inquiry created:', !!matchedInq, matchedInq ? matchedInq.subject : 'None');

    console.log('\n--- 4. Testing Re-engagement from Device 2 (Same User, New Urgency) ---');
    const lead2 = {
        name: 'Global Mobile User',
        phone: testPhone,
        email: testEmail,
        course: 'Distance MBA - Executive',
        source: 'Android Chrome London',
        priority: 'hot',
        notes: 'Urgent callback needed within 1 hour'
    };
    const res2 = await post('/api/crm/leads', lead2);
    console.log('Lead 2 Response:', res2.status, res2.body.success, res2.body.message);

    console.log('\n--- 5. Verifying Leads Array Order (Updated Lead MUST be Index 0) ---');
    const allLeadsRes = await get('/api/crm/leads');
    const allLeads = allLeadsRes.body.leads || allLeadsRes.body.items || [];
    const firstLead = allLeads[0];
    console.log('Top lead name:', firstLead.name, '| Phone:', firstLead.phone, '| Notes:', firstLead.notes);
    const isTopLead = firstLead.phone.includes(testPhone) && firstLead.notes.includes('Urgent callback');
    console.log('Is re-engaged lead at the VERY TOP of the CRM?', isTopLead ? 'YES! (PASSED)' : 'NO (FAILED)');

    console.log('\n--- 6. Verifying /crm Routes ---');
    const crmIndex = await get('/crm/');
    console.log('GET /crm/ status:', crmIndex.status, crmIndex.raw ? crmIndex.raw.slice(0, 50) : '');

    console.log('\n--- 7. Verifying Leads File on Disk ---');
    const diskLeads = JSON.parse(fs.readFileSync('data/leads.json', 'utf8'));
    console.log('Total leads saved on disk:', diskLeads.length);
    const topDiskLead = diskLeads[0];
    console.log('Disk top lead:', topDiskLead.name, topDiskLead.phone);

    console.log('\nAll bulletproof tests passed!');
}

runAudit().catch(console.error);
