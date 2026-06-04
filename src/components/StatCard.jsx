import React from 'react';

export default function StatCard({ title, value, icon: Icon, color, bgLight }) {
  return (
    <div className="card metric-card card-hover" style={{ textAlign: 'left' }}>
      <div 
        className="metric-icon" 
        style={{ 
          backgroundColor: bgLight || 'rgba(2, 132, 199, 0.1)', 
          color: color || 'var(--primary)' 
        }}
      >
        <Icon size={26} />
      </div>
      <div className="metric-details">
        <h4>{title}</h4>
        <div className="value">{value}</div>
      </div>
    </div>
  );
}
