import React from 'react';
import ActionPieChart from './ActionPieChart';

export default function ActionAnalysisModal({ open, onClose, action, analysis, metrics }) {
  if (!open) return null;
  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
      background: 'rgba(0,0,0,0.2)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center'
    }}>
      <div style={{ background: 'white', borderRadius: 12, padding: 32, minWidth: 400, maxWidth: 600, boxShadow: '0 4px 24px #0001' }}>
        <button onClick={onClose} style={{ float: 'right', background: 'none', border: 'none', fontSize: 20, cursor: 'pointer' }}>&times;</button>
        <h2 style={{ marginTop: 0 }}>{action}</h2>
        <div style={{ background: '#fffbe8', padding: 16, borderRadius: 8, marginBottom: 24 }}>
          <div dangerouslySetInnerHTML={{ __html: analysis }} />
        </div>
        <ActionPieChart metrics={metrics} title={`Métricas clave de ${action}`} />
      </div>
    </div>
  );
}
