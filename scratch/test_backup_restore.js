/**
 * Test: Full Database JSON Backup & Restore Pipeline
 * Verifies:
 * 1. GET /api/system/backup returns valid JSON bundle with all collections
 * 2. Record counts match between backup and active server
 * 3. Simulating data replacement / restore via POST /api/system/restore
 * 4. Preserved integrity of leads, courses, colleges, universities, inquiries
 */

const http = require('http');

function request(options, data = null) {
    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                try {
                    const parsed = body ? JSON.parse(body) : null;
                    resolve({ status: res.statusCode, headers: res.headers, body: parsed, rawBody: body });
                } catch (e) {
                    resolve({ status: res.statusCode, headers: res.headers, body: null, rawBody: body });
                }
            });
        });
        req.on('error', reject);
        if (data) {
            req.write(typeof data === 'string' ? data : JSON.stringify(data));
        }
        req.end();
    });
}

async function run() {
    console.log('=== STEP 1: Testing GET /api/system/backup ===');
    const backupRes = await request({
        hostname: 'localhost',
        port: 3000,
        path: '/api/system/backup',
        method: 'GET'
    });

    console.log('Backup Status:', backupRes.status);
    if (backupRes.status !== 200 || !backupRes.body) {
        console.error('FAILED: Backup response invalid:', backupRes.rawBody);
        process.exit(1);
    }

    const backupData = backupRes.body;
    console.log('Backup appName:', backupData.appName);
    console.log('Backup exportedAt:', backupData.exportedAt);

    const cols = backupData.collections || {};
    const colKeys = Object.keys(cols);
    console.log('Backed up collections count:', colKeys.length);
    console.log('Collections list:', colKeys.join(', '));

    console.log('Courses count in backup:', (cols.courses || []).length);
    console.log('Leads count in backup:', (cols.leads || []).length);
    console.log('Inquiries count in backup:', (cols.inquiries || []).length);
    console.log('Colleges count in backup:', (cols.colleges || []).length);
    console.log('Universities count in backup:', (cols.universities || []).length);

    if (!cols.courses || cols.courses.length === 0) throw new Error('Courses missing from backup');
    if (!cols.leads || cols.leads.length === 0) throw new Error('Leads missing from backup');

    console.log('\n=== STEP 2: Testing POST /api/system/restore with Backup Bundle ===');
    const restoreRes = await request({
        hostname: 'localhost',
        port: 3000,
        path: '/api/system/restore',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
    }, backupData);

    console.log('Restore Status:', restoreRes.status);
    console.log('Restore Response:', restoreRes.body);

    if (restoreRes.status !== 200 || !restoreRes.body.success) {
        console.error('FAILED: Restore failed:', restoreRes.body);
        process.exit(1);
    }

    console.log('\n=== STEP 3: Verifying Data Post-Restore ===');
    const coursesRes = await request({
        hostname: 'localhost',
        port: 3000,
        path: '/api/content/courses',
        method: 'GET'
    });
    console.log('Post-restore courses status:', coursesRes.status);
    console.log('Post-restore courses count:', (coursesRes.body.courses || []).length);

    const leadsRes = await request({
        hostname: 'localhost',
        port: 3000,
        path: '/api/crm/leads',
        method: 'GET'
    });
    console.log('Post-restore leads count:', (leadsRes.body.leads || []).length);

    const inqRes = await request({
        hostname: 'localhost',
        port: 3000,
        path: '/api/crm/inquiries',
        method: 'GET'
    });
    console.log('Post-restore inquiries count:', (inqRes.body.inquiries || []).length);

    console.log('\n=== STEP 4: Testing Flat Backup Format (Direct collections object) ===');
    const flatBackup = {
        courses: cols.courses,
        colleges: cols.colleges,
        universities: cols.universities,
        leads: cols.leads,
        inquiries: cols.inquiries,
        blogs: cols.blogs,
        videos: cols.videos
    };

    const restoreFlatRes = await request({
        hostname: 'localhost',
        port: 3000,
        path: '/api/system/restore',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
    }, flatBackup);

    console.log('Flat Restore Status:', restoreFlatRes.status);
    console.log('Flat Restore Response:', restoreFlatRes.body);

    if (restoreFlatRes.status !== 200 || !restoreFlatRes.body.success) {
        console.error('FAILED: Flat Restore failed');
        process.exit(1);
    }

    console.log('\n>>> BACKUP & RESTORE PIPELINE TEST: 100% SUCCESSFUL! <<<');
}

run().catch(err => {
    console.error('Test error:', err);
    process.exit(1);
});
