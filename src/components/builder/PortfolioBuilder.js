import React, { useState, useEffect } from 'react';
import PortfolioResults from './PortfolioResults';
import ClaudeAnalysisMarkdown from './ClaudeAnalysisMarkdown';
import HistoricalPerformance from './HistoricalPerformance';
import DamodaranPanel from './DamodaranPanel';
import DamodaranWorksheet from './DamodaranWorksheet';
import StockDeepAnalysis from './StockDeepAnalysis';
import MethodologyDoc from '../MethodologyDoc';
import './PortfolioBuilder.css';


/* ── Step definitions ── */
const STEPS = [
  { id: 1, label: 'Perfil' },
  { id: 2, label: 'Asignación' },
  { id: 3, label: 'Value' },
  { id: 4, label: 'Growth' },
  { id: 5, label: 'Bonos' },
  { id: 6, label: 'Análisis' },
];

const StepIndicator = ({ current }) => {
  const displayStep = current === 7 ? 6 : current;
  return (
    <div className="step-indicator">
      {STEPS.map((s, i) => {
        const done = displayStep > s.id;
        const active = displayStep === s.id;
        return (
          <React.Fragment key={s.id}>
            <div className={`step-dot ${done ? 'done' : active ? 'active' : ''}`}>
              <div className="step-dot-inner">
                {done ? <span className="step-check">✓</span> : <span>{s.id}</span>}
              </div>
              <span className="step-label">{s.label}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`step-line ${done ? 'done' : ''}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

/* ── Allocation visual bar ── */
const AllocationBar = ({ allocation }) => {
  const items = [
    { key: 'value',       label: 'Value',       color: '#1B4F72' },
    { key: 'growth',      label: 'Growth',      color: '#276749' },
    { key: 'bonds',       label: 'Bonos',       color: '#C9A84C' },
    { key: 'disruptivas', label: 'Disruptivas', color: '#8E44AD' },
  ].filter(item => parseInt(allocation[item.key]) > 0);
  const total = items.reduce((s, i) => s + parseInt(allocation[i.key] || 0), 0);

  return (
    <div className="alloc-bar-wrap">
      <div className="alloc-bar">
        {items.map(item => (
          <div
            key={item.key}
            className="alloc-bar-seg"
            style={{ width: `${(parseInt(allocation[item.key]) / total) * 100}%`, background: item.color }}
            title={`${item.label}: ${allocation[item.key]}%`}
          />
        ))}
      </div>
      <div className="alloc-bar-labels">
        {items.map(item => (
          <span key={item.key} className="alloc-bar-lbl">
            <span className="alloc-dot" style={{ background: item.color }} />
            {item.label} {allocation[item.key]}%
          </span>
        ))}
      </div>
    </div>
  );
};

/* ── Main Component ── */
const PortfolioBuilder = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    amount: 10000,
    horizon: 'largo',
    allocation: { bonds: 20, value: 50, growth: 20, disruptivas: 10 }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [portfolioValue, setPortfolioValue] = useState(null);
  const [portfolioGrowth, setPortfolioGrowth] = useState(null);
  const [portfolioBonds, setPortfolioBonds] = useState(null);
  const [portfolioDisruptivas, setPortfolioDisruptivas] = useState(null);
  const [finalPortfolio, setFinalPortfolio] = useState(null);
  const [analysisClaude, setAnalysisClaude] = useState('');
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('portfolio');
  const [dataSource, setDataSource] = useState(null); // 'perplexity' | 'yfinance' | null

  const BASE_URL = process.env.REACT_APP_BACKEND_URL || 'https://value-investing-5b425882ff1a.herokuapp.com';

  const handleFormChange = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));
  const handleAllocationChange = (type, value) =>
    setFormData(prev => ({ ...prev, allocation: { ...prev.allocation, [type]: value } }));

  const totalAllocation = Object.values(formData.allocation).reduce((s, v) => s + parseInt(v || 0), 0);
  const allocationValid = totalAllocation === 100;

  /* Fetch functions */
  const fetchCategory = async (category, amount, setter, nextStep) => {
    setLoading(true); setError('');
    try {
      const resp = await fetch(`${BASE_URL}/api/portfolio/${category}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount })
      });
      if (!resp.ok) throw new Error(await resp.text());
      const data = await resp.json();
      setter(data);
      // Track data source (perplexity or yfinance fallback)
      if (data.source) setDataSource(data.source);
      if (nextStep) setStep(nextStep);
    } catch (err) {
      setError(err.message || `Error al buscar ${category}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchValue = () => fetchCategory(
    'value',
    parseFloat(formData.amount) * (parseInt(formData.allocation.value) / 100),
    setPortfolioValue, 4
  );
  const fetchGrowth = () => fetchCategory(
    'growth',
    parseFloat(formData.amount) * (parseInt(formData.allocation.growth) / 100),
    setPortfolioGrowth, 5
  );
  const fetchBonds = () => fetchCategory(
    'bonds',
    parseFloat(formData.amount) * (parseInt(formData.allocation.bonds) / 100),
    setPortfolioBonds, 7
  );
  const fetchDisruptivas = () => fetchCategory(
    'disruptive',
    parseFloat(formData.amount) * (parseInt(formData.allocation.disruptivas) / 100),
    setPortfolioDisruptivas, 6
  );

  /* Assemble final portfolio */
  useEffect(() => {
    if (step === 6) {
      const allocation = {};
      if (portfolioValue?.allocation) allocation.value = portfolioValue.allocation;
      if (portfolioGrowth?.allocation) allocation.growth = portfolioGrowth.allocation;
      if (portfolioBonds?.allocation) allocation.bonds = portfolioBonds.allocation;
      if (portfolioDisruptivas?.allocation) allocation.disruptivas = portfolioDisruptivas.allocation;
      setFinalPortfolio({ allocation, metrics: {}, source: 'combinado' });
    }
  }, [step, portfolioValue, portfolioGrowth, portfolioBonds, portfolioDisruptivas]);

  /* Claude analysis — triggered manually only to avoid Heroku 30s timeout */
  const fetchClaudeAnalysis = async (portfolio) => {
    setAnalysisLoading(true); setAnalysisClaude('');
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 55000);
      const resp = await fetch(`${BASE_URL}/api/portfolio/claude-analysis`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ portfolio }),
        signal: controller.signal,
      });
      clearTimeout(timer);
      if (!resp.ok) throw new Error(await resp.text());
      const data = await resp.json();
      setAnalysisClaude(data.analysis || '[Sin respuesta]');
    } catch (err) {
      if (err.name === 'AbortError') {
        setAnalysisClaude('⏱ El análisis tardó demasiado. Intenta de nuevo.');
      } else {
        setAnalysisClaude(`Error: ${err.message}`);
      }
    } finally {
      setAnalysisLoading(false);
    }
  };

  /* ── Render ── */
  return (
    <div className="pb-root">
      {/* Step Indicator */}
      <div className="pb-stepper-card">
        <StepIndicator current={step} />
      </div>

      {/* ── STEP 1: Profile ── */}
      {step === 1 && (
        <div className="pb-card pb-step-enter">
          <div className="pb-card-header">
            <div className="pb-step-badge">01</div>
            <div>
              <h2 className="pb-card-title">Perfil de Inversión</h2>
              <p className="pb-card-subtitle">Define tu capital inicial y horizonte temporal</p>
            </div>
          </div>

          <div className="pb-fields">
            <div className="pb-field-group">
              <label className="pb-label">Capital a Invertir (USD/EUR)</label>
              <div className="pb-input-wrap">
                <span className="pb-input-prefix">$</span>
                <input
                  className="pb-input pb-input-amount"
                  type="number"
                  min="1000"
                  step="500"
                  value={formData.amount}
                  onChange={e => handleFormChange('amount', e.target.value)}
                />
              </div>
              <span className="pb-hint">Mínimo recomendado: $5,000</span>
            </div>

            <div className="pb-field-group">
              <label className="pb-label">Horizonte Temporal</label>
              <div className="pb-horizon-options">
                {[
                  { value: 'corto', label: 'Corto Plazo', sub: '< 5 años', icon: '⚡' },
                  { value: 'intermedio', label: 'Intermedio', sub: '5-10 años', icon: '📈' },
                  { value: 'largo', label: 'Largo Plazo', sub: '> 10 años', icon: '🏆' },
                ].map(opt => (
                  <div
                    key={opt.value}
                    className={`pb-horizon-card ${formData.horizon === opt.value ? 'active' : ''}`}
                    onClick={() => handleFormChange('horizon', opt.value)}
                  >
                    <span className="pb-horizon-icon">{opt.icon}</span>
                    <span className="pb-horizon-label">{opt.label}</span>
                    <span className="pb-horizon-sub">{opt.sub}</span>
                  </div>
                ))}
              </div>
              <p className="pb-hint">
                {formData.horizon === 'largo'
                  ? '✓ Buffett recomendado: "Mi periodo de tenencia favorito es forever"'
                  : formData.horizon === 'intermedio'
                  ? 'Permite aprovechar ciclos de mercado y compounding'
                  : '⚠ Horizonte corto: mayor riesgo, menor potencial de value investing'}
              </p>
            </div>
          </div>

          <div className="pb-actions">
            <button className="pb-btn pb-btn-primary" onClick={() => setStep(2)}>
              Continuar <span>→</span>
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 2: Allocation ── */}
      {step === 2 && (
        <div className="pb-card pb-step-enter">
          <div className="pb-card-header">
            <div className="pb-step-badge">02</div>
            <div>
              <h2 className="pb-card-title">Asignación Estratégica</h2>
              <p className="pb-card-subtitle">Define el peso de cada categoría (debe sumar 100%)</p>
            </div>
          </div>

          <div className="pb-allocation-grid">
            {[
              { key: 'value',       label: 'Value',       icon: '🏰', color: '#1B4F72',
                desc: 'Empresas de calidad a precio razonable. Moat + ROIC > WACC' },
              { key: 'growth',      label: 'Growth',      icon: '🚀', color: '#276749',
                desc: 'Small/micro caps con alto crecimiento de ingresos (CAGR > 15%)' },
              { key: 'bonds',       label: 'Bonos/ETFs',  icon: '🛡', color: '#C9A84C',
                desc: 'Protección y estabilidad. Correlación negativa con renta variable' },
              { key: 'disruptivas', label: 'Disruptivas', icon: '⚡', color: '#8E44AD',
                desc: 'ETFs temáticos de IA, robótica y tecnología emergente' },
            ].map(item => (
              <div key={item.key} className="pb-alloc-card" style={{ borderTopColor: item.color }}>
                <div className="pb-alloc-header">
                  <span className="pb-alloc-icon">{item.icon}</span>
                  <span className="pb-alloc-label">{item.label}</span>
                  <div className="pb-alloc-input-wrap">
                    <input
                      type="number" min="0" max="100"
                      className="pb-alloc-input"
                      value={formData.allocation[item.key]}
                      onChange={e => handleAllocationChange(item.key, e.target.value)}
                    />
                    <span className="pb-alloc-pct">%</span>
                  </div>
                </div>
                <p className="pb-alloc-desc">{item.desc}</p>
                <div className="pb-alloc-amount">
                  ${(parseFloat(formData.amount) * parseInt(formData.allocation[item.key] || 0) / 100).toLocaleString('es', { maximumFractionDigits: 0 })}
                </div>
              </div>
            ))}
          </div>

          {/* Total indicator */}
          <div className={`pb-total-bar ${allocationValid ? 'valid' : totalAllocation > 100 ? 'over' : 'under'}`}>
            <span>Total asignado:</span>
            <strong>{totalAllocation}%</strong>
            {allocationValid
              ? <span className="pb-total-ok">✓ Perfecto</span>
              : <span className="pb-total-err">{totalAllocation > 100 ? 'Excede 100%' : `Falta ${100 - totalAllocation}%`}</span>}
          </div>

          <AllocationBar allocation={formData.allocation} />

          <div className="pb-actions">
            <button className="pb-btn pb-btn-ghost" onClick={() => setStep(1)}>← Atrás</button>
            <button
              className="pb-btn pb-btn-primary"
              onClick={() => setStep(3)}
              disabled={!allocationValid}
            >
              Construir Portafolio <span>→</span>
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 3: Value ── */}
      {step === 3 && (
        <div className="pb-card pb-step-enter">
          <div className="pb-card-header">
            <div className="pb-step-badge" style={{ background: '#1B4F72' }}>03</div>
            <div>
              <h2 className="pb-card-title">Acciones Value 🏰</h2>
              <p className="pb-card-subtitle">
                Large/mega caps con ROE &gt; 12%, P/E &lt; 18, moat fuerte y ROIC &gt; WACC
              </p>
            </div>
          </div>
          <div className="pb-fetch-info">
            <div className="pb-fetch-stat">
              <span className="pb-fetch-val">${(parseFloat(formData.amount) * parseInt(formData.allocation.value) / 100).toLocaleString()}</span>
              <span className="pb-fetch-lbl">a invertir en Value</span>
            </div>
            <div className="pb-fetch-stat">
              <span className="pb-fetch-val">{formData.allocation.value}%</span>
              <span className="pb-fetch-lbl">del portafolio</span>
            </div>
          </div>
          <button onClick={fetchValue} disabled={loading} className="pb-btn pb-btn-primary pb-btn-full">
            {loading ? <><div className="pb-spinner" /> Consultando Perplexity AI…</> : '🔍 Buscar Acciones Value'}
          </button>
          {portfolioValue && (
            <div className="pb-success-box">
              <span>✓ {portfolioValue.sourceCount || portfolioValue.allocation?.length || '?'} acciones value encontradas</span>
              <div className="pb-actions" style={{ marginTop: 16 }}>
                <button className="pb-btn pb-btn-ghost" onClick={() => setStep(2)}>← Modificar</button>
                {parseInt(formData.allocation.growth) > 0
                  ? <button className="pb-btn pb-btn-primary" onClick={() => setStep(4)}>Buscar Growth →</button>
                  : parseInt(formData.allocation.bonds) > 0
                  ? <button className="pb-btn pb-btn-primary" onClick={() => setStep(5)}>Buscar Bonos →</button>
                  : <button className="pb-btn pb-btn-primary" onClick={() => setStep(6)}>Ver Análisis →</button>
                }
              </div>
            </div>
          )}
          {error && <div className="pb-error">{error}</div>}
        </div>
      )}

      {/* ── STEP 4: Growth ── */}
      {step === 4 && (
        <div className="pb-card pb-step-enter">
          <div className="pb-card-header">
            <div className="pb-step-badge" style={{ background: '#276749' }}>04</div>
            <div>
              <h2 className="pb-card-title">Acciones Growth 🚀</h2>
              <p className="pb-card-subtitle">
                Small/micro caps con beta 1.2-1.4 y CAGR de ingresos &gt; 15%
              </p>
            </div>
          </div>
          <div className="pb-fetch-info">
            <div className="pb-fetch-stat">
              <span className="pb-fetch-val">${(parseFloat(formData.amount) * parseInt(formData.allocation.growth) / 100).toLocaleString()}</span>
              <span className="pb-fetch-lbl">a invertir en Growth</span>
            </div>
          </div>
          <button onClick={fetchGrowth} disabled={loading} className="pb-btn pb-btn-primary pb-btn-full">
            {loading ? <><div className="pb-spinner" /> Consultando Perplexity AI…</> : '🔍 Buscar Acciones Growth'}
          </button>
          {portfolioGrowth && (
            <div className="pb-success-box">
              <span>✓ Acciones growth encontradas</span>
              <div className="pb-actions" style={{ marginTop: 16 }}>
                <button className="pb-btn pb-btn-ghost" onClick={() => setStep(3)}>← Atrás</button>
                {parseInt(formData.allocation.bonds) > 0
                  ? <button className="pb-btn pb-btn-primary" onClick={() => setStep(5)}>Buscar Bonos →</button>
                  : parseInt(formData.allocation.disruptivas) > 0
                  ? <button className="pb-btn pb-btn-primary" onClick={() => setStep(7)}>Buscar Disruptivas →</button>
                  : <button className="pb-btn pb-btn-primary" onClick={() => setStep(6)}>Ver Análisis →</button>
                }
              </div>
            </div>
          )}
          {error && <div className="pb-error">{error}</div>}
        </div>
      )}

      {/* ── STEP 5: Bonds ── */}
      {step === 5 && (
        <div className="pb-card pb-step-enter">
          <div className="pb-card-header">
            <div className="pb-step-badge" style={{ background: '#C9A84C' }}>05</div>
            <div>
              <h2 className="pb-card-title">Bonos y ETFs Renta Fija 🛡</h2>
              <p className="pb-card-subtitle">
                ETFs de bonos gubernamentales y corporativos para estabilizar el portafolio
              </p>
            </div>
          </div>
          <div className="pb-fetch-info">
            <div className="pb-fetch-stat">
              <span className="pb-fetch-val">${(parseFloat(formData.amount) * parseInt(formData.allocation.bonds) / 100).toLocaleString()}</span>
              <span className="pb-fetch-lbl">a invertir en Bonos</span>
            </div>
          </div>
          <button onClick={fetchBonds} disabled={loading} className="pb-btn pb-btn-primary pb-btn-full">
            {loading ? <><div className="pb-spinner" /> Consultando Perplexity AI…</> : '🔍 Buscar Bonos/ETFs'}
          </button>
          {portfolioBonds && (
            <div className="pb-success-box">
              <span>✓ ETFs de bonos encontrados</span>
              <div className="pb-actions" style={{ marginTop: 16 }}>
                <button className="pb-btn pb-btn-ghost" onClick={() => setStep(4)}>← Atrás</button>
                {parseInt(formData.allocation.disruptivas) > 0
                  ? <button className="pb-btn pb-btn-primary" onClick={() => setStep(7)}>Buscar Disruptivas →</button>
                  : <button className="pb-btn pb-btn-primary" onClick={() => setStep(6)}>Ver Análisis →</button>
                }
              </div>
            </div>
          )}
          {error && <div className="pb-error">{error}</div>}
        </div>
      )}

      {/* ── STEP 7: Disruptivas (internal step) ── */}
      {step === 7 && (
        <div className="pb-card pb-step-enter">
          <div className="pb-card-header">
            <div className="pb-step-badge" style={{ background: '#8E44AD' }}>06</div>
            <div>
              <h2 className="pb-card-title">ETFs Disruptivos ⚡</h2>
              <p className="pb-card-subtitle">
                IA, robótica, semiconductores y tecnologías emergentes
              </p>
            </div>
          </div>
          <div className="pb-fetch-info">
            <div className="pb-fetch-stat">
              <span className="pb-fetch-val">${(parseFloat(formData.amount) * parseInt(formData.allocation.disruptivas) / 100).toLocaleString()}</span>
              <span className="pb-fetch-lbl">en ETFs disruptivos</span>
            </div>
          </div>
          <button onClick={fetchDisruptivas} disabled={loading} className="pb-btn pb-btn-primary pb-btn-full">
            {loading ? <><div className="pb-spinner" /> Consultando Perplexity AI…</> : '🔍 Buscar ETFs Disruptivos'}
          </button>
          {portfolioDisruptivas && (
            <div className="pb-success-box">
              <span>✓ ETFs disruptivos encontrados</span>
              <div className="pb-actions" style={{ marginTop: 16 }}>
                <button className="pb-btn pb-btn-ghost" onClick={() => setStep(5)}>← Atrás</button>
                <button className="pb-btn pb-btn-primary" onClick={() => setStep(6)}>
                  Ver Análisis Completo →
                </button>
              </div>
            </div>
          )}
          {error && <div className="pb-error">{error}</div>}
        </div>
      )}

      {/* ── STEP 6: Final Analysis ── */}
      {step === 6 && finalPortfolio && (
        <div className="pb-final">

          {/* Data source banner */}
          {dataSource === 'yfinance' && (
            <div className="pb-source-banner">
              <span>📊</span>
              <span>Datos en tiempo real vía <strong>Yahoo Finance</strong> (yfinance). La clave de Perplexity AI está vencida — renuévala en <a href="https://www.perplexity.ai/settings/api" target="_blank" rel="noreferrer">perplexity.ai/settings/api</a> y actualiza tu <code>.env</code>.</span>
            </div>
          )}
          {dataSource === 'perplexity' && (
            <div className="pb-source-banner pb-source-ok">
              <span>✓</span>
              <span>Datos y recomendaciones por <strong>Perplexity AI</strong> (sonar-pro)</span>
            </div>
          )}

          {/* Tab Navigation */}
          <div className="pb-tabs">
            {[
              { id: 'portfolio',   label: '📊 Portafolio' },
              { id: 'history',     label: '📈 Rendimiento' },
              { id: 'worksheet',   label: '📋 Worksheet' },
              { id: 'damodaran',   label: '📐 Damodaran' },
              { id: 'analysis',    label: '🔍 Análisis por Acción' },
              { id: 'methodology', label: '📚 Metodología' },
            ].map(tab => (
              <button
                key={tab.id}
                className={`pb-tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="pb-tab-content">

            {activeTab === 'portfolio' && (
              <PortfolioResults portfolio={finalPortfolio} amount={formData.amount} />
            )}

            {activeTab === 'history' && (
              <HistoricalPerformance portfolio={finalPortfolio} baseUrl={BASE_URL} />
            )}

            {activeTab === 'worksheet' && (
              <DamodaranWorksheet portfolio={finalPortfolio} />
            )}

            {activeTab === 'damodaran' && (
              <DamodaranPanel portfolio={finalPortfolio} />
            )}

            {activeTab === 'analysis' && (
              <div className="pb-analysis-tab">
                {/* Per-stock deep analysis — instant, no API needed */}
                <StockDeepAnalysis portfolio={finalPortfolio} />

                {/* Optional Claude text summary — manually triggered */}
                <div className="pb-claude-section">
                  <div className="pb-claude-section-header">
                    <span className="pb-analysis-badge">IA · Claude Sonnet</span>
                    <h3>Resumen del Portafolio con IA</h3>
                    <p>Análisis narrativo combinado Damodaran + Buffett/Munger</p>
                  </div>
                  {analysisLoading ? (
                    <div className="pb-analysis-loading">
                      <div className="pb-spinner pb-spinner-lg" />
                      <div>
                        <p>Generando resumen con Claude…</p>
                        <p className="pb-analysis-sub">Puede tardar hasta 40 segundos</p>
                      </div>
                    </div>
                  ) : analysisClaude ? (
                    <div className="pb-analysis-content">
                      <ClaudeAnalysisMarkdown markdown={analysisClaude} />
                      <button
                        className="pb-btn pb-btn-ghost pb-btn-sm"
                        onClick={() => fetchClaudeAnalysis(finalPortfolio)}
                        style={{ marginTop: 16 }}
                      >
                        ↺ Regenerar resumen IA
                      </button>
                    </div>
                  ) : (
                    <div className="pb-claude-prompt">
                      <p>Genera un resumen narrativo del portafolio completo usando IA.</p>
                      <button
                        className="pb-btn pb-btn-primary"
                        onClick={() => fetchClaudeAnalysis(finalPortfolio)}
                      >
                        🤖 Generar Resumen IA
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'methodology' && (
              <MethodologyDoc />
            )}
          </div>

          {/* Footer actions */}
          <div className="pb-final-actions">
            <button className="pb-btn pb-btn-ghost" onClick={() => setStep(2)}>
              ← Modificar Asignación
            </button>
            <button className="pb-btn pb-btn-ghost" onClick={() => window.location.reload()}>
              ↺ Nuevo Portafolio
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PortfolioBuilder;
