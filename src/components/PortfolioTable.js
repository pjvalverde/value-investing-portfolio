import React from 'react';

// Recibe: portfolio = [{ticker, sector, tipo, price, cantidad, inversion, recomendacion, ...metricas}]
const PortfolioTable = ({ portfolio = [], onShowAnalysis }) => {
  if (!portfolio.length) return <div>No hay datos de portafolio.</div>;
  
  return (
    <div className="card">
      <div className="section-title">Composición del portafolio</div>
      <table className="metrics-table">
        <thead>
          <tr>
            <th>Ticker</th>
            <th>Sector</th>
            <th>Peso (%)</th>
            <th>Tipo</th>
            <th>Precio actual</th>
            <th>Cantidad</th>
            <th>Inversión total</th>
            <th>Recomendación</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {portfolio.map(row => (
            <tr key={row.ticker}>
              <td>{row.ticker}</td>
              <td>{row.sector}</td>
              <td>{row.peso}</td>
              <td>{row.tipo}</td>
              <td>{row.price ? `$${Number(row.price).toFixed(2)}` : 'Cargando...'}</td>
              <td>{row.cantidad ?? '-'}</td>
              <td>{row.inversion ? `$${Number(row.inversion).toFixed(2)}` : 'Cargando...'}</td>
              <td>
                <span 
                  style={{
                    background: row.recomendacion === 'Comprar' ? '#8fd6b4' : '#e7e7e7', 
                    padding: '2px 8px', 
                    borderRadius: 6
                  }}
                >
                  {row.recomendacion}
                </span>
              </td>
              <td>
                <button 
                  onClick={() => onShowAnalysis(row)} 
                  style={{
                    background: '#3b5998',
                    color: 'white',
                    border: 'none',
                    padding: '4px 12px',
                    borderRadius: 4,
                    cursor: 'pointer'
                  }}
                >
                  Ver análisis
                </button>
              </td>
            </tr>
          ))}
          {/* Fila de suma total */}
          <tr style={{ fontWeight: 'bold', background: '#f6f6f6' }}>
            <td colSpan={6} style={{ textAlign: 'right' }}>Total inversión:</td>
            <td colSpan={3} style={{ textAlign: 'left' }}>
              ${portfolio.reduce((acc, row) => acc + (Number(row.inversion) || 0), 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default PortfolioTable;
