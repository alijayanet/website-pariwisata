import React, { useState, useEffect } from 'react';
import { db, getImageUrl } from '../utils/db';
import StatCard from '../components/StatCard';
import CustomChart from '../components/CustomChart';
import { 
  LayoutDashboard, Settings, Image, FileText, User, LogOut, 
  Plus, Trash2, Save, Upload, Calendar, DollarSign, Users, 
  TrendingUp, Check, AlertCircle, Sun, Moon, Sparkles, Menu
} from 'lucide-react';

export default function AdminDashboard({ dbData, onLogout, onDataChange }) {
  const [activeMenu, setActiveMenu] = useState('overview'); // 'overview', 'settings', 'gallery', 'reports', 'account'
  const [theme, setTheme] = useState(document.documentElement.getAttribute('data-theme') || 'light');
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  
  // States untuk Settings Form
  const [beachName, setBeachName] = useState(dbData.settings.beach_name || '');
  const [beachTagline, setBeachTagline] = useState(dbData.settings.beach_tagline || '');
  const [beachDescription, setBeachDescription] = useState(dbData.settings.beach_description || '');
  const [facilities, setFacilities] = useState(dbData.settings.beach_facilities || []);
  const [ticketPrice, setTicketPrice] = useState(dbData.settings.ticket_price || 15000);
  const [ticketTitle, setTicketTitle] = useState(dbData.settings.ticket_title || 'Harga Tiket Masuk');
  const [ticketSubtitle, setTicketSubtitle] = useState(dbData.settings.ticket_subtitle || 'Tarif tiket masuk terjangkau bagi semua kalangan masyarakat untuk berwisata.');
  const [ticketCardTitle, setTicketCardTitle] = useState(dbData.settings.ticket_card_title || 'Tiket Masuk Umum');
  const [ticketNote, setTicketNote] = useState(dbData.settings.ticket_note || 'Pembayaran dan pencetakan karcis ber-QR Code dilakukan secara tunai/non-tunai langsung di loket kasir pintu masuk utama.');
  const [ticketFeatures, setTicketFeatures] = useState(dbData.settings.ticket_features || [
    'Akses Penuh Seluruh Area Pantai',
    'Gratis Fasilitas Toilet & Kamar Bilas',
    'Sudah Termasuk Asuransi Jiwa Jasa Raharja'
  ]);
  const [newFeature, setNewFeature] = useState('');

  // States untuk File Uploads
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);
  const [galleryFile, setGalleryFile] = useState(null);
  const [galleryPreview, setGalleryPreview] = useState(null);
  const [uploadLoading, setUploadLoading] = useState(false);

  // States untuk Laporan
  const [reportStartDate, setReportStartDate] = useState(dateOffset(-7));
  const [reportEndDate, setReportEndDate] = useState(dateOffset(0));
  const [reportData, setReportData] = useState([]);
  const [reportSummary, setReportSummary] = useState({ totalRevenue: 0, totalVisitors: 0, totalTransactions: 0 });
  const [reportLoading, setReportLoading] = useState(false);

  // States untuk Akun
  const [accountUsername, setAccountUsername] = useState(dbData.user ? dbData.user.username : 'admin');
  const [accountName, setAccountName] = useState(dbData.user ? dbData.user.name : 'Administrator');
  const [accountPassword, setAccountPassword] = useState('');
  const [accountError, setAccountError] = useState(null);

  // Status Alerts
  const [alert, setAlert] = useState(null);

  // States untuk Facilities CRUD
  const [isFacilityModalOpen, setIsFacilityModalOpen] = useState(false);
  const [facilityEditIndex, setFacilityEditIndex] = useState(-1);
  const [facilityTitle, setFacilityTitle] = useState('');
  const [facilityDesc, setFacilityDesc] = useState('');

  // States untuk Cashier CRUD
  const [cashiers, setCashiers] = useState([]);
  const [cashierLoading, setCashierLoading] = useState(false);
  const [isCashierModalOpen, setIsCashierModalOpen] = useState(false);
  const [cashierEditId, setCashierEditId] = useState(0);
  const [cashierUsername, setCashierUsername] = useState('');
  const [cashierName, setCashierName] = useState('');
  const [cashierPassword, setCashierPassword] = useState('');
  const [cashierError, setCashierError] = useState(null);

  // Efek sinkronisasi data dari DB saat update
  useEffect(() => {
    if (dbData?.settings) {
      setBeachName(dbData.settings.beach_name || '');
      setBeachTagline(dbData.settings.beach_tagline || '');
      setBeachDescription(dbData.settings.beach_description || '');
      setTicketPrice(dbData.settings.ticket_price || 15000);
      setFacilities(dbData.settings.beach_facilities || []);
      setTicketTitle(dbData.settings.ticket_title || 'Harga Tiket Masuk');
      setTicketSubtitle(dbData.settings.ticket_subtitle || 'Tarif tiket masuk terjangkau bagi semua kalangan masyarakat untuk berwisata.');
      setTicketCardTitle(dbData.settings.ticket_card_title || 'Tiket Masuk Umum');
      setTicketNote(dbData.settings.ticket_note || 'Pembayaran dan pencetakan karcis ber-QR Code dilakukan secara tunai/non-tunai langsung di loket kasir pintu masuk utama.');
      setTicketFeatures(dbData.settings.ticket_features || []);
    }
  }, [dbData]);

  // Utility offset tanggal YYYY-MM-DD
  function dateOffset(days) {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
  }

  // Load Laporan saat menu Laporan diaktifkan
  useEffect(() => {
    if (activeMenu === 'reports') {
      loadReport();
    }
  }, [activeMenu]);

  // Load Kasir saat menu Kasir diaktifkan
  useEffect(() => {
    if (activeMenu === 'cashiers') {
      loadCashiers();
    }
  }, [activeMenu]);

  // Efek ganti tema
  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
  };

  const triggerAlert = (type, message) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 4000);
  };

  // 1. Simpan Pengaturan Website
  const handleSaveSettings = async (e) => {
    e.preventDefault();
    try {
      const response = await db.saveSettings({
        beach_name: beachName,
        beach_tagline: beachTagline,
        beach_description: beachDescription,
        ticket_price: ticketPrice,
        beach_facilities: facilities,
        ticket_title: ticketTitle,
        ticket_subtitle: ticketSubtitle,
        ticket_card_title: ticketCardTitle,
        ticket_note: ticketNote,
        ticket_features: ticketFeatures
      });
      if (response.success) {
        triggerAlert('success', 'Pengaturan pantai berhasil diperbarui.');
        onDataChange(); // Pemicu reload data utama di App.jsx
      }
    } catch (err) {
      triggerAlert('danger', 'Gagal menyimpan pengaturan pantai.');
    }
  };

  // Kelola Fasilitas List CRUD
  const handleOpenFacilityModal = (index = -1) => {
    if (index === -1) {
      setFacilityTitle('');
      setFacilityDesc('');
      setFacilityEditIndex(-1);
    } else {
      const fac = facilities[index];
      const title = typeof fac === 'object' ? fac.title : fac;
      const desc = typeof fac === 'object' ? fac.description : '';
      setFacilityTitle(title);
      setFacilityDesc(desc);
      setFacilityEditIndex(index);
    }
    setIsFacilityModalOpen(true);
  };

  const handleSaveFacility = async (e) => {
    e.preventDefault();
    if (!facilityTitle.trim()) return;

    const newFacilityObj = {
      title: facilityTitle.trim(),
      description: facilityDesc.trim()
    };

    let updatedFacilities = [...facilities];
    if (facilityEditIndex === -1) {
      updatedFacilities.push(newFacilityObj);
    } else {
      updatedFacilities[facilityEditIndex] = newFacilityObj;
    }

    try {
      const response = await db.saveSettings({
        beach_name: beachName,
        beach_tagline: beachTagline,
        beach_description: beachDescription,
        ticket_price: ticketPrice,
        beach_facilities: updatedFacilities
      });
      if (response.success) {
        triggerAlert('success', facilityEditIndex === -1 ? 'Fasilitas berhasil ditambahkan.' : 'Fasilitas berhasil diperbarui.');
        setIsFacilityModalOpen(false);
        onDataChange();
      }
    } catch (err) {
      triggerAlert('danger', 'Gagal menyimpan fasilitas.');
    }
  };

  const handleDeleteFacility = async (index) => {
    if (!confirm('Apakah Anda yakin ingin menghapus fasilitas ini?')) return;
    
    const updatedFacilities = facilities.filter((_, i) => i !== index);

    try {
      const response = await db.saveSettings({
        beach_name: beachName,
        beach_tagline: beachTagline,
        beach_description: beachDescription,
        ticket_price: ticketPrice,
        beach_facilities: updatedFacilities
      });
      if (response.success) {
        triggerAlert('success', 'Fasilitas berhasil dihapus.');
        onDataChange();
      }
    } catch (err) {
      triggerAlert('danger', 'Gagal menghapus fasilitas.');
    }
  };

  // Kelola Keuntungan Tiket
  const handleAddFeature = () => {
    if (newFeature.trim() && !ticketFeatures.includes(newFeature.trim())) {
      setTicketFeatures([...ticketFeatures, newFeature.trim()]);
      setNewFeature('');
    }
  };

  const handleRemoveFeature = (idx) => {
    setTicketFeatures(ticketFeatures.filter((_, i) => i !== idx));
  };

  // 2. Unggah Gambar Utama (Cover Hero)
  const handleCoverUpload = async () => {
    if (!coverFile) return;
    setUploadLoading(true);
    try {
      const response = await db.uploadImage(coverFile, 'beach_image');
      if (response.success) {
        triggerAlert('success', 'Gambar sampul utama berhasil diperbarui.');
        setCoverFile(null);
        setCoverPreview(null);
        onDataChange();
      }
    } catch (err) {
      triggerAlert('danger', err.message || 'Gagal mengunggah gambar sampul.');
    } finally {
      setUploadLoading(false);
    }
  };

  // 3. Unggah Gambar Galeri
  const handleGalleryUpload = async () => {
    if (!galleryFile) return;
    setUploadLoading(true);
    try {
      const response = await db.uploadImage(galleryFile, 'gallery');
      if (response.success) {
        triggerAlert('success', 'Gambar berhasil ditambahkan ke galeri.');
        setGalleryFile(null);
        setGalleryPreview(null);
        onDataChange();
      }
    } catch (err) {
      triggerAlert('danger', err.message || 'Gagal mengunggah gambar galeri.');
    } finally {
      setUploadLoading(false);
    }
  };

  // 4. Hapus Gambar Galeri
  const handleDeleteGallery = async (path) => {
    if (!confirm('Apakah Anda yakin ingin menghapus gambar ini dari galeri publik?')) return;
    try {
      const response = await db.deleteGalleryImage(path);
      if (response.success) {
        triggerAlert('success', 'Gambar berhasil dihapus dari galeri.');
        onDataChange();
      }
    } catch (err) {
      triggerAlert('danger', 'Gagal menghapus gambar.');
    }
  };

  // 5. Muat Laporan Keuangan
  const loadReport = async () => {
    setReportLoading(true);
    try {
      const data = await db.getReport(reportStartDate, reportEndDate);
      if (data.success) {
        setReportData(data.transactions);
        setReportSummary(data.summary);
      }
    } catch (err) {
      console.error(err);
      triggerAlert('danger', 'Gagal memuat laporan transaksi.');
    } finally {
      setReportLoading(false);
    }
  };

  // 6. Simpan Perubahan Akun Admin
  const handleSaveAccount = async (e) => {
    e.preventDefault();
    setAccountError(null);
    try {
      const response = await db.updateCredentials(
        dbData.user ? dbData.user.id : 1,
        accountUsername,
        accountName,
        accountPassword
      );
      if (response.success) {
        triggerAlert('success', 'Kredensial akun berhasil diperbarui.');
        setAccountPassword('');
        onDataChange();
      }
    } catch (err) {
      setAccountError(err.message || 'Gagal memperbarui profil.');
    }
  };

  const loadCashiers = async () => {
    setCashierLoading(true);
    try {
      const list = await db.getCashiers();
      setCashiers(list);
    } catch (err) {
      triggerAlert('danger', 'Gagal memuat daftar kasir.');
    } finally {
      setCashierLoading(false);
    }
  };

  const handleOpenCashierModal = (cashier = null) => {
    setCashierError(null);
    if (!cashier) {
      setCashierEditId(0);
      setCashierUsername('');
      setCashierName('');
      setCashierPassword('');
    } else {
      setCashierEditId(cashier.id);
      setCashierUsername(cashier.username);
      setCashierName(cashier.name);
      setCashierPassword('');
    }
    setIsCashierModalOpen(true);
  };

  const handleSaveCashier = async (e) => {
    e.preventDefault();
    if (!cashierUsername.trim() || !cashierName.trim()) return;
    if (cashierEditId === 0 && !cashierPassword) {
      setCashierError('Password wajib diisi untuk kasir baru.');
      return;
    }

    try {
      const response = await db.saveCashier({
        id: cashierEditId,
        username: cashierUsername.trim(),
        name: cashierName.trim(),
        password: cashierPassword
      });
      if (response.success) {
        triggerAlert('success', cashierEditId === 0 ? 'Kasir baru berhasil ditambahkan.' : 'Data kasir berhasil diperbarui.');
        setIsCashierModalOpen(false);
        loadCashiers();
      }
    } catch (err) {
      setCashierError(err.message || 'Gagal menyimpan data kasir.');
    }
  };

  const handleDeleteCashier = async (id) => {
    if (!confirm('Apakah Anda yakin ingin menghapus petugas kasir ini? Semua transaksi kasir ini tetap tersimpan di laporan.')) return;
    try {
      const response = await db.deleteCashier(id);
      if (response.success) {
        triggerAlert('success', 'Petugas kasir berhasil dihapus.');
        loadCashiers();
      }
    } catch (err) {
      triggerAlert('danger', 'Gagal menghapus kasir.');
    }
  };

  const formatRupiah = (value) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(value);
  };

  return (
    <div className="dashboard-layout">
      {/* ==================================================== */}
      {/* SIDEBAR                                              */}
      {/* ==================================================== */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <Sparkles size={24} style={{ color: 'var(--accent-light)' }} />
          <span className="sidebar-brand-name">ADMIN PORTAL</span>
        </div>
        
        <ul className="sidebar-menu">
          <li 
            className={`sidebar-item ${activeMenu === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveMenu('overview')}
          >
            <LayoutDashboard size={18} />
            <span>Ringkasan</span>
          </li>
          <li 
            className={`sidebar-item ${activeMenu === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveMenu('settings')}
          >
            <Settings size={18} />
            <span>Pengaturan Pantai</span>
          </li>
          <li 
            className={`sidebar-item ${activeMenu === 'facilities' ? 'active' : ''}`}
            onClick={() => setActiveMenu('facilities')}
          >
            <Sparkles size={18} />
            <span>Manajemen Fasilitas</span>
          </li>
          <li 
            className={`sidebar-item ${activeMenu === 'gallery' ? 'active' : ''}`}
            onClick={() => setActiveMenu('gallery')}
          >
            <Image size={18} />
            <span>Manajemen Galeri</span>
          </li>
          <li 
            className={`sidebar-item ${activeMenu === 'reports' ? 'active' : ''}`}
            onClick={() => setActiveMenu('reports')}
          >
            <FileText size={18} />
            <span>Laporan Keuangan</span>
          </li>
          <li 
            className={`sidebar-item ${activeMenu === 'cashiers' ? 'active' : ''}`}
            onClick={() => setActiveMenu('cashiers')}
          >
            <Users size={18} />
            <span>Manajemen Kasir</span>
          </li>
          <li 
            className={`sidebar-item ${activeMenu === 'account' ? 'active' : ''}`}
            onClick={() => setActiveMenu('account')}
          >
            <User size={18} />
            <span>Akun Saya</span>
          </li>
        </ul>

        <div className="sidebar-footer">
          <button 
            className="btn btn-secondary btn-sm"
            onClick={toggleTheme}
            style={{ 
              backgroundColor: 'rgba(255,255,255,0.05)', 
              color: 'white', 
              borderColor: 'rgba(255,255,255,0.1)',
              justifyContent: 'center' 
            }}
          >
            {theme === 'light' ? (
              <>
                <Moon size={16} />
                <span>Mode Gelap</span>
              </>
            ) : (
              <>
                <Sun size={16} />
                <span>Mode Terang</span>
              </>
            )}
          </button>
          
          <button 
            className="btn btn-danger btn-sm" 
            onClick={onLogout}
            style={{ justifyContent: 'center' }}
          >
            <LogOut size={16} />
            <span>Keluar</span>
          </button>
        </div>
      </aside>

      {/* ==================================================== */}
      {/* MAIN CONTENT                                         */}
      {/* ==================================================== */}
      <main className="main-content">
        {/* Header Dasbor */}
        <header className="dashboard-header">
          <div className="dashboard-header-title" style={{ textAlign: 'left' }}>
            <h2>{dbData.settings.beach_name || 'Pantai Mutiara Indah'}</h2>
            <p>Selamat Datang di Portal Admin Pengelola Kawasan Wisata Pantai</p>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span className="badge badge-info mobile-hidden" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
              Level: {dbData.user ? dbData.user.name : 'Administrator'}
            </span>
            <div className="mobile-header-actions">
              <button 
                onClick={toggleTheme} 
                className="btn btn-secondary btn-sm btn-icon-only"
                style={{ padding: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                title="Ganti Tema"
              >
                {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
              </button>
              <button 
                onClick={onLogout} 
                className="btn btn-danger btn-sm btn-icon-only"
                style={{ padding: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                title="Keluar"
              >
                <LogOut size={16} />
              </button>
            </div>
          </div>
        </header>

        {/* Notifikasi Alert Mengambang */}
        {alert && (
          <div 
            style={{
              position: 'fixed',
              top: '20px',
              right: '20px',
              backgroundColor: alert.type === 'success' ? '#065f46' : '#991b1b',
              color: 'white',
              padding: '12px 24px',
              borderRadius: 'var(--radius-md)',
              boxShadow: 'var(--shadow-lg)',
              zIndex: 9999,
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              fontWeight: '600',
              animation: 'slideIn 0.3s ease'
            }}
          >
            {alert.type === 'success' ? <Check size={18} /> : <AlertCircle size={18} />}
            <span>{alert.message}</span>
          </div>
        )}

        {/* Dashboard Body */}
        <div className="dashboard-body">
          
          {/* ==================================================== */}
          {/* MENU 1: OVERVIEW                                     */}
          {/* ==================================================== */}
          {activeMenu === 'overview' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
              
              {/* Grid Metrik Ringkasan */}
              <div className="metrics-grid">
                <StatCard 
                  title="Total Pendapatan" 
                  value={formatRupiah(dbData.stats.totalRevenue)} 
                  icon={DollarSign} 
                  color="var(--primary)" 
                  bgLight="rgba(2, 132, 199, 0.1)"
                />
                <StatCard 
                  title="Total Pengunjung" 
                  value={`${dbData.stats.totalVisitors.toLocaleString()} Orang`} 
                  icon={Users} 
                  color="var(--emerald)" 
                  bgLight="rgba(13, 148, 136, 0.1)"
                />
                <StatCard 
                  title="Pendapatan Hari Ini" 
                  value={formatRupiah(dbData.stats.todayRevenue)} 
                  icon={TrendingUp} 
                  color="var(--accent)" 
                  bgLight="rgba(245, 158, 11, 0.1)"
                />
                <StatCard 
                  title="Pengunjung Hari Ini" 
                  value={`${dbData.stats.todayVisitors} Orang`} 
                  icon={Users} 
                  color="#ec4899" 
                  bgLight="rgba(236, 72, 153, 0.1)"
                />
              </div>

              {/* Grid Grafik & Transaksi Terbaru */}
              <div className="dashboard-grid-2col">
                {/* Panel Grafik */}
                <div className="card">
                  <CustomChart data={dbData.chartData} />
                </div>

                {/* Panel Transaksi Terbaru */}
                <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'left' }}>
                  <h4 style={{ fontWeight: '700', fontSize: '1rem' }}>Transaksi Terbaru Loket</h4>
                  
                  <div className="table-container">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Kode</th>
                          <th>Qty</th>
                          <th>Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dbData.recentTransactions && dbData.recentTransactions.map((trx, i) => (
                          <tr key={i}>
                            <td style={{ fontWeight: '600', fontSize: '0.85rem' }}>{trx.ticket_code}</td>
                            <td>{trx.quantity}</td>
                            <td style={{ fontWeight: '700' }}>{formatRupiah(trx.total_price)}</td>
                          </tr>
                        ))}
                        {(!dbData.recentTransactions || dbData.recentTransactions.length === 0) && (
                          <tr>
                            <td colSpan="3" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Belum ada data transaksi.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* ==================================================== */}
          {/* MENU 2: SETTINGS PANTAI                              */}
          {/* ==================================================== */}
          {activeMenu === 'settings' && (
            <div className="dashboard-grid-settings">
              
            {/* Form Input Detail Pantai */}
              <div className="card" style={{ textAlign: 'left' }}>
                <h3 style={{ fontWeight: '800', fontSize: '1.25rem', marginBottom: '20px' }}>Detail Kawasan Pantai</h3>
                
                <form onSubmit={handleSaveSettings} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div className="form-group">
                    <label>Nama Wisata Pantai</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      value={beachName}
                      onChange={(e) => setBeachName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Slogan (Tagline) Pantai</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      value={beachTagline}
                      onChange={(e) => setBeachTagline(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Deskripsi Wisata Pantai</label>
                    <textarea 
                      className="form-control" 
                      rows="4" 
                      value={beachDescription}
                      onChange={(e) => setBeachDescription(e.target.value)}
                      required
                      style={{ resize: 'none' }}
                    ></textarea>
                  </div>

                  {/* Pengaturan Harga Tiket & Konten Tiket CRUD */}
                  <div style={{ borderTop: '1px solid var(--border)', margin: '20px 0 10px', paddingTop: '20px' }}>
                    <h4 style={{ fontWeight: '800', fontSize: '1.05rem', color: 'var(--primary)' }}>Konten Bagian Tiket Masuk</h4>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Judul Bagian Tiket</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        value={ticketTitle}
                        onChange={(e) => setTicketTitle(e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label>Sub-judul Bagian Tiket</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        value={ticketSubtitle}
                        onChange={(e) => setTicketSubtitle(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Nama Kategori Tiket (di Kartu)</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        value={ticketCardTitle}
                        onChange={(e) => setTicketCardTitle(e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label>Tarif Tiket Masuk (Rp)</label>
                      <input 
                        type="number" 
                        className="form-control" 
                        value={ticketPrice}
                        onChange={(e) => setTicketPrice(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Catatan/Info di Bawah Tiket</label>
                    <textarea 
                      className="form-control" 
                      rows="3" 
                      value={ticketNote}
                      onChange={(e) => setTicketNote(e.target.value)}
                      style={{ resize: 'none' }}
                    ></textarea>
                  </div>

                  {/* Editor Fitur Keuntungan Tiket */}
                  <div className="form-group">
                    <label>Fitur / Keuntungan Tiket (Daftar Ceklis)</label>
                    <div className="facility-tag-input">
                      <input 
                        type="text" 
                        className="form-control" 
                        placeholder="Ketik keuntungan baru..."
                        value={newFeature}
                        onChange={(e) => setNewFeature(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddFeature())}
                      />
                      <button 
                        type="button" 
                        onClick={handleAddFeature} 
                        className="btn btn-emerald"
                      >
                        <Plus size={18} />
                      </button>
                    </div>

                    <div className="facility-tags-container">
                      {ticketFeatures.map((feat, idx) => (
                        <span key={idx} className="facility-tag">
                          <span>{feat}</span>
                          <Trash2 
                            size={14} 
                            className="facility-tag-remove" 
                            onClick={() => handleRemoveFeature(idx)} 
                          />
                        </span>
                      ))}
                      {ticketFeatures.length === 0 && (
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Belum ada fitur dimasukkan.</span>
                      )}
                    </div>
                  </div>

                  {/* Bagian Pengaturan Fasilitas Dihapus karena Pindah ke Tab CRUD Khusus */}

                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
                    <button type="submit" className="btn btn-primary">
                      <Save size={18} />
                      <span>Simpan Perubahan</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* Upload Gambar Utama Pantai */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                <div className="card" style={{ textAlign: 'left' }}>
                  <h3 style={{ fontWeight: '800', fontSize: '1.25rem', marginBottom: '16px' }}>Foto Sampul Pantai</h3>
                  
                  {/* Preview Gambar */}
                  <div 
                    style={{
                      width: '100%',
                      height: '180px',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: 'var(--bg-base)',
                      backgroundImage: `url(${coverPreview || getImageUrl(dbData.settings.beach_image)})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      border: '1px solid var(--border)',
                      marginBottom: '16px'
                    }}
                  ></div>

                  {/* Input File */}
                  <div className="form-group">
                    <label 
                      style={{ 
                        border: '2px dashed var(--border)', 
                        padding: '16px', 
                        borderRadius: 'var(--radius-md)', 
                        display: 'flex', 
                        flexDirection: 'column', 
                        alignItems: 'center', 
                        cursor: 'pointer',
                        gap: '6px'
                      }}
                      className="upload-label-hover"
                    >
                      <Upload size={24} style={{ color: 'var(--primary)' }} />
                      <span style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>Pilih File Foto Baru</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Format JPG/PNG/WebP, Max 3MB</span>
                      <input 
                        type="file" 
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files[0];
                          if (file) {
                            setCoverFile(file);
                            setCoverPreview(URL.createObjectURL(file));
                          }
                        }}
                        style={{ display: 'none' }}
                      />
                    </label>
                  </div>

                  {coverFile && (
                    <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                      <button 
                        onClick={handleCoverUpload} 
                        className="btn btn-primary" 
                        disabled={uploadLoading}
                        style={{ flex: 1 }}
                      >
                        {uploadLoading ? 'Mengunggah...' : 'Upload Gambar'}
                      </button>
                      <button 
                        onClick={() => {
                          setCoverFile(null);
                          setCoverPreview(null);
                        }} 
                        className="btn btn-secondary btn-sm"
                      >
                        Batal
                      </button>
                    </div>
                  )}
                </div>
              </div>

            </div>
          )}

          {/* ==================================================== */}
          {/* MENU: MANAJEMEN FASILITAS (CRUD)                     */}
          {/* ==================================================== */}
          {activeMenu === 'facilities' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '30px', textAlign: 'left' }}>
              
              {/* Card List Fasilitas */}
              <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                  <h3 style={{ fontWeight: '800', fontSize: '1.25rem', margin: 0 }}>Daftar Fasilitas Wisata</h3>
                  <button 
                    onClick={() => handleOpenFacilityModal(-1)} 
                    className="btn btn-emerald btn-sm"
                  >
                    <Plus size={16} />
                    <span>Tambah Fasilitas Baru</span>
                  </button>
                </div>

                <div className="table-container">
                  <table className="table">
                    <thead>
                      <tr>
                        <th style={{ width: '25%' }}>Nama Fasilitas</th>
                        <th>Deskripsi</th>
                        <th style={{ width: '15%', textAlign: 'center' }}>Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {facilities.map((fac, idx) => {
                        const title = typeof fac === 'object' ? fac.title : fac;
                        const desc = typeof fac === 'object' ? fac.description : 'Tersedia untuk seluruh pengunjung demi kenyamanan rekreasi di pantai.';
                        return (
                          <tr key={idx}>
                            <td style={{ fontWeight: '700' }}>{title}</td>
                            <td style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{desc}</td>
                            <td>
                              <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                <button 
                                  onClick={() => handleOpenFacilityModal(idx)} 
                                  className="btn btn-secondary btn-sm"
                                  style={{ padding: '6px 10px' }}
                                >
                                  Edit
                                </button>
                                <button 
                                  onClick={() => handleDeleteFacility(idx)} 
                                  className="btn btn-danger btn-sm"
                                  style={{ padding: '6px 10px' }}
                                >
                                  Hapus
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                      {facilities.length === 0 && (
                        <tr>
                          <td colSpan="3" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                            Belum ada fasilitas dimasukkan. Silakan tambah baru.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Modal CRUD Fasilitas (Tambah/Edit) */}
              {isFacilityModalOpen && (
                <div className="modal-overlay">
                  <div className="modal-content">
                    <div className="modal-header">
                      <h3>{facilityEditIndex === -1 ? 'Tambah Fasilitas Baru' : 'Edit Fasilitas Wisata'}</h3>
                      <button className="modal-close" onClick={() => setIsFacilityModalOpen(false)}>&times;</button>
                    </div>
                    
                    <form onSubmit={handleSaveFacility}>
                      <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div className="form-group">
                          <label>Nama Fasilitas</label>
                          <input 
                            type="text" 
                            className="form-control" 
                            placeholder="Contoh: Gazebo Teduh"
                            value={facilityTitle}
                            onChange={(e) => setFacilityTitle(e.target.value)}
                            required
                          />
                        </div>
                        
                        <div className="form-group">
                          <label>Deskripsi</label>
                          <textarea 
                            className="form-control" 
                            rows="4" 
                            placeholder="Deskripsikan fungsi, lokasi, atau harga sewa fasilitas jika ada..."
                            value={facilityDesc}
                            onChange={(e) => setFacilityDesc(e.target.value)}
                            style={{ resize: 'none' }}
                          ></textarea>
                        </div>
                      </div>

                      <div className="modal-footer">
                        <button 
                          type="button" 
                          className="btn btn-secondary" 
                          onClick={() => setIsFacilityModalOpen(false)}
                        >
                          Batal
                        </button>
                        <button type="submit" className="btn btn-primary">
                          {facilityEditIndex === -1 ? 'Tambah' : 'Simpan'}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* ==================================================== */}
          {/* MENU 3: MANAJEMEN GALERI                             */}
          {/* ==================================================== */}
          {activeMenu === 'gallery' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '30px', textAlign: 'left' }}>
              
              {/* Box Upload Foto Baru */}
              <div className="card">
                <h3 style={{ fontWeight: '800', fontSize: '1.25rem', marginBottom: '16px' }}>Tambah Foto Galeri</h3>
                
                <div style={{ display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
                  
                  {/* File Selector */}
                  <label 
                    style={{ 
                      border: '2px dashed var(--border)', 
                      padding: '24px', 
                      borderRadius: 'var(--radius-md)', 
                      display: 'flex', 
                      flexDirection: 'column', 
                      alignItems: 'center', 
                      cursor: 'pointer',
                      gap: '8px',
                      flex: 1,
                      minWidth: '200px'
                    }}
                    className="upload-label-hover"
                  >
                    <Upload size={24} style={{ color: 'var(--primary)' }} />
                    <span style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>Pilih File Gambar</span>
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          setGalleryFile(file);
                          setGalleryPreview(URL.createObjectURL(file));
                        }
                      }}
                      style={{ display: 'none' }}
                    />
                  </label>

                  {/* Preview file dipilih */}
                  {galleryPreview && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center' }}>
                      <div 
                        style={{
                          width: '120px',
                          height: '120px',
                          borderRadius: 'var(--radius-md)',
                          backgroundImage: `url(${galleryPreview})`,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                          border: '1px solid var(--border)'
                        }}
                      ></div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button 
                          onClick={handleGalleryUpload} 
                          className="btn btn-emerald btn-sm"
                          disabled={uploadLoading}
                        >
                          {uploadLoading ? 'Proses...' : 'Upload'}
                        </button>
                        <button 
                          onClick={() => {
                            setGalleryFile(null);
                            setGalleryPreview(null);
                          }} 
                          className="btn btn-secondary btn-sm"
                        >
                          Batal
                        </button>
                      </div>
                    </div>
                  )}

                </div>
              </div>

              {/* Grid Galeri Publik */}
              <div className="card">
                <h3 style={{ fontWeight: '800', fontSize: '1.25rem', marginBottom: '20px' }}>Foto Galeri Publik</h3>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px' }}>
                  {dbData.settings.beach_gallery && dbData.settings.beach_gallery.map((img, i) => (
                    <div 
                      key={i} 
                      style={{ 
                        position: 'relative', 
                        height: '160px', 
                        borderRadius: 'var(--radius-md)', 
                        backgroundImage: `url(${getImageUrl(img)})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        border: '1px solid var(--border)',
                        overflow: 'hidden'
                      }}
                      className="gallery-admin-card"
                    >
                      {/* Tombol Hapus Hover */}
                      <div 
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: '100%',
                          backgroundColor: 'rgba(239, 68, 68, 0.4)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          opacity: 0,
                          transition: 'opacity 0.2s ease',
                          cursor: 'pointer'
                        }}
                        className="gallery-admin-overlay"
                        onClick={() => handleDeleteGallery(img)}
                      >
                        <button className="btn btn-danger btn-icon-only">
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  ))}
                  {(!dbData.settings.beach_gallery || dbData.settings.beach_gallery.length === 0) && (
                    <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                      Belum ada foto dalam galeri pantai.
                    </div>
                  )}
                </div>
              </div>

            </div>
          )}

          {/* ==================================================== */}
          {/* MENU 4: LAPORAN KEUANGAN                             */}
          {/* ==================================================== */}
          {activeMenu === 'reports' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '30px', textAlign: 'left' }}>
              
              {/* Form Filter Pencarian */}
              <div className="card">
                <h3 style={{ fontWeight: '800', fontSize: '1.25rem', marginBottom: '16px' }}>Filter Periode Laporan Keuangan</h3>
                
                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                  <div className="form-group" style={{ margin: 0, flex: 1, minWidth: '150px' }}>
                    <label>Tanggal Awal</label>
                    <div style={{ position: 'relative' }}>
                      <input 
                        type="date" 
                        className="form-control" 
                        value={reportStartDate}
                        onChange={(e) => setReportStartDate(e.target.value)}
                        style={{ paddingLeft: '36px' }}
                      />
                      <Calendar size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    </div>
                  </div>

                  <div className="form-group" style={{ margin: 0, flex: 1, minWidth: '150px' }}>
                    <label>Tanggal Akhir</label>
                    <div style={{ position: 'relative' }}>
                      <input 
                        type="date" 
                        className="form-control" 
                        value={reportEndDate}
                        onChange={(e) => setReportEndDate(e.target.value)}
                        style={{ paddingLeft: '36px' }}
                      />
                      <Calendar size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    </div>
                  </div>

                  <button 
                    onClick={loadReport} 
                    className="btn btn-primary"
                    disabled={reportLoading}
                    style={{ height: '42px' }}
                  >
                    {reportLoading ? 'Memuat...' : 'Cari Data'}
                  </button>
                </div>
              </div>

              {/* Rangkuman Metrik Laporan */}
              <div className="metrics-grid" style={{ marginBottom: 0 }}>
                <StatCard 
                  title="Total Pendapatan" 
                  value={formatRupiah(reportSummary.totalRevenue)} 
                  icon={DollarSign} 
                  color="var(--primary)" 
                  bgLight="rgba(2, 132, 199, 0.1)"
                />
                <StatCard 
                  title="Total Pengunjung" 
                  value={`${reportSummary.totalVisitors} Orang`} 
                  icon={Users} 
                  color="var(--emerald)" 
                  bgLight="rgba(13, 148, 136, 0.1)"
                />
                <StatCard 
                  title="Total Transaksi" 
                  value={`${reportSummary.totalTransactions} Transaksi`} 
                  icon={FileText} 
                  color="var(--accent)" 
                  bgLight="rgba(245, 158, 11, 0.1)"
                />
              </div>

              {/* Tabel Data Laporan */}
              <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h4 style={{ fontWeight: '700', fontSize: '1rem' }}>Tabel Riwayat Transaksi</h4>
                  <button 
                    onClick={() => window.print()} 
                    className="btn btn-secondary btn-sm"
                  >
                    Print Laporan
                  </button>
                </div>

                <div className="table-container">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Waktu Transaksi</th>
                        <th>Kode Tiket</th>
                        <th>Pengunjung</th>
                        <th>Kasir</th>
                        <th>Jumlah</th>
                        <th>Total Bayar</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.map((trx, idx) => (
                        <tr key={idx}>
                          <td>{new Date(trx.created_at).toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                          <td style={{ fontWeight: '700' }}>{trx.ticket_code}</td>
                          <td>{trx.visitor_name}</td>
                          <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{trx.cashier_name}</td>
                          <td style={{ fontWeight: '600' }}>{trx.quantity}</td>
                          <td style={{ fontWeight: '700', color: 'var(--primary-dark)' }}>{formatRupiah(trx.total_price)}</td>
                        </tr>
                      ))}
                      {reportData.length === 0 && (
                        <tr>
                          <td colSpan="6" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                            Tidak ada data transaksi ditemukan untuk periode ini.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* ==================================================== */}
          {/* MENU: MANAJEMEN KASIR (CRUD)                         */}
          {/* ==================================================== */}
          {activeMenu === 'cashiers' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '30px', textAlign: 'left' }}>
              
              <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                  <h3 style={{ fontWeight: '800', fontSize: '1.25rem', margin: 0 }}>Petugas Kasir Loket</h3>
                  <button 
                    onClick={() => handleOpenCashierModal(null)} 
                    className="btn btn-emerald btn-sm"
                  >
                    <Plus size={16} />
                    <span>Tambah Kasir Baru</span>
                  </button>
                </div>

                <div className="table-container">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Nama Lengkap</th>
                        <th>Username</th>
                        <th>Role</th>
                        <th style={{ width: '20%', textAlign: 'center' }}>Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cashiers.map((cashier, idx) => (
                        <tr key={idx}>
                          <td style={{ fontWeight: '700' }}>{cashier.name}</td>
                          <td style={{ fontWeight: '600', color: 'var(--primary-dark)' }}>{cashier.username}</td>
                          <td><span className="badge badge-success">Kasir Pintu</span></td>
                          <td>
                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                              <button 
                                onClick={() => handleOpenCashierModal(cashier)} 
                                className="btn btn-secondary btn-sm"
                                style={{ padding: '6px 10px' }}
                              >
                                Edit
                              </button>
                              <button 
                                onClick={() => handleDeleteCashier(cashier.id)} 
                                className="btn btn-danger btn-sm"
                                style={{ padding: '6px 10px' }}
                              >
                                Hapus
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {cashiers.length === 0 && !cashierLoading && (
                        <tr>
                          <td colSpan="4" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                            Belum ada petugas kasir terdaftar.
                          </td>
                        </tr>
                      )}
                      {cashierLoading && (
                        <tr>
                          <td colSpan="4" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                            Memuat data kasir...
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Modal CRUD Kasir */}
              {isCashierModalOpen && (
                <div className="modal-overlay">
                  <div className="modal-content">
                    <div className="modal-header">
                      <h3>{cashierEditId === 0 ? 'Tambah Kasir Baru' : 'Edit Petugas Kasir'}</h3>
                      <button className="modal-close" onClick={() => setIsCashierModalOpen(false)}>&times;</button>
                    </div>
                    
                    <form onSubmit={handleSaveCashier}>
                      <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {cashierError && (
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', padding: '10px 14px', backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: 'var(--danger)', borderRadius: 'var(--radius-md)', fontSize: '0.85rem' }}>
                            <AlertCircle size={16} />
                            <span>{cashierError}</span>
                          </div>
                        )}

                        <div className="form-group">
                          <label>Nama Lengkap Petugas</label>
                          <input 
                            type="text" 
                            className="form-control" 
                            placeholder="Contoh: Budi Santoso"
                            value={cashierName}
                            onChange={(e) => setCashierName(e.target.value)}
                            required
                          />
                        </div>
                        
                        <div className="form-group">
                          <label>Username Login</label>
                          <input 
                            type="text" 
                            className="form-control" 
                            placeholder="Contoh: budi123"
                            value={cashierUsername}
                            onChange={(e) => setCashierUsername(e.target.value)}
                            required
                          />
                        </div>

                        <div className="form-group">
                          <label>Kata Sandi {cashierEditId > 0 && '(Kosongkan jika tidak diganti)'}</label>
                          <input 
                            type="password" 
                            className="form-control" 
                            placeholder={cashierEditId === 0 ? 'Ketik password login kasir' : 'Ketik password baru jika ingin diganti'}
                            value={cashierPassword}
                            onChange={(e) => setCashierPassword(e.target.value)}
                            required={cashierEditId === 0}
                          />
                        </div>
                      </div>

                      <div className="modal-footer">
                        <button 
                          type="button" 
                          className="btn btn-secondary" 
                          onClick={() => setIsCashierModalOpen(false)}
                        >
                          Batal
                        </button>
                        <button type="submit" className="btn btn-primary">
                          {cashierEditId === 0 ? 'Tambah Kasir' : 'Simpan'}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* ==================================================== */}
          {/* MENU 5: AKUN SAYA                                    */}
          {/* ==================================================== */}
          {activeMenu === 'account' && (
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <div className="card" style={{ width: '100%', maxWidth: '500px', textAlign: 'left' }}>
                <h3 style={{ fontWeight: '800', fontSize: '1.25rem', marginBottom: '20px' }}>Kredensial Profil Admin</h3>

                <form onSubmit={handleSaveAccount} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  
                  {accountError && (
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', padding: '10px 14px', backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: 'var(--danger)', borderRadius: 'var(--radius-md)', fontSize: '0.85rem' }}>
                      <AlertCircle size={16} />
                      <span>{accountError}</span>
                    </div>
                  )}

                  <div className="form-group">
                    <label>Nama Petugas (Tampilan)</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      value={accountName}
                      onChange={(e) => setAccountName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Username Login</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      value={accountUsername}
                      onChange={(e) => setAccountUsername(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Kata Sandi Baru (Kosongkan jika tidak diganti)</label>
                    <input 
                      type="password" 
                      className="form-control" 
                      placeholder="Ketik password baru jika ingin diganti"
                      value={accountPassword}
                      onChange={(e) => setAccountPassword(e.target.value)}
                      style={{ fontSize: '0.9rem' }}
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
                    <button type="submit" className="btn btn-primary">
                      <Save size={18} />
                      <span>Simpan Perubahan Akun</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* Bottom Navigation Bar for Mobile */}
      <nav className="bottom-nav">
        <div 
          className={`bottom-nav-item ${(activeMenu === 'overview' && !showMoreMenu) ? 'active' : ''}`}
          onClick={() => { setActiveMenu('overview'); setShowMoreMenu(false); }}
        >
          <LayoutDashboard size={20} className="bottom-nav-icon" />
          <span>Ringkasan</span>
        </div>
        
        <div 
          className={`bottom-nav-item ${(activeMenu === 'reports' && !showMoreMenu) ? 'active' : ''}`}
          onClick={() => { setActiveMenu('reports'); setShowMoreMenu(false); }}
        >
          <FileText size={20} className="bottom-nav-icon" />
          <span>Laporan</span>
        </div>

        <div 
          className={`bottom-nav-item ${(activeMenu === 'cashiers' && !showMoreMenu) ? 'active' : ''}`}
          onClick={() => { setActiveMenu('cashiers'); setShowMoreMenu(false); }}
        >
          <Users size={20} className="bottom-nav-icon" />
          <span>Kasir</span>
        </div>

        <div 
          className={`bottom-nav-item ${showMoreMenu ? 'active' : ''}`}
          onClick={() => setShowMoreMenu(!showMoreMenu)}
        >
          <Menu size={20} className="bottom-nav-icon" />
          <span>Menu</span>
        </div>
      </nav>

      {/* Slide-Up Bottom Drawer Menu for Mobile */}
      {showMoreMenu && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: '65px',
            backgroundColor: 'rgba(11, 19, 41, 0.5)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            zIndex: 998,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
            animation: 'slideUp-drawer 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
          }}
          onClick={() => setShowMoreMenu(false)}
        >
          <div 
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderTopLeftRadius: 'var(--radius-lg)',
              borderTopRightRadius: 'var(--radius-lg)',
              borderTop: '1px solid var(--border)',
              padding: '24px 20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              boxShadow: '0 -10px 25px rgba(0, 0, 0, 0.15)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <h4 style={{ fontSize: '1rem', fontWeight: '800', margin: 0, color: 'var(--text-primary)' }}>Menu Administrasi</h4>
              <button 
                onClick={() => setShowMoreMenu(false)} 
                style={{ fontSize: '1.5rem', color: 'var(--text-muted)', lineHeight: 1 }}
              >&times;</button>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <button 
                onClick={() => { setActiveMenu('settings'); setShowMoreMenu(false); }}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '14px',
                  backgroundColor: activeMenu === 'settings' ? 'rgba(2, 132, 199, 0.08)' : 'var(--bg-base)',
                  border: `1px solid ${activeMenu === 'settings' ? 'var(--primary)' : 'var(--border)'}`,
                  borderRadius: 'var(--radius-md)',
                  color: activeMenu === 'settings' ? 'var(--primary)' : 'var(--text-primary)',
                  fontWeight: '600',
                  fontSize: '0.85rem'
                }}
              >
                <Settings size={18} />
                <span>Detail Pantai</span>
              </button>

              <button 
                onClick={() => { setActiveMenu('facilities'); setShowMoreMenu(false); }}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '14px',
                  backgroundColor: activeMenu === 'facilities' ? 'rgba(2, 132, 199, 0.08)' : 'var(--bg-base)',
                  border: `1px solid ${activeMenu === 'facilities' ? 'var(--primary)' : 'var(--border)'}`,
                  borderRadius: 'var(--radius-md)',
                  color: activeMenu === 'facilities' ? 'var(--primary)' : 'var(--text-primary)',
                  fontWeight: '600',
                  fontSize: '0.85rem'
                }}
              >
                <Sparkles size={18} />
                <span>Kelola Fasilitas</span>
              </button>

              <button 
                onClick={() => { setActiveMenu('gallery'); setShowMoreMenu(false); }}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '14px',
                  backgroundColor: activeMenu === 'gallery' ? 'rgba(2, 132, 199, 0.08)' : 'var(--bg-base)',
                  border: `1px solid ${activeMenu === 'gallery' ? 'var(--primary)' : 'var(--border)'}`,
                  borderRadius: 'var(--radius-md)',
                  color: activeMenu === 'gallery' ? 'var(--primary)' : 'var(--text-primary)',
                  fontWeight: '600',
                  fontSize: '0.85rem'
                }}
              >
                <Image size={18} />
                <span>Kelola Galeri</span>
              </button>

              <button 
                onClick={() => { setActiveMenu('account'); setShowMoreMenu(false); }}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '14px',
                  backgroundColor: activeMenu === 'account' ? 'rgba(2, 132, 199, 0.08)' : 'var(--bg-base)',
                  border: `1px solid ${activeMenu === 'account' ? 'var(--primary)' : 'var(--border)'}`,
                  borderRadius: 'var(--radius-md)',
                  color: activeMenu === 'account' ? 'var(--primary)' : 'var(--text-primary)',
                  fontWeight: '600',
                  fontSize: '0.85rem'
                }}
              >
                <User size={18} />
                <span>Akun Saya</span>
              </button>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '6px', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
              <button 
                className="btn btn-secondary btn-sm"
                onClick={() => { toggleTheme(); }}
                style={{ 
                  flex: 1,
                  justifyContent: 'center',
                  height: '40px',
                  fontSize: '0.85rem'
                }}
              >
                {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
                <span>{theme === 'light' ? 'Mode Gelap' : 'Mode Terang'}</span>
              </button>
              
              <button 
                className="btn btn-danger btn-sm" 
                onClick={() => { setShowMoreMenu(false); onLogout(); }}
                style={{ flex: 1, justifyContent: 'center', height: '40px', fontSize: '0.85rem' }}
              >
                <LogOut size={16} />
                <span>Keluar</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CSS internal khusus untuk hover/drawer panel admin */}
      <style>{`
        @keyframes slideIn {
          from { transform: translateY(-20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes slideUp-drawer {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        .upload-label-hover:hover {
          border-color: var(--primary) !important;
          background-color: var(--bg-base) !important;
        }
        .gallery-admin-card:hover .gallery-admin-overlay {
          opacity: 1 !important;
        }
      `}</style>
    </div>
  );
}
