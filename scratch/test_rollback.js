const http = require('http');

function request(options, data = null) {
    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                try {
                    resolve({ status: res.statusCode, data: JSON.parse(body) });
                } catch(e) {
                    resolve({ status: res.statusCode, raw: body });
                }
            });
        });
        req.on('error', reject);
        if (data) req.write(typeof data === 'string' ? data : JSON.stringify(data));
        req.end();
    });
}

async function testRollback() {
    console.log('Testing Rollback to snapshot...');
    const snapsRes = await request({
        hostname: 'localhost',
        port: 3000,
        path: '/api/system/snapshots',
        method: 'GET'
    });
    const latest = snapsRes.data.snapshots[0];
    console.log('Rolling back to latest snapshot:', latest.name);

    const rollbackRes = await request({
        hostname: 'localhost',
        port: 3000,
        path: '/api/system/rollback',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
    }, { snapshotName: latest.name, filename: latest.name });

    console.log('Rollback status:', rollbackRes.status);
    console.log('Rollback result:', rollbackRes.data);
    if (rollbackRes.data.success) {
        console.log('ROLLBACK TEST PASSED!');
    } else {
        console.error('ROLLBACK FAILED!');
    }
}

testRollback().catch(console.error);
