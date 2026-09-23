const http = require('http');
const fs = require('fs');
const path = require('path');
const assert = require('assert');

function request(method, path, data) {
    return new Promise((resolve, reject) => {
        const payload = data ? JSON.stringify(data) : null;
        const options = {
            hostname: 'localhost',
            port: 3000,
            path: path,
            method: method,
            headers: {}
        };
        if (payload) {
            options.headers['Content-Type'] = 'application/json';
            options.headers['Content-Length'] = Buffer.byteLength(payload);
        }
        const req = http.request(options, res => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                try {
                    resolve({ status: res.statusCode, body: JSON.parse(body) });
                } catch (e) {
                    resolve({ status: res.statusCode, raw: body });
                }
            });
        });
        req.on('error', reject);
        if (payload) req.write(payload);
        req.end();
    });
}

async function runTest() {
    console.log('--- 1. Testing Course Creation (POST /api/content/courses) ---');
    const testPayload = {
        name: 'B.Sc. in Quantum Computing & Cybernetics',
        faculty: 'Faculty of Pure & Applied Sciences',
        duration: '3 Years (6 Semesters)',
        eligibility: '10+2 with PCM (60% marks)',
        mode: 'Regular / Online Hybrid',
        fee: '₹75,000 / year',
        image: 'images/courses/1.jpg',
        specializations: 'Quantum Algorithms, Qubit Circuit Design, Quantum Key Distribution',
        overviewContent: '<h1>Program Overview</h1><p>Quantum computing represents the modern vanguard of computational power.</p>',
        description: '<h1>Program Overview</h1><p>Quantum computing represents the modern vanguard of computational power.</p>',
        metaDescription: 'Premier B.Sc. in Quantum Computing program with advanced algorithms and hands-on laboratory simulations.',
        tags: ['Quantum', 'Physics', 'Computing', 'Cybernetics'],
        categories: ['Applied Sciences', 'Computer Science'],
        keywords: ['quantum computing', 'cybernetics degree', 'bsc admission'],
        galleryImages: ['images/courses/1.jpg', 'images/courses/2.jpg'],
        curriculum: [
            'Module 1: Linear Algebra & Quantum States',
            'Module 2: Qubits & Quantum Logic Gates',
            'Module 3: Quantum Cryptography & Algorithms',
            'Module 4: Industry Capstone Project'
        ]
    };

    const res = await request('POST', '/api/content/courses', testPayload);
    console.log('POST status:', res.status);
    console.log('Course created ID:', res.body.course ? res.body.course.id : 'N/A');
    console.log('Course slug:', res.body.course ? res.body.course.slug : 'N/A');

    assert.strictEqual(res.status, 201, 'Should return 201 Created');
    assert(res.body.course, 'Should have course object in response');
    const created = res.body.course;

    // Verify all SEO and rich fields in response
    assert.strictEqual(created.metaDescription, testPayload.metaDescription, 'metaDescription must match');
    assert.deepStrictEqual(created.tags, testPayload.tags, 'tags must match');
    assert.deepStrictEqual(created.categories, testPayload.categories, 'categories must match');
    assert.deepStrictEqual(created.keywords, testPayload.keywords, 'keywords must match');
    assert.deepStrictEqual(created.galleryImages, testPayload.galleryImages, 'galleryImages must match');
    assert.strictEqual(created.overviewContent, testPayload.overviewContent, 'overviewContent must match');
    assert.strictEqual(created.description, testPayload.description, 'description must match');
    assert.deepStrictEqual(created.curriculum, testPayload.curriculum, 'curriculum must match');

    console.log('✓ All fields verified in HTTP response!');

    console.log('\n--- 2. Verifying Physical File Persistence (data/courses.json) ---');
    const diskCourses = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'courses.json'), 'utf8'));
    const diskFound = diskCourses.find(c => c.id === created.id);
    assert(diskFound, 'New course must be persisted on disk in data/courses.json');
    assert.strictEqual(diskFound.metaDescription, testPayload.metaDescription, 'Disk metaDescription must match');
    assert.deepStrictEqual(diskFound.tags, testPayload.tags, 'Disk tags must match');
    assert.deepStrictEqual(diskFound.categories, testPayload.categories, 'Disk categories must match');
    assert.deepStrictEqual(diskFound.keywords, testPayload.keywords, 'Disk keywords must match');
    assert.deepStrictEqual(diskFound.galleryImages, testPayload.galleryImages, 'Disk galleryImages must match');
    assert.strictEqual(diskFound.overviewContent, testPayload.overviewContent, 'Disk overviewContent must match');

    console.log('✓ All fields verified on disk in data/courses.json!');

    console.log('\n--- 3. Verifying GET Course by Slug / ID ---');
    const getRes = await request('GET', `/api/content/courses/${created.slug}`);
    assert.strictEqual(getRes.status, 200, 'GET /courses/:slug should return 200');
    assert.strictEqual(getRes.body.course.name, testPayload.name, 'GET course name should match');
    assert.strictEqual(getRes.body.course.metaDescription, testPayload.metaDescription, 'GET metaDescription should match');
    console.log('✓ GET /api/content/courses/:slug returned complete course payload!');

    console.log('\n--- 4. Cleaning up test course from data/courses.json ---');
    const delRes = await request('DELETE', `/api/content/courses/${created.id}`);
    console.log('DELETE status:', delRes.status);
    assert.strictEqual(delRes.status, 200, 'DELETE should return 200');

    const diskAfter = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'courses.json'), 'utf8'));
    const stillThere = diskAfter.find(c => c.id === created.id);
    assert(!stillThere, 'Course should be removed after test cleanup');
    console.log('✓ Test course cleaned up cleanly from data/courses.json!');

    console.log('\n=========================================');
    console.log('ALL PERSISTENCE AND DATA INTEGRITY TESTS PASSED 100%!');
    console.log('=========================================');
}

runTest().catch(err => {
    console.error('TEST FAILED:', err);
    process.exit(1);
});
