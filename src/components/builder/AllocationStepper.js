import React, { useState, useEffect } from 'react';
import './AllocationStepper.css';

const AllocationStepper = ({ allocation, onChange }) => {
  const [total, setTotal] = useState(100);
  const [values, setValues] = useState(allocation);

  useEffect(() => {
    // Verificar que los valores sumen 100%
    const sum = Object.values(values).reduce((a, b) => a + b, 0);
    setTotal(sum);
  }, [values]);

  const handleSliderChange = (type, value) => {
    const newValue = parseInt(value, 10);
    
    // Actualizar el valor local
    setValues(prev => ({
      ...prev,
      [type]: newValue
    }));
    
    // Notificar al componente padre
    onChange(type, newValue);
  };

  return (
    <div className="allocation-stepper">
      <div className="allocation-total">
        <span className={total === 100 ? 'valid' : 'invalid'}>
          Total: {total}%
        </span>
        {total !== 100 && (
          <span className="warning">
            (La asignación debe sumar exactamente 100%)
          </span>
        )}
      </div>
      
      <div className="allocation-sliders">
        <div className="allocation-item">
          <div className="allocation-label">
            <span className="allocation-name">Bonos</span>
            <span className="allocation-value">{values.bonds}%</span>
          </div>
          <div className="slider-container">
            <input
              type="range"
              min="0"
              max="100"
              value={values.bonds}
              onChange={(e) => handleSliderChange('bonds', e.target.value)}
              className="slider bonds-slider"
            />
          </div>
          <div className="allocation-description">
            <p>Bonos del Tesoro y ETFs de renta fija para estabilidad</p>
          </div>
        </div>
        
        <div className="allocation-item">
          <div className="allocation-label">
            <span className="allocation-name">Value</span>
            <span className="allocation-value">{values.value}%</span>
          </div>
          <div className="slider-container">
            <input
              type="range"
              min="0"
              max="100"
              value={values.value}
              onChange={(e) => handleSliderChange('value', e.target.value)}
              className="slider value-slider"
            />
          </div>
          <div className="allocation-description">
            <p>Acciones infravaloradas con buenos fundamentales</p>
          </div>
        </div>
        
        <div className="allocation-item">
          <div className="allocation-label">
            <span className="allocation-name">Growth</span>
            <span className="allocation-value">{values.growth}%</span>
          </div>
          <div className="slider-container">
            <input
              type="range"
              min="0"
              max="100"
              value={values.growth}
              onChange={(e) => handleSliderChange('growth', e.target.value)}
              className="slider growth-slider"
            />
          </div>
          <div className="allocation-description">
            <p>Acciones de alto crecimiento con momentum positivo</p>
          </div>
        </div>
      </div>
      
      <div className="allocation-presets">
        <h3>Perfiles predefinidos:</h3>
        <div className="preset-buttons">
          <button 
            onClick={() => {
              const newAllocation = { bonds: 60, value: 30, growth: 10 };
              setValues(newAllocation);
              Object.entries(newAllocation).forEach(([key, value]) => onChange(key, value));
            }}
          >
            Conservador
          </button>
          
          <button 
            onClick={() => {
              const newAllocation = { bonds: 40, value: 40, growth: 20 };
              setValues(newAllocation);
              Object.entries(newAllocation).forEach(([key, value]) => onChange(key, value));
            }}
          >
            Moderado
          </button>
          
          <button 
            onClick={() => {
              const newAllocation = { bonds: 20, value: 40, growth: 40 };
              setValues(newAllocation);
              Object.entries(newAllocation).forEach(([key, value]) => onChange(key, value));
            }}
          >
            Agresivo
          </button>
          
          <button 
            onClick={() => {
              const newAllocation = { bonds: 0, value: 30, growth: 70 };
              setValues(newAllocation);
              Object.entries(newAllocation).forEach(([key, value]) => onChange(key, value));
            }}
          >
            Máximo Crecimiento
          </button>
        </div>
      </div>
    </div>
  );
};

export default AllocationStepper;
