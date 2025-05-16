import React from 'react';
import PortfolioTable from '../PortfolioTable';
import PortfolioCharts from '../PortfolioCharts';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import './PortfolioResults.css';

const PortfolioResults = ({ portfolio, amount }) => {
  // Verificar si portfolio existe y tiene la estructura esperada
  if (!portfolio || !portfolio.allocation) {
    return <div className="portfolio-results">No hay datos de portfolio disponibles</div>;
  }
  
  // Extraer datos del portfolio optimizado
  const { allocation, metrics } = portfolio;
  
  // Combinar todas las posiciones de diferentes categorías en un solo array
  const positions = [
    ...(allocation.value || []).map(item => ({ ...item, bucket: 'value' })),
    ...(allocation.growth || []).map(item => ({ ...item, bucket: 'growth' })),
    ...(allocation.bonds || []).map(item => ({ ...item, bucket: 'bonds' }))
  ];
  
  // Agrupar por bucket (tipo de activo)
  const bucketData = positions.reduce((acc, position) => {
    const bucket = position.bucket || 'otros';
    if (!acc[bucket]) acc[bucket] = 0;
    acc[bucket] += position.amount;
    return acc;
  }, {});
  
  // Convertir a formato para el gráfico
  const pieData = Object.entries(bucketData).map(([name, value]) => ({
    name,
    value,
  }));
  
  // Colores para el gráfico
  const COLORS = {
    bonds: '#4a6fa5',
    value: '#68b7a0',
    growth: '#f1c40f',
    otros: '#9b59b6'
  };
  
  // Formatear dinero
  const formatMoney = (amount) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };
  
  // Calcular el total invertido
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

export default PortfolioResults;
