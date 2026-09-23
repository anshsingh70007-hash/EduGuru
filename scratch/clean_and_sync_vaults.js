const fs = require('fs');
const path = require('path');
const os = require('os');

const ROOT_DIR = path.resolve(__dirname, '..');
const DATA_DIR = path.join(ROOT_DIR, 'data');
const VAULT_LOCAL_DIR = path.join(ROOT_DIR, 'backups', 'vault');
const VAULT_EXTERNAL_DIR = path.join(os.homedir(), '.educationistguru_vault');

function safeWriteJsonAtomic(targetPath, data) {
    const tmpPath = `${targetPath}.tmp.${Date.now()}.${Math.random().toString(36).slice(2, 6)}`;
    try {
        const dir = path.dirname(targetPath);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2), 'utf8');
        fs.renameSync(tmpPath, targetPath);
        return true;
    } catch (e) {
        try { if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath); } catch (_) {}
        console.error(`Failed atomic write to ${targetPath}:`, e.message);
        return false;
    }
}

function writeToAllVaults(filename, data) {
    const p1 = path.join(DATA_DIR, filename);
    const p2 = path.join(VAULT_LOCAL_DIR, filename);
    const p3 = path.join(VAULT_EXTERNAL_DIR, filename);
    safeWriteJsonAtomic(p1, data);
    safeWriteJsonAtomic(p2, data);
    safeWriteJsonAtomic(p3, data);
    console.log(`✅ Cleaned & Persisted ${filename} (${data.length} records) across all 3 vaults.`);
}

// 1. Clean Leads
const rawLeads = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'leads.json'), 'utf8'));
const cleanLeadsMap = new Map();

rawLeads.forEach(lead => {
    const phone = (lead.phone || '').replace(/\D/g, '').slice(-10);
    const email = (lead.email || '').trim().toLowerCase();
    const course = (lead.course || '').trim().toLowerCase();
    const key = phone ? `${phone}_${course}` : (email ? `${email}_${course}` : `id_${lead.id}`);
    
    if (!cleanLeadsMap.has(key)) {
        cleanLeadsMap.set(key, lead);
    } else {
        // Keep the one with richer notes
        const existing = cleanLeadsMap.get(key);
        if ((lead.notes || '').length > (existing.notes || '').length) {
            cleanLeadsMap.set(key, { ...existing, ...lead, id: existing.id });
        }
    }
});

let cleanLeads = Array.from(cleanLeadsMap.values());
// Ensure descending clean unique integer IDs
cleanLeads.sort((a, b) => (Number(b.id) || 0) - (Number(a.id) || 0));
// Re-sequence IDs so they are continuous 1..N
const totalLeads = cleanLeads.length;
cleanLeads.forEach((l, idx) => {
    l.id = totalLeads - idx;
    delete l._tempClientId;
});

writeToAllVaults('leads.json', cleanLeads);

// 2. Clean Inquiries
const rawInqs = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'inquiries.json'), 'utf8'));
const cleanInqsMap = new Map();

rawInqs.forEach(inq => {
    const phone = (inq.phone || '').replace(/\D/g, '').slice(-10);
    const email = (inq.email || '').trim().toLowerCase();
    // Use candidate identity as the key
    const key = phone || email || `id_${inq.id}`;

    if (!cleanInqsMap.has(key)) {
        cleanInqsMap.set(key, inq);
    } else {
        const existing = cleanInqsMap.get(key);
        const isExistingAuto = (existing.subject || '').includes('⚡ New Admission Lead:');
        const isCurrentAuto = (inq.subject || '').includes('⚡ New Admission Lead:');

        // Prefer rich user-submitted inquiry over generic auto-generated
        if (isExistingAuto && !isCurrentAuto) {
            cleanInqsMap.set(key, { ...inq, id: existing.id });
        } else if (!isExistingAuto && isCurrentAuto) {
            // Keep existing rich inquiry
        } else if ((inq.message || '').length > (existing.message || '').length) {
            cleanInqsMap.set(key, { ...existing, ...inq, id: existing.id });
        }
    }
});

let cleanInquiries = Array.from(cleanInqsMap.values());
cleanInquiries.sort((a, b) => (Number(b.id) || 0) - (Number(a.id) || 0));
const totalInqs = cleanInquiries.length;
cleanInquiries.forEach((iq, idx) => {
    iq.id = totalInqs - idx;
    delete iq._tempClientId;
});

writeToAllVaults('inquiries.json', cleanInquiries);

console.log('\n--- LEADS AFTER DEDUPLICATION ---');
cleanLeads.forEach(l => console.log(`#${l.id}: ${l.name} | ${l.phone || l.email} | ${l.course} | Source: ${l.source}`));

console.log('\n--- INQUIRIES AFTER DEDUPLICATION ---');
cleanInquiries.forEach(i => console.log(`#${i.id}: [${i.status.toUpperCase()}] ${i.name} | ${i.subject}`));
