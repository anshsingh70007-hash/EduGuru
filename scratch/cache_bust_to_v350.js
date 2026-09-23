const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');

function updateHtmlFile(filePath) {
    if (!fs.existsSync(filePath)) return;
    let content = fs.readFileSync(filePath, 'utf8');
    let changed = false;

    // Replace ?v=2.6.0 with ?v=3.5.0
    if (content.includes('?v=2.6.0')) {
        content = content.replace(/\?v=2\.6\.0/g, '?v=3.5.0');
        changed = true;
    }

    // Ensure courses-manager.js has ?v=3.5.0
    if (content.includes('courses-manager.js') && !content.includes('courses-manager.js?v=3.5.0')) {
        content = content.replace(/courses-manager\.js(\?v=[0-9.]+)?/g, 'courses-manager.js?v=3.5.0');
        changed = true;
    }

    // Ensure cms-content.js has ?v=3.5.0
    if (content.includes('cms-content.js') && !content.includes('cms-content.js?v=3.5.0')) {
        content = content.replace(/cms-content\.js(\?v=[0-9.]+)?/g, 'cms-content.js?v=3.5.0');
        changed = true;
    }

    // Ensure crm-integration.js has ?v=3.5.0
    if (content.includes('crm-integration.js') && !content.includes('crm-integration.js?v=3.5.0')) {
        content = content.replace(/crm-integration\.js(\?v=[0-9.]+)?/g, 'crm-integration.js?v=3.5.0');
        changed = true;
    }

    // Ensure /crm/js/data.js has ?v=3.5.0
    if (content.includes('/crm/js/data.js') && !content.includes('/crm/js/data.js?v=3.5.0')) {
        content = content.replace(/\/crm\/js\/data\.js(\?v=[0-9.]+)?/g, '/crm/js/data.js?v=3.5.0');
        changed = true;
    }

    // Ensure edit.js has ?v=3.5.0
    if (content.includes('edit.js') && !content.includes('edit.js?v=3.5.0')) {
        content = content.replace(/edit\.js(\?v=[0-9.]+)?/g, 'edit.js?v=3.5.0');
        changed = true;
    }

    if (changed) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Updated cache-bust version in: ${path.relative(ROOT_DIR, filePath)}`);
    }
}

function walkDir(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === 'scratch' || entry.name === 'backups') continue;
            walkDir(fullPath);
        } else if (entry.isFile() && entry.name.endsWith('.html')) {
            updateHtmlFile(fullPath);
        }
    }
}

console.log('Scanning and updating cache-bust query strings to ?v=3.5.0...');
walkDir(ROOT_DIR);
console.log('Cache-bust version update complete!');
