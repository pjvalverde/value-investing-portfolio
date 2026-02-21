import React from 'react';
import {
  PieChart, Pie, Cell, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip
} from 'recharts';
import './PortfolioResults.css';

const CATEGORY_CONFIG = {
  value:       { label: 'Value',       color: '#1B4F72', icon: '🏰' },
  growth:      { label: 'Growth',      color: '#276749', icon: '🚀' },
  bonds:       { label: 'Bonos',       color: '#C9A84C', icon: '🛡' },
  disruptivas: { label: 'Disruptivas', color: '#8E44AD', icon: '⚡' },
};
const DEFAULT_COLORS = ['#1B4F72', '#276749', '#C9A84C', '#8E44AD'];

const CustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
  if (percent < 0.05) return null;
  const RADIAN = Math.PI / 180;
  const r = innerRadius + (outerRadius - innerRadius) * 0.55;
  const x = cx + r * Math.cos(-midAngle * RADIAN);
  const y = cy + r * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="#fff" textAnchor="middle" dominantBaseline="central"
      fontSize={13} fontWeight={700}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div style={{
      background: '#fff', border: '1px solid #E2E8F0', borderRadius: 8,
      padding: '10px 14px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    }}>
      <p style={{ fontWeight: 700, color: '#0D1B2A', margin: '0 0 4px' }}>{d.name}</p>
      <p style={{ color: '#4A5568', fontSize: '0.85rem', margin: 0 }}>
        {d.dataKey === 'valor'
          ? `$${d.value.toLocaleString('en', { maximumFractionDigits: 0 })}`
          : `${d.value} posiciones`}
      </p>
    </div>
  );
};

const PortfolioResults = ({ portfolio, amount }) => {
  if (!portfolio?.allocation) {
    return <div className="pr-empty">No hay datos del portafolio para mostrar</div>;
  }

  const categories = Object.entries(portfolio.allocation)
    .filter(([, v]) => v && v.length > 0);

  // Compute totals
  const totalValue = categories.reduce(
    (s, [, positions]) =>
      s + positions.reduce((ps, p) => ps + (p.shares || 0) * (p.price || 0), 0), 0
  );

  const totalPositions = categories.reduce((s, [, p]) => s + p.length, 0);

  // Pie data (by invested value)
  const pieData = categories.map(([key, positions], i) => {
    const cat = CATEGORY_CONFIG[key] || { label: key, color: DEFAULT_COLORS[i % DEFAULT_COLORS.length] };
    const catValue = positions.reduce((s, p) => s + (p.shares || 0) * (p.price || 0), 0);
    return { name: cat.label, value: catValue, color: cat.color, count: positions.length };
  });

  // Bar data
  const barData = categories.map(([key, positions]) => {
    const cat = CATEGORY_CONFIG[key] || { label: key };
    return {
      category: cat.label,
      posiciones: positions.length,
      valor: parseFloat(positions.reduce((s, p) => s + (p.shares || 0) * (p.price || 0), 0).toFixed(0)),
    };
  });

  return (
    <div className="pr-root">
      {/* Summary KPIs */}
      <div className="pr-kpi-row">
        <div className="pr-kpi">
          <span className="pr-kpi-label">Capital Total</span>
          <span className="pr-kpi-value">
            ${parseFloat(amount || 0).toLocaleString('en', { maximumFractionDigits: 0 })}
          </span>
        </div>
        <div className="pr-kpi">
          <span className="pr-kpi-label">Valor Invertido</span>
          <span className="pr-kpi-value" style={{ color: '#276749' }}>
            ${totalValue.toLocaleString('en', { maximumFractionDigits: 0 })}
          </span>
        </div>
        <div className="pr-kpi">
          <span className="pr-kpi-label">Posiciones</span>
          <span className="pr-kpi-value">{totalPositions}</span>
        </div>
        <div className="pr-kpi">
          <span className="pr-kpi-label">Categorías</span>
          <span className="pr-kpi-value">{categories.length}</span>
        </div>
      </div>

      {/* Charts */}
      <div className="pr-charts">
        <div className="pr-chart-card">
          <h4 className="pr-chart-title">Distribución del Capital</h4>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%"
                innerRadius={55} outerRadius={100}
                dataKey="value"
                labelLine={false}
                label={CustomLabel}
              >
                {pieData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} stroke="none" />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          {/* Legend */}
          <div className="pr-legend">
            {pieData.map((item, i) => (
              <div key={i} className="pr-legend-item">
                <span className="pr-legend-dot" style={{ background: item.color }} />
                <span className="pr-legend-label">{item.name}</span>
                <span className="pr-legend-val">
                  ${item.value.toLocaleString('en', { maximumFractionDigits: 0 })}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="pr-chart-card">
          <h4 className="pr-chart-title">Capital por Categoría</h4>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={barData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#EDF2F7" />
              <XAxis dataKey="category" tick={{ fontSize: 11, fill: '#718096' }} tickLine={false} />
              <YAxis
                tick={{ fontSize: 11, fill: '#718096' }}
                tickLine={false}
                axisLine={false}
                tickFormatter={v => `$${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="valor" name="Valor" radius={[6, 6, 0, 0]}>
                {barData.map((entry, i) => {
                  const key = categories[i]?.[0];
                  const cfg = CATEGORY_CONFIG[key] || { color: DEFAULT_COLORS[i % DEFAULT_COLORS.length] };
                  return <Cell key={i} fill={cfg.color} />;
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Position Tables by Category */}
      <div className="pr-positions">
        {categories.map(([key, positions]) => {
          const cat = CATEGORY_CONFIG[key] || { label: key, color: '#4A5568', icon: '◆' };
          const catTotal = positions.reduce((s, p) => s + (p.shares || 0) * (p.price || 0), 0);

          return (
            <div key={key} className="pr-category" style={{ borderTopColor: cat.color }}>
              <div className="pr-cat-header">
                <span className="pr-cat-icon">{cat.icon}</span>
                <h4 className="pr-cat-title">{cat.label}</h4>
                <span className="pr-cat-count">{positions.length} posiciones</span>
                <span className="pr-cat-total">
                  ${catTotal.toLocaleString('en', { maximumFractionDigits: 0 })}
                </span>
              </div>

              <div className="pr-table-wrap">
                <table className="pr-table">
                  <thead>
                    <tr>
                      <th>Ticker</th>
                      <th>Nombre</th>
                      <th>Precio</th>
                      <th>Acciones</th>
                      <th>Valor Total</th>
                      <th>% del Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {positions.map((pos, i) => {
                      const posValue = (pos.shares || 0) * (pos.price || 0);
                      const pct = totalValue > 0 ? (posValue / totalValue * 100).toFixed(1) : '—';
                      return (
                        <tr key={i}>
                          <td>
                            <span className="pr-ticker">{pos.symbol || pos.ticker || 'N/A'}</span>
                          </td>
                          <td className="pr-name">{pos.name || '—'}</td>
                          <td className="pr-num">
                            {pos.price ? `$${parseFloat(pos.price).toFixed(2)}` : '—'}
                          </td>
                          <td className="pr-num">{pos.shares || '—'}</td>
                          <td className="pr-num pr-bold">
                            {posValue > 0 ? `$${posValue.toLocaleString('en', { maximumFractionDigits: 0 })}` : '—'}
                          </td>
                          <td>
                            <div className="pr-pct-wrap">
                              <span className="pr-pct-val">{pct}%</span>
                              <div className="pr-pct-bar">
                                <div className="pr-pct-fill"
                                  style={{ width: `${Math.min(100, parseFloat(pct) * 2)}%`, background: cat.color }} />
                              </div>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PortfolioResults;
