const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
console.log('🔧 Starting Comprehensive Website & CRM Link / Base Repair...');

// Smart dynamic base snippet for sub-route pages only (courses-details, blog-details, colleges, universities)
const SMART_BASE_SNIPPET = `<script>
    // Only inject base tag on web server when URL has deep sub-path (e.g. /courses/b-tech-ai)
    // NEVER inject under file: protocol so local file browsing works 100% cleanly
    if (window.location.protocol !== 'file:' && window.location.pathname.split('/').filter(Boolean).length > 1) {
        var b = document.createElement('base');
        b.href = '/';
        document.head.prepend(b);
    }
</script>`;

// 1. Process Root HTML files
const rootHtmlFiles = fs.readdirSync(ROOT).filter(f => f.endsWith('.html'));

const LINK_REPLACEMENTS = [
    { from: /href="\/(about|about\.html)?"(?=[\s>])/g, to: (m, p) => p === 'about' || p === 'about.html' ? 'href="about.html"' : 'href="index.html"' },
    { from: /href="\/courses"/g, to: 'href="courses.html"' },
    { from: /href="\/colleges"/g, to: 'href="colleges.html"' },
    { from: /href="\/universities"/g, to: 'href="universities.html"' },
    { from: /href="\/youtube"/g, to: 'href="youtube.html"' },
    { from: /href="\/blog"/g, to: 'href="blog.html"' },
    { from: /href="\/contact"/g, to: 'href="contact.html"' },
    { from: /href="\/gallery"/g, to: 'href="gallery.html"' },
    { from: /href="\/events"/g, to: 'href="events.html"' },
    { from: /href="\/teachers"/g, to: 'href="teachers.html"' },
    { from: /href="\/edit\/?\"/g, to: 'href="edit/index.html"' },
    { from: /href="\/[cC][rR][mM]\/?\"/g, to: 'href="CRM/index.html"' },
    { from: /href="\/"/g, to: 'href="index.html"' },
    { from: /href="\/index\.html"/g, to: 'href="index.html"' }
];

rootHtmlFiles.forEach(file => {
    const filePath = path.join(ROOT, file);
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    // Remove static base tag
    if (content.includes('<base href="/">') || content.includes("<base href='/'>")) {
        content = content.replace(/<base href=["']\/["']\s*\/?>/gi, '');
        // For deep-route pages, add smart dynamic base snippet
        if (['courses-details.html', 'blog-details.html', 'colleges.html', 'universities.html'].includes(file)) {
            content = content.replace('<head>', '<head>\n    ' + SMART_BASE_SNIPPET);
        }
    }

    // Replace root-relative links
    LINK_REPLACEMENTS.forEach(r => {
        content = content.replace(r.from, r.to);
    });

    // Fix root-relative asset links in courses-details.html & others
    content = content.replace(/href="\/style\.css"/g, 'href="style.css"');
    content = content.replace(/href="\/css\//g, 'href="css/');
    content = content.replace(/src="\/js\//g, 'src="js/');
    content = content.replace(/href="\/images\//g, 'href="images/');
    content = content.replace(/src="\/images\//g, 'src="images/');
    content = content.replace(/fetch\('\/data\//g, "fetch('data/");

    if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`✅ Fixed links & base tags in [${file}]`);
    }
});

// 2. Process CRM HTML files
const CRM_DIR = path.join(ROOT, 'CRM');
if (fs.existsSync(CRM_DIR)) {
    const crmFiles = fs.readdirSync(CRM_DIR).filter(f => f.endsWith('.html'));
    crmFiles.forEach(file => {
        const filePath = path.join(CRM_DIR, file);
        let content = fs.readFileSync(filePath, 'utf8');
        let original = content;

        // Strip <base href="/CRM/">
        content = content.replace(/<base href=["']\/CRM\/["']\s*\/?>/gi, '');
        content = content.replace(/href="\/"/g, 'href="../index.html"');

        if (content !== original) {
            fs.writeFileSync(filePath, content, 'utf8');
            console.log(`✅ Stripped destructive <base> in CRM [${file}]`);
        }
    });
}

// 3. Process edit/index.html
const editFile = path.join(ROOT, 'edit', 'index.html');
if (fs.existsSync(editFile)) {
    let content = fs.readFileSync(editFile, 'utf8');
    let original = content;
    content = content.replace(/href="\/images\//g, 'href="../images/');
    content = content.replace(/src="\/images\//g, 'src="../images/');
    content = content.replace(/href="\/edit\/css\//g, 'href="css/');
    content = content.replace(/src="\/edit\/js\//g, 'src="js/');
    content = content.replace(/href="\/"/g, 'href="../index.html"');
    if (content !== original) {
        fs.writeFileSync(editFile, content, 'utf8');
        console.log('✅ Fixed asset paths in [edit/index.html]');
    }
}

// 4. Update .htaccess for robust Apache compatibility
const htaccessPath = path.join(ROOT, '.htaccess');
const htaccessContent = `# =========================================================
# EducationistGuru - Production Apache / Hostinger .htaccess
# Universal Support: Static Hosting, Clean URLs, Dynamic Slugs & HTTPS
# =========================================================

Options -Indexes
RewriteEngine On
RewriteBase /

# 1. Force HTTPS
RewriteCond %{HTTPS} off
RewriteRule ^ https://%{HTTP_HOST}%{REQUEST_URI} [R=301,L]

# 2. Redirect root index.html to /
RewriteCond %{THE_REQUEST} ^[A-Z]{3,9}\ /index\.html\ HTTP/
RewriteRule ^index\.html$ / [R=301,L]

# 3. Dynamic Slug Rewrites
RewriteRule ^courses/([a-zA-Z0-9_-]+)/?$ courses-details.html [L,QSA]
RewriteRule ^colleges/([a-zA-Z0-9_-]+)/?$ colleges.html [L,QSA]
RewriteRule ^universities/([a-zA-Z0-9_-]+)/?$ universities.html [L,QSA]
RewriteRule ^blog/([a-zA-Z0-9_-]+)/?$ blog-details.html [L,QSA]

# 4. Clean Extensionless URLs: Serve corresponding .html file if it exists
RewriteCond %{REQUEST_FILENAME} !-d
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME}.html -f
RewriteRule ^([a-zA-Z0-9_/-]+)/?$ $1.html [L,QSA]

# 5. /edit & /CRM Directory handler
RewriteRule ^edit/?$ edit/index.html [L,QSA]
RewriteRule ^CRM/?$ CRM/index.html [L,QSA]

# 6. Custom 404 Error Page
ErrorDocument 404 /error-404.html
`;

fs.writeFileSync(htaccessPath, htaccessContent, 'utf8');
console.log('✅ Updated [.htaccess] with universal rewrite rules.');

// 5. Update CRM/js/data.js to avoid red CORS errors in file: protocol
const crmDataJs = path.join(ROOT, 'CRM', 'js', 'data.js');
if (fs.existsSync(crmDataJs)) {
    let content = fs.readFileSync(crmDataJs, 'utf8');
    content = content.replace(
        "const res = await fetch('/api/crm/all', { cache: 'no-cache' });",
        "const apiBase = window.location.protocol === 'file:' ? 'http://localhost:3000' : '';\n    const res = await fetch(apiBase + '/api/crm/all', { cache: 'no-cache' });"
    );
    content = content.replace(
        "const res = await fetch('/api/crm/' + key, {",
        "const apiBase = window.location.protocol === 'file:' ? 'http://localhost:3000' : '';\n      const res = await fetch(apiBase + '/api/crm/' + key, {"
    );
    fs.writeFileSync(crmDataJs, content, 'utf8');
    console.log('✅ Updated [CRM/js/data.js] with protocol-aware API base.');
}

console.log('🎉 All files updated successfully!');
