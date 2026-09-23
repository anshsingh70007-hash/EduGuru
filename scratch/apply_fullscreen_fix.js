const fs = require('fs');
const path = require('path');

const targetFiles = [
    path.join(__dirname, '..', 'edit', 'index.html'),
    path.join(__dirname, '..', 'edit.html')
];

const targetPattern = `    .modal-dialog {
        background: #ffffff !important;
        color: #0f172a !important;
        width: 100% !important;
        max-width: 860px !important;
        max-height: 92vh !important;
        border-radius: 18px !important;
        box-shadow: 0 25px 60px -15px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(0, 0, 0, 0.05) !important;
        display: flex !important;
        flex-direction: column !important;
        overflow: hidden !important;
        position: relative !important;
        margin: 16px !important;
    }`;

const replacement = `    .modal-dialog {
        background: #ffffff !important;
        color: #0f172a !important;
        width: 100% !important;
        max-width: 860px !important;
        max-height: 92vh !important;
        border-radius: 18px !important;
        box-shadow: 0 25px 60px -15px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(0, 0, 0, 0.05) !important;
        display: flex !important;
        flex-direction: column !important;
        overflow: hidden !important;
        position: relative !important;
        margin: 16px !important;
    }
    /* Allow fullscreen editor to cleanly break out of modal constraints */
    .fullscreen-modal-active .modal-dialog,
    body.has-fullscreen-editor .modal-dialog {
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        right: 0 !important;
        bottom: 0 !important;
        width: 100vw !important;
        height: 100vh !important;
        max-width: 100vw !important;
        max-height: 100vh !important;
        margin: 0 !important;
        padding: 0 !important;
        border-radius: 0 !important;
        z-index: 99999 !important;
    }
    body.has-fullscreen-editor .modal-overlay,
    .fullscreen-modal-active.modal-overlay {
        padding: 0 !important;
        margin: 0 !important;
    }`;

targetFiles.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    // Normalize CRLF to LF for matching
    const isCrlf = content.includes('\r\n');
    const normalizedContent = content.replace(/\r\n/g, '\n');
    const normalizedTarget = targetPattern.replace(/\r\n/g, '\n');
    const normalizedReplacement = replacement.replace(/\r\n/g, '\n');

    if (!normalizedContent.includes(normalizedTarget)) {
        console.error(`Target pattern not found in ${file}`);
        process.exit(1);
    }

    let updated = normalizedContent.replace(normalizedTarget, normalizedReplacement);
    if (isCrlf) {
        updated = updated.replace(/\n/g, '\r\n');
    }
    fs.writeFileSync(file, updated, 'utf8');
    console.log(`Successfully updated: ${file}`);
});
