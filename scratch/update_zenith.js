const fs = require('fs');
const path = require('path');

const collegesPath = path.join(__dirname, '../data/colleges.json');
let colleges = JSON.parse(fs.readFileSync(collegesPath, 'utf8'));

// Find Zenith
const zenithIdx = colleges.findIndex(c => c.id === 7 || (c.name && c.name.toLowerCase().includes('zenith')));
if (zenithIdx !== -1) {
    colleges[zenithIdx] = {
        ...colleges[zenithIdx],
        category: "Faculty of Engineering & Technology, Faculty of Computer Applications & IT, Faculty of Commerce & Management",
        categories: [
            "Faculty of Engineering & Technology",
            "Faculty of Computer Applications & IT",
            "Faculty of Commerce & Management"
        ],
        courses: [
            "B.Tech Artificial Intelligence",
            "B.Tech Computer Science",
            "M.Tech Robotics",
            "MCA",
            "BCA",
            "MBA Tech"
        ]
    };
    console.log('Zenith Institute updated with multi-faculty and rich course tags!');
} else {
    console.warn('Zenith Institute not found by index.');
}

fs.writeFileSync(collegesPath, JSON.stringify(colleges, null, 2), 'utf8');
console.log('SUCCESS: data/colleges.json written!');
