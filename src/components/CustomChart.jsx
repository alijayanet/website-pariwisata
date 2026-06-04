import React, { useState } from 'react';
import { BarChart2, Users } from 'lucide-react';

export default function CustomChart({ data = [] }) {
  const [activeTab, setActiveTab] = useState('revenue'); // 'revenue' or 'visitors'
  const [hoveredBar, setHoveredBar] = useState(null);

  if (!data || data.length === 0) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '250px', color: 'var(--text-muted)' }}>
        Tidak ada data grafik tersedia.
      </div>
    );
  }

  // Parameter Grafik
  const width = 500;
  const height = 240;
  const paddingLeft = 60;
  const paddingRight = 20;
  const paddingTop = 20;
  const paddingBottom = 40;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  // Nilai maksimum untuk skala Y
  const values = data.map(d => activeTab === 'revenue' ? d.revenue : d.visitors);
  const maxVal = Math.max(...values, 1);
  // Bulatkan maxVal ke atas untuk kecantikan grid (misal ke kelipatan terdekat)
  const yAxisMax = activeTab === 'revenue' 
    ? Math.ceil(maxVal / 50000) * 50000 || 50000 
    : Math.ceil(maxVal / 5) * 5 || 5;

  const formatYLabel = (val) => {
    if (activeTab === 'revenue') {
      if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
      if (val >= 1000) return `${(val / 1000).toFixed(0)}rb`;
      return val;
    }
    return val;
  };

  const formatRupiah = (value) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(value);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'left' }}>
      
      {/* Header Grafik & Tab Switcher */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <h4 style={{ fontWeight: '700', fontSize: '1rem', color: 'var(--text-primary)' }}>Tren Penjualan (7 Hari Terakhir)</h4>
        
        <div 
          style={{ 
            display: 'inline-flex', 
            backgroundColor: 'var(--bg-base)', 
            padding: '4px', 
            borderRadius: 'var(--radius-sm)', 
            border: '1px solid var(--border)' 
          }}
        >
          <button
            onClick={() => setActiveTab('revenue')}
            style={{
              padding: '6px 12px',
              fontSize: '0.8rem',
              fontWeight: '600',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: activeTab === 'revenue' ? 'var(--bg-surface)' : 'transparent',
              color: activeTab === 'revenue' ? 'var(--primary)' : 'var(--text-secondary)',
              boxShadow: activeTab === 'revenue' ? 'var(--shadow-sm)' : 'none'
            }}
          >
            <BarChart2 size={14} />
            <span>Pendapatan</span>
          </button>
          
          <button
            onClick={() => setActiveTab('visitors')}
            style={{
              padding: '6px 12px',
              fontSize: '0.8rem',
              fontWeight: '600',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: activeTab === 'visitors' ? 'var(--bg-surface)' : 'transparent',
              color: activeTab === 'visitors' ? 'var(--primary)' : 'var(--text-secondary)',
              boxShadow: activeTab === 'visitors' ? 'var(--shadow-sm)' : 'none'
            }}
          >
            <Users size={14} />
            <span>Pengunjung</span>
          </button>
        </div>
      </div>

      {/* SVG Canvas */}
      <div 
        style={{ 
          position: 'relative', 
          backgroundColor: 'var(--bg-surface)', 
          borderRadius: 'var(--radius-md)',
          padding: '10px',
          border: '1px solid var(--border)',
          overflow: 'hidden'
        }}
      >
        <svg 
          viewBox={`0 0 ${width} ${height}`} 
          width="100%" 
          height="100%" 
          style={{ display: 'block', overflow: 'visible' }}
        >
          {/* Definisikan Gradient Warna */}
          <defs>
            <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={activeTab === 'revenue' ? 'var(--primary)' : 'var(--emerald)'} stopOpacity="0.85" />
              <stop offset="100%" stopColor={activeTab === 'revenue' ? 'var(--primary-dark)' : '#0b7a70'} stopOpacity="0.2" />
            </linearGradient>
          </defs>

          {/* Gridlines Horizontal & Label Sumbu Y */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
            const yVal = yAxisMax * ratio;
            const yPos = height - paddingBottom - (ratio * chartHeight);
            return (
              <g key={i} style={{ opacity: 0.15 }}>
                <line 
                  x1={paddingLeft} 
                  y1={yPos} 
                  x2={width - paddingRight} 
                  y2={yPos} 
                  stroke="var(--text-primary)" 
                  strokeWidth="1" 
                  strokeDasharray="4 4"
                />
                <text 
                  x={paddingLeft - 8} 
                  y={yPos + 4} 
                  textAnchor="end" 
                  fill="var(--text-primary)" 
                  fontSize="10" 
                  fontWeight="600"
                  style={{ opacity: 0.8 }}
                >
                  {formatYLabel(yVal)}
                </text>
              </g>
            );
          })}

          {/* Sumbu X & Y Utama */}
          <line 
            x1={paddingLeft} 
            y1={height - paddingBottom} 
            x2={width - paddingRight} 
            y2={height - paddingBottom} 
            stroke="var(--border)" 
            strokeWidth="1.5" 
          />
          <line 
            x1={paddingLeft} 
            y1={paddingTop} 
            x2={paddingLeft} 
            y2={height - paddingBottom} 
            stroke="var(--border)" 
            strokeWidth="1.5" 
          />

          {/* Merender Bar/Batang Data */}
          {data.map((item, index) => {
            const barWidth = chartWidth / data.length * 0.6;
            const barSpacing = chartWidth / data.length;
            const xPos = paddingLeft + (index * barSpacing) + (barSpacing - barWidth) / 2;
            const currentVal = activeTab === 'revenue' ? item.revenue : item.visitors;
            const barHeight = (currentVal / yAxisMax) * chartHeight;
            const yPos = height - paddingBottom - barHeight;

            const isHovered = hoveredBar === index;

            return (
              <g key={index}>
                {/* Bar Batang Utama */}
                <rect
                  x={xPos}
                  y={yPos}
                  width={barWidth}
                  height={Math.max(barHeight, 2)} // Minimal height agar terlihat garis tipis jika 0
                  fill="url(#chartGradient)"
                  rx="4"
                  style={{ 
                    cursor: 'pointer', 
                    transition: 'all 0.2s ease',
                    filter: isHovered ? 'brightness(1.15) drop-shadow(0 4px 6px rgba(0,0,0,0.15))' : 'none' 
                  }}
                  onMouseEnter={() => setHoveredBar(index)}
                  onMouseLeave={() => setHoveredBar(null)}
                />

                {/* Label Tanggal Sumbu X */}
                <text
                  x={xPos + barWidth / 2}
                  y={height - paddingBottom + 18}
                  textAnchor="middle"
                  fill="var(--text-secondary)"
                  fontSize="10"
                  fontWeight="600"
                >
                  {item.date}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Tooltip Melayang Kustom saat Hover Bar */}
        {hoveredBar !== null && (
          <div
            style={{
              position: 'absolute',
              top: '10px',
              left: '50%',
              transform: 'translateX(-50%)',
              backgroundColor: 'rgba(15, 23, 42, 0.95)',
              color: 'white',
              padding: '6px 12px',
              borderRadius: 'var(--radius-sm)',
              boxShadow: 'var(--shadow-lg)',
              fontSize: '0.8rem',
              fontWeight: '600',
              pointerEvents: 'none',
              zIndex: 10,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              border: '1px solid rgba(255, 255, 255, 0.15)'
            }}
          >
            <span style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase' }}>
              {data[hoveredBar].date}
            </span>
            <span style={{ fontSize: '0.9rem', color: 'var(--primary-light)', marginTop: '2px' }}>
              {activeTab === 'revenue' 
                ? formatRupiah(data[hoveredBar].revenue) 
                : `${data[hoveredBar].visitors} Pengunjung`
              }
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
