import React from 'react';

// Espera un prop: data = [{ company, metric1, metric2, ... }], metrics = ['ROE', 'P/E', ...]
const ComparativeTable = ({ data = [], metrics = [] }) => {
  if (!data.length) return <div>No hay datos para comparar.</div>;
  
  return (
    <div className="card">
      <div className="section-title">Comparativa de Empresas Seleccionadas</div>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 16 }}>
        <thead>
          <tr style={{ background: '#f2f2f2' }}>
            <th style={{ padding: 10, textAlign: 'left', border: '1px solid #ddd' }}>Empresa</th>
            {metrics.map(metric => (
              <th key={metric} style={{ padding: 10, textAlign: 'left', border: '1px solid #ddd' }}>{metric}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i}>
              <td style={{ padding: 10, fontWeight: 'bold', border: '1px solid #ddd' }}>{row.company}</td>
              {metrics.map(metric => (
                <td 
                  key={metric} 
                  style={{ 
                    padding: 10, 
                    border: '1px solid #ddd',
                    background: getMetricColor(metric, row[metric])
                  }}
                >
                  {row[metric] || '-'}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ marginTop: 12, fontSize: 14, color: '#666' }}>
        <p>
          <strong>Nota:</strong> Las celdas con fondo verde indican métricas favorables según los principios de value investing.
          Las celdas con fondo amarillo indican métricas moderadas, y las rojas indican áreas de precaución.
        </p>
      </div>
    </div>
  );
};

// Función para colorear celdas según el valor de la métrica
function getMetricColor(metric, value) {
  if (!value || value === '-') return 'transparent';
  
  // Convertir a número si es posible
  const numValue = typeof value === 'string' && value.includes('%') 
    ? parseFloat(value) 
    : parseFloat(value);
  
  if (isNaN(numValue)) return 'transparent';
  
  switch(metric) {
    case 'ROE':
      return numValue > 20 ? '#d4edda' : (numValue > 10 ? '#fff3cd' : '#f8d7da');
    case 'P/E':
      return numValue < 15 ? '#d4edda' : (numValue < 25 ? '#fff3cd' : '#f8d7da');
    case 'Margen de Beneficio':
      return numValue > 20 ? '#d4edda' : (numValue > 10 ? '#fff3cd' : '#f8d7da');
    case 'Ratio de Deuda':
      return numValue < 0.3 ? '#d4edda' : (numValue < 0.6 ? '#fff3cd' : '#f8d7da');
    case 'Crecimiento de FCF':
      return numValue > 10 ? '#d4edda' : (numValue > 5 ? '#fff3cd' : '#f8d7da');
    default:
      return 'transparent';
  }
}

export default ComparativeTable;
