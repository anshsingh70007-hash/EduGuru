const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const url = require('url');
const tls = require('tls');
const os = require('os');

function extractYouTubeId(urlStr) {
    if (!urlStr) return null;
    urlStr = String(urlStr).trim();
    if (/^[\w-]{11}$/.test(urlStr)) return urlStr;
    const match = urlStr.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|shorts\/|live\/|user\/[^\/]+\/.*[?&]v=))([\w-]{11})/i);
    return match ? match[1] : null;
}

function slugify(text) {
    if (!text) return '';
    return String(text)
        .toLowerCase()
        .trim()
        .replace(/&/g, 'and')
        .replace(/[\(\)\/,\.]+/g, ' ')
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/[\s-]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

const PORT = process.env.PORT || 3000;
const ROOT_DIR = __dirname;
const DATA_DIR = process.env.DATA_DIR || path.join(ROOT_DIR, 'data');
const BACKUPS_DIR = path.join(ROOT_DIR, 'backups');
const VAULT_LOCAL_DIR = path.join(BACKUPS_DIR, 'vault');
const SNAPSHOTS_DIR = path.join(BACKUPS_DIR, 'snapshots');
// External immutable vault located OUTSIDE project directory (e.g. C:\Users\<Username>\.educationistguru_vault)
const VAULT_EXTERNAL_DIR = process.env.DATA_VAULT_DIR || path.join(os.homedir(), '.educationistguru_vault');
const UPLOADS_DIR = path.join(ROOT_DIR, 'images', 'uploads');
const VAULT_UPLOADS_DIR = path.join(VAULT_EXTERNAL_DIR, 'uploads');

[DATA_DIR, BACKUPS_DIR, VAULT_LOCAL_DIR, SNAPSHOTS_DIR, VAULT_EXTERNAL_DIR, UPLOADS_DIR, VAULT_UPLOADS_DIR].forEach(dir => {
    if (!fs.existsSync(dir)) {
        try { fs.mkdirSync(dir, { recursive: true }); } catch (e) {}
    }
});

const ALL_COLLECTION_FILES = [
    'leads.json', 'applications.json', 'enrollments.json', 'fees.json',
    'inquiries.json', 'subscribers.json', 'users.json', 'roles.json',
    'settings.json', 'courses.json', 'colleges.json', 'universities.json',
    'blogs.json', 'videos.json', 'site_menu.json'
];

const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.webp': 'image/webp',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf',
    '.eot': 'application/vnd.ms-fontobject',
    '.mp4': 'video/mp4',
    '.pdf': 'application/pdf'
};

// Safe Atomic File Write (Writes to tmp file first, then renames to prevent half-written corruption)
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
        console.error(`[VAULT] Failed atomic write to ${targetPath}:`, e.message);
        return false;
    }
}

// Multi-Tier Data Persistence Helper
function writeDataFile(filename, data) {
    const primaryPath = path.join(DATA_DIR, filename);
    const localVaultPath = path.join(VAULT_LOCAL_DIR, filename);
    const extVaultPath = path.join(VAULT_EXTERNAL_DIR, filename);

    // 1. Primary write (Atomic)
    const success = safeWriteJsonAtomic(primaryPath, data);

    // 2. Local Vault Mirror (Atomic)
    safeWriteJsonAtomic(localVaultPath, data);

    // 3. External Immutable Vault Mirror (Atomic)
    safeWriteJsonAtomic(extVaultPath, data);

    return success;
}

// Read Data with Multi-Tier Fallback Recovery
function readDataFile(filename, defaultVal = []) {
    const primaryPath = path.join(DATA_DIR, filename);

    // 1. Read from Primary
    try {
        if (fs.existsSync(primaryPath)) {
            const raw = fs.readFileSync(primaryPath, 'utf8').trim();
            if (raw) return JSON.parse(raw);
        }
    } catch (e) {
        console.warn(`[VAULT] Error reading primary ${filename}: ${e.message}. Attempting vault recovery...`);
    }

    // 2. Fallback to Local Vault
    try {
        const lv = path.join(VAULT_LOCAL_DIR, filename);
        if (fs.existsSync(lv)) {
            const raw = fs.readFileSync(lv, 'utf8').trim();
            if (raw) {
                const parsed = JSON.parse(raw);
                console.log(`[RECOVERY] Recovered ${filename} from local vault.`);
                safeWriteJsonAtomic(primaryPath, parsed); // Auto-heal primary
                return parsed;
            }
        }
    } catch (_) {}

    // 3. Fallback to External Safe Vault
    try {
        const ev = path.join(VAULT_EXTERNAL_DIR, filename);
        if (fs.existsSync(ev)) {
            const raw = fs.readFileSync(ev, 'utf8').trim();
            if (raw) {
                const parsed = JSON.parse(raw);
                console.log(`[RECOVERY] Recovered ${filename} from external immutable vault.`);
                safeWriteJsonAtomic(primaryPath, parsed); // Auto-heal primary
                return parsed;
            }
        }
    } catch (_) {}

    return defaultVal;
}

// Create Timestamped Rolling Snapshot
function createSnapshot(reason = 'manual') {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const snapshotName = `snapshot-${timestamp}-${reason}.json`;
    const snapshotPath = path.join(SNAPSHOTS_DIR, snapshotName);

    const bundle = {
        version: '1.0',
        timestamp: new Date().toISOString(),
        reason,
        collections: {}
    };

    ALL_COLLECTION_FILES.forEach(f => {
        const key = f.replace('.json', '');
        bundle.collections[key] = readDataFile(f, []);
    });

    safeWriteJsonAtomic(snapshotPath, bundle);

    // Prune snapshots keeping latest 30
    try {
        const files = fs.readdirSync(SNAPSHOTS_DIR)
            .filter(f => f.startsWith('snapshot-') && f.endsWith('.json'))
            .map(f => ({ name: f, time: fs.statSync(path.join(SNAPSHOTS_DIR, f)).mtime.getTime() }))
            .sort((a, b) => b.time - a.time);

        if (files.length > 30) {
            files.slice(30).forEach(old => {
                try { fs.unlinkSync(path.join(SNAPSHOTS_DIR, old.name)); } catch (_) {}
            });
        }
    } catch (_) {}

    return { name: snapshotName, path: snapshotPath, timestamp: bundle.timestamp };
}

// Self-Heal & Vault Sync on Server Boot (Non-Destructive Intelligent Union-Merge)
function selfHealAndSyncVaultOnBoot() {
    console.log(`[VAULT] Initializing Disaster Recovery Vault at: ${VAULT_EXTERNAL_DIR}`);

    // 1. Immediate pre-boot safety snapshot
    try {
        createSnapshot('boot_safety_checkpoint');
    } catch (_) {}

    try {
        ALL_COLLECTION_FILES.forEach(file => {
        const primaryPath = path.join(DATA_DIR, file);
        const localVaultPath = path.join(VAULT_LOCAL_DIR, file);
        const extVaultPath = path.join(VAULT_EXTERNAL_DIR, file);

        const readJsonSafe = (p) => {
            if (!fs.existsSync(p)) return null;
            try {
                const raw = fs.readFileSync(p, 'utf8').trim();
                return raw ? JSON.parse(raw) : null;
            } catch (_) {
                return null;
            }
        };

        const primaryData = readJsonSafe(primaryPath);
        const localData = readJsonSafe(localVaultPath);
        const extData = readJsonSafe(extVaultPath);

        // For Array Collections (leads, applications, enrollments, colleges, universities, courses, blogs, videos, fees, inquiries, subscribers, users, roles)
        if (file !== 'settings.json') {
            const mergedMap = new Map();

            // Helper to generate natural composite keys so different student records never collide on boot
            const getItemKey = (item) => {
                if (!item) return String(Math.random());
                if (file === 'courses.json' || file === 'colleges.json' || file === 'universities.json' || file === 'blogs.json' || file === 'videos.json') {
                    return String(item.slug || item.name || item.title || item.id);
                }
                if (file === 'subscribers.json' || file === 'users.json') {
                    return String(item.email || item.id).toLowerCase();
                }
                if (file === 'roles.json') {
                    return String(item.name || item.id).toLowerCase();
                }
                // For leads, inquiries, applications, enrollments, fees:
                const phone = (item.phone || '').replace(/\D/g, '').slice(-10);
                const email = (item.email || '').toLowerCase().trim();
                const name = (item.name || item.studentName || '').toLowerCase().trim();
                const date = (item.date || item.dateAdded || '').slice(0, 10);
                const sub = (item.subject || item.course || '').slice(0, 30);

                if (file === 'leads.json' || file === 'inquiries.json') {
                    if (phone) return `${phone}_${date}`;
                    if (email) return `${email}_${date}`;
                    if (name) return `${name}_${date}`;
                }

                if (phone) return `${phone}_${sub}_${date}`;
                if (email) return `${email}_${sub}_${date}`;
                if (name) return `${name}_${sub}_${date}`;
                return String(item.id || Math.random());
            };

            // 1. First prioritize External Vault items (live production state on Hostinger)
            if (Array.isArray(extData)) {
                extData.forEach(item => {
                    mergedMap.set(getItemKey(item), item);
                });
            }

            // 2. Add Local Vault items
            if (Array.isArray(localData)) {
                localData.forEach(item => {
                    const k = getItemKey(item);
                    if (!mergedMap.has(k)) {
                        mergedMap.set(k, item);
                    }
                });
            }

            // 3. Add Primary items (e.g. newly added courses/colleges in an uploaded update)
            if (Array.isArray(primaryData)) {
                primaryData.forEach(item => {
                    const k = getItemKey(item);
                    const existing = mergedMap.get(k);
                    if (existing) {
                        if (file === 'courses.json' || file === 'colleges.json' || file === 'universities.json' || file === 'blogs.json' || file === 'videos.json') {
                            mergedMap.set(k, { ...existing, ...item });
                        }
                    } else {
                        mergedMap.set(k, item);
                    }
                });
            }

            const mergedList = Array.from(mergedMap.values());
            if (mergedList.length > 0) {
                // Ensure strictly unique integer IDs for entities with numeric IDs
                const hasNumericIds = mergedList.some(it => typeof it.id === 'number');
                if (hasNumericIds) {
                    const seenIds = new Set();
                    let maxNumericId = mergedList.reduce((max, it) => typeof it.id === 'number' && it.id > max ? it.id : max, 0);
                    mergedList.forEach(it => {
                        if (typeof it.id === 'number') {
                            if (seenIds.has(it.id)) {
                                maxNumericId++;
                                it.id = maxNumericId;
                            } else {
                                seenIds.add(it.id);
                            }
                        }
                    });
                }
                safeWriteJsonAtomic(primaryPath, mergedList);
                safeWriteJsonAtomic(localVaultPath, mergedList);
                safeWriteJsonAtomic(extVaultPath, mergedList);
            }
        } else {
            // For settings.json (Object)
            const mergedSettings = {
                ...(extData || {}),
                ...(localData || {}),
                ...(primaryData || {})
            };
            safeWriteJsonAtomic(primaryPath, mergedSettings);
            safeWriteJsonAtomic(localVaultPath, mergedSettings);
            safeWriteJsonAtomic(extVaultPath, mergedSettings);
        }
    });

        // Mirror Uploads between images/uploads and VAULT_EXTERNAL_DIR/uploads
        try {
            if (fs.existsSync(UPLOADS_DIR) && fs.existsSync(VAULT_UPLOADS_DIR)) {
                const localUploads = fs.readdirSync(UPLOADS_DIR);
                const vaultUploads = fs.readdirSync(VAULT_UPLOADS_DIR);

                localUploads.forEach(f => {
                    const src = path.join(UPLOADS_DIR, f);
                    const dest = path.join(VAULT_UPLOADS_DIR, f);
                    if (!fs.existsSync(dest) && fs.statSync(src).isFile()) {
                        fs.copyFileSync(src, dest);
                    }
                });

                vaultUploads.forEach(f => {
                    const src = path.join(VAULT_UPLOADS_DIR, f);
                    const dest = path.join(UPLOADS_DIR, f);
                    if (!fs.existsSync(dest) && fs.statSync(src).isFile()) {
                        fs.copyFileSync(src, dest);
                        console.log(`[RECOVERY] Restored uploaded image ${f} from external vault.`);
                    }
                });
            }
        } catch (e) {
            console.warn('[VAULT] Uploads mirror notice:', e.message);
        }

        console.log('[VAULT] Non-destructive multi-tier boot sync completed successfully.');
    } catch (e) {
        console.error('[VAULT] Boot sync exception:', e.message);
    }
}

// 6-Hour Automated Rolling Database Snapshot
setInterval(() => {
    try {
        createSnapshot('auto_interval_6h');
        console.log('[VAULT] Automated 6-hour database snapshot captured.');
    } catch (e) {
        console.error('[VAULT] Failed automated snapshot:', e.message);
    }
}, 6 * 60 * 60 * 1000);

// ================= IMAP HELPER =================
class GmailImapClient {
    constructor(email, password) {
        this.email = email;
        this.password = password.replace(/\s+/g, '');
        this.socket = null;
        this.tagCount = 0;
    }

    getTag() {
        this.tagCount++;
        return `TAG${this.tagCount}`;
    }

    connect() {
        return new Promise((resolve, reject) => {
            this.socket = tls.connect(993, 'imap.gmail.com', { rejectUnauthorized: false });
            let banner = '';
            const onData = (data) => {
                banner += data.toString();
                if (banner.includes('* OK')) {
                    this.socket.off('data', onData);
                    resolve();
                }
            };
            this.socket.on('data', onData);
            this.socket.on('error', reject);
            setTimeout(() => reject(new Error('Connection to Gmail IMAP timed out')), 10000);
        });
    }

    sendCommand(cmd) {
        return new Promise((resolve, reject) => {
            const tag = this.getTag();
            let fullResponse = '';
            const onData = (data) => {
                const str = data.toString('utf8');
                fullResponse += str;
                if (fullResponse.includes(`${tag} OK`) || fullResponse.includes(`${tag} NO`) || fullResponse.includes(`${tag} BAD`)) {
                    this.socket.off('data', onData);
                    resolve({ tag, raw: fullResponse, isOk: fullResponse.includes(`${tag} OK`) });
                }
            };
            this.socket.on('data', onData);
            this.socket.write(`${tag} ${cmd}\r\n`);
            setTimeout(() => {
                this.socket.off('data', onData);
                reject(new Error(`Command ${cmd} timed out`));
            }, 20000);
        });
    }

    async authenticate() {
        const res = await this.sendCommand(`LOGIN "${this.email}" "${this.password}"`);
        if (!res.isOk) {
            let msg = 'Authentication failed. Please check your Gmail address and 16-character App Password.';
            if (res.raw.includes('Application-specific password required') || res.raw.includes('Invalid credentials')) {
                msg = 'Invalid credentials. Please make sure you use a Google App Password from https://myaccount.google.com/apppasswords, not your regular Google password.';
            }
            throw new Error(msg);
        }
        return true;
    }

    async selectInbox() {
        const res = await this.sendCommand('SELECT "INBOX"');
        if (!res.isOk) throw new Error('Failed to open Gmail INBOX');
        const existsMatch = res.raw.match(/\*\s+(\d+)\s+EXISTS/i);
        const total = existsMatch ? parseInt(existsMatch[1]) : 0;
        return { total };
    }

    async fetchRecentEmails(count = 25, searchKeyword = '') {
        const inboxInfo = await this.selectInbox();
        if (inboxInfo.total === 0) return [];

        let msgSeqNumbers = [];
        if (searchKeyword && searchKeyword.trim()) {
            const cleanKey = searchKeyword.trim().replace(/"/g, '');
            const searchRes = await this.sendCommand(`SEARCH TEXT "${cleanKey}"`);
            const searchMatch = searchRes.raw.match(/\*\s+SEARCH\s+(.*)/i);
            if (searchMatch && searchMatch[1].trim()) {
                msgSeqNumbers = searchMatch[1].trim().split(/\s+/).map(Number).filter(Boolean);
            }
        } else {
            const start = Math.max(1, inboxInfo.total - count + 1);
            const end = inboxInfo.total;
            for (let i = end; i >= start; i--) {
                msgSeqNumbers.push(i);
            }
        }

        if (msgSeqNumbers.length === 0) return [];

        const toFetch = msgSeqNumbers.slice(-count).reverse();
        const emails = [];

        for (const seq of toFetch) {
            try {
                const fetchRes = await this.sendCommand(`FETCH ${seq} (BODY.PEEK[HEADER.FIELDS (FROM SUBJECT DATE)] BODY.PEEK[TEXT]<0.400>)`);
                const parsed = this.parseEmailHeader(fetchRes.raw, seq);
                if (parsed) emails.push(parsed);
            } catch (e) {
                console.error(`Error fetching message ${seq}:`, e.message);
            }
        }

        return emails;
    }

    parseEmailHeader(raw, seqId) {
        const fromMatch = raw.match(/From:\s*(.+?)(?:\r?\n(?![ \t]))/is);
        const subjectMatch = raw.match(/Subject:\s*(.+?)(?:\r?\n(?![ \t]))/is);
        const dateMatch = raw.match(/Date:\s*(.+?)(?:\r?\n(?![ \t]))/is);
        const snippetMatch = raw.match(/BODY\[TEXT\]<0> \{(\d+)\}\r?\n([\s\S]*)/i);

        const rawFrom = fromMatch ? fromMatch[1].replace(/\r?\n\s+/g, ' ').trim() : 'Unknown';
        const rawSubject = subjectMatch ? this.decodeMime(subjectMatch[1].replace(/\r?\n\s+/g, ' ').trim()) : '(no subject)';
        const rawDate = dateMatch ? dateMatch[1].trim() : '';
        let snippet = snippetMatch ? snippetMatch[2].substring(0, 160).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() : '';

        let name = rawFrom;
        let email = rawFrom;
        const emailExtract = rawFrom.match(/<([^>]+)>/);
        if (emailExtract) {
            email = emailExtract[1];
            name = rawFrom.replace(emailExtract[0], '').replace(/["']/g, '').trim() || email.split('@')[0];
        } else {
            const bareEmail = rawFrom.match(/[\w.-]+@[\w.-]+\.\w+/);
            if (bareEmail) email = bareEmail[0];
        }

        name = this.decodeMime(name);

        let formattedDate = '';
        try {
            if (rawDate) {
                const d = new Date(rawDate);
                if (!isNaN(d.getTime())) {
                    formattedDate = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
                }
            }
        } catch (e) {
            formattedDate = rawDate;
        }

        return {
            id: 'imap_' + seqId,
            name: name || email.split('@')[0],
            email: email,
            subject: rawSubject,
            date: formattedDate || 'Recent',
            snippet: snippet || rawSubject
        };
    }

    decodeMime(str) {
        if (!str) return '';
        return str.replace(/=\?([^?]+)\?([BQ])\?([^?]+)\?=/gi, (match, charset, encoding, text) => {
            try {
                if (encoding.toUpperCase() === 'B') {
                    return Buffer.from(text, 'base64').toString('utf8');
                } else if (encoding.toUpperCase() === 'Q') {
                    return text.replace(/_/g, ' ').replace(/=([A-Fa-f0-9]{2})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
                }
            } catch (e) {}
            return match;
        });
    }

    async close() {
        if (this.socket) {
            try {
                this.socket.write('TAG_BYE LOGOUT\r\n');
                this.socket.end();
            } catch (e) {}
        }
    }
}

// ================= HTTP SERVER =================
const server = http.createServer(async (req, res) => {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, X-HTTP-Method-Override, Cache-Control, Pragma');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    const parsedUrl = url.parse(req.url, true);
    let pathname = parsedUrl.pathname || '/';

    // HTTP Method Override support (Header X-HTTP-Method-Override or query ?_method or ?action=delete/update)
    if (req.headers['x-http-method-override']) {
        req.method = req.headers['x-http-method-override'].toUpperCase().trim();
    } else if (parsedUrl.query && parsedUrl.query._method) {
        req.method = String(parsedUrl.query._method).toUpperCase().trim();
    } else if (parsedUrl.query && parsedUrl.query.action && ['delete', 'destroy', 'remove'].includes(parsedUrl.query.action.toLowerCase())) {
        req.method = 'DELETE';
    } else if (parsedUrl.query && parsedUrl.query.action && ['update', 'edit', 'put'].includes(parsedUrl.query.action.toLowerCase())) {
        req.method = 'PUT';
    }

    // Helper: read JSON body (supports custom size limit, default 25MB for uploads)
    const readJsonBody = (maxSize = 25e6) => new Promise((resolve, reject) => {
        let body = '';
        req.on('data', chunk => {
            body += chunk;
            if (body.length > maxSize) req.destroy();
        });
        req.on('end', () => {
            try { 
                const parsed = body ? JSON.parse(body) : {};
                if (parsed && parsed._method && req.method === 'POST') {
                    req.method = String(parsed._method).toUpperCase().trim();
                }
                resolve(parsed); 
            }
            catch (e) { reject(new Error('Invalid JSON')); }
        });
    });

    // Helper: send JSON response
    const sendJson = (statusCode, data) => {
        res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify(data));
    };

    // Helper: send 301 Permanent Redirect
    const redirect301 = (location) => {
        res.writeHead(301, { 'Location': location, 'Cache-Control': 'no-cache' });
        res.end();
    };

    // Helper: serve an HTML file
    const serveHtmlFile = (fileName) => {
        const filePath = path.join(ROOT_DIR, fileName);
        if (fs.existsSync(filePath)) {
            res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-cache' });
            fs.createReadStream(filePath).pipe(res);
        } else {
            serve404();
        }
    };

    // Helper: serve 404 page
    const serve404 = () => {
        const errPath = path.join(ROOT_DIR, 'error-404.html');
        if (fs.existsSync(errPath)) {
            res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
            fs.createReadStream(errPath).pipe(res);
        } else {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('404 Not Found');
        }
    };

    // ================= 1. LEGACY .HTML 301 REDIRECTS =================
    // Special handling for legacy course details: courses-details.html?id=106 or ?slug=...
    if (pathname === '/courses-details.html' || pathname === '/courses-details') {
        const queryId = parsedUrl.query.id;
        const querySlug = parsedUrl.query.slug;
        const courses = readDataFile('courses.json', []);
        let targetCourse = null;
        if (querySlug) {
            targetCourse = courses.find(c => c.slug === querySlug);
        } else if (queryId) {
            targetCourse = courses.find(c => String(c.id) === String(queryId));
        }
        if (targetCourse && targetCourse.slug) {
            return redirect301(`/courses/${targetCourse.slug}`);
        }
        return redirect301('/courses');
    }

    // Static pages map
    const staticPageMap = {
        '/index.html': '/',
        '/about.html': '/about',
        '/courses.html': '/courses',
        '/colleges.html': '/colleges',
        '/universities.html': '/universities',
        '/blog.html': '/blog',
        '/contact.html': '/contact',
        '/edit.html': '/edit',
        '/youtube.html': '/youtube',
        '/gallery.html': '/gallery',
        '/events.html': '/events'
    };

    if (staticPageMap[pathname]) {
        const search = parsedUrl.search || '';
        return redirect301(staticPageMap[pathname] + search);
    }

    // Redirect any general *.html document requests to extensionless path (excluding API, CRM, and assets)
    if (pathname.endsWith('.html') && !pathname.startsWith('/api/') && !pathname.toLowerCase().startsWith('/crm')) {
        const cleanPath = pathname.slice(0, -5);
        const search = parsedUrl.search || '';
        return redirect301((cleanPath === '/index' ? '/' : cleanPath) + search);
    }

    // ================= 2. GMAIL API ROUTES =================
    if (pathname === '/api/gmail/connect' && req.method === 'POST') {
        try {
            const { email, appPassword } = await readJsonBody();
            if (!email || !appPassword) {
                return sendJson(400, { success: false, error: 'Email and App Password are required.' });
            }
            const client = new GmailImapClient(email, appPassword);
            await client.connect();
            await client.authenticate();
            const inbox = await client.selectInbox();
            await client.close();

            return sendJson(200, {
                success: true,
                user: email,
                totalMessages: inbox.total,
                message: `Successfully connected to ${email}`
            });
        } catch (err) {
            return sendJson(400, { success: false, error: err.message || 'Connection failed' });
        }
    }

    if (pathname === '/api/gmail/messages' && req.method === 'POST') {
        try {
            const { email, appPassword, query, count } = await readJsonBody();
            if (!email || !appPassword) {
                return sendJson(400, { success: false, error: 'Credentials missing.' });
            }
            const client = new GmailImapClient(email, appPassword);
            await client.connect();
            await client.authenticate();
            const emails = await client.fetchRecentEmails(count || 20, query || '');
            await client.close();

            return sendJson(200, {
                success: true,
                emails: emails,
                count: emails.length
            });
        } catch (err) {
            return sendJson(400, { success: false, error: err.message || 'Failed to fetch messages' });
        }
    }

    // ================= 3. CONTENT API: UNIFIED HYDRATION & COLLECTIONS =================
    // GET /api/content/all or GET /api/content - Single roundtrip authoritative hydration (Just like /api/crm/all)
    if ((pathname === '/api/content/all' || pathname === '/api/content') && req.method === 'GET') {
        const allContent = {
            courses: readDataFile('courses.json', []),
            colleges: readDataFile('colleges.json', []),
            universities: readDataFile('universities.json', []),
            blogs: readDataFile('blogs.json', []),
            videos: readDataFile('videos.json', []),
            menu: readDataFile('site_menu.json', {})
        };
        return sendJson(200, { success: true, data: allContent, timestamp: new Date().toISOString() });
    }

    // GET /api/content/menu
    if (pathname === '/api/content/menu' && req.method === 'GET') {
        const menu = readDataFile('site_menu.json', {});
        return sendJson(200, { success: true, ...menu, data: menu });
    }

    // POST / PUT /api/content/menu
    if (pathname === '/api/content/menu' && (req.method === 'POST' || req.method === 'PUT')) {
        try {
            const body = await readJsonBody();
            let current = readDataFile('site_menu.json', { announcement: {}, navItems: [] });

            // Merge announcement
            if (body.announcement) {
                current.announcement = { ...current.announcement, ...body.announcement };
            }

            // Merge or replace navItems safely
            if (Array.isArray(body.navItems) && (body.navItems.length > 0 || body.allowEmptyNavItems)) {
                current.navItems = body.navItems;
            } else if (body.navItem) {
                if (!Array.isArray(current.navItems)) current.navItems = [];
                const idx = current.navItems.findIndex(n => n.id === body.navItem.id);
                if (idx >= 0) {
                    current.navItems[idx] = { ...current.navItems[idx], ...body.navItem };
                } else {
                    current.navItems.push(body.navItem);
                }
            }

            if (body.config) {
                current.config = { ...current.config, ...body.config };
            }
            if (!current.config) current.config = {};
            current.config.updatedAt = new Date().toISOString();

            writeDataFile('site_menu.json', current);
            return sendJson(200, { success: true, data: current, menu: current, message: 'Website navigation and headers updated successfully' });
        } catch (err) {
            return sendJson(400, { success: false, error: err.message || 'Failed to update menu' });
        }
    }

    // DELETE /api/content/menu/items/:id
    const menuItemMatch = pathname.match(/^\/api\/content\/menu\/items\/([^\/]+)$/);
    if (menuItemMatch && req.method === 'DELETE') {
        try {
            const itemId = decodeURIComponent(menuItemMatch[1]);
            let current = readDataFile('site_menu.json', { announcement: {}, navItems: [] });
            if (Array.isArray(current.navItems)) {
                current.navItems = current.navItems.filter(n => n.id !== itemId);
                if (!current.config) current.config = {};
                current.config.updatedAt = new Date().toISOString();
                writeDataFile('site_menu.json', current);
            }
            return sendJson(200, { success: true, message: 'Navigation header item removed successfully' });
        } catch (err) {
            return sendJson(500, { success: false, error: err.message });
        }
    }

    // GET /api/content/courses
    if (pathname === '/api/content/courses' && req.method === 'GET') {
        const courses = readDataFile('courses.json', []);
        return sendJson(200, { success: true, courses });
    }

    // POST /api/content/courses
    if (pathname === '/api/content/courses' && req.method === 'POST') {
        try {
            const body = await readJsonBody();
            if (!body.name) return sendJson(400, { success: false, error: 'Course name is required' });
            const courses = readDataFile('courses.json', []);
            const newId = courses.length > 0 ? Math.max(...courses.map(c => Number(c.id) || 0)) + 1 : 1;
            
            // Generate unique slug
            const baseSlug = slugify(body.name);
            let candidateSlug = baseSlug || `course-${newId}`;
            let counter = 2;
            while (courses.some(c => c.slug === candidateSlug)) {
                candidateSlug = `${baseSlug}-${counter}`;
                counter++;
            }

            const newCourse = {
                id: newId,
                slug: candidateSlug,
                name: body.name.trim(),
                faculty: body.faculty || 'Faculty of Commerce & Management',
                duration: body.duration || '3 Years',
                eligibility: body.eligibility || '10+2 from recognized board',
                mode: body.mode || 'Online / Regular / Distance',
                image: body.image || 'images/courses/1.jpg',
                specializations: body.specializations || '',
                description: body.description || (body.overviewContent || `${body.name} is an accredited higher education degree program.`),
                overviewContent: body.overviewContent || body.description || '',
                curriculum: Array.isArray(body.curriculum) ? body.curriculum : (body.curriculum ? String(body.curriculum).split('\n').map(s => s.trim()).filter(Boolean) : ['Foundations & Core Principles', 'Specialization Modules', 'Practical Capstone Project']),
                fee: body.fee || '₹40,000 / year',
                metaDescription: body.metaDescription || '',
                tags: Array.isArray(body.tags) ? body.tags : (body.tags ? String(body.tags).split(',').map(s => s.trim()).filter(Boolean) : []),
                categories: Array.isArray(body.categories) ? body.categories : (body.categories ? String(body.categories).split(',').map(s => s.trim()).filter(Boolean) : [body.faculty || 'General']),
                keywords: Array.isArray(body.keywords) ? body.keywords : (body.keywords ? String(body.keywords).split(',').map(s => s.trim()).filter(Boolean) : []),
                galleryImages: Array.isArray(body.galleryImages) ? body.galleryImages : [],
                isInitial: false,
                isNew: true,
                dateAdded: new Date().toISOString()
            };
            courses.unshift(newCourse);
            writeDataFile('courses.json', courses);
            return sendJson(201, { success: true, course: newCourse, message: 'Course created successfully' });
        } catch (e) {
            return sendJson(500, { success: false, error: e.message });
        }
    }

    // GET /api/content/courses/:slug_or_id
    const courseDetailMatch = pathname.match(/^\/api\/content\/courses\/([^\/]+)$/);
    if (courseDetailMatch && req.method === 'GET') {
        const param = decodeURIComponent(courseDetailMatch[1]);
        const courses = readDataFile('courses.json', []);
        const found = courses.find(c => c.slug === param || String(c.id) === param);
        if (found) {
            return sendJson(200, { success: true, course: found });
        }
        return sendJson(404, { success: false, error: 'Course not found' });
    }

    // PUT /api/content/courses/:id
    if (courseDetailMatch && (req.method === 'PUT' || req.method === 'POST')) {
        try {
            const param = decodeURIComponent(courseDetailMatch[1]);
            const body = await readJsonBody();
            const courses = readDataFile('courses.json', []);
            const idx = courses.findIndex(c => String(c.id) === param || c.slug === param);
            if (idx === -1) return sendJson(404, { success: false, error: 'Course not found' });
            
            const updated = { ...courses[idx], ...body, id: courses[idx].id };
            if (body.name && body.name !== courses[idx].name && !body.slug) {
                updated.slug = slugify(body.name);
            }
            updated.updatedAt = new Date().toISOString();
            courses[idx] = updated;
            writeDataFile('courses.json', courses);
            return sendJson(200, { success: true, course: updated, message: 'Course updated successfully' });
        } catch (e) {
            return sendJson(500, { success: false, error: e.message });
        }
    }

    // DELETE /api/content/courses/:id
    if (courseDetailMatch && req.method === 'DELETE') {
        const param = decodeURIComponent(courseDetailMatch[1]);
        let courses = readDataFile('courses.json', []);
        courses = courses.filter(c => String(c.id) !== param && c.slug !== param);
        writeDataFile('courses.json', courses);
        return sendJson(200, { success: true, message: 'Course deleted successfully' });
    }

    // ================= 4. CONTENT API: COLLEGES =================
    // GET /api/content/colleges
    if (pathname === '/api/content/colleges' && req.method === 'GET') {
        const colleges = readDataFile('colleges.json', []);
        return sendJson(200, { success: true, colleges });
    }

    // POST /api/content/colleges
    // POST /api/content/colleges
    if (pathname === '/api/content/colleges' && req.method === 'POST') {
        try {
            const body = await readJsonBody();
            if (!body.name) return sendJson(400, { success: false, error: 'College name is required' });
            const colleges = readDataFile('colleges.json', []);
            const newId = colleges.length > 0 ? Math.max(...colleges.map(c => Number(c.id) || 0)) + 1 : 1;
            
            const baseSlug = slugify(body.name);
            let candidateSlug = baseSlug || `college-${newId}`;
            let counter = 2;
            while (colleges.some(c => c.slug === candidateSlug)) {
                candidateSlug = `${baseSlug}-${counter}`;
                counter++;
            }

            // Normalize Multi-Categories
            let categoriesArr = [];
            if (Array.isArray(body.categories)) {
                categoriesArr = body.categories.map(s => String(s).trim()).filter(Boolean);
            } else if (body.category) {
                categoriesArr = String(body.category).split(',').map(s => s.trim()).filter(Boolean);
            }
            const categoryStr = categoriesArr.length > 0 ? categoriesArr.join(', ') : (body.category || 'Constituent College');

            // Normalize Multi-Courses
            let coursesArr = [];
            if (Array.isArray(body.courses)) {
                coursesArr = body.courses.map(s => String(s).trim()).filter(Boolean);
            } else if (body.courses) {
                coursesArr = String(body.courses).split(',').map(s => s.trim()).filter(Boolean);
            }
            const coursesStr = coursesArr.length > 0 ? coursesArr.join(', ') : (body.courses || 'B.Tech, MBA, BCA');

            const accreditationStr = Array.isArray(body.accreditation) ? body.accreditation.join(', ') : (body.accreditation || 'PCI Approved, AICTE, NAAC A+');
            const isFeaturedBool = Boolean(body.featured !== undefined ? body.featured : body.isFeatured);

            const newCollege = {
                id: newId,
                slug: candidateSlug,
                name: body.name.trim(),
                metaDescription: body.metaDescription || '',
                tags: Array.isArray(body.tags) ? body.tags : (body.tags ? String(body.tags).split(',').map(s=>s.trim()).filter(Boolean) : []),
                keywords: Array.isArray(body.keywords) ? body.keywords : (body.keywords ? String(body.keywords).split(',').map(s=>s.trim()).filter(Boolean) : []),
                facilities: Array.isArray(body.facilities) ? body.facilities : (body.facilities ? String(body.facilities).split(',').map(s=>s.trim()).filter(Boolean) : []),
                category: categoryStr,
                categories: categoriesArr,
                affiliation: body.affiliation || 'Approved by State University / AICTE',
                location: body.location || 'New Delhi, India',
                established: body.established || '2008',
                accreditation: accreditationStr,
                fee: body.fee || '₹50,000 - ₹95,000 / year',
                image: body.image || 'images/courses/1.jpg',
                rating: Number(body.rating) || 4.8,
                courses: coursesStr,
                coursesList: coursesArr,
                description: body.description || `${body.name} offers premier accredited higher education programs.`,
                isFeatured: isFeaturedBool,
                featured: isFeaturedBool,
                dateAdded: new Date().toISOString()
            };
            colleges.unshift(newCollege);
            writeDataFile('colleges.json', colleges);
            return sendJson(201, { success: true, college: newCollege, message: 'College added successfully' });
        } catch (e) {
            return sendJson(500, { success: false, error: e.message });
        }
    }

    // GET /api/content/colleges/:slug_or_id
    const collegeDetailMatch = pathname.match(/^\/api\/content\/colleges\/([^\/]+)$/);
    if (collegeDetailMatch && req.method === 'GET') {
        const param = decodeURIComponent(collegeDetailMatch[1]);
        const colleges = readDataFile('colleges.json', []);
        const found = colleges.find(c => c.slug === param || String(c.id) === param);
        if (found) return sendJson(200, { success: true, college: found });
        return sendJson(404, { success: false, error: 'College not found' });
    }

    // PUT /api/content/colleges/:id
    if (collegeDetailMatch && (req.method === 'PUT' || req.method === 'POST')) {
        try {
            const param = decodeURIComponent(collegeDetailMatch[1]);
            const body = await readJsonBody();
            const colleges = readDataFile('colleges.json', []);
            const idx = colleges.findIndex(c => String(c.id) === param || c.slug === param);
            if (idx === -1) return sendJson(404, { success: false, error: 'College not found' });
            
            const isFeaturedBool = Boolean(body.featured !== undefined ? body.featured : (body.isFeatured !== undefined ? body.isFeatured : colleges[idx].isFeatured));
            
            // Normalize categories
            let categoriesArr = colleges[idx].categories || [];
            if (Array.isArray(body.categories)) {
                categoriesArr = body.categories.map(s => String(s).trim()).filter(Boolean);
            } else if (body.category) {
                categoriesArr = String(body.category).split(',').map(s => s.trim()).filter(Boolean);
            }
            const categoryStr = categoriesArr.length > 0 ? categoriesArr.join(', ') : (body.category || colleges[idx].category);

            // Normalize courses
            let coursesArr = colleges[idx].coursesList || [];
            if (Array.isArray(body.courses)) {
                coursesArr = body.courses.map(s => String(s).trim()).filter(Boolean);
            } else if (body.courses) {
                coursesArr = String(body.courses).split(',').map(s => s.trim()).filter(Boolean);
            }
            const coursesStr = coursesArr.length > 0 ? coursesArr.join(', ') : (body.courses || colleges[idx].courses);

            colleges[idx] = { 
                ...colleges[idx], 
                ...body, 
                category: categoryStr,
                categories: categoriesArr,
                courses: coursesStr,
                coursesList: coursesArr,
                accreditation: body.accreditation ? (Array.isArray(body.accreditation) ? body.accreditation.join(', ') : body.accreditation) : colleges[idx].accreditation,
                isFeatured: isFeaturedBool,
                featured: isFeaturedBool,
                id: colleges[idx].id, 
                updatedAt: new Date().toISOString() 
            };
            writeDataFile('colleges.json', colleges);
            return sendJson(200, { success: true, college: colleges[idx], message: 'College updated successfully' });
        } catch (e) {
            return sendJson(500, { success: false, error: e.message });
        }
    }

    // DELETE /api/content/colleges/:id
    if (collegeDetailMatch && req.method === 'DELETE') {
        const param = decodeURIComponent(collegeDetailMatch[1]);
        let colleges = readDataFile('colleges.json', []);
        colleges = colleges.filter(c => String(c.id) !== param && c.slug !== param);
        writeDataFile('colleges.json', colleges);
        return sendJson(200, { success: true, message: 'College deleted successfully' });
    }

    // ================= 5. CONTENT API: UNIVERSITIES =================
    // GET /api/content/universities
    if (pathname === '/api/content/universities' && req.method === 'GET') {
        const universities = readDataFile('universities.json', []);
        return sendJson(200, { success: true, universities });
    }

    // POST /api/content/universities
    if (pathname === '/api/content/universities' && req.method === 'POST') {
        try {
            const body = await readJsonBody();
            if (!body.name) return sendJson(400, { success: false, error: 'University name is required' });
            const universities = readDataFile('universities.json', []);
            const newId = universities.length > 0 ? Math.max(...universities.map(u => Number(u.id) || 0)) + 1 : 1;
            
            const baseSlug = slugify(body.name);
            let candidateSlug = baseSlug || `university-${newId}`;
            let counter = 2;
            while (universities.some(u => u.slug === candidateSlug)) {
                candidateSlug = `${baseSlug}-${counter}`;
                counter++;
            }

            // Normalize Streams
            let streamsArr = [];
            if (Array.isArray(body.streams)) {
                streamsArr = body.streams.map(s => String(s).trim()).filter(Boolean);
            } else if (body.popularStreams) {
                streamsArr = String(body.popularStreams).split(',').map(s => s.trim()).filter(Boolean);
            } else if (body.streams) {
                streamsArr = String(body.streams).split(',').map(s => s.trim()).filter(Boolean);
            }
            const streamsStr = streamsArr.length > 0 ? streamsArr.join(', ') : (body.popularStreams || 'Management, Arts, Science');

            // Normalize Courses Offered
            let coursesArr = [];
            if (Array.isArray(body.courses)) {
                coursesArr = body.courses.map(s => String(s).trim()).filter(Boolean);
            } else if (body.courses) {
                coursesArr = String(body.courses).split(',').map(s => s.trim()).filter(Boolean);
            }
            const coursesStr = coursesArr.length > 0 ? coursesArr.join(', ') : (body.courses || '');

            const approvalsStr = Array.isArray(body.approvals) ? body.approvals.join(', ') : (body.approvals || 'UGC Recognized, AIU Member');
            const modesStr = Array.isArray(body.modes) ? body.modes.join(', ') : (body.modes || 'Online / Distance / Regular');
            const isFeaturedBool = Boolean(body.featured !== undefined ? body.featured : body.isFeatured);

            const newUniv = {
                id: newId,
                slug: candidateSlug,
                name: body.name.trim(),
                metaDescription: body.metaDescription || '',
                tags: Array.isArray(body.tags) ? body.tags : (body.tags ? String(body.tags).split(',').map(s=>s.trim()).filter(Boolean) : []),
                keywords: Array.isArray(body.keywords) ? body.keywords : (body.keywords ? String(body.keywords).split(',').map(s=>s.trim()).filter(Boolean) : []),
                facilities: Array.isArray(body.facilities) ? body.facilities : (body.facilities ? String(body.facilities).split(',').map(s=>s.trim()).filter(Boolean) : []),
                shortName: body.shortName || body.name.trim().split(' ').map(w => w[0]).join('').substring(0, 5),
                type: body.type || 'State Private University',
                state: body.state || 'India',
                location: body.location || body.state || 'India',
                established: body.established || '2018',
                naac: body.naac || 'NAAC A Grade',
                approvals: approvalsStr,
                modes: modesStr,
                popularStreams: streamsStr,
                streams: streamsArr,
                courses: coursesStr,
                coursesList: coursesArr,
                totalCourses: Number(body.totalCourses) || 30,
                rating: Number(body.rating) || 4.9,
                logo: body.logo || 'images/logo.png',
                image: body.image || 'images/slider/home1/slide1.jpg',
                website: body.website || 'https://educationistguru.com',
                highlights: body.highlights || 'Valid for all Govt & Private Jobs, AIU Equivalence',
                description: body.description || `${body.name} is a premier accredited university partner.`,
                isFeatured: isFeaturedBool,
                featured: isFeaturedBool,
                dateAdded: new Date().toISOString()
            };
            universities.unshift(newUniv);
            writeDataFile('universities.json', universities);
            return sendJson(201, { success: true, university: newUniv, message: 'University added successfully' });
        } catch (e) {
            return sendJson(500, { success: false, error: e.message });
        }
    }

    // GET /api/content/universities/:slug_or_id
    const univDetailMatch = pathname.match(/^\/api\/content\/universities\/([^\/]+)$/);
    if (univDetailMatch && req.method === 'GET') {
        const param = decodeURIComponent(univDetailMatch[1]);
        const universities = readDataFile('universities.json', []);
        const found = universities.find(u => u.slug === param || String(u.id) === param);
        if (found) return sendJson(200, { success: true, university: found });
        return sendJson(404, { success: false, error: 'University not found' });
    }

    // PUT /api/content/universities/:id
    if (univDetailMatch && (req.method === 'PUT' || req.method === 'POST')) {
        try {
            const param = decodeURIComponent(univDetailMatch[1]);
            const body = await readJsonBody();
            const universities = readDataFile('universities.json', []);
            const idx = universities.findIndex(u => String(u.id) === param || u.slug === param);
            if (idx === -1) return sendJson(404, { success: false, error: 'University not found' });
            
            const isFeaturedBool = Boolean(body.featured !== undefined ? body.featured : (body.isFeatured !== undefined ? body.isFeatured : universities[idx].isFeatured));

            // Normalize streams
            let streamsArr = universities[idx].streams || [];
            if (Array.isArray(body.streams)) {
                streamsArr = body.streams.map(s => String(s).trim()).filter(Boolean);
            } else if (body.popularStreams) {
                streamsArr = String(body.popularStreams).split(',').map(s => s.trim()).filter(Boolean);
            }
            const streamsStr = streamsArr.length > 0 ? streamsArr.join(', ') : (body.popularStreams || universities[idx].popularStreams);

            // Normalize courses
            let coursesArr = universities[idx].coursesList || [];
            if (Array.isArray(body.courses)) {
                coursesArr = body.courses.map(s => String(s).trim()).filter(Boolean);
            } else if (body.courses) {
                coursesArr = String(body.courses).split(',').map(s => s.trim()).filter(Boolean);
            }
            const coursesStr = coursesArr.length > 0 ? coursesArr.join(', ') : (body.courses || universities[idx].courses || '');

            universities[idx] = { 
                ...universities[idx], 
                ...body, 
                approvals: body.approvals ? (Array.isArray(body.approvals) ? body.approvals.join(', ') : body.approvals) : universities[idx].approvals,
                modes: body.modes ? (Array.isArray(body.modes) ? body.modes.join(', ') : body.modes) : universities[idx].modes,
                popularStreams: streamsStr,
                streams: streamsArr,
                courses: coursesStr,
                coursesList: coursesArr,
                isFeatured: isFeaturedBool,
                featured: isFeaturedBool,
                id: universities[idx].id, 
                updatedAt: new Date().toISOString() 
            };
            writeDataFile('universities.json', universities);
            return sendJson(200, { success: true, university: universities[idx], message: 'University updated successfully' });
        } catch (e) {
            return sendJson(500, { success: false, error: e.message });
        }
    }

    // DELETE /api/content/universities/:id
    if (univDetailMatch && req.method === 'DELETE') {
        const param = decodeURIComponent(univDetailMatch[1]);
        let universities = readDataFile('universities.json', []);
        universities = universities.filter(u => String(u.id) !== param && u.slug !== param);
        writeDataFile('universities.json', universities);
        return sendJson(200, { success: true, message: 'University deleted successfully' });
    }

    // ================= 6. CONTENT API: BLOGS =================
    if (pathname === '/api/content/blogs' && req.method === 'GET') {
        const blogs = readDataFile('blogs.json', []);
        return sendJson(200, { success: true, blogs });
    }

    if (pathname === '/api/content/blogs' && req.method === 'POST') {
        try {
            const body = await readJsonBody();
            if (!body.title) return sendJson(400, { success: false, error: 'Title is required' });
            const blogs = readDataFile('blogs.json', []);
            const newId = blogs.length > 0 ? Math.max(...blogs.map(b => b.id || 0)) + 1 : 1;
            const newBlog = {
                id: newId,
                slug: slugify(body.title) || `blog-${newId}`,
                title: body.title.trim(),
                metaDescription: body.metaDescription || '',
                tags: Array.isArray(body.tags) ? body.tags : (body.tags ? String(body.tags).split(',').map(s=>s.trim()).filter(Boolean) : []),
                categories: Array.isArray(body.categories) ? body.categories : (body.category ? [body.category] : ['University Admissions']),
                keywords: Array.isArray(body.keywords) ? body.keywords : (body.keywords ? String(body.keywords).split(',').map(s=>s.trim()).filter(Boolean) : []),
                category: body.category || 'General',
                author: body.author || 'EducationistGuru',
                date: body.date || new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
                image: body.image || 'images/blog/1.jpg',
                excerpt: body.excerpt || body.metaDescription || (body.content ? body.content.replace(/<[^>]+>/g, '').slice(0, 160) + '...' : ''),
                content: body.content || '',
                commentsCount: body.commentsCount || 0,
                featured: !!body.featured,
                dateAdded: new Date().toISOString()
            };
            blogs.unshift(newBlog);
            writeDataFile('blogs.json', blogs);
            return sendJson(201, { success: true, blog: newBlog, message: 'Blog created successfully' });
        } catch (e) {
            return sendJson(500, { success: false, error: e.message });
        }
    }

    const blogMatch = pathname.match(/^\/api\/content\/blogs\/(\d+)$/);
    if (blogMatch && (req.method === 'PUT' || req.method === 'POST')) {
        try {
            const blogId = parseInt(blogMatch[1]);
            const body = await readJsonBody();
            const blogs = readDataFile('blogs.json', []);
            const idx = blogs.findIndex(b => b.id === blogId);
            if (idx === -1) return sendJson(404, { success: false, error: 'Blog not found' });
            blogs[idx] = { ...blogs[idx], ...body, id: blogId, updatedAt: new Date().toISOString() };
            writeDataFile('blogs.json', blogs);
            return sendJson(200, { success: true, blog: blogs[idx], message: 'Blog updated successfully' });
        } catch (e) {
            return sendJson(500, { success: false, error: e.message });
        }
    }

    if (blogMatch && req.method === 'DELETE') {
        const blogId = parseInt(blogMatch[1]);
        let blogs = readDataFile('blogs.json', []);
        blogs = blogs.filter(b => b.id !== blogId);
        writeDataFile('blogs.json', blogs);
        return sendJson(200, { success: true, message: 'Blog deleted successfully' });
    }

    // ================= 7. YOUTUBE API =================
    if ((pathname === '/api/youtube/videos' || pathname === '/api/content/videos') && req.method === 'GET') {
        const videos = readDataFile('videos.json', []);
        return sendJson(200, { success: true, videos });
    }

    if (pathname === '/api/youtube/fetch-info' && req.method === 'GET') {
        const rawUrl = parsedUrl.query.url || parsedUrl.query.id || '';
        const videoId = extractYouTubeId(rawUrl);
        if (!videoId) return sendJson(400, { success: false, error: 'Invalid or missing YouTube URL or ID' });

        const standardUrl = `https://www.youtube.com/watch?v=${videoId}`;
        const thumbnail = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
        const fallbackThumbnail = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
        const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(standardUrl)}&format=json`;

        https.get(oembedUrl, (ytRes) => {
            let data = '';
            ytRes.on('data', chunk => { data += chunk; });
            ytRes.on('end', () => {
                if (ytRes.statusCode === 200) {
                    try {
                        const parsed = JSON.parse(data);
                        return sendJson(200, {
                            success: true,
                            videoId,
                            url: standardUrl,
                            title: parsed.title || 'YouTube Video',
                            author: parsed.author_name || 'Educationist Guru',
                            thumbnail: parsed.thumbnail_url || thumbnail,
                            fallbackThumbnail,
                            html: parsed.html || ''
                        });
                    } catch (e) {
                        return sendJson(200, { success: true, videoId, url: standardUrl, title: '', author: 'Educationist Guru', thumbnail, fallbackThumbnail });
                    }
                } else {
                    return sendJson(200, { success: true, videoId, url: standardUrl, title: '', author: 'Educationist Guru', thumbnail, fallbackThumbnail });
                }
            });
        }).on('error', () => {
            return sendJson(200, { success: true, videoId, url: standardUrl, title: '', author: 'Educationist Guru', thumbnail, fallbackThumbnail });
        });
        return;
    }

    if ((pathname === '/api/youtube/videos' || pathname === '/api/content/videos') && req.method === 'POST') {
        try {
            const body = await readJsonBody();
            const rawUrl = (body.url || '').trim();
            const videoId = extractYouTubeId(rawUrl);
            if (!videoId) return sendJson(400, { success: false, error: 'A valid YouTube video link or ID is required.' });

            const videos = readDataFile('videos.json', []);
            const newId = videos.length > 0 ? Math.max(...videos.map(v => v.id || 0)) + 1 : 1;
            const standardUrl = `https://www.youtube.com/watch?v=${videoId}`;
            const thumbnail = body.thumbnail || `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;

            const newVideo = {
                id: newId,
                youtubeId: videoId,
                url: standardUrl,
                title: (body.title || 'Educationist Guru - Video').trim(),
                description: (body.description || '').trim(),
                category: (body.category || 'Admissions 2025').trim(),
                thumbnail: thumbnail,
                duration: (body.duration || '').trim() || 'Video',
                views: body.views || 'Latest',
                dateAdded: new Date().toISOString(),
                isFeatured: body.isFeatured === true
            };

            videos.unshift(newVideo);
            writeDataFile('videos.json', videos);
            return sendJson(201, { success: true, video: newVideo, message: 'YouTube video added successfully' });
        } catch (e) {
            return sendJson(500, { success: false, error: e.message });
        }
    }

    const videoMatch = pathname.match(/^\/api\/youtube\/videos\/([^\/]+)$/);
    if (videoMatch && req.method === 'DELETE') {
        const videoIdParam = decodeURIComponent(videoMatch[1]);
        let videos = readDataFile('videos.json', []);
        videos = videos.filter(v => String(v.id) !== videoIdParam && String(v.videoId || v.youtubeId) !== videoIdParam);
        writeDataFile('videos.json', videos);
        return sendJson(200, { success: true, message: 'Video deleted successfully' });
    }

    if (videoMatch && (req.method === 'PUT' || req.method === 'POST')) {
        try {
            const videoIdParam = decodeURIComponent(videoMatch[1]);
            const body = await readJsonBody();
            let videos = readDataFile('videos.json', []);
            const idx = videos.findIndex(v => String(v.id) === videoIdParam || String(v.videoId || v.youtubeId) === videoIdParam);
            if (idx === -1) return sendJson(404, { success: false, error: 'Video not found' });

            videos[idx] = { ...videos[idx], ...body, id: videos[idx].id, updatedAt: new Date().toISOString() };
            writeDataFile('videos.json', videos);
            return sendJson(200, { success: true, video: videos[idx], message: 'Video updated successfully' });
        } catch (e) {
            return sendJson(500, { success: false, error: e.message });
        }
    }

    // ================= 7B. FILE & THUMBNAIL UPLOAD API =================
    if (pathname === '/api/upload' && req.method === 'POST') {
        try {
            const body = await readJsonBody(25e6);
            const rawData = body ? (body.data || body.dataUrl) : null;
            if (!body || !rawData) {
                return sendJson(400, { success: false, error: 'No file data received' });
            }

            const uploadsDir = path.join(ROOT_DIR, 'images', 'uploads');
            if (!fs.existsSync(uploadsDir)) {
                fs.mkdirSync(uploadsDir, { recursive: true });
            }
            const matches = rawData.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
            let buffer;
            let ext = '.jpg';

            if (matches && matches.length === 3) {
                const mime = matches[1].toLowerCase();
                if (mime === 'image/png') ext = '.png';
                else if (mime === 'image/webp') ext = '.webp';
                else if (mime === 'image/gif') ext = '.gif';
                else if (mime === 'image/svg+xml') ext = '.svg';
                else if (mime === 'application/pdf') ext = '.pdf';
                else ext = '.jpg';
                buffer = Buffer.from(matches[2], 'base64');
            } else {
                buffer = Buffer.from(rawData, 'base64');
            }

            const rawFilename = (body.filename || 'upload').replace(/\.[^/.]+$/, '');
            const safeBase = rawFilename
                .toLowerCase()
                .replace(/[^a-z0-9]/g, '-')
                .replace(/-+/g, '-')
                .slice(0, 32) || 'upload';

            const uniqueName = `${safeBase}-${Date.now()}${ext}`;
            const targetPath = path.join(uploadsDir, uniqueName);

            fs.writeFileSync(targetPath, buffer);
            try {
                if (fs.existsSync(VAULT_UPLOADS_DIR)) {
                    fs.writeFileSync(path.join(VAULT_UPLOADS_DIR, uniqueName), buffer);
                }
            } catch (_) {}

            const fileUrl = `/images/uploads/${uniqueName}`;
            return sendJson(200, {
                success: true,
                url: fileUrl,
                filename: uniqueName,
                originalName: body.filename || uniqueName,
                size: buffer.length,
                message: 'File uploaded successfully'
            });
        } catch (err) {
            console.error('File upload error:', err);
            return sendJson(500, { success: false, error: err.message || 'Upload failed' });
        }
    }

    // ================= 7C. DISASTER RECOVERY & VAULT CONTROL APIS =================
    // 7C.1 GET /api/system/vault-status
    if (pathname === '/api/system/vault-status' && req.method === 'GET') {
        const stats = {
            activeDataDir: DATA_DIR,
            localVaultDir: VAULT_LOCAL_DIR,
            externalVaultDir: VAULT_EXTERNAL_DIR,
            snapshotsDir: SNAPSHOTS_DIR,
            uploadsVaultDir: VAULT_UPLOADS_DIR,
            isExternalVaultAccessible: fs.existsSync(VAULT_EXTERNAL_DIR),
            collectionCounts: {},
            lastSnapshot: null
        };

        ALL_COLLECTION_FILES.forEach(f => {
            const items = readDataFile(f, []);
            stats.collectionCounts[f.replace('.json', '')] = Array.isArray(items) ? items.length : (items ? Object.keys(items).length : 0);
        });

        try {
            const snaps = fs.readdirSync(SNAPSHOTS_DIR)
                .filter(f => f.startsWith('snapshot-') && f.endsWith('.json'))
                .map(f => ({ name: f, time: fs.statSync(path.join(SNAPSHOTS_DIR, f)).mtime.toISOString() }))
                .sort((a, b) => b.time.localeCompare(a.time));
            if (snaps.length > 0) stats.lastSnapshot = snaps[0];
            stats.totalSnapshots = snaps.length;
        } catch (_) {}

        return sendJson(200, { success: true, vault: stats });
    }

    // 7C.2 GET /api/system/backup - Portable full database download
    if (pathname === '/api/system/backup' && req.method === 'GET') {
        const bundle = {
            appName: 'EducationistGuru',
            version: '2.0-unbreakable',
            exportedAt: new Date().toISOString(),
            schemaVersion: '2026.1',
            collections: {}
        };

        ALL_COLLECTION_FILES.forEach(f => {
            bundle.collections[f.replace('.json', '')] = readDataFile(f, []);
        });

        const jsonStr = JSON.stringify(bundle, null, 2);
        const filename = `educationistguru_full_backup_${new Date().toISOString().split('T')[0]}.json`;

        res.writeHead(200, {
            'Content-Type': 'application/json; charset=utf-8',
            'Content-Disposition': `attachment; filename="${filename}"`,
            'Cache-Control': 'no-cache'
        });
        return res.end(jsonStr);
    }

    // 7C.3 POST /api/system/restore - Restore database from uploaded JSON bundle
    if (pathname === '/api/system/restore' && req.method === 'POST') {
        try {
            const body = await readJsonBody(50e6);
            if (!body || (!body.collections && typeof body !== 'object')) {
                return sendJson(400, { success: false, error: 'Invalid backup payload format.' });
            }

            // Create pre-restore rollback safety snapshot first!
            const safetySnapshot = createSnapshot('pre_restore_safety');

            const collectionsToRestore = body.collections || body;
            let restoredFiles = [];

            ALL_COLLECTION_FILES.forEach(f => {
                const key = f.replace('.json', '');
                if (collectionsToRestore[key] !== undefined) {
                    writeDataFile(f, collectionsToRestore[key]);
                    restoredFiles.push(f);
                }
            });

            // Create post-restore snapshot
            createSnapshot('post_restore');

            return sendJson(200, {
                success: true,
                message: `Successfully restored ${restoredFiles.length} collections. Safety rollback snapshot created.`,
                restoredFiles,
                safetySnapshot: safetySnapshot.name
            });
        } catch (e) {
            return sendJson(500, { success: false, error: e.message });
        }
    }

    // 7C.4 GET /api/system/snapshots - List available snapshots
    if (pathname === '/api/system/snapshots' && req.method === 'GET') {
        try {
            const snaps = fs.readdirSync(SNAPSHOTS_DIR)
                .filter(f => f.startsWith('snapshot-') && f.endsWith('.json'))
                .map(f => {
                    const stat = fs.statSync(path.join(SNAPSHOTS_DIR, f));
                    return {
                        name: f,
                        filename: f,
                        size: stat.size,
                        timestamp: stat.mtime.toISOString(),
                        createdAt: stat.mtime.toISOString()
                    };
                })
                .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

            return sendJson(200, { success: true, snapshots: snaps });
        } catch (e) {
            return sendJson(500, { success: false, error: e.message });
        }
    }

    // 7C.4b POST /api/system/snapshot - Create manual point-in-time snapshot
    if ((pathname === '/api/system/snapshot' || pathname === '/api/system/snapshots') && (req.method === 'POST' || req.method === 'PUT')) {
        try {
            const body = await readJsonBody().catch(() => ({}));
            const reason = (body && body.reason) ? body.reason : 'manual_admin_trigger';
            const snap = createSnapshot(reason);
            return sendJson(200, {
                success: true,
                message: 'Point-in-time snapshot created successfully.',
                snapshot: snap.name,
                details: snap
            });
        } catch (e) {
            return sendJson(500, { success: false, error: e.message });
        }
    }

    // 7C.5 POST /api/system/rollback - Rollback to a specific snapshot
    if (pathname === '/api/system/rollback' && req.method === 'POST') {
        try {
            const body = await readJsonBody();
            const snapName = body.snapshotName || body.filename || body.name;
            if (!snapName) return sendJson(400, { success: false, error: 'snapshotName or filename is required' });

            const snapPath = path.join(SNAPSHOTS_DIR, snapName);
            if (!fs.existsSync(snapPath)) {
                return sendJson(404, { success: false, error: 'Snapshot file not found' });
            }

            const raw = fs.readFileSync(snapPath, 'utf8');
            const parsed = JSON.parse(raw);
            if (!parsed.collections) {
                return sendJson(400, { success: false, error: 'Malformed snapshot bundle' });
            }

            // Create pre-rollback safety snapshot
            createSnapshot('pre_rollback_safety');

            let restoredFiles = [];
            ALL_COLLECTION_FILES.forEach(f => {
                const key = f.replace('.json', '');
                if (parsed.collections[key] !== undefined) {
                    writeDataFile(f, parsed.collections[key]);
                    restoredFiles.push(f);
                }
            });

            return sendJson(200, {
                success: true,
                message: `Rollback to ${snapName} completed. ${restoredFiles.length} collections restored.`,
                restoredFiles
            });
        } catch (e) {
            return sendJson(500, { success: false, error: e.message });
        }
    }

    // 7C.7 GET /api/ping or /api/health or /api/crm/ping - Health check endpoint
    if ((pathname === '/api/ping' || pathname === '/api/health' || pathname === '/api/crm/ping') && req.method === 'GET') {
        return sendJson(200, {
            success: true,
            status: 'operational',
            message: 'EducationistGuru API Engine is active',
            timestamp: new Date().toISOString()
        });
    }

    // ================= 8. COMPREHENSIVE CRM PERSISTENCE API =================
    // 8.1 GET /api/crm/all - Hydrate all CRM entities in a single round-trip
    if (pathname === '/api/crm/all' && req.method === 'GET') {
        const allData = {
            leads: readDataFile('leads.json', []),
            applications: readDataFile('applications.json', []),
            enrollments: readDataFile('enrollments.json', []),
            inquiries: readDataFile('inquiries.json', []),
            subscribers: readDataFile('subscribers.json', []),
            fees: readDataFile('fees.json', []),
            users: readDataFile('users.json', []),
            roles: readDataFile('roles.json', [
                { id: 1, name: 'owner', label: 'Owner & Director', color: '#ff3115', permissions: ['all'] },
                { id: 2, name: 'admin', label: 'Senior Administrator', color: '#0d6efd', permissions: ['all'] },
                { id: 3, name: 'counsellor', label: 'Academic Counsellor', color: '#28a745', permissions: ['dashboard', 'leads', 'applications', 'enrollments', 'inquiries'] },
                { id: 4, name: 'editor', label: 'Content Editor', color: '#6f42c1', permissions: ['dashboard', 'subscribers'] }
            ]),
            settings: readDataFile('settings.json', {})
        };
        return sendJson(200, { success: true, data: allData });
    }

    // 8.2 GET /api/crm/stats - Aggregated real-time metrics
    if (pathname === '/api/crm/stats' && req.method === 'GET') {
        const leads = readDataFile('leads.json', []);
        const enrollments = readDataFile('enrollments.json', []);
        const inquiries = readDataFile('inquiries.json', []);
        const subscribers = readDataFile('subscribers.json', []);
        const applications = readDataFile('applications.json', []);
        const fees = readDataFile('fees.json', []);

        const leadsBySource = {};
        const leadsByStatus = {};
        leads.forEach(l => {
            const src = l.source || 'Website';
            leadsBySource[src] = (leadsBySource[src] || 0) + 1;
            const st = l.status || 'new';
            leadsByStatus[st] = (leadsByStatus[st] || 0) + 1;
        });

        const revenue = enrollments.reduce((s, e) => s + (Number(e.paid) || 0), 0);
        const pendingRevenue = enrollments.reduce((s, e) => s + ((Number(e.fee) || 0) - (Number(e.paid) || 0)), 0);

        return sendJson(200, {
            success: true,
            stats: {
                totalLeads: leads.length,
                newLeads: leads.filter(l => l.status === 'new').length,
                totalEnrollments: enrollments.length,
                confirmedEnrollments: enrollments.filter(e => e.status === 'confirmed').length,
                totalInquiries: inquiries.length,
                unreadInquiries: inquiries.filter(i => i.status === 'unread').length,
                totalSubscribers: subscribers.filter(s => s.status === 'active').length,
                totalApplications: applications.length,
                pendingApplications: applications.filter(a => a.status === 'pending').length,
                revenue,
                pendingRevenue,
                leadsBySource,
                leadsByStatus
            }
        });
    }

    // 8.3 CRM Settings
    if (pathname === '/api/crm/settings') {
        if (req.method === 'GET') {
            const settings = readDataFile('settings.json', { siteName: 'EducationistGuru' });
            return sendJson(200, { success: true, settings });
        }
        if (req.method === 'POST' || req.method === 'PUT') {
            try {
                const body = await readJsonBody();
                const current = readDataFile('settings.json', {});
                const updated = { ...current, ...body, updatedAt: new Date().toISOString() };
                writeDataFile('settings.json', updated);
                return sendJson(200, { success: true, settings: updated, message: 'Settings saved' });
            } catch (e) {
                return sendJson(500, { success: false, error: e.message });
            }
        }
    }

    // 8.4 Full Entity REST Routing (leads, applications, enrollments, inquiries, subscribers, fees, users)
    const crmEntityMatch = pathname.match(/^\/api\/crm\/([a-z0-9_-]+)(?:\/([a-z0-9_-]+))?$/i);
    if (crmEntityMatch) {
        let entity = crmEntityMatch[1].toLowerCase();
        const entityId = crmEntityMatch[2] ? decodeURIComponent(crmEntityMatch[2]) : null;

        // Aliases
        if (entity === 'lead') entity = 'leads';
        if (entity === 'inquiry') entity = 'inquiries';
        if (entity === 'subscriber') entity = 'subscribers';
        if (entity === 'enrollment') entity = 'enrollments';
        if (entity === 'application') entity = 'applications';
        if (entity === 'fee') entity = 'fees';
        if (entity === 'user') entity = 'users';

        const validEntities = ['leads', 'applications', 'enrollments', 'inquiries', 'subscribers', 'fees', 'users'];

        if (validEntities.includes(entity)) {
            const filename = `${entity}.json`;

            // GET /api/crm/:entity
            if (!entityId && req.method === 'GET') {
                const items = readDataFile(filename, []);
                return sendJson(200, { success: true, [entity]: items, count: items.length });
            }

            // GET /api/crm/:entity/:id
            if (entityId && req.method === 'GET') {
                const items = readDataFile(filename, []);
                const found = items.find(x => String(x.id) === entityId || (entity === 'subscribers' && x.email === entityId));
                if (found) return sendJson(200, { success: true, item: found });
                return sendJson(404, { success: false, error: `${entity} record not found` });
            }

            // POST /api/crm/:entity
            if (!entityId && req.method === 'POST') {
                try {
                    const body = await readJsonBody();
                    const items = readDataFile(filename, []);

                    let record = { ...body };
                    if (!record.date && !record.createdAt) record.date = new Date().toISOString().split('T')[0];
                    if (!record.dateAdded) record.dateAdded = new Date().toISOString();

                    // 1. LEAD CREATION & DEDUPLICATION
                    if (entity === 'leads') {
                        record.name = (record.name || 'Website Visitor').trim();
                        record.email = (record.email || '').trim();
                        record.phone = (record.phone || '').trim();
                        record.course = record.course || 'General Admission';
                        record.source = record.source || 'Website';
                        record.status = record.status || 'new';
                        record.priority = record.priority || 'warm';

                        const cleanPhone = record.phone.replace(/\D/g, '').slice(-10);
                        const cleanEmail = record.email.toLowerCase();

                        // Deduplication: check if identical lead exists by 10-digit phone or email
                        const existingLeadIdx = items.findIndex(l => {
                            const lPhone = (l.phone || '').replace(/\D/g, '').slice(-10);
                            const lEmail = (l.email || '').trim().toLowerCase();
                            return (cleanPhone && lPhone && cleanPhone === lPhone) || (cleanEmail && lEmail && cleanEmail === lEmail);
                        });

                        if (existingLeadIdx !== -1) {
                            // Update existing lead with any richer details and promote to top of list
                            const existingLead = items[existingLeadIdx];
                            const updatedLead = {
                                ...existingLead,
                                ...record,
                                id: existingLead.id,
                                status: 'new',
                                priority: 'high',
                                date: new Date().toISOString().split('T')[0],
                                dateAdded: new Date().toISOString(),
                                notes: record.notes && !(existingLead.notes || '').includes(record.notes)
                                    ? (existingLead.notes ? `${existingLead.notes}\n\n${record.notes}` : record.notes).trim()
                                    : (existingLead.notes || record.notes || ''),
                                updatedAt: new Date().toISOString()
                            };
                            items.splice(existingLeadIdx, 1);
                            items.unshift(updatedLead);
                            writeDataFile(filename, items);
                            return sendJson(200, { success: true, item: updatedLead, message: 'Lead updated with latest details and promoted to top' });
                        }

                        // Fresh lead: assign next authoritative unique integer ID
                        const newId = items.length > 0 ? Math.max(...items.map(x => Number(x.id) || 0)) + 1 : 1;
                        record.id = newId;

                        // Ensure an unread inquiry is recorded for the CRM notification bell if not explicitly skipped
                        if (record.skipAutoInquiry !== true && record.hasInquiry !== true) {
                            try {
                                const inqs = readDataFile('inquiries.json', []);
                                const alreadyHasInq = inqs.some(iq => {
                                    const iqPhone = (iq.phone || '').replace(/\D/g, '').slice(-10);
                                    const iqEmail = (iq.email || '').toLowerCase().trim();
                                    return (cleanPhone && iqPhone && cleanPhone === iqPhone) || (cleanEmail && iqEmail && cleanEmail === iqEmail);
                                });
                                if (!alreadyHasInq) {
                                    const newInqId = inqs.length > 0 ? Math.max(...inqs.map(x => Number(x.id) || 0)) + 1 : 1;
                                    const inqSubject = record.inquirySubject || `⚡ New Admission Lead: ${record.course}`;
                                    const inqMessage = record.inquiryMessage || `Student lead registered via ${record.source}. Program interest: ${record.course}. Notes: ${record.notes || 'None'}`;
                                    inqs.unshift({
                                        id: newInqId,
                                        name: record.name,
                                        email: record.email,
                                        phone: record.phone,
                                        subject: inqSubject,
                                        message: inqMessage,
                                        status: 'unread',
                                        date: new Date().toISOString(),
                                        dateAdded: new Date().toISOString()
                                    });
                                    writeDataFile('inquiries.json', inqs);
                                }
                            } catch (errInq) {
                                console.error('[CRM Server] Auto-inquiry logging failed:', errInq.message);
                            }
                        }

                        items.unshift(record);
                        writeDataFile(filename, items);
                        return sendJson(201, { success: true, item: record, message: 'leads record created' });
                    }

                    // 2. INQUIRY CREATION & DEDUPLICATION
                    if (entity === 'inquiries') {
                        record.status = record.status || 'unread';
                        record.name = (record.name || 'Student Visitor').trim();
                        record.email = (record.email || '').trim();
                        record.phone = (record.phone || '').trim();
                        record.subject = (record.subject || 'Website Admission Inquiry').trim();

                        const cleanPhone = record.phone.replace(/\D/g, '').slice(-10);
                        const cleanEmail = record.email.toLowerCase();

                        // Check if an inquiry for this student already exists by 10-digit phone or email
                        const existingInqIdx = items.findIndex(iq => {
                            const iqPhone = (iq.phone || '').replace(/\D/g, '').slice(-10);
                            const iqEmail = (iq.email || '').trim().toLowerCase();
                            return (cleanPhone && iqPhone && cleanPhone === iqPhone) || (cleanEmail && iqEmail && cleanEmail === iqEmail);
                        });

                        if (existingInqIdx !== -1) {
                            // Upgrade existing inquiry with the richer submitted inquiry and mark unread
                            const existingInq = items[existingInqIdx];
                            items[existingInqIdx] = {
                                ...existingInq,
                                ...record,
                                id: existingInq.id,
                                status: 'unread',
                                updatedAt: new Date().toISOString()
                            };
                            writeDataFile(filename, items);
                            return sendJson(200, { success: true, item: items[existingInqIdx], message: 'Inquiry updated' });
                        }

                        const newId = items.length > 0 ? Math.max(...items.map(x => Number(x.id) || 0)) + 1 : 1;
                        record.id = newId;
                        items.unshift(record);
                        writeDataFile(filename, items);
                        return sendJson(201, { success: true, item: record, message: 'inquiries record created' });
                    }

                    // 3. OTHER ENTITIES (subscribers, applications, enrollments, fees, users)
                    if (entity === 'subscribers') {
                        record.status = record.status || 'active';
                        // Deduplicate subscribers by email
                        const existingSub = items.find(s => s.email && s.email.toLowerCase() === (record.email || '').toLowerCase());
                        if (existingSub) {
                            return sendJson(200, { success: true, item: existingSub, message: 'Subscriber already registered' });
                        }
                    } else if (entity === 'applications') {
                        record.status = record.status || 'pending';
                    } else if (entity === 'enrollments') {
                        record.status = record.status || 'confirmed';
                        record.fee = Number(record.fee) || 0;
                        record.paid = Number(record.paid) || 0;
                    }

                    const newId = items.length > 0 ? Math.max(...items.map(x => Number(x.id) || 0)) + 1 : 1;
                    record.id = newId;
                    items.unshift(record);
                    writeDataFile(filename, items);
                    return sendJson(201, { success: true, item: record, message: `${entity} record created` });
                } catch (e) {
                    return sendJson(500, { success: false, error: e.message });
                }
            }

            // PUT /api/crm/:entity/:id
            if (entityId && (req.method === 'PUT' || req.method === 'POST')) {
                try {
                    const body = await readJsonBody();
                    const items = readDataFile(filename, []);
                    const idx = items.findIndex(x => String(x.id) === entityId || (entity === 'subscribers' && x.email === entityId));
                    if (idx === -1) return sendJson(404, { success: false, error: `${entity} record not found` });

                    items[idx] = { ...items[idx], ...body, id: items[idx].id, updatedAt: new Date().toISOString() };
                    writeDataFile(filename, items);
                    return sendJson(200, { success: true, item: items[idx], message: `${entity} record updated` });
                } catch (e) {
                    return sendJson(500, { success: false, error: e.message });
                }
            }

            // DELETE /api/crm/:entity/:id
            if (entityId && req.method === 'DELETE') {
                let items = readDataFile(filename, []);
                items = items.filter(x => String(x.id) !== entityId && (entity !== 'subscribers' || x.email !== entityId));
                writeDataFile(filename, items);
                return sendJson(200, { success: true, message: `${entity} record deleted` });
            }
        }
    }

    // ================= 9. DYNAMIC SLUG ROUTES =================
    // /courses/:slug
    const dynamicCourseMatch = pathname.match(/^\/courses\/([^\/]+)\/?$/);
    if (dynamicCourseMatch && req.method === 'GET') {
        return serveHtmlFile('courses-details.html');
    }

    // /colleges/:slug
    const dynamicCollegeMatch = pathname.match(/^\/colleges\/([^\/]+)\/?$/);
    if (dynamicCollegeMatch && req.method === 'GET') {
        return serveHtmlFile('colleges.html');
    }

    // /universities/:slug
    const dynamicUnivMatch = pathname.match(/^\/universities\/([^\/]+)\/?$/);
    if (dynamicUnivMatch && req.method === 'GET') {
        return serveHtmlFile('universities.html');
    }

    // /blog/:slug
    const dynamicBlogMatch = pathname.match(/^\/blog\/([^\/]+)\/?$/);
    if (dynamicBlogMatch && req.method === 'GET') {
        return serveHtmlFile('blog-details.html');
    }

    // ================= 10. CLEAN STATIC PAGE ROUTES =================
    const normalizedPath = (pathname.length > 1 && pathname.endsWith('/')) ? pathname.slice(0, -1) : pathname;
    const cleanRoutes = {
        '/': 'index.html',
        '/about': 'about.html',
        '/courses': 'courses.html',
        '/colleges': 'colleges.html',
        '/universities': 'universities.html',
        '/blog': 'blog.html',
        '/contact': 'contact.html',
        '/gallery': 'gallery.html',
        '/events': 'events.html',
        '/youtube': 'youtube.html',
        '/edit': 'edit.html'
    };

    if (cleanRoutes[normalizedPath]) {
        return serveHtmlFile(cleanRoutes[normalizedPath]);
    }

    // CRM routing (case-insensitive, clean routes & direct files)
    const lowerPath = pathname.toLowerCase();
    if (lowerPath === '/crm' || lowerPath === '/crm/' || lowerPath === '/crm/index' || lowerPath === '/crm/index.html') {
        return serveHtmlFile('CRM/index.html');
    }

    if (lowerPath.startsWith('/crm/')) {
        const relativeSub = pathname.replace(/^\/[Cc][Rr][Mm]\//, '');
        const directFile = path.join(ROOT_DIR, 'CRM', relativeSub);

        if (fs.existsSync(directFile) && fs.statSync(directFile).isFile()) {
            const ext = path.extname(directFile).toLowerCase();
            res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'text/html', 'Cache-Control': 'no-cache' });
            return fs.createReadStream(directFile).pipe(res);
        }

        // Try appending .html for clean routes (e.g. /CRM/dashboard -> CRM/dashboard.html)
        const htmlFile = directFile + '.html';
        if (fs.existsSync(htmlFile) && fs.statSync(htmlFile).isFile()) {
            res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-cache' });
            return fs.createReadStream(htmlFile).pipe(res);
        }

        return serveHtmlFile('CRM/index.html');
    }

    // ================= 11. STATIC FILE SERVING =================
    let safePath = path.normalize(pathname).replace(/^(\.\.[\/\\])+/, '');
    if (safePath === '/' || safePath === '\\') safePath = '/index.html';

    // Route fallback for assets requested relative to /edit/ or root
    if (safePath.endsWith('js\\edit.js') || safePath.endsWith('js/edit.js')) {
        safePath = '/edit/js/edit.js';
    } else if (safePath.endsWith('css\\edit.css') || safePath.endsWith('css/edit.css')) {
        safePath = '/edit/css/edit.css';
    } else if (safePath.startsWith('\\edit\\images\\') || safePath.startsWith('/edit/images/')) {
        safePath = safePath.replace(/^[\/\\]edit[\/\\]/, path.sep);
    } else if (safePath.startsWith('\\edit\\data\\') || safePath.startsWith('/edit/data/')) {
        safePath = safePath.replace(/^[\/\\]edit[\/\\]/, path.sep);
    }

    let filePath = path.join(ROOT_DIR, safePath);

    try {
        if (fs.existsSync(filePath)) {
            const stat = fs.statSync(filePath);
            if (stat.isDirectory()) {
                const indexFile = path.join(filePath, 'index.html');
                if (fs.existsSync(indexFile)) {
                    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
                    return fs.createReadStream(indexFile).pipe(res);
                }
            } else if (stat.isFile()) {
                const ext = path.extname(filePath).toLowerCase();
                const contentType = MIME_TYPES[ext] || 'application/octet-stream';
                res.writeHead(200, { 'Content-Type': contentType, 'Cache-Control': 'no-cache' });
                return fs.createReadStream(filePath).pipe(res);
            }
        }
    } catch (e) {}

    // Check if adding .html serves an existing file
    if (fs.existsSync(filePath + '.html')) {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-cache' });
        return fs.createReadStream(filePath + '.html').pipe(res);
    }

    // 404 Not Found
    serve404();
});

server.listen(PORT, () => {
    try {
        selfHealAndSyncVaultOnBoot();
    } catch (err) {
        console.error('[VAULT] Error during boot self-heal:', err);
    }
    console.log(`EducationistGuru Server running at http://localhost:${PORT}/`);
    console.log(`Clean Routes active: /, /about, /courses, /colleges, /universities, /blog, /contact, /edit`);
    console.log(`Disaster Recovery Vault active at: ${VAULT_EXTERNAL_DIR}`);
});
