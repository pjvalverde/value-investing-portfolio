import React, { useState } from 'react';
import AllocationStepper from './AllocationStepper';
import PortfolioResults from './PortfolioResults';
import './PortfolioBuilder.css';

const PortfolioBuilder = () => {
  const [step, setStep] = useState(1); // 1=perfil, 2=asignación, 3=value, 4=growth, 5=bonos, 6=final
  const [formData, setFormData] = useState({
    amount: 10000,
    horizon: 'largo',
    allocation: {
      bonds: 25,
      value: 50,
      growth: 25
    }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [portfolioValue, setPortfolioValue] = useState(null);
  const [portfolioGrowth, setPortfolioGrowth] = useState(null);
  const [portfolioBonds, setPortfolioBonds] = useState(null);
  const [finalPortfolio, setFinalPortfolio] = useState(null);
  const [analysisClaude, setAnalysisClaude] = useState('');
  const [analysisLoading, setAnalysisLoading] = useState(false);

  const BASE_URL = 'https://value-investing-5b425882ff1a.herokuapp.com';

  const handleStepChange = (newStep) => {
    setStep(newStep);
  };

  const handleFormChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAllocationChange = (type, value) => {
    setFormData(prev => ({
      ...prev,
      allocation: {
        ...prev.allocation,
        [type]: value
      }
    }));
  };

  // Paso 3: Buscar Value
  const fetchValue = async () => {
    setLoading(true); setError('');
    try {
      const amount = parseFloat(formData.amount) * (parseInt(formData.allocation.value) / 100);
      const response = await fetch(`${BASE_URL}/api/portfolio/value`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount })
      });
      if (!response.ok) throw new Error(await response.text());
      setPortfolioValue(await response.json());
      setStep(4); // Preguntar por Growth
    } catch (err) {
      setError(err.message || 'Error al buscar Value');
    } finally {
      setLoading(false);
    }
  };

  // Paso 4: Buscar Growth
  const fetchGrowth = async () => {
    setLoading(true); setError('');
    try {
      const amount = parseFloat(formData.amount) * (parseInt(formData.allocation.growth) / 100);
      const response = await fetch(`${BASE_URL}/api/portfolio/growth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount })
      });
      if (!response.ok) throw new Error(await response.text());
      setPortfolioGrowth(await response.json());
      setStep(5); // Preguntar por Bonos
    } catch (err) {
      setError(err.message || 'Error al buscar Growth');
    } finally {
      setLoading(false);
    }
  };

  // Paso 5: Buscar Bonos
  const fetchBonds = async () => {
    setLoading(true); setError('');
    try {
      const amount = parseFloat(formData.amount) * (parseInt(formData.allocation.bonds) / 100);
      const response = await fetch(`${BASE_URL}/api/portfolio/bonds`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount })
      });
      if (!response.ok) throw new Error(await response.text());
      setPortfolioBonds(await response.json());
      setStep(6); // Paso final: análisis Claude
    } catch (err) {
      setError(err.message || 'Error al buscar Bonos');
    } finally {
      setLoading(false);
    }
  };

  // Paso 6: Ensamblar portafolio final
  const assembleFinalPortfolio = () => {
    let allocation = [];
    if (portfolioValue && portfolioValue.allocation) allocation = allocation.concat(portfolioValue.allocation);
    if (portfolioGrowth && portfolioGrowth.allocation) allocation = allocation.concat(portfolioGrowth.allocation);
    if (portfolioBonds && portfolioBonds.allocation) allocation = allocation.concat(portfolioBonds.allocation);
    const final = {
      allocation,
      metrics: {},
      source: 'combinado',
    };
    setFinalPortfolio(final);
  };

  React.useEffect(() => {
    if (step === 6) {
      assembleFinalPortfolio();
    }
    // eslint-disable-next-line
  }, [step]);

  // Llamar análisis Claude cuando el portafolio final está listo y step es 6
  React.useEffect(() => {
    const fetchClaudeAnalysis = async () => {
      if (step === 6 && finalPortfolio) {
        setAnalysisLoading(true);
        setAnalysisClaude('');
        try {
          const response = await fetch(`${BASE_URL}/api/portfolio/analysis`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ portfolio: finalPortfolio })
          });
          if (!response.ok) {
            const errorData = await response.text();
            throw new Error(`Error Claude: ${response.status} ${errorData}`);
          }
          const data = await response.json();
          setAnalysisClaude(data.analysis || 'No se pudo generar el análisis.');
        } catch (err) {
          setAnalysisClaude(`<span style='color:red'>${err.message}</span>`);
        } finally {
          setAnalysisLoading(false);
        }
      }
    };
    fetchClaudeAnalysis();
    // eslint-disable-next-line
  }, [finalPortfolio, step]);

  return (
    <div className="portfolio-builder-container">
      <h1>Portfolio Builder</h1>
      <p className="subtitle">Construye tu portfolio optimizado basado en estrategias de Value Investing</p>

      <div className="builder-content">
        {step === 1 && (
          <div className="step-container">
            <h2>Paso 1: Define tu horizonte y monto</h2>
            <div className="form-group">
              <label>Monto a invertir ($)</label>
              <input
                type="number"
                value={formData.amount}
                onChange={(e) => handleFormChange('amount', e.target.value)}
                min="1000"
                step="1000"
              />
            </div>

            <div className="form-group">
              <label>Horizonte de inversión</label>
              <div className="radio-group">
                <label>
                  <input
                    type="radio"
                    name="horizon"
                    value="corto"
                    checked={formData.horizon === 'corto'}
                    onChange={() => handleFormChange('horizon', 'corto')}
                  />
                  Corto plazo (&lt;5 años)
                </label>

                <label>
                  <input
                    type="radio"
                    name="horizon"
                    value="intermedio"
                    checked={formData.horizon === 'intermedio'}
                    onChange={() => handleFormChange('horizon', 'intermedio')}
                  />
                  Mediano plazo (5-10 años)
                </label>

                <label>
                  <input
                    type="radio"
                    name="horizon"
                    value="largo"
                    checked={formData.horizon === 'largo'}
                    onChange={() => handleFormChange('horizon', 'largo')}
                  />
                  Largo plazo (&gt;10 años)
                </label>
              </div>
            </div>

            <button
              className="next-button"
              onClick={() => handleStepChange(2)}
            >
              Continuar
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="step-container">
            <h2>Paso 2: Asignación de activos</h2>
            <p>Distribuye tu inversión entre las diferentes estrategias (total debe sumar 100%)</p>

            <AllocationStepper
              allocation={formData.allocation}
              onChange={handleAllocationChange}
            />

            <div className="buttons-container">
              <button
                className="back-button"
                onClick={() => setStep(1)}
              >
                Atrás
              </button>
              <button
                className="optimize-button"
                onClick={() => setStep(3)}
                disabled={loading}
              >
                Continuar
              </button>
            </div>
            {error && <div className="error-message">{error}</div>}
          </div>
        )}

        {/* Paso 3: Buscar Value */}
        {step === 3 && (
          <div className="step-container">
            <h2>Paso 3: Buscar Acciones Value</h2>
            <button onClick={fetchValue} disabled={loading} className="optimize-button">
              {loading ? 'Buscando Value...' : 'Buscar Value'}
            </button>
            {portfolioValue && (
              <pre style={{background:'#f8f8f8', fontSize:12, padding:8, borderRadius:6, marginTop:12}}>
                <b>Resultados Value:</b> {JSON.stringify(portfolioValue, null, 2)}
              </pre>
            )}
            {portfolioValue && (
              <div>
                <p>¿Quieres agregar acciones Growth?</p>
                <button onClick={() => setStep(4)} className="optimize-button">Sí, agregar Growth</button>
                <button onClick={() => setStep(5)} className="back-button">No, ir a Bonos/ETFs</button>
              </div>
            )}
            {error && <div className="error-message">{error}</div>}
          </div>
        )}

        {/* Paso 4: Buscar Growth */}
        {step === 4 && (
          <div className="step-container">
            <h2>Paso 4: Buscar Acciones Growth</h2>
            <button onClick={fetchGrowth} disabled={loading} className="optimize-button">
              {loading ? 'Buscando Growth...' : 'Buscar Growth'}
            </button>
            {portfolioGrowth && (
              <pre style={{background:'#f8f8f8', fontSize:12, padding:8, borderRadius:6, marginTop:12}}>
                <b>Resultados Growth:</b> {JSON.stringify(portfolioGrowth, null, 2)}
              </pre>
            )}
            {portfolioGrowth && (
              <div>
                <p>¿Quieres agregar Bonos/ETFs?</p>
                <button onClick={() => setStep(5)} className="optimize-button">Sí, agregar Bonos/ETFs</button>
                <button onClick={() => setStep(6)} className="back-button">No, ver análisis final</button>
              </div>
            )}
            {error && <div className="error-message">{error}</div>}
          </div>
        )}

        {/* Paso 5: Buscar Bonos/ETFs */}
        {step === 5 && (
          <div className="step-container">
            <h2>Paso 5: Buscar Bonos/ETFs</h2>
            <button onClick={fetchBonds} disabled={loading} className="optimize-button">
              {loading ? 'Buscando Bonos/ETFs...' : 'Buscar Bonos/ETFs'}
            </button>
            {portfolioBonds && (
              <pre style={{background:'#f8f8f8', fontSize:12, padding:8, borderRadius:6, marginTop:12}}>
                <b>Resultados Bonos/ETFs:</b> {JSON.stringify(portfolioBonds, null, 2)}
              </pre>
            )}
            {portfolioBonds && (
              <div>
                <button onClick={() => setStep(6)} className="optimize-button">Ver análisis final</button>
              </div>
            )}
            {error && <div className="error-message">{error}</div>}
          </div>
        )}

        {/* Paso 6: Portafolio final y análisis Claude */}
        {step === 6 && finalPortfolio && (
          <div className="step-container">
            <h2>Tu Portafolio Combinado</h2>
            {/* Visualización moderna: tabla y gráfico */}
            <PortfolioResults portfolio={finalPortfolio} amount={formData.amount} />
            {analysisLoading ? (
              <div style={{margin:'12px 0',color:'#3b5998'}}>Generando análisis cualitativo con Claude...</div>
            ) : analysisClaude ? (
              <div style={{margin:'12px 0',background:'#f6f8fa',padding:12,borderRadius:6}}>
                <b>Análisis Claude:</b>
                <div dangerouslySetInnerHTML={{ __html: analysisClaude }} />
              </div>
            ) : null}
            <div className="buttons-container">
              <button className="back-button" onClick={() => setStep(2)}>
                Modificar Asignación
              </button>
              <button className="save-button" onClick={() => alert('Funcionalidad de guardar portfolio en desarrollo')}>
                Guardar Portfolio
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PortfolioBuilder;
