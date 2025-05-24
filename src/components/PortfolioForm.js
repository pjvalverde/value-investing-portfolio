import React, { useState } from 'react';

const SECTORS = [
  'Tecnología',
  'Salud',
  'Finanzas',
  'Consumo',
  'Energía',
  'Industriales',
  'Materiales',
  'Servicios',
  'Inmobiliario',
  'Utilidades',
  'Telecomunicaciones',
];

const PortfolioForm = ({ onSubmit, loading }) => {
  const [amount, setAmount] = useState('');
  const [horizon, setHorizon] = useState('largo');
  const [includeTBills, setIncludeTBills] = useState(false);
  const [selectedSectors, setSelectedSectors] = useState([]);

  const handleSectorChange = (sector) => {
    setSelectedSectors(prev =>
      prev.includes(sector)
        ? prev.filter(s => s !== sector)
        : [...prev, sector]
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ amount, horizon, includeTBills, sectors: selectedSectors });
  };

  return (
    <form onSubmit={handleSubmit} style={{ marginBottom: 32, padding: 16, background: '#f8f9fa', borderRadius: 8 }}>
      <h2>Tu Portafolio Personalizado</h2>
      <div style={{ marginBottom: 16 }}>
        <label style={{ fontWeight: 'bold' }}>¿En qué áreas te gustaría invertir?</label><br />
        {SECTORS.map(sector => (
          <label key={sector} style={{ marginRight: 12 }}>
            <input
              type="checkbox"
              checked={selectedSectors.includes(sector)}
              onChange={() => handleSectorChange(sector)}
            /> {sector}
          </label>
        ))}
      </div>
      <div style={{ marginBottom: 16 }}>
        <label style={{ fontWeight: 'bold' }}>Monto a invertir:</label><br />
        <input
          type="number"
          min="100"
          step="100"
          value={amount}
          onChange={e => setAmount(e.target.value)}
          placeholder="$ 5,000"
          required
          style={{ padding: 6, width: 160 }}
        />
      </div>
      <div style={{ marginBottom: 16 }}>
        <label style={{ fontWeight: 'bold' }}>Horizonte:</label><br />
        <label>
          <input type="radio" value="corto" checked={horizon === 'corto'} onChange={() => setHorizon('corto')} /> Corto (&lt;5 años)
        </label>
        <label style={{ marginLeft: 12 }}>
          <input type="radio" value="intermedio" checked={horizon === 'intermedio'} onChange={() => setHorizon('intermedio')} /> Intermedio (5-10 años)
        </label>
        <label style={{ marginLeft: 12 }}>
          <input type="radio" value="largo" checked={horizon === 'largo'} onChange={() => setHorizon('largo')} /> Largo (&gt;10 años)
        </label>
      </div>
      <div style={{ marginBottom: 16 }}>
        <label>
          <input type="checkbox" checked={includeTBills} onChange={e => setIncludeTBills(e.target.checked)} /> Incluir bonos del Tesoro (T-Bill)
        </label>
      </div>
      <button type="submit" disabled={loading} style={{ padding: '8px 24px', fontSize: 16 }}>
        {loading ? 'Generando...' : 'Generar portafolio recomendado'}
      </button>
    </form>
  );
};

export default PortfolioForm;
