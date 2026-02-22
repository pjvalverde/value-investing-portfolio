import React, { useMemo, useState, useRef, useCallback } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import './PortfolioReport.css';

const BASE_URL =
  process.env.REACT_APP_BACKEND_URL ||
  'https://value-investing-5b425882ff1a.herokuapp.com';

/* ─────────────────────────────────────────────
   Helpers
───────────────────────────────────────────── */
const avg = (arr, fn) => {
  const vals = arr.map(fn).filter(v => v != null && !isNaN(v));
  return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
};

const fmt1    = v => (v == null ? '—' : Number(v).toFixed(1));
const fmtPct  = v => (v == null ? '—' : `${Number(v).toFixed(1)}%`);
const fmtX    = v => (v == null ? '—' : `${Number(v).toFixed(1)}x`);

/* ─────────────────────────────────────────────
   Local score engines (use real Perplexity data)
───────────────────────────────────────────── */
function buffettScore(stocks, stats) {
  let score = 0;
  if (stats.avgROE >= 25) score += 28;
  else if (stats.avgROE >= 18) score += 20;
  else if (stats.avgROE >= 12) score += 10;

  const withMoat = stocks.filter(s => s.moat && s.moat.length > 10).length;
  score += Math.round((withMoat / stocks.length) * 24);

  if (stats.avgMargen >= 0.28) score += 24;
  else if (stats.avgMargen >= 0.18) score += 16;
  else if (stats.avgMargen >= 0.10) score += 8;

  if (stats.avgDeuda <= 0.5) score += 24;
  else if (stats.avgDeuda <= 1.0) score += 16;
  else if (stats.avgDeuda <= 1.5) score += 8;

  return Math.min(100, score);
}

function mungerScore(stocks, stats) {
  let score = 0;
  const highROE = stocks.filter(s => (s.roe ?? 0) >= 15).length;
  score += Math.round((highROE / stocks.length) * 30);

  const positiveFCF = stocks.filter(s => (s.metrics?.fcf_yield ?? 0) > 0).length;
  score += Math.round((positiveFCF / stocks.length) * 25);

  const sectors = new Set(stocks.map(s => s.sector).filter(Boolean)).size;
  if (sectors >= 3 && sectors <= 7) score += 20;
  else if (sectors >= 2 && sectors <= 9) score += 12;
  else score += 4;

  if (stats.avgDeuda <= 0.8) score += 25;
  else if (stats.avgDeuda <= 1.5) score += 15;
  else score += 5;

  return Math.min(100, score);
}

function damodaranScore(stocks, stats) {
  let score = 0;
  const WACC_EST = 8.5;
  const spread = (stats.avgROIC ?? 0) - WACC_EST;
  if (spread >= 10) score += 30;
  else if (spread >= 5) score += 22;
  else if (spread >= 0) score += 12;

  if (stats.avgEVEBITDA <= 12) score += 25;
  else if (stats.avgEVEBITDA <= 18) score += 18;
  else if (stats.avgEVEBITDA <= 25) score += 8;

  if (stats.avgFCFYield >= 4) score += 25;
  else if (stats.avgFCFYield >= 2) score += 16;
  else if (stats.avgFCFYield >= 0) score += 6;

  const undervalued = stocks.filter(s => (s.metrics?.margin_of_safety ?? -99) >= 10).length;
  score += Math.round((undervalued / stocks.length) * 20);

  return Math.min(100, score);
}

function verdictFromScore(score) {
  if (score >= 68) return { label: 'INVERTIR',  color: 'green',  icon: '✓', desc: 'El portafolio cumple los estándares de calidad value investing' };
  if (score >= 48) return { label: 'VIGILAR',   color: 'yellow', icon: '⏸', desc: 'Portafolio aceptable, pero con áreas que mejorar antes de invertir' };
  return               { label: 'EVITAR',    color: 'red',    icon: '✗', desc: 'El portafolio no cumple los criterios mínimos de value investing' };
}

function stars(score) {
  const n = Math.round(score / 20);
  return '★'.repeat(n) + '☆'.repeat(5 - n);
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
    {
      label: 'ROIC Portafolio',
      value: fmtPct(stats.avgROIC),
      note: `Spread vs WACC: ${spread != null ? (spread >= 0 ? '+' : '') + fmt1(spread) + '%' : '—'}`,
      good: spread != null && spread >= 0,
    },
    {
      label: 'EV/EBITDA Medio',
      value: fmtX(stats.avgEVEBITDA),
      note: stats.avgEVEBITDA != null && stats.avgEVEBITDA <= 15 ? 'Valoración razonable' : 'Valoración elevada',
      good: stats.avgEVEBITDA != null && stats.avgEVEBITDA <= 15,
    },
    {
      label: 'FCF Yield Medio',
      value: fmtPct(stats.avgFCFYield),
      note: stats.avgFCFYield != null && stats.avgFCFYield >= 2 ? 'Generación de caja sólida' : 'FCF yield bajo',
      good: stats.avgFCFYield != null && stats.avgFCFYield >= 2,
    },
    {
      label: 'ROE Medio',
      value: fmtPct(stats.avgROE),
      note: stats.avgROE != null && stats.avgROE >= 15 ? 'Rentabilidad fuerte' : 'ROE por mejorar',
      good: stats.avgROE != null && stats.avgROE >= 15,
    },
    {
      label: 'Margen Operativo',
      value: stats.avgMargen != null ? fmtPct(stats.avgMargen * 100) : '—',
      note: stats.avgMargen != null && stats.avgMargen >= 0.20 ? 'Márgenes saludables' : 'Márgenes ajustados',
      good: stats.avgMargen != null && stats.avgMargen >= 0.20,
    },
    {
      label: 'Acciones con Descuento',
      value: `${undervalued}/${stocks.length}`,
      note: 'Cotizan bajo valor intrínseco DCF',
      good: undervalued >= stocks.length * 0.4,
    },
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

/* ─────────────────────────────────────────────
   Main component
───────────────────────────────────────────── */
export default function PortfolioReport({ portfolio }) {
  const [streamText, setStreamText]   = useState('');
  const [streaming, setStreaming]     = useState(false);
  const [streamDone, setStreamDone]   = useState(false);
  const [streamError, setStreamError] = useState('');
  const abortRef = useRef(null);

  const allStocks = useMemo(
    () => Object.values(portfolio?.allocation || {}).flat(),
    [portfolio]
  );

  const stats = useMemo(() => ({
    avgROIC:     avg(allStocks, s => s.metrics?.roic),
    avgEVEBITDA: avg(allStocks, s => s.metrics?.ev_ebitda),
    avgFCFYield: avg(allStocks, s => s.metrics?.fcf_yield),
    avgROE:      avg(allStocks, s => s.roe),
    avgDeuda:    avg(allStocks, s => s.deuda),
    avgMargen:   avg(allStocks, s => s.margen),
    totalStocks: allStocks.length,
    sectors:     new Set(allStocks.map(s => s.sector).filter(Boolean)),
  }), [allStocks]);

  const bScore      = useMemo(() => buffettScore(allStocks, stats),    [allStocks, stats]);
  const mScore      = useMemo(() => mungerScore(allStocks, stats),     [allStocks, stats]);
  const dScore      = useMemo(() => damodaranScore(allStocks, stats),  [allStocks, stats]);
  const overallScore = Math.round((bScore + mScore + dScore) / 3);
  const verdict     = verdictFromScore(overallScore);

  const generateAIAnalysis = useCallback(async () => {
    if (streaming) {
      abortRef.current?.abort();
      return;
    }
    setStreaming(true);
    setStreamText('');
    setStreamDone(false);
    setStreamError('');

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const resp = await fetch(`${BASE_URL}/api/portfolio/claude-stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ portfolio }),
        signal: controller.signal,
      });

      if (!resp.ok) {
        throw new Error(`HTTP ${resp.status} — ${await resp.text()}`);
      }

      const reader  = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop(); // keep incomplete trailing line

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6).trim();
          if (data === '[DONE]') { setStreamDone(true); continue; }
          try {
            const parsed = JSON.parse(data);
            if (parsed.error) {
              setStreamError(parsed.error);
            } else if (parsed.text) {
              setStreamText(prev => prev + parsed.text);
            }
          } catch (e) { /* ignore malformed SSE lines */ }
        }
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        setStreamError(err.message || 'Error de conexión');
      }
    } finally {
      setStreaming(false);
      setStreamDone(true);
    }
  }, [streaming, portfolio]);

  if (!allStocks.length) {
    return <div className="pr-empty">No hay posiciones en el portafolio.</div>;
  }

  // Render streamed markdown safely
  const htmlContent = streamText
    ? DOMPurify.sanitize(marked.parse(streamText))
    : '';

  return (
    <div className="pr-root">

      {/* ── Header ── */}
      <div className="pr-report-header">
        <div className="pr-report-title">
          <span className="pr-report-badge">COMITÉ DE INVERSIÓN</span>
          <h2>Informe del Portafolio</h2>
          <p>Evaluación cuantitativa · Warren Buffett · Charlie Munger · Aswath Damodaran</p>
        </div>
        <div className="pr-composition-pills">
          <span>{allStocks.length} posiciones</span>
          <span>{stats.sectors.size} sectores</span>
          {[...stats.sectors].slice(0, 2).map(s => <span key={s}>{s}</span>)}
          {stats.sectors.size > 2 && <span>+{stats.sectors.size - 2} más</span>}
        </div>
      </div>

      {/* ── Verdict banner (local calc based on real metrics) ── */}
      <VerdictBanner verdict={verdict} overallScore={overallScore} />

      {/* ── Portfolio metrics grid (real Perplexity / yfinance data) ── */}
      <div className="pr-section-title">📊 Métricas del Portafolio</div>
      <PortfolioMetrics stats={stats} stocks={allStocks} />

      {/* ── Score breakdown bars ── */}
      <div className="pr-score-breakdown">
        {[
          { name: 'Buffett',    score: bScore, color: '#1a6b3c' },
          { name: 'Munger',     score: mScore, color: '#1a4a8a' },
          { name: 'Damodaran',  score: dScore, color: '#7b1a8a' },
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

      {/* ── AI Expert Panel (Claude streaming) ── */}
      <div className="pr-section-title">🤖 Análisis del Comité con IA</div>

      {/* Idle state — show generate button */}
      {!streamText && !streaming && !streamError && (
        <div className="pr-ai-prompt">
          <div className="pr-ai-prompt-icons">🏛&nbsp;&nbsp;🧠&nbsp;&nbsp;📐</div>
          <p className="pr-ai-prompt-text">
            Genera el análisis real del comité (Buffett · Munger · Damodaran) usando los datos
            de mercado actuales del portafolio.
          </p>
          <button className="pr-ai-btn" onClick={generateAIAnalysis}>
            🤖 Generar Análisis con IA
          </button>
        </div>
      )}

      {/* Loading state before first text arrives */}
      {streaming && !streamText && (
        <div className="pr-ai-loading">
          <div className="pr-ai-spinner" />
          <span>El comité de expertos está analizando tu portafolio…</span>
        </div>
      )}

      {/* Error state */}
      {streamError && (
        <div className="pr-ai-error">
          <span>⚠️ {streamError}</span>
          <button className="pr-ai-retry-btn" onClick={generateAIAnalysis}>
            🔄 Reintentar
          </button>
        </div>
      )}

      {/* Streaming / completed output */}
      {streamText && (
        <div className="pr-ai-output">
          <div
            className="pr-ai-content"
            dangerouslySetInnerHTML={{ __html: htmlContent }}
          />
          {streaming && <span className="pr-ai-cursor">▌</span>}
          {streamDone && !streaming && (
            <div className="pr-ai-footer">
              <button className="pr-ai-retry-btn" onClick={generateAIAnalysis}>
                🔄 Regenerar Análisis
              </button>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
