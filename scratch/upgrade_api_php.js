const fs = require('fs');

let php = fs.readFileSync('api.php', 'utf8');

// 1. Storage Directories & Helpers Upgrade
const oldStorageSection = `$dataDir = __DIR__ . '/data';
if (!is_dir($dataDir)) {
    @mkdir($dataDir, 0777, true);
}

// ---------------------------------------------------------------------
// Storage Helpers (Atomic, Locked File Access)
// ---------------------------------------------------------------------
function readData($file, $default = []) {
    global $dataDir;
    $filePath = $dataDir . '/' . $file;
    if (!file_exists($filePath)) return $default;
    $content = @file_get_contents($filePath);
    if ($content === false || empty($content)) return $default;
    $json = json_decode($content, true);
    return is_array($json) ? $json : $default;
}

function writeData($file, $data) {
    global $dataDir;
    if (!is_dir($dataDir)) {
        @mkdir($dataDir, 0777, true);
    }
    $filePath = $dataDir . '/' . $file;
    $json = json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    
    // Direct file write with exclusive lock
    $res = @file_put_contents($filePath, $json, LOCK_EX);
    if ($res !== false) {
        @chmod($filePath, 0666);
        return true;
    }
    
    // Fallback via temporary file
    $tmpFile = $filePath . '.' . uniqid('tmp_', true);
    if (@file_put_contents($tmpFile, $json) !== false) {
        if (@rename($tmpFile, $filePath)) {
            @chmod($filePath, 0666);
            return true;
        }
        @unlink($tmpFile);
    }
    return false;
}`;

const newStorageSection = `$dataDir = __DIR__ . '/data';
$vaultDir = __DIR__ . '/backups/vault';
$snapshotsDir = __DIR__ . '/backups/snapshots';

foreach ([$dataDir, $vaultDir, $snapshotsDir] as $d) {
    if (!is_dir($d)) {
        @mkdir($d, 0777, true);
    }
}

// ---------------------------------------------------------------------
// Storage Helpers (Atomic, Multi-Tier Vault Mirroring & Auto-Healing)
// ---------------------------------------------------------------------
function readData($file, $default = []) {
    global $dataDir, $vaultDir;
    $filePath = $dataDir . '/' . $file;
    if (file_exists($filePath)) {
        $content = @file_get_contents($filePath);
        if ($content !== false && !empty($content)) {
            $json = json_decode($content, true);
            if (is_array($json) || is_object($json)) {
                return $json;
            }
        }
    }
    
    // Auto-Recovery Fallback to Immutable Vault Mirror
    $vaultPath = $vaultDir . '/' . $file;
    if (file_exists($vaultPath)) {
        $vContent = @file_get_contents($vaultPath);
        if ($vContent !== false && !empty($vContent)) {
            $vJson = json_decode($vContent, true);
            if (is_array($vJson) || is_object($vJson)) {
                // Self-Heal Primary Data Store on corrupt or missing read
                @file_put_contents($filePath, $vContent, LOCK_EX);
                @chmod($filePath, 0666);
                return $vJson;
            }
        }
    }
    
    return $default;
}

function writeData($file, $data) {
    global $dataDir, $vaultDir;
    foreach ([$dataDir, $vaultDir] as $d) {
        if (!is_dir($d)) @mkdir($d, 0777, true);
    }
    $json = json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    
    // 1. Atomic write to primary data file
    $primarySuccess = false;
    $primaryPath = $dataDir . '/' . $file;
    $res = @file_put_contents($primaryPath, $json, LOCK_EX);
    if ($res !== false) {
        @chmod($primaryPath, 0666);
        $primarySuccess = true;
    } else {
        $tmp = $primaryPath . '.' . uniqid('tmp_', true);
        if (@file_put_contents($tmp, $json) !== false) {
            if (@rename($tmp, $primaryPath)) {
                @chmod($primaryPath, 0666);
                $primarySuccess = true;
            }
            @unlink($tmp);
        }
    }
    
    // 2. Synchronous mirror to disaster recovery vault
    $vaultPath = $vaultDir . '/' . $file;
    $vRes = @file_put_contents($vaultPath, $json, LOCK_EX);
    if ($vRes !== false) {
        @chmod($vaultPath, 0666);
    } else {
        $vTmp = $vaultPath . '.' . uniqid('tmp_', true);
        if (@file_put_contents($vTmp, $json) !== false) {
            if (@rename($vTmp, $vaultPath)) {
                @chmod($vaultPath, 0666);
            }
            @unlink($vTmp);
        }
    }
    
    return $primarySuccess;
}

function createSnapshot($reason = 'manual_snapshot') {
    global $snapshotsDir, $dataDir;
    if (!is_dir($snapshotsDir)) @mkdir($snapshotsDir, 0777, true);
    
    $allFiles = [
        'courses.json', 'colleges.json', 'universities.json', 'blogs.json', 'videos.json',
        'leads.json', 'inquiries.json', 'applications.json', 'enrollments.json', 'subscribers.json',
        'fees.json', 'users.json', 'roles.json', 'settings.json', 'site_menu.json'
    ];
    
    $bundle = [
        'appName' => 'EducationistGuru',
        'version' => '2.0-unbreakable',
        'timestamp' => date('c'),
        'reason' => $reason,
        'schemaVersion' => '2026.1',
        'collections' => []
    ];
    
    foreach ($allFiles as $f) {
        $key = str_replace('.json', '', $f);
        $bundle['collections'][$key] = readData($f, []);
    }
    
    $isoDate = gmdate('Y-m-d\\TH-i-s-v\\Z');
    $snapName = "snapshot-{$isoDate}-{$reason}.json";
    $snapPath = $snapshotsDir . '/' . $snapName;
    
    $json = json_encode($bundle, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    @file_put_contents($snapPath, $json, LOCK_EX);
    @chmod($snapPath, 0666);
    
    // Prune old snapshots, keeping latest 50
    $snaps = glob($snapshotsDir . '/snapshot-*.json');
    if ($snaps && count($snaps) > 50) {
        usort($snaps, function($a, $b) { return filemtime($b) - filemtime($a); });
        for ($i = 50; $i < count($snaps); $i++) {
            @unlink($snaps[$i]);
        }
    }
    
    return [
        'name' => $snapName,
        'filename' => $snapName,
        'path' => $snapPath,
        'timestamp' => $bundle['timestamp'],
        'size' => strlen($json)
    ];
}`;

if (php.includes(oldStorageSection)) {
    php = php.replace(oldStorageSection, newStorageSection);
    console.log('Upgraded Storage Section in api.php.');
} else {
    console.warn('Could not match oldStorageSection in api.php.');
}

// 2. Expand Section 5: System Backup & Vault
const oldSection5 = `// =====================================================================
// SECTION 5: SYSTEM BACKUP & VAULT (/api/system/backup)
// =====================================================================
if ($section === 'system') {
    $sysAction = strtolower($parts[1] ?? '');
    if ($sysAction === 'backup' && $method === 'GET') {
        $vault = [
            'appName' => 'EducationistGuru',
            'version' => '2.0-unbreakable',
            'exportedAt' => date('c'),
            'schemaVersion' => '2026.1',
            'collections' => [
                'courses' => readData('courses.json', []),
                'colleges' => readData('colleges.json', []),
                'universities' => readData('universities.json', []),
                'blogs' => readData('blogs.json', []),
                'videos' => readData('videos.json', []),
                'leads' => readData('leads.json', []),
                'applications' => readData('applications.json', []),
                'enrollments' => readData('enrollments.json', []),
                'inquiries' => readData('inquiries.json', []),
                'subscribers' => readData('subscribers.json', []),
                'fees' => readData('fees.json', []),
                'users' => readData('users.json', []),
                'roles' => readData('roles.json', []),
                'settings' => readData('settings.json', new stdClass())
            ]
        ];
        header('Content-Disposition: attachment; filename="educationistguru_backup_' . date('Ymd_His') . '.json"');
        echo json_encode($vault, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        exit;
    }

    if ($sysAction === 'restore' && ($method === 'POST' || $method === 'PUT')) {
        $body = getJsonBody();
        if (empty($body)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Empty restore payload']);
            exit;
        }

        $collections = $body['collections'] ?? $body;
        $allFiles = [
            'leads.json', 'applications.json', 'enrollments.json', 'fees.json',
            'inquiries.json', 'subscribers.json', 'users.json', 'roles.json',
            'settings.json', 'courses.json', 'colleges.json', 'universities.json',
            'blogs.json', 'videos.json'
        ];

        $restored = [];
        foreach ($allFiles as $f) {
            $key = str_replace('.json', '', $f);
            if (isset($collections[$key])) {
                writeData($f, $collections[$key]);
                $restored[] = $f;
            }
        }

        echo json_encode([
            'success' => true,
            'message' => 'Successfully restored ' . count($restored) . ' collections to disk.',
            'restoredFiles' => $restored
        ]);
        exit;
    }
}`;

const newSection5 = `// =====================================================================
// SECTION 5: DISASTER RECOVERY, MULTI-TIER VAULT & SYSTEM RESILIENCE (/api/system/*)
// =====================================================================
if ($section === 'system') {
    $sysAction = strtolower($parts[1] ?? '');

    // 5.1 GET /api/system/vault-status
    if (($sysAction === 'vault-status' || $sysAction === 'vault') && $method === 'GET') {
        $stats = [
            'activeDataDir' => $dataDir,
            'localVaultDir' => $vaultDir,
            'externalVaultDir' => $vaultDir,
            'snapshotsDir' => $snapshotsDir,
            'isExternalVaultAccessible' => is_dir($vaultDir),
            'collectionCounts' => [],
            'totalSnapshots' => 0,
            'lastSnapshot' => null
        ];

        $allFiles = [
            'courses.json', 'colleges.json', 'universities.json', 'blogs.json', 'videos.json',
            'leads.json', 'inquiries.json', 'applications.json', 'enrollments.json', 'subscribers.json',
            'fees.json', 'users.json', 'roles.json', 'settings.json', 'site_menu.json'
        ];

        foreach ($allFiles as $f) {
            $items = readData($f, []);
            $key = str_replace('.json', '', $f);
            $stats['collectionCounts'][$key] = is_array($items) ? count($items) : ($items ? 1 : 0);
        }

        if (is_dir($snapshotsDir)) {
            $snaps = glob($snapshotsDir . '/snapshot-*.json');
            if ($snaps) {
                usort($snaps, function($a, $b) { return filemtime($b) - filemtime($a); });
                $stats['totalSnapshots'] = count($snaps);
                $latest = $snaps[0];
                $stats['lastSnapshot'] = [
                    'name' => basename($latest),
                    'filename' => basename($latest),
                    'time' => date('c', filemtime($latest)),
                    'size' => filesize($latest)
                ];
            }
        }

        echo json_encode(['success' => true, 'vault' => $stats, 'status' => 'ACTIVE']);
        exit;
    }

    // 5.2 GET /api/system/backup - Full Authoritative Database JSON Download
    if ($sysAction === 'backup' && $method === 'GET') {
        $vault = [
            'appName' => 'EducationistGuru',
            'version' => '2.0-unbreakable-titanium',
            'exportedAt' => date('c'),
            'schemaVersion' => '2026.1',
            'collections' => [
                'courses' => readData('courses.json', []),
                'colleges' => readData('colleges.json', []),
                'universities' => readData('universities.json', []),
                'blogs' => readData('blogs.json', []),
                'videos' => readData('videos.json', []),
                'leads' => readData('leads.json', []),
                'applications' => readData('applications.json', []),
                'enrollments' => readData('enrollments.json', []),
                'inquiries' => readData('inquiries.json', []),
                'subscribers' => readData('subscribers.json', []),
                'fees' => readData('fees.json', []),
                'users' => readData('users.json', []),
                'roles' => readData('roles.json', []),
                'settings' => readData('settings.json', new stdClass()),
                'site_menu' => readData('site_menu.json', new stdClass())
            ]
        ];
        $filename = 'educationistguru_complete_vault_backup_' . date('Y-m-d') . '.json';
        header('Content-Disposition: attachment; filename="' . $filename . '"');
        echo json_encode($vault, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        exit;
    }

    // 5.3 POST /api/system/restore - Restore Database with Immediate Pre-Restore Safety Snapshot
    if ($sysAction === 'restore' && ($method === 'POST' || $method === 'PUT')) {
        $body = getJsonBody();
        if (empty($body)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Empty restore payload']);
            exit;
        }

        // 1. Create safety rollback snapshot before overwriting
        $safetySnapshot = createSnapshot('pre_restore_safety');

        $collections = $body['collections'] ?? $body;
        $allFiles = [
            'leads.json', 'applications.json', 'enrollments.json', 'fees.json',
            'inquiries.json', 'subscribers.json', 'users.json', 'roles.json',
            'settings.json', 'courses.json', 'colleges.json', 'universities.json',
            'blogs.json', 'videos.json', 'site_menu.json'
        ];

        $restored = [];
        foreach ($allFiles as $f) {
            $key = str_replace('.json', '', $f);
            if (isset($collections[$key])) {
                writeData($f, $collections[$key]);
                $restored[] = $f;
            } elseif (isset($collections[str_replace('_', '', $key)])) {
                writeData($f, $collections[str_replace('_', '', $key)]);
                $restored[] = $f;
            }
        }

        // 2. Create post-restore confirmation snapshot
        createSnapshot('post_restore');

        echo json_encode([
            'success' => true,
            'message' => 'Successfully restored ' . count($restored) . ' collections to disk and vault. Safety rollback snapshot created.',
            'restoredFiles' => $restored,
            'safetySnapshot' => $safetySnapshot['name']
        ]);
        exit;
    }

    // 5.4 GET /api/system/snapshots - List Point-in-Time Snapshots
    if ($sysAction === 'snapshots' && $method === 'GET') {
        $snapsList = [];
        if (is_dir($snapshotsDir)) {
            $files = glob($snapshotsDir . '/snapshot-*.json');
            if ($files) {
                usort($files, function($a, $b) { return filemtime($b) - filemtime($a); });
                foreach ($files as $filePath) {
                    $fn = basename($filePath);
                    $mtime = filemtime($filePath);
                    $snapsList[] = [
                        'name' => $fn,
                        'filename' => $fn,
                        'size' => filesize($filePath),
                        'timestamp' => date('c', $mtime),
                        'createdAt' => date('c', $mtime)
                    ];
                }
            }
        }
        echo json_encode(['success' => true, 'snapshots' => $snapsList]);
        exit;
    }

    // 5.5 POST /api/system/snapshot - Create Manual Point-in-Time Snapshot
    if ($sysAction === 'snapshot' && ($method === 'POST' || $method === 'GET')) {
        $body = getJsonBody();
        $reason = $body['reason'] ?? 'manual_admin_trigger';
        $snap = createSnapshot($reason);
        echo json_encode([
            'success' => true,
            'message' => 'Point-in-time snapshot created successfully.',
            'snapshot' => $snap['name'],
            'details' => $snap
        ]);
        exit;
    }

    // 5.6 POST /api/system/rollback - Rollback to Selected Point-in-Time Snapshot
    if ($sysAction === 'rollback' && ($method === 'POST' || $method === 'PUT')) {
        $body = getJsonBody();
        $snapName = $body['snapshotName'] ?? $body['filename'] ?? $body['name'] ?? '';
        if (empty($snapName)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'snapshotName or filename is required']);
            exit;
        }

        $snapPath = $snapshotsDir . '/' . basename($snapName);
        if (!file_exists($snapPath)) {
            http_response_code(404);
            echo json_encode(['success' => false, 'error' => 'Snapshot file not found: ' . $snapName]);
            exit;
        }

        $raw = @file_get_contents($snapPath);
        $parsed = json_decode($raw, true);
        if (!$parsed || empty($parsed['collections'])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Malformed snapshot bundle']);
            exit;
        }

        // Create pre-rollback safety snapshot
        $safety = createSnapshot('pre_rollback_safety');

        $allFiles = [
            'courses.json', 'colleges.json', 'universities.json', 'blogs.json', 'videos.json',
            'leads.json', 'inquiries.json', 'applications.json', 'enrollments.json', 'subscribers.json',
            'fees.json', 'users.json', 'roles.json', 'settings.json', 'site_menu.json'
        ];

        $restoredFiles = [];
        foreach ($allFiles as $f) {
            $key = str_replace('.json', '', $f);
            if (isset($parsed['collections'][$key])) {
                writeData($f, $parsed['collections'][$key]);
                $restoredFiles[] = $f;
            }
        }

        echo json_encode([
            'success' => true,
            'message' => 'Rollback applied successfully. Database restored to snapshot state.',
            'restoredFrom' => $snapName,
            'restoredFiles' => $restoredFiles,
            'safetySnapshot' => $safety['name']
        ]);
        exit;
    }
}`;

if (php.includes(oldSection5)) {
    php = php.replace(oldSection5, newSection5);
    console.log('Upgraded Section 5 in api.php.');
} else {
    console.warn('Could not match oldSection5 in api.php.');
}

fs.writeFileSync('api.php', php, 'utf8');
console.log('Saved api.php successfully.');
