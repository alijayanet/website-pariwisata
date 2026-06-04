import React from 'react';
import { Palmtree, Mail, Phone, MapPin } from 'lucide-react';

const FacebookIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
  </svg>
);

const InstagramIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
  </svg>
);

export default function Footer({ beachName }) {
  const currentYear = new Date().getFullYear();

  return (
    <footer 
      style={{
        backgroundColor: '#0f172a',
        color: '#94a3b8',
        padding: '60px 0 30px',
        borderTop: '1px solid #1e293b',
        textAlign: 'left'
      }}
    >
      <div className="container" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '40px', marginBottom: '40px' }}>
        
        {/* Kolom 1 - Deskripsi Pantai */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'white', fontWeight: '800', fontSize: '1.25rem' }}>
            <Palmtree size={24} style={{ color: 'var(--accent-light)' }} />
            <span>{beachName || 'Mutiara Indah'}</span>
          </div>
          <p style={{ fontSize: '0.9rem', lineHeight: '1.6' }}>
            Destinasi wisata pantai terbaik keluarga yang menghadirkan keindahan alam asri, fasilitas lengkap, dan pelayanan karcis digital modern yang aman serta cepat.
          </p>
        </div>

        {/* Kolom 2 - Kontak & Alamat */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h4 style={{ color: 'white', fontSize: '1.05rem', fontWeight: '700' }}>Hubungi Kami</h4>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.9rem' }}>
            <li style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <MapPin size={18} style={{ color: 'var(--primary)', flexShrink: 0 }} />
              <span>Jl. Raya Pantai Indah No. 102, Kab. Pariwisata</span>
            </li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Phone size={18} style={{ color: 'var(--primary)', flexShrink: 0 }} />
              <span>0812-3456-7890</span>
            </li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Mail size={18} style={{ color: 'var(--primary)', flexShrink: 0 }} />
              <span>info@pantaimutiaraindah.id</span>
            </li>
          </ul>
        </div>

        {/* Kolom 3 - Jam Operasional */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h4 style={{ color: 'white', fontSize: '1.05rem', fontWeight: '700' }}>Jam Operasional</h4>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.9rem' }}>
            <li>Setiap Hari: 06:00 - 18:00 WIB</li>
            <li style={{ color: 'var(--accent-light)', fontWeight: '600' }}>Pintu Masuk Kasir Digital:</li>
            <li>07:00 - 17:00 WIB</li>
          </ul>
        </div>

      </div>

      <div className="container" style={{ borderTop: '1px solid #1e293b', paddingTop: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px', fontSize: '0.85rem' }}>
        <p>&copy; {currentYear} {beachName || 'Mutiara Indah'}. Seluruh Hak Cipta Dilindungi.</p>
        
        {/* Media Sosial */}
        <div style={{ display: 'flex', gap: '16px' }}>
          <a href="#" aria-label="Facebook" style={{ color: '#94a3b8' }} className="social-icon-hover"><FacebookIcon /></a>
          <a href="#" aria-label="Instagram" style={{ color: '#94a3b8' }} className="social-icon-hover"><InstagramIcon /></a>
        </div>
      </div>

      <style>{`
        .social-icon-hover:hover {
          color: var(--accent-light) !important;
          transform: translateY(-2px);
        }
      `}</style>
    </footer>
  );
}
