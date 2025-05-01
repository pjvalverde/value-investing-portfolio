import React, { useState } from 'react';
import AllocationStepper from './AllocationStepper';
import PortfolioResults from './PortfolioResults';
import './PortfolioBuilder.css';

const PortfolioBuilder = () => {
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
      // Intentar conectarse a Railway y si falla, usar el backend local
      let BASE_URL = 'https://value-investing-backend-production.up.railway.app';
      
      // Opcionalmente, para desarrollo local, puedes descomentar esta línea
      // BASE_URL = 'http://localhost:8000';

      const response = await fetch(`${BASE_URL}/api/portfolio/optimize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          amount: parseFloat(formData.amount),
          target: formData.allocation
        })
      });
      
      if (!response.ok) {
        throw new Error('Error al optimizar el portfolio');
      }
      
      const data = await response.json();
      setPortfolio(data);
      setStep(3); // Avanzar al paso de resultados
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

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
