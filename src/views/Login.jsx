import React, { useState } from 'react';
import { db } from '../utils/db';
import { Palmtree, KeyRound, User, ArrowLeft, Loader2, AlertCircle } from 'lucide-react';

export default function Login({ onLoginSuccess, onBackToHome }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Username dan password harus diisi.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await db.login(username, password);
      if (response.success) {
        onLoginSuccess(response.user);
      } else {
        setError(response.message || 'Username atau password salah.');
      }
    } catch (err) {
      console.error(err);
      setError('Koneksi server gagal. Pastikan Apache/MySQL aktif dan config.php benar.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        backgroundImage: 'linear-gradient(135deg, #0f172a 0%, #0369a1 100%)',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Hiasan Latar Belakang Lingkaran Cahaya */}
      <div 
        style={{
          position: 'absolute',
          width: '300px',
          height: '300px',
          backgroundColor: 'rgba(56, 189, 248, 0.15)',
          borderRadius: '50%',
          filter: 'blur(80px)',
          top: '-50px',
          left: '-50px'
        }}
      ></div>
      <div 
        style={{
          position: 'absolute',
          width: '350px',
          height: '350px',
          backgroundColor: 'rgba(245, 158, 11, 0.1)',
          borderRadius: '50%',
          filter: 'blur(80px)',
          bottom: '-50px',
          right: '-50px'
        }}
      ></div>

      <div style={{ width: '100%', maxWidth: '420px', zIndex: 10 }}>
        
        {/* Tombol Kembali ke Beranda */}
        <button 
          onClick={onBackToHome}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            color: 'rgba(255, 255, 255, 0.7)',
            fontSize: '0.9rem',
            fontWeight: '600',
            marginBottom: '20px',
            cursor: 'pointer'
          }}
          className="back-btn-hover"
        >
          <ArrowLeft size={16} />
          <span>Kembali ke Beranda</span>
        </button>

        {/* Card Login Glassmorphism */}
        <div 
          className="card glass" 
          style={{ 
            padding: '40px 32px', 
            border: '1px solid rgba(255, 255, 255, 0.15)',
            boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.3)',
            backgroundColor: 'rgba(19, 28, 53, 0.75)'
          }}
        >
          {/* Logo & Header */}
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <div 
              style={{ 
                display: 'inline-flex', 
                backgroundColor: 'rgba(56, 189, 248, 0.15)', 
                color: 'var(--primary-light)',
                padding: '16px',
                borderRadius: '50%',
                marginBottom: '16px',
                border: '1px solid rgba(56, 189, 248, 0.25)'
              }}
            >
              <Palmtree size={32} />
            </div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: 'white', letterSpacing: '-0.5px' }}>Masuk Petugas</h2>
            <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: '4px' }}>
              Dashboard Admin & Kasir Wisata Pantai
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* Alert Error */}
            {error && (
              <div 
                style={{
                  backgroundColor: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.25)',
                  color: '#fc8181',
                  padding: '12px',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.85rem',
                  display: 'flex',
                  gap: '8px',
                  alignItems: 'center',
                  textAlign: 'left'
                }}
              >
                <AlertCircle size={18} style={{ flexShrink: 0 }} />
                <span>{error}</span>
              </div>
            )}

            {/* Input Username */}
            <div className="form-group">
              <label htmlFor="username" style={{ color: '#cbd5e1' }}>Username</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  id="username"
                  className="form-control"
                  placeholder="Masukkan username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={loading}
                  style={{
                    backgroundColor: 'rgba(15, 23, 42, 0.6)',
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                    color: 'white',
                    paddingLeft: '40px'
                  }}
                />
                <User 
                  size={16} 
                  style={{ 
                    position: 'absolute', 
                    left: '14px', 
                    top: '50%', 
                    transform: 'translateY(-50%)', 
                    color: '#94a3b8' 
                  }} 
                />
              </div>
            </div>

            {/* Input Password */}
            <div className="form-group">
              <label htmlFor="password" style={{ color: '#cbd5e1' }}>Kata Sandi (Password)</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="password"
                  id="password"
                  className="form-control"
                  placeholder="Masukkan password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  style={{
                    backgroundColor: 'rgba(15, 23, 42, 0.6)',
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                    color: 'white',
                    paddingLeft: '40px'
                  }}
                />
                <KeyRound 
                  size={16} 
                  style={{ 
                    position: 'absolute', 
                    left: '14px', 
                    top: '50%', 
                    transform: 'translateY(-50%)', 
                    color: '#94a3b8' 
                  }} 
                />
              </div>
            </div>

            {/* Tombol Submit */}
            <button 
              type="submit" 
              className="btn btn-primary" 
              disabled={loading}
              style={{ 
                padding: '12px 20px', 
                fontWeight: '700',
                marginTop: '10px'
              }}
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  <span>Memverifikasi...</span>
                </>
              ) : (
                <span>Masuk Sekarang</span>
              )}
            </button>

          </form>
        </div>
      </div>

      <style>{`
        .back-btn-hover:hover {
          color: white !important;
          transform: translateX(-2px);
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
