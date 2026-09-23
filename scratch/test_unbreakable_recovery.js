const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const EXTERNAL_VAULT = 'C:\\Users\\Harmeet Singh\\.educationistguru_vault';

function request(method, pathName, data = null) {
    return new Promise((resolve, reject) => {
        const req = http.request({
            hostname: 'localhost',
            port: PORT,
            path: pathName,
            method: method,
            headers: {
                'Content-Type': 'application/json',
                ...(data ? { 'Content-Length': Buffer.byteLength(JSON.stringify(data)) } : {})
            }
        }, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(body);
                    resolve({ status: res.statusCode, headers: res.headers, body: parsed });
                } catch(e) {
                    resolve({ status: res.statusCode, headers: res.headers, raw: body });
                }
            });
        });
        req.on('error', reject);
        if (data) req.write(JSON.stringify(data));
        req.end();
    });
}

async function runTests() {
    console.log('====================================================');
    console.log('🚀 STARTING UNBREAKABLE DISASTER RECOVERY TEST SUITE');
    console.log('====================================================\n');

    let passed = 0;
    let failed = 0;

    function assert(cond, name) {
        if (cond) {
            console.log(`  ✅ PASS: ${name}`);
            passed++;
        } else {
            console.error(`  ❌ FAIL: ${name}`);
            failed++;
        }
    }

    // TEST 1: Vault Status API & External Vault accessibility
    console.log('[TEST 1] Checking Vault Status API & Storage Tiers...');
    const statusRes = await request('GET', '/api/system/vault-status');
    assert(statusRes.status === 200, 'GET /api/system/vault-status returns 200');
    assert(statusRes.body.success === true, 'Response indicates success');
    assert(statusRes.body.vault && statusRes.body.vault.isExternalVaultAccessible === true, 'External Vault is accessible');
    assert(fs.existsSync(EXTERNAL_VAULT), 'External Vault directory physically exists on Windows filesystem');

    // TEST 2: Content Upload & Multi-Tier Sync (Colleges)
    console.log('\n[TEST 2] Testing College Upload & Automatic Multi-Tier Sync...');
    const testCollege = {
        name: "Zenith Institute of Advanced Technology & AI",
        slug: "zenith-institute-advanced-tech",
        category: "Engineering",
        location: "Bengaluru, Karnataka",
        affiliation: "Affiliated to VTU & Approved by AICTE",
        accreditation: ["NAAC A++", "AICTE", "NBA"],
        courses: ["B.Tech Artificial Intelligence", "B.Tech Computer Science", "M.Tech Robotics"],
        fee: "₹1,25,000 / Semester",
        rating: "4.9",
        description: "Premier AI and technology institute providing industry-immersive learning and 100% placement track record.",
        isFeatured: true
    };

    const addColRes = await request('POST', '/api/content/colleges', testCollege);
    assert((addColRes.status === 200 || addColRes.status === 201) && addColRes.body.success === true, 'POST /api/content/colleges created successfully');
    const createdCollegeSlug = addColRes.body.college ? addColRes.body.college.slug : testCollege.slug;
    
    // Check primary ./data/colleges.json
    const primaryColleges = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'colleges.json'), 'utf8'));
    const inPrimary = primaryColleges.some(c => c.slug === createdCollegeSlug || c.name === testCollege.name);
    assert(inPrimary, 'New college is safely written to primary data/colleges.json');

    // Check external vault
    const externalColleges = JSON.parse(fs.readFileSync(path.join(EXTERNAL_VAULT, 'colleges.json'), 'utf8'));
    const inVault = externalColleges.some(c => c.slug === createdCollegeSlug || c.name === testCollege.name);
    assert(inVault, 'New college is instantly synchronized to External Vault');

    // TEST 3: Content Upload & Multi-Tier Sync (Universities)
    console.log('\n[TEST 3] Testing University Upload & Automatic Multi-Tier Sync...');
    const testUniv = {
        name: "Apex Global Research University",
        slug: "apex-global-research-university",
        type: "State Private University",
        location: "Mohali, Punjab",
        naac: "NAAC A+ Accredited",
        approvals: ["UGC", "AIU", "DEB", "AICTE"],
        modes: ["Online Mode", "Distance Mode", "Regular"],
        fee: "₹28,000 / Semester",
        rating: "4.95",
        highlights: "Recognized for UPSC, State PSCs, Corporate Jobs, and Higher Education Abroad.",
        isFeatured: true
    };

    const addUnivRes = await request('POST', '/api/content/universities', testUniv);
    assert((addUnivRes.status === 200 || addUnivRes.status === 201) && addUnivRes.body.success === true, 'POST /api/content/universities created successfully');
    const createdUnivSlug = addUnivRes.body.university ? addUnivRes.body.university.slug : testUniv.slug;

    const primaryUnivs = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'universities.json'), 'utf8'));
    assert(primaryUnivs.some(u => u.slug === createdUnivSlug || u.name === testUniv.name), 'New university written to primary data/universities.json');

    const vaultUnivs = JSON.parse(fs.readFileSync(path.join(EXTERNAL_VAULT, 'universities.json'), 'utf8'));
    assert(vaultUnivs.some(u => u.slug === createdUnivSlug || u.name === testUniv.name), 'New university synced to External Vault');

    // TEST 4: Content Upload & Multi-Tier Sync (Blogs)
    console.log('\n[TEST 4] Testing Blog Post Upload & Automatic Multi-Tier Sync...');
    const testBlog = {
        title: "Top 10 High-Growth Engineering Careers in 2026",
        slug: "top-10-high-growth-engineering-careers-2026",
        category: "Career Guidance",
        excerpt: "A comprehensive breakdown of emerging engineering domains from AI/ML, Quantum Computing to Biomedical Robotics.",
        content: "<p>Engineering education in India is evolving rapidly with specialization in cutting edge branches...</p>",
        author: "Educationist Guru Academic Cell",
        isFeatured: true
    };

    const addBlogRes = await request('POST', '/api/content/blogs', testBlog);
    assert((addBlogRes.status === 200 || addBlogRes.status === 201) && addBlogRes.body.success === true, 'POST /api/content/blogs created successfully');
    const createdBlogSlug = addBlogRes.body.blog ? addBlogRes.body.blog.slug : testBlog.slug;

    // TEST 5: Complete Database Backup API
    console.log('\n[TEST 5] Testing Full Database Backup Download API...');
    const backupRes = await request('GET', '/api/system/backup');
    assert(backupRes.status === 200, 'GET /api/system/backup returns 200');
    assert(backupRes.body && backupRes.body.collections, 'Backup contains collections object');
    assert(Array.isArray(backupRes.body.collections.colleges), 'Backup contains colleges array');
    assert(Array.isArray(backupRes.body.collections.universities), 'Backup contains universities array');
    assert(Array.isArray(backupRes.body.collections.courses), 'Backup contains courses array');
    assert(Array.isArray(backupRes.body.collections.blogs), 'Backup contains blogs array');
    assert(Array.isArray(backupRes.body.collections.leads), 'Backup contains leads array');
    console.log(`    Total collections in backup: ${Object.keys(backupRes.body.collections).length}`);

    // TEST 6: Point-in-time Snapshot API
    console.log('\n[TEST 6] Testing Instant Point-in-Time Snapshot...');
    const snapRes = await request('POST', '/api/system/snapshot');
    assert(snapRes.status === 200 && snapRes.body.success === true, 'POST /api/system/snapshot succeeds');
    const listSnapRes = await request('GET', '/api/system/snapshots');
    assert(listSnapRes.body.snapshots && listSnapRes.body.snapshots.length > 0, 'Snapshot listed in GET /api/system/snapshots');

    // TEST 7: Disaster Simulation & Automatic Self-Healing
    console.log('\n[TEST 7] SIMULATING DISASTER: Deleting primary data/colleges.json...');
    const primaryCollegesPath = path.join(__dirname, '..', 'data', 'colleges.json');
    const collegesBackup = fs.readFileSync(primaryCollegesPath, 'utf8');
    
    // Intentionally delete file from primary directory
    fs.unlinkSync(primaryCollegesPath);
    assert(!fs.existsSync(primaryCollegesPath), 'Primary data/colleges.json successfully deleted to simulate disaster');

    // Request colleges through the API
    console.log('  Triggering API request to trigger multi-tier fallback & self-healing...');
    const recoverRes = await request('GET', '/api/content/colleges');
    assert(recoverRes.status === 200, 'API returned 200 even after primary file was deleted');
    assert(recoverRes.body.colleges && recoverRes.body.colleges.length > 0, 'All colleges retrieved from fallback vault');
    
    // Check if primary file was automatically reconstructed
    assert(fs.existsSync(primaryCollegesPath), '🌟 SELF-HEAL VERIFIED: primary data/colleges.json was automatically regenerated from Vault!');

    // CLEANUP test items
    console.log('\n[CLEANUP] Removing test entities...');
    const delColRes = await request('DELETE', `/api/content/colleges/${testCollege.slug}`);
    const delUnivRes = await request('DELETE', `/api/content/universities/${testUniv.slug}`);
    const delBlogRes = await request('DELETE', `/api/content/blogs/${testBlog.slug}`);
    console.log('  Cleaned test college, university, and blog.');

    console.log('\n====================================================');
    console.log(`TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log('====================================================');

    process.exit(failed > 0 ? 1 : 0);
}

runTests().catch(err => {
    console.error('Test runner encountered uncaught error:', err);
    process.exit(1);
});
