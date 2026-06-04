import React, { useState, useEffect } from 'react';
import { db } from '../utils/db';
import { 
  QrCode, Camera, ArrowLeft, Loader2, Check, AlertCircle, 
  HelpCircle, Shield, Wifi, Volume2 
} from 'lucide-react';
import { Html5QrcodeScanner } from 'html5-qrcode';

export default function GateValidator({ dbData, onBackToHome }) {
  const [activeTab, setActiveTab] = useState('scan');
  const [scanResult, setScanResult] = useState(null);
  const [scanError, setScanError] = useState(null);
  const [scanLoading, setScanLoading] = useState(false);
  const [manualCode, setManualCode] = useState('');
  
  // Gate Barrier Arm State
  const [gateOpen, setGateOpen] = useState(false);
  const [gateTimer, setGateTimer] = useState(0);

  const beachName = dbData?.settings?.beach_name || 'Pantai Mutiara Indah';

  const [cameraSupported, setCameraSupported] = useState(true);
  const [isSecureContext, setIsSecureContext] = useState(true);

  // Media Context & Security Check
  useEffect(() => {
    const secure = window.isSecureContext || window.location.protocol === 'https:' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const hasMedia = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
    
    setIsSecureContext(secure);
    if (!hasMedia) {
      setCameraSupported(false);
    }
  }, []);

  // Initialize and clean up Html5QrcodeScanner
  useEffect(() => {
    const hasMedia = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
    if (!hasMedia || gateOpen) return;

    let scanner = null;
    
    // Tunggu sebentar agar elemen #gate-reader dirender di DOM
    const timer = setTimeout(() => {
      scanner = new Html5QrcodeScanner('gate-reader', {
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
        // Quietly fail scan attempts
      }
    }, 150);

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
      const container = document.getElementById('gate-reader');
      if (container && container.innerHTML !== '') {
        container.innerHTML = '';
      }
    };
  }, [gateOpen, cameraSupported]); // Re-init scanner if gate resets to closed or camera support loaded

  // Handle Gate Timer Countdown
  useEffect(() => {
    let interval = null;
    if (gateOpen && gateTimer > 0) {
      interval = setInterval(() => {
        setGateTimer((prev) => prev - 1);
      }, 1000);
    } else if (gateTimer === 0 && gateOpen) {
      setGateOpen(false);
      setScanResult(null);
      setScanError(null);
    }
    return () => clearInterval(interval);
  }, [gateOpen, gateTimer]);

  // Audio Buzzer using Web Audio API (No files required)
  const playBuzzer = (success) => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      if (success) {
        // Double Beep (Success)
        osc.frequency.setValueAtTime(880, ctx.currentTime); // A5
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        osc.start();
        osc.stop(ctx.currentTime + 0.08);
        
        // Second beep
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.frequency.setValueAtTime(1100, ctx.currentTime + 0.12);
        gain2.gain.setValueAtTime(0.08, ctx.currentTime + 0.12);
        osc2.start(ctx.currentTime + 0.12);
        osc2.stop(ctx.currentTime + 0.22);
      } else {
        // Long Buzz (Error)
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(140, ctx.currentTime);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        osc.start();
        osc.stop(ctx.currentTime + 0.35);
      }
    } catch (err) {
      console.warn('Web Audio API not supported or blocked:', err);
    }
  };

  // Text-To-Speech Welcome Greeting
  const speakWelcome = (beach) => {
    if ('speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel(); // Cancel ongoing speakings
        const text = `Selamat datang di ${beach}. Silakan masuk.`;
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'id-ID'; // Indonesian
        utterance.rate = 0.9; // Clear speed
        utterance.pitch = 1.0;
        window.speechSynthesis.speak(utterance);
      } catch (err) {
        console.warn('Speech synthesis error:', err);
      }
    }
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
        
        // Trigger Audio Feedback & Welcome Voice
        playBuzzer(true);
        speakWelcome(beachName);
        
        // Open Barrier Gate automatically
        setGateOpen(true);
        setGateTimer(6); // Keep open for 6 seconds (countdown displays 5 to 0)
        
      } else {
        setScanResult({
          success: false,
          message: result.message || 'Tiket sudah digunakan.',
          transaction: result.transaction || null
        });
        setScanError(result.message || 'Tiket tidak valid.');
        
        // Trigger Audio Feedback (Buzz)
        playBuzzer(false);
      }
    } catch (err) {
      setScanError('Gagal menghubungi server verifikasi pintu.');
      playBuzzer(false);
    } finally {
      setScanLoading(false);
    }
  };

  return (
    <div 
      style={{ 
        minHeight: '100vh', 
        background: 'linear-gradient(135deg, #0b1329 0%, #1e293b 100%)',
        color: 'white',
        padding: '30px 20px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        position: 'relative',
        overflowX: 'hidden'
      }}
    >
      {/* Background Tropical Blur Elements */}
      <div style={{ position: 'absolute', width: '300px', height: '300px', borderRadius: '50%', backgroundColor: 'rgba(2, 132, 199, 0.15)', filter: 'blur(80px)', top: '-50px', left: '-50px', pointerEvents: 'none' }}></div>
      <div style={{ position: 'absolute', width: '300px', height: '300px', borderRadius: '50%', backgroundColor: 'rgba(13, 148, 136, 0.15)', filter: 'blur(80px)', bottom: '-50px', right: '-50px', pointerEvents: 'none' }}></div>

      {/* Top Header */}
      <header style={{ width: '100%', maxWidth: '900px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', zIndex: 10 }}>
        <button 
          onClick={onBackToHome}
          className="btn btn-secondary"
          style={{ 
            backgroundColor: 'rgba(255, 255, 255, 0.05)', 
            color: 'white', 
            borderColor: 'rgba(255, 255, 255, 0.1)',
            padding: '8px 16px',
            fontSize: '0.85rem'
          }}
        >
          <ArrowLeft size={16} />
          <span>Beranda Utama</span>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: '#10b981', backgroundColor: 'rgba(16, 185, 129, 0.1)', padding: '6px 12px', borderRadius: 'var(--radius-full)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
          <Wifi size={14} />
          <span style={{ fontWeight: '600' }}>Gate Controller: ONLINE</span>
        </div>
      </header>

      {/* Main Container */}
      <main style={{ width: '100%', maxWidth: '900px', zIndex: 10, display: 'flex', flexDirection: 'column', gap: '30px' }}>
        
        {/* Title */}
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ fontWeight: '800', fontSize: '2rem', letterSpacing: '-0.5px', background: 'linear-gradient(to right, #38bdf8, #34d399)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: '0 0 4px 0' }}>
            SCANNER PINTU MASUK
          </h1>
          <p style={{ color: '#94a3b8', margin: 0, fontSize: '0.95rem' }}>
            Pintu Verifikasi Karcis Otomatis - {beachName}
          </p>
        </div>

        {/* 2-Column Grid: Left (Scanner & Manual), Right (Barrier Gate & Status) */}
        <div className="gate-validator-grid">
          {/* LEFT: Scanner Panel */}
          <div className="card glass" style={{ border: '1px solid rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ backgroundColor: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8', padding: '8px', borderRadius: 'var(--radius-md)', display: 'flex' }}>
                <QrCode size={20} />
              </div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '700' }}>Arahkan QR Tiket ke Kamera</h3>
            </div>

            {/* Webcam Reader Box */}
            <div 
              style={{
                width: '100%',
                backgroundColor: 'rgba(15, 23, 42, 0.6)',
                borderRadius: 'var(--radius-md)',
                minHeight: '280px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              {!gateOpen ? (
                <>
                  {cameraSupported ? (
                    <div id="gate-reader" style={{ width: '100%', maxWidth: '300px', borderRadius: '8px', overflow: 'hidden' }}></div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', padding: '20px', textAlign: 'center', color: '#f87171', maxWidth: '340px' }}>
                      <AlertCircle size={36} style={{ color: '#ef4444' }} />
                      <span style={{ fontWeight: '800', fontSize: '0.95rem' }}>Akses Kamera Terblokir</span>
                      <p style={{ margin: 0, fontSize: '0.75rem', color: '#cbd5e1', lineHeight: '1.5' }}>
                        {!isSecureContext ? (
                          <>
                            Browser seluler (HP) mewajibkan koneksi <strong>HTTPS aman</strong> untuk membuka kamera.
                            <br /><br />
                            <strong>Solusi Pengujian HP:</strong>
                            <ul style={{ textAlign: 'left', marginTop: '8px', paddingLeft: '16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              <li>Gunakan tool gratis <strong>Ngrok</strong> (misal: <code>ngrok http 5173</code>) untuk mendapat URL HTTPS instan.</li>
                              <li>Di Android, buka <code>chrome://flags</code>, cari <code>Insecure origins as secure</code>, lalu tambahkan IP host Anda.</li>
                            </ul>
                          </>
                        ) : (
                          'Perangkat keras kamera tidak terdeteksi atau izin kamera ditolak oleh sistem operasi/browser Anda.'
                        )}
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', color: '#10b981', padding: '20px', textAlign: 'center' }}>
                  <div style={{ backgroundColor: '#10b981', color: 'white', borderRadius: '50%', padding: '16px', display: 'flex', animation: 'pulse 1.5s infinite' }}>
                    <Check size={36} />
                  </div>
                  <span style={{ fontWeight: '800', fontSize: '1.1rem' }}>PINTU SEDANG TERBUKA</span>
                  <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Kamera scanner dinonaktifkan sementara</span>
                </div>
              )}
            </div>

            {/* Manual Key-in Fallback */}
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                handleValidateTicket(manualCode.toUpperCase().trim());
              }}
              style={{ display: 'flex', gap: '10px', alignItems: 'flex-end', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '20px' }}
            >
              <div className="form-group" style={{ flex: 1, margin: 0 }}>
                <label style={{ color: '#94a3b8', fontSize: '0.75rem', fontWeight: 'bold' }}>Validasi Manual (Ketik Kode Tiket)</label>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="Contoh: TKT-20260604-0001"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  disabled={gateOpen || scanLoading}
                  style={{ height: '42px', backgroundColor: 'rgba(15, 23, 42, 0.4)', borderColor: 'rgba(255,255,255,0.1)', color: 'white', textTransform: 'uppercase' }}
                />
              </div>
              <button 
                type="submit" 
                className="btn btn-primary" 
                style={{ height: '42px', padding: '0 20px', justifyContent: 'center' }} 
                disabled={gateOpen || scanLoading}
              >
                Verifikasi
              </button>
            </form>
          </div>

          {/* RIGHT: Barrier Gate & Status Panel */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* Gate Simulator Visual Box */}
            <div className="card glass" style={{ border: '1px solid rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px', gap: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '700', alignSelf: 'flex-start', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Simulasi Pintu Otomatis (Turnstile)
              </h3>

              {/* Physical Gate Graphic */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', margin: '10px 0' }}>
                {/* Gate Barrier Tiang */}
                <div 
                  style={{ 
                    position: 'relative', 
                    width: '240px', 
                    height: '140px', 
                    borderBottom: '6px solid rgba(255,255,255,0.15)', 
                    display: 'flex', 
                    alignItems: 'flex-end', 
                    justifyContent: 'center' 
                  }}
                >
                  {/* Rumah Barrier (Housing Machine Box) */}
                  <div 
                    style={{ 
                      width: '45px', 
                      height: '110px', 
                      backgroundColor: '#1e293b', 
                      border: '3px solid #475569', 
                      borderRadius: '6px', 
                      position: 'absolute', 
                      bottom: 0, 
                      left: '30px', 
                      display: 'flex', 
                      flexDirection: 'column', 
                      alignItems: 'center', 
                      padding: '8px 0', 
                      gap: '6px',
                      boxShadow: '0 4px 10px rgba(0,0,0,0.3)'
                    }}
                  >
                    {/* Indikator Lampu LED */}
                    <div 
                      style={{ 
                        width: '10px', 
                        height: '10px', 
                        borderRadius: '50%', 
                        backgroundColor: gateOpen ? '#10b981' : '#ef4444', 
                        boxShadow: gateOpen ? '0 0 10px #10b981, 0 0 20px #10b981' : '0 0 10px #ef4444, 0 0 20px #ef4444',
                        transition: 'all 0.3s ease'
                      }}
                    ></div>
                    <div style={{ width: '16px', height: '30px', backgroundColor: '#0f172a', borderRadius: '3px' }}></div>
                  </div>
                  
                  {/* Palang Pintu Penghalang (Barrier Arm) */}
                  <div 
                    style={{ 
                      width: '170px', 
                      height: '12px', 
                      backgroundColor: gateOpen ? '#10b981' : '#ef4444', 
                      borderRadius: '4px',
                      position: 'absolute',
                      bottom: '88px',
                      left: '68px',
                      transformOrigin: 'left center',
                      transform: gateOpen ? 'rotate(-80deg)' : 'rotate(0deg)',
                      transition: 'transform 0.8s cubic-bezier(0.34, 1.56, 0.64, 1), background-color 0.8s ease',
                      boxShadow: gateOpen ? '0 0 15px rgba(16, 185, 129, 0.4)' : 'none',
                      // Striped barrier warning pattern
                      backgroundImage: gateOpen
                        ? 'repeating-linear-gradient(45deg, transparent, transparent 8px, rgba(255,255,255,0.4) 8px, rgba(255,255,255,0.4) 16px)'
                        : 'repeating-linear-gradient(45deg, transparent, transparent 8px, #ffffff 8px, #ffffff 16px)'
                    }}
                  ></div>
                </div>

                <div 
                  style={{ 
                    fontSize: '1rem', 
                    fontWeight: '800', 
                    color: gateOpen ? '#10b981' : '#ef4444',
                    textShadow: gateOpen ? '0 0 10px rgba(16, 185, 129, 0.2)' : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <span>STATUS PINTU:</span>
                  <span>{gateOpen ? `TERBUKA (Tutup dalam ${gateTimer - 1}s)` : 'TERTUTUP'}</span>
                </div>
              </div>

              {/* IoT Connectivity Note */}
              <div 
                style={{ 
                  width: '100%',
                  fontSize: '0.8rem', 
                  backgroundColor: 'rgba(255,255,255,0.03)', 
                  border: '1px dashed rgba(255,255,255,0.08)',
                  padding: '12px',
                  borderRadius: 'var(--radius-md)',
                  color: '#94a3b8',
                  lineHeight: '1.4'
                }}
              >
                <div style={{ fontWeight: 'bold', color: 'white', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                  <Shield size={14} style={{ color: '#38bdf8' }} />
                  <span>Koneksi Hardware Pintu Otomatis:</span>
                </div>
                Saat terhubung via Web Serial API/USB Relay, trigger verifikasi sukses akan langsung mengirimkan perintah byte `0xFF` (RELAY_ON) untuk membuka relay solenoid pintu otomatis.
              </div>
            </div>

            {/* Validation Result Box */}
            <div className="card glass" style={{ border: '1px solid rgba(255,255,255,0.08)', padding: '24px', flex: 1, minHeight: '180px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              
              {scanLoading && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px', gap: '10px' }}>
                  <Loader2 className="animate-spin" size={32} style={{ color: '#38bdf8' }} />
                  <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Memverifikasi kode tiket...</span>
                </div>
              )}

              {!scanLoading && !scanResult && !scanError && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', textAlign: 'center', color: '#94a3b8' }}>
                  <Volume2 size={36} style={{ color: '#38bdf8', opacity: 0.7 }} />
                  <span style={{ fontSize: '0.9rem' }}>Standby... Menunggu scan karcis.</span>
                </div>
              )}

              {!scanLoading && scanError && !scanResult && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', alignItems: 'center', textAlign: 'center' }}>
                  <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)', color: '#f87171', borderRadius: '50%', padding: '8px', display: 'flex' }}>
                    <AlertCircle size={24} />
                  </div>
                  <div>
                    <div style={{ fontWeight: '800', color: '#f87171', fontSize: '1.05rem', marginBottom: '2px' }}>VERIFIKASI GAGAL</div>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: '#cbd5e1' }}>{scanError}</p>
                  </div>
                </div>
              )}

              {!scanLoading && scanResult && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center' }}>
                  <div 
                    style={{ 
                      backgroundColor: scanResult.success ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)', 
                      color: scanResult.success ? '#34d399' : '#f87171', 
                      borderRadius: '50%', 
                      padding: '8px', 
                      display: 'flex' 
                    }}
                  >
                    {scanResult.success ? <Check size={24} /> : <AlertCircle size={24} />}
                  </div>

                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontWeight: '800', color: scanResult.success ? '#34d399' : '#f87171', fontSize: '1.1rem', marginBottom: '4px' }}>
                      {scanResult.success ? 'VERIFIKASI BERHASIL' : 'TIKET SUDAH DIPAKAI'}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                      {scanResult.message}
                    </div>
                  </div>

                  <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '12px', fontSize: '0.85rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#94a3b8' }}>Kode Tiket:</span>
                      <span style={{ fontWeight: '700' }}>{scanResult.transaction.ticket_code}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#94a3b8' }}>Pengunjung:</span>
                      <span style={{ fontWeight: '600' }}>{scanResult.transaction.visitor_name}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#94a3b8' }}>Jumlah Orang:</span>
                      <span style={{ fontWeight: '700', color: '#38bdf8' }}>{scanResult.transaction.quantity} Orang</span>
                    </div>
                  </div>
                </div>
              )}

            </div>

          </div>

        </div>

      </main>

      {/* Local Animations and Styles */}
      <style>{`
        .gate-validator-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 30px;
          align-items: start;
          width: 100%;
        }
        .gate-inner-grid {
          display: grid;
          grid-template-columns: 1.2fr 0.8fr;
          gap: 30px;
          width: 100%;
        }
        @media (max-width: 768px) {
          .gate-validator-grid, .gate-inner-grid {
            grid-template-columns: 1fr !important;
            gap: 20px;
          }
        }
        @keyframes pulse {
          0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4); }
          70% { transform: scale(1.05); box-shadow: 0 0 0 10px rgba(16, 185, 129, 0); }
          100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
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
