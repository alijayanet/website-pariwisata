import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './views/Home';
import Login from './views/Login';
import AdminDashboard from './views/AdminDashboard';
import CashierDashboard from './views/CashierDashboard';
import GateValidator from './views/GateValidator';
import { db } from './utils/db';

export default function App() {
  const [currentView, setCurrentView] = useState('home'); // 'home', 'login', 'admin-dashboard', 'cashier-dashboard'
  
  // State Autentikasi
  const [user, setUser] = useState(() => {
    const savedUser = sessionStorage.getItem('beachUser');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  // State Data Database Utama
  const [dbData, setDbData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Jalankan fetch data database terpusat saat mount
  useEffect(() => {
    loadDbData();
  }, []);

  const loadDbData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await db.loadAll();
      setDbData(data);
    } catch (err) {
      console.error(err);
      setError(
        'Gagal terhubung ke Database MySQL Pantai. Pastikan server database MySQL (XAMPP/Laragon) aktif, konfigurasi di public/api/config.php benar, dan database wisata_pantai terbuat.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSuccess = (loggedInUser) => {
    setUser(loggedInUser);
    sessionStorage.setItem('beachUser', JSON.stringify(loggedInUser));
    
    // Redirect ke dashboard yang sesuai
    if (loggedInUser.role === 'admin') {
      setCurrentView('admin-dashboard');
    } else {
      setCurrentView('cashier-dashboard');
    }
  };

  const handleLogout = () => {
    setUser(null);
    sessionStorage.removeItem('beachUser');
    setCurrentView('home');
  };

  const handleDataChange = () => {
    // Dipanggil setelah aksi update settings, upload foto, atau tambah transaksi tiket
    loadDbData();
  };

  // 1. Loading Screen Koneksi Database
  if (loading && !dbData) {
    return (
      <div 
        style={{ 
          display: 'flex', 
          flexDirection: 'column',
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100vh', 
          backgroundColor: '#0b1329', 
          color: '#38bdf8',
          gap: '16px'
        }}
      >
        <div className="wave-loading"></div>
        <p style={{ fontWeight: '700', fontSize: '1.2rem' }}>Menghubungkan ke Database Pantai...</p>
        <style>{`
          .wave-loading {
            width: 50px;
            height: 50px;
            border: 5px solid rgba(56, 189, 248, 0.2);
            border-top: 5px solid #38bdf8;
            border-radius: 50%;
            animation: spin 1s linear infinite;
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // 2. Error Screen Koneksi Database
  if (error && !dbData) {
    return (
      <div 
        style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100vh', 
          backgroundColor: '#0f172a', 
          padding: '24px', 
          textAlign: 'center',
          color: 'white'
        }}
      >
        <h3 style={{ fontWeight: '800', fontSize: '1.8rem', color: '#f87171', marginBottom: '12px' }}>
          Koneksi Database Gagal
        </h3>
        <p style={{ color: '#cbd5e1', maxWidth: '600px', marginBottom: '24px', fontSize: '0.95rem', lineHeight: '1.6' }}>
          {error}
        </p>
        <button 
          onClick={loadDbData} 
          className="btn btn-primary"
          style={{ padding: '12px 24px', fontWeight: '700' }}
        >
          Coba Hubungkan Kembali
        </button>
      </div>
    );
  }

  // Jika user terautentikasi mencoba mengunjungi halaman login, alihkan otomatis
  if (currentView === 'login' && user) {
    setCurrentView(user.role === 'admin' ? 'admin-dashboard' : 'cashier-dashboard');
  }

  // Batasi Akses Dashboard jika belum login
  const isViewingAdmin = currentView === 'admin-dashboard';
  const isViewingCashier = currentView === 'cashier-dashboard';
  
  if ((isViewingAdmin || isViewingCashier) && !user) {
    setCurrentView('login');
    return null;
  }
  if (isViewingAdmin && user.role !== 'admin') {
    setCurrentView('cashier-dashboard');
    return null;
  }
  if (isViewingCashier && user.role !== 'kasir') {
    setCurrentView('admin-dashboard');
    return null;
  }

  return (
    <>
      {/* Rute Tampilan Standalone Gate Validator */}
      {currentView === 'gate-validator' ? (
        <GateValidator 
          dbData={dbData}
          onBackToHome={() => setCurrentView('home')}
        />
      ) : currentView === 'admin-dashboard' && user?.role === 'admin' ? (
        <AdminDashboard 
          dbData={dbData}
          onLogout={handleLogout}
          onDataChange={handleDataChange}
        />
      ) : currentView === 'cashier-dashboard' && user?.role === 'kasir' ? (
        /* Rute Tampilan Dashboard Kasir Loket */
        <CashierDashboard 
          dbData={dbData}
          onLogout={handleLogout}
          onDataChange={handleDataChange}
        />
      ) : (
        /* Halaman Publik (Landing Page Frame) */
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
          <Navbar 
            currentView={currentView}
            setCurrentView={setCurrentView}
            beachName={dbData.settings.beach_name}
            user={user}
            onLogout={handleLogout}
          />
          
          <main style={{ flex: '1' }}>
            {currentView === 'home' && (
              <Home 
                dbData={dbData}
                setCurrentView={setCurrentView}
              />
            )}
            {currentView === 'login' && (
              <Login 
                onLoginSuccess={handleLoginSuccess}
                onBackToHome={() => setCurrentView('home')}
              />
            )}
          </main>

          <Footer beachName={dbData.settings.beach_name} />
        </div>
      )}
    </>
  );
}
