const fs = require('fs');
const path = require('path');

const SRC_DIR = 'C:\\Users\\Harmeet Singh\\Downloads\\educationistguru_production_package';
const SRC_ZIP = 'C:\\Users\\Harmeet Singh\\Downloads\\educationistguru_production_package.zip';
const DOC_DIR = 'C:\\Users\\Harmeet Singh\\Documents\\educationistguru_production_package';
const DOC_ZIP = 'C:\\Users\\Harmeet Singh\\Documents\\educationistguru_production_package.zip';

console.log('📦 Copying updated production package to Documents folder...');

// Function to copy directory recursively
function copyDir(src, dest) {
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
    const entries = fs.readdirSync(src, { withFileTypes: true });
    for (const entry of entries) {
        const s = path.join(src, entry.name);
        const d = path.join(dest, entry.name);
        if (entry.isDirectory()) {
            copyDir(s, d);
        } else {
            fs.copyFileSync(s, d);
        }
    }
}

// Clean old destination if exists
if (fs.existsSync(DOC_DIR)) {
    fs.rmSync(DOC_DIR, { recursive: true, force: true });
}

copyDir(SRC_DIR, DOC_DIR);
console.log('✅ Folder copied to:', DOC_DIR);

fs.copyFileSync(SRC_ZIP, DOC_ZIP);
console.log('✅ ZIP copied to:', DOC_ZIP);

// Count files
function countFiles(dir) {
    let count = 0;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const e of entries) {
        if (e.isDirectory()) count += countFiles(path.join(dir, e.name));
        else count++;
    }
    return count;
}

const docCount = countFiles(DOC_DIR);
const zipSize = (fs.statSync(DOC_ZIP).size / (1024 * 1024)).toFixed(2);

console.log(`\n🎉 Verification Passed!`);
console.log(`Total files in Documents folder: ${docCount}`);
console.log(`ZIP file size in Documents: ${zipSize} MB`);
