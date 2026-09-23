const fs = require('fs');
const path = require('path');

const crmDir = path.resolve(__dirname, '../CRM');
const files = fs.readdirSync(crmDir).filter(f => f.endsWith('.html') && f !== 'index.html');

console.log('Fixing CRM files:', files);

files.forEach(file => {
    const filePath = path.join(crmDir, file);
    let html = fs.readFileSync(filePath, 'utf8');

    // 1. Add <base href="/crm/"> if not already present
    if (!html.includes('<base href="/crm/">')) {
        html = html.replace('<head>', '<head>\n    <base href="/crm/">');
    }

    // 2. Fix favicon and logo paths
    html = html.replace(/href="\.\.\/images\/fav\.png"/g, 'href="/images/fav.png"');
    html = html.replace(/src="\.\.\/images\/logo-white\.png"/g, 'src="/images/logo-white.png"');

    // 3. Fix data.js script tag to include cache buster
    html = html.replace(/src="js\/data\.js(?:\?v=[^"]+)?"/g, 'src="/crm/js/data.js?v=2.6.0"');

    // 4. Fix auth redirect from index.html to /crm/
    html = html.replace(/window\.location\.href\s*=\s*'index\.html'/g, "window.location.href='/crm/'");
    html = html.replace(/window\.location\.href\s*=\s*'dashboard\.html'/g, "window.location.href='/crm/dashboard'");

    // 5. Fix sidebar navigation links
    const moduleMap = [
        { from: "href:'dashboard.html'", to: "href:'/crm/dashboard'" },
        { from: "href:'leads.html'", to: "href:'/crm/leads'" },
        { from: "href:'applications.html'", to: "href:'/crm/applications'" },
        { from: "href:'enrollments.html'", to: "href:'/crm/enrollments'" },
        { from: "href:'inquiries.html'", to: "href:'/crm/inquiries'" },
        { from: "href:'subscribers.html'", to: "href:'/crm/subscribers'" },
        { from: "href:'fees.html'", to: "href:'/crm/fees'" },
        { from: "href:'users.html'", to: "href:'/crm/users'" },
        { from: "href:'settings.html'", to: "href:'/crm/settings'" }
    ];

    moduleMap.forEach(m => {
        html = html.split(m.from).join(m.to);
    });

    // 6. Fix topbar inquiries bell link
    html = html.replace(/onclick="window\.location\.href='inquiries\.html'"/g, 'onclick="window.location.href=\'/crm/inquiries\'"');

    fs.writeFileSync(filePath, html, 'utf8');
    console.log('✅ Updated CRM file:', file);
});

console.log('🎉 All CRM files updated with bulletproof root-relative navigation & base href!');
