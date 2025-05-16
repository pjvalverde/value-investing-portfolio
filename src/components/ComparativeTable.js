import React from 'react';

// Espera un prop: data = [{ company, metric1, metric2, ... }], metrics = ['ROE', 'P/E', ...]
const ComparativeTable = ({ data = [], metrics = [] }) => {
  if (!data.length) return <div>No hay datos para comparar.</div>;
  return (
    <div className="card">
      <div className="section-title">Comparativa de Empresas Seleccionadas</div>
      <table className="metrics-table">
        <thead>
          <tr>
            <th>Empresa</th>
            {metrics.map(metric => <th key={metric}>{metric}</th>)}
          </tr>
        </thead>
        <tbody>
          {data.map(row => (
            <tr key={row.company}>
              <td>{row.company}</td>
              {metrics.map(metric => <td key={metric}>{row[metric]}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
export default ComparativeTable;
