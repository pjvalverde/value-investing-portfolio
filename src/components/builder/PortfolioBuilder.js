import React, { useState } from 'react';
import AllocationStepper from './AllocationStepper';
import PortfolioResults from './PortfolioResults';
import './PortfolioBuilder.css';

const PortfolioBuilder = () => {
  const [analysisClaude, setAnalysisClaude] = useState('');
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    amount: 10000,
    horizon: 'largo',
    allocation: {
      bonds: 25,
      value: 50,
      growth: 25
    }
  });
  const [portfolio, setPortfolio] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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

  const handleOptimize = async () => {
    setLoading(true);
    setError('');

    try {
      // Usar la variable de entorno REACT_APP_BACKEND_URL
      const BASE_URL = 'https://value-investing-5b425882ff1a.herokuapp.com';
      console.log('Usando backend URL:', BASE_URL);
      
      // Asegurar que la asignación tenga valores numéricos
      const target_alloc = {
        value: parseInt(formData.allocation.value),
        growth: parseInt(formData.allocation.growth),
        bonds: parseInt(formData.allocation.bonds)
      };
      
      const amount = parseFloat(formData.amount);
      console.log('Enviando datos:', { amount, target_alloc });

      const response = await fetch(`${BASE_URL}/api/portfolio/optimize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          amount: amount,
          target_alloc: target_alloc
        })
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('Error respuesta:', response.status, errorData);
        throw new Error(`Error al optimizar el portfolio: ${response.status} ${errorData}`);
      }

      const data = await response.json();
      console.log('Respuesta recibida:', data);
      setPortfolio(data);
      setStep(3); // Avanzar al paso de resultados
      setAnalysisClaude(''); // Limpiar análisis anterior
    } catch (err) {
      console.error('Error completo:', err);
      setError(err.message || 'Error desconocido al optimizar el portfolio');
    } finally {
      setLoading(false);
    }
  };

  // Llamar análisis Claude cuando el portfolio cambia y estamos en el paso 3
  React.useEffect(() => {
    const fetchClaudeAnalysis = async () => {
      if (step === 3 && portfolio) {
        setAnalysisLoading(true);
        setAnalysisClaude('');
        try {
          const BASE_URL = 'https://value-investing-5b425882ff1a.herokuapp.com';
          const response = await fetch(`${BASE_URL}/api/portfolio/analysis`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ portfolio })
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
    // Solo dispara cuando cambia portfolio o step
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [portfolio, step]);

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
                onClick={() => handleStepChange(1)}
              >
                Atrás
              </button>

              <button
                className="optimize-button"
                onClick={handleOptimize}
                disabled={loading}
              >
                {loading ? 'Optimizando...' : 'Optimizar Portfolio'}
              </button>
            </div>

            {error && <div className="error-message">{error}</div>}
          </div>
        )}

        {step === 3 && portfolio && (
          <div className="step-container">
            <h2>Tu Portfolio Optimizado</h2>

            {/* DEBUG: Mostrar el JSON recibido del backend */}
            <pre style={{background:'#f8f8f8', fontSize:12, padding:8, borderRadius:6, marginBottom:12, overflowX:'auto'}}>
              <b>DEBUG portfolio:</b> {JSON.stringify(portfolio, null, 2)}
            </pre>

            {/* Mensaje si allocation está vacío */}
            {Array.isArray(portfolio.allocation) && portfolio.allocation.length === 0 && (
              <div style={{color:'red',marginBottom:10}}>
                ⚠️ El backend devolvió allocation vacío. No hay posiciones para mostrar.
              </div>
            )}
            {/* Mensaje si metrics está vacío */}
            {portfolio.metrics && Object.keys(portfolio.metrics).length === 0 && (
              <div style={{color:'orange',marginBottom:10}}>
                ⚠️ El backend devolvió metrics vacío.
              </div>
            )}

            {/* Análisis de Claude */}
            {analysisLoading ? (
              <div style={{margin:'12px 0',color:'#3b5998'}}>Generando análisis cualitativo con Claude...</div>
            ) : analysisClaude ? (
              <div style={{margin:'12px 0',background:'#f6f8fa',padding:12,borderRadius:6}}>
                <b>Análisis Claude:</b>
                <div dangerouslySetInnerHTML={{ __html: analysisClaude }} />
              </div>
            ) : null}

            <PortfolioResults
              portfolio={portfolio}
              amount={formData.amount}
            />

            <div className="buttons-container">
              <button
                className="back-button"
                onClick={() => handleStepChange(2)}
              >
                Modificar Asignación
              </button>

              <button
                className="save-button"
                onClick={() => alert('Funcionalidad de guardar portfolio en desarrollo')}
              >
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
