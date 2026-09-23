const http = require('http');

function postJson(path, data) {
    return new Promise((resolve, reject) => {
        const body = JSON.stringify(data);
        const req = http.request({
            hostname: 'localhost',
            port: 3000,
            path: path,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(body)
            }
        }, res => {
            let buf = '';
            res.on('data', c => buf += c);
            res.on('end', () => {
                try {
                    resolve({ status: res.statusCode, body: JSON.parse(buf) });
                } catch(e) {
                    resolve({ status: res.statusCode, raw: buf });
                }
            });
        });
        req.on('error', reject);
        req.write(body);
        req.end();
    });
}

function getJson(path) {
    return new Promise((resolve, reject) => {
        const req = http.request({
            hostname: 'localhost',
            port: 3000,
            path: path,
            method: 'GET'
        }, res => {
            let buf = '';
            res.on('data', c => buf += c);
            res.on('end', () => {
                try {
                    resolve({ status: res.statusCode, body: JSON.parse(buf) });
                } catch(e) {
                    resolve({ status: res.statusCode, raw: buf });
                }
            });
        });
        req.on('error', reject);
        req.end();
    });
}

async function testAllApis() {
    console.log('Testing Content & CRM APIs...');

    // 1. Test Course Creation
    const testCourse = {
        name: 'Test Audit Course 2026',
        faculty: 'Faculty of Engineering & Technology',
        duration: '4 Years',
        eligibility: '10+2 with PCM',
        mode: 'Online / Regular',
        fee: '₹50,000 / year',
        image: 'images/courses/1.jpg'
    };
    const courseRes = await postJson('/api/content/courses', testCourse);
    console.log('1. Course creation result:', courseRes.status, courseRes.body ? courseRes.body.success : false);

    // 2. Test College Creation
    const testCollege = {
        name: 'Test Audit College',
        location: 'Chandigarh, Punjab',
        category: 'Engineering',
        established: '2015',
        type: 'Private',
        approvedBy: 'AICTE, UGC',
        image: 'images/colleges/test.jpg',
        description: 'Test college description'
    };
    const collegeRes = await postJson('/api/content/colleges', testCollege);
    console.log('2. College creation result:', collegeRes.status, collegeRes.body ? collegeRes.body.success : false);

    // 3. Test Lead API
    const testLead = {
        name: 'Student Lead Test',
        phone: '+91 9876500000',
        email: 'student.test@example.com',
        course: 'Test Audit Course 2026',
        source: 'Website Callback'
    };
    const leadRes = await postJson('/api/crm/leads', testLead);
    console.log('3. Lead API creation result:', leadRes.status, leadRes.body ? leadRes.body.success : false);

    // 4. Test Inquiries API
    const testInquiry = {
        name: 'Inquiry Student Test',
        email: 'inquiry@example.com',
        phone: '+91 9876500001',
        subject: 'Course inquiry',
        message: 'Need fee details'
    };
    const inquiryRes = await postJson('/api/crm/inquiries', testInquiry);
    console.log('4. Inquiry API creation result:', inquiryRes.status, inquiryRes.body ? inquiryRes.body.success : false);

    // 5. Test Subscribers API
    const testSub = {
        email: 'subscriber.audit@example.com'
    };
    const subRes = await postJson('/api/crm/subscribers', testSub);
    console.log('5. Subscriber API creation result:', subRes.status, subRes.body ? subRes.body.success : false);

    // 6. Test YouTube API Fetch Info
    const ytRes = await getJson('/api/youtube/fetch-info?url=https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    console.log('6. YouTube fetch-info result:', ytRes.status, ytRes.body ? ytRes.body.success : false);

    // Clean up test entries
    if (courseRes.body && courseRes.body.course && courseRes.body.course.id) {
        const delCourse = await new Promise(r => {
            const req = http.request({ hostname: 'localhost', port: 3000, path: `/api/content/courses/${courseRes.body.course.id}`, method: 'DELETE' }, res => r(res.statusCode));
            req.end();
        });
        console.log('Cleaned test course:', delCourse);
    }
    if (collegeRes.body && collegeRes.body.college && collegeRes.body.college.id) {
        const delCollege = await new Promise(r => {
            const req = http.request({ hostname: 'localhost', port: 3000, path: `/api/content/colleges/${collegeRes.body.college.id}`, method: 'DELETE' }, res => r(res.statusCode));
            req.end();
        });
        console.log('Cleaned test college:', delCollege);
    }
}

testAllApis();
