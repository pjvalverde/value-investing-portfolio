import React, { useState, useEffect } from 'react';
import ActionPieChart from './ActionPieChart';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function ActionAnalysisModal({ open, onClose, action, analysis, metrics }) {
  const [activeTab, setActiveTab] = useState('analysis');
  const [historicalData, setHistoricalData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open && action) {
      fetchHistoricalData();
    }
  }, [open, action]);

  const fetchHistoricalData = async () => {
    if (!action) return;
    setLoading(true);
    setError('');
    try {
      const BASE_URL = process.env.REACT_APP_BACKEND_URL.replace(/\/$/, '');
      const res = await fetch(`${BASE_URL}/historical_prices`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tickers: [action] })
      });
      if (!res.ok) throw new Error('No se pudieron obtener datos históricos');
      const data = await res.json();
      if (data.historical && data.historical[action]) {
        // Tomar los últimos 24 meses para el gráfico
        const chartData = data.historical[action].slice(-24).map(item => ({
          date: item.date.substring(0, 7), // Formato YYYY-MM
          precio: item.close
        }));
        setHistoricalData(chartData);
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;
  
  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
      background: 'rgba(0,0,0,0.2)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center'
    }}>
      <div style={{ 
        background: 'white', 
        borderRadius: 12, 
        padding: 32, 
        width: '80%', 
        maxWidth: 900, 
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 4px 24px #0001' 
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ margin: 0 }}>{action} - Análisis Detallado</h2>
          <button 
            onClick={onClose} 
            style={{ 
              background: '#f44336', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px', 
              padding: '8px 16px', 
              fontSize: 16, 
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            Cerrar <span style={{ marginLeft: 5, fontSize: 20 }}>&times;</span>
          </button>
        </div>
        
        {/* Tabs de navegación */}
        <div style={{ display: 'flex', borderBottom: '1px solid #ddd', marginBottom: 20 }}>
          <button 
            onClick={() => setActiveTab('analysis')}
            style={{ 
              padding: '8px 16px', 
              background: activeTab === 'analysis' ? '#3b5998' : 'transparent',
              color: activeTab === 'analysis' ? 'white' : '#333',
              border: 'none',
              borderRadius: '4px 4px 0 0',
              cursor: 'pointer',
              fontWeight: 500
            }}
          >
            Análisis Fundamental
          </button>
          <button 
            onClick={() => setActiveTab('chart')}
            style={{ 
              padding: '8px 16px', 
              background: activeTab === 'chart' ? '#3b5998' : 'transparent',
              color: activeTab === 'chart' ? 'white' : '#333',
              border: 'none',
              borderRadius: '4px 4px 0 0',
              cursor: 'pointer',
              fontWeight: 500
            }}
          >
            Gráfico Histórico
          </button>
          <button 
            onClick={() => setActiveTab('metrics')}
            style={{ 
              padding: '8px 16px', 
              background: activeTab === 'metrics' ? '#3b5998' : 'transparent',
              color: activeTab === 'metrics' ? 'white' : '#333',
              border: 'none',
              borderRadius: '4px 4px 0 0',
              cursor: 'pointer',
              fontWeight: 500
            }}
          >
            Métricas Clave
          </button>
        </div>

        {/* Contenido de las tabs */}
        {activeTab === 'analysis' && (
          <div style={{ background: '#fffbe8', padding: 16, borderRadius: 8, marginBottom: 24 }}>
            <div dangerouslySetInnerHTML={{ __html: analysis }} />
          </div>
        )}

        {activeTab === 'chart' && (
          <div style={{ height: 400, marginBottom: 24 }}>
            {loading && <div>Cargando datos históricos...</div>}
            {error && <div style={{ color: 'red' }}>{error}</div>}
            {!loading && !error && historicalData.length > 0 && (
              <>
                <h3>Evolución Histórica del Precio</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={historicalData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis domain={['auto', 'auto']} />
                    <Tooltip formatter={(value) => ['$' + value.toFixed(2), 'Precio']} />
                    <Legend />
                    <Line type="monotone" dataKey="precio" stroke="#3b5998" activeDot={{ r: 8 }} name={`Precio de ${action}`} />
                  </LineChart>
                </ResponsiveContainer>
                <p style={{ fontSize: 13, color: '#666', textAlign: 'center' }}>
                  Datos históricos de los últimos 24 meses. Fuente: Alpha Vantage.
                </p>
              </>
            )}
            {!loading && !error && historicalData.length === 0 && (
              <div style={{ textAlign: 'center', padding: 20 }}>
                No hay datos históricos disponibles para este ticker.
              </div>
            )}
          </div>
        )}

        {activeTab === 'metrics' && (
          <div style={{ marginBottom: 24 }}>
            <ActionPieChart metrics={metrics} title={`Métricas clave de ${action}`} />
            
            {/* Tabla de métricas adicionales */}
            <div style={{ marginTop: 20 }}>
              <h3>Detalle de Métricas de Value Investing</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 10 }}>
                <thead>
                  <tr style={{ background: '#f2f2f2' }}>
                    <th style={{ padding: 8, textAlign: 'left', border: '1px solid #ddd' }}>Métrica</th>
                    <th style={{ padding: 8, textAlign: 'left', border: '1px solid #ddd' }}>Valor</th>
                    <th style={{ padding: 8, textAlign: 'left', border: '1px solid #ddd' }}>Interpretación</th>
                  </tr>
                </thead>
                <tbody>
                  {metrics.map((metric, index) => (
                    <tr key={index}>
                      <td style={{ padding: 8, border: '1px solid #ddd' }}>{metric.name}</td>
                      <td style={{ padding: 8, border: '1px solid #ddd' }}>{metric.value}</td>
                      <td style={{ padding: 8, border: '1px solid #ddd' }}>
                        {metric.name === 'ROE' && metric.value > 15 && 'Excelente retorno sobre capital'}
                        {metric.name === 'ROE' && metric.value <= 15 && 'Retorno sobre capital moderado'}
                        {metric.name === 'P/E' && metric.value < 15 && 'Valoración atractiva'}
                        {metric.name === 'P/E' && metric.value >= 15 && metric.value <= 25 && 'Valoración razonable'}
                        {metric.name === 'P/E' && metric.value > 25 && 'Valoración elevada'}
                        {metric.name === 'Margen' && metric.value > 20 && 'Margen de beneficio excelente'}
                        {metric.name === 'Margen' && metric.value <= 20 && 'Margen de beneficio moderado'}
                        {metric.name === 'Deuda' && metric.value < 0.5 && 'Nivel de deuda saludable'}
                        {metric.name === 'Deuda' && metric.value >= 0.5 && 'Nivel de deuda elevado'}
                        {metric.name === 'FCF' && metric.value > 10 && 'Excelente crecimiento de flujo de caja'}
                        {metric.name === 'FCF' && metric.value <= 10 && 'Crecimiento de flujo de caja moderado'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
