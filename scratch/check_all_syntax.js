const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

let failures = [];
let total = 0;

function checkDir(dir) {
    const files = fs.readdirSync(dir);
    for (const f of files) {
        const full = path.join(dir, f);
        const rel = path.relative('.', full);
        if (full.includes('node_modules') || full.includes('.git')) continue;
        const stat = fs.statSync(full);
        if (stat.isDirectory()) {
            checkDir(full);
        } else if (f.endsWith('.js')) {
            total++;
            try {
                execSync(`node -c "${full}"`);
                console.log(`[PASS] ${rel}`);
            } catch (err) {
                console.error(`[FAIL] ${rel}: ${err.message}`);
                failures.push(rel);
            }
        }
    }
}

checkDir('.');
console.log(`\nResults: ${total - failures.length}/${total} passed.`);
if (failures.length > 0) {
    console.error('Failed files:', failures);
    process.exit(1);
}
