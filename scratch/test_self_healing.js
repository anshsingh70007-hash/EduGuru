/**
 * Test: Disaster Recovery & Boot Self-Healing Test
 * Proves:
 * If a collection in primary ./data/ is corrupted or deleted,
 * readDataFile automatically recovers it from the vault and auto-heals primary!
 */

const fs = require('fs');
const path = require('path');
const http = require('http');

function getCourses() {
    return new Promise((resolve, reject) => {
        http.get('http://localhost:3000/api/content/courses', (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => resolve(JSON.parse(body)));
        }).on('error', reject);
    });
}

async function run() {
    console.log('=== VERIFYING SELF-HEALING ARCHITECTURE ===');
    const before = await getCourses();
    const countBefore = (before.courses || []).length;
    console.log('Current Courses count:', countBefore);

    const primaryFile = path.join(__dirname, '..', 'data', 'courses.json');
    const localVault = path.join(__dirname, '..', 'backups', 'vault', 'courses.json');
    const extVault = path.join(require('os').homedir(), '.educationistguru_vault', 'courses.json');

    console.log('Local vault exists:', fs.existsSync(localVault));
    console.log('External vault exists:', fs.existsSync(extVault));

    // Simulate accidental deletion of primary courses.json
    console.log('Simulating deletion of primary data/courses.json...');
    const originalBackup = fs.readFileSync(primaryFile, 'utf8');
    fs.unlinkSync(primaryFile);
    console.log('Primary file deleted. Exists:', fs.existsSync(primaryFile));

    // Now request /api/content/courses from active server
    console.log('Requesting /api/content/courses after primary deletion...');
    const after = await getCourses();
    const countAfter = (after.courses || []).length;
    console.log('Courses count returned:', countAfter);

    console.log('Checking if primary file was auto-healed...');
    const healed = fs.existsSync(primaryFile);
    console.log('Primary file auto-healed:', healed);

    if (countAfter !== countBefore || !healed) {
        // Restore if failed
        fs.writeFileSync(primaryFile, originalBackup, 'utf8');
        throw new Error('Self-healing failed!');
    }

    console.log('>>> DISASTER RECOVERY & SELF-HEALING VERIFIED 100%! <<<');
}

run().catch(err => {
    console.error('Self-healing test error:', err);
    process.exit(1);
});
