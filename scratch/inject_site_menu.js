const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');

const TARGET_FILES = [
    'index.html',
    'courses.html',
    'colleges.html',
    'universities.html',
    'courses-details.html',
    'about.html',
    'contact.html',
    'blog.html',
    'blog-details.html',
    'youtube.html',
    'courses2.html',
    'courses-details2.html',
    'about2.html',
    'about3.html',
    'gallery.html',
    'gallery2.html',
    'gallery3.html',
    'events.html',
    'events-details.html',
    'teachers.html',
    'teachers-single.html',
    'teachers-without-filter.html',
    'error-404.html'
];

let updatedCount = 0;

TARGET_FILES.forEach(filename => {
    const filePath = path.join(ROOT_DIR, filename);
    if (!fs.existsSync(filePath)) {
        console.warn(`File not found: ${filename}`);
        return;
    }

    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // 1. Inject CSS before </head>
    if (!content.includes('css/site-menu.css')) {
        const cssTag = '    <!-- Dynamic Site Mega-Menu & Custom Headers CSS -->\n    <link rel="stylesheet" href="css/site-menu.css?v=1.0.0">\n';
        if (content.includes('</head>')) {
            content = content.replace('</head>', `${cssTag}</head>`);
            modified = true;
        }
    }

    // 2. Inject JS before </body>
    if (!content.includes('js/site-menu.js')) {
        const jsTag = '    <!-- Dynamic Site Mega-Menu & Custom Headers Hydration -->\n    <script src="js/site-menu.js?v=1.0.0"></script>\n';
        if (content.includes('</body>')) {
            content = content.replace('</body>', `${jsTag}</body>`);
            modified = true;
        }
    }

    if (modified) {
        fs.writeFileSync(filePath, content, 'utf8');
        updatedCount++;
        console.log(`✅ Injected site-menu assets into [${filename}]`);
    } else {
        console.log(`ℹ️ [${filename}] already has site-menu assets`);
    }
});

console.log(`\n🎉 Completed! Updated ${updatedCount} HTML pages.`);
