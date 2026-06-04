<?php
// api.php - API Controller Terpusat untuk Website Wisata Pantai

// Header CORS
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS, PUT, DELETE");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Sertakan konfigurasi database
if (file_exists('config.php')) {
    require_once 'config.php';
} else {
    echo json_encode([
        "success" => false,
        "message" => "File config.php tidak ditemukan."
    ]);
    exit();
}

// ====================================================
// AUTO-INSTALLER & SEEDING (Self-Installing Database)
// ====================================================

// 1. Hubungkan ke MySQL Server tanpa memilih database (untuk membuat database jika belum ada)
try {
    $dsn_no_db = "mysql:host=" . DB_HOST . ";charset=utf8mb4";
    $options = [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ];
    $pdo_init = new PDO($dsn_no_db, DB_USER, DB_PASS, $options);
    $pdo_init->exec("CREATE DATABASE IF NOT EXISTS `" . DB_NAME . "` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
} catch (PDOException $e) {
    echo json_encode([
        "success" => false,
        "message" => "Gagal terhubung ke MySQL Server atau membuat database: " . $e->getMessage()
    ]);
    exit();
}

// 2. Hubungkan kembali dengan memilih database yang baru dibuat
try {
    $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4";
    $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
} catch (PDOException $e) {
    echo json_encode([
        "success" => false,
        "message" => "Gagal terhubung ke database '" . DB_NAME . "': " . $e->getMessage()
    ]);
    exit();
}

// 3. Buat Tabel-tabel yang diperlukan
try {
    // Tabel Users
    $pdo->exec("CREATE TABLE IF NOT EXISTS `users` (
        `id` int(11) NOT NULL AUTO_INCREMENT,
        `username` varchar(50) NOT NULL,
        `password` varchar(255) NOT NULL,
        `name` varchar(100) NOT NULL,
        `role` enum('admin', 'kasir') NOT NULL,
        PRIMARY KEY (`id`),
        UNIQUE KEY `username` (`username`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");

    // Tabel Settings
    $pdo->exec("CREATE TABLE IF NOT EXISTS `settings` (
        `id` int(11) NOT NULL AUTO_INCREMENT,
        `meta_key` varchar(100) NOT NULL,
        `meta_value` text NOT NULL,
        PRIMARY KEY (`id`),
        UNIQUE KEY `meta_key` (`meta_key`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");

    // Tabel Transactions
    $pdo->exec("CREATE TABLE IF NOT EXISTS `transactions` (
        `id` int(11) NOT NULL AUTO_INCREMENT,
        `ticket_code` varchar(50) NOT NULL,
        `visitor_name` varchar(100) NOT NULL DEFAULT 'Umum',
        `quantity` int(11) NOT NULL,
        `ticket_price` decimal(15,2) NOT NULL,
        `total_price` decimal(15,2) NOT NULL,
        `cashier_id` int(11) NOT NULL,
        `cashier_name` varchar(100) NOT NULL DEFAULT 'Kasir',
        `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (`id`),
        UNIQUE KEY `ticket_code` (`ticket_code`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");

    // Tambah kolom status dan scanned_at jika belum ada
    try {
        $pdo->exec("ALTER TABLE `transactions` ADD COLUMN `status` enum('unused', 'used') NOT NULL DEFAULT 'unused'");
    } catch (PDOException $e) {
        // Kolom mungkin sudah ada, abaikan
    }
    try {
        $pdo->exec("ALTER TABLE `transactions` ADD COLUMN `scanned_at` timestamp NULL DEFAULT NULL");
    } catch (PDOException $e) {
        // Kolom mungkin sudah ada, abaikan
    }

    // Cek Folder Uploads
    $uploadsDir = 'uploads';
    if (!is_dir($uploadsDir)) {
        mkdir($uploadsDir, 0755, true);
    }

} catch (PDOException $e) {
    echo json_encode([
        "success" => false,
        "message" => "Gagal membuat struktur tabel database: " . $e->getMessage()
    ]);
    exit();
}

// 4. Seeding Data Awal jika tabel kosong
try {
    // Seed Users
    $userCount = $pdo->query("SELECT COUNT(*) FROM users")->fetchColumn();
    if ($userCount == 0) {
        $stmt = $pdo->prepare("INSERT INTO users (username, password, name, role) VALUES (?, ?, ?, ?)");
        // Admin
        $stmt->execute(['admin', password_hash('admin123', PASSWORD_DEFAULT), 'Administrator Pantai', 'admin']);
        // Kasir
        $stmt->execute(['kasir', password_hash('kasir123', PASSWORD_DEFAULT), 'Budi Santoso (Kasir)', 'kasir']);
    }

    // Seed Settings
    $settingsCount = $pdo->query("SELECT COUNT(*) FROM settings")->fetchColumn();
    if ($settingsCount == 0) {
        $defaultSettings = [
            'beach_name' => 'Pantai Mutiara Indah',
            'beach_tagline' => 'Harmoni Keindahan Pasir Putih & Deburan Ombak Tropis',
            'beach_description' => 'Pantai Mutiara Indah menawarkan pesona keindahan alam tropis yang memukau dengan garis pantai berpasir putih bersih, air laut jernih berwarna biru kehijauan, serta deretan pohon kelapa yang melambai teduh. Destinasi wisata impian keluarga untuk berenang, bermain pasir, menikmati pemandangan matahari terbenam yang eksotis, dan berburu sajian kuliner seafood segar di pinggir pantai.',
            'ticket_price' => '15000',
            'beach_image' => 'api/uploads/beach_default.jpg',
            'beach_facilities' => json_encode([
                'Gazebo Teduh & Nyaman',
                'Area Bermain Anak & Olahraga Pantai',
                'Penyewaan Ban & Perahu Kayak',
                'Toilet Bersih & Kamar Bilas',
                'Mushola Luas & Nyaman',
                'Pusat Kuliner Seafood & Kelapa Muda',
                'Spot Foto Instagramable',
                'Area Parkir Luas & Keamanan 24 Jam'
            ]),
            'beach_gallery' => json_encode([
                'api/uploads/gallery_1.jpg',
                'api/uploads/gallery_2.jpg',
                'api/uploads/gallery_3.jpg',
                'api/uploads/gallery_4.jpg'
            ])
        ];

        $stmt = $pdo->prepare("INSERT INTO settings (meta_key, meta_value) VALUES (?, ?)");
        foreach ($defaultSettings as $key => $val) {
            $stmt->execute([$key, $val]);
        }
    }

    // Seed Histori Transaksi (untuk demo laporan keuangan & chart grafis)
    $trxCount = $pdo->query("SELECT COUNT(*) FROM transactions")->fetchColumn();
    if ($trxCount == 0) {
        // Ambil ID kasir pertama
        $cashierId = $pdo->query("SELECT id FROM users WHERE role = 'kasir' LIMIT 1")->fetchColumn() ?: 2;
        $cashierName = $pdo->query("SELECT name FROM users WHERE role = 'kasir' LIMIT 1")->fetchColumn() ?: 'Kasir';
        
        $price = 15000;
        // Bikin transaksi buatan 6 hari yang lalu sampai hari ini
        $dummyTransactions = [
            ['TKT-20260530-0012', 'Adi Wijaya', 4, $price, 60000, $cashierId, $cashierName, '2026-05-30 08:15:30'],
            ['TKT-20260530-0013', 'Siti Rahma', 2, $price, 30000, $cashierId, $cashierName, '2026-05-30 11:20:00'],
            ['TKT-20260531-0021', 'Rian Hidayat', 5, $price, 75000, $cashierId, $cashierName, '2026-05-31 09:40:12'],
            ['TKT-20260531-0022', 'Rara Jovita', 3, $price, 45000, $cashierId, $cashierName, '2026-05-31 14:10:45'],
            ['TKT-20260601-0031', 'Hendra', 10, $price, 150000, $cashierId, $cashierName, '2026-06-01 10:05:00'],
            ['TKT-20260601-0032', 'Dewi', 2, $price, 30000, $cashierId, $cashierName, '2026-06-01 15:30:00'],
            ['TKT-20260602-0041', 'Bambang Kusuma', 6, $price, 90000, $cashierId, $cashierName, '2026-06-02 09:12:00'],
            ['TKT-20260602-0042', 'Evi', 3, $price, 45000, $cashierId, $cashierName, '2026-06-02 11:55:00'],
            ['TKT-20260603-0051', 'Rizky Pratama', 4, $price, 60000, $cashierId, $cashierName, '2026-06-03 08:30:00'],
            ['TKT-20260603-0052', 'Fitriani', 5, $price, 75000, $cashierId, $cashierName, '2026-06-03 13:45:00'],
            ['TKT-20260604-0061', 'Agus Salim', 8, $price, 120000, $cashierId, $cashierName, '2026-06-04 09:00:00'],
            ['TKT-20260604-0062', 'Larasati', 2, $price, 30000, $cashierId, $cashierName, '2026-06-04 10:30:00']
        ];

        $stmt = $pdo->prepare("INSERT INTO transactions (ticket_code, visitor_name, quantity, ticket_price, total_price, cashier_id, cashier_name, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
        foreach ($dummyTransactions as $trx) {
            $stmt->execute($trx);
        }
    }
} catch (PDOException $e) {
    // Abaikan jika error seeding agar tidak menahan program
}

// ==========================================
// ROUTER API REQUEST
// ==========================================

$action = isset($_GET['action']) ? $_GET['action'] : '';

// Baca JSON input payload untuk request POST
$input = json_decode(file_get_contents('php://input'), true);

switch ($action) {
    
    // 1. GET ALL DATA (Settings + Summary + Dashboard Stats)
    case 'get_all':
        try {
            // Load Settings
            $settingsRaw = $pdo->query("SELECT meta_key, meta_value FROM settings")->fetchAll();
            $settings = [];
            foreach ($settingsRaw as $s) {
                // Decode JSON arrays
                if ($s['meta_key'] === 'beach_facilities' || $s['meta_key'] === 'beach_gallery') {
                    $settings[$s['meta_key']] = json_decode($s['meta_value'], true);
                } else {
                    $settings[$s['meta_key']] = $s['meta_value'];
                }
            }

            // Hitung Ringkasan Statistik
            $totalRevenue = (float)$pdo->query("SELECT SUM(total_price) FROM transactions")->fetchColumn() ?: 0;
            $totalVisitors = (int)$pdo->query("SELECT SUM(quantity) FROM transactions")->fetchColumn() ?: 0;
            $totalTransactions = (int)$pdo->query("SELECT COUNT(*) FROM transactions")->fetchColumn() ?: 0;

            // Transaksi Hari Ini
            $today = date('Y-m-d');
            $todayRevenue = (float)$pdo->query("SELECT SUM(total_price) FROM transactions WHERE DATE(created_at) = '$today'")->fetchColumn() ?: 0;
            $todayVisitors = (int)$pdo->query("SELECT SUM(quantity) FROM transactions WHERE DATE(created_at) = '$today'")->fetchColumn() ?: 0;
            $todayTransactions = (int)$pdo->query("SELECT COUNT(*) FROM transactions WHERE DATE(created_at) = '$today'")->fetchColumn() ?: 0;

            // Histori Transaksi Terbaru (5 Terakhir)
            $recentTrx = $pdo->query("SELECT * FROM transactions ORDER BY created_at DESC LIMIT 5")->fetchAll();
            foreach ($recentTrx as &$rt) {
                $rt['quantity'] = (int)$rt['quantity'];
                $rt['ticket_price'] = (float)$rt['ticket_price'];
                $rt['total_price'] = (float)$rt['total_price'];
            }

            // Data Grafik Penjualan (7 Hari Terakhir)
            $chartQuery = $pdo->query("
                SELECT DATE(created_at) as date, SUM(total_price) as revenue, SUM(quantity) as visitors 
                FROM transactions 
                GROUP BY DATE(created_at) 
                ORDER BY DATE(created_at) ASC 
                LIMIT 7
            ")->fetchAll();

            $chartData = [];
            foreach ($chartQuery as $c) {
                $chartData[] = [
                    "date" => date('d M', strtotime($c['date'])),
                    "revenue" => (float)$c['revenue'],
                    "visitors" => (int)$c['visitors']
                ];
            }

            // Jika data grafik kosong, isi hari ini
            if (empty($chartData)) {
                $chartData[] = [
                    "date" => date('d M'),
                    "revenue" => 0.0,
                    "visitors" => 0
                ];
            }

            echo json_encode([
                "success" => true,
                "settings" => $settings,
                "stats" => [
                    "totalRevenue" => $totalRevenue,
                    "totalVisitors" => $totalVisitors,
                    "totalTransactions" => $totalTransactions,
                    "todayRevenue" => $todayRevenue,
                    "todayVisitors" => $todayVisitors,
                    "todayTransactions" => $todayTransactions,
                ],
                "recentTransactions" => $recentTrx,
                "chartData" => $chartData
            ]);

        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(["success" => false, "message" => "Database error: " . $e->getMessage()]);
        }
        break;

    // 2. LOGIN USER (Terintegrasi Admin & Kasir)
    case 'login':
        $username = isset($input['username']) ? trim($input['username']) : '';
        $password = isset($input['password']) ? trim($input['password']) : '';

        if (empty($username) || empty($password)) {
            echo json_encode(["success" => false, "message" => "Username dan password tidak boleh kosong."]);
            break;
        }

        try {
            $stmt = $pdo->prepare("SELECT * FROM users WHERE username = ? LIMIT 1");
            $stmt->execute([$username]);
            $user = $stmt->fetch();

            if ($user && password_verify($password, $user['password'])) {
                echo json_encode([
                    "success" => true,
                    "user" => [
                        "id" => (int)$user['id'],
                        "username" => $user['username'],
                        "name" => $user['name'],
                        "role" => $user['role']
                    ]
                ]);
            } else {
                echo json_encode(["success" => false, "message" => "Username atau password salah."]);
            }
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(["success" => false, "message" => $e->getMessage()]);
        }
        break;

    // 3. SIMPAN PENGATURAN PANTAI (ADMIN)
    case 'save_settings':
        try {
            $beachName = isset($input['beach_name']) ? trim($input['beach_name']) : '';
            $beachTagline = isset($input['beach_tagline']) ? trim($input['beach_tagline']) : '';
            $beachDescription = isset($input['beach_description']) ? trim($input['beach_description']) : '';
            $ticketPrice = isset($input['ticket_price']) ? (float)$input['ticket_price'] : 0.0;
            $facilities = isset($input['beach_facilities']) ? $input['beach_facilities'] : [];

            // Update ke tabel settings
            $stmt = $pdo->prepare("INSERT INTO settings (meta_key, meta_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE meta_value = VALUES(meta_value)");
            
            $stmt->execute(['beach_name', $beachName]);
            $stmt->execute(['beach_tagline', $beachTagline]);
            $stmt->execute(['beach_description', $beachDescription]);
            $stmt->execute(['ticket_price', $ticketPrice]);
            $stmt->execute(['beach_facilities', json_encode($facilities)]);

            echo json_encode(["success" => true, "message" => "Pengaturan berhasil disimpan."]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(["success" => false, "message" => $e->getMessage()]);
        }
        break;

    // 4. UPLOAD GAMBAR (ADMIN - Pantai Utama / Galeri)
    case 'upload_image':
        if (!isset($_FILES['image'])) {
            echo json_encode(["success" => false, "message" => "Tidak ada file gambar yang diunggah."]);
            break;
        }

        $file = $_FILES['image'];
        $type = isset($_POST['type']) ? $_POST['type'] : 'beach_image'; // beach_image atau gallery
        
        $allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (!in_array($file['type'], $allowedTypes)) {
            echo json_encode(["success" => false, "message" => "Format gambar tidak didukung. Gunakan JPEG, PNG, GIF, atau WebP."]);
            break;
        }

        // Limit size ke 3MB
        if ($file['size'] > 3 * 1024 * 1024) {
            echo json_encode(["success" => false, "message" => "Ukuran file terlalu besar. Maksimal adalah 3MB."]);
            break;
        }

        $extension = pathinfo($file['name'], PATHINFO_EXTENSION);
        $fileName = 'img_' . uniqid() . '.' . $extension;
        $targetPath = 'uploads/' . $fileName;

        if (move_uploaded_file($file['tmp_name'], $targetPath)) {
            $dbPath = 'api/uploads/' . $fileName;

            try {
                if ($type === 'beach_image') {
                    // Update setting gambar utama
                    $stmt = $pdo->prepare("INSERT INTO settings (meta_key, meta_value) VALUES ('beach_image', ?) ON DUPLICATE KEY UPDATE meta_value = VALUES(meta_value)");
                    $stmt->execute([$dbPath]);
                } else {
                    // Masukkan ke galeri
                    $currentGalleryJson = $pdo->query("SELECT meta_value FROM settings WHERE meta_key = 'beach_gallery'")->fetchColumn() ?: '[]';
                    $gallery = json_decode($currentGalleryJson, true);
                    $gallery[] = $dbPath;
                    
                    $stmt = $pdo->prepare("INSERT INTO settings (meta_key, meta_value) VALUES ('beach_gallery', ?) ON DUPLICATE KEY UPDATE meta_value = VALUES(meta_value)");
                    $stmt->execute([json_encode($gallery)]);
                }
                
                echo json_encode(["success" => true, "filePath" => $dbPath]);
            } catch (PDOException $e) {
                echo json_encode(["success" => false, "message" => "Gagal memperbarui database: " . $e->getMessage()]);
            }
        } else {
            echo json_encode(["success" => false, "message" => "Gagal menulis file gambar ke direktori uploads."]);
        }
        break;

    // 5. HAPUS GAMBAR DARI GALERI (ADMIN)
    case 'delete_gallery_image':
        $imagePath = isset($input['image_path']) ? trim($input['image_path']) : '';
        if (empty($imagePath)) {
            echo json_encode(["success" => false, "message" => "Path gambar kosong."]);
            break;
        }

        try {
            $currentGalleryJson = $pdo->query("SELECT meta_value FROM settings WHERE meta_key = 'beach_gallery'")->fetchColumn() ?: '[]';
            $gallery = json_decode($currentGalleryJson, true);
            
            // Cari dan hapus
            if (($key = array_search($imagePath, $gallery)) !== false) {
                unset($gallery[$key]);
                $gallery = array_values($gallery); // Reset index
                
                // Update DB
                $stmt = $pdo->prepare("UPDATE settings SET meta_value = ? WHERE meta_key = 'beach_gallery'");
                $stmt->execute([json_encode($gallery)]);

                // Hapus file fisik jika ada (api/uploads/... -> uploads/...)
                $physicalPath = str_replace('api/', '', $imagePath);
                if (file_exists($physicalPath) && !str_contains($physicalPath, 'default') && !str_contains($physicalPath, 'gallery_')) {
                    unlink($physicalPath);
                }
                
                echo json_encode(["success" => true, "message" => "Gambar berhasil dihapus dari galeri."]);
            } else {
                echo json_encode(["success" => false, "message" => "Gambar tidak ditemukan dalam galeri."]);
            }
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(["success" => false, "message" => $e->getMessage()]);
        }
        break;

    // 6. SIMPAN TRANSAKSI BARU (KASIR POS)
    case 'save_transaction':
        $visitorName = isset($input['visitor_name']) && trim($input['visitor_name']) !== '' ? trim($input['visitor_name']) : 'Umum';
        $quantity = isset($input['quantity']) ? (int)$input['quantity'] : 1;
        $cashierId = isset($input['cashier_id']) ? (int)$input['cashier_id'] : 0;
        $cashierName = isset($input['cashier_name']) ? trim($input['cashier_name']) : 'Kasir';

        if ($quantity <= 0) {
            echo json_encode(["success" => false, "message" => "Jumlah tiket harus lebih dari 0."]);
            break;
        }

        try {
            // Ambil harga tiket aktif dari setting
            $ticketPrice = (float)$pdo->query("SELECT meta_value FROM settings WHERE meta_key = 'ticket_price'")->fetchColumn() ?: 15000.0;
            $totalPrice = $ticketPrice * $quantity;

            // Generate Kode Tiket Unik (Format: TKT-YYYYMMDD-XXXX)
            $datePrefix = date('Ymd');
            // Cek jumlah transaksi hari ini untuk membuat serial sequential
            $todayCount = (int)$pdo->query("SELECT COUNT(*) FROM transactions WHERE DATE(created_at) = CURRENT_DATE()")->fetchColumn() + 1;
            $serial = str_pad($todayCount, 4, '0', STR_PAD_LEFT);
            $ticketCode = "TKT-" . $datePrefix . "-" . $serial;

            // Pastikan benar-benar unik, jika tabrakan tambahkan random suffix
            $checkUnique = $pdo->prepare("SELECT COUNT(*) FROM transactions WHERE ticket_code = ?");
            $checkUnique->execute([$ticketCode]);
            if ($checkUnique->fetchColumn() > 0) {
                $ticketCode = "TKT-" . $datePrefix . "-" . str_pad(rand(1, 9999), 4, '0', STR_PAD_LEFT);
            }

            // Simpan Transaksi
            $stmt = $pdo->prepare("INSERT INTO transactions (ticket_code, visitor_name, quantity, ticket_price, total_price, cashier_id, cashier_name) VALUES (?, ?, ?, ?, ?, ?, ?)");
            $stmt->execute([
                $ticketCode,
                $visitorName,
                $quantity,
                $ticketPrice,
                $totalPrice,
                $cashierId,
                $cashierName
            ]);

            // Ambil ID dan created_at transaksi yang baru tersimpan
            $newId = $pdo->lastInsertId();
            $createdAt = $pdo->query("SELECT created_at FROM transactions WHERE id = $newId")->fetchColumn();

            echo json_encode([
                "success" => true,
                "message" => "Transaksi berhasil disimpan.",
                "transaction" => [
                    "id" => (int)$newId,
                    "ticket_code" => $ticketCode,
                    "visitor_name" => $visitorName,
                    "quantity" => $quantity,
                    "ticket_price" => $ticketPrice,
                    "total_price" => $totalPrice,
                    "cashier_id" => $cashierId,
                    "cashier_name" => $cashierName,
                    "created_at" => $createdAt
                ]
            ]);

        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(["success" => false, "message" => "Gagal memproses transaksi: " . $e->getMessage()]);
        }
        break;

    // 7. GET LAPORAN TRANSAKSI DENGAN FILTER (ADMIN & KASIR)
    case 'get_report':
        $startDate = isset($_GET['start_date']) ? $_GET['start_date'] : '';
        $endDate = isset($_GET['end_date']) ? $_GET['end_date'] : '';
        $cashierFilter = isset($_GET['cashier_id']) ? (int)$_GET['cashier_id'] : 0;

        try {
            $queryStr = "SELECT * FROM transactions WHERE 1=1";
            $params = [];

            if (!empty($startDate)) {
                $queryStr .= " AND DATE(created_at) >= ?";
                $params[] = $startDate;
            }
            if (!empty($endDate)) {
                $queryStr .= " AND DATE(created_at) <= ?";
                $params[] = $endDate;
            }
            if ($cashierFilter > 0) {
                $queryStr .= " AND cashier_id = ?";
                $params[] = $cashierFilter;
            }

            $queryStr .= " ORDER BY created_at DESC";
            
            $stmt = $pdo->prepare($queryStr);
            $stmt->execute($params);
            $transactions = $stmt->fetchAll();

            $totalRevenue = 0;
            $totalVisitors = 0;
            
            foreach ($transactions as &$t) {
                $t['id'] = (int)$t['id'];
                $t['quantity'] = (int)$t['quantity'];
                $t['ticket_price'] = (float)$t['ticket_price'];
                $t['total_price'] = (float)$t['total_price'];
                $totalRevenue += $t['total_price'];
                $totalVisitors += $t['quantity'];
            }

            echo json_encode([
                "success" => true,
                "transactions" => $transactions,
                "summary" => [
                    "totalRevenue" => $totalRevenue,
                    "totalVisitors" => $totalVisitors,
                    "totalTransactions" => count($transactions)
                ]
            ]);

        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(["success" => false, "message" => $e->getMessage()]);
        }
        break;

    // 8. UPDATE CREDENTIALS USER (ADMIN / KASIR)
    case 'update_credentials':
        $userId = isset($input['user_id']) ? (int)$input['user_id'] : 0;
        $username = isset($input['username']) ? trim($input['username']) : '';
        $name = isset($input['name']) ? trim($input['name']) : '';
        $password = isset($input['password']) ? trim($input['password']) : '';

        if ($userId <= 0 || empty($username) || empty($name)) {
            echo json_encode(["success" => false, "message" => "Data tidak lengkap."]);
            break;
        }

        try {
            // Cek username unik, kecualikan user saat ini
            $stmt = $pdo->prepare("SELECT COUNT(*) FROM users WHERE username = ? AND id != ?");
            $stmt->execute([$username, $userId]);
            if ($stmt->fetchColumn() > 0) {
                echo json_encode(["success" => false, "message" => "Username sudah digunakan oleh akun lain."]);
                break;
            }

            if (!empty($password)) {
                $stmt = $pdo->prepare("UPDATE users SET username = ?, name = ?, password = ? WHERE id = ?");
                $stmt->execute([$username, $name, password_hash($password, PASSWORD_DEFAULT), $userId]);
            } else {
                $stmt = $pdo->prepare("UPDATE users SET username = ?, name = ? WHERE id = ?");
                $stmt->execute([$username, $name, $userId]);
            }

            echo json_encode(["success" => true, "message" => "Profil berhasil diperbarui."]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(["success" => false, "message" => $e->getMessage()]);
        }
        break;

    // 9. GET ALL CASHIERS (ADMIN)
    case 'get_cashiers':
        try {
            $stmt = $pdo->query("SELECT id, username, name, role FROM users WHERE role = 'kasir' ORDER BY name ASC");
            $cashiers = $stmt->fetchAll();
            
            foreach ($cashiers as &$c) {
                $c['id'] = (int)$c['id'];
            }
            
            echo json_encode([
                "success" => true,
                "cashiers" => $cashiers
            ]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(["success" => false, "message" => $e->getMessage()]);
        }
        break;

    // 10. SAVE OR UPDATE CASHIER (ADMIN)
    case 'save_cashier':
        $id = isset($input['id']) ? (int)$input['id'] : 0;
        $username = isset($input['username']) ? trim($input['username']) : '';
        $name = isset($input['name']) ? trim($input['name']) : '';
        $password = isset($input['password']) ? trim($input['password']) : '';

        if (empty($username) || empty($name)) {
            echo json_encode(["success" => false, "message" => "Username dan Nama tidak boleh kosong."]);
            break;
        }

        try {
            // Cek keunikan username (kecuali id kasir saat ini)
            $checkStmt = $pdo->prepare("SELECT COUNT(*) FROM users WHERE username = ? AND id != ?");
            $checkStmt->execute([$username, $id]);
            if ($checkStmt->fetchColumn() > 0) {
                echo json_encode(["success" => false, "message" => "Username sudah digunakan oleh akun lain."]);
                break;
            }

            if ($id > 0) {
                // Update
                if (!empty($password)) {
                    $stmt = $pdo->prepare("UPDATE users SET username = ?, name = ?, password = ? WHERE id = ? AND role = 'kasir'");
                    $stmt->execute([$username, $name, password_hash($password, PASSWORD_DEFAULT), $id]);
                } else {
                    $stmt = $pdo->prepare("UPDATE users SET username = ?, name = ? WHERE id = ? AND role = 'kasir'");
                    $stmt->execute([$username, $name, $id]);
                }
                echo json_encode(["success" => true, "message" => "Akun kasir berhasil diperbarui."]);
            } else {
                // Insert Baru
                if (empty($password)) {
                    echo json_encode(["success" => false, "message" => "Password wajib diisi untuk kasir baru."]);
                    break;
                }
                $stmt = $pdo->prepare("INSERT INTO users (username, name, password, role) VALUES (?, ?, ?, 'kasir')");
                $stmt->execute([$username, $name, password_hash($password, PASSWORD_DEFAULT)]);
                echo json_encode(["success" => true, "message" => "Akun kasir baru berhasil dibuat."]);
            }
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(["success" => false, "message" => $e->getMessage()]);
        }
        break;

    // 11. DELETE CASHIER (ADMIN)
    case 'delete_cashier':
        $id = isset($input['id']) ? (int)$input['id'] : 0;
        if ($id <= 0) {
            echo json_encode(["success" => false, "message" => "ID tidak valid."]);
            break;
        }

        try {
            // Pastikan tidak menghapus admin secara tidak sengaja
            $stmt = $pdo->prepare("DELETE FROM users WHERE id = ? AND role = 'kasir'");
            $stmt->execute([$id]);
            echo json_encode(["success" => true, "message" => "Akun kasir berhasil dihapus."]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(["success" => false, "message" => $e->getMessage()]);
        }
        break;

    // 12. VERIFIKASI TIKET SCAN QR CODE (PINTU MASUK)
    case 'validate_ticket':
        $ticketCode = isset($input['ticket_code']) ? trim($input['ticket_code']) : '';
        if (empty($ticketCode)) {
            echo json_encode(["success" => false, "message" => "Kode tiket tidak boleh kosong."]);
            break;
        }

        try {
            $stmt = $pdo->prepare("SELECT * FROM transactions WHERE ticket_code = ? LIMIT 1");
            $stmt->execute([$ticketCode]);
            $trx = $stmt->fetch();

            if (!$trx) {
                echo json_encode(["success" => false, "message" => "Tiket tidak terdaftar atau tidak valid."]);
                break;
            }

            if ($trx['status'] === 'used') {
                $scannedTime = date('d M Y H:i', strtotime($trx['scanned_at']));
                echo json_encode([
                    "success" => false,
                    "message" => "Tiket sudah pernah digunakan pada " . $scannedTime . ".",
                    "transaction" => [
                        "ticket_code" => $trx['ticket_code'],
                        "visitor_name" => $trx['visitor_name'],
                        "quantity" => (int)$trx['quantity'],
                        "scanned_at" => $trx['scanned_at']
                    ]
                ]);
            } else {
                // Update status tiket menjadi used dan catat waktu scan
                $updateStmt = $pdo->prepare("UPDATE transactions SET status = 'used', scanned_at = CURRENT_TIMESTAMP WHERE id = ?");
                $updateStmt->execute([$trx['id']]);

                // Ambil waktu terupdate
                $scannedAt = $pdo->query("SELECT scanned_at FROM transactions WHERE id = " . $trx['id'])->fetchColumn();

                echo json_encode([
                    "success" => true,
                    "message" => "Verifikasi Berhasil! Selamat Datang di Pantai.",
                    "transaction" => [
                        "ticket_code" => $trx['ticket_code'],
                        "visitor_name" => $trx['visitor_name'],
                        "quantity" => (int)$trx['quantity'],
                        "scanned_at" => $scannedAt
                    ]
                ]);
            }
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(["success" => false, "message" => $e->getMessage()]);
        }
        break;

    // Aksi default jika tidak ditemukan
    default:
        http_response_code(404);
        echo json_encode(["success" => false, "message" => "Aksi API tidak valid."]);
        break;
}
