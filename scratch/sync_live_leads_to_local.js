const https = require('https');
const fs = require('fs');
const path = require('path');

https.get('https://educationistguru.com/api/crm/all?_t=' + Date.now(), (res) => {
    let d = '';
    res.on('data', c => d += c);
    res.on('end', () => {
        try {
            const json = JSON.parse(d);
            if (json.success && json.data) {
                const dataDir = path.resolve(__dirname, '../data');
                ['leads', 'inquiries', 'applications', 'enrollments', 'fees', 'subscribers', 'users'].forEach(k => {
                    if (json.data[k]) {
                        const fp = path.join(dataDir, k + '.json');
                        fs.writeFileSync(fp, JSON.stringify(json.data[k], null, 2), 'utf8');
                        console.log(`✅ Synced ${k}.json (${json.data[k].length} items) from Hostinger server to local`);
                    }
                });
            }
        } catch (e) {
            console.error('Error parsing live response:', e);
        }
    });
}).on('error', console.error);
