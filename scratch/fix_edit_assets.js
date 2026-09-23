const fs = require('fs');
const path = require('path');

const editIndexPath = path.join(__dirname, '..', 'edit', 'index.html');
const editRootPath = path.join(__dirname, '..', 'edit.html');

let html = fs.readFileSync(editIndexPath, 'utf8');

// Ensure stylesheet and scripts use absolute paths /edit/...
html = html.replace(/href="[^"]*css\/edit\.css[^"]*"/g, 'href="/edit/css/edit.css?v=5.2.0"');
html = html.replace(/src="[^"]*js\/edit\.js[^"]*"/g, 'src="/edit/js/edit.js?v=5.2.0"');
html = html.replace('href="../images/fav.png"', 'href="/images/fav.png"');

fs.writeFileSync(editIndexPath, html, 'utf8');
fs.writeFileSync(editRootPath, html, 'utf8');

console.log('✅ Synchronized edit/index.html and root edit.html with absolute asset paths!');
