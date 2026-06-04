// Helper Database Client API untuk Koneksi PHP & MySQL Terpusat

// Tentukan base URL API secara dinamis:
// Jika dijalankan di Vite Dev Server (port 5173), arahkan ke localhost PHP (misal project di-host di server lokal Apache/XAMPP/Laragon)
// Jika di production, gunakan relative path 'api/api.php'
const API_BASE = window.location.port === '5173' 
  ? 'http://localhost:8000/api/api.php' 
  : 'api/api.php';

export const getImageUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  const base = window.location.port === '5173' 
    ? 'http://localhost:8000/' 
    : '';
  return base + path;
};

// Helper untuk mengirim request HTTP POST berupa JSON
const postRequest = async (action, data = {}) => {
  try {
    const response = await fetch(`${API_BASE}?action=${action}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    if (!result.success) {
      throw new Error(result.message || 'Terjadi kesalahan pada server.');
    }
    return result;
  } catch (error) {
    console.error(`Gagal melakukan aksi ${action}:`, error);
    throw error;
  }
};

// API Client untuk CRUD Terpusat
export const db = {
  // Memuat seluruh data (Pengaturan + Ringkasan Dashboard + Grafik + Transaksi Terbaru)
  loadAll: async () => {
    try {
      const response = await fetch(`${API_BASE}?action=get_all`);
      if (!response.ok) {
        throw new Error(`Koneksi server gagal (Status: ${response.status})`);
      }
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || 'Gagal memuat data dari database.');
      }
      return data;
    } catch (error) {
      console.error('Gagal memuat database dari server:', error);
      throw error;
    }
  },

  // Login Terintegrasi Admin & Kasir
  login: async (username, password) => {
    return await postRequest('login', { username, password });
  },

  // Simpan Pengaturan Pantai (ADMIN)
  saveSettings: async (settingsData) => {
    return await postRequest('save_settings', settingsData);
  },

  // Upload Gambar Pantai/Galeri (ADMIN)
  uploadImage: async (file, type = 'beach_image') => {
    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('type', type);

      const response = await fetch(`${API_BASE}?action=upload_image`, {
        method: 'POST',
        body: formData // Jangan set Content-Type header agar browser otomatis men-set boundary-nya
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.message || 'Gagal mengunggah gambar.');
      }
      return result;
    } catch (error) {
      console.error('Gagal mengunggah gambar:', error);
      throw error;
    }
  },

  // Hapus Gambar dari Galeri Pantai (ADMIN)
  deleteGalleryImage: async (imagePath) => {
    return await postRequest('delete_gallery_image', { image_path: imagePath });
  },

  // Simpan Transaksi Penjualan Tiket Baru (KASIR POS)
  saveTransaction: async (quantity, visitorName = 'Umum', cashierId, cashierName) => {
    return await postRequest('save_transaction', {
      quantity,
      visitor_name: visitorName,
      cashier_id: cashierId,
      cashier_name: cashierName
    });
  },

  // Ambil Laporan Keuangan Harian/Bulanan (ADMIN & KASIR)
  getReport: async (startDate = '', endDate = '', cashierId = 0) => {
    try {
      const queryParams = new URLSearchParams();
      if (startDate) queryParams.append('start_date', startDate);
      if (endDate) queryParams.append('end_date', endDate);
      if (cashierId) queryParams.append('cashier_id', cashierId);

      const response = await fetch(`${API_BASE}?action=get_report&${queryParams.toString()}`);
      if (!response.ok) {
        throw new Error(`Koneksi server gagal (Status: ${response.status})`);
      }
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || 'Gagal memuat laporan dari database.');
      }
      return data;
    } catch (error) {
      console.error('Gagal memuat laporan:', error);
      throw error;
    }
  },

  // Perbarui Kredensial & Nama User (ADMIN & KASIR)
  updateCredentials: async (userId, username, name, password = '') => {
    return await postRequest('update_credentials', {
      user_id: userId,
      username,
      name,
      password
    });
  },

  // Ambil Semua Petugas Kasir (ADMIN)
  getCashiers: async () => {
    try {
      const response = await fetch(`${API_BASE}?action=get_cashiers`);
      if (!response.ok) {
        throw new Error(`Koneksi server gagal (Status: ${response.status})`);
      }
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || 'Gagal memuat data kasir.');
      }
      return data.cashiers;
    } catch (error) {
      console.error('Gagal memuat daftar kasir:', error);
      throw error;
    }
  },

  // Simpan/Update Petugas Kasir (ADMIN)
  saveCashier: async (cashierData) => {
    return await postRequest('save_cashier', cashierData);
  },

  // Hapus Petugas Kasir (ADMIN)
  deleteCashier: async (id) => {
    return await postRequest('delete_cashier', { id });
  },

  // Verifikasi Karcis via scan QR code (KASIR / PINTU MASUK)
  validateTicket: async (ticketCode) => {
    return await postRequest('validate_ticket', { ticket_code: ticketCode });
  }
};
