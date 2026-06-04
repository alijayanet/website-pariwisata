import React, { useState, useEffect } from 'react';
import { db } from '../utils/db';
import TicketReceipt from '../components/TicketReceipt';
import StatCard from '../components/StatCard';
import { 
  Ticket, Users, DollarSign, History, Printer, Plus, Minus, 
  Sparkles, Sun, Moon, LogOut, Check, AlertCircle, ShoppingBag, Loader2,
  TrendingUp, QrCode, Camera
} from 'lucide-react';
import { Html5QrcodeScanner } from 'html5-qrcode';

export default function CashierDashboard({ dbData, onLogout, onDataChange }) {
  const [theme, setTheme] = useState(document.documentElement.getAttribute('data-theme') || 'light');
  
  const [cameraSupported, setCameraSupported] = useState(true);
  const [isSecureContext, setIsSecureContext] = useState(true);

  // Check secure origin and camera support
  useEffect(() => {
    const secure = window.isSecureContext || window.location.protocol === 'https:' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const hasMedia = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
    
    setIsSecureContext(secure);
    if (!hasMedia) {
      setCameraSupported(false);
    }
  }, []);
  
  // POS Inputs
  const [quantity, setQuantity] = useState(1);
  const [visitorName, setVisitorName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Print Modal State
  const [activeReceipt, setActiveReceipt] = useState(null);

  // History & Summary State (Cashier specific)
  const [todayHistory, setTodayHistory] = useState([]);
  const [cashierStats, setCashierStats] = useState({ totalRevenue: 0, totalVisitors: 0 });
  const [historyLoading, setHistoryLoading] = useState(false);

  // Status Alert
  const [alert, setAlert] = useState(null);

  // Mobile active tab
  const [activeTab, setActiveTab] = useState('pos'); // 'pos', 'scan', 'summary', or 'history'

  // Scanner & Validation States
  const [scanResult, setScanResult] = useState(null);
  const [scanError, setScanError] = useState(null);
  const [scanLoading, setScanLoading] = useState(false);
  const [manualCode, setManualCode] = useState('');

  const ticketPrice = parseFloat(dbData.settings.ticket_price || 15000);
  const totalPrice = ticketPrice * quantity;

  // Load data kasir saat inisialisasi
  useEffect(() => {
    loadCashierHistory();
  }, []);

  // Initialize and clean up Html5QrcodeScanner when tab is 'scan'
  useEffect(() => {
    if (activeTab !== 'scan') return;
    const hasMedia = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
    if (!hasMedia) return;
    
    let scanner = null;

    // Tunggu sebentar agar elemen #reader dirender di DOM
    const timer = setTimeout(() => {
      scanner = new Html5QrcodeScanner('reader', {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0
      }, false);

      scanner.render(onScanSuccess, onScanFailure);

      function onScanSuccess(decodedText) {
        scanner.clear().then(() => {
          handleValidateTicket(decodedText);
        }).catch((err) => {
          console.error('Failed to clear scanner:', err);
          handleValidateTicket(decodedText);
        });
      }

      function onScanFailure(error) {
        // Quietly fail
      }
    }, 100);

    return () => {
      clearTimeout(timer);
      if (scanner) {
        try {
          scanner.clear().catch((err) => {
            console.warn('Failed to clear scanner on unmount:', err);
          });
        } catch (e) {
          console.warn('Error clearing scanner:', e);
        }
      }
      const container = document.getElementById('reader');
      if (container && container.innerHTML !== '') {
        container.innerHTML = '';
      }
    };
  }, [activeTab, cameraSupported]);

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
  };

  const triggerAlert = (type, message) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 4000);
  };

  // Muat riwayat transaksi kasir bersangkutan hari ini
  const loadCashierHistory = async () => {
    setHistoryLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const cashierId = dbData.user ? dbData.user.id : 0;
      
      const response = await db.getReport(today, today, cashierId);
      if (response.success) {
        setTodayHistory(response.transactions);
        setCashierStats({
          totalRevenue: response.summary.totalRevenue,
          totalVisitors: response.summary.totalVisitors
        });
      }
    } catch (err) {
      console.error(err);
      triggerAlert('danger', 'Gagal memuat riwayat transaksi kasir.');
    } finally {
      setHistoryLoading(false);
    }
  };

  // Kirim transaksi ke backend
  const handlePayment = async (e) => {
    e.preventDefault();
    if (quantity <= 0) {
      setError('Jumlah tiket harus minimal 1.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const cashierId = dbData.user ? dbData.user.id : 2;
      const cashierName = dbData.user ? dbData.user.name : 'Kasir';
      
      const response = await db.saveTransaction(
        quantity,
        visitorName,
        cashierId,
        cashierName
      );

      if (response.success) {
        triggerAlert('success', 'Transaksi berhasil disimpan!');
        
        // Munculkan struk karcis untuk dicetak
        setActiveReceipt(response.transaction);
        
        // Reset form input
        setQuantity(1);
        setVisitorName('');
        
        // Muat ulang data
        loadCashierHistory();
        onDataChange(); // Reload data global agar admin sync
      }
    } catch (err) {
      setError(err.message || 'Gagal memproses transaksi.');
    } finally {
      setLoading(false);
    }
  };

  const handleQtyChange = (val) => {
    const nextQty = quantity + val;
    if (nextQty >= 1) setQuantity(nextQty);
  };

  const formatRupiah = (value) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(value);
  };

  const handleValidateTicket = async (code) => {
    if (!code) return;
    setScanLoading(true);
    setScanResult(null);
    setScanError(null);
    
    const apiBaseUrl = window.location.port === '5173' 
      ? 'http://localhost:8000/api/api.php' 
      : 'api/api.php';

    try {
      const response = await fetch(`${apiBaseUrl}?action=validate_ticket`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticket_code: code })
      });
      
      const result = await response.json();
      
      if (result.success) {
        setScanResult({
          success: true,
          message: result.message,
          transaction: result.transaction
        });
        triggerAlert('success', 'Tiket Valid! Akses diberikan.');
        onDataChange();
      } else {
        setScanResult({
          success: false,
          message: result.message || 'Tiket sudah digunakan.',
          transaction: result.transaction || null
        });
        setScanError(result.message || 'Tiket tidak valid.');
      }
    } catch (err) {
      setScanError('Gagal menghubungi server verifikasi.');
    } finally {
      setScanLoading(false);
    }
  };

  return (
    <div className="dashboard-layout">
      {/* ==================================================== */}
      {/* SIDEBAR LOKET KASIR                                  */}
      {/* ==================================================== */}
      <aside className="sidebar" style={{ width: '250px' }}>
        <div className="sidebar-brand">
          <Sparkles size={24} style={{ color: 'var(--accent-light)' }} />
          <span className="sidebar-brand-name">LOKET KASIR</span>
        </div>
        
        <div style={{ padding: '24px 16px', flex: 1, display: 'flex', flexDirection: 'column', gap: '16px', listStyle: 'none' }}>
          <ul className="sidebar-menu" style={{ display: 'flex', flexDirection: 'column', gap: '6px', listStyle: 'none', padding: 0 }}>
            <li 
              className={`sidebar-item ${activeTab === 'pos' ? 'active' : ''}`}
              onClick={() => setActiveTab('pos')}
            >
              <Ticket size={18} />
              <span>Penjualan Karcis</span>
            </li>
            <li 
              className={`sidebar-item ${activeTab === 'scan' ? 'active' : ''}`}
              onClick={() => setActiveTab('scan')}
            >
              <QrCode size={18} />
              <span>Scan Karcis Pintu</span>
            </li>
            <li 
              className={`sidebar-item ${activeTab === 'summary' ? 'active' : ''}`}
              onClick={() => setActiveTab('summary')}
            >
              <TrendingUp size={18} />
              <span>Ringkasan Loket</span>
            </li>
            <li 
              className={`sidebar-item ${activeTab === 'history' ? 'active' : ''}`}
              onClick={() => setActiveTab('history')}
            >
              <History size={18} />
              <span>Riwayat Tiket</span>
            </li>
          </ul>

          <div 
            style={{ 
              marginTop: 'auto',
              padding: '16px',
              backgroundColor: 'rgba(255,255,255,0.05)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid rgba(255,255,255,0.08)',
              fontSize: '0.8rem',
              color: 'rgba(255,255,255,0.6)',
              textAlign: 'left'
            }}
          >
            <div style={{ fontWeight: 'bold', color: 'white', marginBottom: '6px' }}>INFO LOKET:</div>
            <div>Tarif Tiket: {formatRupiah(ticketPrice)}</div>
            <div>Kasir Aktif: {dbData.user ? dbData.user.name : 'Kasir'}</div>
          </div>
        </div>

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
            {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
            <span>{theme === 'light' ? 'Mode Gelap' : 'Mode Terang'}</span>
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
      {/* MAIN CONTENT AREA                                    */}
      {/* ==================================================== */}
      <main className="main-content">
        
        {/* Header Dasbor */}
        <header className="dashboard-header">
          <div className="dashboard-header-title" style={{ textAlign: 'left' }}>
            <h2>Loket Pintu Masuk</h2>
            <p>Sistem POS Cetak Karcis Masuk Pantai Terintegrasi</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span className="badge badge-success mobile-hidden" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
              Petugas: {dbData.user ? dbData.user.name : 'Kasir'}
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

        {/* Notifikasi Alert */}
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
        <div className="dashboard-body" style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
          
          {/* Ringkasan Penjualan Hari Ini */}
          <div className={`metrics-grid metrics-grid-3col cashier-summary-section ${activeTab === 'summary' ? 'active-tab-visible' : ''}`} style={{ marginBottom: 0 }}>
            <StatCard 
              title="Pendapatan Saya Hari Ini" 
              value={formatRupiah(cashierStats.totalRevenue)} 
              icon={DollarSign} 
              color="var(--primary)" 
              bgLight="rgba(2, 132, 199, 0.1)"
            />
            <StatCard 
              title="Pengunjung Saya Hari Ini" 
              value={`${cashierStats.totalVisitors.toLocaleString()} Orang`} 
              icon={Users} 
              color="var(--emerald)" 
              bgLight="rgba(13, 148, 136, 0.1)"
            />
            <StatCard 
              title="Harga Tiket Aktif" 
              value={formatRupiah(ticketPrice)} 
              icon={Ticket} 
              color="var(--accent)" 
              bgLight="rgba(245, 158, 11, 0.1)"
            />
          </div>

          {/* Grid Utama (Kiri: Form Input Tiket POS, Kanan: Riwayat Transaksi Hari Ini) */}
          <div className={`cashier-grid-container cashier-tab-${activeTab}`}>
            
            {/* Form Input POS */}
            <div className={`card cashier-card-pos ${activeTab === 'pos' ? 'active-tab-visible' : ''}`} style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                  <div style={{ backgroundColor: 'rgba(2, 132, 199, 0.1)', color: 'var(--primary)', padding: '10px', borderRadius: 'var(--radius-md)' }}>
                    <ShoppingBag size={22} />
                  </div>
                  <h3 style={{ fontWeight: '800', fontSize: '1.2rem', margin: 0 }}>Input Tiket Masuk</h3>
                </div>

                <form onSubmit={handlePayment} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {error && (
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', padding: '10px 14px', backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: 'var(--danger)', borderRadius: 'var(--radius-md)', fontSize: '0.85rem' }}>
                      <AlertCircle size={16} />
                      <span>{error}</span>
                    </div>
                  )}

                  {/* Qty Selector (Input Jumlah) */}
                  <div className="form-group">
                    <label>Jumlah Tiket (Pengunjung)</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <button 
                        type="button" 
                        onClick={() => handleQtyChange(-1)}
                        className="btn btn-secondary btn-icon-only"
                        style={{ height: '45px', width: '45px', borderRadius: 'var(--radius-md)', justifyContent: 'center' }}
                      >
                        <Minus size={18} />
                      </button>
                      <input 
                        type="number" 
                        className="form-control" 
                        value={quantity}
                        onChange={(e) => {
                          const val = parseInt(e.target.value);
                          if (val >= 1) setQuantity(val);
                        }}
                        required
                        style={{ height: '45px', textAlign: 'center', fontSize: '1.2rem', fontWeight: 'bold' }}
                      />
                      <button 
                        type="button" 
                        onClick={() => handleQtyChange(1)}
                        className="btn btn-secondary btn-icon-only"
                        style={{ height: '45px', width: '45px', borderRadius: 'var(--radius-md)', justifyContent: 'center' }}
                      >
                        <Plus size={18} />
                      </button>
                    </div>
                  </div>

                  {/* Input Nama Pengunjung (Opsional) */}
                  <div className="form-group">
                    <label>Nama Pengunjung (Opsional)</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder="Masukkan nama jika diperlukan (default: Umum)"
                      value={visitorName}
                      onChange={(e) => setVisitorName(e.target.value)}
                      style={{ height: '45px' }}
                    />
                  </div>

                  {/* Box Ringkasan Kalkulasi Harga */}
                  <div 
                    style={{ 
                      backgroundColor: 'var(--bg-base)', 
                      border: '1px solid var(--border)', 
                      borderRadius: 'var(--radius-md)', 
                      padding: '16px', 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center' 
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 'bold' }}>RINCIAN PEMBAYARAN:</div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                        {quantity} Tiket x {formatRupiah(ticketPrice)}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 'bold' }}>TOTAL BAYAR:</div>
                      <div style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--primary-dark)' }}>
                        {formatRupiah(totalPrice)}
                      </div>
                    </div>
                  </div>

                  <button 
                    type="submit" 
                    className="btn btn-primary"
                    disabled={loading}
                    style={{ height: '48px', fontWeight: '700', fontSize: '1.05rem', justifyContent: 'center' }}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="animate-spin" size={20} />
                        <span>Memproses Transaksi...</span>
                      </>
                    ) : (
                      <>
                        <Printer size={20} />
                        <span>Bayar & Cetak Karcis</span>
                      </>
                    )}
                  </button>

                </form>
              </div>
            </div>

            {/* Riwayat Transaksi Hari Ini */}
            <div className={`card cashier-card-history ${activeTab === 'history' ? 'active-tab-visible' : ''}`} style={{ display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'left' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ backgroundColor: 'rgba(13, 148, 136, 0.1)', color: 'var(--emerald)', padding: '10px', borderRadius: 'var(--radius-md)' }}>
                    <History size={22} />
                  </div>
                  <h3 style={{ fontWeight: '800', fontSize: '1.2rem', margin: 0 }}>Riwayat Hari Ini</h3>
                </div>
                <button 
                  onClick={loadCashierHistory} 
                  className="btn btn-secondary btn-sm"
                  disabled={historyLoading}
                >
                  Refresh
                </button>
              </div>

              <div className="table-container" style={{ maxHeight: '350px', overflowY: 'auto' }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Waktu</th>
                      <th>Kode Tiket</th>
                      <th>Pengunjung</th>
                      <th>Qty</th>
                      <th>Total</th>
                      <th>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {todayHistory.map((trx, idx) => (
                      <tr key={idx}>
                        <td style={{ fontSize: '0.8rem' }}>{new Date(trx.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</td>
                        <td style={{ fontWeight: '700', fontSize: '0.85rem' }}>{trx.ticket_code}</td>
                        <td>{trx.visitor_name}</td>
                        <td style={{ fontWeight: '600' }}>{trx.quantity}</td>
                        <td style={{ fontWeight: '700' }}>{formatRupiah(trx.total_price)}</td>
                        <td>
                          <button 
                            onClick={() => setActiveReceipt(trx)} 
                            className="btn btn-secondary btn-sm btn-icon-only"
                            title="Cetak Ulang Tiket"
                          >
                            <Printer size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {todayHistory.length === 0 && (
                      <tr>
                        <td colSpan="6" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                          Belum ada transaksi karcis yang tercatat hari ini.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Tampilan Scan Karcis / Verifikasi Pintu Masuk */}
            <div className={`card cashier-card-scan ${activeTab === 'scan' ? 'active-tab-visible' : ''}`} style={{ gridColumn: '1 / -1', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                <div style={{ backgroundColor: 'rgba(2, 132, 199, 0.1)', color: 'var(--primary)', padding: '10px', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <QrCode size={22} />
                </div>
                <div>
                  <h3 style={{ fontWeight: '800', fontSize: '1.2rem', margin: 0 }}>Scan QR Code Pintu Masuk</h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>Posisikan QR tiket pada kamera untuk memvalidasi masuk pengunjung.</p>
                </div>
              </div>

              <div className="cashier-scan-grid">
                
                {/* Kamera QR Scanner */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div 
                    style={{ 
                      backgroundColor: 'var(--bg-base)', 
                      borderRadius: 'var(--radius-md)', 
                      padding: '16px',
                      border: '1px solid var(--border)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      minHeight: '320px',
                      position: 'relative'
                    }}
                  >
                    {activeTab === 'scan' ? (
                      <>
                        {cameraSupported ? (
                          <div id="reader" style={{ width: '100%', maxWidth: '360px', borderRadius: '8px', overflow: 'hidden' }}></div>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', padding: '20px', textAlign: 'center', color: 'var(--danger)', maxWidth: '340px' }}>
                            <AlertCircle size={36} />
                            <span style={{ fontWeight: '800', fontSize: '1rem' }}>Akses Kamera Terblokir</span>
                            <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                              {!isSecureContext ? (
                                <>
                                  Browser membatasi izin kamera hanya untuk koneksi <strong>HTTPS aman</strong> atau <strong>localhost</strong>.
                                  <br /><br />
                                  Gunakan layanan <strong>HTTPS (Ngrok)</strong> atau hubungkan dengan port forwarding localhost untuk menguji kamera di perangkat seluler (HP).
                                </>
                              ) : (
                                'Perangkat media kamera tidak terdeteksi atau izin akses ditolak.'
                              )}
                            </p>
                          </div>
                        )}
                      </>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', color: 'var(--text-muted)' }}>
                        <Camera size={48} />
                        <span>Kamera scanner tidak aktif</span>
                      </div>
                    )}
                  </div>

                  {/* Input Manual Fallback */}
                  <form 
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleValidateTicket(manualCode.toUpperCase().trim());
                    }}
                    style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}
                  >
                    <div className="form-group" style={{ flex: 1, margin: 0 }}>
                      <label>Validasi Manual (Ketik Kode Tiket)</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        placeholder="Contoh: TKT-20260604-0001"
                        value={manualCode}
                        onChange={(e) => setManualCode(e.target.value)}
                        style={{ height: '42px', textTransform: 'uppercase' }}
                      />
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ height: '42px', justifyContent: 'center' }} disabled={scanLoading}>
                      Verifikasi
                    </button>
                  </form>
                </div>

                {/* Hasil Scan/Verifikasi */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <h4 style={{ fontWeight: '700', fontSize: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '10px', margin: 0 }}>
                    Hasil Verifikasi Tiket
                  </h4>

                  {scanLoading && (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px', gap: '10px', color: 'var(--text-secondary)' }}>
                      <Loader2 className="animate-spin" size={32} />
                      <span>Memproses kode tiket...</span>
                    </div>
                  )}

                  {!scanLoading && !scanResult && !scanError && (
                    <div style={{ padding: '40px 20px', border: '2px dashed var(--border)', borderRadius: 'var(--radius-md)', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      Silakan arahkan QR Code tiket ke kamera scanner atau masukkan kode tiket secara manual untuk melakukan verifikasi pintu masuk.
                    </div>
                  )}

                  {!scanLoading && scanError && !scanResult && (
                    <div style={{ padding: '20px', backgroundColor: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center', textAlign: 'center' }}>
                      <div style={{ backgroundColor: 'var(--danger)', color: 'white', borderRadius: '50%', padding: '10px', display: 'flex' }}>
                        <AlertCircle size={28} />
                      </div>
                      <div style={{ fontWeight: '800', color: 'var(--danger)', fontSize: '1.1rem' }}>TIKET TIDAK VALID</div>
                      <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{scanError}</p>
                    </div>
                  )}

                  {!scanLoading && scanResult && (
                    <div 
                      style={{ 
                        padding: '24px', 
                        backgroundColor: scanResult.success ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)', 
                        border: `1px solid ${scanResult.success ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`, 
                        borderRadius: 'var(--radius-md)', 
                        display: 'flex', 
                        flexDirection: 'column', 
                        gap: '16px',
                        alignItems: 'center',
                        textAlign: 'center' 
                      }}
                    >
                      <div style={{ backgroundColor: scanResult.success ? 'var(--success)' : 'var(--danger)', color: 'white', borderRadius: '50%', padding: '10px', display: 'flex' }}>
                        {scanResult.success ? <Check size={28} /> : <AlertCircle size={28} />}
                      </div>

                      <div style={{ fontWeight: '800', color: scanResult.success ? 'var(--success)' : 'var(--danger)', fontSize: '1.2rem' }}>
                        {scanResult.success ? 'AKSES DIBERIKAN' : 'TIKET SUDAH DIGUNAKAN'}
                      </div>
                      
                      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '8px', textAlign: 'left', borderTop: '1px solid var(--border)', paddingTop: '16px', fontSize: '0.85rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: 'var(--text-muted)' }}>Kode Tiket:</span>
                          <span style={{ fontWeight: '700' }}>{scanResult.transaction.ticket_code}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: 'var(--text-muted)' }}>Nama Pengunjung:</span>
                          <span style={{ fontWeight: '600' }}>{scanResult.transaction.visitor_name}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: 'var(--text-muted)' }}>Jumlah Pengunjung:</span>
                          <span style={{ fontWeight: '700', color: 'var(--primary-dark)' }}>{scanResult.transaction.quantity} Orang</span>
                        </div>
                        {scanResult.transaction.scanned_at && (
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: 'var(--text-muted)' }}>Waktu Scan Pintu:</span>
                            <span style={{ fontWeight: '600', fontSize: '0.8rem' }}>
                              {new Date(scanResult.transaction.scanned_at).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        )}
                      </div>

                      {scanResult.success && (
                        <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                          {scanResult.message}
                        </p>
                      )}
                    </div>
                  )}

                </div>

              </div>

            </div>

          </div>

        </div>
      </main>

      {/* Bottom Navigation Bar for Mobile Kasir */}
      <nav className="bottom-nav">
        <div 
          className={`bottom-nav-item ${activeTab === 'pos' ? 'active' : ''}`}
          onClick={() => setActiveTab('pos')}
        >
          <Ticket size={20} className="bottom-nav-icon" />
          <span>Beli Karcis</span>
        </div>
        
        <div 
          className={`bottom-nav-item ${activeTab === 'scan' ? 'active' : ''}`}
          onClick={() => setActiveTab('scan')}
        >
          <QrCode size={20} className="bottom-nav-icon" />
          <span>Scan QR</span>
        </div>
        
        <div 
          className={`bottom-nav-item ${activeTab === 'summary' ? 'active' : ''}`}
          onClick={() => setActiveTab('summary')}
        >
          <TrendingUp size={20} className="bottom-nav-icon" />
          <span>Ringkasan</span>
        </div>
        
        <div 
          className={`bottom-nav-item ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          <History size={20} className="bottom-nav-icon" />
          <span>Riwayat Tiket</span>
        </div>
      </nav>

      {/* Modal Cetak Karcis/Struk */}
      {activeReceipt && (
        <TicketReceipt 
          transaction={activeReceipt}
          beachName={dbData.settings.beach_name}
          onClose={() => setActiveReceipt(null)}
        />
      )}

      {/* CSS internal khusus kasir */}
      <style>{`
        @keyframes slideIn {
          from { transform: translateY(-20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
