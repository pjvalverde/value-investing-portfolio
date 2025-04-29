import React from 'react';

// Recibe: portfolio = [{ticker, sector, tipo, price, cantidad, inversion, recomendacion, ...metricas}]
const PortfolioTable = ({ portfolio = [] }) => {
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
          </tr>
        </thead>
        <tbody>
          {portfolio.map(row => (
            <tr key={row.ticker}>
              <td>{row.ticker}</td>
              <td>{row.sector}</td>
              <td>{row.peso}</td>
              <td>{row.tipo}</td>
              <td>{row.price ? `$${Number(row.price).toFixed(2)}` : '-'}</td>
              <td>{row.cantidad ?? '-'}</td>
              <td>{row.inversion ? `$${row.inversion}` : '-'}</td>
              <td><span style={{background: row.recomendacion === 'Comprar' ? '#8fd6b4' : '#e7e7e7', padding: '2px 8px', borderRadius: 6}}>{row.recomendacion}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default PortfolioTable;
