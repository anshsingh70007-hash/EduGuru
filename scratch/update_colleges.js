const fs = require('fs');
const path = require('path');

const srcPath = path.join(__dirname, '../../educationistguru_production_package/colleges.html');
let html = fs.readFileSync(srcPath, 'utf8');

const target = '<a class="eg-filter-pill" data-college-filter="Engineering"><i class="fa fa-cogs"></i> Engineering</a>';
const replacement = '<a class="eg-filter-pill" data-college-filter="Engineering"><i class="fa fa-cogs"></i> Engineering</a>\n                            <a class="eg-filter-pill" data-college-filter="Computer Applications"><i class="fa fa-laptop"></i> Computer &amp; IT</a>';

if (html.includes(target)) {
    html = html.replace(target, replacement);
    fs.writeFileSync(path.join(__dirname, '../colleges.html'), html, 'utf8');
    console.log('SUCCESS: colleges.html restored and Computer & IT filter pill added!');
} else {
    console.error('ERROR: Target not found in source colleges.html');
}
