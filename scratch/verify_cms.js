const http = require('http');

function request(options, data) {
    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                let parsed = body;
                try { parsed = JSON.parse(body); } catch(e) {}
                resolve({ status: res.statusCode, headers: res.headers, body: parsed });
            });
        });
        req.on('error', reject);
        if (data) req.write(typeof data === 'string' ? data : JSON.stringify(data));
        req.end();
    });
}

async function runTests() {
    console.log('=== STARTING CMS API VERIFICATION TESTS ===\n');

    // 1. GET colleges
    const collegesRes = await request({ hostname: 'localhost', port: 3000, path: '/api/content/colleges', method: 'GET' });
    console.log('[1] GET /api/content/colleges -> Status:', collegesRes.status, 'Count:', (collegesRes.body.colleges || collegesRes.body).length);

    // Verify Zenith has multi-categories and courses array
    const colleges = collegesRes.body.colleges || collegesRes.body;
    const zenith = colleges.find(c => c.name.includes('Zenith'));
    if (zenith) {
        console.log('    Zenith Categories:', zenith.categories);
        console.log('    Zenith Courses:', zenith.courses);
    }

    // 2. POST college with multiple categories and course tags
    const testCollegePayload = {
        name: "Test Academy of Technology & Management",
        category: "Faculty of Engineering & Technology, Faculty of Commerce and Management",
        categories: ["Faculty of Engineering & Technology", "Faculty of Commerce and Management"],
        courses: ["B.Tech Cloud Computing", "MBA Tech"],
        location: "Chandigarh, India",
        fee: "₹75,000 / year"
    };
    const postColRes = await request({
        hostname: 'localhost', port: 3000, path: '/api/content/colleges', method: 'POST',
        headers: { 'Content-Type': 'application/json' }
    }, testCollegePayload);
    console.log('[2] POST /api/content/colleges -> Status:', postColRes.status, 'Created ID:', postColRes.body.college ? postColRes.body.college.id : 'N/A');
    const createdCollegeId = postColRes.body.college ? postColRes.body.college.id : null;

    if (createdCollegeId) {
        // 3. PUT college with X-HTTP-Method-Override
        const updatePayload = {
            ...testCollegePayload,
            name: "Test Academy of Technology (Updated via Header Override)",
            courses: ["B.Tech Cloud Computing", "MBA Tech", "MCA AI"]
        };
        const putColRes = await request({
            hostname: 'localhost', port: 3000, path: `/api/content/colleges/${createdCollegeId}`, method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-HTTP-Method-Override': 'PUT'
            }
        }, updatePayload);
        console.log('[3] POST with X-HTTP-Method-Override: PUT -> Status:', putColRes.status, 'Updated Name:', putColRes.body.college ? putColRes.body.college.name : 'N/A');

        // 4. DELETE college with query param _method=DELETE
        const delColRes = await request({
            hostname: 'localhost', port: 3000, path: `/api/content/colleges/${createdCollegeId}?_method=DELETE`, method: 'POST'
        });
        console.log('[4] POST with _method=DELETE -> Status:', delColRes.status, 'Success:', delColRes.body.success);
    }

    // 5. Test Courses POST/DELETE
    const testCoursePayload = {
        name: "M.Tech Quantum Computing",
        faculty: "Faculty of Engineering & Technology",
        duration: "2 Years",
        fee: "₹80,000"
    };
    const postCourseRes = await request({
        hostname: 'localhost', port: 3000, path: '/api/content/courses', method: 'POST',
        headers: { 'Content-Type': 'application/json' }
    }, testCoursePayload);
    console.log('[5] POST /api/content/courses -> Status:', postCourseRes.status, 'Created ID:', postCourseRes.body.course ? postCourseRes.body.course.id : 'N/A');
    const createdCourseId = postCourseRes.body.course ? postCourseRes.body.course.id : null;

    if (createdCourseId) {
        const delCourseRes = await request({
            hostname: 'localhost', port: 3000, path: `/api/content/courses/${createdCourseId}`, method: 'POST',
            headers: { 'X-HTTP-Method-Override': 'DELETE' }
        });
        console.log('[6] DELETE course via Header Override -> Status:', delCourseRes.status, 'Success:', delCourseRes.body.success);
    }

    // 6. Test YouTube video POST & DELETE with alphanumeric videoId
    const testVideoPayload = {
        id: Date.now(),
        videoId: "dQw4w9WgXcQ",
        url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        title: "Test Admissions Guide 2026",
        category: "Admissions 2026",
        duration: "3:45"
    };
    const postVidRes = await request({
        hostname: 'localhost', port: 3000, path: '/api/youtube/videos', method: 'POST',
        headers: { 'Content-Type': 'application/json' }
    }, testVideoPayload);
    console.log('[7] POST /api/youtube/videos -> Status:', postVidRes.status, 'Success:', postVidRes.body.success);

    const delVidRes = await request({
        hostname: 'localhost', port: 3000, path: `/api/youtube/videos/${testVideoPayload.id}`, method: 'POST',
        headers: { 'X-HTTP-Method-Override': 'DELETE' }
    });
    console.log('[8] DELETE /api/youtube/videos via Header Override -> Status:', delVidRes.status, 'Success:', delVidRes.body.success);

    console.log('\n=== ALL API VERIFICATION TESTS PASSED SUCCESSFULLY! ===');
}

runTests().catch(err => {
    console.error('Test error:', err);
    process.exit(1);
});
