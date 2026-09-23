const http = require('http');

function checkEndpoint(path) {
    return new Promise((resolve) => {
        http.get(`http://localhost:3000${path}`, (res) => {
            let data = '';
            res.on('data', chunk => { data += chunk; });
            res.on('end', () => {
                resolve({
                    path,
                    statusCode: res.statusCode,
                    size: data.length,
                    ok: res.statusCode >= 200 && res.statusCode < 400
                });
            });
        }).on('error', (err) => {
            resolve({ path, error: err.message, ok: false });
        });
    });
}

async function run() {
    const endpoints = [
        '/',
        '/edit/',
        '/edit.html',
        '/blog.html',
        '/courses.html',
        '/universities.html',
        '/colleges.html',
        '/data/site_menu.json',
        '/data/blogs.json',
        '/data/courses.json',
        '/data/universities.json',
        '/data/colleges.json',
        '/api/content/menu',
        '/api/content/blogs',
        '/api/content/courses',
        '/api/content/universities',
        '/api/content/colleges'
    ];

    console.log('Testing server endpoints on http://localhost:3000 ...');
    let allOk = true;
    for (const ep of endpoints) {
        const res = await checkEndpoint(ep);
        if (res.ok) {
            console.log(`✅ [${res.statusCode}] ${ep} (${res.size} bytes)`);
        } else {
            console.error(`❌ FAILED ${ep}:`, res.error || `status ${res.statusCode}`);
            allOk = false;
        }
    }

    if (allOk) {
        console.log('\n🎉 ALL 17 ENDPOINTS RESPONDED SUCCESSFULLY!');
    } else {
        process.exit(1);
    }
}

run();
