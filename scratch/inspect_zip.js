const fs = require('fs');
const { execSync } = require('child_process');

const zip = 'C:\\Users\\Harmeet Singh\\Downloads\\educationistguru_production_package.zip';
const cmd = `powershell -NoProfile -Command "Add-Type -AssemblyName System.IO.Compression.FileSystem; [System.IO.Compression.ZipFile]::OpenRead('${zip}').Entries | Select-Object -ExpandProperty FullName"`;
const entries = execSync(cmd, { encoding: 'utf8' }).split('\r\n').map(x => x.trim()).filter(Boolean);

console.log('Total entries:', entries.length);
console.log('Has .htaccess:', entries.includes('.htaccess'));
console.log('CRM entries in zip:', entries.filter(e => e.toUpperCase().includes('CRM')));
console.log('All entries with backslash:', entries.filter(e => e.includes('\\')).length);
console.log('All entries with forward slash:', entries.filter(e => e.includes('/')).length);
console.log('Has api.php:', entries.includes('api.php'));
console.log('Has style.css:', entries.includes('style.css'));
console.log('Has CRM/index.html:', entries.includes('CRM/index.html'));
console.log('First 15 entries:\n', entries.slice(0, 15));
