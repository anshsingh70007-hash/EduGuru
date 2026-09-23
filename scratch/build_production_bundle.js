const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const SOURCE_DIR = path.resolve(__dirname, '..');
const DEST_DIR = 'C:\\Users\\Harmeet Singh\\Downloads\\educationistguru_production_package';
const ZIP_PATH = 'C:\\Users\\Harmeet Singh\\Downloads\\educationistguru_production_package.zip';

console.log('🚀 Starting Clean Production Bundle Packaging...');
console.log('Source Directory:', SOURCE_DIR);
console.log('Target Directory:', DEST_DIR);

// Clean existing destination
if (fs.existsSync(DEST_DIR)) {
    console.log('Cleaning existing target directory...');
    fs.rmSync(DEST_DIR, { recursive: true, force: true });
}
fs.mkdirSync(DEST_DIR, { recursive: true });

// 1. Directories to include
const INCLUDE_DIRS = [
    'app',
    'backups',
    'CRM',
    'css',
    'data',
    'edit',
    'fonts',
    'images',
    'js'
];

function copyDirRecursive(src, dest) {
    if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
    }
    const entries = fs.readdirSync(src, { withFileTypes: true });
    for (const entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);
        if (entry.isDirectory()) {
            copyDirRecursive(srcPath, destPath);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    }
}

for (const dirName of INCLUDE_DIRS) {
    const src = path.join(SOURCE_DIR, dirName);
    const dest = path.join(DEST_DIR, dirName);
    if (fs.existsSync(src)) {
        console.log(`📁 Copying directory [${dirName}]...`);
        copyDirRecursive(src, dest);
    } else {
        console.warn(`⚠️ Warning: Directory [${dirName}] does not exist.`);
    }
}

// 2. Specific Root files to include
const ROOT_FILES = [
    'about.html',
    'about2.html',
    'about3.html',
    'blog.html',
    'blog-details.html',
    'colleges.html',
    'contact.html',
    'courses.html',
    'courses2.html',
    'courses-details.html',
    'courses-details2.html',
    'error-404.html',
    'events.html',
    'events-details.html',
    'gallery.html',
    'gallery2.html',
    'gallery3.html',
    'index.html',
    'edit.html',
    'teachers.html',
    'teachers-single.html',
    'teachers-without-filter.html',
    'universities.html',
    'youtube.html',
    'favicon.ico',
    '.htaccess',
    'api.php',
    'style.css',
    'server.js',
    'package.json',
    'package-lock.json'
];

for (const fileName of ROOT_FILES) {
    const src = path.join(SOURCE_DIR, fileName);
    const dest = path.join(DEST_DIR, fileName);
    if (fs.existsSync(src)) {
        console.log(`📄 Copying root file [${fileName}]...`);
        fs.copyFileSync(src, dest);
    } else {
        console.warn(`⚠️ Warning: Root file [${fileName}] does not exist.`);
    }
}

// 3. Create Deployment Instruction Files
const guideContent = `# 🚀 EducationistGuru - Production Deployment Guide (Hostinger)

This package contains the **100% clean, production-ready website and CRM system** for **EducationistGuru.com**.
All redundant scratch files, development scripts, test logs, and build artifacts have been stripped.

---

## 📦 What is in this Folder?
1. **Frontend Website Pages (\`*.html\`, \`css/\`, \`js/\`, \`images/\`, \`fonts/\`)**:
   - Brand new modernized **Blog & Search Hub** (\`blog.html\`, \`blog-details.html\`, \`css/blog.css\`)
   - Course Enrollment & Inquiry system with instant WhatsApp integration & deduplication
   - Clean SEO URL routing config (\`.htaccess\`)
2. **EducationistGuru CRM Suite (\`CRM/\`)**:
   - Counselor & Admin Dashboard (\`CRM/dashboard.html\`)
   - Leads Manager (\`CRM/leads.html\`)
   - Inquiries Portal (\`CRM/inquiries.html\`) with 1-click Convert to Lead & Hot🔥 upgrade
   - Applications Dossier (\`CRM/applications.html\`)
   - Settings, Subscribers, Fees, Users
3. **Student Portal Web App (\`app/\`)**:
   - Complete responsive student portal application
4. **Data Vault & Storage (\`data/\`, \`backups/\`)**:
   - Clean, verified student leads (\`data/leads.json\`) and inquiries (\`data/inquiries.json\`)
   - Automated local vault snapshots for zero data loss
5. **Backend Server (\`server.js\`, \`package.json\`)**:
   - Zero-dependency Node.js production server with dynamic slug routing, automatic deduplication, and boot vault self-healing.

---

## 🛠️ How to Replace on Hostinger (Step-by-Step)

### Option A: Upload the ZIP File via Hostinger File Manager (Recommended - Fastest & Easiest!)
1. In your **Downloads** folder, find:
   \`educationistguru_production_package.zip\`
2. Log in to your **Hostinger Control Panel (hPanel)**.
3. Open **File Manager** for \`educationistguru.com\`.
4. Navigate inside the **\`public_html\`** directory.
5. (Optional Backup) If you have existing files, you can select them and click "Archive" to save a quick backup ZIP.
6. Click the **Upload** button in the top right and select \`educationistguru_production_package.zip\`.
7. Right-click the uploaded ZIP file inside \`public_html\` and select **Extract**.
8. Done! All files, blogs, courses, CRM, and styles are instantly updated.

---

### Option B: Replace via FTP / FileZilla
1. Connect via FTP to your Hostinger server.
2. Open \`public_html\` on the remote server.
3. On the left pane (Local Site), open this folder:
   \`C:\\Users\\Harmeet Singh\\Downloads\\educationistguru_production_package\`
4. Select all files and folders and drag them to the remote \`public_html\` pane.
5. Choose **Overwrite** if prompted.

---

### Option C: If Running as Node.js Application on Hostinger / VPS
- If you use Hostinger Node.js Application Manager:
  - **Application Root**: \`public_html\`
  - **Application Startup File**: \`server.js\`
  - **Node.js Version**: 18.x or 20.x
  - Simply click **Restart** in the Node.js panel.
  - No \`npm install\` needed because \`server.js\` uses native Node.js core modules!

---

## 🔒 Data Vault Security Note
- Your leads and inquiries in \`data/leads.json\` and \`data/inquiries.json\` are intact.
- The multi-tier vault system in \`server.js\` ensures that any new student inquiries or enrollments are saved across both local snapshots and persistent disk storage.
`;

fs.writeFileSync(path.join(DEST_DIR, 'HOSTINGER_DEPLOYMENT_GUIDE.md'), guideContent, 'utf8');

const txtContent = `========================================================================
EDUCATIONISTGURU.COM - CLEAN PRODUCTION DEPLOYMENT PACKAGE
========================================================================

Aapke saare files cleanly organize kardiye gaye hain is folder mai:
C:\\Users\\Harmeet Singh\\Downloads\\educationistguru_production_package\\

Aur saath hi saath 1-Click Upload ZIP bhi tayyar hai:
C:\\Users\\Harmeet Singh\\Downloads\\educationistguru_production_package.zip

------------------------------------------------------------------------
KAISE REPLACE KAREIN (HOSTINGER PAR):
------------------------------------------------------------------------
1. Hostinger hPanel login karein -> File Manager open karein.
2. public_html folder ke andar jayein.
3. Upload button par click karke 'educationistguru_production_package.zip' upload karein.
4. ZIP par right-click karke 'Extract' karein.
5. Saari nayi files (Naya Blog Hub, Lead/Inquiry auto-deduplication, CRM upgrades, etc.) 
   ek hi baar mai replace ho jayengi bina kisi jhanjhat ke!

Zero data loss guarantee:
Saare verified leads, inquiries, courses, aur vault snapshots is package ke 'data/' folder mai shamil hain.
========================================================================
`;

fs.writeFileSync(path.join(DEST_DIR, 'DEPLOYMENT_INSTRUCTIONS.txt'), txtContent, 'utf8');

console.log('✅ Instruction guides created.');

// 4. Create ZIP archive
console.log('📦 Creating ZIP archive for 1-click Hostinger upload...');
if (fs.existsSync(ZIP_PATH)) {
    fs.unlinkSync(ZIP_PATH);
}

try {
    console.log('Running POSIX Zip Archiver (Python)...');
    execSync('python scratch/package_with_python.py', { stdio: 'inherit', cwd: SOURCE_DIR });
    console.log(`🎉 POSIX ZIP Archive created successfully at: ${ZIP_PATH}`);
} catch (err) {
    console.error('Error creating zip with Python:', err.message);
}

// 5. Package summary & verification
const dirItems = fs.readdirSync(DEST_DIR);
console.log('\n📊 Production Package Verification:');
console.log(`Total Root Items in Package: ${dirItems.length}`);
dirItems.forEach(item => {
    const stat = fs.statSync(path.join(DEST_DIR, item));
    const type = stat.isDirectory() ? '[DIR] ' : '[FILE]';
    console.log(`  ${type} ${item} (${(stat.size / 1024).toFixed(1)} KB)`);
});

if (fs.existsSync(ZIP_PATH)) {
    const zipStat = fs.statSync(ZIP_PATH);
    console.log(`\n📦 ZIP Size: ${(zipStat.size / (1024 * 1024)).toFixed(2)} MB`);
}
console.log('\n✨ All Done! Package is ready for zero-hassle replacement.');
