import React, { useState, useEffect } from 'react';
import PortfolioResults from './PortfolioResults';
import './PortfolioBuilder.css';

const PortfolioBuilder = () => {
  const [step, setStep] = useState(1); // 1=perfil, 2=asignación, 3=value, 4=growth, 5=bonos, 6=final
  const [formData, setFormData] = useState({
    amount: 10000,
    horizon: 'largo',
    allocation: {
      bonds: 20,
      value: 30,
      growth: 30,
      disruptive: 20
    }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [portfolioValue, setPortfolioValue] = useState(null);
  const [portfolioGrowth, setPortfolioGrowth] = useState(null);
  const [portfolioBonds, setPortfolioBonds] = useState(null);
  const [portfolioDisruptive, setPortfolioDisruptive] = useState(null);
  const [finalPortfolio, setFinalPortfolio] = useState(null);
  const [analysisClaude, setAnalysisClaude] = useState('');
  const [analysisLoading, setAnalysisLoading] = useState(false);

  const BASE_URL = process.env.REACT_APP_BACKEND_URL || 'https://value-investing-5b425882ff1a.herokuapp.com';

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

  // Paso 5: Buscar Disruptivas
  const fetchDisruptive = async () => {
    setLoading(true); setError('');
    try {
      const amount = parseFloat(formData.amount) * (parseInt(formData.allocation.disruptive) / 100);
      const response = await fetch(`${BASE_URL}/api/portfolio/disruptive`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount })
      });
      if (!response.ok) throw new Error(await response.text());
      setPortfolioDisruptive(await response.json());
      setStep(6); // Paso final: análisis Claude
    } catch (err) {
      setError(err.message || 'Error al buscar Disruptivas');
    } finally {
      setLoading(false);
    }
  };

  // Paso 6: Buscar Bonos
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
  useEffect(() => {
    if (step === 7) {
      let allocation = {};
      if (portfolioValue && portfolioValue.allocation) allocation.value = portfolioValue.allocation;
      if (portfolioGrowth && portfolioGrowth.allocation) allocation.growth = portfolioGrowth.allocation;
      if (portfolioBonds && portfolioBonds.allocation) allocation.bonds = portfolioBonds.allocation;
      if (portfolioDisruptive && portfolioDisruptive.allocation) allocation.disruptive = portfolioDisruptive.allocation;
      const final = {
        allocation,
        metrics: {},
        source: 'combinado',
      };
      setFinalPortfolio(final);
    }
    // eslint-disable-next-line
  }, [step]);

  // Análisis Claude
  const fetchClaudeAnalysis = async () => {
    setAnalysisLoading(true);
    setAnalysisClaude('');
    try {
      const response = await fetch(`${BASE_URL}/api/portfolio/claude-analysis`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ portfolio: finalPortfolio })
      });
      if (!response.ok) throw new Error(await response.text());
      const data = await response.json();
      setAnalysisClaude(data.analysis || '[Sin respuesta de Claude]');
    } catch (err) {
      setAnalysisClaude(`<span style='color:red'>${err.message}</span>`);
    } finally {
      setAnalysisLoading(false);
    }
  };

  useEffect(() => {
    if (step === 6 && finalPortfolio) {
      fetchClaudeAnalysis();
    }
    // eslint-disable-next-line
  }, [step, finalPortfolio]);

  return (
    <div className="portfolio-builder">
      {step === 1 && (
        <div className="step-container">
          <h2>Paso 1: Perfil de Inversión</h2>
          <label>Monto a invertir: <input type="number" value={formData.amount} onChange={e => handleFormChange('amount', e.target.value)} /></label>
          <label>Horizonte:
            <select value={formData.horizon} onChange={e => handleFormChange('horizon', e.target.value)}>
              <option value="corto">Corto (&lt;5 años)</option>
              <option value="intermedio">Intermedio (5-10 años)</option>
              <option value="largo">Largo (&gt;10 años)</option>
            </select>
          </label>
          <button onClick={() => setStep(2)} className="optimize-button">Siguiente</button>
        </div>
      )}
      {step === 2 && (
        <div className="step-container">
          <h2>Paso 2: Asignación Estratégica</h2>
          <label>Value %: <input type="number" value={formData.allocation.value} onChange={e => handleAllocationChange('value', e.target.value)} /></label>
          <label>Growth %: <input type="number" value={formData.allocation.growth} onChange={e => handleAllocationChange('growth', e.target.value)} /></label>
          <label>Bonds %: <input type="number" value={formData.allocation.bonds} onChange={e => handleAllocationChange('bonds', e.target.value)} /></label>
          <label>Disruptivas %: <input type="number" value={formData.allocation.disruptive} onChange={e => handleAllocationChange('disruptive', e.target.value)} /></label>
          <button onClick={() => setStep(3)} className="optimize-button">Siguiente</button>
        </div>
      )}
      {step === 3 && (
        <div className="step-container">
          <h2>Paso 3: Buscar Acciones Value</h2>
          <button onClick={fetchValue} disabled={loading} className="optimize-button">
            {loading ? 'Buscando Value...' : 'Buscar Value'}
          </button>
          {portfolioValue && (
            <div>
              <p>¿Quieres agregar acciones Growth?</p>
              <button onClick={() => setStep(4)} className="optimize-button">Sí, agregar Growth</button>
              <button onClick={() => setStep(5)} className="back-button">No, ir a Disruptivas</button>
            </div>
          )}
          {error && <div className="error-message">{error}</div>}
        </div>
      )}
      {step === 4 && (
        <div className="step-container">
          <h2>Paso 4: Buscar Acciones Growth</h2>
          <button onClick={fetchGrowth} disabled={loading} className="optimize-button">
            {loading ? 'Buscando Growth...' : 'Buscar Growth'}
          </button>
          {portfolioGrowth && (
            <div>
              <p>¿Quieres agregar Disruptivas?</p>
              <button onClick={() => setStep(5)} className="optimize-button">Sí, agregar Disruptivas</button>
              <button onClick={() => setStep(6)} className="back-button">No, ir a Bonos/ETFs</button>
            </div>
          )}
          {error && <div className="error-message">{error}</div>}
        </div>
      )}
      {step === 5 && (
        <div className="step-container">
          <h2>Paso 5: Buscar Disruptivas</h2>
          <button onClick={fetchDisruptive} disabled={loading} className="optimize-button">
            {loading ? 'Buscando Disruptivas...' : 'Buscar Disruptivas'}
          </button>
          {portfolioDisruptive && (
            <div>
              <p>¿Quieres agregar Bonos/ETFs?</p>
              <button onClick={() => setStep(6)} className="optimize-button">Sí, agregar Bonos/ETFs</button>
              <button onClick={() => setStep(7)} className="back-button">No, ver análisis final</button>
            </div>
          )}
          {error && <div className="error-message">{error}</div>}
        </div>
      )}
      {step === 6 && (
        <div className="step-container">
          <h2>Paso 6: Buscar Bonos/ETFs</h2>
          <button onClick={fetchBonds} disabled={loading} className="optimize-button">
            {loading ? 'Buscando Bonos/ETFs...' : 'Buscar Bonos/ETFs'}
          </button>
          {portfolioBonds && (
            <div>
              <button onClick={() => setStep(7)} className="optimize-button">Ver análisis final</button>
            </div>
          )}
          {error && <div className="error-message">{error}</div>}
        </div>
      )}
      {step === 7 && finalPortfolio && (
        <div className="step-container">
          <h2>Tu Portafolio Combinado</h2>
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
  );
};

export default PortfolioBuilder;
