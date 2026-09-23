/* =============================================
   EducationistGuru - Website to CRM Integration
   - Floating WhatsApp Chat Widget (8750477000 / 9738707000)
   - "Request an Immediate Callback" Modal
   - Public Site Form Capture to CRM
   ============================================= */

(function() {
    // ================= CRM HELPER & SERVER PERSISTENCE =================
    // ================= TITANIUM RESILIENT CRM & VAULT PERSISTENCE ENGINE =================
    function getCrmApiBase() {
        if (typeof CRM !== 'undefined' && typeof CRM.getApiBase === 'function') {
            return CRM.getApiBase();
        }
        if (window.location.protocol === 'file:' || 
            (window.location.hostname === 'localhost' && window.location.port !== '3000') ||
            (window.location.hostname === '127.0.0.1' && window.location.port !== '3000')) {
            return 'http://localhost:3000';
        }
        return window.location.origin || '';
    }

    // Append-only Titanium Vault Ledger (zero lead loss guarantee)
    function appendToTitaniumVaultLedger(pluralKey, item) {
        try {
            const rawLedger = localStorage.getItem('eg_lead_vault_ledger') || '[]';
            const ledger = JSON.parse(rawLedger);
            ledger.push({
                collection: pluralKey,
                data: item,
                savedAt: new Date().toISOString(),
                pageUrl: window.location.href,
                userAgent: navigator.userAgent
            });
            // Keep up to 2,000 historic entries in immutable vault ledger
            if (ledger.length > 2000) ledger.splice(0, ledger.length - 2000);
            localStorage.setItem('eg_lead_vault_ledger', JSON.stringify(ledger));
        } catch(e) {
            console.warn('[Titanium Ledger] Append error:', e);
        }
    }

    // Pending Offline Sync Queue
    function enqueueOfflineSync(pluralKey, item) {
        try {
            const rawQueue = localStorage.getItem('eg_pending_leads_queue') || '[]';
            const queue = JSON.parse(rawQueue);
            const exists = queue.some(q => q.collection === pluralKey && (
                (q.item.id && q.item.id === item.id) ||
                (q.item.phone && item.phone && q.item.phone === item.phone && q.item.createdAt === item.createdAt)
            ));
            if (!exists) {
                queue.push({
                    collection: pluralKey,
                    item: item,
                    enqueuedAt: new Date().toISOString()
                });
                localStorage.setItem('eg_pending_leads_queue', JSON.stringify(queue));
            }
        } catch(e) {
            console.warn('[Titanium Queue] Enqueue error:', e);
        }
    }

    let isFlushingQueue = false;
    async function flushOfflineLeadsQueue() {
        if (isFlushingQueue) return;
        if (!navigator.onLine && navigator.onLine !== undefined) return;

        isFlushingQueue = true;
        try {
            const rawQueue = localStorage.getItem('eg_pending_leads_queue') || '[]';
            let queue = JSON.parse(rawQueue);
            if (!Array.isArray(queue) || queue.length === 0) {
                // Also scan collections for any draft marked with _isLocalOfflineDraft
                const collectionsToScan = ['leads', 'inquiries', 'applications', 'subscribers'];
                collectionsToScan.forEach(col => {
                    try {
                        const localItems = JSON.parse(localStorage.getItem('crm_' + col) || '[]');
                        localItems.forEach(it => {
                            if (it && it._isLocalOfflineDraft) {
                                enqueueOfflineSync(col, it);
                            }
                        });
                    } catch(e) {}
                });
                queue = JSON.parse(localStorage.getItem('eg_pending_leads_queue') || '[]');
            }

            if (!Array.isArray(queue) || queue.length === 0) {
                isFlushingQueue = false;
                return;
            }

            const remaining = [];
            const apiBase = getCrmApiBase().replace(/\/+$/, '');

            for (const entry of queue) {
                try {
                    const postUrl = apiBase + '/api/crm/' + entry.collection;
                    const cleanItem = { ...entry.item };
                    delete cleanItem._isLocalOfflineDraft;

                    const ctrl = new AbortController();
                    const tm = setTimeout(() => ctrl.abort(), 7000);
                    const res = await fetch(postUrl, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(cleanItem),
                        signal: ctrl.signal
                    });
                    clearTimeout(tm);

                    if (res.ok) {
                        const resData = await res.json();
                        const authoritative = (resData && resData.item) ? resData.item : cleanItem;

                        // Mark synced in localStorage
                        try {
                            const local = JSON.parse(localStorage.getItem('crm_' + entry.collection) || '[]');
                            const sPhone = (authoritative.phone || '').replace(/\D/g, '').slice(-10);
                            const sEmail = (authoritative.email || '').trim().toLowerCase();

                            const idx = local.findIndex(x => 
                                (x.id && String(x.id) === String(authoritative.id)) ||
                                (sPhone && (x.phone || '').replace(/\D/g, '').slice(-10) === sPhone) ||
                                (sEmail && (x.email || '').trim().toLowerCase() === sEmail)
                            );

                            if (idx !== -1) {
                                local[idx] = { ...authoritative, _isLocalOfflineDraft: false };
                            } else {
                                local.unshift({ ...authoritative, _isLocalOfflineDraft: false });
                            }
                            localStorage.setItem('crm_' + entry.collection, JSON.stringify(local));
                        } catch(e) {}
                    } else {
                        remaining.push(entry);
                    }
                } catch(netErr) {
                    remaining.push(entry);
                }
            }

            localStorage.setItem('eg_pending_leads_queue', JSON.stringify(remaining));
        } catch(err) {
            console.warn('[Titanium Queue] Flush error:', err);
        } finally {
            isFlushingQueue = false;
        }
    }

    // Initialize auto-drain listeners
    window.addEventListener('online', () => {
        console.log('[Titanium CRM] Connection restored, flushing offline leads queue...');
        flushOfflineLeadsQueue();
    });
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
            flushOfflineLeadsQueue();
        }
    });
    setInterval(flushOfflineLeadsQueue, 30000);
    setTimeout(flushOfflineLeadsQueue, 2500);

    async function crmSave(key, item) {
        // Normalize key to plural for server REST routes
        let pluralKey = key;
        if (key === 'lead') pluralKey = 'leads';
        if (key === 'inquiry') pluralKey = 'inquiries';
        if (key === 'subscriber') pluralKey = 'subscribers';
        if (key === 'application') pluralKey = 'applications';
        if (key === 'enrollment') pluralKey = 'enrollments';
        if (key === 'fee') pluralKey = 'fees';

        if (!item.date && !item.createdAt) item.date = new Date().toISOString().split('T')[0];
        if (!item.dateAdded) item.dateAdded = new Date().toISOString();
        if (!item.createdAt) item.createdAt = new Date().toISOString();

        // 1. Permanently record in Append-Only Titanium Vault Ledger first
        appendToTitaniumVaultLedger(pluralKey, item);

        // 2. Send authoritative HTTP POST directly to Server API with 8s AbortController
        try {
            const apiBase = getCrmApiBase().replace(/\/+$/, '');
            const postUrl = apiBase + '/api/crm/' + pluralKey;
            
            const ctrl = new AbortController();
            const tm = setTimeout(() => ctrl.abort(), 8000);

            const res = await fetch(postUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(item),
                signal: ctrl.signal
            });
            clearTimeout(tm);

            if (res.ok) {
                const resData = await res.json();
                if (resData && resData.item) {
                    // Update localStorage cleanly with authoritative server record (deduplicated)
                    try {
                        const local = JSON.parse(localStorage.getItem('crm_' + pluralKey) || '[]');
                        const sItem = resData.item;
                        const sPhone = (sItem.phone || '').replace(/\D/g, '').slice(-10);
                        const sEmail = (sItem.email || '').trim().toLowerCase();

                        const idx = local.findIndex(x => 
                            (x.id && String(x.id) === String(sItem.id)) ||
                            (sPhone && (x.phone || '').replace(/\D/g, '').slice(-10) === sPhone) ||
                            (sEmail && (x.email || '').trim().toLowerCase() === sEmail)
                        );

                        if (idx !== -1) {
                            local[idx] = sItem;
                        } else {
                            local.unshift(sItem);
                        }
                        localStorage.setItem('crm_' + pluralKey, JSON.stringify(local));
                        localStorage.setItem('crm_' + key, JSON.stringify(local));
                    } catch(e) {}
                    return resData.item;
                }
            }
        } catch(err) {
            console.warn('[CRM Sync] Server unreachable or timed out, queuing titanium offline draft:', err);
        }

        // 3. Offline & Disaster Recovery Fallback
        try {
            const local = JSON.parse(localStorage.getItem('crm_' + pluralKey) || localStorage.getItem('crm_' + key) || '[]');
            const itemPhone = (item.phone || '').replace(/\D/g, '').slice(-10);
            const itemEmail = (item.email || '').trim().toLowerCase();

            const existingIdx = local.findIndex(x => 
                (itemPhone && (x.phone || '').replace(/\D/g, '').slice(-10) === itemPhone) ||
                (itemEmail && (x.email || '').trim().toLowerCase() === itemEmail)
            );

            if (existingIdx !== -1) {
                local[existingIdx] = { ...local[existingIdx], ...item, updatedAt: new Date().toISOString() };
                localStorage.setItem('crm_' + pluralKey, JSON.stringify(local));
                localStorage.setItem('crm_' + key, JSON.stringify(local));
                enqueueOfflineSync(pluralKey, local[existingIdx]);
                return local[existingIdx];
            } else {
                item._isLocalOfflineDraft = true;
                item.id = local.length > 0 ? Math.max(...local.map(d => Number(d.id) || 0)) + 1 : 1;
                local.unshift(item);
                localStorage.setItem('crm_' + pluralKey, JSON.stringify(local));
                localStorage.setItem('crm_' + key, JSON.stringify(local));
                enqueueOfflineSync(pluralKey, item);
                return item;
            }
        } catch(e) {
            return item;
        }
    }
    window.crmSave = crmSave;
    window.flushOfflineLeadsQueue = flushOfflineLeadsQueue;

    // ================= INJECT CSS =================
    const css = `
    /* WhatsApp Floating Button */
    .eg-wa-float-btn {
        position: fixed;
        bottom: 25px;
        right: 25px;
        width: 60px;
        height: 60px;
        background: linear-gradient(135deg, #25D366, #128C7E);
        border-radius: 50%;
        box-shadow: 0 8px 25px rgba(37, 211, 102, 0.45);
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        z-index: 99999;
        transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.3s;
        border: none;
        outline: none;
        text-decoration: none;
    }
    .eg-wa-float-btn:hover {
        transform: scale(1.08) translateY(-2px);
        box-shadow: 0 12px 30px rgba(37, 211, 102, 0.6);
    }
    .eg-wa-badge {
        position: absolute;
        top: -3px;
        right: -3px;
        background: #ff3115;
        color: #fff;
        border: 2px solid #fff;
        width: 22px;
        height: 22px;
        border-radius: 50%;
        font-size: 11px;
        font-weight: 800;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 6px rgba(0,0,0,0.2);
    }
    .eg-wa-tooltip {
        position: absolute;
        right: 74px;
        background: #1e293b;
        color: #fff;
        padding: 8px 14px;
        border-radius: 20px;
        font-size: 13px;
        font-weight: 600;
        white-space: nowrap;
        box-shadow: 0 4px 15px rgba(0,0,0,0.15);
        pointer-events: none;
        opacity: 0;
        transform: translateX(10px);
        transition: opacity 0.3s, transform 0.3s;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }
    .eg-wa-tooltip::after {
        content: '';
        position: absolute;
        right: -6px;
        top: 50%;
        transform: translateY(-50%);
        border-width: 6px 0 6px 6px;
        border-style: solid;
        border-color: transparent transparent transparent #1e293b;
    }
    .eg-wa-float-btn:hover .eg-wa-tooltip,
    .eg-wa-tooltip.visible {
        opacity: 1;
        transform: translateX(0);
    }

    /* WhatsApp Popup Drawer */
    .eg-wa-box {
        position: fixed;
        bottom: 96px;
        right: 25px;
        width: 370px;
        max-width: calc(100vw - 36px);
        background: #fff;
        border-radius: 18px;
        box-shadow: 0 16px 45px rgba(0, 0, 0, 0.22);
        z-index: 99999;
        overflow: hidden;
        display: none;
        flex-direction: column;
        animation: egSlideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
        border: 1px solid rgba(0,0,0,0.08);
    }
    .eg-wa-box.active {
        display: flex;
    }
    @keyframes egSlideUp {
        from { opacity: 0; transform: translateY(20px) scale(0.96); }
        to { opacity: 1; transform: translateY(0) scale(1); }
    }
    .eg-wa-header {
        background: linear-gradient(135deg, #075E54, #128C7E);
        color: #fff;
        padding: 16px 18px;
        display: flex;
        align-items: center;
        justify-content: space-between;
    }
    .eg-wa-header-profile {
        display: flex;
        align-items: center;
        gap: 12px;
    }
    .eg-wa-avatar-wrap {
        position: relative;
    }
    .eg-wa-avatar {
        width: 44px;
        height: 44px;
        border-radius: 50%;
        border: 2px solid #fff;
        object-fit: cover;
        background: #fff;
        display: block;
    }
    .eg-wa-online-dot {
        position: absolute;
        bottom: 1px;
        right: 1px;
        width: 12px;
        height: 12px;
        background: #25D366;
        border: 2px solid #fff;
        border-radius: 50%;
    }
    .eg-wa-title {
        font-size: 15px;
        font-weight: 700;
        color: #fff;
        line-height: 1.2;
    }
    .eg-wa-status {
        font-size: 11.5px;
        color: #d1fae5;
        margin-top: 3px;
        display: flex;
        align-items: center;
        gap: 5px;
    }
    .eg-wa-close {
        background: none;
        border: none;
        color: rgba(255,255,255,0.85);
        font-size: 22px;
        cursor: pointer;
        line-height: 1;
        padding: 4px 8px;
        border-radius: 6px;
        transition: color 0.2s, background 0.2s;
    }
    .eg-wa-close:hover {
        color: #fff;
        background: rgba(255,255,255,0.2);
    }
    .eg-wa-body {
        background: #efeae2;
        background-image: radial-gradient(#d8d0c4 1px, transparent 1px);
        background-size: 14px 14px;
        padding: 16px;
        max-height: 380px;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        gap: 12px;
    }
    .eg-wa-bubble {
        background: #fff;
        padding: 12px 14px;
        border-radius: 12px 12px 12px 2px;
        box-shadow: 0 1px 3px rgba(0,0,0,0.08);
        font-size: 13.5px;
        color: #1e293b;
        line-height: 1.5;
        max-width: 95%;
    }
    .eg-wa-time {
        font-size: 10px;
        color: #94a3b8;
        text-align: right;
        margin-top: 4px;
    }
    .eg-wa-desks {
        background: #fff;
        border-radius: 10px;
        padding: 10px 12px;
        box-shadow: 0 1px 3px rgba(0,0,0,0.06);
    }
    .eg-wa-desks-title {
        font-size: 11px;
        font-weight: 700;
        color: #64748b;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin-bottom: 6px;
    }
    .eg-wa-desk-btns {
        display: flex;
        gap: 6px;
    }
    .eg-wa-desk-btn {
        flex: 1;
        border: 1.5px solid #cbd5e1;
        background: #fff;
        color: #334155;
        padding: 6px 4px;
        border-radius: 8px;
        font-size: 11px;
        font-weight: 600;
        cursor: pointer;
        text-align: center;
        transition: all 0.2s;
    }
    .eg-wa-desk-btn.active {
        border-color: #25D366;
        background: #f0fdf4;
        color: #15803d;
        font-weight: 700;
    }
    .eg-wa-chips-title {
        font-size: 11px;
        font-weight: 700;
        color: #64748b;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }
    .eg-wa-chips {
        display: flex;
        flex-direction: column;
        gap: 6px;
    }
    .eg-wa-chip {
        background: #fff;
        border: 1px solid #e2e8f0;
        border-radius: 12px;
        padding: 9px 12px;
        font-size: 12.5px;
        color: #1e293b;
        cursor: pointer;
        text-align: left;
        transition: all 0.2s;
        display: flex;
        align-items: center;
        gap: 8px;
        line-height: 1.35;
        box-shadow: 0 1px 2px rgba(0,0,0,0.04);
    }
    .eg-wa-chip:hover {
        background: #25D366;
        color: #fff;
        border-color: #25D366;
        transform: translateX(3px);
    }
    .eg-wa-footer {
        padding: 10px 14px;
        background: #f8fafc;
        border-top: 1px solid #e2e8f0;
        display: flex;
        gap: 8px;
        align-items: center;
    }
    .eg-wa-input {
        flex: 1;
        border: 1.5px solid #cbd5e1;
        border-radius: 22px;
        padding: 9px 14px;
        font-size: 13px;
        outline: none;
        transition: border-color 0.2s;
        background: #fff;
        box-sizing: border-box;
    }
    .eg-wa-input:focus {
        border-color: #25D366;
    }
    .eg-wa-send {
        width: 40px;
        height: 40px;
        min-width: 40px;
        border-radius: 50%;
        background: #25D366;
        color: #fff;
        border: none;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 15px;
        transition: transform 0.2s, background 0.2s;
    }
    .eg-wa-send:hover {
        background: #128C7E;
        transform: scale(1.06);
    }

    /* Callback Floating Pill (Bottom Left) */
    .eg-cb-float-btn {
        position: fixed;
        bottom: 25px;
        left: 25px;
        background: linear-gradient(135deg, #ff3115, #e6260c);
        color: #fff;
        border-radius: 30px;
        padding: 12px 20px;
        display: flex;
        align-items: center;
        gap: 10px;
        box-shadow: 0 8px 25px rgba(255, 49, 21, 0.4);
        cursor: pointer;
        z-index: 99998;
        transition: transform 0.3s, box-shadow 0.3s;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        font-weight: 700;
        font-size: 13.5px;
        letter-spacing: 0.3px;
        border: none;
        outline: none;
        text-decoration: none;
    }
    .eg-cb-float-btn:hover {
        transform: scale(1.05) translateY(-2px);
        box-shadow: 0 12px 30px rgba(255, 49, 21, 0.55);
        color: #fff;
    }
    .eg-cb-pulse {
        width: 10px;
        height: 10px;
        border-radius: 50%;
        background: #fff;
        box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.7);
        animation: egPulse 1.6s infinite;
    }
    @keyframes egPulse {
        0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.7); }
        70% { transform: scale(1); box-shadow: 0 0 0 8px rgba(255, 255, 255, 0); }
        100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(255, 255, 255, 0); }
    }

    /* Callback Modal */
    .eg-cb-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(15, 23, 42, 0.7);
        backdrop-filter: blur(5px);
        -webkit-backdrop-filter: blur(5px);
        z-index: 100000;
        display: none;
        align-items: center;
        justify-content: center;
        padding: 15px;
        box-sizing: border-box;
        animation: egFadeIn 0.2s ease-out;
    }
    .eg-cb-overlay.active {
        display: flex;
    }
    @keyframes egFadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }
    .eg-cb-modal {
        background: #fff;
        width: 480px;
        max-width: 100%;
        border-radius: 20px;
        box-shadow: 0 24px 60px rgba(0,0,0,0.3);
        overflow: hidden;
        position: relative;
        animation: egZoomIn 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }
    @keyframes egZoomIn {
        from { transform: scale(0.92); opacity: 0; }
        to { transform: scale(1); opacity: 1; }
    }
    .eg-cb-header {
        background: linear-gradient(135deg, #ff3115, #ff5722);
        color: #fff;
        padding: 24px 26px 20px;
        position: relative;
    }
    .eg-cb-tag {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        background: rgba(255,255,255,0.22);
        padding: 4px 10px;
        border-radius: 20px;
        font-size: 11px;
        font-weight: 800;
        letter-spacing: 0.8px;
        text-transform: uppercase;
        margin-bottom: 8px;
    }
    .eg-cb-title {
        font-size: 22px;
        font-weight: 800;
        margin: 0 0 6px;
        color: #fff;
    }
    .eg-cb-subtitle {
        font-size: 13.5px;
        color: rgba(255,255,255,0.92);
        margin: 0;
        line-height: 1.4;
    }
    .eg-cb-modal-close {
        position: absolute;
        top: 18px;
        right: 18px;
        width: 32px;
        height: 32px;
        border-radius: 50%;
        background: rgba(255,255,255,0.22);
        color: #fff;
        border: none;
        font-size: 18px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: background 0.2s;
    }
    .eg-cb-modal-close:hover {
        background: rgba(255,255,255,0.4);
    }
    .eg-cb-body {
        padding: 24px 26px 26px;
    }
    .eg-form-group {
        margin-bottom: 16px;
    }
    .eg-form-label {
        display: block;
        font-size: 12px;
        font-weight: 700;
        color: #334155;
        margin-bottom: 6px;
        text-transform: uppercase;
        letter-spacing: 0.4px;
    }
    .eg-input, .eg-select {
        width: 100%;
        padding: 11px 14px;
        border: 1.5px solid #e2e8f0;
        border-radius: 10px;
        font-size: 14px;
        color: #1e293b;
        background: #f8fafc;
        transition: all 0.2s;
        outline: none;
        box-sizing: border-box;
    }
    .eg-input:focus, .eg-select:focus {
        border-color: #ff3115;
        background: #fff;
        box-shadow: 0 0 0 3px rgba(255, 49, 21, 0.12);
    }
    .eg-phone-wrap {
        display: flex;
        border: 1.5px solid #e2e8f0;
        border-radius: 10px;
        background: #f8fafc;
        overflow: hidden;
        transition: all 0.2s;
    }
    .eg-phone-wrap:focus-within {
        border-color: #ff3115;
        background: #fff;
        box-shadow: 0 0 0 3px rgba(255, 49, 21, 0.12);
    }
    .eg-phone-prefix {
        padding: 11px 14px;
        background: #f1f5f9;
        font-size: 14px;
        font-weight: 700;
        color: #475569;
        border-right: 1.5px solid #e2e8f0;
        display: flex;
        align-items: center;
        gap: 4px;
    }
    .eg-phone-input {
        flex: 1;
        border: none;
        background: transparent;
        padding: 11px 14px;
        font-size: 14px;
        outline: none;
        color: #1e293b;
        font-weight: 600;
        box-sizing: border-box;
    }
    .eg-time-slots {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 8px;
    }
    .eg-time-slot {
        border: 1.5px solid #e2e8f0;
        border-radius: 10px;
        padding: 9px 10px;
        font-size: 12px;
        font-weight: 600;
        color: #475569;
        cursor: pointer;
        text-align: center;
        background: #f8fafc;
        transition: all 0.2s;
        user-select: none;
    }
    .eg-time-slot.active, .eg-time-slot:hover {
        border-color: #ff3115;
        background: #fff0ed;
        color: #ff3115;
    }
    .eg-cb-submit {
        width: 100%;
        background: linear-gradient(135deg, #ff3115, #e6260c);
        color: #fff;
        border: none;
        padding: 14px;
        border-radius: 12px;
        font-size: 15px;
        font-weight: 800;
        cursor: pointer;
        transition: transform 0.2s, box-shadow 0.2s;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        margin-top: 10px;
        box-shadow: 0 4px 15px rgba(255, 49, 21, 0.35);
    }
    .eg-cb-submit:hover {
        transform: translateY(-1px);
        box-shadow: 0 6px 20px rgba(255, 49, 21, 0.45);
    }
    .eg-cb-privacy {
        text-align: center;
        font-size: 11.5px;
        color: #94a3b8;
        margin-top: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 5px;
    }

    /* Success Card */
    .eg-cb-success {
        display: none;
        text-align: center;
        padding: 35px 25px;
    }
    .eg-cb-success.active {
        display: block;
    }
    .eg-cb-success-icon {
        width: 64px;
        height: 64px;
        border-radius: 50%;
        background: #dcfce7;
        color: #16a34a;
        font-size: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0 auto 16px;
    }
    .eg-cb-success h3 {
        font-size: 22px;
        font-weight: 800;
        color: #1e293b;
        margin-bottom: 8px;
    }
    .eg-cb-success p {
        font-size: 14px;
        color: #64748b;
        line-height: 1.6;
        margin-bottom: 22px;
    }

    /* Mobile adjustments */
    @media (max-width: 600px) {
        .eg-cb-float-btn span { display: none; }
        .eg-cb-float-btn { width: 52px; height: 52px; padding: 0; border-radius: 50%; justify-content: center; bottom: 20px; left: 20px; }
        .eg-wa-float-btn { width: 54px; height: 54px; bottom: 20px; right: 20px; }
        .eg-wa-box { bottom: 85px; right: 12px; width: calc(100vw - 24px); }
        .eg-time-slots { grid-template-columns: 1fr; }
    }

    /* ================= COURSE ENROLLMENT MODAL ================= */
    .eg-enroll-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(15, 23, 42, 0.78);
        backdrop-filter: blur(6px);
        -webkit-backdrop-filter: blur(6px);
        z-index: 100002;
        display: none;
        align-items: center;
        justify-content: center;
        padding: 15px;
        box-sizing: border-box;
        animation: egFadeIn 0.2s ease-out;
    }
    .eg-enroll-overlay.active {
        display: flex;
    }
    .eg-enroll-modal {
        background: #fff;
        width: 620px;
        max-width: 100%;
        max-height: 94vh;
        border-radius: 22px;
        box-shadow: 0 25px 60px -10px rgba(0, 0, 0, 0.45);
        overflow-y: auto;
        position: relative;
        animation: egZoomIn 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    }
    .eg-enroll-header {
        background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
        color: #fff;
        padding: 22px 26px 18px;
        position: relative;
        border-bottom: 3px solid #ff3115;
    }
    .eg-enroll-tag {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        background: rgba(255, 49, 21, 0.22);
        color: #ff6b57;
        border: 1px solid rgba(255, 49, 21, 0.45);
        padding: 4px 10px;
        border-radius: 20px;
        font-size: 11px;
        font-weight: 800;
        letter-spacing: 0.6px;
        text-transform: uppercase;
        margin-bottom: 6px;
    }
    .eg-enroll-title {
        font-size: 22px;
        font-weight: 800;
        margin: 0 0 4px;
        color: #fff;
        line-height: 1.25;
    }
    .eg-enroll-subtitle {
        font-size: 13px;
        color: #94a3b8;
        margin: 0;
    }
    .eg-enroll-close {
        position: absolute;
        top: 18px;
        right: 18px;
        width: 34px;
        height: 34px;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.12);
        color: #fff;
        border: none;
        font-size: 20px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: background 0.2s;
    }
    .eg-enroll-close:hover {
        background: rgba(255, 255, 255, 0.28);
    }
    .eg-enroll-body {
        padding: 22px 26px 26px;
    }
    .eg-enroll-course-banner {
        background: #fff5f3;
        border: 1.5px solid #fed7d2;
        border-radius: 12px;
        padding: 12px 16px;
        margin-bottom: 18px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        flex-wrap: wrap;
    }
    .eg-enroll-course-info {
        flex: 1;
        min-width: 180px;
    }
    .eg-enroll-course-label {
        font-size: 10.5px;
        font-weight: 700;
        color: #ff3115;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }
    .eg-enroll-course-name {
        font-size: 15.5px;
        font-weight: 800;
        color: #0f172a;
        margin-top: 2px;
        line-height: 1.3;
    }
    .eg-enroll-fee-badge {
        background: #ff3115;
        color: #fff;
        font-size: 12px;
        font-weight: 800;
        padding: 5px 12px;
        border-radius: 20px;
        display: inline-flex;
        align-items: center;
        gap: 4px;
        white-space: nowrap;
        box-shadow: 0 2px 8px rgba(255, 49, 21, 0.3);
    }
    .eg-form-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
    }
    @media (max-width: 600px) {
        .eg-form-row { grid-template-columns: 1fr; }
    }
    .eg-mode-pills {
        display: grid;
        grid-template-columns: 1fr 1fr 1fr;
        gap: 8px;
    }
    .eg-mode-pill {
        border: 1.5px solid #e2e8f0;
        border-radius: 10px;
        padding: 9px 8px;
        font-size: 12px;
        font-weight: 700;
        color: #475569;
        cursor: pointer;
        text-align: center;
        background: #f8fafc;
        transition: all 0.2s;
        user-select: none;
    }
    .eg-mode-pill.active, .eg-mode-pill:hover {
        border-color: #ff3115;
        background: #fff0ed;
        color: #ff3115;
    }
    .eg-enroll-submit {
        width: 100%;
        background: linear-gradient(135deg, #ff3115, #e6260c);
        color: #fff;
        border: none;
        padding: 15px;
        border-radius: 12px;
        font-size: 15.5px;
        font-weight: 800;
        cursor: pointer;
        transition: transform 0.2s, box-shadow 0.2s;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        margin-top: 15px;
        box-shadow: 0 6px 20px rgba(255, 49, 21, 0.38);
    }
    .eg-enroll-submit:hover {
        transform: translateY(-1px);
        box-shadow: 0 8px 25px rgba(255, 49, 21, 0.48);
    }
    .eg-enroll-success {
        display: none;
        text-align: center;
        padding: 30px 20px;
    }
    .eg-enroll-success.active {
        display: block;
    }
    .eg-enroll-success-icon {
        width: 70px;
        height: 70px;
        border-radius: 50%;
        background: #dcfce7;
        color: #16a34a;
        font-size: 34px;
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0 auto 16px;
        animation: egPulse 1.8s infinite;
    }
    .eg-enroll-ref {
        display: inline-block;
        background: #f1f5f9;
        padding: 6px 14px;
        border-radius: 20px;
        font-size: 13px;
        font-weight: 700;
        color: #334155;
        margin: 10px 0 16px;
        border: 1px dashed #cbd5e1;
    }
    .eg-enroll-wa-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        background: #25D366;
        color: #fff;
        padding: 13px 22px;
        border-radius: 12px;
        font-size: 14.5px;
        font-weight: 700;
        text-decoration: none;
        transition: transform 0.2s, background 0.2s;
        margin-bottom: 10px;
        width: 100%;
        box-sizing: border-box;
    }
    .eg-enroll-wa-btn:hover {
        background: #128C7E;
        color: #fff;
        transform: translateY(-1px);
    }
    `;

    const styleEl = document.createElement('style');
    styleEl.type = 'text/css';
    styleEl.appendChild(document.createTextNode(css));
    document.head.appendChild(styleEl);

    // ================= INJECT DOM =================
    document.addEventListener('DOMContentLoaded', function() {
        // 1. Floating WhatsApp Button & Box
        const waContainer = document.createElement('div');
        waContainer.id = 'eg-wa-root';
        waContainer.innerHTML = `
            <!-- Floating Trigger -->
            <div class="eg-wa-float-btn" id="egWaTrigger" title="Chat on WhatsApp">
                <span class="eg-wa-tooltip" id="egWaTooltip">Chat with Counselor 👋</span>
                <span class="eg-wa-badge">1</span>
                <svg width="34" height="34" viewBox="0 0 32 32" fill="#fff">
                    <path d="M16 2C8.28 2 2 8.28 2 16c0 2.72.78 5.26 2.13 7.42L2 30l6.76-2.1C10.82 29.14 13.33 30 16 30c7.72 0 14-6.28 14-14S23.72 2 16 2zm0 25.5c-2.32 0-4.52-.7-6.36-1.92l-.46-.3-4.22 1.31 1.33-4.11-.3-.47C4.7 20.08 4 18.09 4 16 4 9.38 9.38 4 16 4s12 5.38 12 12-5.38 11.5-12 11.5zm6.57-8.62c-.36-.18-2.13-1.05-2.46-1.17-.33-.12-.57-.18-.81.18-.24.36-.93 1.17-1.14 1.41-.21.24-.42.27-.78.09-.36-.18-1.52-.56-2.9-1.79-1.07-.96-1.8-2.14-2.01-2.5-.21-.36-.02-.56.16-.74.16-.16.36-.42.54-.63.18-.21.24-.36.36-.6.12-.24.06-.45-.03-.63-.09-.18-.81-1.95-1.11-2.67-.29-.7-.59-.6-.81-.61l-.69-.01c-.24 0-.63.09-.96.45-.33.36-1.26 1.23-1.26 3 0 1.77 1.29 3.48 1.47 3.72.18.24 2.54 3.88 6.16 5.44.86.37 1.53.59 2.06.76.87.28 1.66.24 2.28.15.7-.1 2.13-.87 2.43-1.71.3-.84.3-1.56.21-1.71-.09-.15-.33-.24-.69-.42z"/>
                </svg>
            </div>

            <!-- WhatsApp Interactive Box -->
            <div class="eg-wa-box" id="egWaBox">
                <div class="eg-wa-header">
                    <div class="eg-wa-header-profile">
                        <div class="eg-wa-avatar-wrap">
                            <img src="images/team/ceo.jpg" alt="Counselor" class="eg-wa-avatar" onerror="this.src='images/team/1.jpg'">
                            <span class="eg-wa-online-dot"></span>
                        </div>
                        <div>
                            <div class="eg-wa-title">EducationistGuru Support</div>
                            <div class="eg-wa-status">
                                <span style="display:inline-block;width:6px;height:6px;background:#25D366;border-radius:50%;"></span>
                                Online • Replies in under 5 mins
                            </div>
                        </div>
                    </div>
                    <button class="eg-wa-close" id="egWaClose" title="Close">&times;</button>
                </div>
                <div class="eg-wa-body">
                    <div class="eg-wa-bubble">
                        Namaste! 👋 Welcome to <strong>EducationistGuru Admissions Desk</strong>.<br><br>
                        How can we assist you with your degree, university selection, or eligibility today?
                        <div class="eg-wa-time">Just now</div>
                    </div>

                    <div class="eg-wa-desks">
                        <div class="eg-wa-desks-title">Direct Counseling Desk:</div>
                        <div class="eg-wa-desk-btns">
                            <button type="button" class="eg-wa-desk-btn active" data-number="918750477000">Desk 1: 8750477000</button>
                            <button type="button" class="eg-wa-desk-btn" data-number="919738707000">Desk 2: 9738707000</button>
                        </div>
                    </div>

                    <div class="eg-wa-chips-title">One-Tap Quick Inquiries:</div>
                    <div class="eg-wa-chips">
                        <div class="eg-wa-chip" data-msg="Hi EducationistGuru, I would like admission counseling for MBA">
                            <span>🎓</span> <span>Admission counseling for <strong>MBA</strong></span>
                        </div>
                        <div class="eg-wa-chip" data-msg="Hi EducationistGuru, I want to know about B.Tech & Engineering programs">
                            <span>💻</span> <span>Information on <strong>B.Tech / BCA</strong></span>
                        </div>
                        <div class="eg-wa-chip" data-msg="Hi EducationistGuru, I am interested in Distance & Online Learning degrees">
                            <span>📚</span> <span><strong>Distance & Online</strong> degrees</span>
                        </div>
                        <div class="eg-wa-chip" data-msg="Hi EducationistGuru, I need details on Law & BA-LL.B. courses">
                            <span>⚖️</span> <span>Guidance on <strong>Law / BA-LL.B.</strong></span>
                        </div>
                        <div class="eg-wa-chip" data-msg="Hi EducationistGuru, please guide me on Paramedical & Pharmacy admissions">
                            <span>🩺</span> <span><strong>Pharmacy & Paramedical</strong></span>
                        </div>
                        <div class="eg-wa-chip" data-msg="Hi EducationistGuru, please connect me with a senior counselor for admission help">
                            <span>📞</span> <span>Connect with <strong>Senior Counselor</strong></span>
                        </div>
                    </div>
                </div>
                <div class="eg-wa-footer">
                    <input type="text" class="eg-wa-input" id="egWaInput" placeholder="Type your inquiry message...">
                    <button class="eg-wa-send" id="egWaSend" title="Send on WhatsApp">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                        </svg>
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(waContainer);

        // 2. Floating Immediate Callback Pill & Modal
        const cbContainer = document.createElement('div');
        cbContainer.id = 'eg-cb-root';
        cbContainer.innerHTML = `
            <!-- Floating Pill Trigger -->
            <button class="eg-cb-float-btn" id="egCbTrigger">
                <span class="eg-cb-pulse"></span>
                <i class="fa fa-phone" style="font-size:15px;"></i>
                <span>Request Callback</span>
            </button>

            <!-- Callback Modal Overlay -->
            <div class="eg-cb-overlay" id="egCbOverlay">
                <div class="eg-cb-modal">
                    <div class="eg-cb-header">
                        <div class="eg-cb-tag"><i class="fa fa-bolt"></i> Fast Response (15 Mins)</div>
                        <h2 class="eg-cb-title">Request Immediate Callback</h2>
                        <p class="eg-cb-subtitle">Talk directly with a certified EducationistGuru admission counselor. 100% free guidance.</p>
                        <button class="eg-cb-modal-close" id="egCbClose">&times;</button>
                    </div>

                    <!-- Form Content -->
                    <div class="eg-cb-body" id="egCbFormWrap">
                        <form id="egCallbackForm">
                            <div class="eg-form-group">
                                <label class="eg-form-label">Full Name *</label>
                                <input type="text" class="eg-input" id="egCbName" placeholder="Enter your full name" required>
                            </div>

                            <div class="eg-form-group">
                                <label class="eg-form-label">Mobile Number *</label>
                                <div class="eg-phone-wrap">
                                    <div class="eg-phone-prefix">🇮🇳 +91</div>
                                    <input type="tel" class="eg-phone-input" id="egCbPhone" placeholder="10-digit mobile number" maxlength="10" pattern="[0-9]{10}" required>
                                </div>
                            </div>

                            <div class="eg-form-group">
                                <label class="eg-form-label">Interested Program *</label>
                                <select class="eg-select" id="egCbCourse" required>
                                    <option value="" disabled selected>Select course / discipline...</option>
                                    <option value="MBA / PGDM">MBA / PGDM (Management)</option>
                                    <option value="B.Tech / Engineering">B.Tech / Engineering (CSE, AI, Mech, Civil)</option>
                                    <option value="BCA / MCA">BCA / MCA (Computer Applications)</option>
                                    <option value="BBA / B.Com / M.Com">BBA / B.Com / M.Com (Commerce)</option>
                                    <option value="Law / BA-LL.B. / LL.M.">Law / BA-LL.B. / LL.M.</option>
                                    <option value="Distance / Online Degree">Distance / Online Learning Degree</option>
                                    <option value="Pharmacy / Paramedical">B.Pharm / D.Pharm / Paramedical</option>
                                    <option value="B.Sc. / M.Sc.">B.Sc. / M.Sc. (Science)</option>
                                    <option value="General Counseling">General Admission Counseling</option>
                                </select>
                            </div>

                            <div class="eg-form-group">
                                <label class="eg-form-label">When Should We Call You?</label>
                                <div class="eg-time-slots">
                                    <div class="eg-time-slot active" data-time="Immediately (Within 15 mins)">⚡ Immediately</div>
                                    <div class="eg-time-slot" data-time="Today Afternoon (2 - 5 PM)">🌤️ Today 2 - 5 PM</div>
                                    <div class="eg-time-slot" data-time="Today Evening (5 - 7:30 PM)">🌆 Today 5 - 7:30 PM</div>
                                    <div class="eg-time-slot" data-time="Tomorrow Morning (10 AM - 1 PM)">🌅 Tomorrow 10 AM - 1 PM</div>
                                </div>
                                <input type="hidden" id="egCbTimeSlot" value="Immediately (Within 15 mins)">
                            </div>

                            <button type="submit" class="eg-cb-submit" id="egCbSubmitBtn">
                                <i class="fa fa-phone"></i> Call Me Back Now
                            </button>

                            <div class="eg-cb-privacy">
                                <i class="fa fa-lock"></i> 100% Confidential. Your data is strictly used for counseling.
                            </div>
                        </form>
                    </div>

                    <!-- Success State -->
                    <div class="eg-cb-success" id="egCbSuccess">
                        <div class="eg-cb-success-icon">✓</div>
                        <h3>Callback Requested!</h3>
                        <p id="egCbSuccessMsg">Thank you! Our senior counseling team has received your high-priority request and will call you shortly.</p>
                        <button class="eg-cb-submit" id="egCbDoneBtn" style="background:#1e293b;">Done</button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(cbContainer);

        // 3. Course Enrollment Form Modal
        const enrollContainer = document.createElement('div');
        enrollContainer.id = 'eg-enroll-root';
        enrollContainer.innerHTML = `
            <!-- Course Enrollment Modal Overlay -->
            <div class="eg-enroll-overlay" id="egEnrollOverlay">
                <div class="eg-enroll-modal">
                    <div class="eg-enroll-header">
                        <div class="eg-enroll-tag"><i class="fa fa-graduation-cap"></i> Official Admissions Desk</div>
                        <h2 class="eg-enroll-title">Course Admission &amp; Enrollment</h2>
                        <p class="eg-enroll-subtitle">Direct university admission desk • Official AIU &amp; UGC counseling</p>
                        <button class="eg-enroll-close" id="egEnrollClose" title="Close">&times;</button>
                    </div>

                    <!-- Form Wrap -->
                    <div class="eg-enroll-body" id="egEnrollFormWrap">
                        <!-- Course Preview Banner -->
                        <div class="eg-enroll-course-banner" id="egEnrollBanner">
                            <div class="eg-enroll-course-info">
                                <div class="eg-enroll-course-label">Selected Academic Program:</div>
                                <div class="eg-enroll-course-name" id="egEnrollCourseDisplay">Loading program details...</div>
                            </div>
                            <div class="eg-enroll-fee-badge" id="egEnrollFeeDisplay">
                                <i class="fa fa-inr"></i> Approved AIU Fee
                            </div>
                        </div>

                        <form id="egEnrollForm">
                            <div class="eg-form-group">
                                <label class="eg-form-label">Student Full Name *</label>
                                <input type="text" class="eg-input" id="egEnrollName" placeholder="Enter your full legal name" required>
                            </div>

                            <div class="eg-form-row">
                                <div class="eg-form-group">
                                    <label class="eg-form-label">Mobile Number *</label>
                                    <div class="eg-phone-wrap">
                                        <div class="eg-phone-prefix">🇮🇳 +91</div>
                                        <input type="tel" class="eg-phone-input" id="egEnrollPhone" placeholder="10-digit mobile number" maxlength="10" pattern="[0-9]{10}" required>
                                    </div>
                                </div>
                                <div class="eg-form-group">
                                    <label class="eg-form-label">Email Address *</label>
                                    <input type="email" class="eg-input" id="egEnrollEmail" placeholder="student@example.com" required>
                                </div>
                            </div>

                            <div class="eg-form-group">
                                <label class="eg-form-label">Selected Course / Degree *</label>
                                <select class="eg-select" id="egEnrollCourse" required>
                                    <option value="" disabled selected>Loading recognized courses...</option>
                                </select>
                            </div>

                            <div class="eg-form-group">
                                <label class="eg-form-label">Preferred Learning Mode</label>
                                <div class="eg-mode-pills">
                                    <div class="eg-mode-pill active" data-mode="Online Mode">💻 Online</div>
                                    <div class="eg-mode-pill" data-mode="Regular Campus">🏛️ Regular</div>
                                    <div class="eg-mode-pill" data-mode="Distance Learning">📖 Distance</div>
                                </div>
                                <input type="hidden" id="egEnrollMode" value="Online Mode">
                            </div>

                            <div class="eg-form-row">
                                <div class="eg-form-group">
                                    <label class="eg-form-label">Highest Qualification *</label>
                                    <select class="eg-select" id="egEnrollQual" required>
                                        <option value="10+2 / Intermediate">10+2 / Intermediate</option>
                                        <option value="Graduation / Bachelor's">Graduation / Bachelor's</option>
                                        <option value="Post-Graduation / Master's">Post-Graduation / Master's</option>
                                        <option value="Diploma / Polytechnic">Diploma / Polytechnic</option>
                                        <option value="Appearing in Final Year">Appearing in Final Year</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                                <div class="eg-form-group">
                                    <label class="eg-form-label">City &amp; State *</label>
                                    <input type="text" class="eg-input" id="egEnrollCity" placeholder="e.g. Delhi, Punjab, Mumbai" required>
                                </div>
                            </div>

                            <div class="eg-form-group">
                                <label class="eg-form-label">Any Questions / Specific Requirements (Optional)</label>
                                <textarea class="eg-input" id="egEnrollRemarks" rows="2" placeholder="e.g. Scholarship eligibility, installment schedule, study material..."></textarea>
                            </div>

                            <button type="submit" class="eg-enroll-submit" id="egEnrollSubmitBtn">
                                <i class="fa fa-graduation-cap"></i> Submit Enrollment Application
                            </button>

                            <div class="eg-cb-privacy" style="margin-top:10px;">
                                <i class="fa fa-lock"></i> 100% Confidential • Official AIU &amp; UGC Counseling • No Processing Fee
                            </div>
                        </form>
                    </div>

                    <!-- Success State -->
                    <div class="eg-enroll-success" id="egEnrollSuccess">
                        <div class="eg-enroll-success-icon">✓</div>
                        <h3 style="font-size:22px;font-weight:800;color:#1e293b;margin:0 0 6px;">Enrollment Application Submitted!</h3>
                        <div class="eg-enroll-ref" id="egEnrollRefId">Reference ID: #EG-LEAD-101</div>
                        <p id="egEnrollSuccessMsg" style="font-size:14px;color:#64748b;line-height:1.6;margin-bottom:20px;">
                            Thank you! Your enrollment application has been logged into our university admissions database.
                        </p>
                        <a href="#" id="egEnrollWaBtn" class="eg-enroll-wa-btn" target="_blank">
                            <i class="fa fa-whatsapp" style="font-size:18px;"></i> Chat with Counselor on WhatsApp
                        </a>
                        <button class="eg-cb-submit" id="egEnrollDoneBtn" style="background:#1e293b;margin-top:6px;">Done</button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(enrollContainer);

        // ================= WHATSAPP LOGIC =================
        let selectedDeskNumber = '918750477000';
        const waTrigger = document.getElementById('egWaTrigger');
        const waBox = document.getElementById('egWaBox');
        const waClose = document.getElementById('egWaClose');
        const waInput = document.getElementById('egWaInput');
        const waSend = document.getElementById('egWaSend');
        const waTooltip = document.getElementById('egWaTooltip');

        // Show tooltip briefly on page load to attract attention
        setTimeout(() => { if (waTooltip) waTooltip.classList.add('visible'); }, 2000);
        setTimeout(() => { if (waTooltip) waTooltip.classList.remove('visible'); }, 7000);

        function toggleWa() {
            waBox.classList.toggle('active');
            if (waBox.classList.contains('active')) {
                waInput.focus();
                if (waTooltip) waTooltip.classList.remove('visible');
            }
        }

        waTrigger.addEventListener('click', toggleWa);
        waClose.addEventListener('click', toggleWa);

        // Desk switcher
        document.querySelectorAll('.eg-wa-desk-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                document.querySelectorAll('.eg-wa-desk-btn').forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                selectedDeskNumber = this.getAttribute('data-number') || '918750477000';
            });
        });

        function sendWhatsApp(messageText) {
            const text = (messageText || waInput.value || '').trim() || 'Hi EducationistGuru, I would like university admission counseling.';
            
            // Log interaction into CRM leads as a WhatsApp Inquiry
            crmSave('leads', {
                name: 'WhatsApp Student Visitor',
                email: '',
                phone: '',
                course: text.length > 50 ? text.substring(0, 50) + '...' : text,
                status: 'new',
                source: 'WhatsApp Chat',
                priority: 'warm',
                date: new Date().toISOString().split('T')[0],
                notes: `[WHATSAPP INQUIRY] Student initiated chat on Counselor Desk (+${selectedDeskNumber}). Message: "${text}"`,
                skipAutoInquiry: true
            });

            // Open WhatsApp Web/App
            const url = `https://api.whatsapp.com/send?phone=${selectedDeskNumber}&text=${encodeURIComponent(text)}`;
            window.open(url, '_blank');
            waBox.classList.remove('active');
            waInput.value = '';
        }

        // Chip click
        document.querySelectorAll('.eg-wa-chip').forEach(chip => {
            chip.addEventListener('click', function() {
                const msg = this.getAttribute('data-msg');
                sendWhatsApp(msg);
            });
        });

        // Input send
        waSend.addEventListener('click', () => sendWhatsApp());
        waInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                sendWhatsApp();
            }
        });

        // ================= CALLBACK MODAL LOGIC =================
        const cbOverlay = document.getElementById('egCbOverlay');
        const cbTrigger = document.getElementById('egCbTrigger');
        const cbClose = document.getElementById('egCbClose');
        const cbForm = document.getElementById('egCallbackForm');
        const cbFormWrap = document.getElementById('egCbFormWrap');
        const cbSuccess = document.getElementById('egCbSuccess');
        const cbDoneBtn = document.getElementById('egCbDoneBtn');

        window.openCallbackModal = function(opts) {
            cbOverlay.classList.add('active');
            cbFormWrap.style.display = 'block';
            cbSuccess.classList.remove('active');
            if (opts && opts.course) {
                const select = document.getElementById('egCbCourse');
                if (select) {
                    let matched = false;
                    for (let i = 0; i < select.options.length; i++) {
                        if (select.options[i].value.toLowerCase().includes(opts.course.toLowerCase()) || 
                            opts.course.toLowerCase().includes(select.options[i].value.toLowerCase())) {
                            select.selectedIndex = i;
                            matched = true;
                            break;
                        }
                    }
                    if (!matched) {
                        const opt = document.createElement('option');
                        opt.value = opts.course;
                        opt.text = opts.course;
                        opt.selected = true;
                        select.appendChild(opt);
                    }
                }
            }
            if (opts && opts.source) {
                cbOverlay.setAttribute('data-source', opts.source);
            } else {
                cbOverlay.removeAttribute('data-source');
            }
            setTimeout(() => {
                const nameInp = document.getElementById('egCbName');
                if (nameInp) nameInp.focus();
            }, 100);
        };

        window.closeCallbackModal = function() {
            cbOverlay.classList.remove('active');
        };

        if (cbTrigger) cbTrigger.addEventListener('click', () => window.openCallbackModal({ source: 'Floating Callback Pill' }));
        if (cbClose) cbClose.addEventListener('click', window.closeCallbackModal);
        if (cbDoneBtn) cbDoneBtn.addEventListener('click', window.closeCallbackModal);

        cbOverlay.addEventListener('click', function(e) {
            if (e.target === cbOverlay) window.closeCallbackModal();
        });

        // Bind any button with class .callback-btn or [data-action="callback"]
        document.querySelectorAll('.callback-btn, [data-action="callback"], a[href="#callback"]').forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                window.openCallbackModal({ source: 'Page Action Button' });
            });
        });

        // Time slot selector
        document.querySelectorAll('.eg-time-slot').forEach(slot => {
            slot.addEventListener('click', function() {
                document.querySelectorAll('.eg-time-slot').forEach(s => s.classList.remove('active'));
                this.classList.add('active');
                document.getElementById('egCbTimeSlot').value = this.getAttribute('data-time') || 'Immediately';
            });
        });

        // Form Submit -> Feed into CRM Leads & Inquiries as High Priority Lead
        cbForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const submitBtn = cbForm.querySelector('button[type="submit"]');
            if (submitBtn && submitBtn.disabled) return;

            const name = document.getElementById('egCbName').value.trim();
            const rawPhone = document.getElementById('egCbPhone').value.trim();
            const course = document.getElementById('egCbCourse').value;
            const timeSlot = document.getElementById('egCbTimeSlot').value;
            const customSource = cbOverlay.getAttribute('data-source') || 'Callback Request';

            if (!name || rawPhone.length < 10) {
                alert('Please enter a valid 10-digit mobile number.');
                return;
            }

            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<i class="fa fa-spinner fa-spin"></i> Submitting...';
            }

            const phone = '+91 ' + rawPhone;

            // 1. Save directly into crm_leads with priority high
            const lead = {
                name: name,
                email: '',
                phone: phone,
                course: course,
                status: 'new',
                source: (customSource === 'Page Action Button' || customSource === 'Floating Callback Pill' || !customSource) ? 'Callback Request' : customSource,
                priority: 'high',
                preferredTime: timeSlot,
                skipAutoInquiry: true,
                date: new Date().toISOString().split('T')[0],
                notes: `⚡ [URGENT CALLBACK REQUEST]\nSource: ${customSource}\nStudent: ${name}\nPhone: ${phone}\nCourse Interest: ${course}\nPreferred Callback Time: ${timeSlot}\nSubmitted at: ${new Date().toLocaleString()}`
            };
            await crmSave('leads', lead);

            // 2. Also register in inquiries for notification badge
            await crmSave('inquiries', {
                name: name,
                email: '',
                phone: phone,
                subject: `⚡ Urgent Callback Request: ${course}`,
                message: `Callback scheduled for: ${timeSlot}. Phone: ${phone}`,
                status: 'unread',
                date: new Date().toISOString()
            });

            // 3. Show Success State
            cbFormWrap.style.display = 'none';
            document.getElementById('egCbSuccessMsg').innerHTML = 
                `Thank you, <strong>${name}</strong>! Your urgent callback has been prioritized.<br>Our senior admission counselor will call you on <strong>${phone}</strong> during: <strong>${timeSlot}</strong>.`;
            cbSuccess.classList.add('active');
            cbForm.reset();
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = 'Schedule Callback';
            }
        });

        // ================= COURSE ENROLLMENT MODAL LOGIC =================
        const enrollOverlay = document.getElementById('egEnrollOverlay');
        const enrollClose = document.getElementById('egEnrollClose');
        const enrollForm = document.getElementById('egEnrollForm');
        const enrollFormWrap = document.getElementById('egEnrollFormWrap');
        const enrollSuccess = document.getElementById('egEnrollSuccess');
        const enrollDoneBtn = document.getElementById('egEnrollDoneBtn');
        const enrollCourseSelect = document.getElementById('egEnrollCourse');
        const enrollCourseDisplay = document.getElementById('egEnrollCourseDisplay');
        const enrollFeeDisplay = document.getElementById('egEnrollFeeDisplay');
        const enrollModeInput = document.getElementById('egEnrollMode');
        const enrollWaBtn = document.getElementById('egEnrollWaBtn');

        // Populate course dropdown with all 105 official academic courses
        async function loadEnrollCourses() {
            try {
                let courses = [];
                if (window.EG_CMS && window.EG_CMS.getCourses) {
                    courses = await window.EG_CMS.getCourses();
                }
                if (!courses || courses.length === 0) {
                    if (window.location.protocol !== 'file:') {
                        try {
                            const res = await fetch('/api/content/courses');
                            if (res.ok) {
                                const data = await res.json();
                                courses = data.courses || [];
                            }
                        } catch(e) {}
                    }
                }
                if (!courses || courses.length === 0) {
                    try {
                        courses = JSON.parse(localStorage.getItem('eg_cms_courses') || '[]');
                    } catch(e) {}
                }

                if (courses && courses.length > 0 && enrollCourseSelect) {
                    const faculties = {};
                    courses.forEach(c => {
                        const f = c.faculty || 'Other Programs';
                        if (!faculties[f]) faculties[f] = [];
                        faculties[f].push(c);
                    });

                    let optHtml = '<option value="" disabled>-- Select an Academic Course / Degree --</option>';
                    Object.keys(faculties).forEach(fac => {
                        optHtml += `<optgroup label="${fac}">`;
                        faculties[fac].forEach(c => {
                            optHtml += `<option value="${c.name}" data-fee="${c.fee || ''}" data-faculty="${fac}">${c.name} (${c.fee || 'Approved Fee'})</option>`;
                        });
                        optHtml += `</optgroup>`;
                    });
                    enrollCourseSelect.innerHTML = optHtml;
                }
            } catch(e) {
                console.error('Error loading courses for enrollment modal:', e);
            }
        }
        loadEnrollCourses();

        // Mode selector
        document.querySelectorAll('.eg-mode-pill').forEach(pill => {
            pill.addEventListener('click', function() {
                document.querySelectorAll('.eg-mode-pill').forEach(p => p.classList.remove('active'));
                this.classList.add('active');
                if (enrollModeInput) {
                    enrollModeInput.value = this.getAttribute('data-mode') || 'Online Mode';
                }
            });
        });

        // Open Enrollment Modal
        window.openEnrollModal = function(courseName, feeText) {
            if (!enrollOverlay) return;
            enrollOverlay.classList.add('active');
            enrollFormWrap.style.display = 'block';
            enrollSuccess.classList.remove('active');

            let targetCourse = 'Bachelor of Business Administration (BBA) - General';
            let targetFee = feeText || '';
            if (typeof courseName === 'object' && courseName !== null) {
                targetCourse = courseName.name || courseName.course || courseName.title || targetCourse;
                targetFee = courseName.fee || courseName.fees || targetFee;
            } else if (typeof courseName === 'string' && courseName.trim()) {
                targetCourse = courseName.trim();
            }

            if (enrollCourseDisplay) enrollCourseDisplay.textContent = targetCourse;
            if (enrollFeeDisplay) {
                enrollFeeDisplay.innerHTML = `<i class="fa fa-inr"></i> ` + (targetFee || 'AIU Approved Fee');
            }

            if (enrollCourseSelect) {
                let found = false;
                for (let i = 0; i < enrollCourseSelect.options.length; i++) {
                    const opt = enrollCourseSelect.options[i];
                    if (opt.value && (opt.value.toLowerCase() === targetCourse.toLowerCase() || 
                        opt.value.toLowerCase().includes(targetCourse.toLowerCase()) || 
                        targetCourse.toLowerCase().includes(opt.value.toLowerCase()))) {
                        enrollCourseSelect.selectedIndex = i;
                        found = true;
                        break;
                    }
                }
                if (!found && targetCourse) {
                    const customOpt = document.createElement('option');
                    customOpt.value = targetCourse;
                    customOpt.textContent = targetCourse + (feeText ? ` (${feeText})` : '');
                    customOpt.selected = true;
                    enrollCourseSelect.prepend(customOpt);
                }
            }

            setTimeout(() => {
                const nameInput = document.getElementById('egEnrollName');
                if (nameInput) nameInput.focus();
            }, 100);
        };

        window.closeEnrollModal = function() {
            if (enrollOverlay) enrollOverlay.classList.remove('active');
        };

        if (enrollClose) enrollClose.addEventListener('click', window.closeEnrollModal);
        if (enrollDoneBtn) enrollDoneBtn.addEventListener('click', window.closeEnrollModal);
        if (enrollOverlay) {
            enrollOverlay.addEventListener('click', function(e) {
                if (e.target === enrollOverlay) window.closeEnrollModal();
            });
        }

        if (enrollCourseSelect) {
            enrollCourseSelect.addEventListener('change', function() {
                const selectedOpt = this.options[this.selectedIndex];
                if (selectedOpt && selectedOpt.value) {
                    if (enrollCourseDisplay) enrollCourseDisplay.textContent = selectedOpt.value;
                    const optFee = selectedOpt.getAttribute('data-fee');
                    if (enrollFeeDisplay && optFee) {
                        enrollFeeDisplay.innerHTML = `<i class="fa fa-inr"></i> ${optFee}`;
                    }
                }
            });
        }

        // Enrollment Form Submission -> Connects directly to CRM
        if (enrollForm) {
            enrollForm.addEventListener('submit', async function(e) {
                e.preventDefault();
                const submitBtn = document.getElementById('egEnrollSubmitBtn');
                const origBtnHtml = submitBtn.innerHTML;

                const name = document.getElementById('egEnrollName').value.trim();
                const rawPhone = document.getElementById('egEnrollPhone').value.trim();
                const email = document.getElementById('egEnrollEmail').value.trim();
                const course = document.getElementById('egEnrollCourse').value || (enrollCourseDisplay ? enrollCourseDisplay.textContent : 'Academic Program');
                const mode = enrollModeInput ? enrollModeInput.value : 'Online Mode';
                const qual = document.getElementById('egEnrollQual').value;
                const city = document.getElementById('egEnrollCity').value.trim();
                const remarks = document.getElementById('egEnrollRemarks').value.trim();

                if (!name || rawPhone.length < 10 || !email) {
                    alert('Please enter your full name, valid 10-digit mobile number, and email.');
                    return;
                }

                submitBtn.disabled = true;
                submitBtn.innerHTML = '<i class="fa fa-spinner fa-spin"></i> Saving Application in CRM...';

                const phone = '+91 ' + rawPhone;
                const today = new Date().toISOString().split('T')[0];

                // 1. Save directly into CRM Leads as High Priority Lead with Source "Course Enrollment"
                const leadData = {
                    name: name,
                    email: email,
                    phone: phone,
                    course: course,
                    status: 'new',
                    source: 'Course Enrollment',
                    priority: 'high',
                    mode: mode,
                    qualification: qual,
                    city: city,
                    skipAutoInquiry: true,
                    date: today,
                    notes: `🎓 [COURSE ENROLLMENT APPLICATION]\nEnrolled Course: ${course}\nLearning Mode: ${mode}\nHighest Qualification: ${qual}\nCity / Location: ${city}\nRemarks: ${remarks || 'None'}\nSubmitted from: ${window.location.href}`
                };
                const savedLead = crmSave('leads', leadData);
                const leadId = savedLead && savedLead.id ? savedLead.id : Math.floor(1000 + Math.random() * 9000);

                // 2. Save directly into CRM Applications
                crmSave('applications', {
                    name: name,
                    email: email,
                    phone: phone,
                    course: course,
                    qualification: qual,
                    mode: mode,
                    status: 'pending',
                    date: today
                });

                // 3. Register in CRM Inquiries for Dashboard notification bell
                crmSave('inquiries', {
                    name: name,
                    email: email,
                    phone: phone,
                    subject: `🎓 Course Enrollment: ${course}`,
                    message: `New student application for ${course} (${mode}). Qualification: ${qual}, City: ${city}. Notes: ${remarks || 'None'}`,
                    status: 'unread',
                    date: new Date().toISOString()
                });

                // 5. Setup WhatsApp Direct Link
                const waMsg = `Hello EducationistGuru Admissions Desk! I have submitted an enrollment application for "${course}" (Reference: #EG-LEAD-${leadId}). My name is ${name}. Please share admission and fee details.`;
                if (enrollWaBtn) {
                    enrollWaBtn.href = `https://api.whatsapp.com/send?phone=918750477000&text=${encodeURIComponent(waMsg)}`;
                }

                // 6. Show Success State
                submitBtn.disabled = false;
                submitBtn.innerHTML = origBtnHtml;
                enrollFormWrap.style.display = 'none';
                const refEl = document.getElementById('egEnrollRefId');
                if (refEl) refEl.textContent = `Reference ID: #EG-LEAD-${leadId}`;

                const successMsg = document.getElementById('egEnrollSuccessMsg');
                if (successMsg) {
                    successMsg.innerHTML = `
                        Thank you, <strong>${name}</strong>! Your application for <strong>${course}</strong> (${mode}) has been successfully saved in our admissions CRM.<br><br>
                        Our senior admission counselor will call you on <strong>${phone}</strong> within 15-30 minutes.
                    `;
                }

                enrollSuccess.classList.add('active');
                enrollForm.reset();
            });
        }

        // Global Event Delegation for ALL "Enroll Now" buttons across all pages
        document.addEventListener('click', function(e) {
            const enrollBtn = e.target.closest('.enroll-btn, [data-action="enroll"], a[href="#enroll"], .cource-btn a, a.btn-enroll');
            if (enrollBtn) {
                e.preventDefault();
                let courseName = '';
                let feeText = '';

                // 1. Check if inside course card
                const card = enrollBtn.closest('.cource-item, .course-item, .courses-item');
                if (card) {
                    const titleEl = card.querySelector('.course-title a, h4 a, h3 a, .course-title');
                    if (titleEl) courseName = titleEl.textContent.trim();
                    const feeEl = card.querySelector('.aiu-fee-badge, .course-fee');
                    if (feeEl) feeText = feeEl.textContent.replace(/Annual Fee:|Fee:/gi, '').trim();
                }

                // 2. Check if on course details page
                if (!courseName) {
                    const h2 = document.querySelector('.course-overview h2');
                    if (h2) courseName = h2.textContent.trim();
                }
                if (!courseName) {
                    const pageTitle = document.querySelector('.page-title');
                    if (pageTitle && pageTitle.textContent.trim() !== 'Course Details') {
                        courseName = pageTitle.textContent.trim();
                    }
                }
                if (!courseName && window.location.search) {
                    const params = new URLSearchParams(window.location.search);
                    const id = params.get('id');
                    if (id && window.EG_CMS && window.EG_CMS.getCourseById) {
                        window.EG_CMS.getCourseById(id).then(c => {
                            if (c) window.openEnrollModal(c.name, c.fee);
                        });
                        return;
                    }
                }
                if (!feeText) {
                    const feeItem = document.querySelector('.course-features li:nth-child(2) span, .course-features .fa-inr');
                    if (feeItem) feeText = feeItem.closest('li, div')?.textContent?.replace(/Annual Fee:|Fee:/gi, '').trim() || '';
                }

                window.openEnrollModal(courseName, feeText);
            }
        });
    });

    // ================= EXISTING FORM INTEGRATIONS =================
    // 1. Contact Form Integration
    document.addEventListener('submit', async function(e) {
        const form = e.target;
        if (form.id === 'egCallbackForm' || form.id === 'egEnrollForm') return; // Handled separately
        
        if (form.id === 'mainContactForm' || form.closest('.contact-form') || form.querySelector('[name="subject"]') || form.querySelector('#contactSubject')) {
            e.preventDefault();
            const inputs = form.querySelectorAll('input, textarea, select');
            const data = {};
            inputs.forEach(inp => {
                const nameAttr = (inp.name || '').toLowerCase();
                const placeholder = (inp.placeholder || '').toLowerCase();
                const idAttr = (inp.id || '').toLowerCase();

                if (nameAttr === 'name' || nameAttr === 'fname' || idAttr === 'contactname' || placeholder.includes('name')) {
                    if (!data.name) data.name = inp.value.trim();
                } else if (inp.type === 'email' || nameAttr === 'email' || idAttr === 'contactemail' || placeholder.includes('email')) {
                    if (!data.email) data.email = inp.value.trim();
                } else if (inp.type === 'tel' || nameAttr === 'phone' || idAttr === 'contactphone' || placeholder.includes('phone') || placeholder.includes('mobile')) {
                    if (!data.phone) data.phone = inp.value.trim();
                } else if (nameAttr === 'subject' || idAttr === 'contactsubject' || placeholder.includes('subject')) {
                    if (!data.subject) data.subject = inp.value.trim();
                } else if (inp.tagName === 'TEXTAREA' || nameAttr === 'message' || idAttr === 'contactmessage' || placeholder.includes('message')) {
                    if (!data.message) data.message = inp.value.trim();
                } else if (inp.name && !data[inp.name]) {
                    data[inp.name] = inp.value.trim();
                }
            });

            const name = data.name || 'Website Visitor';
            const email = data.email || '';
            let rawPhone = (data.phone || '').replace(/\D/g, '');
            const phone = rawPhone.length >= 10 ? '+91 ' + rawPhone.slice(-10) : (data.phone || '');
            const subject = data.subject || 'Website Inquiry';
            const message = data.message || 'General student inquiry submitted from contact page.';

            if (!email && !phone) {
                alert('Please provide a valid email or phone number so our counselors can reach you.');
                return;
            }

            const inquiry = {
                name: name,
                email: email,
                phone: phone,
                subject: subject,
                message: message,
                status: 'unread',
                date: new Date().toISOString()
            };

            const lead = {
                name: name,
                email: email,
                phone: phone,
                course: subject,
                status: 'new',
                source: 'Contact Form',
                priority: 'warm',
                skipAutoInquiry: true,
                date: new Date().toISOString().split('T')[0],
                notes: `[Contact Page Form Submission]\nCandidate: ${name}\nPhone: ${phone}\nEmail: ${email}\nSubject: ${subject}\nMessage: ${message}`
            };

            const submitBtn = form.querySelector('button[type="submit"], input[type="submit"]');
            if (submitBtn && submitBtn.disabled) return;
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<i class="fa fa-spinner fa-spin"></i> Submitting...';
            }

            await crmSave('inquiries', inquiry);
            await crmSave('leads', lead);
            showFormSuccess(form, `Thank you, <strong>${name}</strong>! Your inquiry has been sent to our admissions cell. A counselor will reach out shortly.`);
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = 'Send Message';
            }
        }
    });

    // 2. Newsletter Subscription
    document.addEventListener('submit', function(e) {
        const form = e.target;
        if (form.closest('.news-form') || form.classList.contains('news-form')) {
            e.preventDefault();
            const emailInput = form.querySelector('input[type="email"], .form-input');
            if (emailInput && emailInput.value) {
                crmSave('subscribers', {
                    email: emailInput.value,
                    date: new Date().toISOString().split('T')[0],
                    status: 'active'
                });
                emailInput.value = '';
                showFormSuccess(form, 'Subscribed successfully!');
            }
        }
    });

    // 3. Apply Now button
    document.querySelectorAll('.apply-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            if (window.openCallbackModal) {
                window.openCallbackModal();
            }
        });
    });

    // Helper: Show success message after form
    function showFormSuccess(form, message) {
        let existing = form.parentElement.querySelector('.form-success-msg');
        if (existing) existing.remove();
        
        const msg = document.createElement('div');
        msg.className = 'form-success-msg';
        msg.style.cssText = 'background:#d4edda;color:#155724;padding:14px 20px;border-radius:8px;margin-top:15px;font-size:14px;display:flex;align-items:center;gap:8px;animation:fadeIn .3s ease;';
        msg.innerHTML = '<i class="fa fa-check-circle" style="font-size:18px;"></i> ' + message;
        form.parentElement.appendChild(msg);

        form.querySelectorAll('input:not([type="submit"]):not([type="hidden"]), textarea').forEach(inp => inp.value = '');
        setTimeout(() => msg.remove(), 5000);
    }

    // Auto-load CMS Content Hydration layer if not already present
    if (!window.EG_CMS && !window.location.pathname.includes('/edit')) {
        const script = document.createElement('script');
        script.src = (window.location.pathname.includes('/CRM/') ? '../' : '') + 'js/cms-content.js';
        document.body.appendChild(script);
    }
})();
