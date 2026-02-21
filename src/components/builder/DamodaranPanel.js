import React from 'react';
import './DamodaranPanel.css';

const getSignal = (roic, marginOfSafety, fcfYield) => {
  const r = parseFloat(roic) || 0;
  const m = parseFloat(marginOfSafety) || 0;
  const f = parseFloat(fcfYield) || 0;
  const score =
    (r > 18 ? 2 : r > 12 ? 1 : 0) +
    (m > 20 ? 2 : m > 8 ? 1 : m < 0 ? -1 : 0) +
    (f > 5 ? 2 : f > 2.5 ? 1 : 0);
  if (score >= 4) return { type: 'buy', label: 'COMPRAR', icon: '▲' };
  if (score >= 2) return { type: 'hold', label: 'MANTENER', icon: '■' };
  if (score >= 0) return { type: 'watch', label: 'VIGILAR', icon: '◆' };
  return { type: 'avoid', label: 'EVITAR', icon: '▼' };
};

const fmt = (val, suffix = '') => {
  if (val === null || val === undefined || val === '' || val === '-') return '—';
  const n = parseFloat(val);
  if (isNaN(n)) return val;
  return `${n.toFixed(1)}${suffix}`;
};

const CategoryBadge = ({ cat }) => {
  const map = {
    value: { label: 'VALUE', cls: 'cat-value' },
    growth: { label: 'GROWTH', cls: 'cat-growth' },
    bonds: { label: 'BONOS', cls: 'cat-bonds' },
    disruptivas: { label: 'DISRUPTIVA', cls: 'cat-disruptive' },
  };
  const info = map[cat] || { label: cat?.toUpperCase() || '?', cls: 'cat-other' };
  return <span className={`dp-cat-badge ${info.cls}`}>{info.label}</span>;
};

const ConceptCard = ({ icon, title, desc }) => (
  <div className="dp-concept-card">
    <div className="dp-concept-icon">{icon}</div>
    <h4 className="dp-concept-title">{title}</h4>
    <p className="dp-concept-desc">{desc}</p>
  </div>
);

const DamodaranPanel = ({ portfolio }) => {
  const allPositions = [];
  if (portfolio?.allocation) {
    Object.entries(portfolio.allocation).forEach(([category, positions]) => {
      if (Array.isArray(positions)) {
        positions.forEach((p) => allPositions.push({ ...p, category }));
      }
    });
  }

  if (!allPositions.length) {
    return (
      <div className="dp-root">
        <p className="dp-empty">No hay posiciones para analizar.</p>
      </div>
    );
  }

  // Aggregate metrics for summary
  const validRoic = allPositions.map((p) => parseFloat(p.metrics?.roic || p.metrics?.ROIC)).filter((v) => !isNaN(v));
  const validMoS = allPositions.map((p) => parseFloat(p.metrics?.margin_of_safety)).filter((v) => !isNaN(v));
  const validFCF = allPositions.map((p) => parseFloat(p.metrics?.fcf_yield)).filter((v) => !isNaN(v));

  const avg = (arr) => arr.length ? (arr.reduce((s, v) => s + v, 0) / arr.length) : null;
  const avgRoic = avg(validRoic);
  const avgMoS = avg(validMoS);
  const avgFCF = avg(validFCF);

  return (
    <div className="dp-root">
      {/* Header */}
      <div className="dp-header">
        <div>
          <h3 className="dp-title">Análisis Damodaran</h3>
          <p className="dp-subtitle">ROIC vs WACC · EV/EBITDA · FCF Yield · Valor Intrínseco</p>
        </div>
      </div>

      {/* Framework cards */}
      <div className="dp-concepts">
        <ConceptCard
          icon="📐"
          title="ROIC > WACC"
          desc="La empresa solo crea valor real cuando el retorno sobre capital invertido supera su coste de capital. Si ROIC < WACC, el crecimiento destruye valor."
        />
        <ConceptCard
          icon="🔍"
          title="Margen de Seguridad"
          desc="Comprar con descuento significativo (≥15%) al valor intrínseco estimado por DCF. El margen de seguridad protege contra errores de estimación."
        />
        <ConceptCard
          icon="💵"
          title="FCF Yield"
          desc="El rendimiento del flujo de caja libre sobre el precio de mercado. Damodaran lo considera la métrica más honesta de generación de valor para el accionista."
        />
        <ConceptCard
          icon="🏰"
          title="Moat (Buffett)"
          desc="La ventaja competitiva duradera que protege los retornos superiores. Sin moat, el ROIC superior converge al coste de capital con el tiempo."
        />
      </div>

      {/* Aggregate KPIs */}
      {(avgRoic !== null || avgMoS !== null || avgFCF !== null) && (
        <div className="dp-kpi-row">
          {avgRoic !== null && (
            <div className={`dp-kpi ${avgRoic > 15 ? 'kpi-green' : avgRoic > 10 ? 'kpi-yellow' : 'kpi-red'}`}>
              <span className="dp-kpi-label">ROIC Promedio</span>
              <span className="dp-kpi-value">{avgRoic.toFixed(1)}%</span>
              <span className="dp-kpi-sub">{avgRoic > 15 ? '✓ Excelente' : avgRoic > 10 ? '~ Aceptable' : '✗ Bajo'}</span>
            </div>
          )}
          {avgMoS !== null && (
            <div className={`dp-kpi ${avgMoS > 15 ? 'kpi-green' : avgMoS > 0 ? 'kpi-yellow' : 'kpi-red'}`}>
              <span className="dp-kpi-label">Margen de Seguridad Promedio</span>
              <span className="dp-kpi-value">{avgMoS > 0 ? '+' : ''}{avgMoS.toFixed(1)}%</span>
              <span className="dp-kpi-sub">{avgMoS > 15 ? '✓ Sólido' : avgMoS > 0 ? '~ Limitado' : '✗ Sobrevalorado'}</span>
            </div>
          )}
          {avgFCF !== null && (
            <div className={`dp-kpi ${avgFCF > 4 ? 'kpi-green' : avgFCF > 2 ? 'kpi-yellow' : 'kpi-red'}`}>
              <span className="dp-kpi-label">FCF Yield Promedio</span>
              <span className="dp-kpi-value">{avgFCF.toFixed(1)}%</span>
              <span className="dp-kpi-sub">{avgFCF > 4 ? '✓ Atractivo' : avgFCF > 2 ? '~ Moderado' : '✗ Bajo'}</span>
            </div>
          )}
        </div>
      )}

      {/* Positions table */}
      <div className="dp-table-wrap">
        <table className="dp-table">
          <thead>
            <tr>
              <th>Ticker</th>
              <th>Cat.</th>
              <th>EV/EBITDA</th>
              <th>ROIC</th>
              <th>FCF Yield</th>
              <th>Rev. CAGR 5A</th>
              <th>V. Intrínseco</th>
              <th>Margen Seg.</th>
              <th>Señal</th>
            </tr>
          </thead>
          <tbody>
            {allPositions.map((pos, i) => {
              const m = pos.metrics || {};
              const roic = m.roic || m.ROIC;
              const evEbitda = m.ev_ebitda || m.EV_EBITDA;
              const fcfYield = m.fcf_yield;
              const revCagr = m.revenue_cagr_5y;
              const intrinsic = m.intrinsic_value;
              const marginOfSafety = m.margin_of_safety;
              const signal = getSignal(roic, marginOfSafety, fcfYield);
              const price = pos.price;

              return (
                <tr key={i} className={`dp-row dp-row-${signal.type}`}>
                  <td className="dp-ticker">
                    <strong>{pos.symbol || pos.ticker || 'N/A'}</strong>
                    {price && <span className="dp-price">${parseFloat(price).toFixed(2)}</span>}
                  </td>
                  <td><CategoryBadge cat={pos.category} /></td>
                  <td className="dp-num">{fmt(evEbitda, 'x')}</td>
                  <td className={`dp-num ${parseFloat(roic) > 15 ? 'dp-pos' : parseFloat(roic) > 10 ? '' : 'dp-neg'}`}>
                    {fmt(roic, '%')}
                  </td>
                  <td className={`dp-num ${parseFloat(fcfYield) > 4 ? 'dp-pos' : ''}`}>
                    {fmt(fcfYield, '%')}
                  </td>
                  <td className={`dp-num ${parseFloat(revCagr) > 10 ? 'dp-pos' : ''}`}>
                    {fmt(revCagr, '%')}
                  </td>
                  <td className="dp-num dp-intrinsic">
                    {intrinsic ? `$${parseFloat(intrinsic).toFixed(0)}` : '—'}
                  </td>
                  <td className={`dp-num dp-mos ${parseFloat(marginOfSafety) > 15 ? 'dp-pos' : parseFloat(marginOfSafety) < 0 ? 'dp-neg' : ''}`}>
                    {fmt(marginOfSafety, '%')}
                  </td>
                  <td>
                    <span className={`dp-signal dp-signal-${signal.type}`}>
                      {signal.icon} {signal.label}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="dp-note">
        ⚠ Las métricas de ROIC, EV/EBITDA, FCF Yield y Valor Intrínseco son estimaciones
        provistas por IA a partir de datos públicos. No constituyen asesoría financiera.
        Damodaran recomienda siempre verificar con fuentes primarias.
      </p>
    </div>
  );
};

export default DamodaranPanel;
