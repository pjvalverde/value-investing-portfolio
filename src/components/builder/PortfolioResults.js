import React, { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import './PortfolioResults.css';

const PortfolioResults = ({ portfolio, amount }) => {
  if (!portfolio || !portfolio.allocation) {
    return <div className="portfolio-results">No hay datos de portfolio disponibles</div>;
  }
  const { allocation, metrics } = portfolio;
  const positions = [
    ...(allocation.value || []).map(item => ({ ...item, bucket: 'value' })),
    ...(allocation.growth || []).map(item => ({ ...item, bucket: 'growth' })),
    ...(allocation.bonds || []).map(item => ({ ...item, bucket: 'bonds' })),
    ...(allocation.disruptive || []).map(item => ({ ...item, bucket: 'disruptive' }))
  ];
  const bucketData = positions.reduce((acc, position) => {
    const bucket = position.bucket || 'otros';
    if (!acc[bucket]) acc[bucket] = 0;
    acc[bucket] += position.amount;
    return acc;
  }, {});
  const pieData = Object.entries(bucketData).map(([name, value]) => ({
    name,
    value,
  }));
  const COLORS = {
    bonds: '#4a6fa5',
    value: '#68b7a0',
    growth: '#f1c40f',
    disruptive: '#ff6f61',
    otros: '#9b59b6'
  };
  const formatMoney = (amount) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };
  const totalInvested = positions.reduce((sum, pos) => sum + pos.amount, 0);
  const cash = amount - totalInvested;
  return (
    <div className="portfolio-results">
      <div className="results-summary">
        <div className="summary-item">
          <h3>Monto Total</h3>
          <p className="summary-value">{formatMoney(amount)}</p>
        </div>
        <div className="summary-item">
          <h3>Invertido</h3>
          <p className="summary-value">{formatMoney(totalInvested)}</p>
        </div>
        <div className="summary-item">
          <h3>Efectivo</h3>
          <p className="summary-value">{formatMoney(cash)}</p>
        </div>
        {metrics && (
          <>
            <div className="summary-item">
              <h3>Retorno Esperado</h3>
              <p className="summary-value">{metrics.expected_return}%</p>
            </div>
            <div className="summary-item">
              <h3>Volatilidad</h3>
              <p className="summary-value">{metrics.volatility}%</p>
            </div>
          </>
        )}
      </div>
      <div className="results-visualization">
        <div className="chart-container">
          <h3>Distribución por Estrategia</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={true}
                outerRadius={100}
                innerRadius={60}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[entry.name] || '#999'} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => formatMoney(value)} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="positions-table">
          <h3>Posiciones</h3>
          <table>
            <thead>
              <tr>
                <th>Ticker</th>
                <th>Estrategia</th>
                <th>Acciones</th>
                <th>Precio</th>
                <th>Valor</th>
              </tr>
            </thead>
            <tbody>
              {positions.map((position, index) => (
                <tr key={index} className={`row-${position.bucket}`}>
                  <td>{position.ticker}</td>
                  <td>{position.bucket}</td>
                  <td>{position.shares}</td>
                  <td>{formatMoney(position.price)}</td>
                  <td>{formatMoney(position.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const ClaudeAnalysisSection = ({ analysisClaude }) => {
  const [showAnalysis, setShowAnalysis] = useState(false);
  if (!analysisClaude) return null;

  // Intentar extraer métricas en formato JSON si vienen en el análisis
  let metricsTable = null;
  let analysisHtml = analysisClaude;
  try {
    // Buscar bloque JSON en el análisis
    const match = analysisClaude.match(/<pre.*?>([\s\S]*?)<\/pre>/);
    if (match) {
      const metrics = JSON.parse(match[1]);
      metricsTable = (
        <table className="claude-metrics-table">
          <thead>
            <tr>
              {Object.keys(metrics).map((k, i) => <th key={i}>{k}</th>)}
            </tr>
          </thead>
          <tbody>
            <tr>
              {Object.values(metrics).map((v, i) => <td key={i}>{v}</td>)}
            </tr>
          </tbody>
        </table>
      );
      // Eliminar el bloque <pre> del análisis mostrado
      analysisHtml = analysisClaude.replace(match[0], '');
    }
  } catch (e) { /* No metrics table */ }

  return (
    <div style={{marginTop:24}}>
      <button className="optimize-button" style={{marginBottom:12}} onClick={() => setShowAnalysis(v=>!v)}>
        {showAnalysis ? 'Ocultar análisis Claude' : 'Ver análisis Claude con métricas'}
      </button>
      {showAnalysis && (
        <div style={{background:'#f6f8fa',padding:12,borderRadius:6}}>
          <b>Análisis Claude:</b>
          <div dangerouslySetInnerHTML={{ __html: analysisHtml }} />
          {metricsTable && <div style={{marginTop:16}}>{metricsTable}</div>}
        </div>
      )}
    </div>
  );
};

export default PortfolioResults;
