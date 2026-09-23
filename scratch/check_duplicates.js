const fs = require('fs');

function checkFile(filePath) {
    const html = fs.readFileSync(filePath, 'utf8');
    const idRegex = /id=["']([^"']+)["']/g;
    let match;
    const counts = {};
    const lines = {};
    const splitLines = html.split('\n');
    
    splitLines.forEach((line, idx) => {
        let m;
        const re = /id=["']([^"']+)["']/g;
        while ((m = re.exec(line)) !== null) {
            const id = m[1];
            counts[id] = (counts[id] || 0) + 1;
            if (!lines[id]) lines[id] = [];
            lines[id].push(idx + 1);
        }
    });

    const duplicates = Object.entries(counts).filter(([id, count]) => count > 1);
    console.log(`Duplicate IDs in ${filePath}:`, duplicates.length);
    duplicates.forEach(([id, count]) => {
        console.log(`  - ${id} (${count} times) at lines: ${lines[id].join(', ')}`);
    });
}

checkFile('edit/index.html');
checkFile('edit.html');
