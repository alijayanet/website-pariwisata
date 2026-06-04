import React, { useState } from 'react';
import { Palmtree, LogIn, Menu, X, LayoutDashboard } from 'lucide-react';

export default function Navbar({ currentView, setCurrentView, beachName, user, onLogout }) {
  const [isOpen, setIsOpen] = useState(false);

  const handleNavClick = (view, elementId) => {
    setIsOpen(false);
    setCurrentView(view);
    
    // Jika ada elementId, scroll setelah render
    if (elementId) {
      setTimeout(() => {
        const element = document.getElementById(elementId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <header className="pub-header">
      <div className="container pub-navbar">
        {/* Brand/Logo */}
        <div className="pub-brand" style={{ cursor: 'pointer' }} onClick={() => handleNavClick('home')}>
          <Palmtree className="logo-icon" size={28} style={{ color: 'var(--accent-light)' }} />
          <span>{beachName || 'Mutiara Indah'}</span>
        </div>

        {/* Desktop Menu */}
        <nav style={{ display: 'flex', alignItems: 'center' }}>
          <ul className="pub-nav-links">
            <li className="pub-nav-link" onClick={() => handleNavClick('home')}>Beranda</li>
            <li className="pub-nav-link" onClick={() => handleNavClick('home', 'facilities')}>Fasilitas</li>
            <li className="pub-nav-link" onClick={() => handleNavClick('home', 'gallery')}>Galeri</li>
            <li className="pub-nav-link" onClick={() => handleNavClick('home', 'tickets')}>Harga Tiket</li>
            <li className="pub-nav-link" style={{ color: 'var(--accent-light)', fontWeight: 'bold' }} onClick={() => handleNavClick('gate-validator')}>Pintu Masuk</li>
            
            {user ? (
              <>
                <li 
                  className="btn btn-emerald btn-sm"
                  style={{ color: 'white' }}
                  onClick={() => setCurrentView(user.role === 'admin' ? 'admin-dashboard' : 'cashier-dashboard')}
                >
                  <LayoutDashboard size={16} />
                  <span>Dashboard ({user.role === 'admin' ? 'Admin' : 'Kasir'})</span>
                </li>
                <button 
                  className="btn btn-secondary btn-sm" 
                  onClick={onLogout}
                  style={{ color: 'var(--text-primary)', padding: '6px 12px' }}
                >
                  Keluar
                </button>
              </>
            ) : (
              <li 
                className="btn btn-accent btn-sm"
                style={{ color: 'white' }}
                onClick={() => setCurrentView('login')}
              >
                <LogIn size={16} />
                <span>Masuk Petugas</span>
              </li>
            )}
          </ul>

          {/* Hamburger Menu Icon (Mobile Only) */}
          <button 
            className="mobile-nav-toggle" 
            onClick={() => setIsOpen(!isOpen)}
            style={{ display: 'none', marginLeft: '16px' }} // CSS media query handles this display
          >
            {isOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </nav>
      </div>

      {/* Mobile Drawer */}
      {isOpen && (
        <div 
          className="mobile-menu-drawer"
          style={{
            position: 'absolute',
            top: '80px',
            left: 0,
            width: '100%',
            backgroundColor: 'var(--primary-dark)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            padding: '20px',
            boxShadow: 'var(--shadow-lg)',
            zIndex: 499,
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            listStyle: 'none'
          }}
        >
          <li className="pub-nav-link" onClick={() => handleNavClick('home')}>Beranda</li>
          <li className="pub-nav-link" onClick={() => handleNavClick('home', 'facilities')}>Fasilitas</li>
          <li className="pub-nav-link" onClick={() => handleNavClick('home', 'gallery')}>Galeri</li>
          <li className="pub-nav-link" onClick={() => handleNavClick('home', 'tickets')}>Harga Tiket</li>
          <li className="pub-nav-link" style={{ color: 'var(--accent-light)', fontWeight: 'bold' }} onClick={() => handleNavClick('gate-validator')}>Pintu Masuk</li>
          
          {user ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
              <button 
                className="btn btn-emerald btn-sm"
                onClick={() => {
                  setIsOpen(false);
                  setCurrentView(user.role === 'admin' ? 'admin-dashboard' : 'cashier-dashboard');
                }}
              >
                <LayoutDashboard size={16} />
                <span>Dashboard ({user.role === 'admin' ? 'Admin' : 'Kasir'})</span>
              </button>
              <button 
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  setIsOpen(false);
                  onLogout();
                }}
              >
                Keluar
              </button>
            </div>
          ) : (
            <button 
              className="btn btn-accent btn-sm"
              style={{ marginTop: '10px' }}
              onClick={() => {
                setIsOpen(false);
                setCurrentView('login');
              }}
            >
              <LogIn size={16} />
              <span>Masuk Petugas</span>
            </button>
          )}
        </div>
      )}

      {/* Add inline CSS to support the toggle class on mobile */}
      <style>{`
        @media (max-width: 768px) {
          .pub-nav-links {
            display: none !important;
          }
          .mobile-nav-toggle {
            display: inline-flex !important;
          }
        }
      `}</style>
    </header>
  );
}
