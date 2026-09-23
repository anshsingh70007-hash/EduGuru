<?php
/**
 * EducationistGuru - Universal Hostinger Production API Engine
 * 
 * Provides 100% native server-side persistence for:
 * 1. CRM Pipeline: Leads, Inquiries, Applications, Enrollments, Fees, Subscribers, Users, Settings
 * 2. Visual CMS Editor (/edit/): Courses, Colleges, Universities, Blogs, YouTube Videos
 * 3. Media Uploads: Image upload handler saving directly to images/uploaded/
 * 4. System Backup: Portable data vault exporter
 * 
 * Runs natively on Apache + PHP on Hostinger without requiring continuous Node.js daemon.
 */

// Enable error logging for debugging while keeping output clean JSON
error_reporting(E_ALL);
ini_set('display_errors', '0');

// Set universal CORS & Content-Type
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, X-HTTP-Method-Override, Cache-Control, Pragma');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');
header('Expires: 0');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

$dataDir = __DIR__ . '/data';
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
    
    $isoDate = gmdate('Y-m-d\TH-i-s-v\Z');
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
}

function getJsonBody() {
    $raw = file_get_contents('php://input');
    if (!empty($raw)) {
        $json = json_decode($raw, true);
        if (is_array($json)) return $json;
    }
    return !empty($_POST) ? $_POST : [];
}

// ---------------------------------------------------------------------
// Route & Endpoint Parsing
// ---------------------------------------------------------------------
$endpoint = isset($_GET['endpoint']) ? trim($_GET['endpoint'], '/') : '';
if (empty($endpoint)) {
    $uri = parse_url($_SERVER['REQUEST_URI'] ?? '', PHP_URL_PATH);
    if (preg_match('#api/(.*)$#i', $uri, $m)) {
        $endpoint = trim($m[1], '/');
    }
}

$parts = array_values(array_filter(explode('/', $endpoint), 'strlen'));
if (!empty($parts) && strtolower($parts[0]) === 'api') {
    array_shift($parts);
}

$section = strtolower($parts[0] ?? '');
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

// Bulletproof HTTP Method Override for Hostinger LiteSpeed / Apache environments
// Allows PUT and DELETE to work reliably even on hosts that restrict standard PUT/DELETE verbs
if (!empty($_SERVER['HTTP_X_HTTP_METHOD_OVERRIDE'])) {
    $method = strtoupper(trim($_SERVER['HTTP_X_HTTP_METHOD_OVERRIDE']));
} elseif (!empty($_GET['_method'])) {
    $method = strtoupper(trim($_GET['_method']));
} elseif (isset($_GET['action']) && in_array(strtolower($_GET['action']), ['delete', 'destroy', 'remove'])) {
    $method = 'DELETE';
} elseif (isset($_GET['action']) && in_array(strtolower($_GET['action']), ['update', 'edit', 'put'])) {
    $method = 'PUT';
}

// Health Check Endpoint: /api/ping or /api/health
if ($section === 'ping' || $section === 'health' || ($section === 'crm' && strtolower($parts[1] ?? '') === 'ping')) {
    echo json_encode([
        'success' => true,
        'status' => 'operational',
        'message' => 'EducationistGuru Native API Engine is active',
        'timestamp' => date('c'),
        'php_version' => PHP_VERSION,
        'data_writable' => is_writable($dataDir)
    ]);
    exit;
}

// =====================================================================
// SECTION 1: CRM API ROUTING (/api/crm/*)
// =====================================================================
if ($section === 'crm') {
    $action = strtolower($parts[1] ?? '');
    $id = $parts[2] ?? null;

    // 1.1 GET /api/crm/all - Single roundtrip hydration for CRM
    if ($action === 'all' && $method === 'GET') {
        $allData = [
            'leads' => readData('leads.json', []),
            'applications' => readData('applications.json', []),
            'enrollments' => readData('enrollments.json', []),
            'inquiries' => readData('inquiries.json', []),
            'subscribers' => readData('subscribers.json', []),
            'fees' => readData('fees.json', []),
            'users' => readData('users.json', []),
            'roles' => readData('roles.json', [
                ['id' => 1, 'name' => 'owner', 'label' => 'Owner & Director', 'color' => '#ff3115', 'permissions' => ['all']],
                ['id' => 2, 'name' => 'admin', 'label' => 'Senior Administrator', 'color' => '#0d6efd', 'permissions' => ['all']],
                ['id' => 3, 'name' => 'counsellor', 'label' => 'Academic Counsellor', 'color' => '#28a745', 'permissions' => ['dashboard', 'leads', 'applications', 'enrollments', 'inquiries']],
                ['id' => 4, 'name' => 'editor', 'label' => 'Content Editor', 'color' => '#6f42c1', 'permissions' => ['dashboard', 'subscribers']]
            ]),
            'settings' => readData('settings.json', new stdClass())
        ];
        echo json_encode(['success' => true, 'data' => $allData]);
        exit;
    }

    // 1.2 GET /api/crm/stats
    if ($action === 'stats' && $method === 'GET') {
        $leads = readData('leads.json', []);
        $enrollments = readData('enrollments.json', []);
        $inquiries = readData('inquiries.json', []);
        $subscribers = readData('subscribers.json', []);
        $applications = readData('applications.json', []);
        $fees = readData('fees.json', []);

        $leadsBySource = [];
        $leadsByStatus = [];
        foreach ($leads as $l) {
            $src = $l['source'] ?? 'Website';
            $leadsBySource[$src] = ($leadsBySource[$src] ?? 0) + 1;
            $st = $l['status'] ?? 'new';
            $leadsByStatus[$st] = ($leadsByStatus[$st] ?? 0) + 1;
        }

        $revenue = 0;
        foreach ($enrollments as $e) {
            $revenue += floatval($e['paid'] ?? 0);
        }

        $unreadInquiries = 0;
        foreach ($inquiries as $i) {
            if (($i['status'] ?? '') === 'unread') $unreadInquiries++;
        }

        echo json_encode([
            'success' => true,
            'stats' => [
                'totalLeads' => count($leads),
                'totalEnrollments' => count($enrollments),
                'totalRevenue' => $revenue,
                'totalInquiries' => count($inquiries),
                'unreadInquiries' => $unreadInquiries,
                'totalSubscribers' => count($subscribers),
                'totalApplications' => count($applications),
                'pendingFees' => count($fees),
                'leadsBySource' => $leadsBySource,
                'leadsByStatus' => $leadsByStatus
            ]
        ]);
        exit;
    }

    // 1.3 Settings Handling
    if ($action === 'settings') {
        if ($method === 'GET') {
            $settings = readData('settings.json', new stdClass());
            echo json_encode(['success' => true, 'settings' => $settings]);
            exit;
        }
        if ($method === 'POST' || $method === 'PUT') {
            $body = getJsonBody();
            writeData('settings.json', $body);
            echo json_encode(['success' => true, 'settings' => $body]);
            exit;
        }
    }

    // 1.4 Entity Collections
    $entityMap = [
        'lead' => 'leads',
        'inquiry' => 'inquiries',
        'application' => 'applications',
        'enrollment' => 'enrollments',
        'subscriber' => 'subscribers',
        'fee' => 'fees',
        'user' => 'users',
        'role' => 'roles'
    ];
    $entity = $entityMap[$action] ?? $action;
    $validCollections = ['leads', 'inquiries', 'applications', 'enrollments', 'subscribers', 'fees', 'users', 'roles'];

    if (in_array($entity, $validCollections)) {
        $filename = $entity . '.json';

        // GET all
        if ($method === 'GET' && !$id) {
            $items = readData($filename, []);
            echo json_encode(['success' => true, 'items' => $items]);
            exit;
        }

        // GET single by ID
        if ($method === 'GET' && $id) {
            $items = readData($filename, []);
            foreach ($items as $item) {
                if (strval($item['id'] ?? '') === $id || ($entity === 'subscribers' && ($item['email'] ?? '') === $id)) {
                    echo json_encode(['success' => true, 'item' => $item]);
                    exit;
                }
            }
            http_response_code(404);
            echo json_encode(['success' => false, 'error' => "$entity record not found"]);
            exit;
        }

        // POST (Create)
        if ($method === 'POST' && !$id) {
            $record = getJsonBody();
            unset($record['id'], $record['_tempClientId']);
            $items = readData($filename, []);

            // Intelligent Deduplication for Leads (Deduplicates by 10-digit mobile number or email)
            if ($entity === 'leads') {
                $cleanPhone = substr(preg_replace('/\D/', '', $record['phone'] ?? ''), -10);
                $cleanEmail = strtolower(trim($record['email'] ?? ''));

                $foundIdx = -1;
                foreach ($items as $idx => $l) {
                    $lPhone = substr(preg_replace('/\D/', '', $l['phone'] ?? ''), -10);
                    $lEmail = strtolower(trim($l['email'] ?? ''));

                    $isSame = ($cleanPhone && $lPhone && $cleanPhone === $lPhone) || ($cleanEmail && $lEmail && $cleanEmail === $lEmail);
                    if ($isSame) {
                        $foundIdx = $idx;
                        break;
                    }
                }

                if ($foundIdx !== -1) {
                    // Update existing lead with latest details and promote to top of list!
                    $existing = $items[$foundIdx];
                    $newNotes = $record['notes'] ?? '';
                    if ($newNotes && (!isset($existing['notes']) || strpos($existing['notes'], $newNotes) === false)) {
                        $record['notes'] = trim(($existing['notes'] ?? '') . "\n\n" . $newNotes);
                    } else {
                        $record['notes'] = $existing['notes'] ?? $newNotes;
                    }
                    $updatedLead = array_merge($existing, $record, [
                        'id' => $existing['id'],
                        'status' => 'new',
                        'priority' => 'high',
                        'date' => date('Y-m-d'),
                        'dateAdded' => date('c'),
                        'updatedAt' => date('c')
                    ]);
                    // Remove from old position and push to the very top (index 0)
                    array_splice($items, $foundIdx, 1);
                    array_unshift($items, $updatedLead);
                    writeData($filename, $items);

                    // Add/refresh inquiry notification
                    $inqs = readData('inquiries.json', []);
                    $maxInqId = 0;
                    foreach ($inqs as $iq) {
                        $iqId = intval($iq['id'] ?? 0);
                        if ($iqId > $maxInqId) $maxInqId = $iqId;
                    }
                    array_unshift($inqs, [
                        'id' => $maxInqId + 1,
                        'name' => $updatedLead['name'] ?? 'Website Candidate',
                        'email' => $updatedLead['email'] ?? '',
                        'phone' => $updatedLead['phone'] ?? '',
                        'subject' => '⚡ Lead Re-engaged: ' . ($updatedLead['course'] ?? 'General Inquiry'),
                        'message' => 'Candidate submitted a new inquiry/callback. Course: ' . ($updatedLead['course'] ?? 'None'),
                        'status' => 'unread',
                        'date' => date('c')
                    ]);
                    writeData('inquiries.json', $inqs);

                    echo json_encode(['success' => true, 'item' => $updatedLead, 'message' => 'Lead re-engaged and prioritized to top of list']);
                    exit;
                }

                // Fresh Lead
                $maxId = 0;
                foreach ($items as $x) {
                    $xId = intval($x['id'] ?? 0);
                    if ($xId > $maxId) $maxId = $xId;
                }
                $record['id'] = $maxId + 1;
                $record['dateAdded'] = $record['dateAdded'] ?? date('c');
                $record['date'] = $record['date'] ?? date('Y-m-d');
                array_unshift($items, $record);
                writeData($filename, $items);

                // Auto-inquiry hook for CRM notification bell
                if (($record['skipAutoInquiry'] ?? false) !== true && ($record['hasInquiry'] ?? false) !== true) {
                    $inqs = readData('inquiries.json', []);
                    $maxInqId = 0;
                    foreach ($inqs as $iq) {
                        $iqId = intval($iq['id'] ?? 0);
                        if ($iqId > $maxInqId) $maxInqId = $iqId;
                    }
                    array_unshift($inqs, [
                        'id' => $maxInqId + 1,
                        'name' => $record['name'] ?? 'Website Visitor',
                        'email' => $record['email'] ?? '',
                        'phone' => $record['phone'] ?? '',
                        'subject' => '⚡ New Lead: ' . ($record['course'] ?? 'General Inquiry'),
                        'message' => 'New lead captured via ' . ($record['source'] ?? 'Website') . '. Course: ' . ($record['course'] ?? 'None'),
                        'status' => 'unread',
                        'date' => date('c')
                    ]);
                    writeData('inquiries.json', $inqs);
                }

                http_response_code(201);
                echo json_encode(['success' => true, 'item' => $record, 'message' => 'Lead created successfully']);
                exit;
            }

            // Deduplication for Inquiries
            if ($entity === 'inquiries') {
                $cleanPhone = substr(preg_replace('/\D/', '', $record['phone'] ?? ''), -10);
                $cleanEmail = strtolower(trim($record['email'] ?? ''));

                foreach ($items as $iq) {
                    $iqPhone = substr(preg_replace('/\D/', '', $iq['phone'] ?? ''), -10);
                    $iqEmail = strtolower(trim($iq['email'] ?? ''));
                    $iqTime = strtotime($iq['date'] ?? 'now');
                    if ((time() - $iqTime) < 180 && (($cleanPhone && $iqPhone && $cleanPhone === $iqPhone) || ($cleanEmail && $iqEmail && $cleanEmail === $iqEmail))) {
                        echo json_encode(['success' => true, 'item' => $iq, 'message' => 'Duplicate inquiry ignored']);
                        exit;
                    }
                }
            }

            // Standard Collection Insertion
            $maxId = 0;
            foreach ($items as $x) {
                $xId = intval($x['id'] ?? 0);
                if ($xId > $maxId) $maxId = $xId;
            }
            $record['id'] = $maxId + 1;
            $record['date'] = $record['date'] ?? date('Y-m-d');
            array_unshift($items, $record);
            writeData($filename, $items);

            http_response_code(201);
            echo json_encode(['success' => true, 'item' => $record, 'message' => "$entity record created"]);
            exit;
        }

        // PUT (Update)
        if (($method === 'PUT' || $method === 'POST') && $id) {
            $body = getJsonBody();
            $items = readData($filename, []);
            foreach ($items as $idx => $item) {
                if (strval($item['id'] ?? '') === $id || ($entity === 'subscribers' && ($item['email'] ?? '') === $id)) {
                    $items[$idx] = array_merge($item, $body, ['id' => $item['id'], 'updatedAt' => date('c')]);
                    writeData($filename, $items);
                    echo json_encode(['success' => true, 'item' => $items[$idx], 'message' => "$entity record updated"]);
                    exit;
                }
            }
            http_response_code(404);
            echo json_encode(['success' => false, 'error' => "$entity record not found"]);
            exit;
        }

        // DELETE
        if ($method === 'DELETE' && $id) {
            $items = readData($filename, []);
            $filtered = array_values(array_filter($items, function($item) use ($id, $entity) {
                if ($entity === 'subscribers') return ($item['email'] ?? '') !== $id && strval($item['id'] ?? '') !== $id;
                return strval($item['id'] ?? '') !== $id;
            }));
            writeData($filename, $filtered);
            echo json_encode(['success' => true, 'message' => "$entity record deleted"]);
            exit;
        }
    }
}

// =====================================================================
// SECTION 2: CONTENT API ROUTING (/api/content/*) for Visual Editor
// Supports Courses, Colleges, Universities, Blogs
// =====================================================================
if ($section === 'content' || in_array($section, ['courses', 'colleges', 'universities', 'blogs', 'videos', 'menu'])) {
    $contentType = ($section === 'content') ? strtolower($parts[1] ?? '') : $section;
    $contentId = ($section === 'content') ? ($parts[2] ?? null) : ($parts[1] ?? null);

    // 2.0 GET /api/content/all or /api/content - Authoritative Single Roundtrip Sync (Just like /api/crm/all)
    if (($contentType === 'all' || empty($contentType)) && $method === 'GET' && !$contentId) {
        $allContent = [
            'courses' => readData('courses.json', []),
            'colleges' => readData('colleges.json', []),
            'universities' => readData('universities.json', []),
            'blogs' => readData('blogs.json', []),
            'videos' => readData('videos.json', []),
            'menu' => readData('site_menu.json', [])
        ];
        echo json_encode(['success' => true, 'data' => $allContent, 'timestamp' => date('c')]);
        exit;
    }

    // Direct Menu Handler: /api/content/menu or /api/menu
    if ($contentType === 'menu') {
        if ($method === 'GET') {
            $menu = readData('site_menu.json', []);
            echo json_encode(['success' => true, 'data' => $menu]);
            exit;
        }
        if ($method === 'POST' || $method === 'PUT') {
            $body = getJsonBody();
            if (empty($body)) {
                echo json_encode(['success' => false, 'error' => 'No menu data received']);
                exit;
            }
            if (!isset($body['config'])) $body['config'] = [];
            $body['config']['updatedAt'] = date('c');
            writeData('site_menu.json', $body);
            echo json_encode(['success' => true, 'data' => $body, 'message' => 'Navigation menu updated successfully']);
            exit;
        }
    }

    $contentSingularMap = [
        'courses' => 'course',
        'colleges' => 'college',
        'universities' => 'university',
        'blogs' => 'blog',
        'videos' => 'video'
    ];

    if (isset($contentSingularMap[$contentType])) {
        $filename = $contentType . '.json';
        $singular = $contentSingularMap[$contentType];
        $items = readData($filename, []);

        // GET all
        if ($method === 'GET' && !$contentId) {
            echo json_encode(['success' => true, $contentType => $items]);
            exit;
        }

        // GET single
        if ($method === 'GET' && $contentId) {
            foreach ($items as $item) {
                if (strval($item['id'] ?? '') === $contentId || strval($item['slug'] ?? '') === $contentId) {
                    echo json_encode(['success' => true, $singular => $item]);
                    exit;
                }
            }
            http_response_code(404);
            echo json_encode(['success' => false, 'error' => "$singular not found"]);
            exit;
        }

        // POST (Create new content item)
        if ($method === 'POST' && !$contentId) {
            $record = getJsonBody();
            if (empty($record['id'])) {
                $maxId = 0;
                foreach ($items as $x) {
                    $xId = intval($x['id'] ?? 0);
                    if ($xId > $maxId) $maxId = $xId;
                }
                $record['id'] = $maxId + 1;
            }
            if (empty($record['slug']) && !empty($record['name'])) {
                $record['slug'] = strtolower(trim(preg_replace('/[^A-Za-z0-9-]+/', '-', $record['name']), '-'));
            }

            // Normalization for Colleges: Multi-Category & Multi-Courses
            if ($contentType === 'colleges') {
                if (!empty($record['categories']) && is_array($record['categories'])) {
                    $cleanCats = array_values(array_filter(array_map('trim', $record['categories'])));
                    $record['categories'] = $cleanCats;
                    $record['category'] = implode(', ', $cleanCats);
                } elseif (!empty($record['category'])) {
                    $cleanCats = array_values(array_filter(array_map('trim', explode(',', $record['category']))));
                    $record['categories'] = $cleanCats;
                }
                if (!empty($record['courses']) && is_array($record['courses'])) {
                    $cleanCourses = array_values(array_filter(array_map('trim', $record['courses'])));
                    $record['coursesList'] = $cleanCourses;
                    $record['courses'] = implode(', ', $cleanCourses);
                } elseif (!empty($record['coursesList']) && is_array($record['coursesList'])) {
                    $cleanCourses = array_values(array_filter(array_map('trim', $record['coursesList'])));
                    $record['coursesList'] = $cleanCourses;
                    $record['courses'] = implode(', ', $cleanCourses);
                } elseif (!empty($record['courses'])) {
                    $cleanCourses = array_values(array_filter(array_map('trim', explode(',', $record['courses']))));
                    $record['coursesList'] = $cleanCourses;
                }
            }

            // Normalization for Universities: Multi-Streams & Multi-Courses
            if ($contentType === 'universities') {
                if (!empty($record['streams']) && is_array($record['streams'])) {
                    $cleanStreams = array_values(array_filter(array_map('trim', $record['streams'])));
                    $record['streams'] = $cleanStreams;
                    $record['popularStreams'] = implode(', ', $cleanStreams);
                } elseif (!empty($record['popularStreams'])) {
                    $cleanStreams = array_values(array_filter(array_map('trim', explode(',', $record['popularStreams']))));
                    $record['streams'] = $cleanStreams;
                }
            }

            $record['dateAdded'] = $record['dateAdded'] ?? date('c');
            array_unshift($items, $record);
            writeData($filename, $items);

            http_response_code(201);
            echo json_encode(['success' => true, $singular => $record, 'message' => "$singular created successfully"]);
            exit;
        }

        // PUT (Update content item)
        if (($method === 'PUT' || $method === 'POST') && $contentId) {
            $body = getJsonBody();
            $found = false;

            // Normalization for Colleges
            if ($contentType === 'colleges') {
                if (!empty($body['categories']) && is_array($body['categories'])) {
                    $cleanCats = array_values(array_filter(array_map('trim', $body['categories'])));
                    $body['categories'] = $cleanCats;
                    $body['category'] = implode(', ', $cleanCats);
                } elseif (!empty($body['category'])) {
                    $cleanCats = array_values(array_filter(array_map('trim', explode(',', $body['category']))));
                    $body['categories'] = $cleanCats;
                }
                if (!empty($body['courses']) && is_array($body['courses'])) {
                    $cleanCourses = array_values(array_filter(array_map('trim', $body['courses'])));
                    $body['coursesList'] = $cleanCourses;
                    $body['courses'] = implode(', ', $cleanCourses);
                } elseif (!empty($body['coursesList']) && is_array($body['coursesList'])) {
                    $cleanCourses = array_values(array_filter(array_map('trim', $body['coursesList'])));
                    $body['coursesList'] = $cleanCourses;
                    $body['courses'] = implode(', ', $cleanCourses);
                } elseif (!empty($body['courses'])) {
                    $cleanCourses = array_values(array_filter(array_map('trim', explode(',', $body['courses']))));
                    $body['coursesList'] = $cleanCourses;
                }
            }

            // Normalization for Universities
            if ($contentType === 'universities') {
                if (!empty($body['streams']) && is_array($body['streams'])) {
                    $cleanStreams = array_values(array_filter(array_map('trim', $body['streams'])));
                    $body['streams'] = $cleanStreams;
                    $body['popularStreams'] = implode(', ', $cleanStreams);
                } elseif (!empty($body['popularStreams'])) {
                    $body['streams'] = array_values(array_filter(array_map('trim', explode(',', $body['popularStreams']))));
                }
            }

            foreach ($items as $idx => $item) {
                if (strval($item['id'] ?? '') === $contentId || strval($item['slug'] ?? '') === $contentId) {
                    $items[$idx] = array_merge($item, $body, [
                        'id' => $item['id'],
                        'updatedAt' => date('c')
                    ]);
                    writeData($filename, $items);
                    echo json_encode(['success' => true, $singular => $items[$idx], 'message' => "$singular updated successfully"]);
                    exit;
                }
            }
            http_response_code(404);
            echo json_encode(['success' => false, 'error' => "$singular not found to update"]);
            exit;
        }

        // DELETE
        if ($method === 'DELETE' && $contentId) {
            $initialCount = count($items);
            $filtered = array_values(array_filter($items, function($item) use ($contentId) {
                return strval($item['id'] ?? '') !== $contentId && strval($item['slug'] ?? '') !== $contentId;
            }));
            writeData($filename, $filtered);
            echo json_encode(['success' => true, 'message' => "$singular deleted successfully", 'deleted' => ($initialCount > count($filtered))]);
            exit;
        }
    }
}

// =====================================================================
// SECTION 3: YOUTUBE API ROUTING (/api/youtube/*)
// =====================================================================
if ($section === 'youtube' || $section === 'videos') {
    $ytAction = ($section === 'youtube') ? strtolower($parts[1] ?? '') : 'videos';
    $ytId = ($section === 'youtube') ? ($parts[2] ?? null) : ($parts[1] ?? null);

    // 3.1 Fetch Video Info via oEmbed
    if ($ytAction === 'fetch-info' && $method === 'GET') {
        $videoId = $_GET['videoId'] ?? '';
        if (empty($videoId)) {
            echo json_encode(['success' => false, 'error' => 'No videoId provided']);
            exit;
        }
        $oembedUrl = "https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=" . urlencode($videoId) . "&format=json";
        $ctx = stream_context_create(['http' => ['timeout' => 5]]);
        $raw = @file_get_contents($oembedUrl, false, $ctx);
        if ($raw) {
            $data = json_decode($raw, true);
            echo json_encode([
                'success' => true,
                'title' => $data['title'] ?? 'EducationistGuru Video',
                'author' => $data['author_name'] ?? 'EducationistGuru',
                'thumbnail' => "https://img.youtube.com/vi/{$videoId}/maxresdefault.jpg"
            ]);
            exit;
        }
        echo json_encode([
            'success' => true,
            'title' => 'EducationistGuru Video',
            'author' => 'EducationistGuru',
            'thumbnail' => "https://img.youtube.com/vi/{$videoId}/hqdefault.jpg"
        ]);
        exit;
    }

    // 3.2 Videos CRUD
    if ($ytAction === 'videos') {
        $items = readData('videos.json', []);

        // GET all
        if ($method === 'GET' && !$ytId) {
            echo json_encode(['success' => true, 'videos' => $items]);
            exit;
        }

        // POST (Create)
        if ($method === 'POST' && !$ytId) {
            $record = getJsonBody();
            $maxId = 0;
            foreach ($items as $x) {
                $xId = intval($x['id'] ?? 0);
                if ($xId > $maxId) $maxId = $xId;
            }
            $record['id'] = $maxId + 1;
            $record['dateAdded'] = $record['dateAdded'] ?? date('c');
            array_unshift($items, $record);
            writeData('videos.json', $items);

            http_response_code(201);
            echo json_encode(['success' => true, 'video' => $record, 'message' => 'Video added successfully']);
            exit;
        }

        // PUT (Update)
        if (($method === 'PUT' || $method === 'POST') && $ytId) {
            $body = getJsonBody();
            foreach ($items as $idx => $item) {
                if (strval($item['id'] ?? '') === $ytId || strval($item['videoId'] ?? '') === $ytId) {
                    $items[$idx] = array_merge($item, $body, ['id' => $item['id'], 'updatedAt' => date('c')]);
                    writeData('videos.json', $items);
                    echo json_encode(['success' => true, 'video' => $items[$idx], 'message' => 'Video updated successfully']);
                    exit;
                }
            }
            http_response_code(404);
            echo json_encode(['success' => false, 'error' => 'Video not found to update']);
            exit;
        }

        // DELETE
        if ($method === 'DELETE' && $ytId) {
            $filtered = array_values(array_filter($items, function($v) use ($ytId) {
                return strval($v['id'] ?? '') !== $ytId && strval($v['videoId'] ?? '') !== $ytId;
            }));
            writeData('videos.json', $filtered);
            echo json_encode(['success' => true, 'message' => 'Video deleted']);
            exit;
        }
    }
}

// =====================================================================
// SECTION 4: FILE UPLOAD API ROUTING (/api/upload)
// Used by Visual CMS Editor to upload course, college & blog images
// =====================================================================
if ($section === 'upload' && $method === 'POST') {
    $uploadDir = __DIR__ . '/images/uploaded';
    if (!is_dir($uploadDir)) {
        @mkdir($uploadDir, 0777, true);
    }

    $body = getJsonBody();
    if (!empty($body['data']) && !empty($body['filename'])) {
        // Base64 Data URL upload
        $dataUrl = $body['data'];
        $rawExt = pathinfo($body['filename'], PATHINFO_EXTENSION);
        $ext = strtolower($rawExt ?: 'jpg');
        $cleanName = preg_replace('/[^a-zA-Z0-9_-]/', '', pathinfo($body['filename'], PATHINFO_FILENAME));
        $finalName = 'img_' . time() . '_' . substr($cleanName, 0, 20) . '.' . $ext;
        $targetPath = $uploadDir . '/' . $finalName;

        if (preg_match('#^data:image/(\w+);base64,#i', $dataUrl, $m)) {
            $dataUrl = substr($dataUrl, strpos($dataUrl, ',') + 1);
        }
        $decoded = base64_decode($dataUrl);
        if ($decoded !== false && @file_put_contents($targetPath, $decoded) !== false) {
            @chmod($targetPath, 0666);
            echo json_encode(['success' => true, 'url' => 'images/uploaded/' . $finalName]);
            exit;
        }
    }

    // Standard Multipart/form-data upload fallback
    if (!empty($_FILES['image']) || !empty($_FILES['file'])) {
        $fileObj = $_FILES['image'] ?? $_FILES['file'];
        if ($fileObj['error'] === UPLOAD_ERR_OK) {
            $ext = strtolower(pathinfo($fileObj['name'], PATHINFO_EXTENSION) ?: 'jpg');
            $finalName = 'img_' . time() . '_' . uniqid() . '.' . $ext;
            $targetPath = $uploadDir . '/' . $finalName;
            if (@move_uploaded_file($fileObj['tmp_name'], $targetPath)) {
                @chmod($targetPath, 0666);
                echo json_encode(['success' => true, 'url' => 'images/uploaded/' . $finalName]);
                exit;
            }
        }
    }

    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Upload failed']);
    exit;
}

// =====================================================================
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
}

// ---------------------------------------------------------------------
// 404 Fallback
// ---------------------------------------------------------------------
http_response_code(404);
echo json_encode([
    'success' => false,
    'error' => 'Endpoint not found',
    'receivedEndpoint' => $endpoint,
    'method' => $method
]);
