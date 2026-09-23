const fs = require('fs');
const path = require('path');
const os = require('os');

const rootDir = path.resolve(__dirname, '..');
const dataDir = path.join(rootDir, 'data');
const localVaultDir = path.join(rootDir, 'backups', 'vault');
const extVaultDir = process.env.DATA_VAULT_DIR || path.join(os.homedir(), '.educationistguru_vault');

function safeWriteAll(filename, data) {
    const raw = JSON.stringify(data, null, 2);
    [dataDir, localVaultDir, extVaultDir].forEach(dir => {
        try {
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
            fs.writeFileSync(path.join(dir, filename), raw, 'utf8');
        } catch (e) {
            console.warn(`Failed writing ${filename} to ${dir}:`, e.message);
        }
    });
}

// 1. Enrich Colleges
const collegesPath = path.join(dataDir, 'colleges.json');
let colleges = JSON.parse(fs.readFileSync(collegesPath, 'utf8'));

colleges = colleges.map(c => {
    let facs = c.facilities || [];
    if (!facs || facs.length === 0) {
        if (c.name.toLowerCase().includes('pharm')) {
            facs = ['Drug Formulation Labs', 'Research Labs', 'Digital E-Library', 'AC Auditorium', 'Campus Wi-Fi', 'Placement Cell'];
        } else if (c.name.toLowerCase().includes('law')) {
            facs = ['Moot Court Hall', 'Legal Aid Clinic', 'Bar Council Law Library', 'Wi-Fi Campus', 'Seminar Hall'];
        } else if (c.name.toLowerCase().includes('tech') || c.name.toLowerCase().includes('ai')) {
            facs = ['Advanced AI & Robotics Lab', 'Wi-Fi Campus', 'Central Digital Library', 'Hostel Accommodations', '100% Placement Cell'];
        } else {
            facs = ['Wi-Fi Campus', 'Modern Computer Labs', 'Central Library', 'Cafeteria & Mess', 'Placement Cell'];
        }
    }

    let tags = c.tags || [];
    if (!tags || tags.length === 0) {
        tags = ['Accredited Campus', '100% Free Counseling', 'Verified Institute'];
    }

    let kws = c.keywords || [];
    if (!kws || kws.length === 0) {
        kws = ['Direct Admission', 'Government Valid', 'Affordable Installments'];
    }

    let metaDesc = c.metaDescription || '';
    if (!metaDesc) {
        metaDesc = `Admissions Open at ${c.name}. ${c.accreditation || 'Approved by AICTE & UGC'}. Get free counselor support and fee installment breakdown.`;
    }

    return {
        ...c,
        facilities: facs,
        tags: tags,
        keywords: kws,
        metaDescription: metaDesc
    };
});

safeWriteAll('colleges.json', colleges);
console.log('✅ Enriched colleges with facilities, tags, and SEO metadata');

// 2. Enrich Universities
const univPath = path.join(dataDir, 'universities.json');
let univs = JSON.parse(fs.readFileSync(univPath, 'utf8'));

univs = univs.map(u => {
    let facs = u.facilities || [];
    if (!facs || facs.length === 0) {
        if (u.name.toLowerCase().includes('subharti')) {
            facs = ['Dedicated Student E-Portal', 'Digital Marksheet Verification', 'Wi-Fi Campus', 'Medical Hospital & Center', 'Central Placement Cell', 'Central Library'];
        } else if (u.name.toLowerCase().includes('aiu') || u.name.toLowerCase().includes('asian')) {
            facs = ['Online Student LMS Portal', 'Wi-Fi Enabled Campus', 'Central E-Library', 'Placement Assistance Cell', 'Hostel Accommodations'];
        } else {
            facs = ['Online LMS & E-Lectures', 'Wi-Fi Campus', 'Central Library', 'Research Laboratories', 'Placement Division'];
        }
    }

    let tags = u.tags || [];
    if (!tags || tags.length === 0) {
        tags = [u.naac ? u.naac.split(' ')[0] : 'UGC Recognized', 'Online & Distance Learning', 'Government Valid'];
    }

    let kws = u.keywords || [];
    if (!kws || kws.length === 0) {
        kws = [`${u.name} Admission 2026`, 'Distance Degree Equivalence', 'UGC Approved University'];
    }

    let metaDesc = u.metaDescription || '';
    if (!metaDesc) {
        metaDesc = `${u.name} Admissions 2026. ${u.approvals || 'UGC Recognized'}. Flexible semester fees, online exam options, and counselor helpline.`;
    }

    return {
        ...u,
        facilities: facs,
        tags: tags,
        keywords: kws,
        metaDescription: metaDesc
    };
});

safeWriteAll('universities.json', univs);
console.log('✅ Enriched universities with facilities, tags, and SEO metadata');
