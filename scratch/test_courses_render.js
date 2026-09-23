const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '..', 'js', 'courses-manager.js');
const code = fs.readFileSync(file, 'utf8');

console.log('File size:', code.length);

// Check for descText
const match = code.match(/descText/g);
console.log('Occurrences of descText:', match ? match.length : 0);

// Let's inspect where descText is defined or used
const lines = code.split('\n');
lines.forEach((l, i) => {
    if (l.includes('descText')) {
        console.log(`Line ${i+1}: ${l}`);
    }
});
