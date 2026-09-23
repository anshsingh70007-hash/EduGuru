const fs = require('fs');
const path = require('path');

const blogs = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'blogs.json'), 'utf8'));

function extractChips(b) {
    let rawCats = [];
    if (Array.isArray(b.categories) && b.categories.length > 0) {
        rawCats = b.categories;
    } else if (typeof b.category === 'string' && b.category.trim()) {
        let catStr = b.category.trim();
        if (catStr.includes(',')) {
            rawCats = catStr.split(',').map(s => s.trim()).filter(Boolean);
        } else if (catStr === 'University AdmissionsCareer Guidance') {
            rawCats = ['University Admissions', 'Career Guidance'];
        } else {
            const splitConcatenated = catStr.replace(/([a-z])([A-Z])/g, '$1|$2').split('|');
            if (splitConcatenated.length > 1 && !catStr.includes(' ')) {
                rawCats = splitConcatenated;
            } else {
                rawCats = [catStr];
            }
        }
    }
    if (rawCats.length === 0) rawCats = ['Admissions'];
    return rawCats.slice(0, 2);
}

console.log('=== Blog Article Categories Test ===');
blogs.forEach(b => {
    const chips = extractChips(b);
    console.log(`ID ${b.id}: "${b.title.slice(0, 40)}..." => Chips: [${chips.map(c => `"${c}"`).join(', ')}]`);
    if (chips.some(c => c.includes('AdmissionsCareer'))) {
        console.error(`❌ FAILED: Concatenated chip found in ID ${b.id}: ${chips}`);
        process.exit(1);
    }
});

console.log('✅ ALL BLOG CARDS PASS: No concatenated chips!');
