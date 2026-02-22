import React, { useState } from 'react';
import './DamodaranWorksheet.css';

/* ─── helpers ─── */
const fmt = (v, digits = 1) =>
  v !== null && v !== undefined && !isNaN(Number(v))
    ? Number(v).toFixed(digits)
    : '—';

const fmtPct = (v) =>
  v !== null && v !== undefined && !isNaN(Number(v))
    ? `${Number(v).toFixed(1)}%`
    : '—';

const fmtUSD = (v) =>
  v !== null && v !== undefined && !isNaN(Number(v))
    ? `$${Number(v).toLocaleString('en', { maximumFractionDigits: 2 })}`
    : '—';

/* Traffic-light coloring */
const scoreColor = (value, thresholds) => {
  // thresholds: { good, avg } — higher is better unless inverted
  if (value === null || value === undefined || isNaN(Number(value))) return '';
  const v = Number(value);
  if (thresholds.invert) {
    if (v <= thresholds.good) return 'cell-green';
    if (v <= thresholds.avg)  return 'cell-yellow';
    return 'cell-red';
  }
  if (v >= thresholds.good) return 'cell-green';
  if (v >= thresholds.avg)  return 'cell-yellow';
  return 'cell-red';
};

/* Gather ALL positions from portfolio.allocation */
const flattenPositions = (portfolio) => {
  if (!portfolio?.allocation) return [];
  const rows = [];
  Object.entries(portfolio.allocation).forEach(([cat, positions]) => {
    if (!Array.isArray(positions)) return;
    positions.forEach((p) => {
      rows.push({ ...p, _cat: cat });
    });
  });
  return rows;
};

/* ─── Sub-components ─── */

/* 1. Stock Screener */
const ScreenerTab = ({ positions }) => {
  const criteria = [
    { key: 'per',              label: 'P/E < 20',        test: (v) => Number(v) < 20,  higher: false },
    { key: 'roe',              label: 'ROE > 15%',        test: (v) => Number(v) > 15,  higher: true  },
    { key: 'deuda',            label: 'D/E < 1.0',        test: (v) => Number(v) < 1.0, higher: false },
  ];
  const mCriteria = [
    { key: 'ev_ebitda',       label: 'EV/EBITDA < 12',   test: (v) => Number(v) < 12,  higher: false },
    { key: 'fcf_yield',       label: 'FCF Yield > 2%',   test: (v) => Number(v) > 2,   higher: true  },
    { key: 'roic',            label: 'ROIC > 10%',       test: (v) => Number(v) > 10,  higher: true  },
  ];

  const scorePos = (pos) => {
    let pass = 0, total = 0;
    [...criteria, ...mCriteria].forEach(({ key, test }) => {
      const val = key in pos ? pos[key] : pos.metrics?.[key];
      if (val !== null && val !== undefined && !isNaN(Number(val))) {
        total++;
        if (test(val)) pass++;
      }
    });
    return { pass, total };
  };

  return (
    <div className="ws-section">
      <div className="ws-section-header">
        <h3>📋 Stock Screener — Criterios Damodaran</h3>
        <p>Evaluación cuantitativa de cada posición contra umbrales de value investing</p>
      </div>
      <div className="ws-table-wrap">
        <table className="ws-table">
          <thead>
            <tr>
              <th>Ticker</th>
              <th>Empresa</th>
              <th>Cat.</th>
              <th>Sector</th>
              <th className="cell-num">P/E</th>
              <th className="cell-num">ROE%</th>
              <th className="cell-num">D/E</th>
              <th className="cell-num">EV/EBITDA</th>
              <th className="cell-num">FCF Yield</th>
              <th className="cell-num">ROIC%</th>
              <th className="cell-num">Rev CAGR 5Y</th>
              <th>Score</th>
              <th>Veredicto</th>
            </tr>
          </thead>
          <tbody>
            {positions.map((pos, i) => {
              const m = pos.metrics || {};
              const { pass, total } = scorePos(pos);
              const ratio = total > 0 ? pass / total : 0;
              const verdict = ratio >= 0.7 ? 'PASA' : ratio >= 0.4 ? 'REVISAR' : 'FALLA';
              const verdictCls = ratio >= 0.7 ? 'badge-green' : ratio >= 0.4 ? 'badge-yellow' : 'badge-red';
              return (
                <tr key={i}>
                  <td><span className="ws-ticker">{pos.symbol || pos.ticker || '—'}</span></td>
                  <td className="ws-name">{pos.name || '—'}</td>
                  <td><span className={`ws-cat ws-cat-${pos._cat}`}>{pos._cat?.toUpperCase()}</span></td>
                  <td className="ws-sector">{pos.sector || '—'}</td>
                  <td className={`cell-num ${scoreColor(pos.per, { good: 0, avg: 0, invert: true })} ${Number(pos.per) < 20 ? 'cell-green' : Number(pos.per) < 30 ? 'cell-yellow' : 'cell-red'}`}>
                    {fmt(pos.per)}
                  </td>
                  <td className={`cell-num ${scoreColor(pos.roe, { good: 15, avg: 10 })}`}>
                    {fmtPct(pos.roe)}
                  </td>
                  <td className={`cell-num ${scoreColor(pos.deuda, { good: 0.5, avg: 1.0, invert: true })}`}>
                    {fmt(pos.deuda)}
                  </td>
                  <td className={`cell-num ${scoreColor(m.ev_ebitda, { good: 8, avg: 15, invert: true })}`}>
                    {fmt(m.ev_ebitda)}
                  </td>
                  <td className={`cell-num ${scoreColor(m.fcf_yield, { good: 4, avg: 2 })}`}>
                    {fmtPct(m.fcf_yield)}
                  </td>
                  <td className={`cell-num ${scoreColor(m.roic, { good: 15, avg: 10 })}`}>
                    {fmtPct(m.roic)}
                  </td>
                  <td className={`cell-num ${scoreColor(m.revenue_cagr_5y, { good: 10, avg: 5 })}`}>
                    {fmtPct(m.revenue_cagr_5y)}
                  </td>
                  <td>
                    <div className="ws-score-bar-wrap">
                      <div className="ws-score-bar">
                        <div className="ws-score-fill" style={{ width: `${Math.round(ratio * 100)}%`, background: ratio >= 0.7 ? '#27AE60' : ratio >= 0.4 ? '#E67E22' : '#C53030' }} />
                      </div>
                      <span className="ws-score-label">{pass}/{total}</span>
                    </div>
                  </td>
                  <td><span className={`ws-badge ${verdictCls}`}>{verdict}</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="ws-legend-row">
        <span><span className="dot dot-green" /> Bueno</span>
        <span><span className="dot dot-yellow" /> Aceptable</span>
        <span><span className="dot dot-red" /> Cuidado</span>
        <span className="ws-legend-sep">|</span>
        <span>Benchmarks: P/E &lt;20 · ROE &gt;15% · D/E &lt;1.0 · EV/EBITDA &lt;12 · FCF Yield &gt;2% · ROIC &gt;10%</span>
      </div>
    </div>
  );
};

/* 2. Valuation Multiples */
const MultiplesTab = ({ positions }) => {
  const multiples = [
    { key: 'per',       mKey: null,         label: 'P/E',         bench: '<15 = valor · <25 = justo · >40 = caro', lowIsGood: true,  good: 15, avg: 25 },
    { key: null,        mKey: 'ev_ebitda',  label: 'EV/EBITDA',   bench: '<8 = valor · 8-15 = justo · >18 = caro',  lowIsGood: true,  good: 8,  avg: 15 },
    { key: 'roe',       mKey: null,         label: 'ROE%',        bench: '>20% = excelente · 15-20% = bueno · <10% = débil', lowIsGood: false, good: 20, avg: 15 },
    { key: null,        mKey: 'roic',       label: 'ROIC%',       bench: '>15% = creación valor · 10-15% = neutral · <8% = destruye',  lowIsGood: false, good: 15, avg: 10 },
    { key: null,        mKey: 'fcf_yield',  label: 'FCF Yield%',  bench: '>4% = infravalorado · 2-4% = justo · <2% = caro',            lowIsGood: false, good: 4,  avg: 2  },
    { key: null,        mKey: 'revenue_cagr_5y', label: 'Rev CAGR 5Y%', bench: '>10% = alto crecimiento · 5-10% = moderado · <5% = lento', lowIsGood: false, good: 10, avg: 5 },
  ];

  const assess = (val, m) => {
    if (val === null || val === undefined || isNaN(Number(val))) return { label: '—', cls: '' };
    const v = Number(val);
    if (m.lowIsGood) {
      if (v <= m.good)  return { label: 'INFRAVALORADO', cls: 'badge-green' };
      if (v <= m.avg)   return { label: 'JUSTO',         cls: 'badge-yellow' };
      return               { label: 'CARO',              cls: 'badge-red' };
    } else {
      if (v >= m.good)  return { label: 'EXCELENTE',     cls: 'badge-green' };
      if (v >= m.avg)   return { label: 'ACEPTABLE',     cls: 'badge-yellow' };
      return               { label: 'DÉBIL',             cls: 'badge-red' };
    }
  };

  return (
    <div className="ws-section">
      <div className="ws-section-header">
        <h3>📊 Análisis de Múltiplos de Valoración</h3>
        <p>Comparación de cada posición contra benchmarks Damodaran por múltiplo</p>
      </div>
      {multiples.map((mult) => (
        <div key={mult.label} className="ws-mult-block">
          <div className="ws-mult-title">
            <strong>{mult.label}</strong>
            <span className="ws-mult-bench">{mult.bench}</span>
          </div>
          <div className="ws-mult-cards">
            {positions.map((pos, i) => {
              const val = mult.key ? pos[mult.key] : pos.metrics?.[mult.mKey];
              const { label, cls } = assess(val, mult);
              const ticker = pos.symbol || pos.ticker || '?';
              return (
                <div key={i} className={`ws-mult-card ${cls}`}>
                  <span className="ws-mult-ticker">{ticker}</span>
                  <span className="ws-mult-value">
                    {val !== null && val !== undefined && !isNaN(Number(val))
                      ? `${Number(val).toFixed(1)}${['ROE%','ROIC%','FCF Yield%','Rev CAGR 5Y%'].includes(mult.label) ? '%' : 'x'}`
                      : '—'}
                  </span>
                  {label !== '—' && <span className={`ws-mult-label ws-badge ${cls}`}>{label}</span>}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

/* 3. Margin of Safety */
const MoSTab = ({ positions }) => (
  <div className="ws-section">
    <div className="ws-section-header">
      <h3>🛡 Margen de Seguridad (Damodaran)</h3>
      <p>Precio de mercado vs. valor intrínseco DCF estimado por Perplexity AI. MOS positivo = acción infravalorada.</p>
    </div>
    <div className="ws-table-wrap">
      <table className="ws-table">
        <thead>
          <tr>
            <th>Ticker</th>
            <th>Empresa</th>
            <th className="cell-num">Precio Mercado</th>
            <th className="cell-num">Valor Intrínseco DCF</th>
            <th className="cell-num">Upside $</th>
            <th className="cell-num">MOS%</th>
            <th>Señal</th>
            <th>Barra MOS</th>
          </tr>
        </thead>
        <tbody>
          {positions.map((pos, i) => {
            const m = pos.metrics || {};
            const price = Number(pos.price) || 0;
            const intrinsic = Number(m.intrinsic_value) || 0;
            const mos = Number(m.margin_of_safety);
            const upside = intrinsic - price;
            const mosPct = isNaN(mos) ? (intrinsic > 0 && price > 0 ? ((intrinsic - price) / price * 100) : null) : mos;

            let signal = '—', sigCls = '';
            if (mosPct !== null && !isNaN(mosPct)) {
              if (mosPct >= 20)       { signal = 'COMPRAR';  sigCls = 'badge-green'; }
              else if (mosPct >= 0)   { signal = 'MANTENER'; sigCls = 'badge-yellow'; }
              else if (mosPct >= -10) { signal = 'VIGILAR';  sigCls = 'badge-orange'; }
              else                    { signal = 'EVITAR';   sigCls = 'badge-red'; }
            }

            const barPct = mosPct !== null ? Math.min(100, Math.max(-100, mosPct)) : 0;
            const barColor = mosPct >= 20 ? '#27AE60' : mosPct >= 0 ? '#E67E22' : '#C53030';

            return (
              <tr key={i}>
                <td><span className="ws-ticker">{pos.symbol || pos.ticker || '—'}</span></td>
                <td className="ws-name">{pos.name || '—'}</td>
                <td className="cell-num">{fmtUSD(price)}</td>
                <td className={`cell-num ${intrinsic > price ? 'cell-green' : intrinsic > 0 ? 'cell-red' : ''}`}>
                  {fmtUSD(intrinsic || null)}
                </td>
                <td className={`cell-num ${upside > 0 ? 'cell-green' : 'cell-red'}`}>
                  {intrinsic > 0 ? (upside >= 0 ? '+' : '') + fmtUSD(upside) : '—'}
                </td>
                <td className={`cell-num ${mosPct >= 20 ? 'cell-green' : mosPct >= 0 ? 'cell-yellow' : 'cell-red'}`}>
                  {mosPct !== null ? `${mosPct >= 0 ? '+' : ''}${mosPct.toFixed(1)}%` : '—'}
                </td>
                <td>{signal !== '—' ? <span className={`ws-badge ${sigCls}`}>{signal}</span> : '—'}</td>
                <td>
                  <div className="ws-mos-bar-wrap">
                    <div className="ws-mos-center" />
                    <div
                      className="ws-mos-fill"
                      style={{
                        width: `${Math.abs(barPct) / 2}%`,
                        background: barColor,
                        marginLeft: barPct >= 0 ? '50%' : `${50 - Math.abs(barPct) / 2}%`,
                      }}
                    />
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
    <div className="ws-mos-info">
      <div className="ws-info-box ws-info-green">
        <strong>MOS &gt; 20%</strong>
        <span>Zona de compra — precio con descuento significativo al valor intrínseco</span>
      </div>
      <div className="ws-info-box ws-info-yellow">
        <strong>MOS 0–20%</strong>
        <span>Precio justo — mantener si ya se posee, esperar mejor precio para comprar</span>
      </div>
      <div className="ws-info-box ws-info-red">
        <strong>MOS &lt; 0%</strong>
        <span>Precio sobre valor intrínseco — vigilar o evitar nueva compra</span>
      </div>
    </div>
  </div>
);

/* 4. DCF & ROIC Analysis */
const DCFTab = ({ positions }) => (
  <div className="ws-section">
    <div className="ws-section-header">
      <h3>📐 Análisis DCF y ROIC vs WACC</h3>
      <p>La clave de Damodaran: ROIC &gt; WACC significa creación de valor real para el accionista. FCF Yield mide generación real de caja.</p>
    </div>

    {/* ROIC > WACC visual */}
    <div className="ws-roic-cards">
      {positions.map((pos, i) => {
        const m = pos.metrics || {};
        const roic = Number(m.roic);
        const wacc = 10; // Industry average estimate ~10%
        const spread = isNaN(roic) ? null : roic - wacc;
        const creates = spread !== null && spread > 0;
        return (
          <div key={i} className={`ws-roic-card ${creates ? 'ws-roic-good' : spread !== null ? 'ws-roic-bad' : 'ws-roic-unknown'}`}>
            <div className="ws-roic-ticker">{pos.symbol || pos.ticker}</div>
            <div className="ws-roic-name">{pos.name?.split(' ').slice(0, 2).join(' ')}</div>
            {spread !== null ? (
              <>
                <div className="ws-roic-spread">{spread >= 0 ? '+' : ''}{spread.toFixed(1)}%</div>
                <div className="ws-roic-label">ROIC - WACC spread</div>
                <div className={`ws-roic-verdict ${creates ? 'ws-rv-green' : 'ws-rv-red'}`}>
                  {creates ? '✓ CREA VALOR' : '✗ DESTRUYE VALOR'}
                </div>
              </>
            ) : (
              <div className="ws-roic-na">Sin datos ROIC</div>
            )}
          </div>
        );
      })}
    </div>

    {/* Full DCF table */}
    <div className="ws-table-wrap" style={{ marginTop: 24 }}>
      <table className="ws-table">
        <thead>
          <tr>
            <th>Ticker</th>
            <th>Empresa</th>
            <th className="cell-num">Precio</th>
            <th className="cell-num">Val. Intrínseco</th>
            <th className="cell-num">ROIC%</th>
            <th className="cell-num">WACC est.</th>
            <th className="cell-num">Spread</th>
            <th className="cell-num">FCF Yield%</th>
            <th className="cell-num">Rev CAGR 5Y</th>
            <th className="cell-num">MOS%</th>
            <th>Decisión DCF</th>
          </tr>
        </thead>
        <tbody>
          {positions.map((pos, i) => {
            const m = pos.metrics || {};
            const roic = Number(m.roic);
            const wacc = 10;
            const spread = isNaN(roic) ? null : roic - wacc;
            const mos = Number(m.margin_of_safety);

            let dcfDecision = '—', dcfCls = '';
            const hasMos = !isNaN(mos);
            const hasSpread = spread !== null;
            if (hasMos && hasSpread) {
              if (mos >= 20 && spread > 0)       { dcfDecision = 'COMPRAR FUERTE';  dcfCls = 'badge-green'; }
              else if (mos >= 0 && spread > 0)   { dcfDecision = 'COMPRAR';          dcfCls = 'badge-green'; }
              else if (mos >= 0 || spread > 0)   { dcfDecision = 'MANTENER';         dcfCls = 'badge-yellow'; }
              else                               { dcfDecision = 'EVITAR';           dcfCls = 'badge-red'; }
            } else if (hasMos) {
              dcfDecision = mos >= 20 ? 'COMPRAR' : mos >= 0 ? 'MANTENER' : 'EVITAR';
              dcfCls = mos >= 20 ? 'badge-green' : mos >= 0 ? 'badge-yellow' : 'badge-red';
            }

            return (
              <tr key={i}>
                <td><span className="ws-ticker">{pos.symbol || pos.ticker || '—'}</span></td>
                <td className="ws-name">{pos.name || '—'}</td>
                <td className="cell-num">{fmtUSD(pos.price)}</td>
                <td className={`cell-num ${Number(m.intrinsic_value) > Number(pos.price) ? 'cell-green' : m.intrinsic_value ? 'cell-red' : ''}`}>
                  {fmtUSD(m.intrinsic_value)}
                </td>
                <td className={`cell-num ${scoreColor(m.roic, { good: 15, avg: 10 })}`}>{fmtPct(m.roic)}</td>
                <td className="cell-num cell-gray">~{wacc}%</td>
                <td className={`cell-num ${spread !== null ? (spread > 0 ? 'cell-green' : 'cell-red') : ''}`}>
                  {spread !== null ? `${spread >= 0 ? '+' : ''}${spread.toFixed(1)}%` : '—'}
                </td>
                <td className={`cell-num ${scoreColor(m.fcf_yield, { good: 4, avg: 2 })}`}>{fmtPct(m.fcf_yield)}</td>
                <td className={`cell-num ${scoreColor(m.revenue_cagr_5y, { good: 10, avg: 5 })}`}>{fmtPct(m.revenue_cagr_5y)}</td>
                <td className={`cell-num ${hasMos ? (mos >= 20 ? 'cell-green' : mos >= 0 ? 'cell-yellow' : 'cell-red') : ''}`}>
                  {hasMos ? `${mos >= 0 ? '+' : ''}${mos.toFixed(1)}%` : '—'}
                </td>
                <td>{dcfDecision !== '—' ? <span className={`ws-badge ${dcfCls}`}>{dcfDecision}</span> : '—'}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
    <p className="ws-footnote">* WACC estimado ~10% como referencia de mercado. Para WACC preciso se requiere estructura de capital individual por empresa.</p>
  </div>
);

/* 5. Key Ratios Reference */
const ReferenciaTab = () => {
  const tables = [
    {
      title: '📈 Ratios de Rentabilidad',
      rows: [
        { ratio: 'ROE',          formula: 'Utilidad Neta / Patrimonio',   good: '>20%',   avg: '15–20%', poor: '<10%',  note: 'Retorno sobre capital propio' },
        { ratio: 'ROA',          formula: 'Utilidad Neta / Activos',      good: '>10%',   avg: '5–10%',  poor: '<5%',   note: 'Retorno sobre activos totales' },
        { ratio: 'ROIC',         formula: 'NOPAT / Capital Invertido',    good: '>15%',   avg: '10–15%', poor: '<8%',   note: 'Creación de valor (vs WACC)' },
        { ratio: 'Margen Bruto', formula: 'Utilidad Bruta / Ingresos',    good: '>40%',   avg: '20–40%', poor: '<20%',  note: 'Poder de fijación de precios' },
        { ratio: 'Margen EBIT',  formula: 'EBIT / Ingresos',              good: '>15%',   avg: '10–15%', poor: '<5%',   note: 'Eficiencia operativa' },
        { ratio: 'Margen Neto',  formula: 'Utilidad Neta / Ingresos',     good: '>10%',   avg: '5–10%',  poor: '<3%',   note: 'Rentabilidad total' },
      ],
    },
    {
      title: '⚖ Ratios de Valoración',
      rows: [
        { ratio: 'P/E',          formula: 'Precio / BPA',                good: '<15',    avg: '15–25',  poor: '>40',   note: 'Múltiplo de utilidades' },
        { ratio: 'P/B',          formula: 'Precio / Valor Libro',        good: '<2',     avg: '2–3',    poor: '>5',    note: 'Múltiplo sobre valor contable' },
        { ratio: 'P/S',          formula: 'Precio / Ventas',             good: '<2',     avg: '2–4',    poor: '>8',    note: 'Múltiplo de ventas' },
        { ratio: 'EV/EBITDA',    formula: 'EV / EBITDA',                 good: '<8',     avg: '8–15',   poor: '>25',   note: 'Mejor para comparación sectorial' },
        { ratio: 'PEG',          formula: 'P/E / Tasa de Crecimiento',   good: '<1',     avg: '1–2',    poor: '>3',    note: 'P/E ajustado por crecimiento' },
        { ratio: 'FCF Yield',    formula: 'FCF / Capitalización',        good: '>4%',    avg: '2–4%',   poor: '<2%',   note: 'Generación real de caja' },
      ],
    },
    {
      title: '🏦 Ratios de Apalancamiento',
      rows: [
        { ratio: 'Deuda/Equity', formula: 'Deuda Total / Patrimonio',   good: '<0.5',   avg: '0.5–1.0', poor: '>1.5', note: 'Apalancamiento financiero' },
        { ratio: 'Deuda/Activos',formula: 'Deuda Total / Activos',      good: '<0.3',   avg: '0.3–0.5', poor: '>0.6', note: 'Financiamiento con deuda' },
        { ratio: 'Cobertura Int.',formula: 'EBIT / Gastos Interés',     good: '>5x',    avg: '3–5x',    poor: '<2x',  note: 'Capacidad de pago de deuda' },
        { ratio: 'Ratio Corriente',formula:'Activo Corr. / Pasivo Corr.',good: '>2.0',  avg: '1.5–2.0', poor: '<1.0', note: 'Liquidez a corto plazo' },
      ],
    },
  ];

  return (
    <div className="ws-section">
      <div className="ws-section-header">
        <h3>📚 Guía de Referencia — Ratios Financieros</h3>
        <p>Umbrales de referencia basados en la metodología de Aswath Damodaran (NYU Stern)</p>
      </div>
      {tables.map((tbl) => (
        <div key={tbl.title} className="ws-ref-block">
          <h4 className="ws-ref-title">{tbl.title}</h4>
          <div className="ws-table-wrap">
            <table className="ws-table ws-ref-table">
              <thead>
                <tr>
                  <th>Ratio</th>
                  <th>Fórmula</th>
                  <th className="cell-green-h">Bueno ✓</th>
                  <th className="cell-yellow-h">Promedio</th>
                  <th className="cell-red-h">Débil ✗</th>
                  <th>Interpretación</th>
                </tr>
              </thead>
              <tbody>
                {tbl.rows.map((r, i) => (
                  <tr key={i}>
                    <td><strong>{r.ratio}</strong></td>
                    <td className="ws-formula">{r.formula}</td>
                    <td className="cell-green">{r.good}</td>
                    <td className="cell-yellow">{r.avg}</td>
                    <td className="cell-red">{r.poor}</td>
                    <td className="ws-note">{r.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
      <div className="ws-attribution">
        Fuente: Aswath Damodaran — <em>Investment Philosophies &amp; Valuation Methods</em> · NYU Stern School of Business
      </div>
    </div>
  );
};

/* ─── Main Component ─── */
const DamodaranWorksheet = ({ portfolio }) => {
  const [activeTab, setActiveTab] = useState('screener');
  const positions = flattenPositions(portfolio);

  if (positions.length === 0) {
    return (
      <div className="ws-empty">
        <p>No hay posiciones para analizar. Construye un portafolio primero.</p>
      </div>
    );
  }

  const TABS = [
    { id: 'screener',   label: '📋 Screener'     },
    { id: 'multiples',  label: '📊 Múltiplos'    },
    { id: 'mos',        label: '🛡 Margen Seg.'  },
    { id: 'dcf',        label: '📐 DCF / ROIC'   },
    { id: 'referencia', label: '📚 Referencia'   },
  ];

  return (
    <div className="ws-root">
      <div className="ws-header">
        <h2>Damodaran Worksheet</h2>
        <p>Análisis cuantitativo completo de tu portafolio — <strong>{positions.length} posiciones</strong></p>
      </div>

      {/* Sub-tab bar */}
      <div className="ws-tabs">
        {TABS.map((t) => (
          <button
            key={t.id}
            className={`ws-tab-btn ${activeTab === t.id ? 'active' : ''}`}
            onClick={() => setActiveTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="ws-content">
        {activeTab === 'screener'   && <ScreenerTab  positions={positions} />}
        {activeTab === 'multiples'  && <MultiplesTab positions={positions} />}
        {activeTab === 'mos'        && <MoSTab       positions={positions} />}
        {activeTab === 'dcf'        && <DCFTab        positions={positions} />}
        {activeTab === 'referencia' && <ReferenciaTab />}
      </div>
    </div>
  );
};

export default DamodaranWorksheet;
