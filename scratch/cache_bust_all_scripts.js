const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const htmlFiles = fs.readdirSync(rootDir).filter(f => f.endsWith('.html'));

const TARGET_SCRIPTS = [
    'js/crm-integration.js',
    'js/cms-content.js',
    'js/courses-manager.js',
    'js/youtube-manager.js',
    'js/edit.js'
];

let updatedCount = 0;

htmlFiles.forEach(file => {
    const filePath = path.join(rootDir, file);
    let html = fs.readFileSync(filePath, 'utf8');
    let changed = false;

    TARGET_SCRIPTS.forEach(script => {
        // Match src="js/crm-integration.js" or src="js/crm-integration.js?..." or src="/js/crm-integration.js..."
        const regex = new RegExp(`src="(\\/?${script.replace('/', '\\/')})(?:\\?[^"]*)?"`, 'g');
        if (regex.test(html)) {
            html = html.replace(regex, `src="$1?v=2.6.0"`);
            changed = true;
        }
    });

    if (changed) {
        fs.writeFileSync(filePath, html, 'utf8');
        updatedCount++;
        console.log(`✅ Cache-busted scripts in: ${file}`);
    }
});

// Also check edit/index.html
const editIndexPath = path.join(rootDir, 'edit', 'index.html');
if (fs.existsSync(editIndexPath)) {
    let editHtml = fs.readFileSync(editIndexPath, 'utf8');
    TARGET_SCRIPTS.forEach(script => {
        const regex = new RegExp(`src="(\\/?(?:\\.\\.\\/)?${script.replace('/', '\\/')})(?:\\?[^"]*)?"`, 'g');
        if (regex.test(editHtml)) {
            editHtml = editHtml.replace(regex, `src="$1?v=2.6.0"`);
        }
    });
    // Also edit.js itself
    editHtml = editHtml.replace(/src="js\/edit\.js(?:\?[^"]*)?"/g, 'src="js/edit.js?v=2.6.0"');
    fs.writeFileSync(editIndexPath, editHtml, 'utf8');
    console.log('✅ Cache-busted scripts in: edit/index.html');
}

console.log(`\n🎉 Total ${updatedCount + 1} HTML files updated with version tag ?v=2.6.0!`);
