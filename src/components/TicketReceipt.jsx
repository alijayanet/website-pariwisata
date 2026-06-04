import React, { useEffect } from 'react';
import { Printer, X } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

export default function TicketReceipt({ transaction, beachName, onClose }) {
  useEffect(() => {
    document.body.classList.add('printing-ticket');
    return () => {
      document.body.classList.remove('printing-ticket');
    };
  }, []);

  if (!transaction) return null;

  const handlePrint = () => {
    window.print();
  };

  const formatRupiah = (value) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(value);
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div className="modal-overlay">
      <div 
        className="modal-content" 
        style={{ 
          maxWidth: '460px',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: 'var(--shadow-xl)',
          overflow: 'hidden'
        }}
      >
        {/* Modal Header */}
        <div className="modal-header" style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: '800', margin: 0, color: 'var(--text-primary)' }}>
            Pratinjau Karcis Masuk
          </h3>
          <button className="modal-close" onClick={onClose} style={{ fontSize: '1.4rem', lineHeight: 1 }}>&times;</button>
        </div>

        {/* Modal Body (Scrollable on small height viewports) */}
        <div 
          className="modal-body" 
          style={{ 
            padding: '24px 20px', 
            backgroundColor: 'var(--bg-base)', 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            gap: '20px',
            maxHeight: 'calc(80vh - 120px)',
            overflowY: 'auto'
          }}
        >
          {/* Kontainer Utama yang dicetak */}
          <div id="print-area" style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
            <div className="receipt-container" style={{ width: '100%', maxWidth: '360px', margin: 0, boxShadow: '0 4px 12px rgba(0,0,0,0.06)' }}>
              {/* Header Struk */}
              <div className="receipt-header">
                <h3>{beachName || 'Pantai Mutiara Indah'}</h3>
                <p>Jl. Raya Pantai Indah No. 102</p>
                <div style={{ fontWeight: 'bold', fontSize: '0.85rem', margin: '5px 0' }}>
                  KARCIS TANDA MASUK RESMI
                </div>
              </div>

              <div className="receipt-divider"></div>

              {/* Informasi Detail Karcis */}
              <div className="receipt-row">
                <span>Waktu:</span>
                <span>{formatDateTime(transaction.created_at)}</span>
              </div>
              <div className="receipt-row" style={{ fontWeight: 'bold' }}>
                <span>Kode Tiket:</span>
                <span>{transaction.ticket_code}</span>
              </div>
              <div className="receipt-row">
                <span>Petugas:</span>
                <span>{transaction.cashier_name}</span>
              </div>
              <div className="receipt-row">
                <span>Pengunjung:</span>
                <span>{transaction.visitor_name || 'Umum'}</span>
              </div>

              <div className="receipt-divider"></div>

              {/* Rincian Transaksi */}
              <div className="receipt-row">
                <span>Tarif Tiket:</span>
                <span>{formatRupiah(transaction.ticket_price)}</span>
              </div>
              <div className="receipt-row">
                <span>Jumlah Pengunjung:</span>
                <span>{transaction.quantity} Orang</span>
              </div>

              <div className="receipt-divider"></div>

              {/* Total Pembayaran */}
              <div className="receipt-total">
                <span>TOTAL BAYAR:</span>
                <span>{formatRupiah(transaction.total_price)}</span>
              </div>

              <div className="receipt-divider"></div>

              {/* QR Code untuk Pintu Masuk */}
              <div className="receipt-qrcode">
                <QRCodeSVG 
                  value={transaction.ticket_code} 
                  size={140}
                  bgColor="#ffffff"
                  fgColor="#000000"
                  level="M"
                  includeMargin={false}
                />
              </div>
              <div style={{ fontSize: '0.75rem', fontWeight: 'bold', marginTop: '5px', textTransform: 'uppercase' }}>
                QR CODE LOGIN PINTU MASUK
              </div>

              <div className="receipt-divider"></div>

              {/* Footer Struk */}
              <div className="receipt-footer">
                <p style={{ fontWeight: 'bold', marginBottom: '4px' }}>SIMPAN KONTAN INI SEBAGAI BUKTI</p>
                <p>Harap menjaga kebersihan area pantai</p>
                <p>Terima kasih atas kunjungan Anda!</p>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer (Action Buttons) */}
        <div 
          className="receipt-actions"
          style={{
            display: 'flex',
            gap: '12px',
            padding: '16px 20px',
            backgroundColor: 'var(--bg-surface)',
            borderTop: '1px solid var(--border)',
            justifyContent: 'center'
          }}
        >
          <button onClick={handlePrint} className="btn btn-primary" style={{ flex: 1, height: '42px', fontWeight: '700', justifyContent: 'center' }}>
            <Printer size={18} />
            <span>Cetak Karcis</span>
          </button>
          
          <button onClick={onClose} className="btn btn-secondary" style={{ flex: 1, height: '42px', fontWeight: '600', justifyContent: 'center' }}>
            <X size={18} />
            <span>Tutup</span>
          </button>
        </div>
      </div>
    </div>
  );
}
