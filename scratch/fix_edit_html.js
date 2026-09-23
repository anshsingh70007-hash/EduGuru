const fs = require('fs');
const crypto = require('crypto');

function fixFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');

    // 1. Update Head with no-cache meta and css version 5.6.0
    content = content.replace(
        /<meta name="viewport" content="width=device-width, initial-scale=1\.0">/,
        `<meta name="viewport" content="width=device-width, initial-scale=1.0">\n    <meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate">\n    <meta http-equiv="Pragma" content="no-cache">\n    <meta http-equiv="Expires" content="0">`
    );
    content = content.replace(
        /\/edit\/css\/edit\.css\?v=[0-9.]+/g,
        '/edit/css/edit.css?v=5.6.0'
    );

    // 2. Remove duplicate videoModal & broken deleteConfirmModal
    // The duplicate block starts with:
    //     <!-- ================= DELETE CONFIRMATION MODAL ================= -->\r?\n    <div class="modal-overlay" id="deleteConfirmModal">\r?\n        <div class="modal-dialog" style="max-width: 440px; text-align: center;">\r?\n            <div class="modal-body" style="padding: 32px 24px;">\r?\n                <div class="modal-footer">\r?\n                    <button type="button" class="btn btn-outline" onclick="window.closeBlogModal()">Cancel</button>
    // up until the closing `    </div>\r?\n    </div>` right before the real deleteConfirmModal.

    const duplicateRegex = /\s*<!-- ================= DELETE CONFIRMATION MODAL ================= -->\s*<div class="modal-overlay" id="deleteConfirmModal">\s*<div class="modal-dialog" style="max-width: 440px; text-align: center;">[\s\S]*?<\/form>\s*<\/div>\s*<\/div>\s*<!-- ================= ADD YOUTUBE VIDEO MODAL ================= -->[\s\S]*?<\/form>\s*<\/div>\s*<\/div>/;
    
    if (duplicateRegex.test(content)) {
        content = content.replace(duplicateRegex, '');
        console.log(`Successfully removed duplicate block from ${filePath}`);
    } else {
        console.warn(`Duplicate block regex did not match in ${filePath}`);
    }

    // 3. Update Script tag to v=5.6.0
    content = content.replace(
        /\/edit\/js\/edit\.js\?v=[0-9.]+/g,
        '/edit/js/edit.js?v=5.6.0'
    );

    fs.writeFileSync(filePath, content, 'utf8');
}

fixFile('edit/index.html');
fixFile('edit.html');

// Verify duplicates
const checkScript = require('./check_duplicates.js');
