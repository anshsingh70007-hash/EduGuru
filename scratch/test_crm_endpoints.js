const http = require('http');

function request(path, method = 'GET', body = null) {
    return new Promise((resolve, reject) => {
        const payload = body ? JSON.stringify(body) : null;
        const req = http.request({
            hostname: 'localhost',
            port: 3000,
            path: path,
            method: method,
            headers: {
                'Content-Type': 'application/json',
                ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {})
            }
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    resolve({ status: res.statusCode, data: json });
                } catch(e) {
                    resolve({ status: res.statusCode, text: data });
                }
            });
        });
        req.on('error', reject);
        if (payload) req.write(payload);
        req.end();
    });
}

async function runTests() {
    console.log('=== TESTING EDUCATIONISTGURU CRM & CONTENT STUDIO REST APIS ===\n');
    let passCount = 0;
    let failCount = 0;

    async function check(desc, fn) {
        try {
            await fn();
            console.log(`✅ PASS: ${desc}`);
            passCount++;
        } catch(err) {
            console.error(`❌ FAIL: ${desc} -> ${err.message}`);
            failCount++;
        }
    }

    // 1. CRM All collections hydration
    await check('GET /api/crm/all returns all 8 collections', async () => {
        const res = await request('/api/crm/all');
        if (res.status !== 200) throw new Error(`HTTP ${res.status}`);
        const c = res.data.data;
        if (!Array.isArray(c.leads) || !Array.isArray(c.applications) || !Array.isArray(c.enrollments) ||
            !Array.isArray(c.inquiries) || !Array.isArray(c.subscribers) || !Array.isArray(c.fees) ||
            !Array.isArray(c.users) || !Array.isArray(c.roles)) {
            throw new Error('Missing expected collection array');
        }
    });

    // 2. CRM Stats
    await check('GET /api/crm/stats returns calculated metrics', async () => {
        const res = await request('/api/crm/stats');
        if (res.status !== 200) throw new Error(`HTTP ${res.status}`);
        const s = res.data.stats;
        if (typeof s.totalLeads !== 'number' || typeof s.totalEnrollments !== 'number') {
            throw new Error('Stats metrics missing');
        }
    });

    // 3. Leads CRUD
    let testLeadId = null;
    await check('POST /api/crm/leads creates new lead', async () => {
        const res = await request('/api/crm/leads', 'POST', {
            name: 'Rohit Verma',
            phone: '+91 9811122233',
            email: 'rohit.test@gmail.com',
            course: 'MBA Healthcare Management',
            qualification: 'B.Sc Graduate',
            city: 'Lucknow',
            source: 'Google Search',
            status: 'new',
            priority: 'hot'
        });
        if (res.status !== 200 && res.status !== 201) throw new Error(`HTTP ${res.status}`);
        const item = res.data.item || res.data.data;
        if (!item || !item.id) throw new Error('No item/ID returned');
        testLeadId = item.id;
    });

    await check('GET /api/crm/leads/:id verifies lead', async () => {
        const res = await request(`/api/crm/leads/${testLeadId}`);
        if (res.status !== 200) throw new Error(`HTTP ${res.status}`);
        const item = res.data.item;
        if (!item || item.name !== 'Rohit Verma') throw new Error(`Name mismatch: ${item?.name}`);
    });

    await check('PUT /api/crm/leads/:id updates lead status', async () => {
        const res = await request(`/api/crm/leads/${testLeadId}`, 'PUT', { status: 'contacted', notes: 'Spoke on call' });
        if (res.status !== 200) throw new Error(`HTTP ${res.status}`);
        const item = res.data.item;
        if (!item || item.status !== 'contacted') throw new Error(`Status not updated: ${item?.status}`);
    });

    // 4. Applications CRUD
    let testAppId = null;
    await check('POST /api/crm/applications creates new application', async () => {
        const res = await request('/api/crm/applications', 'POST', {
            name: 'Ananya Sen',
            phone: '+91 9822233344',
            email: 'ananya.sen@gmail.com',
            course: 'MCA Data Science',
            university: 'Subharti University',
            qualification: 'BCA',
            marks: '84%',
            status: 'pending',
            feeStatus: 'paid'
        });
        if (res.status !== 200 && res.status !== 201) throw new Error(`HTTP ${res.status}`);
        const item = res.data.item || res.data.data;
        testAppId = item.id;
    });

    await check('GET /api/crm/applications/:id verifies application', async () => {
        const res = await request(`/api/crm/applications/${testAppId}`);
        if (res.status !== 200) throw new Error(`HTTP ${res.status}`);
        const item = res.data.item;
        if (!item || item.course !== 'MCA Data Science') throw new Error('Course mismatch');
    });

    // 5. Enrollments CRUD
    let testEnrId = null;
    await check('POST /api/crm/enrollments creates new enrollment', async () => {
        const res = await request('/api/crm/enrollments', 'POST', {
            studentName: 'Priya Sharma',
            rollNo: 'EG/2024/CS101',
            phone: '+91 9833344455',
            email: 'priya.sharma@gmail.com',
            course: 'B.Tech Computer Science',
            university: 'Mangalayatan University',
            batch: '2024-28',
            fee: 140000,
            paid: 35000,
            status: 'confirmed'
        });
        if (res.status !== 200 && res.status !== 201) throw new Error(`HTTP ${res.status}`);
        const item = res.data.item || res.data.data;
        testEnrId = item.id;
    });

    // 6. Fees CRUD
    let testFeeId = null;
    await check('POST /api/crm/fees records fee payment', async () => {
        const res = await request('/api/crm/fees', 'POST', {
            studentName: 'Priya Sharma',
            rollNo: 'EG/2024/CS101',
            course: 'B.Tech Computer Science',
            term: 'Semester 1',
            totalFee: 140000,
            paidAmount: 35000,
            pendingAmount: 105000,
            status: 'partial',
            paymentMode: 'UPI',
            transactionRef: 'UPI/9482104928'
        });
        if (res.status !== 200 && res.status !== 201) throw new Error(`HTTP ${res.status}`);
        const item = res.data.item || res.data.data;
        testFeeId = item.id;
    });

    // 7. Inquiries CRUD
    let testInqId = null;
    await check('POST /api/crm/inquiries records website inquiry', async () => {
        const res = await request('/api/crm/inquiries', 'POST', {
            name: 'Karan Mehta',
            email: 'karan.m@gmail.com',
            phone: '+91 9844455566',
            subject: 'Inquiry regarding Online MBA fee schedule',
            message: 'Hello, please send syllabus and semester installment plans for online MBA.',
            status: 'unread'
        });
        if (res.status !== 200 && res.status !== 201) throw new Error(`HTTP ${res.status}`);
        const item = res.data.item || res.data.data;
        testInqId = item.id;
    });

    // 8. Subscribers CRUD
    let testSubId = null;
    await check('POST /api/crm/subscribers adds newsletter reader', async () => {
        const res = await request('/api/crm/subscribers', 'POST', {
            email: `testreader.${Date.now()}@gmail.com`,
            name: 'Test Reader',
            source: 'API Test',
            status: 'active'
        });
        if (res.status !== 200 && res.status !== 201) throw new Error(`HTTP ${res.status}`);
        const item = res.data.item || res.data.data;
        testSubId = item.id;
    });

    // 9. Settings
    await check('GET & POST /api/crm/settings', async () => {
        const postRes = await request('/api/crm/settings', 'POST', {
            organization: { name: 'EducationistGuru', batch: '2024-25', status: 'Open' }
        });
        if (postRes.status !== 200) throw new Error(`HTTP ${postRes.status}`);
        const getRes = await request('/api/crm/settings');
        if (getRes.status !== 200 || !getRes.data.settings || getRes.data.settings.organization?.name !== 'EducationistGuru') {
            throw new Error('Settings verification failed');
        }
    });

    // 10. Content Studio Catalog Endpoints
    await check('GET /api/content/courses returns 106+ courses', async () => {
        const res = await request('/api/content/courses');
        if (res.status !== 200) throw new Error(`HTTP ${res.status}`);
        const list = res.data.courses;
        if (!Array.isArray(list) || list.length < 100) {
            throw new Error(`Expected at least 100 courses, got ${list?.length}`);
        }
    });

    await check('GET /api/content/colleges returns colleges list', async () => {
        const res = await request('/api/content/colleges');
        if (res.status !== 200 || !Array.isArray(res.data.colleges)) throw new Error('Colleges failed');
    });

    await check('GET /api/content/universities returns universities list', async () => {
        const res = await request('/api/content/universities');
        if (res.status !== 200 || !Array.isArray(res.data.universities)) throw new Error('Universities failed');
    });

    await check('GET /api/content/blogs returns blogs list', async () => {
        const res = await request('/api/content/blogs');
        if (res.status !== 200 || !Array.isArray(res.data.blogs)) throw new Error('Blogs failed');
    });

    await check('GET /api/content/videos returns videos list', async () => {
        const res = await request('/api/content/videos');
        if (res.status !== 200 || !Array.isArray(res.data.videos)) throw new Error('Videos failed');
    });

    // Clean up test items
    if (testLeadId) await request(`/api/crm/leads/${testLeadId}`, 'DELETE');
    if (testAppId) await request(`/api/crm/applications/${testAppId}`, 'DELETE');
    if (testEnrId) await request(`/api/crm/enrollments/${testEnrId}`, 'DELETE');
    if (testFeeId) await request(`/api/crm/fees/${testFeeId}`, 'DELETE');
    if (testInqId) await request(`/api/crm/inquiries/${testInqId}`, 'DELETE');
    if (testSubId) await request(`/api/crm/subscribers/${testSubId}`, 'DELETE');

    console.log(`\n===========================================`);
    console.log(`FINAL RESULT: ${passCount} Passed, ${failCount} Failed.`);
    console.log(`===========================================`);
}

runTests();
