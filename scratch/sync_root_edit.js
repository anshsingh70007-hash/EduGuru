const fs = require('fs');
const path = require('path');

const src = path.join(__dirname, '..', 'edit', 'index.html');
const dest = path.join(__dirname, '..', 'edit.html');

let content = fs.readFileSync(src, 'utf8');
content = content.replace('href="../images/fav.png"', 'href="images/fav.png"');
content = content.replace('href="css/edit.css', 'href="edit/css/edit.css');
content = content.replace('src="js/edit.js', 'src="edit/js/edit.js');

fs.writeFileSync(dest, content, 'utf8');
console.log('✅ edit.html successfully synchronized from edit/index.html!');
console.log('Lines:', content.split('\n').length);
