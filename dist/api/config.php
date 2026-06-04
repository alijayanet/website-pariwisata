<?php
// config.php - Konfigurasi Database MySQL untuk Wisata Pantai

define('DB_HOST', 'localhost');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_NAME', 'wisata_pantai');

// Aktifkan error reporting untuk pengembangan (bisa dimatikan saat production)
error_reporting(E_ALL);
ini_set('display_errors', 1);
