const fs = require('fs');

function addSyncListener(filename, callCode) {
  let content = fs.readFileSync('CRM/' + filename, 'utf8');
  if (content.includes("crm:synced")) {
    console.log('Already has listener:', filename);
    return;
  }
  const snippet = `
        // Multi-device real-time sync listener
        window.addEventListener('crm:synced', () => {
            ${callCode}
        });
`;
  const lastScriptClose = content.lastIndexOf('</script>');
  if (lastScriptClose !== -1) {
    content = content.substring(0, lastScriptClose) + snippet + content.substring(lastScriptClose);
    fs.writeFileSync('CRM/' + filename, content, 'utf8');
    console.log('✅ Added sync listener to CRM/' + filename);
  }
}

addSyncListener('applications.html', 'if (typeof render === "function") render();');
addSyncListener('enrollments.html', 'if (typeof render === "function") render();');
addSyncListener('fees.html', 'if (typeof renderFees === "function") renderFees();');
addSyncListener('subscribers.html', 'if (typeof render === "function") render();');
addSyncListener('users.html', 'if (typeof renderPage === "function") renderPage();');
