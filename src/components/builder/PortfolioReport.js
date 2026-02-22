import React, { useMemo } from 'react';
import './PortfolioReport.css';

/* ─────────────────────────────────────────────
   Helpers
───────────────────────────────────────────── */
const avg = (arr, fn) => {
  const vals = arr.map(fn).filter(v => v != null && !isNaN(v));
  return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
};

const fmt1 = v => (v == null ? '—' : Number(v).toFixed(1));
const fmtPct = v => (v == null ? '—' : `${Number(v).toFixed(1)}%`);
const fmtX = v => (v == null ? '—' : `${Number(v).toFixed(1)}x`);

/* ─────────────────────────────────────────────
   Score engines
───────────────────────────────────────────── */
function buffettScore(stocks, stats) {
  let score = 0;
  // ROE quality
  if (stats.avgROE >= 25) score += 28;
  else if (stats.avgROE >= 18) score += 20;
  else if (stats.avgROE >= 12) score += 10;
  // Moat presence
  const withMoat = stocks.filter(s => s.moat && s.moat.length > 10).length;
  score += Math.round((withMoat / stocks.length) * 24);
  // Margin quality
  if (stats.avgMargen >= 0.28) score += 24;
  else if (stats.avgMargen >= 0.18) score += 16;
  else if (stats.avgMargen >= 0.10) score += 8;
  // Debt conservatism
  if (stats.avgDeuda <= 0.5) score += 24;
  else if (stats.avgDeuda <= 1.0) score += 16;
  else if (stats.avgDeuda <= 1.5) score += 8;
  return Math.min(100, score);
}

function mungerScore(stocks, stats) {
  let score = 0;
  // % with ROE > 15
  const highROE = stocks.filter(s => (s.roe ?? 0) >= 15).length;
  score += Math.round((highROE / stocks.length) * 30);
  // FCF positive
  const positiveFCF = stocks.filter(s => (s.metrics?.fcf_yield ?? 0) > 0).length;
  score += Math.round((positiveFCF / stocks.length) * 25);
  // Sector diversity (3-7 = optimal, too few or too many hurts)
  const sectors = new Set(stocks.map(s => s.sector).filter(Boolean)).size;
  if (sectors >= 3 && sectors <= 7) score += 20;
  else if (sectors >= 2 && sectors <= 9) score += 12;
  else score += 4;
  // Low debt concentration
  if (stats.avgDeuda <= 0.8) score += 25;
  else if (stats.avgDeuda <= 1.5) score += 15;
  else score += 5;
  return Math.min(100, score);
}

function damodaranScore(stocks, stats) {
  let score = 0;
  const WACC_EST = 8.5;
  // ROIC spread
  const spread = (stats.avgROIC ?? 0) - WACC_EST;
  if (spread >= 10) score += 30;
  else if (spread >= 5) score += 22;
  else if (spread >= 0) score += 12;
  // EV/EBITDA valuation
  if (stats.avgEVEBITDA <= 12) score += 25;
  else if (stats.avgEVEBITDA <= 18) score += 18;
  else if (stats.avgEVEBITDA <= 25) score += 8;
  // FCF Yield attractiveness
  if (stats.avgFCFYield >= 4) score += 25;
  else if (stats.avgFCFYield >= 2) score += 16;
  else if (stats.avgFCFYield >= 0) score += 6;
  // Margin of safety (undervalued stocks)
  const undervalued = stocks.filter(s => (s.metrics?.margin_of_safety ?? -99) >= 10).length;
  score += Math.round((undervalued / stocks.length) * 20);
  return Math.min(100, score);
}

function verdictFromScore(score) {
  if (score >= 68) return { label: 'INVERTIR', color: 'green', icon: '✓', desc: 'El portafolio cumple los estándares de calidad value investing' };
  if (score >= 48) return { label: 'VIGILAR', color: 'yellow', icon: '⏸', desc: 'Portafolio aceptable, pero con áreas que mejorar antes de invertir' };
  return { label: 'EVITAR', color: 'red', icon: '✗', desc: 'El portafolio no cumple los criterios mínimos de value investing' };
}

function stars(score) {
  const n = Math.round(score / 20); // 0-5
  return '★'.repeat(n) + '☆'.repeat(5 - n);
}

/* ─────────────────────────────────────────────
   Expert "voice" generators (local, no AI)
───────────────────────────────────────────── */
function buffettVoice(stocks, stats, score) {
  const strengths = [];
  const concerns = [];
  if (stats.avgROE >= 20) strengths.push('Rentabilidad sobre patrimonio excepcional — señal de moat duradero');
  else if (stats.avgROE >= 15) strengths.push('ROE sólido, consistente con negocios de calidad');
  else concerns.push('ROE por debajo del umbral que exijo — el negocio no genera suficiente valor');

  const moatCount = stocks.filter(s => s.moat && s.moat.length > 10).length;
  if (moatCount >= stocks.length * 0.7) strengths.push(`${moatCount} de ${stocks.length} posiciones muestran ventaja competitiva clara`);
  else concerns.push('Demasiadas posiciones sin moat identificable — no puedo predecir el negocio a 10 años');

  if (stats.avgMargen >= 0.25) strengths.push('Márgenes operativos elevados — pricing power real');
  else if (stats.avgMargen < 0.12) concerns.push('Márgenes bajos sugieren ausencia de poder de fijación de precios');

  if (stats.avgDeuda <= 0.6) strengths.push('Deuda conservadora — el negocio no depende del apalancamiento');
  else if (stats.avgDeuda > 1.2) concerns.push('Deuda elevada: si el negocio flaquea, la deuda multiplica el problema');

  const quote = score >= 68
    ? '"Precio es lo que pagas, valor es lo que obtienes. Aquí obtienes más de lo que pagas."'
    : score >= 48
    ? '"Nunca invertimos en lo que no comprendemos del todo. Algunos de estos negocios me generan dudas."'
    : '"Regla nº1: nunca pierdas dinero. Regla nº2: nunca olvides la regla nº1."';

  return { strengths, concerns, quote, score };
}

function mungerVoice(stocks, stats, score) {
  const strengths = [];
  const concerns = [];

  const sectors = new Set(stocks.map(s => s.sector).filter(Boolean));
  if (sectors.size >= 3 && sectors.size <= 6) strengths.push(`Diversificación sensata en ${sectors.size} sectores — concentración sin sobreexposición`);
  else if (sectors.size > 7) concerns.push('Demasiados sectores — la diversificación excesiva es el refugio del ignorante');
  else concerns.push('Concentración sectorial alta — el riesgo específico es elevado');

  const highQuality = stocks.filter(s => (s.roe ?? 0) >= 15 && (s.deuda ?? 99) <= 1.0).length;
  if (highQuality >= stocks.length * 0.6) strengths.push(`${highQuality} posiciones de alta calidad (ROE>15%, deuda conservadora)`);
  else concerns.push('Muchas posiciones mediocres — prefiero pocos negocios excelentes');

  const positiveFCF = stocks.filter(s => (s.metrics?.fcf_yield ?? -1) > 1).length;
  if (positiveFCF >= stocks.length * 0.7) strengths.push('Mayoría de posiciones generan caja real para el inversor');
  else concerns.push('Varios negocios sin generación de caja libre real — es el oxígeno del negocio');

  const quote = score >= 68
    ? '"Invierte en negocios tan buenos que incluso un idiota pudiera dirigirlos, porque tarde o temprano uno lo hará."'
    : score >= 48
    ? '"La vida es demasiado corta para invertir en negocios mediocres. Este portafolio tiene algunos."'
    : '"Muéstrame el incentivo y te mostraré el resultado. Aquí el incentivo a largo plazo es cuestionable."';

  return { strengths, concerns, quote, score };
}

function damodaranVoice(stocks, stats, score) {
  const strengths = [];
  const concerns = [];
  const WACC = 8.5;
  const spread = (stats.avgROIC ?? 0) - WACC;

  if (spread >= 8) strengths.push(`Spread ROIC-WACC de +${fmt1(spread)}% — creación de valor económico real`);
  else if (spread >= 3) strengths.push(`Spread ROIC-WACC de +${fmt1(spread)}% — valor creado, aunque modesto`);
  else concerns.push(`Spread ROIC-WACC de ${fmt1(spread)}% — el portafolio apenas cubre el coste de capital`);

  if (stats.avgEVEBITDA <= 13) strengths.push(`EV/EBITDA medio de ${fmtX(stats.avgEVEBITDA)} — valoración razonable vs benchmarks`);
  else if (stats.avgEVEBITDA > 20) concerns.push(`EV/EBITDA medio de ${fmtX(stats.avgEVEBITDA)} — el mercado descuenta un crecimiento muy exigente`);

  if (stats.avgFCFYield >= 3.5) strengths.push(`FCF Yield medio de ${fmtPct(stats.avgFCFYield)} — flujo de caja atractivo`);
  else if (stats.avgFCFYield < 1.5) concerns.push(`FCF Yield de ${fmtPct(stats.avgFCFYield)} — muy bajo, el crecimiento debe validarse`);

  const undervalued = stocks.filter(s => (s.metrics?.margin_of_safety ?? -99) >= 10).length;
  if (undervalued >= stocks.length * 0.5) strengths.push(`${undervalued} de ${stocks.length} acciones cotizan con margen de seguridad positivo`);
  else concerns.push(`Solo ${undervalued} de ${stocks.length} acciones cotizan por debajo de su valor intrínseco DCF`);

  const quote = score >= 68
    ? '"El valor no es una opinión, es matemática. Los números aquí justifican la inversión."'
    : score >= 48
    ? '"Valuar es un ejercicio de humildad. Este portafolio tiene valor, pero también riesgo no despreciable."'
    : '"En finanzas, las esperanzas no son estrategia. Los fundamentales no justifican el precio actual."';

  return { strengths, concerns, quote, score };
}

/* ─────────────────────────────────────────────
   Sub-components
───────────────────────────────────────────── */
function VerdictBanner({ verdict, overallScore }) {
  return (
    <div className={`pr-verdict-banner pr-verdict-${verdict.color}`}>
      <div className="pr-verdict-icon">{verdict.icon}</div>
      <div className="pr-verdict-body">
        <div className="pr-verdict-label">{verdict.label}</div>
        <div className="pr-verdict-desc">{verdict.desc}</div>
      </div>
      <div className="pr-verdict-score">
        <span className="pr-score-num">{overallScore}</span>
        <span className="pr-score-den">/100</span>
        <div className="pr-stars">{stars(overallScore)}</div>
      </div>
    </div>
  );
}

function PortfolioMetrics({ stats, stocks }) {
  const WACC = 8.5;
  const spread = stats.avgROIC != null ? stats.avgROIC - WACC : null;
  const undervalued = stocks.filter(s => (s.metrics?.margin_of_safety ?? -99) >= 10).length;
  const metrics = [
    { label: 'ROIC Portafolio', value: fmtPct(stats.avgROIC), note: `Spread vs WACC: ${spread != null ? (spread >= 0 ? '+' : '') + fmt1(spread) + '%' : '—'}`, good: spread != null && spread >= 0 },
    { label: 'EV/EBITDA Medio', value: fmtX(stats.avgEVEBITDA), note: stats.avgEVEBITDA <= 15 ? 'Valoración razonable' : 'Valoración elevada', good: stats.avgEVEBITDA != null && stats.avgEVEBITDA <= 15 },
    { label: 'FCF Yield Medio', value: fmtPct(stats.avgFCFYield), note: stats.avgFCFYield >= 2 ? 'Generación de caja sólida' : 'FCF yield bajo', good: stats.avgFCFYield != null && stats.avgFCFYield >= 2 },
    { label: 'ROE Medio', value: fmtPct(stats.avgROE), note: stats.avgROE >= 15 ? 'Rentabilidad fuerte' : 'ROE por mejorar', good: stats.avgROE != null && stats.avgROE >= 15 },
    { label: 'Margen Operativo', value: stats.avgMargen != null ? fmtPct(stats.avgMargen * 100) : '—', note: stats.avgMargen >= 0.20 ? 'Márgenes saludables' : 'Márgenes ajustados', good: stats.avgMargen != null && stats.avgMargen >= 0.20 },
    { label: 'Acciones con Descuento', value: `${undervalued}/${stocks.length}`, note: 'Cotizan bajo valor intrínseco DCF', good: undervalued >= stocks.length * 0.4 },
  ];
  return (
    <div className="pr-metrics-grid">
      {metrics.map((m, i) => (
        <div key={i} className={`pr-metric-card ${m.good ? 'pr-metric-good' : 'pr-metric-warn'}`}>
          <div className="pr-metric-value">{m.value}</div>
          <div className="pr-metric-label">{m.label}</div>
          <div className="pr-metric-note">{m.note}</div>
        </div>
      ))}
    </div>
  );
}

function ExpertCard({ name, role, avatar, voice, color }) {
  return (
    <div className={`pr-expert-card pr-expert-${color}`}>
      <div className="pr-expert-header">
        <div className="pr-expert-avatar">{avatar}</div>
        <div>
          <div className="pr-expert-name">{name}</div>
          <div className="pr-expert-role">{role}</div>
        </div>
        <div className={`pr-expert-score pr-score-pill-${color}`}>
          {voice.score}<span>/100</span>
        </div>
      </div>
      <blockquote className="pr-expert-quote">"{voice.quote.replace(/^"|"$/g, '')}"</blockquote>
      {voice.strengths.length > 0 && (
        <div className="pr-expert-section">
          <div className="pr-expert-section-title">✓ Fortalezas</div>
          <ul className="pr-expert-list pr-list-green">
            {voice.strengths.map((s, i) => <li key={i}>{s}</li>)}
          </ul>
        </div>
      )}
      {voice.concerns.length > 0 && (
        <div className="pr-expert-section">
          <div className="pr-expert-section-title">⚠ Preocupaciones</div>
          <ul className="pr-expert-list pr-list-orange">
            {voice.concerns.map((c, i) => <li key={i}>{c}</li>)}
          </ul>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   Main component
───────────────────────────────────────────── */
export default function PortfolioReport({ portfolio }) {
  const allStocks = useMemo(() =>
    Object.values(portfolio?.allocation || {}).flat(),
    [portfolio]
  );

  const stats = useMemo(() => ({
    avgROIC:     avg(allStocks, s => s.metrics?.roic),
    avgEVEBITDA: avg(allStocks, s => s.metrics?.ev_ebitda),
    avgFCFYield: avg(allStocks, s => s.metrics?.fcf_yield),
    avgROE:      avg(allStocks, s => s.roe),
    avgDeuda:    avg(allStocks, s => s.deuda),
    avgMargen:   avg(allStocks, s => s.margen),
    avgMoS:      avg(allStocks, s => s.metrics?.margin_of_safety),
    avgCAGR:     avg(allStocks, s => s.metrics?.revenue_cagr_5y),
    totalStocks: allStocks.length,
    sectors:     new Set(allStocks.map(s => s.sector).filter(Boolean)),
  }), [allStocks]);

  const bScore = useMemo(() => buffettScore(allStocks, stats), [allStocks, stats]);
  const mScore = useMemo(() => mungerScore(allStocks, stats), [allStocks, stats]);
  const dScore = useMemo(() => damodaranScore(allStocks, stats), [allStocks, stats]);
  const overallScore = Math.round((bScore + mScore + dScore) / 3);

  const bVoice = useMemo(() => buffettVoice(allStocks, stats, bScore), [allStocks, stats, bScore]);
  const mVoice = useMemo(() => mungerVoice(allStocks, stats, mScore), [allStocks, stats, mScore]);
  const dVoice = useMemo(() => damodaranVoice(allStocks, stats, dScore), [allStocks, stats, dScore]);

  const verdict = verdictFromScore(overallScore);

  if (!allStocks.length) {
    return <div className="pr-empty">No hay posiciones en el portafolio.</div>;
  }

  return (
    <div className="pr-root">
      {/* Header */}
      <div className="pr-report-header">
        <div className="pr-report-title">
          <span className="pr-report-badge">COMITÉ DE INVERSIÓN</span>
          <h2>Informe del Portafolio</h2>
          <p>Evaluación independiente · Warren Buffett · Charlie Munger · Aswath Damodaran</p>
        </div>
        <div className="pr-composition-pills">
          <span>{allStocks.length} posiciones</span>
          <span>{stats.sectors.size} sectores</span>
          <span>{[...stats.sectors].slice(0, 2).join(', ')}{stats.sectors.size > 2 ? ` +${stats.sectors.size - 2}` : ''}</span>
        </div>
      </div>

      {/* Verdict banner */}
      <VerdictBanner verdict={verdict} overallScore={overallScore} />

      {/* Portfolio metrics */}
      <div className="pr-section-title">📊 Métricas del Portafolio</div>
      <PortfolioMetrics stats={stats} stocks={allStocks} />

      {/* Score breakdown */}
      <div className="pr-score-breakdown">
        {[
          { name: 'Buffett', score: bScore, color: '#1a6b3c' },
          { name: 'Munger', score: mScore, color: '#1a4a8a' },
          { name: 'Damodaran', score: dScore, color: '#7b1a8a' },
        ].map(e => (
          <div key={e.name} className="pr-score-bar-row">
            <span className="pr-score-bar-label">{e.name}</span>
            <div className="pr-score-bar-track">
              <div
                className="pr-score-bar-fill"
                style={{ width: `${e.score}%`, background: e.color }}
              />
            </div>
            <span className="pr-score-bar-num">{e.score}/100</span>
          </div>
        ))}
      </div>

      {/* Expert panel */}
      <div className="pr-section-title">🎓 Panel de Expertos</div>
      <div className="pr-experts-grid">
        <ExpertCard
          name="Warren Buffett"
          role="Calidad · Moat · Largo Plazo"
          avatar="🏛"
          voice={bVoice}
          color={bScore >= 68 ? 'green' : bScore >= 48 ? 'yellow' : 'red'}
        />
        <ExpertCard
          name="Charlie Munger"
          role="Modelos Mentales · Calidad · Capital"
          avatar="🧠"
          voice={mVoice}
          color={mScore >= 68 ? 'green' : mScore >= 48 ? 'yellow' : 'red'}
        />
        <ExpertCard
          name="Aswath Damodaran"
          role="DCF · ROIC · Valoración Cuantitativa"
          avatar="📐"
          voice={dVoice}
          color={dScore >= 68 ? 'green' : dScore >= 48 ? 'yellow' : 'red'}
        />
      </div>
    </div>
  );
}
