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
      {/* Botón para métricas de Claude y modal */}
      <ClaudeMetricsModal analysisClaude={portfolio.analysisClaude} />
    </div>
  );
};

// Modal para métricas de Claude
const ClaudeMetricsModal = ({ analysisClaude }) => {
  const [open, setOpen] = useState(false);
  if (!analysisClaude) return null;
  let metrics = null;
  try {
    const match = analysisClaude.match(/<pre.*?>([\s\S]*?)<\/pre>/);
    if (match) {
      metrics = JSON.parse(match[1]);
    }
  } catch (e) { metrics = null; }
  if (!metrics) return null;
  return (
    <>
      <button className="optimize-button" style={{margin:'18px 0 0 0'}} onClick={()=>setOpen(true)}>
        Ver métricas de Claude
      </button>
      {open && (
        <div className="modal-overlay" style={{position:'fixed',top:0,left:0,width:'100vw',height:'100vh',background:'rgba(0,0,0,0.4)',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center'}}>
          <div className="modal-content" style={{background:'#fff',padding:24,borderRadius:8,minWidth:320,position:'relative',boxShadow:'0 2px 16px rgba(0,0,0,0.15)'}}>
            <button
              style={{position:'absolute',top:8,right:12,fontSize:22,border:'none',background:'none',cursor:'pointer'}}
              onClick={()=>setOpen(false)}
              aria-label="Cerrar"
            >×</button>
            <h3 style={{marginTop:0}}>Métricas de Claude</h3>
            <table className="claude-metrics-table" style={{width:'100%',marginTop:12}}>
              <thead>
                <tr>
                  {Object.keys(metrics).map((k,i) => <th key={i}>{k}</th>)}
                </tr>
              </thead>
              <tbody>
                <tr>
                  {Object.values(metrics).map((v,i) => <td key={i}>{v}</td>)}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
};

export default PortfolioResults;
