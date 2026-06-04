import React from 'react';
import { getImageUrl } from '../utils/db';
import { Check, Info, MapPin, Compass, ArrowRight, ShieldCheck, Ticket } from 'lucide-react';

export default function Home({ dbData, setCurrentView }) {
  const { settings } = dbData;
  
  // Format harga rupiah
  const formatRupiah = (value) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(value);
  };

  return (
    <div>
      {/* 1. Hero Section */}
      <section 
        style={{
          position: 'relative',
          height: '85vh',
          minHeight: '550px',
          backgroundImage: `linear-gradient(rgba(15, 23, 42, 0.4), rgba(15, 23, 42, 0.7)), url(${getImageUrl(settings.beach_image)})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          textAlign: 'center',
          padding: '0 20px',
          overflow: 'hidden'
        }}
      >
        <div style={{ maxWidth: '800px', zIndex: 2, animation: 'fadeInUp 0.8s ease' }}>
          <div 
            style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '6px', 
              backgroundColor: 'rgba(255, 255, 255, 0.2)', 
              backdropFilter: 'blur(8px)',
              padding: '6px 14px', 
              borderRadius: 'var(--radius-full)', 
              fontSize: '0.85rem',
              fontWeight: '700',
              marginBottom: '20px',
              border: '1px solid rgba(255, 255, 255, 0.3)'
            }}
          >
            <Compass size={14} style={{ color: 'var(--accent-light)' }} />
            <span>Destinasi Wisata Pilihan Terbaik</span>
          </div>

          <h1 
            style={{ 
              fontSize: 'clamp(2.2rem, 5vw, 4rem)', 
              fontWeight: '800', 
              lineHeight: '1.1',
              marginBottom: '20px',
              textShadow: '0 4px 12px rgba(0,0,0,0.3)'
            }}
          >
            {settings.beach_name || 'Pantai Mutiara Indah'}
          </h1>
          
          <p 
            style={{ 
              fontSize: 'clamp(1rem, 2vw, 1.25rem)', 
              opacity: '0.95', 
              marginBottom: '36px', 
              maxWidth: '650px', 
              marginInline: 'auto',
              textShadow: '0 2px 6px rgba(0,0,0,0.4)',
              lineHeight: '1.6'
            }}
          >
            {settings.beach_tagline || 'Pesona Tropis Nan Eksotis'}
          </p>

          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button 
              onClick={() => {
                const el = document.getElementById('tickets');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="btn btn-primary"
            >
              <span>Lihat Tiket Masuk</span>
              <ArrowRight size={18} />
            </button>
            <button 
              onClick={() => {
                const el = document.getElementById('facilities');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="btn btn-secondary"
              style={{ backgroundColor: 'rgba(255,255,255,0.15)', color: 'white', border: '1px solid rgba(255,255,255,0.3)' }}
            >
              Pelajari Fasilitas
            </button>
          </div>
        </div>
      </section>

      {/* 2. Profil Wisata Pantai */}
      <section style={{ padding: '80px 0', backgroundColor: 'var(--bg-surface)' }}>
        <div className="container" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: '50px', alignItems: 'center' }}>
          
          {/* Gambar & Hiasan */}
          <div style={{ position: 'relative' }}>
            <div 
              style={{
                width: '100%',
                height: '400px',
                borderRadius: 'var(--radius-lg)',
                backgroundImage: `url(${getImageUrl(settings.beach_gallery && settings.beach_gallery[0])})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                boxShadow: 'var(--shadow-xl)'
              }}
            ></div>
            <div className="beach-badge">
              <ShieldCheck size={28} style={{ color: 'var(--accent-light)' }} />
              <div>
                <h5 style={{ fontWeight: '800', margin: 0 }}>Kasir Digital</h5>
                <p style={{ fontSize: '0.8rem', opacity: '0.8', margin: 0 }}>Transaksi Cepat & Aman</p>
              </div>
            </div>
          </div>

          {/* Deskripsi */}
          <div style={{ textAlign: 'left' }}>
            <h2 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '16px', color: 'var(--text-primary)' }}>
              Tentang Pantai Kami
            </h2>
            <div style={{ width: '60px', height: '4px', backgroundColor: 'var(--primary)', marginBottom: '24px' }}></div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', lineHeight: '1.8', marginBottom: '24px' }}>
              {settings.beach_description || 'Nikmati keindahan alam tropis yang memukau.'}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <div style={{ backgroundColor: 'rgba(2, 132, 199, 0.1)', color: 'var(--primary)', padding: '6px', borderRadius: '50%' }}><Check size={16} /></div>
                <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>Kebersihan pantai yang terjaga</span>
              </div>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <div style={{ backgroundColor: 'rgba(2, 132, 199, 0.1)', color: 'var(--primary)', padding: '6px', borderRadius: '50%' }}><Check size={16} /></div>
                <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>Akses masuk digital terintegrasi QR Code</span>
              </div>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <div style={{ backgroundColor: 'rgba(2, 132, 199, 0.1)', color: 'var(--primary)', padding: '6px', borderRadius: '50%' }}><Check size={16} /></div>
                <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>Keamanan area pantai 24 jam</span>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* 3. Fasilitas Section */}
      <section id="facilities" style={{ padding: '80px 0', backgroundColor: 'var(--bg-base)' }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '10px' }}>Fasilitas Wisata</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '48px', maxWidth: '600px', marginInline: 'auto' }}>
            Kami menyediakan berbagai fasilitas penunjang kenyamanan liburan Anda selama berada di kawasan Pantai.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))', gap: '24px' }}>
            {settings.beach_facilities && settings.beach_facilities.map((fac, i) => {
              const title = typeof fac === 'object' ? fac.title : fac;
              const desc = typeof fac === 'object' ? fac.description : 'Tersedia untuk seluruh pengunjung demi kenyamanan rekreasi di pantai.';
              return (
                <div key={i} className="card card-hover" style={{ display: 'flex', flexDirection: 'column', gap: '12px', textAlign: 'left', border: 'none', boxShadow: 'var(--shadow-md)' }}>
                  <div style={{ backgroundColor: 'rgba(13, 148, 136, 0.1)', color: 'var(--emerald)', width: '48px', height: '48px', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ShieldCheck size={24} />
                  </div>
                  <h4 style={{ fontWeight: '700', fontSize: '1.1rem', color: 'var(--text-primary)' }}>{title}</h4>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 4. Galeri Section */}
      <section id="gallery" style={{ padding: '80px 0', backgroundColor: 'var(--bg-surface)' }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '10px' }}>Galeri Pantai</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '48px', maxWidth: '600px', marginInline: 'auto' }}>
            Lihat cuplikan visual keindahan, aktivitas seru, dan momen-momen indah di Pantai kami.
          </p>

          <div 
            style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 260px), 1fr))', 
              gap: '20px' 
            }}
          >
            {settings.beach_gallery && settings.beach_gallery.map((img, i) => (
              <div 
                key={i} 
                className="gallery-item"
                style={{ 
                  position: 'relative',
                  overflow: 'hidden', 
                  borderRadius: 'var(--radius-md)', 
                  height: '240px',
                  boxShadow: 'var(--shadow-md)',
                  cursor: 'pointer'
                }}
              >
                <div 
                  style={{
                    width: '100%',
                    height: '100%',
                    backgroundImage: `url(${getImageUrl(img)})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    transition: 'all 0.5s ease'
                  }}
                  className="gallery-img"
                ></div>
                <div 
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    backgroundColor: 'rgba(2, 132, 199, 0.4)',
                    opacity: 0,
                    transition: 'all 0.3s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontWeight: '800'
                  }}
                  className="gallery-overlay"
                >
                  Pantai Mutiara Indah
                </div>
              </div>
            ))}
          </div>
        </div>

        <style>{`
          .gallery-item:hover .gallery-img {
            transform: scale(1.1);
          }
          .gallery-item:hover .gallery-overlay {
            opacity: 1 !important;
          }
        `}</style>
      </section>

      {/* 5. Tiket Pricing Section */}
      <section id="tickets" style={{ padding: '80px 0', backgroundColor: 'var(--bg-base)' }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '10px' }}>
            {settings.ticket_title || 'Harga Tiket Masuk'}
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '48px', maxWidth: '600px', marginInline: 'auto' }}>
            {settings.ticket_subtitle || 'Tarif tiket masuk terjangkau bagi semua kalangan masyarakat untuk berwisata.'}
          </p>

          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <div 
              className="card"
              style={{
                width: '100%',
                maxWidth: '450px',
                border: 'none',
                boxShadow: 'var(--shadow-xl)',
                backgroundColor: 'var(--bg-surface)',
                borderRadius: 'var(--radius-lg)',
                padding: '40px',
                display: 'flex',
                flexDirection: 'column',
                gap: '24px',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              {/* Hiasan Atas */}
              <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '8px', backgroundColor: 'var(--accent)' }}></div>
              
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <div style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', color: 'var(--accent)', padding: '16px', borderRadius: '50%' }}>
                  <Ticket size={36} />
                </div>
              </div>

              <div>
                <h3 style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--text-primary)' }}>
                  {settings.ticket_card_title || 'Tiket Masuk Umum'}
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px' }}>Berlaku setiap hari (Senin - Minggu)</p>
              </div>

              <div style={{ margin: '10px 0' }}>
                <span style={{ fontSize: '1.25rem', fontWeight: '600', color: 'var(--text-secondary)', verticalAlign: 'super' }}>Rp</span>
                <span style={{ fontSize: '3rem', fontWeight: '800', color: 'var(--text-primary)', lineHeight: '1' }}>
                  {parseInt(settings.ticket_price || 15000).toLocaleString('id-ID')}
                </span>
                <span style={{ color: 'var(--text-secondary)', fontWeight: '600' }}> / Orang</span>
              </div>

              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '20px', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {(settings.ticket_features || [
                  'Akses Penuh Seluruh Area Pantai',
                  'Gratis Fasilitas Toilet & Kamar Bilas',
                  'Sudah Termasuk Asuransi Jiwa Jasa Raharja'
                ]).map((feat, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: '10px', alignItems: 'center', fontSize: '0.9rem' }}>
                    <Check size={16} style={{ color: 'var(--emerald)' }} />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>

              <div 
                style={{
                  backgroundColor: 'rgba(2, 132, 199, 0.05)',
                  border: '1px solid rgba(2, 132, 199, 0.15)',
                  padding: '14px',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.8rem',
                  color: 'var(--text-secondary)',
                  display: 'flex',
                  gap: '8px',
                  textAlign: 'left',
                  alignItems: 'start'
                }}
              >
                <Info size={16} style={{ color: 'var(--primary)', flexShrink: 0, marginTop: '2px' }} />
                <span>
                  {settings.ticket_note || 'Pembayaran dan pencetakan karcis ber-QR Code dilakukan secara tunai/non-tunai langsung di loket kasir pintu masuk utama.'}
                </span>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* CSS Animations */}
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .beach-badge {
          position: absolute;
          bottom: -20px;
          right: -20px;
          background-color: var(--primary);
          color: white;
          padding: 20px 24px;
          border-radius: var(--radius-md);
          box-shadow: var(--shadow-lg);
          text-align: left;
          display: flex;
          align-items: center;
          gap: 12px;
          transition: all 0.3s ease;
        }
        @media (max-width: 768px) {
          .beach-badge {
            bottom: 10px;
            right: 10px;
            padding: 12px 16px;
          }
        }
      `}</style>
    </div>
  );
}
