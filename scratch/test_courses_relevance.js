const fs = require('fs');
const path = require('path');

// Read courses.json
const coursesPath = path.join(__dirname, '..', 'data', 'courses.json');
const courses = JSON.parse(fs.readFileSync(coursesPath, 'utf8'));

// Extract calculateCourseRelevance logic from js/courses-manager.js
function calculateCourseRelevance(course, query) {
    if (!query) return 0;
    const q = query.toLowerCase().trim();
    const name = String(course.name || '').toLowerCase();
    const faculty = String(course.faculty || '').toLowerCase();
    const desc = String(course.description || '').toLowerCase();
    const specs = String(course.specializations || '').toLowerCase();
    const cats = Array.isArray(course.categories) ? course.categories.join(' ').toLowerCase() : String(course.category || '').toLowerCase();
    const tags = Array.isArray(course.tags) ? course.tags.join(' ').toLowerCase() : String(course.tags || '').toLowerCase();

    let score = 0;
    if (name === q) score += 150;
    else if (name.startsWith(q + ' ') || name.startsWith(q + ' -')) score += 130;
    else if (name.includes(' in ' + q) || name.includes(' of ' + q) || name.includes(' (' + q + ')')) score += 110;
    else if (name.includes(q)) score += 85;

    if (faculty.includes(q)) score += 60;
    if (cats.includes(q) || tags.includes(q)) score += 40;
    if (specs.includes(q)) score += 20;
    if (desc.includes(q)) score += 10;

    return score;
}

const query = 'commerce';
const scored = courses.map(c => ({
    name: c.name,
    faculty: c.faculty,
    score: calculateCourseRelevance(c, query)
})).filter(c => c.score > 0);

scored.sort((a, b) => b.score - a.score);

console.log(`=== Top 10 Search Results for "${query}" ===`);
scored.slice(0, 10).forEach((item, idx) => {
    console.log(`${idx + 1}. [Score: ${item.score}] ${item.name} (${item.faculty})`);
});

const topResult = scored[0];
if (topResult && (topResult.name.toLowerCase().includes('commerce') || topResult.name.toLowerCase().includes('b.com') || topResult.name.toLowerCase().includes('m.com'))) {
    console.log('✅ TEST PASSED: Top result for "commerce" is a real Commerce program (' + topResult.name + '), not Ph.D.');
} else {
    console.error('❌ TEST FAILED: Top result is ' + (topResult ? topResult.name : 'none'));
    process.exit(1);
}
