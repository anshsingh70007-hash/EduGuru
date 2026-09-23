const https = require('https');

function request(url, options = {}, body = null) {
    return new Promise((resolve) => {
        const u = new URL(url);
        const reqOptions = {
            hostname: u.hostname,
            path: u.pathname + u.search,
            method: options.method || 'GET',
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'Mozilla/5.0 Bulletproof-Tester',
                ...(options.headers || {})
            }
        };
        const req = https.request(reqOptions, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                let parsed = null;
                try { parsed = JSON.parse(data); } catch(e) {}
                resolve({ status: res.statusCode, headers: res.headers, raw: data.substring(0, 300), data: parsed });
            });
        });
        req.on('error', (e) => resolve({ error: e.message }));
        if (body) {
            req.write(typeof body === 'string' ? body : JSON.stringify(body));
        }
        req.end();
    });
}

async function runLiveAudit() {
    console.log('====================================================');
    console.log(' AUDITING HOSTINGER LIVE API & PERSISTENCE ENGINE');
    console.log('====================================================\n');

    const BASE = 'https://educationistguru.com';

    // 1. COURSES
    console.log('--- 1. Testing Course Live Persistence ---');
    const coursePayload = {
        name: 'TEST_AUTOMATED_COURSE_PERSIST',
        faculty: 'Faculty of Commerce & Management',
        duration: '2 Years',
        eligibility: '10+2',
        mode: 'Online',
        fee: '₹50,000 / year',
        image: 'images/courses/1.jpg',
        description: 'Automated test course description',
        overviewContent: 'Automated test course overview',
        metaDescription: 'Automated test meta description',
        tags: ['TestTag1', 'TestTag2'],
        categories: ['Management'],
        keywords: ['TestKw1']
    };
    const cPost = await request(`${BASE}/api/content/courses`, { method: 'POST' }, coursePayload);
    console.log('Course POST status:', cPost.status, 'success:', cPost.data?.success, 'id:', cPost.data?.course?.id);
    const courseId = cPost.data?.course?.id;

    if (courseId) {
        // Verify in public data/courses.json directly from web
        const cVerify = await request(`${BASE}/data/courses.json?_t=${Date.now()}`);
        const foundInJson = Array.isArray(cVerify.data) && cVerify.data.some(c => String(c.id) === String(courseId));
        console.log('Verified course in live data/courses.json:', foundInJson);

        // Delete cleanup
        const cDel = await request(`${BASE}/api/content/courses/${courseId}?_method=DELETE`, { method: 'POST', headers: { 'X-HTTP-Method-Override': 'DELETE' } }, { action: 'delete' });
        console.log('Course DELETE status:', cDel.status, 'success:', cDel.data?.success);
    }

    // 2. BLOGS
    console.log('\n--- 2. Testing Blog Live Persistence ---');
    const blogPayload = {
        title: 'TEST_AUTOMATED_BLOG_PERSIST',
        category: 'Career Guidance',
        author: 'Educationist Advisor',
        date: 'September 22, 2026',
        image: 'images/blog/1.jpg',
        excerpt: 'Test blog excerpt',
        content: '<p>Test blog full content</p>',
        metaDescription: 'Test blog meta',
        tags: ['TestBlogTag'],
        categories: ['Career Guidance'],
        keywords: ['TestBlogKw']
    };
    const bPost = await request(`${BASE}/api/content/blogs`, { method: 'POST' }, blogPayload);
    console.log('Blog POST status:', bPost.status, 'success:', bPost.data?.success, 'id:', bPost.data?.blog?.id);
    const blogId = bPost.data?.blog?.id;

    if (blogId) {
        const bVerify = await request(`${BASE}/data/blogs.json?_t=${Date.now()}`);
        const foundBlog = Array.isArray(bVerify.data) && bVerify.data.some(b => String(b.id) === String(blogId));
        console.log('Verified blog in live data/blogs.json:', foundBlog);

        const bDel = await request(`${BASE}/api/content/blogs/${blogId}?_method=DELETE`, { method: 'POST', headers: { 'X-HTTP-Method-Override': 'DELETE' } }, { action: 'delete' });
        console.log('Blog DELETE status:', bDel.status, 'success:', bDel.data?.success);
    }

    // 3. COLLEGES
    console.log('\n--- 3. Testing College Live Persistence ---');
    const colPayload = {
        name: 'TEST_AUTOMATED_COLLEGE_PERSIST',
        category: 'Engineering',
        categories: ['Engineering'],
        affiliation: 'State Technical University',
        location: 'Delhi NCR',
        established: '2015',
        accreditation: 'NAAC A+',
        fee: '₹80,000 / year',
        image: 'images/courses/1.jpg',
        rating: 4.8,
        courses: ['B.Tech'],
        description: 'Test college description'
    };
    const colPost = await request(`${BASE}/api/content/colleges`, { method: 'POST' }, colPayload);
    console.log('College POST status:', colPost.status, 'success:', colPost.data?.success, 'id:', colPost.data?.college?.id);
    const colId = colPost.data?.college?.id;

    if (colId) {
        const colVerify = await request(`${BASE}/data/colleges.json?_t=${Date.now()}`);
        const foundCol = Array.isArray(colVerify.data) && colVerify.data.some(c => String(c.id) === String(colId));
        console.log('Verified college in live data/colleges.json:', foundCol);

        const colDel = await request(`${BASE}/api/content/colleges/${colId}?_method=DELETE`, { method: 'POST', headers: { 'X-HTTP-Method-Override': 'DELETE' } }, { action: 'delete' });
        console.log('College DELETE status:', colDel.status, 'success:', colDel.data?.success);
    }

    // 4. UNIVERSITIES
    console.log('\n--- 4. Testing University Live Persistence ---');
    const uPayload = {
        name: 'TEST_AUTOMATED_UNIV_PERSIST',
        type: 'State Private University',
        approvals: 'UGC-DEB',
        location: 'Uttar Pradesh',
        established: '2008',
        naac: 'NAAC A Grade',
        modes: 'Online / Distance',
        fee: 'Affordable Semester Fees',
        image: 'images/slider/home1/slide1.jpg',
        streams: ['Management', 'Computer Science'],
        courses: ['Online MBA', 'MCA'],
        description: 'Test university description'
    };
    const uPost = await request(`${BASE}/api/content/universities`, { method: 'POST' }, uPayload);
    console.log('University POST status:', uPost.status, 'success:', uPost.data?.success, 'id:', uPost.data?.university?.id);
    const uId = uPost.data?.university?.id;

    if (uId) {
        const uVerify = await request(`${BASE}/data/universities.json?_t=${Date.now()}`);
        const foundUniv = Array.isArray(uVerify.data) && uVerify.data.some(u => String(u.id) === String(uId));
        console.log('Verified univ in live data/universities.json:', foundUniv);

        const uDel = await request(`${BASE}/api/content/universities/${uId}?_method=DELETE`, { method: 'POST', headers: { 'X-HTTP-Method-Override': 'DELETE' } }, { action: 'delete' });
        console.log('University DELETE status:', uDel.status, 'success:', uDel.data?.success);
    }

    // 5. LEADS (CRM)
    console.log('\n--- 5. Testing Lead Live Persistence ---');
    const leadPayload = {
        name: 'Test Lead Persistence',
        email: 'test_audit@educationistguru.com',
        phone: '9876543210',
        course: 'MBA',
        source: 'Automated Audit'
    };
    const leadPost = await request(`${BASE}/api/crm/leads`, { method: 'POST' }, leadPayload);
    console.log('Lead POST status:', leadPost.status, 'success:', leadPost.data?.success, 'id:', leadPost.data?.lead?.id || leadPost.data?.id);

    const leadGet = await request(`${BASE}/api/crm/leads`);
    console.log('Leads GET status:', leadGet.status, 'total leads:', leadGet.data?.leads?.length);
    const foundLead = leadGet.data?.leads?.some(l => l.email === 'test_audit@educationistguru.com');
    console.log('Verified test lead in live CRM leads:', foundLead);
}

runLiveAudit().catch(console.error);
