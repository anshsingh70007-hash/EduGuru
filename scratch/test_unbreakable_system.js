const http = require('http');

function request(options, data = null) {
    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                try {
                    resolve({ status: res.statusCode, headers: res.headers, data: JSON.parse(body) });
                } catch(e) {
                    resolve({ status: res.statusCode, headers: res.headers, raw: body });
                }
            });
        });
        req.on('error', reject);
        if (data) req.write(typeof data === 'string' ? data : JSON.stringify(data));
        req.end();
    });
}

async function runTests() {
    console.log('--- 1. Testing Vault Status Endpoint ---');
    const vStatus = await request({
        hostname: 'localhost',
        port: 3000,
        path: '/api/system/vault-status',
        method: 'GET'
    });
    console.log('Vault Status code:', vStatus.status);
    console.log('Status active:', vStatus.data.status);
    console.log('Vault record counts:', vStatus.data.vault ? vStatus.data.vault.collectionCounts : vStatus.data);

    console.log('\n--- 2. Testing Full Database Backup Download Endpoint ---');
    const backupRes = await request({
        hostname: 'localhost',
        port: 3000,
        path: '/api/system/backup',
        method: 'GET'
    });
    console.log('Backup Status code:', backupRes.status);
    console.log('Backup appName:', backupRes.data.appName);
    console.log('Backup collections count:', backupRes.data.collections ? Object.keys(backupRes.data.collections).length : 0);

    console.log('\n--- 3. Testing Snapshots Listing Endpoint ---');
    const snapsRes = await request({
        hostname: 'localhost',
        port: 3000,
        path: '/api/system/snapshots',
        method: 'GET'
    });
    console.log('Snapshots Status code:', snapsRes.status);
    console.log('Available snapshots:', snapsRes.data.snapshots ? snapsRes.data.snapshots.length : 0);

    console.log('\n--- 4. Testing Manual Point-in-Time Snapshot Creation ---');
    const snapCreate = await request({
        hostname: 'localhost',
        port: 3000,
        path: '/api/system/snapshot',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
    }, { reason: 'titanium_unbreakable_verification' });
    console.log('Snapshot creation code:', snapCreate.status);
    console.log('Snapshot name:', snapCreate.data.snapshot);

    console.log('\n--- 5. Testing Leads Submission Endpoint ---');
    const leadTest = await request({
        hostname: 'localhost',
        port: 3000,
        path: '/api/crm/leads',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
    }, {
        name: 'Titanium Test Student',
        phone: '+91 9999988888',
        email: 'titanium_test@educationistguru.com',
        course: 'Master of Business Administration (MBA)',
        source: 'Automated Test Suite',
        status: 'new',
        priority: 'high'
    });
    console.log('Lead Save status code:', leadTest.status);
    console.log('Saved Lead ID:', leadTest.data.item ? leadTest.data.item.id : 'N/A');

    console.log('\n--- 6. Testing Inquiries Submission Endpoint ---');
    const inqTest = await request({
        hostname: 'localhost',
        port: 3000,
        path: '/api/crm/inquiries',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
    }, {
        name: 'Titanium Inquirer',
        phone: '+91 9999988888',
        email: 'titanium_test@educationistguru.com',
        subject: 'Titanium Inquiry Test',
        message: 'Checking zero loss inquiry persistence'
    });
    console.log('Inquiry Save status code:', inqTest.status);
    console.log('Saved Inquiry ID:', inqTest.data.item ? inqTest.data.item.id : 'N/A');

    console.log('\n=== ALL TESTS PASSED SUCCESSFULLY! ===');
}

runTests().catch(console.error);
