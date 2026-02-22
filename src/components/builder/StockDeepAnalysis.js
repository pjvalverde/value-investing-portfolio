import React from 'react';
import './StockDeepAnalysis.css';

/* ── helpers ── */
const fmt = (v, decimals = 1) => (v == null || v === '' ? '—' : Number(v).toFixed(decimals));
const fmtPct = (v) => (v == null ? '—' : `${Number(v).toFixed(1)}%`);
const fmtX = (v) => (v == null ? '—' : `${Number(v).toFixed(1)}x`);

function grade(value, thresholds) {
  // thresholds: [{min, max, label, color}] checked in order
  if (value == null || value === '') return { label: '—', color: 'neutral' };
  const n = Number(value);
  for (const t of thresholds) {
    const lo = t.min ?? -Infinity;
    const hi = t.max ?? Infinity;
    if (n >= lo && n < hi) return { label: t.label, color: t.color };
  }
  return { label: '—', color: 'neutral' };
}

const ROIC_THRESHOLDS   = [{ max: 0, label: 'Destruye valor', color: 'red' }, { max: 10, label: 'Por debajo del WACC', color: 'orange' }, { max: 15, label: 'Aceptable', color: 'yellow' }, { max: 25, label: 'Bueno', color: 'green' }, { min: 25, label: 'Excelente', color: 'green' }];
const EVEBITDA_THRESHOLDS = [{ max: 8, label: 'Muy barato', color: 'green' }, { max: 12, label: 'Barato', color: 'green' }, { max: 18, label: 'Justo', color: 'yellow' }, { max: 25, label: 'Caro', color: 'orange' }, { min: 25, label: 'Muy caro', color: 'red' }];
const FCF_THRESHOLDS    = [{ max: 0, label: 'FCF negativo', color: 'red' }, { max: 2, label: 'Bajo', color: 'orange' }, { max: 4, label: 'Moderado', color: 'yellow' }, { max: 6, label: 'Bueno', color: 'green' }, { min: 6, label: 'Muy bueno', color: 'green' }];
const CAGR_THRESHOLDS   = [{ max: 3, label: 'Estancado', color: 'red' }, { max: 7, label: 'Lento', color: 'yellow' }, { max: 12, label: 'Sólido', color: 'green' }, { min: 12, label: 'Alto crecimiento', color: 'green' }];
const ROE_THRESHOLDS    = [{ max: 10, label: 'Débil', color: 'red' }, { max: 15, label: 'Aceptable', color: 'yellow' }, { max: 25, label: 'Bueno', color: 'green' }, { min: 25, label: 'Excelente', color: 'green' }];
const DE_THRESHOLDS     = [{ max: 0.3, label: 'Sin deuda', color: 'green' }, { max: 0.7, label: 'Conservador', color: 'green' }, { max: 1.2, label: 'Moderado', color: 'yellow' }, { max: 2.0, label: 'Alto', color: 'orange' }, { min: 2.0, label: 'Peligroso', color: 'red' }];
const PE_THRESHOLDS     = [{ max: 12, label: 'Muy barato', color: 'green' }, { max: 20, label: 'Razonable', color: 'green' }, { max: 30, label: 'Premium', color: 'yellow' }, { max: 50, label: 'Caro', color: 'orange' }, { min: 50, label: 'Muy caro', color: 'red' }];
const MARGEN_THRESHOLDS = [{ max: 0.10, label: 'Bajo', color: 'red' }, { max: 0.20, label: 'Moderado', color: 'yellow' }, { max: 0.30, label: 'Bueno', color: 'green' }, { min: 0.30, label: 'Excelente', color: 'green' }];
const MOS_THRESHOLDS    = [{ max: -20, label: 'Muy sobrevalorado', color: 'red' }, { max: -5, label: 'Sobrevalorado', color: 'orange' }, { max: 10, label: 'Precio justo', color: 'yellow' }, { max: 25, label: 'Con descuento', color: 'green' }, { min: 25, label: 'Gran descuento', color: 'green' }];

function MetricRow({ label, value, displayValue, grade: g, footnote }) {
  return (
    <div className="sda-metric-row">
      <span className="sda-metric-label">{label}</span>
      <span className="sda-metric-value">{displayValue ?? value}</span>
      <span className={`sda-metric-badge sda-${g.color}`}>{g.label}</span>
      {footnote && <span className="sda-metric-footnote">{footnote}</span>}
    </div>
  );
}

function scoreStock(s, m) {
  let pts = 0, total = 0;
  const check = (val, good) => { total++; if (val != null && good) pts++; };
  check(m.roic,           (m.roic ?? 0) >= 10);
  check(m.ev_ebitda,      (m.ev_ebitda ?? 99) <= 18);
  check(m.fcf_yield,      (m.fcf_yield ?? 0) >= 2);
  check(m.revenue_cagr_5y,(m.revenue_cagr_5y ?? 0) >= 5);
  check(s.roe,            (s.roe ?? 0) >= 15);
  check(s.deuda,          (s.deuda ?? 99) <= 1.2);
  check(s.per,            (s.per ?? 99) <= 25);
  check(s.margen,         (s.margen ?? 0) >= 0.15);
  check(m.margin_of_safety, (m.margin_of_safety ?? -99) >= -10);
  return Math.round((pts / total) * 100);
}

function ScoreBadge({ score }) {
  const color = score >= 70 ? 'green' : score >= 45 ? 'yellow' : 'red';
  const label = score >= 70 ? 'Sólido' : score >= 45 ? 'Aceptable' : 'Débil';
  return (
    <div className={`sda-score-badge sda-score-${color}`}>
      <span className="sda-score-number">{score}</span>
      <span className="sda-score-label">/100 · {label}</span>
    </div>
  );
}

function StockCard({ stock }) {
  const m = stock.metrics || {};
  const score = scoreStock(stock, m);
  const mosG = grade(m.margin_of_safety, MOS_THRESHOLDS);
  const hasMoS = m.intrinsic_value != null && stock.price != null;

  return (
    <div className="sda-card">
      {/* Card header */}
      <div className="sda-card-header">
        <div className="sda-card-title-row">
          <div>
            <span className="sda-ticker">{stock.symbol}</span>
            <span className="sda-name">{stock.name}</span>
          </div>
          <ScoreBadge score={score} />
        </div>
        <div className="sda-card-meta">
          {stock.sector && <span className="sda-chip">{stock.sector}</span>}
          {stock.country && <span className="sda-chip sda-chip-country">{stock.country}</span>}
          {stock.categoria && <span className="sda-chip sda-chip-cat">{stock.categoria}</span>}
        </div>
      </div>

      <div className="sda-card-body">
        {/* Damodaran section */}
        <div className="sda-section">
          <div className="sda-section-title">📐 Damodaran · Creación de Valor</div>
          <MetricRow
            label="ROIC"
            displayValue={fmtPct(m.roic)}
            grade={grade(m.roic, ROIC_THRESHOLDS)}
            footnote="Retorno sobre capital invertido"
          />
          <MetricRow
            label="EV/EBITDA"
            displayValue={fmtX(m.ev_ebitda)}
            grade={grade(m.ev_ebitda, EVEBITDA_THRESHOLDS)}
            footnote="Valoración vs pares del sector"
          />
          <MetricRow
            label="FCF Yield"
            displayValue={fmtPct(m.fcf_yield)}
            grade={grade(m.fcf_yield, FCF_THRESHOLDS)}
            footnote="Generación de caja para el inversor"
          />
          <MetricRow
            label="CAGR Ingresos 5a"
            displayValue={fmtPct(m.revenue_cagr_5y)}
            grade={grade(m.revenue_cagr_5y, CAGR_THRESHOLDS)}
            footnote="Motor del valor terminal (DCF)"
          />
        </div>

        {/* Buffett / Munger section */}
        <div className="sda-section">
          <div className="sda-section-title">🏰 Buffett / Munger · Calidad</div>
          <MetricRow
            label="ROE"
            displayValue={fmtPct(stock.roe)}
            grade={grade(stock.roe, ROE_THRESHOLDS)}
            footnote="Rentabilidad sobre patrimonio"
          />
          <MetricRow
            label="Deuda / Equity"
            displayValue={fmt(stock.deuda)}
            grade={grade(stock.deuda, DE_THRESHOLDS)}
            footnote="Apalancamiento financiero"
          />
          <MetricRow
            label="P/E (PER)"
            displayValue={fmtX(stock.per)}
            grade={grade(stock.per, PE_THRESHOLDS)}
            footnote="Precio / Beneficio"
          />
          <MetricRow
            label="Margen Operativo"
            displayValue={stock.margen != null ? fmtPct(Number(stock.margen) * 100) : '—'}
            grade={grade(stock.margen, MARGEN_THRESHOLDS)}
            footnote="Calidad del negocio"
          />
        </div>

        {/* Valuation section */}
        {hasMoS && (
          <div className="sda-section">
            <div className="sda-section-title">💰 Valoración · Margen de Seguridad</div>
            <div className="sda-valuation-row">
              <div className="sda-val-block">
                <span className="sda-val-label">Precio mercado</span>
                <span className="sda-val-number">${fmt(stock.price, 2)}</span>
              </div>
              <div className="sda-val-arrow">→</div>
              <div className="sda-val-block">
                <span className="sda-val-label">Valor intrínseco (DCF)</span>
                <span className="sda-val-number">${fmt(m.intrinsic_value, 2)}</span>
              </div>
              <div className={`sda-mos-pill sda-${mosG.color}`}>
                {m.margin_of_safety >= 0 ? '+' : ''}{fmt(m.margin_of_safety, 1)}% · {mosG.label}
              </div>
            </div>
          </div>
        )}

        {/* Moat section */}
        {stock.moat && (
          <div className="sda-section sda-moat-section">
            <div className="sda-section-title">🏰 Ventaja Competitiva (Moat)</div>
            <p className="sda-moat-text">{stock.moat}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function StockDeepAnalysis({ portfolio }) {
  // Flatten all categories
  const allStocks = Object.values(portfolio?.allocation || {}).flat();

  if (!allStocks.length) {
    return <div className="sda-empty">No hay posiciones en el portafolio.</div>;
  }

  // Sort by score descending
  const sorted = [...allStocks].sort((a, b) => {
    const sa = scoreStock(a, a.metrics || {});
    const sb = scoreStock(b, b.metrics || {});
    return sb - sa;
  });

  return (
    <div className="sda-root">
      <div className="sda-header">
        <h2>Análisis por Acción</h2>
        <p>Evaluación individual con framework Damodaran + Buffett/Munger · Ordenado por puntuación</p>
      </div>
      <div className="sda-grid">
        {sorted.map((stock, i) => (
          <StockCard key={`${stock.symbol}-${i}`} stock={stock} />
        ))}
      </div>
    </div>
  );
}
