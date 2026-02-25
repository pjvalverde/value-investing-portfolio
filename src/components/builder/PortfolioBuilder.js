import React, { useState, useEffect, useRef } from 'react';
import PortfolioResults from './PortfolioResults';
import StockDeepAnalysis from './StockDeepAnalysis';
import PortfolioReport from './PortfolioReport';
import './PortfolioBuilder.css';

const BASE_URL =
  process.env.REACT_APP_BACKEND_URL ||
  'https://value-investing-5b425882ff1a.herokuapp.com';

/* ─────────────────────────────────────────────
   Strategy presets
───────────────────────────────────────────── */
const STRATEGIES = [
  {
    id: 'conservador',
    label: 'Conservador',
    icon: '🛡',
    tagline: 'Estabilidad y protección del capital',
    color: '#C9A84C',
    allocation: { value: 40, bonds: 35, growth: 15, disruptivas: 10 },
  },
  {
    id: 'balanceado',
    label: 'Balanceado',
    icon: '⚖️',
    tagline: 'Crecimiento moderado con riesgo controlado',
    color: '#1B6B3A',
    allocation: { value: 35, bonds: 25, growth: 25, disruptivas: 15 },
  },
  {
    id: 'crecimiento',
    label: 'Crecimiento',
    icon: '🚀',
    tagline: 'Máximo potencial, mayor tolerancia al riesgo',
    color: '#6C3EC0',
    allocation: { value: 25, bonds: 10, growth: 35, disruptivas: 30 },
  },
];

/* ─────────────────────────────────────────────
   Loading step tracker
───────────────────────────────────────────── */
const LOAD_STEPS = [
  { key: 'value',       label: 'Acciones Value',    icon: '🏰', color: '#1B4F72' },
  { key: 'growth',      label: 'Acciones Growth',   icon: '🚀', color: '#276749' },
  { key: 'bonds',       label: 'Bonos y ETFs',      icon: '🛡', color: '#C9A84C' },
  { key: 'disruptivas', label: 'ETFs Disruptivos',  icon: '⚡', color: '#8E44AD' },
];

/* ─────────────────────────────────────────────
   Main Component
───────────────────────────────────────────── */
export default function PortfolioBuilder() {
  const [view, setView]               = useState('input');   // 'input' | 'loading' | 'results'
  const [amount, setAmount]           = useState(10000);
  const [strategy, setStrategy]       = useState('balanceado');
  const [error, setError]             = useState('');
  const [loadStatus, setLoadStatus]   = useState({});        // {value:'done'|'loading'|'error', …}
  const [finalPortfolio, setFinalPortfolio] = useState(null);
  const [dataSource, setDataSource]   = useState(null);
  const [activeTab, setActiveTab]     = useState('portfolio');
  const abortRef = useRef(null);

  const preset = STRATEGIES.find(s => s.id === strategy);

  /* ── Fetch all categories in parallel ── */
  const buildPortfolio = async () => {
    setError('');
    setLoadStatus({});
    setView('loading');

    const controller = new AbortController();
    abortRef.current = controller;

    const alloc = preset.allocation;
    const categories = [
      { key: 'value',       endpoint: 'value',     pct: alloc.value },
      { key: 'growth',      endpoint: 'growth',    pct: alloc.growth },
      { key: 'bonds',       endpoint: 'bonds',     pct: alloc.bonds },
      { key: 'disruptivas', endpoint: 'disruptive', pct: alloc.disruptivas },
    ];

    const results = {};
    let detectedSource = null;

    const fetchOne = async ({ key, endpoint, pct }) => {
      if (pct <= 0) {
        setLoadStatus(prev => ({ ...prev, [key]: 'skip' }));
        return null;
      }
      setLoadStatus(prev => ({ ...prev, [key]: 'loading' }));
      try {
        const resp = await fetch(`${BASE_URL}/api/portfolio/${endpoint}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount: parseFloat(amount) * pct / 100 }),
          signal: controller.signal,
        });
        if (!resp.ok) throw new Error(await resp.text());
        const data = await resp.json();
        if (data.source) detectedSource = data.source;
        setLoadStatus(prev => ({ ...prev, [key]: 'done' }));
        return { key, data };
      } catch (err) {
        if (err.name === 'AbortError') return null;
        setLoadStatus(prev => ({ ...prev, [key]: 'error' }));
        return null;
      }
    };

    const fetches = await Promise.all(categories.map(fetchOne));

    fetches.forEach(res => {
      if (res) results[res.key] = res.data;
    });

    const allocation = {};
    if (results.value?.allocation)       allocation.value       = results.value.allocation;
    if (results.growth?.allocation)      allocation.growth      = results.growth.allocation;
    if (results.bonds?.allocation)       allocation.bonds       = results.bonds.allocation;
    if (results.disruptivas?.allocation) allocation.disruptivas = results.disruptivas.allocation;

    if (Object.keys(allocation).length === 0) {
      setError('No se pudo obtener datos del servidor. Intenta de nuevo.');
      setView('input');
      return;
    }

    setDataSource(detectedSource);
    setFinalPortfolio({ allocation, metrics: {}, source: 'combinado' });
    setActiveTab('portfolio');
    setView('results');
  };

  /* Cleanup on unmount */
  useEffect(() => () => abortRef.current?.abort(), []);

  /* ════════════════════════════════════════════
     VIEW: INPUT
  ════════════════════════════════════════════ */
  if (view === 'input') return (
    <div className="mvp-root">
      <div className="mvp-input-card">

        {/* Amount */}
        <div className="mvp-field">
          <label className="mvp-label">💰 Capital a invertir</label>
          <div className="mvp-amount-wrap">
            <span className="mvp-amount-prefix">$</span>
            <input
              className="mvp-amount-input"
              type="number"
              min="1000"
              step="500"
              value={amount}
              onChange={e => setAmount(e.target.value)}
            />
            <span className="mvp-amount-suffix">USD</span>
          </div>
          <p className="mvp-hint">Mínimo recomendado: $5,000</p>
        </div>

        {/* Strategy */}
        <div className="mvp-field">
          <label className="mvp-label">🎯 Estrategia de inversión</label>
          <div className="mvp-strategies">
            {STRATEGIES.map(s => (
              <button
                key={s.id}
                className={`mvp-strategy-card ${strategy === s.id ? 'active' : ''}`}
                style={strategy === s.id ? { borderColor: s.color, background: `${s.color}15` } : {}}
                onClick={() => setStrategy(s.id)}
              >
                <span className="mvp-st-icon">{s.icon}</span>
                <span className="mvp-st-label">{s.label}</span>
                <span className="mvp-st-tag">{s.tagline}</span>
                {/* Mini allocation bar */}
                <div className="mvp-st-bar">
                  {[
                    { pct: s.allocation.value,       color: '#1B4F72', label: 'Value' },
                    { pct: s.allocation.growth,      color: '#276749', label: 'Growth' },
                    { pct: s.allocation.bonds,       color: '#C9A84C', label: 'Bonos' },
                    { pct: s.allocation.disruptivas, color: '#8E44AD', label: 'Dist.' },
                  ].filter(x => x.pct > 0).map(x => (
                    <div
                      key={x.label}
                      className="mvp-st-bar-seg"
                      style={{ width: `${x.pct}%`, background: x.color }}
                      title={`${x.label}: ${x.pct}%`}
                    />
                  ))}
                </div>
                <div className="mvp-st-alloc-pills">
                  {[
                    { pct: s.allocation.value,       label: 'Value',      color: '#1B4F72' },
                    { pct: s.allocation.growth,      label: 'Growth',     color: '#276749' },
                    { pct: s.allocation.bonds,       label: 'Bonos',      color: '#C9A84C' },
                    { pct: s.allocation.disruptivas, label: 'Disrupt.',   color: '#8E44AD' },
                  ].filter(x => x.pct > 0).map(x => (
                    <span key={x.label} className="mvp-pill" style={{ color: x.color }}>
                      {x.pct}% {x.label}
                    </span>
                  ))}
                </div>
              </button>
            ))}
          </div>
        </div>

        {error && <div className="mvp-error">⚠️ {error}</div>}

        {/* CTA */}
        <button
          className="mvp-cta-btn"
          style={{ background: preset.color }}
          onClick={buildPortfolio}
          disabled={!amount || parseFloat(amount) < 1000}
        >
          <span className="mvp-cta-icon">{preset.icon}</span>
          Analizar Portafolio {preset.label}
          <span className="mvp-cta-arrow">→</span>
        </button>

        <p className="mvp-disclaimer">
          Datos en tiempo real · Análisis IA · Solo fines educativos
        </p>
      </div>
    </div>
  );

  /* ════════════════════════════════════════════
     VIEW: LOADING
  ════════════════════════════════════════════ */
  if (view === 'loading') return (
    <div className="mvp-root">
      <div className="mvp-loading-card">
        <div className="mvp-loading-header">
          <div className="mvp-loading-spinner" />
          <div>
            <h2>Construyendo tu portafolio</h2>
            <p>Consultando datos de mercado en tiempo real…</p>
          </div>
        </div>

        <div className="mvp-load-steps">
          {LOAD_STEPS.map(s => {
            const status = loadStatus[s.key];
            const skip = status === 'skip';
            return (
              <div
                key={s.key}
                className={`mvp-load-step ${status || 'pending'}`}
                style={{ opacity: skip ? 0.35 : 1 }}
              >
                <div className="mvp-load-step-icon" style={{ background: `${s.color}22`, color: s.color }}>
                  {s.icon}
                </div>
                <div className="mvp-load-step-info">
                  <span className="mvp-load-step-label">{s.label}</span>
                  <span className="mvp-load-step-status">
                    {status === 'loading' ? 'Consultando…'
                      : status === 'done'    ? '✓ Listo'
                      : status === 'error'   ? '⚠ Error (continuando)'
                      : status === 'skip'    ? '— Omitido'
                      : 'En espera'}
                  </span>
                </div>
                <div className={`mvp-load-step-dot ${status || ''}`} />
              </div>
            );
          })}
        </div>

        <button
          className="mvp-ghost-btn"
          onClick={() => { abortRef.current?.abort(); setView('input'); }}
        >
          Cancelar
        </button>
      </div>
    </div>
  );

  /* ════════════════════════════════════════════
     VIEW: RESULTS
  ════════════════════════════════════════════ */
  return (
    <div className="mvp-root">

      {/* Source banner */}
      {dataSource === 'yfinance' && (
        <div className="mvp-source-banner">
          📊 Datos vía <strong>Yahoo Finance</strong> — Perplexity AI no disponible actualmente
        </div>
      )}
      {dataSource === 'perplexity' && (
        <div className="mvp-source-banner mvp-source-ok">
          ✓ Datos y recomendaciones por <strong>Perplexity AI</strong>
        </div>
      )}

      {/* Tabs */}
      <div className="mvp-tabs">
        {[
          { id: 'portfolio', label: '📊 Portafolio' },
          { id: 'report',    label: '🎯 Informe IA' },
          { id: 'analysis',  label: '🔍 Por Acción' },
        ].map(t => (
          <button
            key={t.id}
            className={`mvp-tab-btn ${activeTab === t.id ? 'active' : ''}`}
            onClick={() => setActiveTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="mvp-tab-content">
        {activeTab === 'portfolio' && (
          <PortfolioResults portfolio={finalPortfolio} amount={amount} />
        )}
        {activeTab === 'report' && (
          <PortfolioReport portfolio={finalPortfolio} />
        )}
        {activeTab === 'analysis' && (
          <StockDeepAnalysis portfolio={finalPortfolio} />
        )}
      </div>

      {/* Footer */}
      <div className="mvp-footer-actions">
        <button
          className="mvp-ghost-btn"
          onClick={() => { setView('input'); setFinalPortfolio(null); }}
        >
          ↺ Nuevo Portafolio
        </button>
      </div>

    </div>
  );
}
