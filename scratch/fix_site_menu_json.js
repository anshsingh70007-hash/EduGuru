const fs = require('fs');
const path = require('path');

const menuPath = path.join(__dirname, '..', 'data', 'site_menu.json');
const menu = JSON.parse(fs.readFileSync(menuPath, 'utf8'));

// Find distance-mba-hub or subharti item
const mbaHub = menu.navItems.find(i => i.id === 'distance-mba-hub' || i.title.includes('MBA'));
if (mbaHub) {
    mbaHub.id = 'subharti-mba-hub';
    mbaHub.title = 'Subharti MBA';
    mbaHub.url = 'blog-details.html?id=100';
    mbaHub.type = 'dropdown';
    mbaHub.badge = 'New 2026';
    mbaHub.children = [
        {
            id: 'subharti-mba-guide',
            title: 'MBA in Financial & Project Management',
            url: 'blog-details.html?id=100',
            desc: 'Subharti University dual specialization admission & syllabus guide'
        },
        {
            id: 'subharti-course-details',
            title: 'Course Syllabus & Fee Schedule',
            url: 'courses-details.html?id=107',
            desc: '2-Year program breakdown, modules & recognition details'
        },
        {
            id: 'subharti-counselor-helpline',
            title: 'Direct Admission Helpline',
            url: 'contact.html?subject=Subharti+University+MBA',
            desc: 'Connect with authorized counselors at 8750477000'
        }
    ];
}

menu.config.updatedAt = new Date().toISOString();
fs.writeFileSync(menuPath, JSON.stringify(menu, null, 2), 'utf8');
console.log('✅ Cleaned up Subharti MBA links in data/site_menu.json!');
