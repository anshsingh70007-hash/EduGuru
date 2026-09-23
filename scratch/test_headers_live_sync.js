const http = require('http');

function postJson(url, data) {
    return new Promise((resolve, reject) => {
        const u = new URL(url);
        const payload = JSON.stringify(data);
        const req = http.request({
            hostname: u.hostname,
            port: u.port,
            path: u.pathname,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(payload)
            }
        }, res => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                try {
                    resolve({ status: res.statusCode, data: JSON.parse(body) });
                } catch (e) {
                    resolve({ status: res.statusCode, raw: body });
                }
            });
        });
        req.on('error', reject);
        req.write(payload);
        req.end();
    });
}

function getJson(url) {
    return new Promise((resolve, reject) => {
        http.get(url, res => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                try {
                    resolve({ status: res.statusCode, data: JSON.parse(body) });
                } catch (e) {
                    resolve({ status: res.statusCode, raw: body });
                }
            });
        }).on('error', reject);
    });
}

async function run() {
    console.log('--- 1. Testing GET /api/content/menu ---');
    const initial = await getJson('http://localhost:3000/api/content/menu');
    console.log('Initial Menu Status:', initial.status, 'Announcement:', initial.data?.announcement?.text?.substring(0, 40));

    console.log('\n--- 2. Updating Announcement via POST /api/content/menu ---');
    const updateResult = await postJson('http://localhost:3000/api/content/menu', {
        announcement: {
            text: '🎓 Admissions Open 2026-27 | Call EducationistGuru Helpline: +91 87504 77000',
            ctaText: 'Apply Now',
            link: 'contact.html',
            enabled: true
        }
    });
    console.log('Update Result Status:', updateResult.status, 'Success:', updateResult.data?.success);

    console.log('\n--- 3. Verifying updated Menu via GET /api/content/menu ---');
    const updated = await getJson('http://localhost:3000/api/content/menu');
    console.log('Updated Text:', updated.data?.announcement?.text);
    console.log('Nav Items preserved count:', updated.data?.navItems?.length);

    if (updated.data?.announcement?.text === '🎓 Admissions Open 2026-27 | Call EducationistGuru Helpline: +91 87504 77000') {
        console.log('✅ Menu API Live Synchronization Verified Successfully!');
    } else {
        throw new Error('Menu announcement text mismatch!');
    }
}

run().catch(e => {
    console.error('Test failed:', e);
    process.exit(1);
});
